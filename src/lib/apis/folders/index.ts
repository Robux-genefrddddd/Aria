import { auth, getAuthParam } from '$lib/firebase';

type FolderForm = {
	name?: string;
	data?: Record<string, any>;
	meta?: Record<string, any>;
	parent_id?: string | null;
};

const getTargetUid = (): string => {
	if (auth.currentUser?.uid) return auth.currentUser.uid;
	if (typeof window !== 'undefined') {
		const storedUid = localStorage.getItem('aria_uid');
		if (storedUid) return storedUid;
		const userRaw = localStorage.getItem('aria_user');
		if (userRaw && userRaw.trim() !== '') {
			try {
				const u = JSON.parse(userRaw);
				if (u?.id || u?.uid) return u.id || u.uid;
			} catch {}
		}
	}
	return 'QH8wKG8nWZVtUQEy2pppuBuNZgC3';
};

export const createNewFolder = async (token: string, folderForm: FolderForm) => {
	const folderId = (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `folder-${Date.now()}`);
	const uid = getTargetUid();
	const authParam = await getAuthParam();
	const now = Math.floor(Date.now() / 1000);

	const newFolder = {
		id: folderId,
		name: folderForm.name || 'Nouveau dossier',
		data: folderForm.data || {},
		meta: folderForm.meta || {},
		parent_id: folderForm.parent_id || null,
		is_expanded: false,
		created_at: now,
		updated_at: now
	};

	try {
		await fetch(
			`https://vostockfr-3b08c-default-rtdb.firebaseio.com/users/${uid}/folders/${folderId}.json${authParam}`,
			{
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(newFolder)
			}
		);
	} catch (e) {}

	return newFolder;
};

export const getFolders = async (token: string = '') => {
	const uid = getTargetUid();
	try {
		const authParam = await getAuthParam();
		const res = await fetch(
			`https://vostockfr-3b08c-default-rtdb.firebaseio.com/users/${uid}/folders.json${authParam}`
		);
		if (res.ok) {
			const data = await res.json();
			if (data && typeof data === 'object') {
				return Array.isArray(data) ? data.filter(Boolean) : Object.values(data);
			}
		}
	} catch (e) {}
	return [];
};

export const getFolderById = async (token: string, id: string) => {
	const uid = getTargetUid();
	try {
		const authParam = await getAuthParam();
		const res = await fetch(
			`https://vostockfr-3b08c-default-rtdb.firebaseio.com/users/${uid}/folders/${id}.json${authParam}`
		);
		if (res.ok) {
			return await res.json();
		}
	} catch (e) {}
	return null;
};

export const updateFolderById = async (token: string, id: string, folderForm: FolderForm) => {
	const uid = getTargetUid();
	try {
		const authParam = await getAuthParam();
		const existing = await getFolderById(token, id);
		const updated = {
			...(existing || {}),
			id,
			name: folderForm.name || existing?.name || 'Dossier',
			data: folderForm.data || existing?.data || {},
			meta: folderForm.meta || existing?.meta || {},
			parent_id: folderForm.parent_id !== undefined ? folderForm.parent_id : existing?.parent_id ?? null,
			updated_at: Math.floor(Date.now() / 1000)
		};
		await fetch(
			`https://vostockfr-3b08c-default-rtdb.firebaseio.com/users/${uid}/folders/${id}.json${authParam}`,
			{
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(updated)
			}
		);
		return updated;
	} catch (e) {
		return null;
	}
};

export const updateFolderIsExpandedById = async (
	token: string,
	id: string,
	isExpanded: boolean
) => {
	const uid = getTargetUid();
	try {
		const authParam = await getAuthParam();
		await fetch(
			`https://vostockfr-3b08c-default-rtdb.firebaseio.com/users/${uid}/folders/${id}.json${authParam}`,
			{
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ is_expanded: isExpanded })
			}
		);
	} catch (e) {}
	return true;
};

export const updateFolderParentIdById = async (token: string, id: string, parentId?: string) => {
	const uid = getTargetUid();
	try {
		const authParam = await getAuthParam();
		await fetch(
			`https://vostockfr-3b08c-default-rtdb.firebaseio.com/users/${uid}/folders/${id}.json${authParam}`,
			{
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ parent_id: parentId ?? null })
			}
		);
	} catch (e) {}
	return true;
};

export const deleteFolderById = async (token: string, id: string, deleteContents: boolean) => {
	const uid = getTargetUid();
	try {
		const authParam = await getAuthParam();
		await fetch(
			`https://vostockfr-3b08c-default-rtdb.firebaseio.com/users/${uid}/folders/${id}.json${authParam}`,
			{ method: 'DELETE' }
		);
	} catch (e) {}
	return true;
};

export const markFolderChatsReadById = async (token: string, id: string) => {
	return true;
};

export const updateFolderAccessById = async (token: string, id: string, accessGrants: any[]) => {
	return true;
};

export const getSharedFolders = async (token: string) => {
	return [];
};

export const getSharedFolderChats = async (
	token: string,
	folderId: string,
	params: { page?: number | null; sortBy?: string; sortDir?: string } = {}
) => {
	return [];
};
