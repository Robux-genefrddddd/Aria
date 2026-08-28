<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { user } from '$lib/stores';
	import { fade, scale } from 'svelte/transition';

	let notification: { id?: string; title?: string; message?: string; created_at?: number } | null = null;
	let pollInterval: any = null;

	// Slider drag state
	let sliderTrackEl: HTMLDivElement | null = null;
	let sliderHandleEl: HTMLDivElement | null = null;
	let isDragging = false;
	let startX = 0;
	let currentX = 0;
	let maxSlide = 0;
	let confirmed = false;

	const checkNotification = async () => {
		const uid = $user?.id || $user?.uid;
		if (!uid) return;

		try {
			const res = await fetch(
				`https://vostockfr-3b08c-default-rtdb.firebaseio.com/users/${uid}/notification.json`
			);
			if (res.ok) {
				const data = await res.json();
				if (data && data.message) {
					notification = data;
				} else {
					notification = null;
				}
			}
		} catch (e) {}
	};

	const dismissNotification = async () => {
		const uid = $user?.id || $user?.uid;
		notification = null;
		confirmed = false;
		currentX = 0;

		if (uid) {
			try {
				await fetch(
					`https://vostockfr-3b08c-default-rtdb.firebaseio.com/users/${uid}/notification.json`,
					{ method: 'DELETE' }
				);
			} catch (e) {}
		}
	};

	const handlePointerDown = (e: PointerEvent) => {
		if (!sliderTrackEl || confirmed) return;
		isDragging = true;
		startX = e.clientX;
		const trackWidth = sliderTrackEl.offsetWidth;
		const handleWidth = sliderHandleEl ? sliderHandleEl.offsetWidth : 44;
		maxSlide = Math.max(10, trackWidth - handleWidth - 6);
		(e.target as HTMLElement).setPointerCapture(e.pointerId);
	};

	const handlePointerMove = (e: PointerEvent) => {
		if (!isDragging || confirmed) return;
		const delta = e.clientX - startX;
		currentX = Math.max(0, Math.min(delta, maxSlide));

		if (currentX >= maxSlide * 0.88) {
			// Confirmed!
			confirmed = true;
			isDragging = false;
			currentX = maxSlide;
			if (navigator.vibrate) {
				try { navigator.vibrate(20); } catch {}
			}
			setTimeout(() => {
				dismissNotification();
			}, 350);
		}
	};

	const handlePointerUp = (e: PointerEvent) => {
		if (!isDragging) return;
		isDragging = false;
		if (!confirmed) {
			// Snap back smoothly
			currentX = 0;
		}
	};

	onMount(() => {
		checkNotification();
		pollInterval = setInterval(checkNotification, 3500);
	});

	onDestroy(() => {
		if (pollInterval) clearInterval(pollInterval);
	});
</script>

{#if notification}
	<div
		class="fixed inset-0 z-999 flex items-center justify-center bg-black/60 dark:bg-black/75 backdrop-blur-xs p-4"
		transition:fade={{ duration: 150 }}
	>
		<div
			class="w-full max-w-sm bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-2xl shadow-xl text-gray-900 dark:text-gray-100"
			transition:scale={{ duration: 180, start: 0.95 }}
		>
			<!-- Icon Header -->
			<div class="size-10 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 flex items-center justify-center mx-auto mb-3.5">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
				</svg>
			</div>

			<!-- Title & Message -->
			<h3 class="text-sm font-semibold text-center text-gray-900 dark:text-white mb-1.5">
				{notification.title || 'Message de l\'administration'}
			</h3>
			<p class="text-xs text-gray-600 dark:text-gray-300 text-center mb-6 leading-relaxed whitespace-pre-wrap">
				{notification.message}
			</p>

			<!-- Slide to Confirm Track -->
			<div
				bind:this={sliderTrackEl}
				class="relative h-11 w-full rounded-full bg-gray-100 dark:bg-gray-800/80 p-1 flex items-center select-none overflow-hidden border border-gray-200/60 dark:border-gray-700/50"
			>
				<!-- Background progress highlight -->
				<div
					class="absolute left-0 top-0 bottom-0 bg-emerald-500/15 dark:bg-emerald-500/20 rounded-full transition-all duration-75"
					style="width: {currentX + 44}px;"
				></div>

				<!-- Track text label -->
				<div class="absolute inset-0 flex items-center justify-center pointer-events-none text-[11px] font-medium text-gray-500 dark:text-gray-400">
					{#if confirmed}
						<span class="text-emerald-500 font-semibold">Confirmé</span>
					{:else}
						<span>Glisser vers la droite pour continuer &rarr;</span>
					{/if}
				</div>

				<!-- Draggable Handle -->
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<div
					bind:this={sliderHandleEl}
					on:pointerdown={handlePointerDown}
					on:pointermove={handlePointerMove}
					on:pointerup={handlePointerUp}
					on:pointercancel={handlePointerUp}
					class="relative z-10 size-9 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 flex items-center justify-center shadow-sm cursor-grab active:cursor-grabbing transition-transform duration-75 touch-none"
					style="transform: translateX({currentX}px);"
				>
					{#if confirmed}
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-4 text-emerald-400 dark:text-emerald-600">
							<path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clip-rule="evenodd" />
						</svg>
					{:else}
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="size-4">
							<path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
						</svg>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}
