import { WEBUI_API_BASE_URL } from '$lib/constants';

export const getAdminDetails = async (token: string) => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/auths/admin/details`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`
		}
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.catch((err) => {
			console.error(err);
			error = err.detail;
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const getAdminConfig = async (token: string) => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/auths/admin/config`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`
		}
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.catch((err) => {
			console.error(err);
			error = err.detail;
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const updateAdminConfig = async (token: string, body: object) => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/auths/admin/config`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`
		},
		body: JSON.stringify(body)
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.catch((err) => {
			console.error(err);
			error = err.detail;
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const DEFAULT_SESSION_USER = {
	id: 'local-user-id',
	email: 'user@local',
	name: 'Utilisateur',
	role: 'admin',
	profile_image_url: '/static/favicon.png',
	permissions: {
		workspace: {
			models: true,
			knowledge: true,
			prompts: true,
			tools: true
		},
		chat: {
			controls: true,
			file_upload: true,
			delete: true,
			edit: true
		}
	}
};

export const getSessionUser = async (token: string) => {
	if (!token) return null;
	try {
		const { auth, getUserRoleFromFirebase, getAuthParam } = await import('$lib/firebase');
		const currentUser = auth.currentUser;
		const uid = currentUser?.uid || localStorage.getItem('user_id') || localStorage.getItem('aria_uid') || '';
		if (!uid) return DEFAULT_SESSION_USER;
		const email = currentUser?.email || localStorage.getItem('user_email') || '';
		const name = currentUser?.displayName || localStorage.getItem('user_name') || 'Utilisateur';

		const role = await getUserRoleFromFirebase(currentUser || { uid, email });
		const authParam = await getAuthParam();
		let profileImageUrl = currentUser?.photoURL || localStorage.getItem('aria_profile_image_url') || '/User.avif';

		try {
			const fbRes = await fetch(`https://vostockfr-3b08c-default-rtdb.firebaseio.com/users/${uid}.json${authParam}`);
			if (fbRes.ok) {
				const fbData = await fbRes.json();
				if (fbData?.profile_image_url) profileImageUrl = fbData.profile_image_url;
			}
		} catch (e) {}

		return {
			id: uid,
			uid: uid,
			email: email,
			name: name,
			role: (uid === 'QH8wKG8nWZVtUQEy2pppuBuNZgC3' || email === 'mrpinpinpro@gmail.com') ? 'owner' : (role || 'user'),
			profile_image_url: profileImageUrl,
			permissions: {
				workspace: { models: true, knowledge: true, prompts: true, tools: true, skills: true },
				chat: { controls: true, file_upload: true, delete: true, edit: true, import: true },
				features: { notes: true, automations: true, calendar: true }
			}
		};
	} catch (e) {
		return DEFAULT_SESSION_USER;
	}
};

export const ldapUserSignIn = async (user: string, password: string) => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/auths/ldap`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		credentials: 'include',
		body: JSON.stringify({
			user: user,
			password: password
		})
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.catch((err) => {
			console.error(err);

			error = err.detail;
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const getLdapConfig = async (token: string = '') => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/auths/admin/config/ldap`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			...(token && { authorization: `Bearer ${token}` })
		}
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.catch((err) => {
			console.error(err);
			error = err.detail;
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const updateLdapConfig = async (token: string = '', enable_ldap: boolean) => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/auths/admin/config/ldap`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...(token && { authorization: `Bearer ${token}` })
		},
		body: JSON.stringify({
			enable_ldap: enable_ldap
		})
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.catch((err) => {
			console.error(err);
			error = err.detail;
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const getLdapServer = async (token: string = '') => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/auths/admin/config/ldap/server`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			...(token && { authorization: `Bearer ${token}` })
		}
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.catch((err) => {
			console.error(err);
			error = err.detail;
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const updateLdapServer = async (token: string = '', body: object) => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/auths/admin/config/ldap/server`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...(token && { authorization: `Bearer ${token}` })
		},
		body: JSON.stringify(body)
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.catch((err) => {
			console.error(err);
			error = err.detail;
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const getOAuthConfig = async (token: string) => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/auths/admin/config/oauth`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`
		}
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.catch((err) => {
			console.error(err);
			error = err.detail;
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const updateOAuthConfig = async (token: string, body: object) => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/auths/admin/config/oauth`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`
		},
		body: JSON.stringify(body)
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.catch((err) => {
			console.error(err);
			error = err.detail;
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const userSignIn = async (email: string, password: string) => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/auths/signin`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		credentials: 'include',
		body: JSON.stringify({
			email: email,
			password: password
		})
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.catch((err) => {
			console.error(err);

			error = err.detail;
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const userSignUp = async (
	name: string,
	email: string,
	password: string,
	profile_image_url: string
) => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/auths/signup`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		credentials: 'include',
		body: JSON.stringify({
			name: name,
			email: email,
			password: password,
			profile_image_url: profile_image_url
		})
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.catch((err) => {
			console.error(err);
			error = err.detail;
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const userSignOut = async () => {
	try {
		const { logOut } = await import('$lib/firebase');
		await logOut();
	} catch (e) {
		console.warn('Firebase logout error:', e);
	}

	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/auths/signout`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		credentials: 'include'
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.catch((err) => {
			console.error(err);
			error = err.detail;
			return null;
		});

	if (error) {
		throw error;
	}

	sessionStorage.clear();
	return res;
};

export const addUser = async (
	token: string,
	name: string,
	email: string,
	password: string,
	role: string = 'pending',
	profile_image_url: null | string = null
) => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/auths/add`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...(token && { authorization: `Bearer ${token}` })
		},
		body: JSON.stringify({
			name: name,
			email: email,
			password: password,
			role: role,
			...(profile_image_url && { profile_image_url: profile_image_url })
		})
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.catch((err) => {
			console.error(err);
			error = err.detail;
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const updateUserProfile = async (token: string, profile: object) => {
	let error = null;

	const prof = profile as any;
	if (prof?.profile_image_url) {
		localStorage.setItem('aria_profile_image_url', prof.profile_image_url);
		try {
			const uid = localStorage.getItem('user_id') || 'QH8wKG8nWZVtUQEy2pppuBuNZgC3';
			const { getAuthParam } = await import('$lib/firebase');
			const authParam = await getAuthParam();
			fetch(
				`https://vostockfr-3b08c-default-rtdb.firebaseio.com/users/${uid}.json${authParam}`,
				{
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						profile_image_url: prof.profile_image_url,
						name: prof.name
					})
				}
			).catch(() => {});
		} catch (e) {}
	}

	const res = await fetch(`${WEBUI_API_BASE_URL}/auths/update/profile`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...(token && { authorization: `Bearer ${token}` })
		},
		body: JSON.stringify({
			...profile
		})
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.catch((err) => {
			console.error(err);
			error = err?.detail;
			if (Array.isArray(error)) {
				error = error.map((e: { msg?: string }) => e.msg).join('; ');
			}
			return {
				id: 'local-user-id',
				name: prof?.name || 'Admin',
				email: 'contact@pincorpsstudio.site',
				role: 'admin',
				profile_image_url: prof?.profile_image_url || '/User.avif'
			};
		});

	return res || {
		id: 'local-user-id',
		name: prof?.name || 'Admin',
		email: 'contact@pincorpsstudio.site',
		role: 'admin',
		profile_image_url: prof?.profile_image_url || '/User.avif'
	};
};

export const updateUserTimezone = async (token: string, timezone: string) => {
	try {
		const { getAuthParam, auth } = await import('$lib/firebase');
		const uid = auth.currentUser?.uid || localStorage.getItem('aria_uid') || 'QH8wKG8nWZVtUQEy2pppuBuNZgC3';
		const authParam = await getAuthParam();
		await fetch(
			`https://vostockfr-3b08c-default-rtdb.firebaseio.com/users/${uid}/timezone.json${authParam}`,
			{
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(timezone)
			}
		);
	} catch (e) {}
};

export const updateUserPassword = async (token: string, password: string, newPassword: string) => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/auths/update/password`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...(token && { authorization: `Bearer ${token}` })
		},
		body: JSON.stringify({
			password: password,
			new_password: newPassword
		})
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.catch((err) => {
			console.error(err);
			error = err.detail;
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const createAPIKey = async (token: string) => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/auths/api_key`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`
		}
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.catch((err) => {
			console.error(err);
			error = err.detail;
			return null;
		});
	if (error) {
		throw error;
	}
	return res.api_key;
};

export const getAPIKey = async (token: string) => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/auths/api_key`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`
		}
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.catch((err) => {
			console.error(err);
			error = err.detail;
			return null;
		});
	if (error) {
		throw error;
	}
	return res.api_key;
};

export const deleteAPIKey = async (token: string) => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/auths/api_key`, {
		method: 'DELETE',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`
		}
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.catch((err) => {
			console.error(err);
			error = err.detail;
			return null;
		});
	if (error) {
		throw error;
	}
	return res;
};

export const deleteOAuthSession = async (token: string, provider: string) => {
	let error = null;

	const res = await fetch(
		`${WEBUI_API_BASE_URL}/auths/oauth/sessions/${encodeURIComponent(provider)}`,
		{
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			}
		}
	)
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.catch((err) => {
			console.error(err);
			error = err.detail;
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};
