<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { onMount, getContext, createEventDispatcher } from 'svelte';
	const i18n = getContext('i18n');
	const dispatch = createEventDispatcher();

	import {
		artifactCode,
		chatId,
		config,
		settings,
		showArtifacts,
		showControls,
		artifactContents
	} from '$lib/stores';
	import { copyToClipboard, createMessagesList } from '$lib/utils';
	import { injectCsp } from '$lib/utils/csp';

	import XMark from '../icons/XMark.svelte';
	import ArrowsPointingOut from '../icons/ArrowsPointingOut.svelte';
	import Tooltip from '../common/Tooltip.svelte';
	import SvgPanZoom from '../common/SVGPanZoom.svelte';
	import Embedded3DViewer from '$lib/components/3dStudio/Embedded3DViewer.svelte';
	import ArrowLeft from '../icons/ArrowLeft.svelte';
	import Download from '../icons/Download.svelte';
	import ExportModal from '$lib/components/websiteBuilder/ExportModal.svelte';
	import { DEFAULT_TEMPLATES } from '$lib/services/websiteBuilder/templates';

	export let overlay = false;

	let contents: Array<{ type: string; content: string }> = [];
	let selectedContentIdx = 0;

	let copied = false;
	let showExportModal = false;
	let iframeElement: HTMLIFrameElement;

	function navigateContent(direction: 'prev' | 'next') {
		selectedContentIdx =
			direction === 'prev'
				? Math.max(selectedContentIdx - 1, 0)
				: Math.min(selectedContentIdx + 1, contents.length - 1);
	}

	const iframeLoadHandler = () => {
		try {
			const win = iframeElement?.contentWindow;
			if (!win) return;

			win.addEventListener(
				'click',
				function (e: any) {
					try {
						const target = e.target;
						if (target) {
							const text = (target.innerText || target.textContent || '').trim();
							if (text && text.length > 2 && text.length < 80) {
								const tag = target.tagName ? target.tagName.toLowerCase() : 'élément';
								const label = ['h1', 'h2', 'h3'].includes(tag) ? 'titre' : tag === 'button' ? 'bouton' : tag === 'p' ? 'texte' : tag;
								window.dispatchEvent(
									new CustomEvent('website-builder-element-clicked', {
										detail: {
											instruction: `Modifie le ${label} "${text.slice(0, 30)}..." : `
										}
									})
								);
							}
						}

						const linkTarget = e.target?.closest ? e.target.closest('a') : null;
						if (linkTarget) {
							e.preventDefault();
							e.stopPropagation();
							const href = (linkTarget.getAttribute('href') || '').trim();
							if (href.startsWith('#')) {
								const targetId = href.slice(1);
								if (targetId) {
									const doc = iframeElement?.contentDocument;
									const targetElem =
										doc?.getElementById(targetId) ||
										doc?.querySelector(`[name="${targetId}"]`) ||
										doc?.querySelector(`section#${targetId}`) ||
										doc?.querySelector(`[data-section="${targetId}"]`);
									if (targetElem) {
										targetElem.scrollIntoView({ behavior: 'smooth' });
									} else {
										// If section does not exist, look for matching heading or section by text
										const allHeadings = doc?.querySelectorAll('h1, h2, h3, section') || [];
										for (const h of allHeadings) {
											if ((h.textContent || '').toLowerCase().includes(targetId.toLowerCase())) {
												h.scrollIntoView({ behavior: 'smooth' });
												break;
											}
										}
									}
								}
							} else {
								// External or relative page link: keep inside preview without blank navigation
								console.info('Internal preview link handled safely:', href);
							}
						}
					} catch (clickErr) {
						console.debug('Error in preview click handler:', clickErr);
					}
				},
				true
			);

			// Cancel drag when hovering over iframe
			win.addEventListener('mouseenter', function (e) {
				e.preventDefault();
				try {
					win.addEventListener('dragstart', (event) => {
						event.preventDefault();
					});
				} catch (dragErr) {}
			});
		} catch (err) {
			console.debug('Cross-origin sandbox restriction handled safely:', err);
		}
	};

	const showFullScreen = () => {
		if (iframeElement.requestFullscreen) {
			iframeElement.requestFullscreen();
		} else if (iframeElement.webkitRequestFullscreen) {
			iframeElement.webkitRequestFullscreen();
		} else if (iframeElement.msRequestFullscreen) {
			iframeElement.msRequestFullscreen();
		}
	};

	const downloadArtifact = () => {
		showExportModal = true;
	};

	onMount(() => {
		const unsubscribeArtifactCode = artifactCode.subscribe((value) => {
			if (!value) return;
			if (contents && contents.length > 0) {
				const codeIdx = contents.findIndex((content) => content.content.includes(value));
				if (codeIdx !== -1) {
					selectedContentIdx = codeIdx;
					return;
				}
			}
			// Fallback: If not found in current history groups or clicked directly from Preview button
			const isSvg = value.trim().startsWith('<svg');
			const directContent = isSvg
				? { type: 'svg', content: value }
				: {
						type: 'iframe',
						content:
							'<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><script src="https://cdn.tailwindcss.com"><' +
							'/script><link href="https://cdn.jsdelivr.net/npm/daisyui@4.12.14/dist/full.min.css" rel="stylesheet" type="text/css" /><script src="https://unpkg.com/lucide@latest"><' +
							'/script></head><body class="bg-zinc-950 text-zinc-100 min-h-screen">' +
							value +
							'<script>lucide.createIcons();<' +
							'/script></body></html>'
					};
			contents = [directContent];
			selectedContentIdx = 0;
		});

		const unsubscribeArtifactContents = artifactContents.subscribe((value) => {
			const newContents = value ?? [];
			console.log('Artifact contents updated:', newContents);

			if (newContents.length === 0) {
				// Don't close if we already have direct content displayed
				if (contents.length === 0) {
					showControls.set(false);
					showArtifacts.set(false);
					selectedContentIdx = 0;
				}
			} else if (newContents.length > contents.length) {
				selectedContentIdx = newContents.length - 1;
				contents = newContents;
			} else {
				contents = newContents;
			}
		});

		return () => {
			unsubscribeArtifactCode();
			unsubscribeArtifactContents();
		};
	});
</script>

<div
	class=" w-full h-full relative flex flex-col bg-white dark:bg-gray-850"
	id="artifacts-container"
>
	<div class="w-full h-full flex flex-col flex-1 relative">
		{#if contents.length > 0}
			<div
				class="pointer-events-auto z-20 flex justify-between items-center p-2.5 font-primar text-gray-900 dark:text-white"
			>
				<div class="flex-1 flex items-center justify-between pr-1">
					<div class="flex items-center space-x-2">
						<div class="flex items-center gap-0.5 self-center min-w-fit" dir="ltr">
							<button
								aria-label={$i18n.t('Previous version')}
								class="self-center p-1 hover:bg-black/5 dark:hover:bg-white/5 dark:hover:text-white hover:text-black rounded-md transition disabled:cursor-not-allowed"
								on:click={() => navigateContent('prev')}
								disabled={contents.length <= 1}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2.5"
									class="size-3.5"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M15.75 19.5 8.25 12l7.5-7.5"
									/>
								</svg>
							</button>

							<div class="text-xs self-center dark:text-gray-100 min-w-fit">
								{$i18n.t('Version {{selectedVersion}} of {{totalVersions}}', {
									selectedVersion: selectedContentIdx + 1,
									totalVersions: contents.length
								})}
							</div>

							<button
								aria-label={$i18n.t('Next version')}
								class="self-center p-1 hover:bg-black/5 dark:hover:bg-white/5 dark:hover:text-white hover:text-black rounded-md transition disabled:cursor-not-allowed"
								on:click={() => navigateContent('next')}
								disabled={contents.length <= 1}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2.5"
									class="size-3.5"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="m8.25 4.5 7.5 7.5-7.5 7.5"
									/>
								</svg>
							</button>
						</div>
					</div>

					<div class="flex items-center gap-1.5">
						<button
							class="copy-code-button bg-none border-none text-xs bg-gray-50 hover:bg-gray-100 dark:bg-gray-850 dark:hover:bg-gray-800 transition rounded-md px-1.5 py-0.5"
							on:click={() => {
								copyToClipboard(contents[selectedContentIdx].content);
								copied = true;

								setTimeout(() => {
									copied = false;
								}, 2000);
							}}>{copied ? $i18n.t('Copied') : $i18n.t('Copy')}</button
						>

						<button
							type="button"
							class="text-xs bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 transition rounded-md px-2 py-0.5 font-medium flex items-center gap-1 cursor-pointer"
							on:click={() => (showExportModal = true)}
							title="Exporter en React, Vue ou Svelte (zéro HTML)"
						>
							<svg xmlns="http://www.w3.org/2000/svg" class="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
							</svg>
							<span>Exporter</span>
						</button>

						{#if contents[selectedContentIdx].type === '3d'}
							<Embedded3DViewer code={contents[selectedContentIdx].content} height="100%" />
						{:else if contents[selectedContentIdx].type === 'iframe'}
							<Tooltip content={$i18n.t('Open in full screen')}>
								<button
									class=" bg-none border-none text-xs bg-gray-50 hover:bg-gray-100 dark:bg-gray-850 dark:hover:bg-gray-800 transition rounded-md p-0.5"
									on:click={showFullScreen}
								>
									<ArrowsPointingOut className="size-3.5" />
								</button>
							</Tooltip>
						{/if}
					</div>
				</div>

				<button
					class="self-center pointer-events-auto p-1 rounded-full bg-white dark:bg-gray-850"
					on:click={() => {
						dispatch('close');
						showControls.set(false);
						showArtifacts.set(false);
					}}
				>
					<XMark className="size-3.5 text-gray-900 dark:text-white" />
				</button>
			</div>
		{/if}

		{#if overlay}
			<div class=" absolute top-0 left-0 right-0 bottom-0 z-10"></div>
		{/if}

		<div class="flex-1 w-full h-full">
			<div class=" h-full flex flex-col">
				{#if contents.length > 0}
					<div class="max-w-full w-full h-full">
						{#if contents[selectedContentIdx].type === 'iframe'}
							<iframe
								bind:this={iframeElement}
								title="Content"
								srcdoc={injectCsp(
									contents[selectedContentIdx].content,
									$config?.ui?.iframe_csp ?? ''
								)}
								class="w-full border-0 h-full rounded-none"
								sandbox="{($settings?.iframeSandboxAllowScripts ?? true)
									? 'allow-scripts'
									: ''}{($settings?.iframeSandboxAllowDownloads ?? true)
									? ' allow-downloads'
									: ''}{($settings?.iframeSandboxAllowForms ?? true)
									? ' allow-forms'
									: ''} allow-same-origin"
								on:load={iframeLoadHandler}
							></iframe>
						{:else if contents[selectedContentIdx].type === 'svg'}
							<SvgPanZoom
								className=" w-full h-full max-h-full overflow-hidden"
								svg={contents[selectedContentIdx].content}
							/>
						{/if}
					</div>
				{:else}
					<div class="m-auto font-normal text-xs text-gray-900 dark:text-white">
						{$i18n.t('No HTML, CSS, or JavaScript content found.')}
					</div>
				{/if}
			</div>
		</div>
	</div>

	{#if showExportModal}
		<ExportModal
			project={DEFAULT_TEMPLATES.portfolio}
			on:close={() => (showExportModal = false)}
		/>
	{/if}
</div>
