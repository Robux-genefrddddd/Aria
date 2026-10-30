<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { WebsiteProject } from '$lib/services/websiteBuilder/types';
	import { exportToReact, exportToVue, exportToSvelte, generateReactProjectFiles, downloadReactProjectZip } from '$lib/services/websiteBuilder/export';
	import { toast } from 'svelte-sonner';

	export let project: WebsiteProject;

	const dispatch = createEventDispatcher<{
		close: void;
	}>();

	let selectedFramework: 'react-project' | 'react' | 'vue' | 'svelte' = 'react-project';
	let copied = false;
	let downloadingZip = false;

	$: projectFiles = generateReactProjectFiles(project);
	$: selectedFilePath = Object.keys(projectFiles)[0] || '';

	$: generatedCode =
		selectedFramework === 'react-project'
			? (projectFiles[selectedFilePath] || exportToReact(project))
			: selectedFramework === 'react'
				? exportToReact(project)
				: selectedFramework === 'vue'
					? exportToVue(project)
					: exportToSvelte(project);

	$: fileExtension =
		selectedFramework === 'react-project' ? 'zip' : selectedFramework === 'react' ? 'tsx' : selectedFramework === 'vue' ? 'vue' : 'svelte';

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(generatedCode);
			copied = true;
			toast.success('Code copié dans le presse-papier !');
			setTimeout(() => (copied = false), 2000);
		} catch (e) {
			toast.error('Erreur lors de la copie.');
		}
	};

	const handleDownload = async () => {
		if (selectedFramework === 'react-project') {
			downloadingZip = true;
			try {
				const blob = await downloadReactProjectZip(project);
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				const folderName = (project.title || 'portfolio').toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'portfolio';
				a.download = `${folderName}.zip`;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(url);
				toast.success(`Dossier complet "${folderName}.zip" téléchargé avec succès !`);
			} catch (e) {
				console.error(e);
				toast.error('Erreur lors de la création du ZIP.');
			} finally {
				downloadingZip = false;
			}
			return;
		}

		const blob = new Blob([generatedCode], { type: 'text/plain;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${project.title.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'site'}.${fileExtension}`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
		toast.success(`Fichier .${fileExtension} téléchargé avec succès !`);
	};
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
	<div class="w-full max-w-4xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
		<!-- En-tête -->
		<div class="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div class="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
					<svg xmlns="http://www.w3.org/2000/svg" class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
					</svg>
				</div>
				<div>
					<h3 class="text-base font-bold text-gray-900 dark:text-gray-100">
						Exporter le Code Source
					</h3>
					<p class="text-xs text-gray-500 dark:text-gray-400">
						Code prêt pour la production (TypeScript & Tailwind) — Aucun HTML brut
					</p>
				</div>
			</div>

			<button
				type="button"
				class="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
				on:click={() => dispatch('close')}
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
				</svg>
			</button>
		</div>

		<!-- Sélecteur de Frameworks & Dossier Complet -->
		<div class="px-5 py-3 bg-gray-50 dark:bg-gray-850/60 border-b border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3">
			<div class="flex items-center gap-1.5 bg-gray-200/70 dark:bg-gray-800 p-1 rounded-xl text-xs">
				<button
					type="button"
					class="px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 {selectedFramework === 'react-project' ? 'bg-blue-600 text-white shadow-xs font-semibold' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'}"
					on:click={() => (selectedFramework = 'react-project')}
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/>
					</svg>
					<span>Projet React Entier (.ZIP)</span>
				</button>
				<button
					type="button"
					class="px-3 py-1.5 rounded-lg font-medium transition {selectedFramework === 'react' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-xs' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'}"
					on:click={() => (selectedFramework = 'react')}
				>
					Fichier App.tsx seul
				</button>
				<button
					type="button"
					class="px-3 py-1.5 rounded-lg font-medium transition {selectedFramework === 'vue' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-xs' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'}"
					on:click={() => (selectedFramework = 'vue')}
				>
					Vue 3
				</button>
				<button
					type="button"
					class="px-3 py-1.5 rounded-lg font-medium transition {selectedFramework === 'svelte' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-xs' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'}"
					on:click={() => (selectedFramework = 'svelte')}
				>
					Svelte 5
				</button>
			</div>

			<div class="flex items-center gap-2">
				<button
					type="button"
					class="px-3 py-1.5 text-xs font-medium rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-750 transition flex items-center gap-1.5 cursor-pointer"
					on:click={handleCopy}
				>
					{#if copied}
						<span class="text-emerald-500 font-bold">✓ Copié</span>
					{:else}
						<svg xmlns="http://www.w3.org/2000/svg" class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
						</svg>
						<span>Copier le fichier</span>
					{/if}
				</button>

				<button
					type="button"
					disabled={downloadingZip}
					class="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
					on:click={handleDownload}
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
					</svg>
					<span>
						{downloadingZip
							? 'Compression...'
							: selectedFramework === 'react-project'
								? 'Télécharger le Dossier Complet (.ZIP)'
								: `Télécharger .${fileExtension}`}
					</span>
				</button>
			</div>
		</div>

		{#if selectedFramework === 'react-project'}
			<!-- Sélecteur de fichiers dans le projet -->
			<div class="px-5 py-2 bg-neutral-900 border-b border-neutral-800 flex items-center gap-2 overflow-x-auto text-xs font-mono">
				<span class="text-neutral-500 text-[11px] font-sans">Fichiers du projet :</span>
				{#each Object.keys(projectFiles) as path}
					<button
						type="button"
						class="px-2.5 py-1 rounded-lg text-xs transition {selectedFilePath === path ? 'bg-zinc-800 text-white font-semibold' : 'text-neutral-400 hover:text-white'}"
						on:click={() => (selectedFilePath = path)}
					>
						{path.split('/').slice(1).join('/') || path}
					</button>
				{/each}
			</div>
		{/if}

		<!-- Zone d'affichage du code avec scroll -->
		<div class="p-4 flex-1 overflow-auto bg-neutral-950 font-mono text-xs text-neutral-300 leading-relaxed scrollbar-thin">
			<pre class="p-2 select-all"><code>{generatedCode}</code></pre>
		</div>

		<!-- Pied de modal informatif -->
		<div class="px-5 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex items-center justify-between text-xs text-gray-500">
			<span>Composants typés avec imports d’icônes Lucide et classes Tailwind.</span>
			<button
				type="button"
				class="text-xs font-medium text-gray-700 dark:text-gray-300 hover:underline"
				on:click={() => dispatch('close')}
			>
				Fermer
			</button>
		</div>
	</div>
</div>
