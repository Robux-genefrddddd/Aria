<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { WebsiteElementTarget } from '$lib/services/websiteBuilder/types';

	export let target: WebsiteElementTarget;
	export let isModifying = false;

	const dispatch = createEventDispatcher<{
		submitInstruction: { instruction: string; target: WebsiteElementTarget };
		close: void;
	}>();

	let promptInput = '';

	const quickSuggestions = [
		'Rendre plus percutant et mémorable',
		'Changer le texte selon mon activité',
		'Ajouter une touche plus minimaliste et sobre',
		'Mettre en avant des chiffres clés'
	];

	const handleSubmit = () => {
		if (!promptInput.trim() || isModifying) return;
		dispatch('submitInstruction', {
			instruction: promptInput.trim(),
			target
		});
		promptInput = '';
	};

	const applySuggestion = (s: string) => {
		promptInput = s;
		handleSubmit();
	};
</script>

<div class="p-4 bg-white dark:bg-gray-900 border-t sm:border-t-0 sm:border-l border-gray-200 dark:border-gray-800 flex flex-col justify-between h-full shadow-lg">
	<div>
		<!-- En-tête de l'élément sélectionné -->
		<div class="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
			<div class="flex items-center gap-2">
				<span class="size-2 rounded-full bg-blue-500 animate-ping"></span>
				<div class="text-xs font-semibold text-gray-900 dark:text-gray-100">
					Élément sélectionné
				</div>
			</div>
			<button
				type="button"
				class="p-1 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
				on:click={() => dispatch('close')}
				title="Fermer"
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
				</svg>
			</button>
		</div>

		<!-- Détail de l'élément -->
		<div class="mt-3 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-850 border border-gray-200/80 dark:border-gray-800">
			<div class="flex items-center justify-between text-[11px] text-gray-500 mb-1">
				<span class="font-medium text-blue-600 dark:text-blue-400">{target.name}</span>
				<span class="font-mono text-[10px] uppercase px-1.5 py-0.2 bg-gray-200/60 dark:bg-gray-800 rounded">{target.tagName}</span>
			</div>
			<div class="text-xs text-gray-800 dark:text-gray-200 line-clamp-3 italic">
				« {target.currentText || 'Contenu actuel'} »
			</div>
		</div>

		<!-- Suggestions rapides en un clic -->
		<div class="mt-4">
			<div class="text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-2">
				Suggestions instantanées :
			</div>
			<div class="flex flex-col gap-1.5">
				{#each quickSuggestions as suggestion}
					<button
						type="button"
						class="text-left text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-850 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition text-[11px]"
						on:click={() => applySuggestion(suggestion)}
					>
						✦ {suggestion}
					</button>
				{/each}
			</div>
		</div>
	</div>

	<!-- Chat prompt interactif avec Aria Code -->
	<div class="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
		<div class="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400 mb-1.5">
			<span class="font-mono text-emerald-500 font-bold">⚡ Aria Code</span>
			<span>modifie directement cet élément</span>
		</div>

		<form on:submit|preventDefault={handleSubmit} class="space-y-2">
			<textarea
				bind:value={promptInput}
				rows="3"
				placeholder="Ex: Rends ce titre plus accrocheur pour une chaîne gaming avec 500k abonnés..."
				class="w-full p-2.5 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 transition resize-none placeholder-gray-400"
			></textarea>

			<div class="flex items-center gap-2">
				<button
					type="submit"
					disabled={!promptInput.trim() || isModifying}
					class="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-xs cursor-pointer"
				>
					{#if isModifying}
						<span class="animate-spin text-sm">⟳</span>
						<span>Application en cours...</span>
					{:else}
						<span>Appliquer la modification</span>
						<svg xmlns="http://www.w3.org/2000/svg" class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
						</svg>
					{/if}
				</button>
			</div>
		</form>
	</div>
</div>
