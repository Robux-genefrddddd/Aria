<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Model3DPart } from '$lib/services/3d/types';

	export let parts: Model3DPart[] = [];

	const dispatch = createEventDispatcher<{
		updatePart: { index: number; part: Model3DPart };
		partsChanged: Model3DPart[];
	}>();

	let selectedIndex: number | null = null;

	const toggleVisibility = (idx: number) => {
		parts[idx].visible = parts[idx].visible === false ? true : false;
		parts = [...parts];
		dispatch('partsChanged', parts);
	};

	const onColorChange = (idx: number, newColor: string) => {
		parts[idx].color = newColor;
		parts = [...parts];
		dispatch('partsChanged', parts);
	};
</script>

<div class="w-full flex flex-col gap-2">
	<div class="flex items-center justify-between text-xs text-neutral-400 font-medium px-1">
		<span>Hiérarchie des Pièces ({parts.length})</span>
		<span>Visibilité / Teinte</span>
	</div>

	<div class="flex flex-col gap-1.5 max-h-[300px] overflow-y-auto pr-1">
		{#each parts as part, idx}
			<div
				class="flex items-center justify-between p-2 rounded-xl border transition {selectedIndex === idx
					? 'bg-neutral-800/90 border-cyan-500/50 shadow-sm'
					: 'bg-neutral-900/70 border-neutral-800 hover:border-neutral-700'}"
				on:click={() => (selectedIndex = idx)}
				on:keydown={(e) => e.key === 'Enter' && (selectedIndex = idx)}
				role="button"
				tabindex="0"
			>
				<div class="flex items-center gap-2 min-w-0">
					<!-- Pastille de couleur cliquable avec sélecteur natif -->
					<label class="relative cursor-pointer shrink-0">
						<div
							class="size-5 rounded-md border border-white/20 shadow-xs"
							style="background-color: {part.color};"
						></div>
						<input
							type="color"
							value={part.color}
							on:input={(e) => onColorChange(idx, (e.target as HTMLInputElement).value)}
							class="absolute inset-0 opacity-0 cursor-pointer size-full"
						/>
					</label>

					<div class="flex flex-col min-w-0">
						<span class="text-xs font-semibold text-neutral-200 truncate">{part.name}</span>
						<span class="text-[10px] text-neutral-500 capitalize">{part.type}</span>
					</div>
				</div>

				<!-- Bouton œil pour masquer/afficher -->
				<button
					type="button"
					on:click|stopPropagation={() => toggleVisibility(idx)}
					class="p-1 rounded-lg text-neutral-400 hover:text-white transition"
					title={part.visible !== false ? 'Masquer' : 'Afficher'}
				>
					{#if part.visible !== false}
						<svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
						</svg>
					{:else}
						<svg class="size-4 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
						</svg>
					{/if}
				</button>
			</div>
		{/each}
	</div>
</div>
