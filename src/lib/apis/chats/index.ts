import { WEBUI_API_BASE_URL } from '$lib/constants';
import { getTimeRange } from '$lib/utils';

const getErrorDetail = (err: any) => {
	if (Array.isArray(err?.detail)) {
		return err.detail.map((e: { msg?: string }) => e.msg || JSON.stringify(e)).join(', ');
	}

	return err?.detail ?? err;
};

export const getChatConfig = async (token: string) => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/chats/config`, {
		method: 'GET',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			...(token && { authorization: `Bearer ${token}` })
		}
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.catch((err) => {
			error = getErrorDetail(err);
			console.error(err);
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const updateChatConfig = async (token: string, config: object) => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/chats/config`, {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			...(token && { authorization: `Bearer ${token}` })
		},
		body: JSON.stringify(config)
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.catch((err) => {
			error = getErrorDetail(err);
			console.error(err);
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const createNewChat = async (
	token: string,
	chat: any,
	folderId: string | null,
	variables: object | null = null
) => {
	const chatId = chat?.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `chat-${Date.now()}`);
	const now = Math.floor(Date.now() / 1000);
	const fullChat = {
		id: chatId,
		title: chat?.title || 'Nouvelle conversation',
		models: chat?.models || [],
		chat: chat,
		folder_id: folderId ?? null,
		variables: variables ?? {},
		created_at: chat?.created_at || now,
		updated_at: now
	};

	try {
		if (typeof window !== 'undefined') {
			localStorage.setItem(`aria_chat_${chatId}`, JSON.stringify(fullChat));
			const saved = localStorage.getItem('aria_local_chats');
			const list = (saved && saved.trim() !== '') ? JSON.parse(saved) : [];
			const updated = [fullChat, ...list.filter((c: any) => c.id !== chatId)];
			localStorage.setItem('aria_local_chats', JSON.stringify(updated));
			const { saveFirebaseUserChats, saveFirebaseSingleChat } = await import('$lib/firebase');
			await Promise.all([
				saveFirebaseUserChats(undefined, updated),
				saveFirebaseSingleChat(undefined, chatId, fullChat)
			]);
		}
	} catch (e) {
		console.warn('Failed to save new chat:', e);
	}

	return fullChat;
};

export const unarchiveAllChats = async (token: string) => {
	try {
		if (typeof window !== 'undefined') {
			localStorage.setItem('aria_archived_chats', JSON.stringify([]));
		}
	} catch (e) {}
	return true;
};

export const unarchiveChatById = async (token: string, id: string) => {
	if (!id) return null;
	try {
		const chat = await getChatById(token, id);
		if (chat) {
			const updated = { ...chat, archived: false, is_archived: false };
			await updateChatById(token, id, updated);

			if (typeof window !== 'undefined') {
				const saved = localStorage.getItem('aria_archived_chats');
				if (saved && saved.trim() !== '') {
					const list = JSON.parse(saved);
					const newList = list.filter((c: any) => c.id !== id);
					localStorage.setItem('aria_archived_chats', JSON.stringify(newList));
				}
			}
			return updated;
		}
	} catch (e) {}
	return { id, archived: false };
};

export const unshareAllChats = async (token: string) => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/chats/share/all`, {
		method: 'DELETE',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			...(token && { authorization: `Bearer ${token}` })
		}
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.then((json) => {
			return json;
		})
		.catch((err) => {
			error = err.detail;

			console.error(err);
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const importChats = async (token: string, chats: object[]) => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/chats/import`, {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			authorization: `Bearer ${token}`
		},
		body: JSON.stringify({
			chats
		})
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.catch((err) => {
			error = getErrorDetail(err);
			console.error(err);
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const getChatList = async (
	token: string = '',
	page: number | null = 1,
	include_folders: boolean = false,
	include_pinned: boolean = false
) => {
	// Firebase Realtime Database
	try {
		const { fetchFirebaseUserChats } = await import('$lib/firebase');
		const fbChats = await fetchFirebaseUserChats();
		if (Array.isArray(fbChats) && fbChats.length > 0) {
			return fbChats.map((chat) => ({
				...chat,
				time_range: getTimeRange(chat.updated_at || Date.now())
			}));
		}
	} catch (e) {}

	// Local Storage fallback
	try {
		if (typeof window !== 'undefined') {
			const localSaved = localStorage.getItem('aria_local_chats');
			if (localSaved && localSaved.trim() !== '') {
				const parsed = JSON.parse(localSaved);
				if (Array.isArray(parsed) && parsed.length > 0) {
					return parsed.map((chat) => ({
						...chat,
						time_range: getTimeRange(chat.updated_at || Date.now())
					}));
				}
			}
		}
	} catch (e) {}

	return [];
};

export const getChatListByUserId = async (
	token: string = '',
	userId: string,
	page: number = 1,
	filter?: object
) => {
	let error = null;

	const searchParams = new URLSearchParams();

	searchParams.append('page', `${page}`);

	if (filter) {
		Object.entries(filter).forEach(([key, value]) => {
			if (value !== undefined && value !== null) {
				searchParams.append(key, value.toString());
			}
		});
	}

	const res = await fetch(
		`${WEBUI_API_BASE_URL}/chats/list/user/${userId}?${searchParams.toString()}`,
		{
			method: 'GET',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
				...(token && { authorization: `Bearer ${token}` })
			}
		}
	)
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.then((json) => {
			return json;
		})
		.catch((err) => {
			error = getErrorDetail(err);
			console.error(err);
			return null;
		});

	if (error) {
		throw error;
	}

	return res.map((chat) => ({
		...chat,
		time_range: getTimeRange(chat.updated_at)
	}));
};

export const getArchivedChatList = async (
	token: string = '',
	page: number = 1,
	filter?: any
) => {
	let archived: any[] = [];
	try {
		const { fetchFirebaseUserChats } = await import('$lib/firebase');
		const fbChats = await fetchFirebaseUserChats();
		if (Array.isArray(fbChats)) {
			archived = fbChats.filter((c: any) => c.archived === true || c.is_archived === true);
		}
	} catch (e) {}

	if (archived.length === 0 && typeof window !== 'undefined') {
		try {
			const saved = localStorage.getItem('aria_archived_chats');
			if (saved && saved.trim() !== '') {
				archived = JSON.parse(saved);
			}
		} catch (e) {}
	}

	if (filter?.query) {
		const q = filter.query.toLowerCase();
		archived = archived.filter((c: any) => c.title?.toLowerCase().includes(q));
	}

	return archived.map((chat) => ({
		...chat,
		time_range: getTimeRange(chat.updated_at || Date.now())
	}));
};

export const getArchivedChatCount = async (token: string = '') => {
	const list = await getArchivedChatList(token);
	return list.length;
};

export const getSharedChatList = async (token: string = '', page: number = 1, filter?: object) => {
	let error = null;

	const searchParams = new URLSearchParams();
	searchParams.append('page', `${page}`);

	if (filter) {
		Object.entries(filter).forEach(([key, value]) => {
			if (value !== undefined && value !== null) {
				searchParams.append(key, value.toString());
			}
		});
	}

	const res = await fetch(`${WEBUI_API_BASE_URL}/chats/shared?${searchParams.toString()}`, {
		method: 'GET',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			...(token && { authorization: `Bearer ${token}` })
		}
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.then((json) => {
			return json;
		})
		.catch((err) => {
			error = getErrorDetail(err);
			console.error(err);
			return null;
		});

	if (error) {
		throw error;
	}

	return res.map((chat) => ({
		...chat,
		time_range: getTimeRange(chat.updated_at)
	}));
};

export const getAllChats = async (token: string) => {
	const res = await fetch(`${WEBUI_API_BASE_URL}/chats/all`, {
		method: 'GET',
		headers: {
			Accept: 'application/x-ndjson',
			...(token && { authorization: `Bearer ${token}` })
		}
	});

	if (!res.ok) {
		const err = await res.json();
		console.error(err);
		throw err;
	}

	const reader = res.body?.getReader();
	if (!reader) {
		throw new Error('Response body is not readable');
	}

	const decoder = new TextDecoder();
	const chats: object[] = [];
	let buffer = '';

	while (true) {
		const { done, value } = await reader.read();
		if (done) break;

		buffer += decoder.decode(value, { stream: true });
		const lines = buffer.split('\n');
		// Keep the last potentially incomplete line in the buffer
		buffer = lines.pop() ?? '';

		for (const line of lines) {
			const trimmed = line.trim();
			if (trimmed) {
				chats.push(JSON.parse(trimmed));
			}
		}
	}

	// Process any remaining data in the buffer
	const remaining = buffer.trim();
	if (remaining) {
		chats.push(JSON.parse(remaining));
	}

	return chats;
};

export const getChatListBySearchText = async (token: string, text: string, page: number = 1) => {
	const searchParams = new URLSearchParams();
	searchParams.append('text', text);
	searchParams.append('page', `${page}`);

	const res = await fetch(`${WEBUI_API_BASE_URL}/chats/search?${searchParams.toString()}`, {
		method: 'GET',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			...(token && { authorization: `Bearer ${token}` })
		}
	})
		.then(async (res) => {
			if (!res.ok) return null;
			return res.json().catch(() => null);
		})
		.catch(() => null);

	if (res && Array.isArray(res) && res.length > 0) {
		return res.map((chat) => ({
			...chat,
			time_range: getTimeRange(chat.updated_at)
		}));
	}

	// Local & Firebase Search Fallback
	const allChats = await getChatList(token, page);
	const lower = (text || '').toLowerCase().trim();
	if (!lower) return allChats;
	return allChats.filter((c: any) =>
		(c.title || '').toLowerCase().includes(lower)
	);
};

export const getChatsByFolderId = async (token: string, folderId: string) => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/chats/folder/${folderId}`, {
		method: 'GET',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			...(token && { authorization: `Bearer ${token}` })
		}
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.then((json) => {
			return json;
		})
		.catch((err) => {
			error = getErrorDetail(err);
			console.error(err);
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const getChatListByFolderId = async (token: string, folderId: string, page: number = 1) => {
	let error = null;

	const searchParams = new URLSearchParams();
	if (page !== null) {
		searchParams.append('page', `${page}`);
	}

	const res = await fetch(
		`${WEBUI_API_BASE_URL}/chats/folder/${folderId}/list?${searchParams.toString()}`,
		{
			method: 'GET',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
				...(token && { authorization: `Bearer ${token}` })
			}
		}
	)
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.then((json) => {
			return json;
		})
		.catch((err) => {
			error = getErrorDetail(err);
			console.error(err);
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const getAllArchivedChats = async (token: string) => {
	return await getArchivedChatList(token);
};

export const getAllUserChats = async (token: string) => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/chats/all/db`, {
		method: 'GET',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			...(token && { authorization: `Bearer ${token}` })
		}
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.then((json) => {
			return json;
		})
		.catch((err) => {
			error = getErrorDetail(err);
			console.error(err);
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const getAllTags = async (token: string) => {
	const res = await fetch(`${WEBUI_API_BASE_URL}/chats/all/tags`, {
		method: 'GET',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			...(token && { authorization: `Bearer ${token}` })
		}
	})
		.then(async (res) => {
			if (!res.ok) return [];
			return res.json().catch(() => []);
		})
		.catch(() => []);

	return res || [];
};

export const getPinnedChatList = async (token: string = '') => {
	const res = await fetch(`${WEBUI_API_BASE_URL}/chats/pinned`, {
		method: 'GET',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			...(token && { authorization: `Bearer ${token}` })
		}
	})
		.then(async (res) => {
			if (!res.ok) return [];
			return res.json().catch(() => []);
		})
		.catch(() => []);

	return (res || []).map((chat) => ({
		...chat,
		time_range: getTimeRange(chat.updated_at)
	}));
};

export const getChatListByTagName = async (token: string = '', tagName: string) => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/chats/tags`, {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			...(token && { authorization: `Bearer ${token}` })
		},
		body: JSON.stringify({
			name: tagName
		})
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.then((json) => {
			return json;
		})
		.catch((err) => {
			error = getErrorDetail(err);
			console.error(err);
			return null;
		});

	if (error) {
		throw error;
	}

	return res.map((chat) => ({
		...chat,
		time_range: getTimeRange(chat.updated_at)
	}));
};

export const getChatById = async (token: string, id: string) => {
	if (!id) return null;

	// 1. Direct Local Storage check
	try {
		if (typeof window !== 'undefined') {
			const direct = localStorage.getItem(`aria_chat_${id}`);
			if (direct && direct.trim() !== '') {
				const parsed = JSON.parse(direct);
				if (parsed && (parsed.chat || parsed.messages || parsed.history)) return parsed;
			}

			const localSaved = localStorage.getItem('aria_local_chats');
			if (localSaved && localSaved.trim() !== '') {
				const parsed = JSON.parse(localSaved);
				if (Array.isArray(parsed)) {
					const found = parsed.find((c: any) => c.id === id);
					if (found && (found.chat || found.messages || found.history)) return found;
				}
			}
		}
	} catch (e) {}

	// 2. Firebase Realtime Database check
	try {
		const { fetchFirebaseSingleChat, fetchFirebaseUserChats } = await import('$lib/firebase');
		const singleChat = await fetchFirebaseSingleChat(undefined, id);
		if (singleChat && (singleChat.chat || singleChat.messages || singleChat.history)) {
			if (typeof window !== 'undefined') {
				localStorage.setItem(`aria_chat_${id}`, JSON.stringify(singleChat));
			}
			return singleChat;
		}

		const fbChats = await fetchFirebaseUserChats();
		if (Array.isArray(fbChats)) {
			const found = fbChats.find((c: any) => c.id === id);
			if (found && (found.chat || found.messages || found.history)) {
				if (typeof window !== 'undefined') {
					localStorage.setItem(`aria_chat_${id}`, JSON.stringify(found));
				}
				return found;
			}
		}
	} catch (e) {}

	return null;
};

export const getChatByShareId = async (token: string, share_id: string) => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/chats/share/${share_id}`, {
		method: 'GET',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			...(token && { authorization: `Bearer ${token}` })
		}
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.then((json) => {
			return json;
		})
		.catch((err) => {
			error = getErrorDetail(err);

			console.error(err);
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const getChatPinnedStatusById = async (token: string, id: string) => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/chats/${id}/pinned`, {
		method: 'GET',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			...(token && { authorization: `Bearer ${token}` })
		}
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.then((json) => {
			return json;
		})
		.catch((err) => {
			error = err;

			if ('detail' in err) {
				error = err.detail;
			} else {
				error = err;
			}

			console.error(err);
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const toggleChatPinnedStatusById = async (token: string, id: string) => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/chats/${id}/pin`, {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			...(token && { authorization: `Bearer ${token}` })
		}
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.then((json) => {
			return json;
		})
		.catch((err) => {
			error = err;

			if ('detail' in err) {
				error = err.detail;
			} else {
				error = err;
			}

			console.error(err);
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const markChatUnreadById = async (token: string, id: string) => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/chats/${id}/unread`, {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			...(token && { authorization: `Bearer ${token}` })
		}
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.catch((err) => {
			error = 'detail' in err ? err.detail : err;
			console.error(err);
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const markChatsRead = async (token: string) => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/chats/read`, {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			...(token && { authorization: `Bearer ${token}` })
		}
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.catch((err) => {
			error = 'detail' in err ? err.detail : err;
			console.error(err);
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const cloneChatById = async (token: string, id: string, title?: string) => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/chats/${id}/clone`, {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			...(token && { authorization: `Bearer ${token}` })
		},
		body: JSON.stringify({
			...(title && { title: title })
		})
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.then((json) => {
			return json;
		})
		.catch((err) => {
			error = err;

			if ('detail' in err) {
				error = err.detail;
			} else {
				error = err;
			}

			console.error(err);
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const forkChatById = async (token: string, id: string, messageId?: string | null) => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/chats/${id}/fork`, {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			...(token && { authorization: `Bearer ${token}` })
		},
		body: JSON.stringify({
			message_id: messageId ?? null
		})
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.then((json) => {
			return json;
		})
		.catch((err) => {
			error = err;

			if ('detail' in err) {
				error = err.detail;
			} else {
				error = err;
			}

			console.error(err);
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const cloneSharedChatById = async (token: string, id: string) => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/chats/${id}/clone/shared`, {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			...(token && { authorization: `Bearer ${token}` })
		}
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.then((json) => {
			return json;
		})
		.catch((err) => {
			error = err;

			if ('detail' in err) {
				error = err.detail;
			} else {
				error = err;
			}

			console.error(err);
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const shareChatById = async (token: string, id: string) => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/chats/${id}/share`, {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			...(token && { authorization: `Bearer ${token}` })
		}
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.then((json) => {
			return json;
		})
		.catch((err) => {
			error = getErrorDetail(err);

			console.error(err);
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const updateChatFolderIdById = async (token: string, id: string, folderId?: string) => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/chats/${id}/folder`, {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			...(token && { authorization: `Bearer ${token}` })
		},
		body: JSON.stringify({
			folder_id: folderId
		})
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.then((json) => {
			return json;
		})
		.catch((err) => {
			error = getErrorDetail(err);

			console.error(err);
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const archiveChatById = async (token: string, id: string) => {
	if (!id) return null;
	try {
		const chat = await getChatById(token, id);
		if (chat) {
			const updated = { ...chat, archived: true, is_archived: true };
			await updateChatById(token, id, updated);

			if (typeof window !== 'undefined') {
				const saved = localStorage.getItem('aria_archived_chats');
				const list = (saved && saved.trim() !== '') ? JSON.parse(saved) : [];
				const newList = [updated, ...list.filter((c: any) => c.id !== id)];
				localStorage.setItem('aria_archived_chats', JSON.stringify(newList));
			}
			return updated;
		}
	} catch (e) {}
	return { id, archived: true };
};

export const deleteSharedChatById = async (token: string, id: string) => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/chats/${id}/share`, {
		method: 'DELETE',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			...(token && { authorization: `Bearer ${token}` })
		}
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.then((json) => {
			return json;
		})
		.catch((err) => {
			error = getErrorDetail(err);

			console.error(err);
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const updateChatAccessGrants = async (token: string, id: string, accessGrants: object[]) => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/chats/shared/${id}/access/update`, {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			...(token && { authorization: `Bearer ${token}` })
		},
		body: JSON.stringify({
			access_grants: accessGrants
		})
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.then((json) => {
			return json;
		})
		.catch((err) => {
			error = getErrorDetail(err);

			console.error(err);
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const getChatAccessGrants = async (token: string, id: string) => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/chats/shared/${id}/access`, {
		method: 'GET',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			...(token && { authorization: `Bearer ${token}` })
		}
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.then((json) => {
			return json;
		})
		.catch((err) => {
			error = getErrorDetail(err);

			console.error(err);
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const updateChatById = async (
	token: string,
	id: string,
	chat: any,
	variables: object | null = null
) => {
	let updatedChat: any = null;
	try {
		if (typeof window !== 'undefined') {
			const savedList = localStorage.getItem('aria_local_chats');
			const list = (savedList && savedList.trim() !== '') ? JSON.parse(savedList) : [];
			const idx = list.findIndex((c: any) => c.id === id);
			
			// Always try to get the FULL chat from `aria_chat_${id}` first to avoid wiping history
			// when merging into a metadata-only entry from `aria_local_chats`.
			let existingFullChat = null;
			const savedFull = localStorage.getItem(`aria_chat_${id}`);
			if (savedFull && savedFull.trim() !== '') {
				existingFullChat = JSON.parse(savedFull);
			} else if (idx >= 0) {
				existingFullChat = list[idx];
			}

			const now = Math.floor(Date.now() / 1000);
			const mergedChatPayload = {
				...(existingFullChat?.chat || {}),
				...chat
			};

			updatedChat = {
				...(existingFullChat || {}),
				id,
				title: chat?.title || existingFullChat?.title || 'Nouvelle conversation',
				models: chat?.models || existingFullChat?.models || [],
				chat: mergedChatPayload,
				variables: variables ?? existingFullChat?.variables ?? {},
				created_at: existingFullChat?.created_at || now,
				updated_at: now
			};

			if (idx >= 0) {
				list[idx] = updatedChat;
			} else {
				list.unshift(updatedChat);
			}

			localStorage.setItem(`aria_chat_${id}`, JSON.stringify(updatedChat));
			localStorage.setItem('aria_local_chats', JSON.stringify(list));
			
			const { saveFirebaseUserChats, saveFirebaseSingleChat } = await import('$lib/firebase');
			await Promise.all([
				saveFirebaseUserChats(undefined, list),
				saveFirebaseSingleChat(undefined, id, updatedChat)
			]);
		}
	} catch (e) {
		console.warn('Error updating chat in localStorage/Firebase:', e);
	}

	return updatedChat || { id, chat };
};

export const compactChatById = async (token: string, id: string, model?: string | null) => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/chats/${id}/compact`, {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			...(token && { authorization: `Bearer ${token}` })
		},
		body: JSON.stringify({ model })
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.then((json) => {
			return json;
		})
		.catch((err) => {
			error = getErrorDetail(err);

			console.error(err);
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const deleteChatMessageById = async (token: string, id: string, messageId: string) => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/chats/${id}/messages/${messageId}`, {
		method: 'DELETE',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			...(token && { authorization: `Bearer ${token}` })
		}
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.catch((err) => {
			error = getErrorDetail(err);
			console.error(err);
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const resolveChatMessageToolCall = async (
	token: string,
	id: string,
	messageId: string,
	callId: string,
	action: 'approve' | 'reject' | 'answer',
	options: { answers?: unknown; timed_out?: boolean } = {}
) => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/chats/${id}/messages/${messageId}/resolve`, {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			...(token && { authorization: `Bearer ${token}` })
		},
		body: JSON.stringify({
			call_id: callId,
			action,
			...options
		})
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.catch((err) => {
			error = getErrorDetail(err);
			console.error(err);
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const deleteChatById = async (token: string, id: string) => {
	// Remove from local & Firebase storage
	try {
		if (typeof window !== 'undefined') {
			localStorage.removeItem(`aria_chat_${id}`);
			const saved = localStorage.getItem('aria_local_chats');
			if (saved && saved.trim() !== '') {
				const list = JSON.parse(saved);
				const updated = list.filter((c: any) => c.id !== id);
				localStorage.setItem('aria_local_chats', JSON.stringify(updated));
				const { saveFirebaseUserChats, deleteFirebaseSingleChat } = await import('$lib/firebase');
				await Promise.all([
					saveFirebaseUserChats(undefined, updated),
					deleteFirebaseSingleChat(undefined, id)
				]);
			}
		}
	} catch (e) {}

	return true;
};

export const getTagsById = async (token: string, id: string) => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/chats/${id}/tags`, {
		method: 'GET',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			...(token && { authorization: `Bearer ${token}` })
		}
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.then((json) => {
			return json;
		})
		.catch((err) => {
			error = getErrorDetail(err);

			console.error(err);
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const addTagById = async (token: string, id: string, tagName: string) => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/chats/${id}/tags`, {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			...(token && { authorization: `Bearer ${token}` })
		},
		body: JSON.stringify({
			name: tagName
		})
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.then((json) => {
			return json;
		})
		.catch((err) => {
			error = err.detail;
			console.error(err);
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const deleteTagById = async (token: string, id: string, tagName: string) => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/chats/${id}/tags`, {
		method: 'DELETE',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			...(token && { authorization: `Bearer ${token}` })
		},
		body: JSON.stringify({
			name: tagName
		})
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.then((json) => {
			return json;
		})
		.catch((err) => {
			error = getErrorDetail(err);

			console.error(err);
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const deleteAllChats = async (token: string) => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/chats/`, {
		method: 'DELETE',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			...(token && { authorization: `Bearer ${token}` })
		}
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.then((json) => {
			return json;
		})
		.catch((err) => {
			error = err.detail;

			console.error(err);
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const archiveAllChats = async (token: string) => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/chats/archive/all`, {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			...(token && { authorization: `Bearer ${token}` })
		}
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.then((json) => {
			return json;
		})
		.catch((err) => {
			error = err.detail;

			console.error(err);
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};
export const exportChatStats = async (token: string, page: number = 1, params: object = {}) => {
	let error = null;

	const searchParams = new URLSearchParams();
	searchParams.append('page', `${page}`);

	if (params) {
		for (const [key, value] of Object.entries(params)) {
			searchParams.append(key, `${value}`);
		}
	}

	const res = await fetch(`${WEBUI_API_BASE_URL}/chats/stats/export?${searchParams.toString()}`, {
		method: 'GET',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			...(token && { authorization: `Bearer ${token}` })
		}
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.then((json) => {
			return json;
		})
		.catch((err) => {
			error = getErrorDetail(err);
			console.error(err);
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const exportSingleChatStats = async (token: string, chatId: string) => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/chats/stats/export/${chatId}`, {
		method: 'GET',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			...(token && { authorization: `Bearer ${token}` })
		}
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.then((json) => {
			return json;
		})
		.catch((err) => {
			error = getErrorDetail(err);
			console.error(err);
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const downloadChatStats = async (
	token: string = '',
	updated_at: number | null = null
): Promise<[Response | null, AbortController]> => {
	const controller = new AbortController();
	let error = null;

	let url = `${WEBUI_API_BASE_URL}/chats/stats/export?stream=true`;
	if (updated_at) url += `&updated_at=${updated_at}`;

	const res = await fetch(url, {
		signal: controller.signal,
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`
		}
	}).catch((err) => {
		console.error(err);
		error = getErrorDetail(err);
		return null;
	});

	if (error) {
		throw error;
	}

	return [res, controller];
};
