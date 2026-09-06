<script lang="ts">
	import Tooltip from '$lib/components/common/Tooltip.svelte';
	import { getContext } from 'svelte';

	const i18n = getContext('i18n');

	export let followUps: string[] = [];
	export let onClick: (followUp: string) => void = () => {};
</script>

<div class="mt-3.5 pt-2">
	<div class="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
		<span class="text-amber-500">⚡</span>
		<span>Choisis une option ou réponds directement :</span>
	</div>

	<div class="flex flex-wrap gap-2">
		{#each followUps as followUp, idx (idx)}
			<button
				class="group px-3 py-1.5 text-xs font-medium text-left bg-gray-50 dark:bg-gray-850 hover:bg-amber-500/10 dark:hover:bg-amber-500/20 text-gray-700 dark:text-gray-200 hover:text-amber-700 dark:hover:text-amber-300 border border-gray-200/80 dark:border-gray-800 hover:border-amber-500/50 rounded-xl transition-all duration-150 active:scale-[0.98] shadow-xs cursor-pointer flex items-center gap-2 max-w-full"
				on:click={() => onClick(followUp)}
				type="button"
			>
				<span class="text-gray-400 group-hover:text-amber-500 transition text-[0.7rem]">👉</span>
				<span class="break-words line-clamp-2">{followUp}</span>
			</button>
		{/each}
	</div>
</div>
