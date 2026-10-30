<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import type { Model3DPart, ShadingMode, Model3DStats } from '$lib/services/3d/types';
	import { parseBlenderScript, calculateModelStats } from '$lib/services/3d/virtualBlenderEngine';
	import { getSemanticFallbackParts } from '$lib/services/3d/archetypeParts';
	import { exportToGLB, exportToOBJ } from '$lib/services/3d/exporters';
	import Studio3DViewport from './Studio3DViewport.svelte';

	export let code: string = '';
	export let modelUrl: string | null = null;
	export let title: string = 'Modèle 3D Low-Poly';
	export let parts: Model3DPart[] = [];
	export let height: string = '380px';
	export let showCodeToggle: boolean = true;

	let internalParts: Model3DPart[] = [];
	let stats: Model3DStats | null = null;
	let shadingMode: ShadingMode = 'flat';
	let showRawCode: boolean = false;
	let viewportComponent: Studio3DViewport;
	let isExporting = false;

	// Détection automatique d'une URL .glb dans le code ou les liens
	$: if (!modelUrl && code && code.includes('.glb')) {
		const glbMatch = code.match(/https?:\/\/[^\s"'<>]+\.glb[^\s"'<>]*/i);
		if (glbMatch) {
			modelUrl = glbMatch[0];
		}
	}

	// Extraire le titre depuis le code si possible
	$: if (code) {
		const lower = code.toLowerCase();
		const titleMatch = code.match(/Modèle\s*:\s*([^\n\r]+)/i) || code.match(/title["']?\s*:\s*["']([^"']+)["']/i);
		if (titleMatch && titleMatch[1]) {
			title = titleMatch[1].trim();
		} else if (lower.includes('épée') || lower.includes('epee') || lower.includes('sword') || lower.includes('lame')) {
			title = 'Épée Royale Low-Poly';
		} else if (lower.includes('voiture') || lower.includes('car') || lower.includes('véhicule')) {
			title = 'Cyber Cruiser Low-Poly';
		} else if (lower.includes('maison') || lower.includes('house') || lower.includes('auberge')) {
			title = 'Auberge Médiévale Low-Poly';
		} else if (lower.includes('arbre') || lower.includes('tree')) {
			title = 'Arbre Stylisé Low-Poly';
		} else if (lower.includes('vaisseau') || lower.includes('ship')) {
			title = 'Chasseur Stellaire Low-Poly';
		} else if (lower.includes('coffre') || lower.includes('chest')) {
			title = 'Coffre RPG Low-Poly';
		}
	}

	$: {
		if (parts && parts.length > 0) {
			internalParts = parts;
		} else if (code) {
			const parsed = parseBlenderScript(code);
			internalParts = parsed.length > 0 ? parsed : getSemanticFallbackParts(code + ' ' + title);
		} else {
			internalParts = getSemanticFallbackParts(title);
		}
		if (!modelUrl) {
			stats = calculateModelStats(internalParts);
		}
	}

	const handleDownloadGLB = async () => {
		if (modelUrl) {
			const a = document.createElement('a');
			a.href = modelUrl;
			a.download = `${title.toLowerCase().replace(/[^a-z0-9_]/g, '_')}.glb`;
			a.target = '_blank';
			a.click();
			toast.success('Téléchargement du fichier .GLB en cours !');
			return;
		}

		const obj3d = viewportComponent?.get3DObject();
		if (!obj3d) {
			toast.error('Génération 3D en cours...');
			return;
		}
		isExporting = true;
		const cleanName = title.toLowerCase().replace(/[^a-z0-9_]/g, '_');
		try {
			await exportToGLB(obj3d, `${cleanName}.glb`);
			toast.success('Fichier .GLB téléchargé ! Prêt pour Roblox Studio MeshPart.');
		} catch (err) {
			toast.error('Erreur lors du téléchargement .GLB');
		} finally {
			isExporting = false;
		}
	};

	const handleDownloadOBJ = () => {
		const obj3d = viewportComponent?.get3DObject();
		if (!obj3d) return;
		const cleanName = title.toLowerCase().replace(/[^a-z0-9_]/g, '_');
		exportToOBJ(obj3d, `${cleanName}.obj`);
		toast.success('Fichier .OBJ téléchargé !');
	};

	const handleOpenInStudio = () => {
		const param = modelUrl ? `model=${encodeURIComponent(modelUrl)}` : `code=${encodeURIComponent(code)}`;
		goto(`/workspace/3d-studio?${param}`);
	};
</script>

<div class="my-3 w-full rounded-2xl border border-neutral-700/80 bg-neutral-950 overflow-hidden shadow-2xl flex flex-col">
	<!-- En-tête de l'éditeur 3D intégré -->
	<div class="px-4 py-2.5 bg-neutral-900 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-2">
		<div class="flex items-center gap-2.5">
			<div class="size-6 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-xs">
				3D
			</div>
			<div>
				<div class="flex items-center gap-2">
					<h3 class="text-xs font-bold text-white tracking-wide">{title}</h3>
					<span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium">
						✔ Prêt pour Roblox
					</span>
				</div>
				<p class="text-[11px] text-neutral-400">Éditeur 3D interactif intégré • {stats?.triangles ?? 0} triangles</p>
			</div>
		</div>

		<!-- Actions de téléchargement immédiat -->
		<div class="flex items-center gap-1.5 flex-wrap">
			<button
				type="button"
				on:click={handleDownloadOBJ}
				class="px-2.5 py-1 text-xs font-medium rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition"
				title="Télécharger au format Wavefront OBJ"
			>
				.OBJ
			</button>

			<button
				type="button"
				disabled={isExporting}
				on:click={handleDownloadGLB}
				class="px-3 py-1 text-xs font-bold rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-md shadow-cyan-500/20 transition flex items-center gap-1.5"
				title="Télécharger le modèle 3D .GLB pour Roblox Studio"
			>
				<span>📦</span>
				<span>Télécharger .GLB (Roblox)</span>
			</button>

			<button
				type="button"
				on:click={handleOpenInStudio}
				class="p-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition"
				title="Agrandir dans le grand Studio 3D"
			>
				<svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
				</svg>
			</button>
		</div>
	</div>

	<!-- Viewport 3D Interactif Three.js -->
	<div class="relative w-full" style="height: {height};">
		<Studio3DViewport
			bind:this={viewportComponent}
			parts={internalParts}
			{modelUrl}
			bind:shadingMode
			lightingPreset="studio"
			showGrid={true}
			autoRotate={true}
			bind:stats
		/>
	</div>

	<!-- Barre inférieure : Instructions simples + Toggle Code Optionnel -->
	<div class="px-4 py-2 bg-neutral-900/90 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400">
		<div class="flex items-center gap-2">
			<span>💡 <em>Faites glisser la souris pour inspecter à 360°, molette pour zoomer.</em></span>
		</div>

		{#if showCodeToggle && code}
			<button
				type="button"
				on:click={() => (showRawCode = !showRawCode)}
				class="text-[11px] text-neutral-400 hover:text-neutral-200 transition underline underline-offset-2"
			>
				{showRawCode ? 'Masquer le code Python Blender' : 'Voir le script Python (bpy)'}
			</button>
		{/if}
	</div>

	<!-- Affichage optionnel du script Python pour les curieux -->
	{#if showRawCode && code}
		<div class="p-3 bg-neutral-950 border-t border-neutral-800 text-xs font-mono text-neutral-300 max-h-48 overflow-y-auto leading-relaxed select-text">
			<pre><code>{code}</code></pre>
		</div>
	{/if}
</div>
