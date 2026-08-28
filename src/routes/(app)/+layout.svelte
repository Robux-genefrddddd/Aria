<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { onMount, tick, getContext } from 'svelte';
	import { openDB, deleteDB } from 'idb';
	import fileSaver from 'file-saver';
	const { saveAs } = fileSaver;

	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { fade } from 'svelte/transition';

	import { getModels, getToolServersData, getVersionUpdates } from '$lib/apis';
	import { getTools } from '$lib/apis/tools';
	import { getBanners } from '$lib/apis/configs';
	import { getTerminalServers } from '$lib/apis/terminal';
	import { getUserSettings } from '$lib/apis/users';
	import { setTextScale } from '$lib/utils/text-scale';

	import { WEBUI_VERSION, WEBUI_API_BASE_URL } from '$lib/constants';
	import { compareVersion } from '$lib/utils';

	import {
		config,
		user,
		settings,
		theme,
		models,
		knowledge,
		tools,
		functions,
		tags,
		banners,
		showSettings,
		showChangelog,
		temporaryChatEnabled,
		toolServers,
		terminalServers,
		selectedTerminalId,
		showSearch,
		showSidebar,
		showControls,
		mobile,
		chatId,
		chats
	} from '$lib/stores';

	import Sidebar from '$lib/components/layout/Sidebar.svelte';
	import SettingsModal from '$lib/components/chat/SettingsModal.svelte';
	import ChangelogModal from '$lib/components/ChangelogModal.svelte';
	import AccountPending from '$lib/components/layout/Overlay/AccountPending.svelte';
	import UpdateInfoToast from '$lib/components/layout/UpdateInfoToast.svelte';
	import Spinner from '$lib/components/common/Spinner.svelte';
	import { loadKeybindings, matchKeybinding, Shortcut } from '$lib/shortcuts';

	const i18n = getContext('i18n');

	let loaded = false;
	let DB = null;
	let localDBChats = [];

	let version;
	let handledSettingsUrl = '';

	const clearChatInputStorage = () => {
		const chatInputKeys = Object.keys(localStorage).filter((key) => key.startsWith('chat-input'));
		if (chatInputKeys.length > 0) {
			chatInputKeys.forEach((key) => {
				localStorage.removeItem(key);
			});
		}
	};

	const checkLocalDBChats = async () => {
		try {
			// Check if IndexedDB exists
			DB = await openDB('Chats', 1);

			if (!DB) {
				return;
			}

			const chats = await DB.getAllFromIndex('chats', 'timestamp');
			localDBChats = chats.map((item, idx) => chats[chats.length - 1 - idx]);

			if (localDBChats.length === 0) {
				await deleteDB('Chats');
			}
		} catch (error) {
			// IndexedDB Not Found
		}
	};

	const setUserSettings = async (cb?: () => Promise<void>) => {
		const userSettings = await getUserSettings(localStorage.token);

		if (userSettings?.ui) {
			settings.set(userSettings.ui);
			const savedTheme = userSettings.ui.theme || localStorage.getItem('theme');
			if (savedTheme) {
				theme.set(savedTheme);
				localStorage.setItem('theme', savedTheme);
				const themes = ['dark', 'light', 'oled-dark'];
				let themeToApply =
					savedTheme === 'oled-dark' ? 'dark' : savedTheme === 'her' ? 'light' : savedTheme;
				if (savedTheme === 'system') {
					themeToApply = window.matchMedia('(prefers-color-scheme: dark)').matches
						? 'dark'
						: 'light';
				}
				themes
					.filter((e) => e !== themeToApply)
					.forEach((e) => document.documentElement.classList.remove(e));
				themeToApply.split(' ').forEach((cls) => document.documentElement.classList.add(cls));
			}
		}
		loadKeybindings(userSettings?.keybindings);

		setTextScale($settings?.textScale ?? 1);

		if (cb) {
			await cb();
		}
	};

	const setModels = async () => {
		models.set(
			await getModels(
				localStorage.token,
				$config?.features?.enable_direct_connections ? ($settings?.directConnections ?? null) : null
			)
		);
	};

	const setToolServers = async () => {
		let toolServersData = await getToolServersData($settings?.toolServers ?? []);
		toolServersData = toolServersData.filter((data) => {
			if (!data || data.error) {
				toast.error(
					$i18n.t(`Failed to connect to {{URL}} OpenAPI tool server`, {
						URL: data?.url
					})
				);
				return false;
			}
			return true;
		});
		toolServers.set(toolServersData);

		// Inject enabled terminal servers as always-on tool servers
		const enabledTerminals = (($settings as any)?.terminalServers ?? []).filter(
			(s: any) => s.enabled || s.url === $selectedTerminalId
		);

		// Fetch terminal servers the user has access to (for FileNav + terminal_id)
		const systemTerminals = await getTerminalServers(localStorage.token);
		terminalServers.set([
			...(enabledTerminals.length > 0
				? (
						await getToolServersData(
							enabledTerminals.map((t: any) => ({
								url: t.url,
								auth_type: t.auth_type ?? 'bearer',
								key: t.key ?? '',
								path: t.path ?? '/openapi.json',
								config: { enable: true }
							}))
						)
					)
						.filter((data) => {
							if (!data || data.error) {
								toast.error(
									$i18n.t(`Failed to connect to {{URL}} terminal server`, {
										URL: data?.url
									})
								);
								return false;
							}
							return true;
						})
						.map((data, i) => ({
							...data,
							key: enabledTerminals[i]?.key ?? '',
							config: enabledTerminals[i]?.config ?? data?.config ?? {}
						}))
				: []),
			// Store with proxy URL and session key for FileNav file browsing
			...systemTerminals.map((t) => ({
				id: t.id,
				url: `${WEBUI_API_BASE_URL}/terminals/${t.id}`,
				name: t.name,
				key: localStorage.token,
				contexts: t.contexts ?? {},
				config: t.config ?? {}
			}))
		]);
	};

	const setBanners = async () => {
		const bannersData = await getBanners(localStorage.token);
		banners.set(bannersData);
	};

	const setTools = async () => {
		const toolsData = await getTools(localStorage.token);
		tools.set(toolsData);
	};

	const openSettingsFromUrl = async () => {
		const requestedSettings = $page.url.searchParams.get('settings');
		if (!requestedSettings) {
			// Param handled and stripped; allow the same deep link to be
			// handled again later in this session.
			handledSettingsUrl = '';
			return;
		}

		const urlKey = `${$page.url.pathname}${$page.url.search}${$page.url.hash}`;
		if (handledSettingsUrl === urlKey) {
			return;
		}
		handledSettingsUrl = urlKey;

		showSettings.set(
			requestedSettings.startsWith('admin:') && $user?.role !== 'admin'
				? 'general'
				: requestedSettings
		);

		const params = new URLSearchParams($page.url.searchParams);
		params.delete('settings');
		const query = params.toString();
		await goto(`${$page.url.pathname}${query ? `?${query}` : ''}${$page.url.hash}`, {
			replaceState: true,
			noScroll: true,
			keepFocus: true
		});
	};

	const gotoAuth = async () => {
		const currentUrl = `${$page.url.pathname}${$page.url.search}`;
		await goto(`/auth?redirect=${encodeURIComponent(currentUrl)}`);
	};

	const navigateChat = async (direction: -1 | 1) => {
		if (!$chats?.length) return;

		const currentIndex = $chats.findIndex((chat) => chat.id === $chatId);
		const nextChat = currentIndex === -1 ? $chats[0] : $chats[currentIndex + direction];

		if (nextChat) {
			await goto(`/c/${nextChat.id}`);
		}
	};

	import { DEFAULT_SESSION_USER } from '$lib/apis/auths';

	onMount(async () => {
		if (!$user || !['user', 'admin', 'beta_tester', 'owner'].includes($user?.role)) {
			loaded = true;
			return;
		}

		clearChatInputStorage();
		try {
			await Promise.all([
				checkLocalDBChats(),
				setBanners().catch((e) => console.error('Failed to load banners:', e)),
				setTools().catch((e) => console.error('Failed to load tools:', e)),
				setUserSettings(async () => {
					await setModels().catch((e) => console.error('Failed to load models:', e));
				})
			]);
		} catch (e) {
			console.error('Failed to load user settings:', e);
			toast.error($i18n.t('Failed to load Interface settings'));
			return;
		}

		selectedTerminalId.set(localStorage.selectedTerminalId ?? null);

		const loadToolServers = setToolServers().catch((e) => {
			console.error('Failed to load tool servers:', e);
			terminalServers.set([]);
		});
		if (
			$page.url.searchParams.get('q') &&
			($page.url.searchParams.get('submit') ?? 'true') === 'true'
		) {
			await loadToolServers;
		}

		const setupKeyboardShortcuts = () => {
			document.addEventListener('keydown', async (event) => {
				if ($settings?.keyboardShortcuts === false) {
					return;
				}

				const shortcut = matchKeybinding(event);
				if (shortcut === Shortcut.SEARCH) {
					console.log('Shortcut triggered: SEARCH');
					event.preventDefault();
					showSearch.set(!$showSearch);
				} else if (shortcut === Shortcut.NEW_CHAT) {
					console.log('Shortcut triggered: NEW_CHAT');
					event.preventDefault();
					document.getElementById('sidebar-new-chat-button')?.click();
				} else if (shortcut === Shortcut.FOCUS_INPUT) {
					console.log('Shortcut triggered: FOCUS_INPUT');
					event.preventDefault();
					document.getElementById('chat-input')?.focus();
				} else if (shortcut === Shortcut.COPY_LAST_CODE_BLOCK) {
					console.log('Shortcut triggered: COPY_LAST_CODE_BLOCK');
					event.preventDefault();
					[...document.getElementsByClassName('copy-code-button')]?.at(-1)?.click();
				} else if (shortcut === Shortcut.COPY_LAST_RESPONSE) {
					console.log('Shortcut triggered: COPY_LAST_RESPONSE');
					event.preventDefault();
					[...document.getElementsByClassName('copy-response-button')]?.at(-1)?.click();
				} else if (shortcut === Shortcut.TOGGLE_SIDEBAR) {
					console.log('Shortcut triggered: TOGGLE_SIDEBAR');
					event.preventDefault();
					showSidebar.set(!$showSidebar);
				} else if (shortcut === Shortcut.NAVIGATE_CHAT_UP) {
					console.log('Shortcut triggered: NAVIGATE_CHAT_UP');
					event.preventDefault();
					await navigateChat(-1);
				} else if (shortcut === Shortcut.NAVIGATE_CHAT_DOWN) {
					console.log('Shortcut triggered: NAVIGATE_CHAT_DOWN');
					event.preventDefault();
					await navigateChat(1);
				} else if (shortcut === Shortcut.TOGGLE_CONTROLS) {
					console.log('Shortcut triggered: TOGGLE_CONTROLS');
					event.preventDefault();
					showControls.set(!$showControls);
				} else if (shortcut === Shortcut.DELETE_CHAT) {
					console.log('Shortcut triggered: DELETE_CHAT');
					event.preventDefault();
					document.getElementById('delete-chat-button')?.click();
				} else if (shortcut === Shortcut.OPEN_SETTINGS) {
					console.log('Shortcut triggered: OPEN_SETTINGS');
					event.preventDefault();
					showSettings.set(!$showSettings);
				} else if (shortcut === Shortcut.SHOW_SHORTCUTS) {
					console.log('Shortcut triggered: SHOW_SHORTCUTS');
					event.preventDefault();
					showSettings.set('shortcuts');
				} else if (shortcut === Shortcut.CLOSE_MODAL) {
					console.log('Shortcut triggered: CLOSE_MODAL');
					event.preventDefault();
					showSettings.set(false);
				} else if (shortcut === Shortcut.OPEN_MODEL_SELECTOR) {
					console.log('Shortcut triggered: OPEN_MODEL_SELECTOR');
					event.preventDefault();
					document.getElementById('model-selector-model-button')?.click();
				} else if (shortcut === Shortcut.NEW_TEMPORARY_CHAT) {
					console.log('Shortcut triggered: NEW_TEMPORARY_CHAT');
					event.preventDefault();
					if ($user?.role !== 'admin' && $user?.permissions?.chat?.temporary_enforced) {
						temporaryChatEnabled.set(true);
					} else {
						temporaryChatEnabled.set(!$temporaryChatEnabled);
					}
					await goto('/');
					setTimeout(() => {
						document.getElementById('new-chat-button')?.click();
					}, 0);
				} else if (shortcut === Shortcut.GENERATE_MESSAGE_PAIR) {
					console.log('Shortcut triggered: GENERATE_MESSAGE_PAIR');
					event.preventDefault();
					document.getElementById('generate-message-pair-button')?.click();
				} else if (shortcut === Shortcut.ALLOW_TOOL_CALL) {
					const button = [...document.getElementsByClassName('tool-call-allow-button')]
						.reverse()
						.find((el) => !(el as HTMLButtonElement).disabled) as HTMLButtonElement | undefined;
					if (button) {
						console.log('Shortcut triggered: ALLOW_TOOL_CALL');
						event.preventDefault();
						button.click();
					}
				} else if (shortcut === Shortcut.DENY_TOOL_CALL) {
					const button = [...document.getElementsByClassName('tool-call-deny-button')]
						.reverse()
						.find((el) => !(el as HTMLButtonElement).disabled) as HTMLButtonElement | undefined;
					if (button) {
						console.log('Shortcut triggered: DENY_TOOL_CALL');
						event.preventDefault();
						button.click();
					}
				} else if (
					shortcut === Shortcut.REGENERATE_RESPONSE &&
					document.activeElement?.id === 'chat-input'
				) {
					console.log('Shortcut triggered: REGENERATE_RESPONSE');
					event.preventDefault();
					[...document.getElementsByClassName('regenerate-response-button')]?.at(-1)?.click();
				}
			});
		};
		setupKeyboardShortcuts();

		if ($user?.role === 'admin' && ($settings?.showChangelog ?? true)) {
			showChangelog.set($settings?.version !== $config.version);
		}

		if ($user?.role === 'admin' || ($user?.permissions?.chat?.temporary ?? true)) {
			if ($page.url.searchParams.get('temporary-chat') === 'true') {
				temporaryChatEnabled.set(true);
			}

			if ($user?.role !== 'admin' && $user?.permissions?.chat?.temporary_enforced) {
				temporaryChatEnabled.set(true);
			}
		}

		// Check for version updates
		if ($user?.role === 'admin' && $config?.features?.enable_version_update_check) {
			// Check if the user has dismissed the update toast in the last 24 hours
			if (localStorage.dismissedUpdateToast) {
				const dismissedUpdateToast = new Date(Number(localStorage.dismissedUpdateToast));
				const now = new Date();

				if (now - dismissedUpdateToast > 24 * 60 * 60 * 1000) {
					checkForVersionUpdates();
				}
			} else {
				checkForVersionUpdates();
			}
		}
		// Persist showControls: track open/close state separately from saved size
		// chatControlsSize always retains the last width for openPane()
		await showControls.set(!$mobile ? localStorage.showControls === 'true' : false);
		showControls.subscribe((value) => {
			localStorage.showControls = value ? 'true' : 'false';
		});

		// Persist selectedTerminalId across page loads
		selectedTerminalId.subscribe((value) => {
			if (value === null) {
				delete localStorage.selectedTerminalId;
			} else {
				localStorage.selectedTerminalId = value;
			}
		});

		// Live Firebase user role & status instant SSE stream (0ms push)
		let previousRole = $user?.role;
		let unsubscribeUserLive: any = null;
		import('$lib/firebase').then(({ subscribeToUserLive }) => {
			if ($user?.id) {
				unsubscribeUserLive = subscribeToUserLive($user.id, async (fbData: any) => {
					let newRole = fbData?.role ?? (fbData?.banned ? 'banned' : null);
					if ($user?.id === 'QH8wKG8nWZVtUQEy2pppuBuNZgC3' || $user?.email === 'mrpinpinpro@gmail.com') {
						newRole = 'owner';
					}
					if (newRole && newRole !== previousRole) {
						console.log(`Instant 0ms role change detected: ${previousRole} -> ${newRole}`);
						previousRole = newRole;
						const updatedUser = { ...$user, role: newRole };
						if (newRole === 'admin' || newRole === 'owner') {
							updatedUser.permissions = {
								...updatedUser.permissions,
								workspace: { models: true, knowledge: true, prompts: true, tools: true, skills: true },
								chat: { controls: true, file_upload: true, delete: true, edit: true, import: true },
								features: { notes: true, automations: true, calendar: true }
							};
						}
						await user.set(updatedUser);
						localStorage.setItem('aria_user', JSON.stringify(updatedUser));

						const isStaff = newRole === 'admin' || newRole === 'owner';
						const isBetaOrAdmin = newRole === 'beta_tester' || isStaff;

						// If demoted from staff while viewing /admin, kick out immediately
						if (location.pathname.startsWith('/admin') && !isStaff) {
							toast.error($i18n.t('Accès refusé : Vos droits administrateurs ont été révoqués.'));
							location.href = '/';
							return;
						}

						if (newRole === 'banned') {
							toast.error($i18n.t('Votre compte a été banni.'));
						} else if (!isBetaOrAdmin) {
							if ($settings?.models?.some((m) => ['aria-plus', 'aria-code'].includes(m))) {
								settings.set({ ...$settings, models: ['aria-basic'] });
							}
							toast.warning(
								$i18n.t('Votre rôle a été modifié en Utilisateur.')
							);
						} else {
							toast.success(
								$i18n.t(`Accès instantané : Rôle ${newRole === 'owner' ? 'Fondateur' : newRole === 'admin' ? 'Administrateur' : 'Bêta-Testeur'} activé !`)
							);
						}
					}
				});
			}
		});

		await tick();

		loaded = true;
	});

	// `$page.url` must be referenced here: `$:` only tracks variables used in
	// the statement itself, and reads inside openSettingsFromUrl don't count —
	// without it, client-side navigations to `?settings=...` are never handled.
	$: if (loaded && $page.url) {
		void openSettingsFromUrl();
	}

	$: if (loaded && ($user === undefined || $user === null)) {
		void gotoAuth();
	}

	const checkForVersionUpdates = async () => {
		version = await getVersionUpdates(localStorage.token).catch((error) => {
			return {
				current: WEBUI_VERSION,
				latest: WEBUI_VERSION
			};
		});
	};
</script>

<SettingsModal bind:show={$showSettings} />
<ChangelogModal bind:show={$showChangelog} />

{#if version && compareVersion(version.latest, version.current) && ($settings?.showUpdateToast ?? true)}
	<div class=" absolute bottom-8 right-8 z-50" in:fade={{ duration: 100 }}>
		<UpdateInfoToast
			{version}
			on:close={() => {
				localStorage.setItem('dismissedUpdateToast', Date.now().toString());
				version = null;
			}}
		/>
	</div>
{/if}

{#if $user}
	<div class="app relative">
		<div
			class=" text-gray-700 dark:text-gray-100 bg-white dark:bg-gray-900 h-screen max-h-[100dvh] overflow-auto flex flex-row justify-end"
		>
			{#if $user?.role === 'banned'}
				<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/70 backdrop-blur-xs p-4 text-center">
					<div class="max-w-sm w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-2xl shadow-sm text-gray-900 dark:text-gray-100">
						<div class="size-10 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 flex items-center justify-center mx-auto mb-3.5">
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5">
								<path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
							</svg>
						</div>
						<h2 class="text-sm font-semibold text-gray-900 dark:text-white mb-1">Compte suspendu</h2>
						<p class="text-xs text-gray-500 dark:text-gray-400 mb-5 leading-relaxed">
							Votre accès à Aria a été restreint par un administrateur.
						</p>
						<button
							class="w-full py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900 text-xs font-medium transition cursor-pointer"
							on:click={async () => {
								const { logOut } = await import('$lib/firebase');
								await logOut();
								localStorage.clear();
								location.href = '/auth';
							}}
						>
							Se déconnecter
						</button>
					</div>
				</div>
			{:else if !['user', 'admin', 'beta_tester', 'owner'].includes($user?.role)}
				<AccountPending />
			{:else}
				{#if localDBChats.length > 0}
					<div class="fixed w-full h-full flex z-50">
						<div
							class="absolute w-full h-full backdrop-blur-md bg-white/20 dark:bg-gray-900/50 flex justify-center"
						>
							<div class="m-auto pb-44 flex flex-col justify-center">
								<div class="max-w-md">
									<div class="text-center dark:text-white text-2xl font-normal z-50">
										{$i18n.t('Important Update')}<br />
										{$i18n.t('Action Required for Chat Log Storage')}
									</div>

									<div class=" mt-4 text-center text-sm dark:text-gray-200 w-full">
										{$i18n.t(
											"Saving chat logs directly to your browser's storage is no longer supported. Please take a moment to download and delete your chat logs by clicking the button below. Don't worry, you can easily re-import your chat logs to the backend through"
										)}
										<span class="font-normal dark:text-white"
											>{$i18n.t('Settings')} > {$i18n.t('Chats')} > {$i18n.t('Import Chats')}</span
										>. {$i18n.t(
											'This ensures that your valuable conversations are securely saved to your backend database. Thank you!'
										)}
									</div>

									<div class=" mt-6 mx-auto relative group w-fit">
										<button
											class="relative z-20 flex px-5 py-2 rounded-full bg-white border border-gray-100 dark:border-none hover:bg-gray-100 transition font-normal text-sm"
											on:click={async () => {
												let blob = new Blob([JSON.stringify(localDBChats)], {
													type: 'application/json'
												});
												saveAs(blob, `chat-export-${Date.now()}.json`);

												const tx = DB.transaction('chats', 'readwrite');
												await Promise.all([tx.store.clear(), tx.done]);
												await deleteDB('Chats');

												localDBChats = [];
											}}
										>
											{$i18n.t('Download & Delete')}
										</button>

										<button
											class="text-xs text-center w-full mt-2 text-gray-400 underline"
											on:click={async () => {
												localDBChats = [];
											}}>{$i18n.t('Close')}</button
										>
									</div>
								</div>
							</div>
						</div>
					</div>
				{/if}

				<Sidebar />

				{#if loaded}
					<main id="main-content" class="contents">
						<slot />
					</main>
				{:else}
					<div
						class="w-full flex-1 h-full flex items-center justify-center {$showSidebar
							? '  md:max-w-[calc(100%-var(--sidebar-width))]'
							: ' '}"
					>
						<Spinner className="size-5" />
					</div>
				{/if}
			{/if}
		</div>
	</div>
{/if}

<style>
	:global(.loading) {
		display: inline-block;
		clip-path: inset(0 1ch 0 0);
		animation: l 1s steps(3) infinite;
		letter-spacing: -0.5px;
	}

	@keyframes l {
		to {
			clip-path: inset(0 -1ch 0 0);
		}
	}

	:global(pre[class*='language-']) {
		position: relative;
		overflow: auto;

		/* make space  */
		margin: 0.3125rem 0;
		padding: 1.75rem 0 1.75rem 1rem;
		border-radius: 0.625rem;
	}

	:global(pre[class*='language-'] button) {
		position: absolute;
		top: 0.3125rem;
		right: 0.3125rem;

		font-size: 0.9rem;
		padding: 0.15rem;
		background-color: #828282;

		border: ridge 1px #7b7b7c;
		border-radius: 0.3125rem;
		text-shadow: #c4c4c4 0 0 2px;
	}

	:global(pre[class*='language-'] button:hover) {
		cursor: pointer;
		background-color: #bcbabb;
	}
</style>
