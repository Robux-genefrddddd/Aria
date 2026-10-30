<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { extractPaletteFromImage } from '$lib/services/3d/referenceImageAnalyzer';

	export let referenceImage: string | undefined = undefined;
	export let palette: string[] = [];

	const dispatch = createEventDispatcher<{
		imageLoaded: { imageSrc: string; palette: string[] };
		imageRemoved: void;
		paletteUpdated: string[];
	}>();

	let fileInput: HTMLInputElement;
	let isDragging = false;
	let isAnalyzing = false;

	const handleFileSelect = async (file: File) => {
		if (!file || !file.type.startsWith('image/')) return;

		isAnalyzing = true;
		const reader = new FileReader();

		reader.onload = async (e) => {
			const dataUrl = e.target?.result as string;
			referenceImage = dataUrl;

			try {
				const analysis = await extractPaletteFromImage(dataUrl, 6);
				palette = analysis.palette;
				dispatch('imageLoaded', { imageSrc: dataUrl, palette: analysis.palette });
			} catch (err) {
				console.error(err);
			} finally {
				isAnalyzing = false;
			}
		};

		reader.readAsDataURL(file);
	};

	const onDrop = (e: DragEvent) => {
		e.preventDefault();
		isDragging = false;
		if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
			handleFileSelect(e.dataTransfer.files[0]);
		}
	};

	const removeImage = () => {
		referenceImage = undefined;
		palette = [];
		if (fileInput) fileInput.value = '';
		dispatch('imageRemoved');
	};
</script>

<div class="w-full flex flex-col gap-2">
	<span class="text-xs font-medium text-neutral-400 flex items-center justify-between">
		<span>Image de Référence (Optionnel)</span>
		{#if referenceImage}
			<button
				type="button"
				on:click={removeImage}
				class="text-[11px] text-red-400 hover:text-red-300 transition"
			>
				Supprimer
			</button>
		{/if}
	</span>

	<input
		bind:this={fileInput}
		type="file"
		accept="image/*"
		class="hidden"
		on:change={(e) => {
			const target = e.target as HTMLInputElement;
			if (target.files && target.files[0]) handleFileSelect(target.files[0]);
		}}
	/>

	{#if referenceImage}
		<div class="relative w-full rounded-xl overflow-hidden border border-neutral-700/80 bg-neutral-900 p-2 flex items-center gap-3">
			<img
				src={referenceImage}
				alt="Référence"
				class="size-14 rounded-lg object-cover border border-neutral-700 shrink-0"
			/>
			<div class="flex-1 min-w-0">
				<p class="text-xs font-semibold text-neutral-200 truncate">Référence chargée</p>
				<p class="text-[11px] text-neutral-400">Couleurs extraites pour la reproduction :</p>
				<div class="flex items-center gap-1.5 mt-1.5 flex-wrap">
					{#each palette as color}
						<div
							class="size-4 rounded-md border border-white/20 shadow-xs"
							style="background-color: {color};"
							title={color}
						></div>
					{/each}
				</div>
			</div>
		</div>
	{:else}
		<div
			on:dragover|preventDefault={() => (isDragging = true)}
			on:dragleave={() => (isDragging = false)}
			on:drop={onDrop}
			on:click={() => fileInput?.click()}
			on:keydown={(e) => e.key === 'Enter' && fileInput?.click()}
			role="button"
			tabindex="0"
			class="w-full p-4 border-2 border-dashed rounded-xl transition flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center {isDragging
				? 'border-cyan-400 bg-cyan-500/10'
				: 'border-neutral-800 hover:border-neutral-700 bg-neutral-900/60 hover:bg-neutral-900'}"
		>
			{#if isAnalyzing}
				<div class="size-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
				<span class="text-xs text-neutral-400">Analyse de la palette en cours...</span>
			{:else}
				<span class="text-lg">🖼️</span>
				<span class="text-xs text-neutral-300 font-medium">Glissez une image ou cliquez</span>
				<span class="text-[10px] text-neutral-500">L'IA reproduira fidèlement les formes et la palette</span>
			{/if}
		</div>
	{/if}
</div>
