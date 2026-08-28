<script lang="ts">
	import { getContext } from 'svelte';

	const i18n = getContext('i18n');

	import { WEBUI_API_BASE_URL, WEBUI_BASE_URL } from '$lib/constants';
	import { user } from '$lib/stores';
	import { toast } from 'svelte-sonner';

	import Tooltip from '$lib/components/common/Tooltip.svelte';
	import PinSlash from './icons/PinSlash.svelte';

	export let model = null;
	export let shiftKey = false;
	export let onClick = () => {};
	export let onUnpin = () => {};

	let mouseOver = false;

	$: isBeta = ['aria-plus', 'aria-code'].includes(model?.id) || model?.info?.meta?.beta;
	$: userRole = ($user?.role || '').toLowerCase().trim();
	$: hasBetaAccess =
		userRole === 'owner' ||
		userRole === 'admin' ||
		userRole === 'beta_tester' ||
		userRole === 'beta-tester' ||
		userRole === 'tester' ||
		userRole === 'beta';
</script>

{#if model}
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div
		class=" flex justify-center text-gray-800 dark:text-gray-200 cursor-grab relative group"
		data-id={model?.id}
		on:mouseenter={(e) => {
			mouseOver = true;
		}}
		on:mouseleave={(e) => {
			mouseOver = false;
		}}
	>
		<a
			class="grow flex items-center space-x-2 rounded-xl px-2 py-[0.4375rem] group-hover:bg-gray-100 dark:group-hover:bg-gray-900 transition"
			href={isBeta && !hasBetaAccess ? '#' : `/?model=${model?.id}`}
			on:click={(e) => {
				if (isBeta && !hasBetaAccess) {
					e.preventDefault();
					toast.warning(
						$i18n.t('Accès réservé : Ce modèle nécessite le rôle Bêta-Testeur.')
					);
					return;
				}
				onClick();
			}}
			draggable="false"
		>
			<div class="self-center shrink-0">
				<img
					src="/android-chrome-192x192.png"
					class="size-4.5 object-contain rounded-md"
					alt="logo"
					on:error={(e) => {
						e.currentTarget.src = '/android-chrome-192x192.png';
					}}
				/>
			</div>

			<div class="flex self-center translate-y-[0.5px]">
				<div class=" self-center text-[0.8125rem] leading-5 line-clamp-1">
					{model?.name ?? model.id}
				</div>
			</div>
		</a>

		{#if mouseOver && shiftKey && onUnpin}
			<div class="absolute right-5 top-2.5">
				<div class=" flex items-center self-center space-x-1.5">
					<Tooltip content={$i18n.t('Unpin')} className="flex items-center">
						<button
							class=" self-center dark:hover:text-white transition"
							on:click={() => {
								onUnpin();
							}}
							type="button"
						>
							<PinSlash className="size-3.5" strokeWidth="1.5" />
						</button>
					</Tooltip>
				</div>
			</div>
		{/if}
	</div>
{/if}
