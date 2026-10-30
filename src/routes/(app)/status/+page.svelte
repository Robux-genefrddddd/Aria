<script lang="ts">
	import Status from '$lib/components/chat/Settings/Status.svelte';
	import { goto } from '$app/navigation';
</script>

<svelte:head>
	<title>Statut du Système | Aria Studio</title>
</svelte:head>

<div class="h-screen w-full flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-y-auto">
	<div class="max-w-4xl w-full mx-auto p-4 sm:p-6 md:p-8 space-y-6">
		<div class="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-800">
			<div class="flex items-center gap-3">
				<button
					type="button"
					class="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
					on:click={() => goto('/')}
					title="Retour au chat"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M19 12H5M12 19l-7-7 7-7"/>
					</svg>
				</button>
				<div>
					<h1 class="text-xl sm:text-2xl font-bold">Statut</h1>
					<p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
						Surveillance en direct
					</p>
				</div>
			</div>

			<a
				href="/"
				class="text-xs px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition font-medium"
			>
				Ouvrir le Chat
			</a>
		</div>

		<div class="p-4 sm:p-6 rounded-2xl bg-gray-50/50 dark:bg-gray-950/50 border border-gray-200 dark:border-gray-800 shadow-sm">
			<Status />
		</div>
	</div>
</div>
