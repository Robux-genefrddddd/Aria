<script lang="ts">
	import { getContext } from 'svelte';
	import UserSettingRow from './UserSettingRow.svelte';
	import UserSettingSection from './UserSettingSection.svelte';

	const i18n = getContext('i18n');
</script>

<div id="tab-about" class="flex flex-col h-full justify-between text-sm">
	<h2 class="text-sm font-medium text-gray-900 dark:text-white mb-4">{$i18n.t('About')}</h2>

	<div class="flex-1 min-h-0 overflow-y-auto scrollbar-hover pr-1.5 space-y-4">
		<UserSettingSection title="Aria UI" first>
			<UserSettingRow description="Plateforme & Interface de Développement IA">
				<div slot="label" class="flex flex-col text-xs text-gray-600 dark:text-gray-400">
					<div class="font-semibold text-gray-900 dark:text-white">Aria UI v2.0</div>
					<div>Écosystème Dédié aux Créateurs Roblox</div>
				</div>
			</UserSettingRow>
		</UserSettingSection>

		<UserSettingSection title="Développement & Conception">
			<div class="flex flex-col gap-1 text-xs text-gray-600 dark:text-gray-400">
				<div>Développé par <span class="font-bold text-gray-900 dark:text-white">MrPinPinYT</span></div>
				<div class="text-gray-400 dark:text-gray-500">Tous droits réservés © {new Date().getFullYear()} Aria Studio</div>
			</div>
		</UserSettingSection>
	</div>
</div>
