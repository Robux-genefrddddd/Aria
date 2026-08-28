import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type Plugin } from 'vite';

// Suppress noisy svelte-virtual-list missing-exports-condition warning & fix Svelte package exports
const suppressVirtualListWarning: Plugin = {
	name: 'suppress-virtual-list-warning',
	config() {
		return {
			resolve: {
				conditions: ['svelte', 'browser', 'module', 'import', 'default']
			}
		};
	}
};

const MOCK_CONFIG = {
	status: true,
	name: 'Aria',
	version: '0.1.0',
	default_locale: 'fr-FR',
	default_models: '',
	default_pinned_models: '',
	default_prompt_suggestions: [],
	features: {
		auth: true,
		auth_trusted_header: false,
		enable_api_keys: true,
		enable_signup: true,
		enable_login_form: true,
		enable_web_search: false,
		enable_image_generation: false,
		enable_admin_export: true,
		enable_admin_chat_access: true,
		enable_admin_analytics: true,
		enable_community_sharing: false,
		enable_memories: false,
		enable_autocomplete_generation: false,
		enable_direct_connections: true,
		enable_version_update_check: false,
		enable_websocket: false,
		enable_notes: true,
		enable_automations: true,
		enable_calendar: true
	},
	oauth: { providers: {} },
	ui: { default_interface_settings: {} }
};

function mockBackendPlugin(): Plugin {
	return {
		name: 'mock-backend-plugin',
		configureServer(server) {
			server.middlewares.use(async (req, res, next) => {
				const url = req.url || '';
				const method = req.method || 'GET';

				// Ignore WebSockets & socket.io probes cleanly
				if (url.startsWith('/ws') || url.includes('socket.io')) {
					res.statusCode = 200;
					res.end('');
					return;
				}

				if (!url.startsWith('/api') && !url.startsWith('/ollama') && !url.startsWith('/openai')) {
					return next();
				}

				const json = (data: unknown, status = 200) => {
					res.setHeader('Content-Type', 'application/json');
					res.statusCode = status;
					res.end(JSON.stringify(data));
				};

				// Config endpoints
				if (url === '/api/config' || url.includes('/configs')) return json(MOCK_CONFIG);
				if (url.includes('/version') || url.includes('/changelog')) return json({ version: '0.1.0', deployment_id: 'local' });

				// Auth Sign-In / Sign-Up / Sign-Out
				if (url.includes('/auths/signin') || url.includes('/auths/signup') || url.includes('/auths/ldap')) {
					let body = '';
					req.on('data', (chunk) => {
						body += chunk;
					});
					req.on('end', () => {
						let parsed: Record<string, any> = {};
						try {
							parsed = JSON.parse(body);
						} catch {}

						const email = parsed.email || parsed.user || 'admin@aria.local';
						const name = parsed.name || email.split('@')[0] || 'Admin';

						return json({
							id: 'user-' + Date.now(),
							email: email,
							name: name,
							role: 'admin',
							profile_image_url: '/static/user.png',
							token: 'aria-token-' + Date.now(),
							permissions: {
								workspace: { models: true, knowledge: true, prompts: true, tools: true, skills: true },
								chat: { controls: true, file_upload: true, delete: true, edit: true, import: true },
								features: { notes: true, automations: true, calendar: true }
							}
						});
					});
					return;
				}

				if (url.includes('/auths/signout')) {
					return json({ status: true });
				}

				// Session check GET /api/v1/auths or /api/v1/auths/
				if (url === '/api/v1/auths' || url === '/api/v1/auths/' || url.startsWith('/api/v1/auths?')) {
					const authHeader = (req.headers['authorization'] as string) || '';
					const token = authHeader.replace('Bearer ', '').trim();

					if (!token || token === 'undefined' || token === 'null') {
						return json({ detail: 'Not authenticated' }, 401);
					}

					let email = 'user@aria.local';
					let name = 'User';
					let uid = 'local-user-id';
					let role = 'user';

					try {
						const parts = token.split('.');
						if (parts.length === 3) {
							const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
							email = payload.email || email;
							name = payload.name || (email ? email.split('@')[0] : name);
							uid = payload.user_id || payload.sub || uid;
						}
					} catch (e) {}

					if (uid === 'QH8wKG8nWZVtUQEy2pppuBuNZgC3') {
						role = 'admin';
					}

					let profileImageUrl = '/User.avif';

					// Fetch live role and profile image directly from Firebase Realtime Database
					try {
						const fbRes = await fetch(
							`https://keysystem-d0b86-8df89-default-rtdb.europe-west1.firebasedatabase.app/users/${uid}.json`
						);
						if (fbRes.ok) {
							const fbData: any = await fbRes.json();
							if (fbData) {
								if (typeof fbData === 'string') role = fbData;
								else if (fbData.role) role = fbData.role;
								else if (fbData.isAdmin || fbData.admin) role = 'admin';
								if (fbData.name) name = fbData.name;
								if (fbData.profile_image_url) profileImageUrl = fbData.profile_image_url;
							}
						}

						if (role !== 'admin') {
							const roleRes = await fetch(
								`https://keysystem-d0b86-8df89-default-rtdb.europe-west1.firebasedatabase.app/users/${uid}/role.json`
							);
							if (roleRes.ok) {
								const rData: any = await roleRes.json();
								if (typeof rData === 'string') role = rData;
							}
						}
					} catch (e) {}

					return json({
						id: uid,
						email: email,
						name: name,
						role: role,
						profile_image_url: profileImageUrl,
						token: token,
						permissions: {
							workspace: { models: true, knowledge: true, prompts: true, tools: true, skills: true },
							chat: { controls: true, file_upload: true, delete: true, edit: true, import: true },
							features: { notes: true, automations: role === 'admin', calendar: true }
						}
					});
				}

				// Models Profile image -> Always Aria Logo
				if (
					(url.includes('/models') || url.includes('/model')) &&
					url.includes('/profile/image')
				) {
					res.writeHead(302, { Location: '/android-chrome-192x192.png' });
					return res.end();
				}

				// User Profile image -> Firebase User avatar
				if (url.includes('/users/') && url.includes('/profile/image')) {
					try {
						const parts = url.split('/');
						const userIdx = parts.indexOf('users');
						const targetUid =
							userIdx !== -1 && parts[userIdx + 1] && parts[userIdx + 1] !== 'profile'
								? parts[userIdx + 1]
								: 'QH8wKG8nWZVtUQEy2pppuBuNZgC3';

						const fbRes = await fetch(
							`https://keysystem-d0b86-8df89-default-rtdb.europe-west1.firebasedatabase.app/users/${targetUid}.json`
						);
						if (fbRes.ok) {
							const fbData: any = await fbRes.json();
							if (fbData?.profile_image_url && fbData.profile_image_url.startsWith('data:')) {
								const [header, base64Data] = fbData.profile_image_url.split(',');
								const mime = header.split(';')[0].split(':')[1] || 'image/webp';
								const imgBuffer = Buffer.from(base64Data, 'base64');
								res.writeHead(200, {
									'Content-Type': mime,
									'Content-Length': imgBuffer.length,
									'Cache-Control': 'no-cache'
								});
								return res.end(imgBuffer);
							} else if (fbData?.profile_image_url) {
								res.writeHead(302, { Location: fbData.profile_image_url });
								return res.end();
							}
						}
					} catch (e) {}

					res.writeHead(302, { Location: '/User.avif' });
					return res.end();
				}

				// Users endpoints
				if (
					url.startsWith('/api/v1/users/?') ||
					url === '/api/v1/users' ||
					url === '/api/v1/users/' ||
					url.includes('/users/all')
				) {
					let userList = [
						{
							id: 'QH8wKG8nWZVtUQEy2pppuBuNZgC3',
							email: 'contact@pincorpsstudio.site',
							name: 'MrPinPinYT',
							role: 'owner',
							profile_image_url: '/User.avif',
							created_at: Math.floor(Date.now() / 1000) - 86400 * 7,
							last_active_at: Math.floor(Date.now() / 1000),
							updated_at: Math.floor(Date.now() / 1000)
						}
					];

					try {
						const allRes = await fetch(
							`https://keysystem-d0b86-8df89-default-rtdb.europe-west1.firebasedatabase.app/users.json`
						);
						if (allRes.ok) {
							const allData: any = await allRes.json();
							if (allData && typeof allData === 'object') {
								const mapped = Object.keys(allData).map((id) => {
									const u = allData[id] || {};
									return {
										id,
										email: u.email || (id === 'QH8wKG8nWZVtUQEy2pppuBuNZgC3' ? 'contact@pincorpsstudio.site' : 'user@aria.local'),
										name: u.name || (id === 'QH8wKG8nWZVtUQEy2pppuBuNZgC3' ? 'MrPinPinYT' : 'Utilisateur'),
										role: u.role || (id === 'QH8wKG8nWZVtUQEy2pppuBuNZgC3' ? 'owner' : 'user'),
										profile_image_url: u.profile_image_url || '/User.avif',
										created_at: u.created_at || Math.floor(Date.now() / 1000) - 86400 * 7,
										last_active_at: u.updatedAt ? Math.floor(u.updatedAt / 1000) : Math.floor(Date.now() / 1000),
										updated_at: u.updatedAt ? Math.floor(u.updatedAt / 1000) : Math.floor(Date.now() / 1000)
									};
								});
								if (mapped.length > 0) userList = mapped;
							}
						}
					} catch (e) {}

					if (url.includes('/users/all')) return json(userList);
					return json({ users: userList, total: userList.length });
				}
				if (url.includes('/settings/update')) {
					return json({ status: true });
				}
				if (url.includes('/settings')) {
					return json({ ui: {} });
				}
				if (url.includes('/update/timezone') || url.includes('/users/update')) {
					return json({
						id: 'local-user-id',
						email: 'admin@aria.local',
						name: 'Admin',
						role: 'admin',
						profile_image_url: '/User.avif'
					});
				}

				// Admin / Analytics / Evaluations
				if (url.includes('/analytics')) return json({});
				if (url.includes('/evaluations')) return json([]);
				if (url.includes('/banners')) return json([]);
				if (url.includes('/functions')) return json([]);

				// Models & Chat entities
				if (url.includes('/models/model/profile/image') || url.includes('/profile/image')) {
					res.writeHead(302, { Location: '/android-chrome-192x192.png' });
					return res.end();
				}
				if (url.includes('/models')) {
					return json({
						data: [
							{
								id: 'aria-basic',
								name: 'Aria Basic',
								description: 'Modèle polyvalent et réactif pour un usage quotidien.',
								owned_by: 'aria',
								info: { meta: { beta: false } }
							},
							{
								id: 'aria-reflection',
								name: 'Aria Réflexion',
								description: 'Modèle de réflexion approfondie pour la résolution de problèmes.',
								owned_by: 'aria',
								info: { meta: { beta: false } }
							},
							{
								id: 'aria-plus',
								name: 'Aria Plus',
								description: 'Modèle ultra-performant réservé aux Bêta-Testeurs.',
								owned_by: 'aria',
								info: { meta: { beta: true } }
							},
							{
								id: 'aria-code',
								name: 'Aria Code',
								description: 'Modèle expert en programmation, débogage et code (Bêta).',
								owned_by: 'aria',
								info: { meta: { beta: true } }
							}
						]
					});
				}
				if (url.includes('/chat/completions') || url.includes('/chat/completed')) {
					let body = '';
					req.on('data', (chunk) => {
						body += chunk;
					});
					req.on('end', () => {
						let parsed: any = {};
						try {
							parsed = JSON.parse(body);
						} catch {}

						const modelId = parsed.model || 'aria-basic';
						const promptText =
							parsed.messages && parsed.messages.length > 0
								? parsed.messages[parsed.messages.length - 1]?.content || 'Bonjour'
								: 'Bonjour';

						const modelName =
							modelId === 'aria-plus'
								? 'Aria Plus'
								: modelId === 'aria-code'
									? 'Aria Code'
									: modelId === 'aria-reflection'
										? 'Aria Réflexion'
										: 'Aria Basic';

						const responseText = `Bonjour ! Je suis ${modelName}. J'ai bien reçu votre message et je suis prêt à vous aider.`;

						if (parsed.stream !== false) {
							res.writeHead(200, {
								'Content-Type': 'text/event-stream',
								'Cache-Control': 'no-cache',
								Connection: 'keep-alive'
							});

							const words = responseText.split(' ');
							let i = 0;
							const interval = setInterval(() => {
								if (i < words.length) {
									const delta = (i === 0 ? '' : ' ') + words[i];
									res.write(
										`data: ${JSON.stringify({
											id: 'chatcmpl-' + Date.now(),
											object: 'chat.completion.chunk',
											created: Math.floor(Date.now() / 1000),
											model: modelId,
											choices: [{ index: 0, delta: { content: delta }, finish_reason: null }]
										})}\n\n`
									);
									i++;
								} else {
									res.write(
										`data: ${JSON.stringify({
											id: 'chatcmpl-' + Date.now(),
											object: 'chat.completion.chunk',
											created: Math.floor(Date.now() / 1000),
											model: modelId,
											choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
											usage: { prompt_tokens: 12, completion_tokens: 18, total_tokens: 30 }
										})}\n\n`
									);
									res.write('data: [DONE]\n\n');
									clearInterval(interval);
									res.end();
								}
							}, 25);
						} else {
							return json({
								id: 'chatcmpl-' + Date.now(),
								object: 'chat.completion',
								created: Math.floor(Date.now() / 1000),
								model: modelId,
								choices: [
									{
										index: 0,
										message: { role: 'assistant', content: responseText },
										finish_reason: 'stop'
									}
								],
								usage: { prompt_tokens: 12, completion_tokens: 18, total_tokens: 30 }
							});
						}
					});
					return;
				}
				if (url.includes('/chats/config')) return json({});
				if (url.includes('/chats/new') || (url.includes('/chats') && method === 'POST')) {
					return json({
						id: 'chat-' + Date.now(),
						title: 'New Chat',
						chat: { models: [], messages: [] },
						created_at: Date.now(),
						updated_at: Date.now()
					});
				}
				// Channels & Direct Messaging
				if (url.includes('/channels/users/')) {
					const targetUserId = url.split('/channels/users/')[1]?.split('?')[0] || 'default';
					return json({
						id: `dm-${targetUserId}`,
						name: `Message Direct`,
						type: 'dm',
						write_access: true,
						is_private: true,
						access_control: null,
						created_at: Math.floor(Date.now() / 1000)
					});
				}
				if (url.includes('/channels/') && url.includes('/messages')) {
					const channelId = url.split('/channels/')[1]?.split('/')[0]?.split('?')[0] || 'general';
					if (method === 'POST') {
						let body = '';
						req.on('data', (chunk) => {
							body += chunk;
						});
						req.on('end', () => {
							let parsed: any = {};
							try {
								parsed = JSON.parse(body);
							} catch {}

							const authHeader = (req.headers['authorization'] as string) || '';
							const token = authHeader.replace('Bearer ', '').trim();
							let name = 'MrPinPinYT';
							let uid = 'QH8wKG8nWZVtUQEy2pppuBuNZgC3';
							let role = 'admin';
							try {
								const parts = token.split('.');
								if (parts.length === 3) {
									const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
									name = payload.name || name;
									uid = payload.user_id || payload.sub || uid;
									if (uid === 'QH8wKG8nWZVtUQEy2pppuBuNZgC3') role = 'admin';
								}
							} catch {}

							const msgObj = {
								id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
								channel_id: channelId,
								content: parsed.content || '',
								data: parsed.data || null,
								reply_to_id: parsed.reply_to_id || null,
								user_id: uid,
								user: {
									id: uid,
									name: name,
									role: role,
									profile_image_url: '/User.avif'
								},
								created_at: Date.now() * 1000000,
								updated_at: Date.now() * 1000000
							};

							if (!(global as any).__channelStore) {
								(global as any).__channelStore = {};
							}
							if (!(global as any).__channelStore[channelId]) {
								(global as any).__channelStore[channelId] = [];
							}
							(global as any).__channelStore[channelId].unshift(msgObj);
							return json(msgObj);
						});
						return;
					}

					const store = (global as any).__channelStore || {};
					return json(store[channelId] || []);
				}
				if (url === '/api/v1/channels' || url === '/api/v1/channels/' || url.startsWith('/api/v1/channels?')) {
					return json([
						{
							id: 'general',
							name: 'Général',
							type: 'channel',
							description: 'Canal de discussion général',
							write_access: true,
							access_control: null,
							created_at: Date.now() * 1000000
						}
					]);
				}
				if (url.includes('/channels/') && !url.endsWith('/channels/')) {
					const channelId = url.split('/channels/')[1]?.split('?')[0] || 'general';
					return json({
						id: channelId,
						name: 'Général',
						type: 'channel',
						write_access: true,
						access_grants: [],
						created_at: Math.floor(Date.now() / 1000)
					});
				}
				if (
					url.includes('/chats') ||
					url.includes('/tags') ||
					url.includes('/folders') ||
					url.includes('/tools') ||
					url.includes('/channels') ||
					url.includes('/terminals') ||
					url.includes('/notes') ||
					url.includes('/prompts') ||
					url.includes('/knowledge') ||
					url.includes('/skills') ||
					url.includes('/memories') ||
					url.includes('/automations') ||
					url.includes('/calendar')
				) {
					return json([]);
				}

				if (url.startsWith('/ollama')) return json({ models: [] });
				if (url.startsWith('/openai')) return json({ data: [] });

				return json([]);
			});
		}
	};
}

export default defineConfig({
	plugins: [
		suppressVirtualListWarning,
		mockBackendPlugin(),
		sveltekit()
	],
	define: {
		APP_VERSION: JSON.stringify(process.env.npm_package_version),
		APP_BUILD_HASH: JSON.stringify(process.env.APP_BUILD_HASH || 'dev-build')
	},
	build: {
		sourcemap: false
	},
	optimizeDeps: {
		include: [
			'dayjs',
			'i18next',
			'i18next-resources-to-backend',
			'file-saver',
			'idb',
			'dompurify',
			'socket.io-client',
			'svelte-sonner',
			'tippy.js',
			'marked',
			'katex',
			'highlight.js',
			'fuse.js',
			'@floating-ui/dom',
			'@floating-ui/core',
			'@sveltejs/svelte-virtual-list'
		]
	},
	server: {
		warmup: {
			clientFiles: [
				'./src/routes/+layout.svelte',
				'./src/routes/(app)/+page.svelte',
				'./src/lib/components/chat/Chat.svelte',
				'./src/lib/components/chat/MessageInput.svelte',
				'./src/lib/components/chat/Messages.svelte',
				'./src/lib/components/layout/Sidebar.svelte',
				'./src/lib/components/chat/Navbar.svelte'
			]
		}
	},
	worker: {
		format: 'es'
	}
});
