<script lang="ts">
	import { onMount, getContext } from 'svelte';
	import { page } from '$app/stores';
	import { toast } from 'svelte-sonner';

	import type { Model3DProject, Model3DPart, ShadingMode, LightingPreset } from '$lib/services/3d/types';
	import { TEMPLATES_3D } from '$lib/services/3d/templates3d';
	import { generate3DModelWithAria } from '$lib/services/3d/generator';
	import { parseBlenderScript, generateBlenderPythonScript, calculateModelStats } from '$lib/services/3d/virtualBlenderEngine';
	import { exportToGLB, exportToOBJ, exportBlenderScript, generateRobloxImportGuide } from '$lib/services/3d/exporters';
	import { generate3DWithRodin, getRodinApiKey, setRodinApiKey, isUsingCustomApiKey } from '$lib/services/3d/rodinService';
	import { generate3DWithModly, checkModlyHealth, getModlyServerUrl, setModlyServerUrl, DEFAULT_MODLY_URL } from '$lib/services/3d/modlyService';
	import { generate3DWithTrellisCloud, generateReferenceImageFromText } from '$lib/services/3d/trellisCloudService';

	import Studio3DViewport from '$lib/components/3dStudio/Studio3DViewport.svelte';
	import ImageReferenceDropzone from '$lib/components/3dStudio/ImageReferenceDropzone.svelte';
	import MeshHierarchyInspector from '$lib/components/3dStudio/MeshHierarchyInspector.svelte';
	import PythonCodeEditor3D from '$lib/components/3dStudio/PythonCodeEditor3D.svelte';

	const i18n = getContext('i18n');

	// Moteurs disponibles (Trellis Cloud 100% autonome par défaut)
	type EngineMode = 'trellis_cloud' | 'virtual_blender' | 'hyper3d' | 'modly';
	let selectedEngine: EngineMode = 'trellis_cloud';

	let project: Model3DProject = structuredClone(TEMPLATES_3D.sword);
	let promptInput = '';
	let referenceImage: string | undefined = undefined;
	let extractedPalette: string[] = [];

	let activeModelUrl: string | null = null;
	let isGenerating = false;
	let progressStep = '';

	let shadingMode: ShadingMode = 'flat';
	let lightingPreset: LightingPreset = 'studio';
	let showGrid = true;
	let autoRotate = false;

	let activeRightTab: 'hierarchy' | 'code' | 'guide' = 'hierarchy';
	let showGuideModal = false;
	let showEngineModal = false;

	// Configuration Modly (optionnel pour les passionnés avec GPU perso)
	let modlyUrl = DEFAULT_MODLY_URL;
	let modlyStatusOk: boolean | null = null;
	let modlyStatusMsg = '';
	let isTestingModly = false;

	// Configuration Hyper3D Rodin
	let rodinApiKey = '';
	let isCustomKey = false;

	let viewportComponent: Studio3DViewport;

	const presetArchetypes = [
		{ id: 'sword', label: 'Épée Royale', icon: '⚔️' },
		{ id: 'car', label: 'Cyber Cruiser', icon: '🏎️' },
		{ id: 'house', label: 'Auberge Médiévale', icon: '🏠' },
		{ id: 'tree', label: 'Arbre Stylisé', icon: '🌲' },
		{ id: 'scifi', label: 'Chasseur Sci-Fi', icon: '🚀' },
		{ id: 'chest', label: 'Coffre RPG', icon: '📦' }
	];

	const creativeBrainstormPrompts = [
		'Un trône de cristal sombre avec cornes démoniaques low-poly',
		'Une moto cyberpunk avec néons holographiques',
		'Une tourelle de défense laser sci-fi pour base spatiale',
		'Un temple antique japonais avec torii et lanternes rouges',
		'Un robot drone compagnon avec antenne et œil bleu néon',
		'Un grimoire magique ouvert flottant avec gemme incrustée'
	];

	onMount(() => {
		modlyUrl = getModlyServerUrl();
		rodinApiKey = getRodinApiKey();
		isCustomKey = isUsingCustomApiKey();

		// Modèle GLB passé en URL
		const modelParam = $page.url.searchParams.get('model');
		if (modelParam) {
			activeModelUrl = decodeURIComponent(modelParam);
			toast.info('Modèle 3D .GLB chargé dans le viewport !');
		}

		// Script Blender passé en paramètre URL
		const codeParam = $page.url.searchParams.get('code');
		if (codeParam) {
			try {
				const decoded = decodeURIComponent(codeParam);
				const parts = parseBlenderScript(decoded);
				if (parts.length > 0) {
					project = {
						id: `project_imported_${Date.now()}`,
						title: 'Modèle Importé du Chat',
						description: 'Modèle reconstitué à partir du script Python Blender.',
						category: 'custom',
						pythonCode: decoded,
						parts,
						palette: parts.map((p) => p.color).filter((v, i, a) => a.indexOf(v) === i),
						stats: calculateModelStats(parts),
						createdAt: Date.now()
					};
					activeModelUrl = null;
					toast.success('Modèle 3D chargé depuis le chat !');
				}
			} catch (e) {
				console.error(e);
			}
		}
	});

	const selectPreset = (id: string) => {
		if (TEMPLATES_3D[id]) {
			activeModelUrl = null;
			project = structuredClone(TEMPLATES_3D[id]);
			referenceImage = undefined;
			extractedPalette = project.palette;
			toast.info(`Archétype "${project.title}" chargé.`);
		}
	};

	const triggerBrainstorm = () => {
		const randomPrompt = creativeBrainstormPrompts[Math.floor(Math.random() * creativeBrainstormPrompts.length)];
		promptInput = randomPrompt;
		triggerGeneration(randomPrompt);
	};

	const testModlyConnection = async () => {
		isTestingModly = true;
		modlyStatusMsg = 'Test de connexion vers ' + modlyUrl + '...';
		try {
			const res = await checkModlyHealth(modlyUrl);
			modlyStatusOk = res.ok;
			modlyStatusMsg = res.message;
			if (res.ok) {
				setModlyServerUrl(modlyUrl);
				toast.success(res.message);
			} else {
				toast.error(res.message);
			}
		} finally {
			isTestingModly = false;
		}
	};

	const saveRodinKey = () => {
		setRodinApiKey(rodinApiKey);
		isCustomKey = isUsingCustomApiKey();
		toast.success('Clé API Hyper3D enregistrée avec succès !');
	};

	// Convertir une DataURL base64 en Blob
	const dataURLtoBlob = (dataurl: string): Blob => {
		const arr = dataurl.split(',');
		const mimeMatch = arr[0].match(/:(.*?);/);
		const mime = mimeMatch ? mimeMatch[1] : 'image/png';
		const bstr = atob(arr[1]);
		let n = bstr.length;
		const u8arr = new Uint8Array(n);
		while (n--) {
			u8arr[n] = bstr.charCodeAt(n);
		}
		return new Blob([u8arr], { type: mime });
	};

	const triggerGeneration = async (text: string) => {
		if (!text.trim() && !referenceImage) {
			toast.warning('Veuillez saisir une description ou déposer une image de référence.');
			return;
		}

		isGenerating = true;

		try {
			if (selectedEngine === 'trellis_cloud') {
				// Moteur 1 : Trellis Cloud AI (100% Cloud, NVIDIA A10G, fonctionne 24/7 pour tous les visiteurs)
				let targetImageBlob: Blob;

				if (referenceImage) {
					targetImageBlob = dataURLtoBlob(referenceImage);
				} else {
					progressStep = 'Génération de la vue de référence par IA...';
					targetImageBlob = await generateReferenceImageFromText(text.trim());
				}

				progressStep = 'Connexion au cluster GPU Trellis Cloud...';
				const res = await generate3DWithTrellisCloud(targetImageBlob, (step) => {
					progressStep = step;
				});

				activeModelUrl = res.glbUrl;
				project.title = text.trim() || 'Modèle Trellis Cloud 3D';
				toast.success('Modèle 3D haute fidélité généré en direct par le Cloud !');
			} else if (selectedEngine === 'modly') {
				// Moteur 2 : Modly (GPU Local personnel)
				if (!referenceImage) {
					toast.error('Le moteur Modly nécessite une image de référence pour générer le maillage 3D.');
					isGenerating = false;
					return;
				}
				progressStep = 'Connexion au serveur Modly...';
				const imageBlob = dataURLtoBlob(referenceImage);
				const res = await generate3DWithModly(imageBlob, {
					serverUrl: modlyUrl,
					onProgress: (step) => {
						progressStep = step;
					}
				});
				activeModelUrl = res.glbUrl;
				project.title = text.trim() || 'Modèle Généré par Modly';
				toast.success('Modèle 3D généré avec succès par Modly !');
			} else if (selectedEngine === 'hyper3d') {
				// Moteur 3 : Hyper3D Rodin (Cloud AI)
				progressStep = 'Initialisation de Hyper3D Rodin AI...';
				const imageBlob = referenceImage ? dataURLtoBlob(referenceImage) : undefined;
				const res = await generate3DWithRodin(
					text.trim(),
					imageBlob ? [imageBlob] : undefined,
					(step) => {
						progressStep = step;
					},
					{},
					rodinApiKey
				);
				activeModelUrl = res.glbUrl;
				project.title = text.trim() || 'Modèle Généré par Hyper3D Rodin';
				toast.success('Modèle 3D PBR généré par Hyper3D Rodin !');
			} else {
				// Moteur 4 : Virtuel Low-Poly Blender (Instantané in-browser)
				progressStep = 'Initialisation du moteur Aria 3D Studio...';
				const result = await generate3DModelWithAria(
					text.trim(),
					referenceImage,
					extractedPalette,
					(step) => {
						progressStep = step;
					}
				);
				activeModelUrl = null;
				project = result;
				toast.success(`Modèle "${project.title}" généré avec succès !`);
			}
		} catch (error: any) {
			console.error(error);
			const errMsg = error?.message || 'Erreur lors de la génération 3D.';
			toast.error(errMsg);
		} finally {
			isGenerating = false;
			progressStep = '';
		}
	};

	const handleExportGLB = async () => {
		const cleanName = project.title.toLowerCase().replace(/[^a-z0-9_]/g, '_');

		if (activeModelUrl) {
			const a = document.createElement('a');
			a.href = activeModelUrl;
			a.download = `${cleanName}.glb`;
			a.target = '_blank';
			a.click();
			toast.success('Téléchargement direct du fichier .GLB pour Roblox Studio !');
			return;
		}

		const obj3d = viewportComponent?.get3DObject();
		if (!obj3d) {
			toast.error('Aucun objet 3D actif.');
			return;
		}
		toast.promise(exportToGLB(obj3d, `${cleanName}.glb`), {
			loading: 'Génération du fichier .GLB pour Roblox Studio...',
			success: 'Modèle .GLB téléchargé avec succès !',
			error: 'Erreur lors de l’export .GLB.'
		});
	};

	const handleExportOBJ = () => {
		const obj3d = viewportComponent?.get3DObject();
		if (!obj3d) return;
		const cleanName = project.title.toLowerCase().replace(/[^a-z0-9_]/g, '_');
		exportToOBJ(obj3d, `${cleanName}.obj`);
		toast.success('Fichier Wavefront .OBJ téléchargé !');
	};

	const handleExportPython = () => {
		const cleanName = project.title.toLowerCase().replace(/[^a-z0-9_]/g, '_');
		exportBlenderScript(project.pythonCode, `${cleanName}_blender.py`);
		toast.success('Script Python Blender (.py) téléchargé !');
	};

	const handleTakeScreenshot = () => {
		const dataUrl = viewportComponent?.takeScreenshot();
		if (dataUrl) {
			const a = document.createElement('a');
			a.href = dataUrl;
			a.download = `${project.title.toLowerCase().replace(/[^a-z0-9_]/g, '_')}_render.png`;
			a.click();
			toast.success('Capture de rendu 3D enregistrée !');
		}
	};

	const handleReRunCode = (e: CustomEvent<string>) => {
		activeModelUrl = null;
		const updatedParts = parseBlenderScript(e.detail);
		if (updatedParts.length > 0) {
			project.parts = updatedParts;
			project.pythonCode = e.detail;
			project.stats = calculateModelStats(updatedParts);
			project = { ...project };
		}
	};

	const handlePartsChanged = (e: CustomEvent<Model3DPart[]>) => {
		activeModelUrl = null;
		project.parts = e.detail;
		project.pythonCode = generateBlenderPythonScript(project.title, project.parts);
		project.stats = calculateModelStats(project.parts);
		project = { ...project };
	};
</script>

<svelte:head>
	<title>Aria 3D Studio — Génération 3D Cloud 24/7 & Roblox</title>
</svelte:head>

<div class="w-full h-full flex flex-col bg-neutral-950 text-neutral-100 overflow-y-auto">
	<!-- Barre Supérieure Header -->
	<header class="w-full px-4 py-3 border-b border-neutral-800 bg-neutral-900/60 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shrink-0">
		<div class="flex items-center gap-3">
			<div class="size-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white font-bold text-lg">
				3D
			</div>
			<div>
				<div class="flex items-center gap-2">
					<h1 class="text-sm font-bold text-white tracking-wide">Aria 3D Studio</h1>
					<span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium">
						☁️ 100% En Ligne 24/7 • GPU Cloud • Roblox MeshPart
					</span>
				</div>
				<p class="text-xs text-neutral-400">Génération de modèles 3D neuronaux (.GLB) et Low-Poly procéduraux autonome pour tous vos visiteurs</p>
			</div>
		</div>

		<!-- Actions d'export & Configuration Moteur -->
		<div class="flex items-center gap-2 flex-wrap">
			<button
				type="button"
				on:click={() => (showEngineModal = true)}
				class="px-3 py-1.5 rounded-xl text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-cyan-400 border border-cyan-500/30 transition flex items-center gap-1.5 shadow-sm"
				title="Configurer les moteurs IA 3D"
			>
				<span>⚙️</span>
				<span>Options Moteurs IA</span>
			</button>

			<button
				type="button"
				on:click={handleTakeScreenshot}
				class="px-3 py-1.5 rounded-xl text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition flex items-center gap-1.5 shadow-sm"
				title="Capture d'écran 3D"
			>
				<span>📸</span>
				<span>Rendu PNG</span>
			</button>

			{#if !activeModelUrl}
				<button
					type="button"
					on:click={handleExportPython}
					class="px-3 py-1.5 rounded-xl text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-amber-300 hover:text-amber-200 transition flex items-center gap-1.5 shadow-sm"
					title="Télécharger le script Python Blender"
				>
					<span>🐍</span>
					<span>Script .py</span>
				</button>

				<button
					type="button"
					on:click={handleExportOBJ}
					class="px-3 py-1.5 rounded-xl text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white transition flex items-center gap-1.5 shadow-sm"
					title="Export Wavefront OBJ standard"
				>
					<span>.OBJ</span>
				</button>
			{/if}

			<button
				type="button"
				on:click={handleExportGLB}
				class="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white transition flex items-center gap-1.5 shadow-lg shadow-cyan-500/25"
				title="Export GLB optimisé Roblox Studio"
			>
				<span>📦</span>
				<span>Télécharger .GLB (Roblox)</span>
			</button>
		</div>
	</header>

	<!-- Barre de sélection rapide d'archétypes -->
	<div class="w-full px-4 py-2 border-b border-neutral-800/80 bg-neutral-900/30 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
		<span class="text-xs text-neutral-500 font-medium shrink-0">Archétypes :</span>
		{#each presetArchetypes as arch}
			<button
				type="button"
				on:click={() => selectPreset(arch.id)}
				class="px-3 py-1 rounded-xl text-xs font-medium transition shrink-0 flex items-center gap-1.5 {project.id === `tpl_${arch.id}` && !activeModelUrl
					? 'bg-neutral-800 text-cyan-400 border border-neutral-700 shadow-xs'
					: 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'}"
			>
				<span>{arch.icon}</span>
				<span>{arch.label}</span>
			</button>
		{/each}
	</div>

	<!-- Grille Principale 3 Colonnes -->
	<div class="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 min-h-0 overflow-y-auto">
		<!-- Colonne Gauche : Création & Référence (4 cols) -->
		<div class="lg:col-span-4 flex flex-col gap-4">
			<!-- Carte Sélection du Moteur de Génération -->
			<div class="p-3 rounded-2xl bg-neutral-900/80 border border-neutral-800 flex flex-col gap-2">
				<div class="flex items-center justify-between">
					<span class="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Moteur de Génération 3D :</span>
					<span class="text-[10px] text-emerald-400 flex items-center gap-1">
						<span class="size-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
						Serveur Cloud Actif
					</span>
				</div>
				<div class="grid grid-cols-2 gap-1.5">
					<button
						type="button"
						on:click={() => (selectedEngine = 'trellis_cloud')}
						class="px-2.5 py-2 rounded-xl text-xs font-medium text-left transition flex flex-col gap-0.5 {selectedEngine === 'trellis_cloud'
							? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm'
							: 'bg-neutral-950/60 text-neutral-400 hover:text-white border border-neutral-800'}"
					>
						<div class="flex items-center gap-1.5">
							<span class="text-sm">☁️</span>
							<span class="font-bold text-xs">Trellis Cloud</span>
						</div>
						<span class="text-[10px] text-emerald-400/90">100% En Ligne • GPU Cloud A10G</span>
					</button>

					<button
						type="button"
						on:click={() => (selectedEngine = 'virtual_blender')}
						class="px-2.5 py-2 rounded-xl text-xs font-medium text-left transition flex flex-col gap-0.5 {selectedEngine === 'virtual_blender'
							? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
							: 'bg-neutral-950/60 text-neutral-400 hover:text-white border border-neutral-800'}"
					>
						<div class="flex items-center gap-1.5">
							<span class="text-sm">🛠️</span>
							<span class="font-bold text-xs">Blender Virtuel</span>
						</div>
						<span class="text-[10px] text-cyan-400/90">Instantané • 0.5s • Zéro Coût</span>
					</button>

					<button
						type="button"
						on:click={() => (selectedEngine = 'hyper3d')}
						class="px-2.5 py-2 rounded-xl text-xs font-medium text-left transition flex flex-col gap-0.5 {selectedEngine === 'hyper3d'
							? 'bg-blue-500/20 text-blue-300 border border-blue-500/50 shadow-sm'
							: 'bg-neutral-950/60 text-neutral-400 hover:text-white border border-neutral-800'}"
					>
						<div class="flex items-center gap-1.5">
							<span class="text-sm">✨</span>
							<span class="font-bold text-xs">Hyper3D Rodin</span>
						</div>
						<span class="text-[10px] text-blue-400/90">API Cloud • PBR</span>
					</button>

					<button
						type="button"
						on:click={() => (selectedEngine = 'modly')}
						class="px-2.5 py-2 rounded-xl text-xs font-medium text-left transition flex flex-col gap-0.5 {selectedEngine === 'modly'
							? 'bg-purple-500/20 text-purple-300 border border-purple-500/50 shadow-sm'
							: 'bg-neutral-950/60 text-neutral-400 hover:text-white border border-neutral-800'}"
					>
						<div class="flex items-center gap-1.5">
							<span class="text-sm">⚡</span>
							<span class="font-bold text-xs">Modly Local</span>
						</div>
						<span class="text-[10px] text-purple-400/90">GPU Perso (Optionnel)</span>
					</button>
				</div>
			</div>

			<!-- Carte Prompt & Co-Design -->
			<div class="p-4 rounded-2xl bg-neutral-900/70 border border-neutral-800 flex flex-col gap-3 shadow-xl">
				<div class="flex items-center justify-between">
					<h2 class="text-xs font-bold uppercase tracking-wider text-neutral-400">Studio Créatif IA</h2>
					<button
						type="button"
						on:click={triggerBrainstorm}
						class="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 transition"
					>
						<span>💡</span>
						<span>Surprends-moi</span>
					</button>
				</div>

				<div class="relative">
					<textarea
						bind:value={promptInput}
						placeholder={selectedEngine === 'trellis_cloud'
							? 'Décrivez votre objet 3D (ex: Une épée cyberpunk avec néons bleus, un kart futuriste, un drone de combat)...'
							: selectedEngine === 'modly'
							? 'Pour Modly : Déposez une image ci-dessous (photo, dessin, concept-art), Modly génèrera le maillage 3D via votre GPU...'
							: 'Décrivez votre modèle 3D low-poly (ex: Une dague magique avec lame en améthyste facettée et garde dorée)...'}
						rows={selectedEngine === 'modly' ? 2 : 4}
						class="w-full p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 placeholder:text-neutral-600 focus:border-cyan-500 outline-hidden resize-none leading-relaxed"
					></textarea>
				</div>

				<!-- Image de référence Dropzone -->
				<div>
					<div class="flex items-center justify-between mb-1.5">
						<span class="text-[11px] text-neutral-400 font-medium">
							Image de référence {selectedEngine === 'modly' ? '(Requise pour Modly)' : '(Optionnelle : photo, croquis, concept)'} :
						</span>
					</div>
					<ImageReferenceDropzone
						bind:referenceImage
						bind:palette={extractedPalette}
						on:imageLoaded={(e) => {
							extractedPalette = e.detail.palette;
							toast.info('Image de référence prête pour la génération 3D !');
						}}
					/>
				</div>

				<!-- Bouton Génération avec état de chargement -->
				<button
					type="button"
					disabled={isGenerating || (!promptInput.trim() && !referenceImage)}
					on:click={() => triggerGeneration(promptInput)}
					class="w-full py-2.5 rounded-xl font-semibold text-xs tracking-wide transition flex items-center justify-center gap-2 shadow-lg {isGenerating || (!promptInput.trim() && !referenceImage)
						? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
						: 'bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600 hover:from-emerald-400 hover:via-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/20 active:scale-[0.98]'}"
				>
					{#if isGenerating}
						<div class="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
						<span>{progressStep || 'Génération 3D en cours...'}</span>
					{:else}
						<span>✨</span>
						<span>
							{selectedEngine === 'trellis_cloud'
								? 'Générer en Direct avec Trellis Cloud 24/7'
								: selectedEngine === 'modly'
								? 'Générer avec Modly AI (GPU Local)'
								: selectedEngine === 'hyper3d'
								? 'Générer avec Hyper3D Rodin'
								: 'Générer le Modèle Low-Poly Instantané'}
						</span>
					{/if}
				</button>
			</div>

			<!-- Informations & Métadonnées du Projet Actif -->
			<div class="p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800 flex flex-col gap-2">
				<h3 class="text-xs font-bold text-white">{project.title}</h3>
				<p class="text-xs text-neutral-400 leading-relaxed">
					{activeModelUrl ? 'Modèle 3D haute fidélité chargé via .GLB cloud (Trellis / Rodin / Modly).' : project.description}
				</p>
				{#if !activeModelUrl && project.palette.length > 0}
					<div class="flex items-center gap-2 mt-2 pt-2 border-t border-neutral-800/80">
						<span class="text-[11px] text-neutral-500">Palette active :</span>
						<div class="flex items-center gap-1.5">
							{#each project.palette as col}
								<div
									class="size-3.5 rounded-md border border-white/20 shadow-xs"
									style="background-color: {col};"
									title={col}
								></div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- Colonne Centrale : Viewport 3D Temps Réel (5 cols) -->
		<div class="lg:col-span-5 flex flex-col min-h-[460px]">
			<Studio3DViewport
				bind:this={viewportComponent}
				parts={project.parts}
				modelUrl={activeModelUrl}
				bind:shadingMode
				bind:lightingPreset
				bind:showGrid
				bind:autoRotate
				stats={project.stats}
			/>
		</div>

		<!-- Colonne Droite : Inspecteur, Script Blender & Guide Roblox (3 cols) -->
		<div class="lg:col-span-3 flex flex-col gap-3 min-h-0">
			<!-- Onglets de la colonne droite -->
			<div class="flex items-center p-1 rounded-xl bg-neutral-900 border border-neutral-800 shrink-0">
				<button
					type="button"
					on:click={() => (activeRightTab = 'hierarchy')}
					class="flex-1 py-1 text-xs rounded-lg font-medium transition {activeRightTab === 'hierarchy'
						? 'bg-neutral-800 text-white shadow-xs'
						: 'text-neutral-400 hover:text-neutral-200'}"
				>
					Pièces
				</button>
				<button
					type="button"
					on:click={() => (activeRightTab = 'code')}
					class="flex-1 py-1 text-xs rounded-lg font-medium transition {activeRightTab === 'code'
						? 'bg-neutral-800 text-white shadow-xs'
						: 'text-neutral-400 hover:text-neutral-200'}"
				>
					Script Python
				</button>
				<button
					type="button"
					on:click={() => (activeRightTab = 'guide')}
					class="flex-1 py-1 text-xs rounded-lg font-medium transition {activeRightTab === 'guide'
						? 'bg-neutral-800 text-white shadow-xs'
						: 'text-neutral-400 hover:text-neutral-200'}"
				>
					Guide Roblox
				</button>
			</div>

			<!-- Contenu selon l'onglet actif -->
			{#if activeRightTab === 'hierarchy'}
				<MeshHierarchyInspector
					parts={project.parts}
					on:partsChanged={handlePartsChanged}
				/>
			{:else if activeRightTab === 'code'}
				<PythonCodeEditor3D
					code={project.pythonCode}
					title={project.title}
					on:reRunCode={handleReRunCode}
				/>
			{:else if activeRightTab === 'guide'}
				<div class="flex-1 p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 flex flex-col gap-3 overflow-y-auto text-xs text-neutral-300">
					<div class="flex items-center gap-2">
						<span class="text-base">🚀</span>
						<h3 class="font-bold text-white">Importer dans Roblox Studio</h3>
					</div>
					<ol class="list-decimal list-inside space-y-2 leading-relaxed text-neutral-300">
						<li>Cliquez sur <strong>Télécharger .GLB (Roblox)</strong> en haut à droite.</li>
						<li>Ouvrez votre place dans <strong>Roblox Studio</strong>.</li>
						<li>Dans l'explorateur, faites un clic droit sur <code>Workspace</code> &gt; <em>Insert Object</em> &gt; <code>MeshPart</code>.</li>
						<li>Dans les propriétés du MeshPart, cliquez sur l'icône de dossier à côté de <code>MeshId</code> et sélectionnez votre fichier .GLB.</li>
						<li>Roblox Studio importe instantanément la géométrie avec sa collision et ses matériaux !</li>
					</ol>
				</div>
			{/if}
		</div>
	</div>
</div>

<!-- Modal Configuration des Moteurs IA -->
{#if showEngineModal}
	<div class="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
		<div class="w-full max-w-xl rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
			<div class="p-4 border-b border-neutral-800 flex items-center justify-between">
				<div class="flex items-center gap-2">
					<span class="text-xl">⚙️</span>
					<h3 class="font-bold text-white text-sm">Architecture & Moteurs IA 3D</h3>
				</div>
				<button
					type="button"
					on:click={() => (showEngineModal = false)}
					class="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
				>
					✕
				</button>
			</div>

			<div class="p-5 flex flex-col gap-5 overflow-y-auto text-xs leading-relaxed">
				<!-- Section 1 : Trellis Cloud -->
				<div class="p-4 rounded-xl bg-neutral-950/80 border border-emerald-500/30 flex flex-col gap-2">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							<span class="text-base">☁️</span>
							<h4 class="font-bold text-emerald-300 text-xs uppercase tracking-wide">Trellis Cloud AI (Recommandé • Actif)</h4>
						</div>
						<span class="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold">
							100% En Ligne 24/7
						</span>
					</div>
					<p class="text-neutral-300">
						Tourne 24h/24 sur un cluster GPU cloud (NVIDIA A10G). Vos visiteurs peuvent générer des modèles 3D complets (.GLB) à tout moment sans que votre PC personnel n'ait besoin d'être allumé.
					</p>
				</div>

				<!-- Section 2 : Blender Virtuel -->
				<div class="p-4 rounded-xl bg-neutral-950/80 border border-cyan-500/30 flex flex-col gap-2">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							<span class="text-base">🛠️</span>
							<h4 class="font-bold text-cyan-300 text-xs uppercase tracking-wide">Aria Blender Virtuel</h4>
						</div>
						<span class="px-2 py-0.5 rounded-full text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold">
							Instantané • 0.5s
						</span>
					</div>
					<p class="text-neutral-300">
						Génère du code Python <code>bpy</code> procédural et construit le maillage Three.js directement dans le navigateur du visiteur. Zéro latence, zéro coût de serveur, idéal pour du low-poly ultra rapide.
					</p>
				</div>

				<!-- Section 3 : Modly Local (Optionnel) -->
				<div class="p-4 rounded-xl bg-neutral-950/80 border border-purple-500/30 flex flex-col gap-3">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							<span class="text-base">⚡</span>
							<h4 class="font-bold text-purple-300 text-xs uppercase tracking-wide">Modly AI (GPU Local de l'Admin)</h4>
						</div>
						<span class="px-2 py-0.5 rounded-full text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/40 font-semibold">
							Optionnel
						</span>
					</div>
					<p class="text-neutral-400">
						Si vous préférez exécuter les calculs sur votre propre carte graphique personnelle en ouvrant un tunnel ngrok vers Vercel.
					</p>
					<div>
						<label for="modly-url-input" class="block text-neutral-300 font-semibold mb-1">URL du Serveur Modly :</label>
						<div class="flex gap-2">
							<input
								id="modly-url-input"
								type="text"
								bind:value={modlyUrl}
								placeholder="http://localhost:8000 ou https://mon-tunnel.ngrok-free.app"
								class="flex-1 p-2 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-white focus:border-purple-400 outline-none"
							/>
							<button
								type="button"
								disabled={isTestingModly}
								on:click={testModlyConnection}
								class="px-3 py-2 rounded-xl font-medium bg-purple-600 hover:bg-purple-500 text-white transition shrink-0"
							>
								{isTestingModly ? 'Test...' : 'Tester'}
							</button>
						</div>
					</div>
					{#if modlyStatusMsg}
						<div class="p-2.5 rounded-lg text-xs {modlyStatusOk ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/10 text-red-300 border border-red-500/30'}">
							{modlyStatusMsg}
						</div>
					{/if}
				</div>

				<!-- Section 4 : Hyper3D Rodin -->
				<div class="p-4 rounded-xl bg-neutral-950/80 border border-blue-500/30 flex flex-col gap-3">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							<span class="text-base">✨</span>
							<h4 class="font-bold text-blue-300 text-xs uppercase tracking-wide">Hyper3D Rodin AI (Cloud)</h4>
						</div>
						<span class="px-2 py-0.5 rounded-full text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/40 font-semibold">
							API Clé Développeur
						</span>
					</div>
					<div>
						<label for="rodin-key-input" class="block text-neutral-300 font-semibold mb-1">Clé API Hyper3D Rodin :</label>
						<div class="flex gap-2">
							<input
								id="rodin-key-input"
								type="password"
								bind:value={rodinApiKey}
								placeholder="vibecoding (démo) ou clé personnelle"
								class="flex-1 p-2 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-white focus:border-blue-400 outline-none"
							/>
							<button
								type="button"
								on:click={saveRodinKey}
								class="px-3 py-2 rounded-xl font-medium bg-blue-600 hover:bg-blue-500 text-white transition shrink-0"
							>
								Enregistrer
							</button>
						</div>
					</div>
				</div>
			</div>

			<div class="p-4 border-t border-neutral-800 flex justify-end">
				<button
					type="button"
					on:click={() => (showEngineModal = false)}
					class="px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-white transition"
				>
					Fermer
				</button>
			</div>
		</div>
	</div>
{/if}
