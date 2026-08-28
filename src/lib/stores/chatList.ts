import { get, readonly, writable } from 'svelte/store';
import { getChatList, getPinnedChatList } from '$lib/apis/chats';
import { getTimeRange } from '$lib/utils';

type ChatListItem = {
	id: string;
	[key: string]: unknown;
};

const getInitialChats = (): ChatListItem[] => {
	if (typeof window !== 'undefined') {
		try {
			const saved = localStorage.getItem('aria_local_chats');
			if (saved) {
				const parsed = JSON.parse(saved);
				if (Array.isArray(parsed)) {
					return parsed.map((chat) => ({
						...chat,
						time_range: getTimeRange(chat.updated_at || Date.now())
					}));
				}
			}
		} catch (e) {}
	}
	return [];
};

const chatsStore = writable<ChatListItem[]>(getInitialChats());
const pinnedChatsStore = writable<ChatListItem[]>([]);

export const chats = readonly(chatsStore);
export const pinnedChats = readonly(pinnedChatsStore);

let currentPage = 1;
let paginationReady = false;
let requestGeneration = 0;
let allLoaded = false;
let loadingNextPage = false;

type RefreshChatListOptions = {
	refreshPinned?: boolean;
	clearPinned?: boolean;
};

type ChatListResult = {
	accepted: boolean;
	allLoaded: boolean;
};

export const refreshChatList = async (
	token: string = '',
	options: RefreshChatListOptions = {}
): Promise<ChatListResult> => {
	const generation = ++requestGeneration;
	paginationReady = false;
	loadingNextPage = false;

	let nextChats: ChatListItem[] = [];
	let nextPinnedChats: ChatListItem[] | undefined;

	try {
		const results = await Promise.all([
			getChatList(token, 1).catch(() => []),
			options.refreshPinned && !options.clearPinned
				? getPinnedChatList(token).catch(() => [])
				: Promise.resolve(undefined)
		]);
		nextChats = (Array.isArray(results[0]) ? results[0] : []) as ChatListItem[];
		nextPinnedChats = results[1] as ChatListItem[] | undefined;
	} catch {
		nextChats = [];
	}

	if (generation !== requestGeneration) {
		return { accepted: false, allLoaded };
	}

	if (nextChats.length > 0) {
		chatsStore.set(nextChats);
		allLoaded = true;
	} else {
		const current = get(chatsStore);
		if (!current || current.length === 0) {
			const initial = getInitialChats();
			if (initial.length > 0) {
				chatsStore.set(initial);
			}
		}
		allLoaded = true;
	}

	currentPage = 1;

	if (options.clearPinned) {
		pinnedChatsStore.set([]);
	} else if (options.refreshPinned) {
		pinnedChatsStore.set(nextPinnedChats ?? []);
	}

	paginationReady = true;
	return { accepted: true, allLoaded };
};

// The sidebar owns folder state. This bridge lets other components refresh it.
type FolderRefreshHandler = (folderId?: string | null, chat?: ChatListItem | null) => unknown;
const folderRefreshHandlers = new Set<FolderRefreshHandler>();

export const registerFolderRefreshHandler = (handler: FolderRefreshHandler) => {
	folderRefreshHandlers.add(handler);
	return () => {
		folderRefreshHandlers.delete(handler);
	};
};

export const refreshFolderChatLists = async (
	folderId?: string | null,
	chat?: ChatListItem | null
) => {
	await Promise.all([...folderRefreshHandlers].map((handler) => handler(folderId, chat)));
};

export const loadNextChatListPage = async (token: string = ''): Promise<ChatListResult> => {
	if (!paginationReady || allLoaded || loadingNextPage) {
		return { accepted: false, allLoaded };
	}

	const generation = requestGeneration;
	const nextPage = currentPage + 1;
	loadingNextPage = true;

	try {
		const nextChats = (await getChatList(token, nextPage)) as ChatListItem[];

		if (generation !== requestGeneration) {
			return { accepted: false, allLoaded };
		}

		allLoaded = nextChats.length === 0;
		currentPage = nextPage;

		const existingIds = new Set((get(chatsStore) ?? []).map((chat) => chat.id));
		const uniqueChats = nextChats.filter((chat) => !existingIds.has(chat.id));
		chatsStore.set([...(get(chatsStore) ?? []), ...uniqueChats]);

		return { accepted: true, allLoaded };
	} finally {
		loadingNextPage = false;
	}
};

export const setChatActive = (chatId: string, active: boolean): boolean => {
	let found = false;
	const updateChat = (chat: ChatListItem) => {
		if (chat.id !== chatId) {
			return chat;
		}
		found = true;
		return { ...chat, active };
	};

	chatsStore.update((items) => (items ? items.map(updateChat) : items));
	pinnedChatsStore.update((items) => items.map(updateChat));
	return found;
};

export const setChatReadAt = (chatId: string, lastReadAt: number): boolean => {
	let found = false;
	const updateChat = (chat: ChatListItem) => {
		if (chat.id !== chatId) {
			return chat;
		}
		found = true;
		return { ...chat, last_read_at: lastReadAt };
	};

	chatsStore.update((items) => (items ? items.map(updateChat) : items));
	pinnedChatsStore.update((items) => items.map(updateChat));
	return found;
};

export const setAllChatsRead = () => {
	const updateChat = (chat: ChatListItem) => ({ ...chat, last_read_at: chat.updated_at });

	chatsStore.update((items) => (items ? items.map(updateChat) : items));
	pinnedChatsStore.update((items) => items.map(updateChat));
};

export const resetChatListState = () => {
	requestGeneration += 1;
	currentPage = 1;
	paginationReady = false;
	allLoaded = false;
	loadingNextPage = false;
	chatsStore.set(null);
	pinnedChatsStore.set([]);
};

export const addOrUpdateChatInList = (chatItem: ChatListItem) => {
	if (!chatItem || !chatItem.id) return;
	chatsStore.update((items) => {
		const list = items ?? [];
		const normalizedItem = {
			...chatItem,
			updated_at: chatItem.updated_at || Math.floor(Date.now() / 1000),
			created_at: chatItem.created_at || Math.floor(Date.now() / 1000),
			time_range: chatItem.time_range || getTimeRange(chatItem.updated_at || Math.floor(Date.now() / 1000))
		};

		const index = list.findIndex((c) => c.id === chatItem.id);
		let updated: ChatListItem[];
		if (index >= 0) {
			updated = [...list];
			updated[index] = { ...updated[index], ...normalizedItem };
		} else {
			updated = [normalizedItem, ...list];
		}

		try {
			if (typeof window !== 'undefined') {
				localStorage.setItem('aria_local_chats', JSON.stringify(updated));
				// Sync chats list to Firebase Realtime Database
				import('$lib/firebase').then(({ saveFirebaseUserChats }) => {
					saveFirebaseUserChats(undefined, updated);
				});
			}
		} catch (e) {}

		return updated;
	});
};

export const deleteChatFromList = (chatId: string) => {
	if (!chatId) return;
	chatsStore.update((items) => {
		const list = items ?? [];
		const updated = list.filter((c) => c.id !== chatId);
		try {
			if (typeof window !== 'undefined') {
				localStorage.setItem('aria_local_chats', JSON.stringify(updated));
				localStorage.removeItem(`aria_chat_${chatId}`);
				import('$lib/firebase').then(({ saveFirebaseUserChats, deleteFirebaseSingleChat }) => {
					saveFirebaseUserChats(undefined, updated);
					deleteFirebaseSingleChat(undefined, chatId);
				});
			}
		} catch (e) {}
		return updated;
	});
	pinnedChatsStore.update((items) => items.filter((c) => c.id !== chatId));
};
