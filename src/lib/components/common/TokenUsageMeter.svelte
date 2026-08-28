<script lang="ts">
	import { getContext } from 'svelte';
	import { user } from '$lib/stores';
	import Tooltip from '$lib/components/common/Tooltip.svelte';
	import { getRoleTokenLimit, isPrivilegedUser, getTokenWindowKey } from '$lib/utils/ariaModels';

	const i18n = getContext('i18n');

	export let compact = false;
	export let className = '';

	const formatTokenNumber = (num: number) => {
		if (!isFinite(num)) return '∞';
		if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
		if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
		return num.toString();
	};

	$: isInfinite = isPrivilegedUser($user);
	$: maxTokens = getRoleTokenLimit($user);

	$: usedTokens = (() => {
		const history = $user?.tokens?.history;
		if (!history) return 0;
		return Number(history[getTokenWindowKey()] || 0);
	})();

	$: percentage = isInfinite ? 0 : (maxTokens > 0 ? Math.min(100, Math.max(0, Math.round((Math.min(usedTokens, maxTokens) / maxTokens) * 100))) : 0);
</script>

<div class="w-full select-none {className}">
	<Tooltip placement="top" className="w-full">
		<div
			slot="content"
			class="p-2 text-xs bg-gray-900 text-white dark:bg-gray-800 rounded-xl shadow-xl border border-white/10 space-y-1 min-w-[160px]"
		>
			<div class="flex justify-between items-center text-[11px] font-semibold text-gray-300">
				<span>Consommation de tokens</span>
				<span class="text-emerald-400">{percentage}%</span>
			</div>
			<div class="flex justify-between text-[10px] text-gray-400">
				<span>Utilisés :</span>
				<span class="text-white font-mono">{usedTokens.toLocaleString()}</span>
			</div>
			<div class="flex justify-between text-[10px] text-gray-400">
				<span>Limite max :</span>
				<span class="text-white font-mono">{formatTokenNumber(maxTokens)}</span>
			</div>
			<div class="pt-1 mt-1 border-t border-white/10 text-[9px] text-gray-400">
				{isInfinite ? 'Aucune limite — accès illimité.' : 'Quota réinitialisé toutes les heures.'}
			</div>
		</div>

		<div class="group flex flex-col gap-2 px-1.5 py-1.5 transition cursor-pointer w-full">
			<div class="flex items-center justify-between text-xs font-medium text-gray-600 dark:text-gray-300">
				<span class="text-xs font-semibold">Tokens</span>
				<span class="text-[11px] font-mono text-gray-500 dark:text-gray-400">
					{formatTokenNumber(usedTokens)} / {formatTokenNumber(maxTokens)}
				</span>
			</div>

			<!-- Progress Bar -->
			{#if isInfinite}
				<div class="w-full h-1.5 rounded-full bg-emerald-500/30 overflow-hidden">
					<div class="h-full rounded-full bg-emerald-400" style="width: 100%"></div>
				</div>
			{:else}
				<div class="w-full h-1.5 rounded-full bg-gray-200/80 dark:bg-white/10 overflow-hidden">
					<div
						class="h-full rounded-full transition-all duration-500 {percentage >= 90 ? 'bg-red-500' : percentage >= 70 ? 'bg-yellow-500' : 'bg-emerald-500 dark:bg-emerald-400'}"
						style="width: {percentage}%"
					></div>
				</div>
			{/if}
		</div>
	</Tooltip>
</div>
