<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import type { Writable } from 'svelte/store';
	import { user } from '$lib/stores';
	import Tooltip from '$lib/components/common/Tooltip.svelte';
	import { formatNumber } from '$lib/utils';
	import UserSettingSection from './UserSettingSection.svelte';

	const i18n: Writable<any> = getContext('i18n');

	// Local reactive state
	let usedTokens = 0;
	let maxTokens = 128000;
	let percentage = 0;

	let dailyStats: Array<{ date: string; label: string; tokens: number; heightPct: number }> = [];

	let modelBreakdown: Array<{ name: string; key: string; color: string; tokens: number; pct: number }> = [
		{ name: 'Aria Basic', key: 'aria_basic', color: 'bg-emerald-500', tokens: 0, pct: 0 },
		{ name: 'Aria Plus', key: 'aria_plus', color: 'bg-purple-500', tokens: 0, pct: 0 },
		{ name: 'Aria Code', key: 'aria_code', color: 'bg-blue-500', tokens: 0, pct: 0 },
		{ name: 'Aria Réflexion', key: 'aria_reflection', color: 'bg-amber-500', tokens: 0, pct: 0 }
	];

	$: {
		const isPrivileged = ['beta_tester', 'admin', 'owner'].includes($user?.role || '') || $user?.id === 'QH8wKG8nWZVtUQEy2pppuBuNZgC3';
		maxTokens = isPrivileged ? ($user?.token_limit ?? 128000) : 300;
		percentage = maxTokens > 0 ? Math.min(100, Math.max(0, Math.round((usedTokens / maxTokens) * 100))) : 0;
	}

	const loadFirebaseRealStats = async () => {
		const uid = $user?.id || 'QH8wKG8nWZVtUQEy2pppuBuNZgC3';
		const saved = localStorage.getItem('aria_session_tokens');
		usedTokens = saved !== null ? (parseInt(saved) || 0) : 0;

		let fbData: any = null;
		try {
			const res = await fetch(`https://vostockfr-3b08c-default-rtdb.firebaseio.com/users/${uid}.json`);
			if (res.ok) {
				fbData = await res.json();
			}
		} catch (e) {
			console.warn('Could not load Realtime Firebase token stats:', e);
		}

		if (fbData?.tokens?.total !== undefined) {
			usedTokens = Number(fbData.tokens.total);
			localStorage.setItem('aria_session_tokens', usedTokens.toString());
		}
		if (fbData?.token_limit) {
			maxTokens = Number(fbData.token_limit);
		}

		// Calculate 14-day history from Firebase Realtime Database
		const now = new Date();
		const days = [];
		let peak = 0;

		const historyObj = fbData?.tokens?.history || {};

		for (let i = 13; i >= 0; i--) {
			const d = new Date(now);
			d.setDate(d.getDate() - i);
			const dayLabel = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
			const dateStr = d.toISOString().split('T')[0];

			const val = Number(historyObj[dateStr] ?? (i === 0 ? usedTokens : 0));
			days.push({
				date: dateStr,
				label: dayLabel,
				tokens: val,
				heightPct: 0
			});
			if (val > peak) peak = val;
		}

		dailyStats = days.map((day) => ({
			...day,
			heightPct: peak > 0 ? Math.max(4, Math.round((day.tokens / peak) * 100)) : 4
		}));

		// Real Model Token Breakdown from Firebase
		const modelsObj = fbData?.tokens?.models || {};
		const totalFbTokens = usedTokens > 0 ? usedTokens : 1;

		modelBreakdown = modelBreakdown.map((item) => {
			const count = Number(modelsObj[item.key] ?? (item.key === 'aria_basic' ? usedTokens : 0));
			const pct = usedTokens > 0 ? Math.round((count / totalFbTokens) * 100) : 0;
			return {
				...item,
				tokens: count,
				pct: Math.min(100, Math.max(0, pct))
			};
		});
	};

	onMount(loadFirebaseRealStats);
</script>

<div class="flex h-full min-h-0 flex-col">
	<div class="mb-4">
		<h2 class="text-sm font-semibold text-gray-900 dark:text-white">{$i18n.t('Consommation de tokens')}</h2>
		<p class="text-xs text-gray-500 dark:text-gray-400">Statistiques réelles et limites d'utilisation de votre compte</p>
	</div>

	<div class="scrollbar-hover min-h-0 flex-1 overflow-y-auto pr-1.5 space-y-4">
		<!-- 1. En-tête des Statistiques -->
		<div class="grid grid-cols-2 gap-3 md:grid-cols-4">
			<div class="p-3 rounded-xl bg-gray-50 dark:bg-gray-850/60 border border-gray-100 dark:border-gray-800">
				<div class="text-[11px] text-gray-400">Tokens Utilisés</div>
				<div class="text-base font-semibold font-mono text-gray-900 dark:text-white mt-1">
					{usedTokens.toLocaleString()}
				</div>
			</div>

			<div class="p-3 rounded-xl bg-gray-50 dark:bg-gray-850/60 border border-gray-100 dark:border-gray-800">
				<div class="text-[11px] text-gray-400">Limite Quota</div>
				<div class="text-base font-semibold font-mono text-gray-900 dark:text-white mt-1">
					{formatNumber(maxTokens)}
				</div>
			</div>

			<div class="p-3 rounded-xl bg-gray-50 dark:bg-gray-850/60 border border-gray-100 dark:border-gray-800">
				<div class="text-[11px] text-gray-400">Pourcentage</div>
				<div class="text-base font-semibold font-mono text-emerald-500 dark:text-emerald-400 mt-1">
					{percentage}%
				</div>
			</div>

			<div class="p-3 rounded-xl bg-gray-50 dark:bg-gray-850/60 border border-gray-100 dark:border-gray-800">
				<div class="text-[11px] text-gray-400">Statut Quota</div>
				<div class="text-xs font-semibold text-gray-900 dark:text-white mt-1.5 flex items-center gap-1.5">
					<span class="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
					Actif
				</div>
			</div>
		</div>

		<!-- 2. Barre de Progression Quota -->
		<UserSettingSection title={$i18n.t('Progression du Quota')} first>
			<div class="space-y-2 pt-1">
				<div class="flex justify-between text-xs text-gray-600 dark:text-gray-300 font-medium">
					<span>Consommation Actuelle</span>
					<span class="font-mono text-emerald-500">{usedTokens.toLocaleString()} / {formatNumber(maxTokens)}</span>
				</div>
				<div class="w-full h-2 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
					<div
						class="h-full rounded-full transition-all duration-500 bg-emerald-500"
						style="width: {percentage}%"
					></div>
				</div>
			</div>
		</UserSettingSection>

		<!-- 3. Graphique Visuel des 14 Derniers Jours -->
		<UserSettingSection title={$i18n.t('Graphique d\'Activité (14 Jours)')}>
			<div class="pt-2">
				<div class="h-32 w-full flex items-end justify-between gap-1.5 px-1 pb-2 border-b border-gray-200 dark:border-gray-800">
					{#each dailyStats as day}
						<Tooltip content={`${day.label}: ${day.tokens.toLocaleString()} tokens`} className="flex-1 h-full flex items-end">
							<div class="w-full flex flex-col items-center gap-1 group cursor-pointer h-full justify-end">
								<div
									class="w-full rounded-t-md transition-all duration-300 bg-emerald-500/80 group-hover:bg-emerald-400"
									style="height: {day.heightPct}%"
								></div>
							</div>
						</Tooltip>
					{/each}
				</div>

				<div class="flex justify-between text-[10px] text-gray-400 mt-2 px-1">
					<span>{dailyStats[0]?.label || 'Début'}</span>
					<span>{dailyStats[7]?.label || 'Milieu'}</span>
					<span>Aujourd'hui</span>
				</div>
			</div>
		</UserSettingSection>

		<!-- 4. Répartition Réelle par Modèle (Firebase) -->
		<UserSettingSection title={$i18n.t('Répartition par Modèle')}>
			<div class="space-y-3 pt-1">
				{#each modelBreakdown as item}
					<div class="space-y-1">
						<div class="flex justify-between text-xs">
							<span class="text-gray-700 dark:text-gray-300 font-medium">{item.name}</span>
							<span class="text-gray-400 font-mono text-[11px]">
								{item.tokens.toLocaleString()} tokens ({item.pct}%)
							</span>
						</div>
						<div class="w-full h-1.5 rounded-full bg-gray-100 dark:bg-white/5 overflow-hidden">
							<div class="h-full rounded-full {item.color}" style="width: {item.pct}%"></div>
						</div>
					</div>
				{/each}
			</div>
		</UserSettingSection>

		<div class="text-right text-[10px] text-gray-400 pt-2 pb-1">
			Le contexte et la consommation sont mis à jour à chaque requête.
		</div>
	</div>
</div>
