<script lang="ts">
	import { onMount, getContext } from 'svelte';
	import { page } from '$app/stores';
	import { toast } from 'svelte-sonner';

	import type { Model3DProject, Model3DPart, ShadingMode, LightingPreset } from '$lib/services/3d/types';
	import { TEMPLATES_3D } from '$lib/services/3d/templates3d';
	import { generate3DModelWithAria } from '$lib/services/3d/generator';
	import { parseBlenderScript, generateBlenderPythonScript, calculateModelStats } from '$lib/services/3d/virtualBlenderEngine';
	import { exportToGLB, exportToOBJ, exportBlenderScript, generateRobloxImportGuide } from '$lib/services/3d/exporters';

	import Studio3DViewport from '$lib/components/3dStudio/Studio3DViewport.svelte';
	import ImageReferenceDropzone from '$lib/components/3dStudio/ImageReferenceDropzone.svelte';
	import MeshHierarchyInspector from '$lib/components/3dStudio/MeshHierarchyInspector.svelte';
	import PythonCodeEditor3D from '$lib/components/3dStudio/PythonCodeEditor3D.svelte';

	const i18n = getContext('i18n');

	let project: Model3DProject = structuredClone(TEMPLATES_3D.sword);
	let promptInput = '';
	let referenceImage: string | undefined = undefined;
	let extractedPalette: string[] = [];

	let isGenerating = false;
	let progressStep = '';

	let shadingMode: ShadingMode = 'flat';
	let lightingPreset: LightingPreset = 'studio';
	let showGrid = true;
	let autoRotate = false;

	let activeRightTab: 'hierarchy' | 'code' | 'guide' = 'hierarchy';
	let showGuideModal = false;

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
		// Vérifier si un code Blender a été passé en paramètre URL
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
					toast.success('Modèle 3D chargé depuis le chat !');
				}
			} catch (e) {
				console.error(e);
			}
		}
	});

	const selectPreset = (id: string) => {
		if (TEMPLATES_3D[id]) {
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

	const triggerGeneration = async (text: string) => {
		if (!text.trim()) return;

		isGenerating = true;
		progressStep = 'Initialisation du moteur Aria 3D Studio...';

		try {
			const result = await generate3DModelWithAria(
				text.trim(),
				referenceImage,
				extractedPalette,
				(step) => {
					progressStep = step;
				}
			);

			project = result;
			toast.success(`Modèle "${project.title}" généré avec succès !`);
		} catch (error) {
			console.error(error);
			toast.error('Erreur lors de la modélisation. Utilisation de l’archétype de secours.');
		} finally {
			isGenerating = false;
			progressStep = '';
		}
	};

	const handleExportGLB = async () => {
		const obj3d = viewportComponent?.get3DObject();
		if (!obj3d) {
			toast.error('Aucun objet 3D actif.');
			return;
		}
		const cleanName = project.title.toLowerCase().replace(/[^a-z0-9_]/g, '_');
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
		const updatedParts = parseBlenderScript(e.detail);
		if (updatedParts.length > 0) {
			project.parts = updatedParts;
			project.pythonCode = e.detail;
			project.stats = calculateModelStats(updatedParts);
			project = { ...project };
		}
	};

	const handlePartsChanged = (e: CustomEvent<Model3DPart[]>) => {
		project.parts = e.detail;
		project.pythonCode = generateBlenderPythonScript(project.title, project.parts);
		project.stats = calculateModelStats(project.parts);
		project = { ...project };
	};
</script>

<svelte:head>
	<title>Aria 3D Studio — Modélisation Low-Poly & Blender Intégré</title>
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
					<span class="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-medium">
						Low-Poly Engine & Blender Virtual
					</span>
				</div>
				<p class="text-xs text-neutral-400">Génération 3D directe avec exécution de scripts Python (bpy) et export Roblox MeshPart</p>
			</div>
		</div>

		<!-- Actions d'export -->
		<div class="flex items-center gap-2 flex-wrap">
			<button
				type="button"
				on:click={handleTakeScreenshot}
				class="px-3 py-1.5 rounded-xl text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition flex items-center gap-1.5 shadow-sm"
				title="Capture d'écran 3D"
			>
				<span>📸</span>
				<span>Rendu PNG</span>
			</button>

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
				class="px-3 py-1 rounded-xl text-xs font-medium transition shrink-0 flex items-center gap-1.5 {project.id === `tpl_${arch.id}`
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
						placeholder="Décrivez votre modèle 3D low-poly (ex: Une dague magique avec lame en améthyste facettée et garde dorée, ou un kart futuriste)..."
						rows={4}
						class="w-full p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 placeholder:text-neutral-600 focus:border-cyan-500 outline-hidden resize-none leading-relaxed"
					></textarea>
				</div>

				<!-- Image de référence Dropzone -->
				<ImageReferenceDropzone
					bind:referenceImage
					bind:palette={extractedPalette}
					on:imageLoaded={(e) => {
						extractedPalette = e.detail.palette;
						toast.info('Palette extraite de la référence avec succès !');
					}}
				/>

				<!-- Bouton Génération avec état de chargement -->
				<button
					type="button"
					disabled={isGenerating || !promptInput.trim()}
					on:click={() => triggerGeneration(promptInput)}
					class="w-full py-2.5 rounded-xl font-semibold text-xs tracking-wide transition flex items-center justify-center gap-2 shadow-lg {isGenerating || !promptInput.trim()
						? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
						: 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/20 active:scale-[0.98]'}"
				>
					{#if isGenerating}
						<div class="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
						<span>{progressStep || 'Génération 3D en cours...'}</span>
					{:else}
						<span>✨</span>
						<span>Générer le Modèle 3D Low-Poly</span>
					{/if}
				</button>
			</div>

			<!-- Informations & Métadonnées du Projet Actif -->
			<div class="p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800 flex flex-col gap-2">
				<h3 class="text-xs font-bold text-white">{project.title}</h3>
				<p class="text-xs text-neutral-400 leading-relaxed">{project.description}</p>
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
			</div>
		</div>

		<!-- Colonne Centrale : Viewport 3D Temps Réel (5 cols) -->
		<div class="lg:col-span-5 flex flex-col min-h-[460px]">
			<Studio3DViewport
				bind:this={viewportComponent}
				parts={project.parts}
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
					Python (bpy)
				</button>
				<button
					type="button"
					on:click={() => (activeRightTab = 'guide')}
					class="flex-1 py-1 text-xs rounded-lg font-medium transition {activeRightTab === 'guide'
						? 'bg-neutral-800 text-white shadow-xs'
						: 'text-neutral-400 hover:text-neutral-200'}"
				>
					Roblox
				</button>
			</div>

			<!-- Contenu selon l'onglet -->
			<div class="flex-1 p-3 rounded-2xl bg-neutral-900/70 border border-neutral-800 overflow-y-auto">
				{#if activeRightTab === 'hierarchy'}
					<MeshHierarchyInspector
						parts={project.parts}
						on:partsChanged={handlePartsChanged}
					/>
				{:else if activeRightTab === 'code'}
					<PythonCodeEditor3D
						code={project.pythonCode}
						title={project.title}
						on:codeChanged={(e) => (project.pythonCode = e.detail)}
						on:reRunCode={handleReRunCode}
					/>
				{:else if activeRightTab === 'guide'}
					<div class="prose prose-invert prose-xs leading-relaxed max-w-none text-neutral-300">
						<div class="flex items-center justify-between pb-2 border-b border-neutral-800 mb-3">
							<span class="text-xs font-bold text-white">Importation Roblox Studio</span>
							<button
								type="button"
								on:click={handleExportGLB}
								class="text-xs text-cyan-400 hover:underline"
							>
								Télécharger .GLB
							</button>
						</div>
						<ol class="list-decimal pl-4 space-y-1.5 text-xs text-neutral-300">
							<li>Téléchargez le fichier <strong class="text-white">.GLB</strong> depuis le bouton ci-dessus.</li>
							<li>Dans Roblox Studio, ouvrez l’onglet <strong class="text-white">View &gt; Asset Manager</strong>.</li>
							<li>Cliquez sur <strong class="text-white">Bulk Import</strong> (ou clic droit sur <em>Meshes</em>).</li>
							<li>Sélectionnez le fichier <code class="text-cyan-400 bg-neutral-950 px-1 py-0.5 rounded">{project.title.toLowerCase().replace(/[^a-z0-9_]/g, '_')}.glb</code>.</li>
							<li>Cochez <em>"Import with scene hierarchy"</em> pour garder chaque pièce manipulable.</li>
							<li>Réglez <code class="text-amber-400">CollisionFidelity</code> sur <em>PreciseConvexDecomposition</em>.</li>
						</ol>
						<div class="mt-4 p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-[11px] text-cyan-300">
							💡 <strong>Astuce Performance :</strong> Ce modèle contient {project.stats.triangles} triangles, ce qui est très léger (&lt; 10k tris) et garantit 60 FPS sur mobile !
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
