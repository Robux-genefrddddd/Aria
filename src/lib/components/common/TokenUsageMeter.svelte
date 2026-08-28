<script lang="ts">
	import { getContext } from 'svelte';
	import { user } from '$lib/stores';
	import Tooltip from '$lib/components/common/Tooltip.svelte';

	const i18n = getContext('i18n');

	export let compact = false;
	export let className = '';

	const formatTokenNumber = (num: number) => {
		if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
		if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
		return num.toString();
	};

	$: isPrivileged = ['beta_tester', 'admin', 'owner'].includes($user?.role || '') || $user?.id === 'QH8wKG8nWZVtUQEy2pppuBuNZgC3';
	$: maxTokens = $user?.token_limit ? Number($user.token_limit) : (isPrivileged ? 128000 : 50000);

	$: usedTokens = (() => {
		const history = $user?.tokens?.history;
		if (!history) return 0;
		const todayStr = new Date().toISOString().split('T')[0];
		return Number(history[todayStr] || 0);
	})();

	$: percentage = maxTokens > 0 ? Math.min(100, Math.max(0, Math.round((Math.min(usedTokens, maxTokens) / maxTokens) * 100))) : 0;
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
				Contexte réinitialisé à chaque nouveau chat.
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
			<div class="w-full h-1.5 rounded-full bg-gray-200/80 dark:bg-white/10 overflow-hidden">
				<div
					class="h-full rounded-full transition-all duration-500 bg-emerald-500 dark:bg-emerald-400"
					style="width: {percentage}%"
				></div>
			</div>
		</div>
	</Tooltip>
</div>
