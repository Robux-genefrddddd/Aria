import { initializeApp, getApps } from 'firebase/app';
import {
	getAuth,
	GoogleAuthProvider,
	GithubAuthProvider,
	signInWithPopup,
	signInWithEmailAndPassword,
	createUserWithEmailAndPassword,
	signOut,
	onAuthStateChanged,
	updateProfile,
	type User
} from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
	apiKey: 'AIzaSyD7KlxN05OoSCGHwjXhiiYyKF5bOXianLY',
	authDomain: 'keysystem-d0b86-8df89.firebaseapp.com',
	databaseURL: 'https://keysystem-d0b86-8df89-default-rtdb.europe-west1.firebasedatabase.app',
	projectId: 'keysystem-d0b86-8df89',
	storageBucket: 'keysystem-d0b86-8df89.firebasestorage.app',
	messagingSenderId: '1048409565735',
	appId: '1:1048409565735:web:9f45b4615dbb0fa20dfc02',
	measurementId: 'G-7LKZ6L01Q9'
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);

if (typeof window !== 'undefined') {
	try {
		getAnalytics(app);
	} catch {}
}

export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const signInWithGithub = () => signInWithPopup(auth, githubProvider);
export const signInWithEmail = (email: string, password: string) =>
	signInWithEmailAndPassword(auth, email, password);
export const signUpWithEmail = (email: string, password: string) =>
	createUserWithEmailAndPassword(auth, email, password);
export const logOut = () => signOut(auth);

export const onAuthChange = (callback: (user: User | null) => void) =>
	onAuthStateChanged(auth, callback);

const OWNER_UIDS = ['QH8wKG8nWZVtUQEy2pppuBuNZgC3'];

/** Récupère le rôle d'un utilisateur depuis Firebase (Custom Claims ou Realtime Database) */
export const getUserRoleFromFirebase = async (firebaseUser: User | any): Promise<'owner' | 'admin' | 'beta_tester' | 'user' | string> => {
	try {
		if (firebaseUser?.uid && OWNER_UIDS.includes(firebaseUser.uid)) {
			return 'owner';
		}

		// 1. Vérifier les custom claims du token Firebase
		if (typeof firebaseUser.getIdTokenResult === 'function') {
			const tokenResult = await firebaseUser.getIdTokenResult(true);
			if (
				tokenResult.claims.admin === true ||
				tokenResult.claims.role === 'admin' ||
				tokenResult.claims.isAdmin === true
			) {
				return 'admin';
			}
		}

		// 2. Vérifier dans la Realtime Database Firebase (/users/{uid})
		const dbUrl = `https://keysystem-d0b86-8df89-default-rtdb.europe-west1.firebasedatabase.app/users/${firebaseUser.uid}.json`;
		const res = await fetch(dbUrl);
		if (res.ok) {
			const data = await res.json();
			if (data) {
				if (typeof data === 'string') return data;
				if (data.role) return data.role;
				if (data.isAdmin === true || data.admin === true) return 'admin';
			}
		}

		// 3. Vérifier directement dans (/users/{uid}/role.json)
		const roleUrl = `https://keysystem-d0b86-8df89-default-rtdb.europe-west1.firebasedatabase.app/users/${firebaseUser.uid}/role.json`;
		const roleRes = await fetch(roleUrl);
		if (roleRes.ok) {
			const roleData = await roleRes.json();
			if (roleData) {
				return typeof roleData === 'string' ? roleData : 'admin';
			}
		}

		// 4. Vérifier dans (/admins/{uid}.json)
		const adminCheckUrl = `https://keysystem-d0b86-8df89-default-rtdb.europe-west1.firebasedatabase.app/admins/${firebaseUser.uid}.json`;
		const adminRes = await fetch(adminCheckUrl);
		if (adminRes.ok) {
			const adminData = await adminRes.json();
			if (adminData === true || adminData?.admin === true || adminData === 'admin') {
				return 'admin';
			}
		}

		// 5. Recherche par email si l'UID diffère dans Firebase
		if (firebaseUser.email) {
			const allUsersUrl = `https://keysystem-d0b86-8df89-default-rtdb.europe-west1.firebasedatabase.app/users.json`;
			const allRes = await fetch(allUsersUrl);
			if (allRes.ok) {
				const allUsers = await allRes.json();
				if (allUsers && typeof allUsers === 'object') {
					for (const key of Object.keys(allUsers)) {
						const u = allUsers[key];
						if (u?.email?.toLowerCase() === firebaseUser.email.toLowerCase()) {
							if (u.role) return u.role;
							if (u.isAdmin || u.admin) return 'admin';
						}
					}
				}
			}
		}
	} catch (e) {
		console.warn('Could not fetch role from Firebase:', e);
	}

	return 'user';
};

/** Enregistre les métadonnées de l'utilisateur dans Firebase Realtime Database */
export const saveUserToFirebaseDatabase = async (
	uid: string,
	userData: { email: string; name: string; role?: string }
) => {
	try {
		const dbUrl = `https://keysystem-d0b86-8df89-default-rtdb.europe-west1.firebasedatabase.app/users/${uid}.json`;
		await fetch(dbUrl, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				...userData,
				updatedAt: Date.now()
			})
		});
	} catch (e) {
		console.warn('Failed to sync user metadata to Firebase database:', e);
	}
};

/** Construit l'objet session Aria correspondant à l'utilisateur Firebase et l'enregistre en base */
export const createAriaSessionFromFirebaseUser = async (firebaseUser: User, name?: string) => {
	const token = await firebaseUser.getIdToken();
	const role = await getUserRoleFromFirebase(firebaseUser);
	const displayName = name || firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'User');
	const email = firebaseUser.email || 'user@aria.local';

	// Auto-persist every user (Google, Github, Email) to Firebase Realtime Database
	try {
		const dbUrl = `https://keysystem-d0b86-8df89-default-rtdb.europe-west1.firebasedatabase.app/users/${firebaseUser.uid}.json`;
		await fetch(dbUrl, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				email: email,
				name: displayName,
				role: role,
				profile_image_url: firebaseUser.photoURL || undefined,
				created_at: firebaseUser.metadata?.creationTime
					? Math.floor(new Date(firebaseUser.metadata.creationTime).getTime() / 1000)
					: Math.floor(Date.now() / 1000),
				last_active_at: Math.floor(Date.now() / 1000),
				updatedAt: Date.now()
			})
		});
	} catch (e) {
		console.warn('Could not auto-register user to Firebase database:', e);
	}

	const avatarUrl = firebaseUser.photoURL || (typeof window !== 'undefined' ? localStorage.getItem('aria_profile_image_url') : null) || '/User.avif';
	if (firebaseUser.photoURL && typeof window !== 'undefined') {
		localStorage.setItem('aria_profile_image_url', firebaseUser.photoURL);
	}

	// Fetch custom token limit if set
	let userTokenLimit: number | null = null;
	try {
		const uRes = await fetch(`https://keysystem-d0b86-8df89-default-rtdb.europe-west1.firebasedatabase.app/users/${firebaseUser.uid}/token_limit.json`);
		if (uRes.ok) {
			const uData = await uRes.json();
			if (uData !== null && uData !== undefined) userTokenLimit = Number(uData);
		}
	} catch (e) {}

	const sessionUser = {
		id: firebaseUser.uid,
		email: email,
		name: displayName,
		role: role,
		token_limit: userTokenLimit,
		profile_image_url: avatarUrl,
		token: token,
		permissions: {
			workspace: {
				models: true,
				knowledge: true,
				prompts: true,
				tools: true,
				skills: true
			},
			chat: {
				controls: true,
				file_upload: true,
				delete: true,
				edit: true,
				import: true
			},
			features: {
				notes: true,
				automations: role === 'admin',
				calendar: true
			}
		}
	};

	return sessionUser;
};

/** Récupère les paramètres utilisateur enregistrés dans Firebase Realtime Database */
export const getFirebaseUserSettings = async (uid?: string): Promise<Record<string, any>> => {
	const currentUid = uid || auth.currentUser?.uid || localStorage.getItem('aria_uid');
	if (!currentUid) {
		const cached = localStorage.getItem('aria_user_settings');
		return cached ? JSON.parse(cached) : { ui: {} };
	}

	try {
		const dbUrl = `https://keysystem-d0b86-8df89-default-rtdb.europe-west1.firebasedatabase.app/users/${currentUid}/settings.json`;
		const res = await fetch(dbUrl);
		if (res.ok) {
			const data = await res.json();
			if (data && typeof data === 'object') {
				localStorage.setItem(`aria_user_settings_${currentUid}`, JSON.stringify(data));
				localStorage.setItem('aria_user_settings', JSON.stringify(data));
				return data;
			}
		}
	} catch (e) {
		console.warn('Failed to load settings from Firebase, checking local cache:', e);
	}

	const cached =
		localStorage.getItem(`aria_user_settings_${currentUid}`) ||
		localStorage.getItem('aria_user_settings');
	return cached ? JSON.parse(cached) : { ui: {} };
};

/** Enregistre les paramètres utilisateur dans Firebase Realtime Database */
export const saveFirebaseUserSettings = async (
	settings: Record<string, any>,
	uid?: string
): Promise<Record<string, any>> => {
	const currentUid = uid || auth.currentUser?.uid || localStorage.getItem('aria_uid');

	// Enregistrement local immédiat
	localStorage.setItem('aria_user_settings', JSON.stringify(settings));
	if (currentUid) {
		localStorage.setItem(`aria_user_settings_${currentUid}`, JSON.stringify(settings));
	}

	// Persistance directe du thème
	if (settings?.ui?.theme) {
		localStorage.setItem('theme', settings.ui.theme);
	}

	if (!currentUid) {
		return settings;
	}

	try {
		const dbUrl = `https://keysystem-d0b86-8df89-default-rtdb.europe-west1.firebasedatabase.app/users/${currentUid}/settings.json`;
		await fetch(dbUrl, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(settings)
		});
	} catch (e) {
		console.warn('Failed to persist settings to Firebase database:', e);
	}

	return settings;
};

/** Récupère la liste de tous les utilisateurs depuis Firebase Realtime Database */
export const getFirebaseAllUsers = async (): Promise<any[]> => {
	try {
		const dbUrl = `https://keysystem-d0b86-8df89-default-rtdb.europe-west1.firebasedatabase.app/users.json`;
		const res = await fetch(dbUrl);
		if (res.ok) {
			const data = await res.json();
			if (data && typeof data === 'object') {
				return Object.entries(data).map(([uid, u]: [string, any]) => ({
					id: uid,
					name: u?.name || (u?.email ? u.email.split('@')[0] : 'Utilisateur'),
					email: u?.email || (uid === 'QH8wKG8nWZVtUQEy2pppuBuNZgC3' ? 'contact@pincorpsstudio.site' : 'user@aria.local'),
					role: (uid === 'QH8wKG8nWZVtUQEy2pppuBuNZgC3' || u?.email === 'mrpinpinpro@gmail.com') ? 'owner' : (u?.role || (u?.admin ? 'admin' : 'user')),
					profile_image_url: u?.profile_image_url || '/User.avif',
					created_at: u?.created_at || (u?.createdAt ? Math.floor(u.createdAt / 1000) : Math.floor(Date.now() / 1000) - 86400 * 7),
					last_active_at: u?.last_active_at || (u?.updatedAt ? Math.floor(u.updatedAt / 1000) : Math.floor(Date.now() / 1000)),
					updated_at: u?.updated_at || (u?.updatedAt ? Math.floor(u.updatedAt / 1000) : Math.floor(Date.now() / 1000)),
					oauth_sub: u?.oauth_sub || null
				}));
			}
		}
	} catch (e) {
		console.warn('Failed to fetch users from Firebase:', e);
	}
	return [];
};

/** Met à jour le rôle d'un utilisateur dans Firebase Realtime Database */
export const updateFirebaseUserRole = async (uid: string, role: string) => {
	try {
		const dbUrl = `https://keysystem-d0b86-8df89-default-rtdb.europe-west1.firebasedatabase.app/users/${uid}.json`;
		await fetch(dbUrl, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ role, updatedAt: Date.now() })
		});
	} catch (e) {
		console.warn('Failed to update role in Firebase database:', e);
	}
};

/** Supprime un utilisateur de Firebase Realtime Database */
export const deleteFirebaseUser = async (uid: string) => {
	try {
		const dbUrl = `https://keysystem-d0b86-8df89-default-rtdb.europe-west1.firebasedatabase.app/users/${uid}.json`;
		await fetch(dbUrl, {
			method: 'DELETE'
		});
	} catch (e) {
		console.warn('Failed to delete user in Firebase database:', e);
	}
};

/** Met à jour les informations d'un utilisateur dans Firebase Realtime Database */
export const updateFirebaseUser = async (uid: string, updates: Record<string, any>) => {
	try {
		const dbUrl = `https://keysystem-d0b86-8df89-default-rtdb.europe-west1.firebasedatabase.app/users/${uid}.json`;
		await fetch(dbUrl, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ ...updates, updatedAt: Date.now() })
		});
	} catch (e) {
		console.warn('Failed to update user in Firebase database:', e);
	}
};

/** Abonnement temps réel instantané (SSE Push) aux données de l'utilisateur dans Firebase */
export const subscribeToUserLive = (uid: string, onUpdate: (data: any) => void) => {
	if (typeof window === 'undefined' || !uid) return () => {};

	let es: EventSource | null = null;
	let interval: any = null;

	const connect = () => {
		try {
			const url = `https://keysystem-d0b86-8df89-default-rtdb.europe-west1.firebasedatabase.app/users/${uid}.json`;
			es = new EventSource(url);

			es.addEventListener('put', (event: any) => {
				try {
					const parsed = JSON.parse(event.data);
					if (parsed.path === '/' && parsed.data) {
						onUpdate(parsed.data);
					} else if (parsed.path === '/role') {
						onUpdate({ role: parsed.data });
					} else if (parsed.path === '/token_limit') {
						onUpdate({ token_limit: parsed.data });
					} else if (parsed.path === '/banned') {
						onUpdate({ role: parsed.data ? 'banned' : 'user' });
					}
				} catch (e) {}
			});

			es.addEventListener('patch', (event: any) => {
				try {
					const parsed = JSON.parse(event.data);
					if (parsed.data) {
						onUpdate(parsed.data);
					}
				} catch (e) {}
			});

			es.onerror = () => {
				es?.close();
				setTimeout(connect, 4000);
			};
		} catch (e) {
			console.warn('SSE subscribe failed:', e);
		}
	};

	connect();

	// Filet de sécurité léger (toutes les 3.5 secondes)
	interval = setInterval(async () => {
		try {
			const res = await fetch(
				`https://keysystem-d0b86-8df89-default-rtdb.europe-west1.firebasedatabase.app/users/${uid}.json`
			);
			if (res.ok) {
				const data = await res.json();
				if (data) onUpdate(data);
			}
		} catch {}
	}, 3500);

	return () => {
		es?.close();
		clearInterval(interval);
	};
};

/** Enregistre la consommation de tokens par date et par modèle dans Firebase */
export const recordFirebaseTokenUsage = async (uid: string, tokensCount: number, modelId?: any) => {
	if (!uid || !tokensCount) return;
	try {
		const todayStr = new Date().toISOString().split('T')[0];
		const dbUrl = `https://keysystem-d0b86-8df89-default-rtdb.europe-west1.firebasedatabase.app/users/${uid}.json`;
		const res = await fetch(dbUrl);
		if (res.ok) {
			const data = (await res.json()) || {};
			const currentTotal = Number(data?.tokens?.total ?? 0) + tokensCount;
			const currentDaily = Number(data?.tokens?.history?.[todayStr] ?? 0) + tokensCount;
			const cleanModelKey = (String(modelId || 'aria-basic')).replace(/[^a-zA-Z0-9_-]/g, '_');
			const currentModel = Number(data?.tokens?.models?.[cleanModelKey] ?? 0) + tokensCount;

			await fetch(`${dbUrl}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					tokens: {
						total: currentTotal,
						history: {
							...(data?.tokens?.history || {}),
							[todayStr]: currentDaily
						},
						models: {
							...(data?.tokens?.models || {}),
							[cleanModelKey]: currentModel
						}
					}
				})
			});
		}
	} catch (e) {
		console.warn('Failed to record token usage in Firebase:', e);
	}
};

const getResolvedUid = (uid?: string): string => {
	if (uid) return uid;
	if (auth.currentUser?.uid) return auth.currentUser.uid;
	if (typeof window !== 'undefined') {
		const storedUid = localStorage.getItem('aria_uid');
		if (storedUid) return storedUid;
		const userRaw = localStorage.getItem('aria_user');
		if (userRaw && userRaw.trim() !== '') {
			try {
				const u = JSON.parse(userRaw);
				if (u?.id) return u.id;
			} catch {}
		}
	}
	return 'QH8wKG8nWZVtUQEy2pppuBuNZgC3';
};

/** Enregistre la liste des conversations de l'utilisateur dans Firebase Realtime Database */
export const saveFirebaseUserChats = async (uid: string | undefined, chats: any[]) => {
	const targetUid = getResolvedUid(uid);
	if (!chats) return;
	try {
		const dbUrl = `https://keysystem-d0b86-8df89-default-rtdb.europe-west1.firebasedatabase.app/users/${targetUid}/chats.json`;
		await fetch(dbUrl, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(chats)
		});
	} catch (e) {
		console.warn('Failed to save chats to Firebase:', e);
	}
};

/** Récupère la liste des conversations de l'utilisateur depuis Firebase Realtime Database */
export const fetchFirebaseUserChats = async (uid?: string): Promise<any[]> => {
	const targetUid = getResolvedUid(uid);
	try {
		const dbUrl = `https://keysystem-d0b86-8df89-default-rtdb.europe-west1.firebasedatabase.app/users/${targetUid}/chats.json`;
		const res = await fetch(dbUrl);
		if (res.ok) {
			const data = await res.json();
			if (Array.isArray(data)) return data;
			if (data && typeof data === 'object') return Object.values(data);
		}
	} catch (e) {
		console.warn('Failed to fetch chats from Firebase:', e);
	}
	return [];
};

/** Enregistre le contenu complet d'une conversation dans Firebase Realtime Database */
export const saveFirebaseSingleChat = async (uid: string | undefined, id: string, chatData: any) => {
	const targetUid = getResolvedUid(uid);
	if (!id || !chatData) return;
	try {
		const dbUrl = `https://keysystem-d0b86-8df89-default-rtdb.europe-west1.firebasedatabase.app/users/${targetUid}/chats_data/${id}.json`;
		await fetch(dbUrl, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(chatData)
		});
	} catch (e) {
		console.warn('Failed to save single chat to Firebase:', e);
	}
};

/** Récupère le contenu complet d'une conversation depuis Firebase Realtime Database */
export const fetchFirebaseSingleChat = async (uid: string | undefined, id: string): Promise<any | null> => {
	const targetUid = getResolvedUid(uid);
	if (!id) return null;
	try {
		const dbUrl = `https://keysystem-d0b86-8df89-default-rtdb.europe-west1.firebasedatabase.app/users/${targetUid}/chats_data/${id}.json`;
		const res = await fetch(dbUrl);
		if (res.ok) {
			const data = await res.json();
			if (data && typeof data === 'object') return data;
		}
	} catch (e) {
		console.warn('Failed to fetch single chat from Firebase:', e);
	}
	return null;
};

/** Supprime une conversation de Firebase Realtime Database */
export const deleteFirebaseSingleChat = async (uid: string | undefined, id: string) => {
	const targetUid = getResolvedUid(uid);
	if (!id) return;
	try {
		const dbUrl = `https://keysystem-d0b86-8df89-default-rtdb.europe-west1.firebasedatabase.app/users/${targetUid}/chats_data/${id}.json`;
		await fetch(dbUrl, { method: 'DELETE' });
	} catch (e) {}
};


