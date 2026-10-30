<script lang="ts">
	import { onMount, getContext } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';

	import type { WebsiteProject, WebsiteElementTarget } from '$lib/services/websiteBuilder/types';
	import { DEFAULT_TEMPLATES } from '$lib/services/websiteBuilder/templates';
	import { generateWebsiteWithAriaCode, modifyElementWithAriaCode } from '$lib/services/websiteBuilder/generator';
	import LivePreview from '$lib/components/websiteBuilder/LivePreview.svelte';
	import ElementChatDrawer from '$lib/components/websiteBuilder/ElementChatDrawer.svelte';
	import ExportModal from '$lib/components/websiteBuilder/ExportModal.svelte';

	const i18n = getContext('i18n');

	let project: WebsiteProject = structuredClone(DEFAULT_TEMPLATES.portfolio);
	let promptInput = '';
	let isGenerating = false;
	let isModifying = false;
	let progressStep = '';
	let viewport: 'desktop' | 'tablet' | 'mobile' = 'desktop';
	let inspectMode = true;
	let selectedTarget: WebsiteElementTarget | null = null;
	let showExportModal = false;

	const presetKeys = [
		{ id: 'portfolio', label: 'Portfolio Créateur' },
		{ id: 'saas', label: 'SaaS & IA' },
		{ id: 'agency', label: 'Studio Créatif' }
	];

	const triggerGeneration = async (userPrompt: string) => {
		if (!userPrompt.trim()) return;
		isGenerating = true;
		progressStep = 'Initialisation du moteur Aria Code...';
		selectedTarget = null;

		try {
			const result = await generateWebsiteWithAriaCode(userPrompt.trim(), (step) => {
				progressStep = step;
			});
			project = result;
			toast.success('Site généré avec succès avec Aria Code !');
		} catch (err: any) {
			toast.error('Erreur lors de la génération. Utilisation de l’architecture sobre par défaut.');
		} finally {
			isGenerating = false;
			progressStep = '';
		}
	};

	const handleSelectPreset = (presetId: string) => {
		if (DEFAULT_TEMPLATES[presetId]) {
			project = structuredClone(DEFAULT_TEMPLATES[presetId]);
			selectedTarget = null;
			toast.info(`Archétype "${DEFAULT_TEMPLATES[presetId].title}" chargé.`);
		}
	};

	const handleSelectElement = (e: CustomEvent<WebsiteElementTarget>) => {
		selectedTarget = e.detail;
	};

	const handleModifyInstruction = async (
		e: CustomEvent<{ instruction: string; target: WebsiteElementTarget }>
	) => {
		const { instruction, target } = e.detail;
		isModifying = true;

		try {
			project = await modifyElementWithAriaCode(project, target, instruction);
			toast.success(`Élément "${target.name}" mis à jour !`);
			// Actualise la cible sélectionnée avec la nouvelle valeur
			if (selectedTarget && selectedTarget.elementId === target.elementId) {
				selectedTarget = {
					...selectedTarget,
					currentText: instruction
				};
			}
		} catch (err) {
			toast.error('Impossible d’appliquer la modification.');
		} finally {
			isModifying = false;
		}
	};

	onMount(() => {
		// Vérification du prompt initial transmis depuis le Chat ou l'URL
		const urlPrompt = $page.url.searchParams.get('prompt');
		const storedPrompt = sessionStorage.getItem('website_builder_initial_prompt');

		const initialPrompt = urlPrompt || storedPrompt;
		if (initialPrompt) {
			sessionStorage.removeItem('website_builder_initial_prompt');
			promptInput = initialPrompt;
			triggerGeneration(initialPrompt);
		}
	});
</script>

<svelte:head>
	<title>Générateur de site (Beta) | Aria Studio</title>
</svelte:head>

<div class="h-screen w-full flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden">
	<!-- 1. En-tête Supérieur Sobre -->
	<header class="h-14 border-b border-gray-200 dark:border-gray-800 px-3 sm:px-5 flex items-center justify-between shrink-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-30">
		<div class="flex items-center gap-2.5">
			<button
				type="button"
				class="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition cursor-pointer"
				on:click={() => goto('/workspace')}
				title="Retour à l'Espace de travail"
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M19 12H5M12 19l-7-7 7-7"/>
				</svg>
			</button>

			<div class="flex items-center gap-2">
				<span class="font-bold text-sm tracking-tight text-gray-900 dark:text-gray-100">
					Générateur de site
				</span>
				<span class="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold tracking-wider">
					beta
				</span>
			</div>

			<span class="text-gray-300 dark:text-gray-700 hidden sm:inline">•</span>

			<div class="text-xs text-gray-500 truncate max-w-[200px] hidden md:block">
				{project.title}
			</div>
		</div>

		<!-- Contrôles du centre : Sélecteur de Viewport (Desktop / Tablet / Mobile) -->
		<div class="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-0.5 rounded-xl text-xs">
			<button
				type="button"
				class="p-1.5 rounded-lg transition {viewport === 'desktop' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-xs' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'}"
				on:click={() => (viewport = 'desktop')}
				title="Ordinateur (100%)"
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
				</svg>
			</button>
			<button
				type="button"
				class="p-1.5 rounded-lg transition {viewport === 'tablet' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-xs' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'}"
				on:click={() => (viewport = 'tablet')}
				title="Tablette (768px)"
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<rect width="16" height="20" x="4" y="2" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
				</svg>
			</button>
			<button
				type="button"
				class="p-1.5 rounded-lg transition {viewport === 'mobile' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-xs' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'}"
				on:click={() => (viewport = 'mobile')}
				title="Mobile (390px)"
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<rect width="14" height="20" x="5" y="2" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
				</svg>
			</button>
		</div>

		<!-- Actions Droite : Toggle Inspecteur & Export -->
		<div class="flex items-center gap-2">
			<button
				type="button"
				class="px-2.5 py-1.5 text-xs font-medium rounded-xl border border-gray-200 dark:border-gray-700 transition flex items-center gap-1.5 {inspectMode ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50'}"
				on:click={() => (inspectMode = !inspectMode)}
				title="Cliquer sur les éléments du site pour les éditer"
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="12" cy="12" r="10"/><path d="m10 15 5-3-5-3v6z"/>
				</svg>
				<span class="hidden sm:inline">Édition au clic</span>
			</button>

			<button
				type="button"
				class="px-3 py-1.5 text-xs font-semibold rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition flex items-center gap-1.5 shadow-xs cursor-pointer"
				on:click={() => (showExportModal = true)}
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
				</svg>
				<span>Exporter</span>
			</button>
		</div>
	</header>

	<!-- 2. Barre de Prompt Rapide & Choix d'Archétypes -->
	<div class="bg-gray-50 dark:bg-gray-850/40 border-b border-gray-200/80 dark:border-gray-800 px-3 sm:px-5 py-2.5 flex flex-col md:flex-row items-center justify-between gap-3 shrink-0">
		<div class="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
			<span class="text-[11px] font-medium text-gray-400 uppercase tracking-wider shrink-0 mr-1">
				Bases :
			</span>
			{#each presetKeys as p}
				<button
					type="button"
					class="px-2.5 py-1 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition shrink-0"
					on:click={() => handleSelectPreset(p.id)}
				>
					{p.label}
				</button>
			{/each}
		</div>

		<!-- Formulaire de génération par prompt -->
		<form
			on:submit|preventDefault={() => triggerGeneration(promptInput)}
			class="flex items-center gap-2 w-full md:max-w-xl"
		>
			<div class="relative flex-1">
				<input
					type="text"
					bind:value={promptInput}
					placeholder="Ex: Génère-moi un site portfolio pour un créateur de contenu..."
					class="w-full pl-3 pr-8 py-1.5 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition"
				/>
				<span class="absolute right-2.5 top-2 text-[10px] text-gray-400 font-mono">Aria Code</span>
			</div>

			<button
				type="submit"
				disabled={isGenerating || !promptInput.trim()}
				class="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition flex items-center gap-1.5 disabled:opacity-50 shrink-0 cursor-pointer shadow-xs"
			>
				{#if isGenerating}
					<span class="animate-spin text-sm">⟳</span>
					<span>Génération...</span>
				{:else}
					<span>Générer</span>
					<svg xmlns="http://www.w3.org/2000/svg" class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="m5 12 14 0"/><path d="m12 5 7 7-7 7"/>
					</svg>
				{/if}
			</button>
		</form>
	</div>

	<!-- 3. Bannière de progression temps réel lors de la génération -->
	{#if isGenerating}
		<div class="bg-blue-500 text-white px-4 py-2 text-xs flex items-center justify-between animate-pulse">
			<div class="flex items-center gap-2 font-medium">
				<span class="animate-spin text-sm">⟳</span>
				<span>{progressStep}</span>
			</div>
			<span class="text-[10px] font-mono opacity-80">Moteur Aria Code actif</span>
		</div>
	{/if}

	<!-- 4. Espace de Travail Principal : Prévisualisation Directe + Tiroir de Chat Contextuel -->
	<div class="flex-1 flex overflow-hidden relative">
		<!-- Prévisualisation en direct -->
		<div class="flex-1 h-full overflow-hidden">
			<LivePreview
				{project}
				{viewport}
				{inspectMode}
				selectedElementId={selectedTarget?.elementId || null}
				on:selectElement={handleSelectElement}
			/>
		</div>

		<!-- Tiroir de modification contextuelle au clic sur un élément -->
		{#if selectedTarget}
			<div class="w-full sm:w-80 md:w-96 h-full shrink-0 absolute sm:relative right-0 top-0 z-40">
				<ElementChatDrawer
					target={selectedTarget}
					{isModifying}
					on:submitInstruction={handleModifyInstruction}
					on:close={() => (selectedTarget = null)}
				/>
			</div>
		{/if}
	</div>

	<!-- 5. Modal d'Exportation en Code Propre (React, Vue, Svelte) -->
	{#if showExportModal}
		<ExportModal
			{project}
			on:close={() => (showExportModal = false)}
		/>
	{/if}
</div>
