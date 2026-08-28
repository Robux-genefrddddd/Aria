import { WEBUI_API_BASE_URL } from '$lib/constants';

const RTDB_BASE_URL = 'https://keysystem-d0b86-8df89-default-rtdb.europe-west1.firebasedatabase.app';

const getCurrentUserInfo = () => {
	try {
		if (typeof window !== 'undefined') {
			const userStr = localStorage.getItem('aria_user');
			if (userStr && userStr.trim() !== '') {
				const u = JSON.parse(userStr);
				if (u) {
					return {
						id: u.id || u.uid || 'QH8wKG8nWZVtUQEy2pppuBuNZgC3',
						name: u.name || u.displayName || 'Utilisateur',
						email: u.email || 'contact@pincorpsstudio.site',
						profile_image_url: u.profile_image_url || u.photoURL || '/User.avif'
					};
				}
			}
		}
	} catch (e) {}
	return {
		id: 'QH8wKG8nWZVtUQEy2pppuBuNZgC3',
		name: 'MrPinPinYT',
		email: 'contact@pincorpsstudio.site',
		profile_image_url: '/User.avif'
	};
};

export const getConfig = async (token: string = '') => {
	try {
		const res = await fetch(`${RTDB_BASE_URL}/evaluations_config.json`);
		if (res.ok) {
			const data = await res.json();
			if (data) return data;
		}
	} catch (e) {}
	return { enable_evaluations: true };
};

export const updateConfig = async (token: string, config: object) => {
	try {
		await fetch(`${RTDB_BASE_URL}/evaluations_config.json`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(config)
		});
	} catch (e) {}
	return config;
};

export const getLeaderboard = async (token: string = '', query: string = '') => {
	try {
		const res = await fetch(`${RTDB_BASE_URL}/feedbacks.json`);
		if (res.ok) {
			const data = await res.json();
			if (data && typeof data === 'object') {
				const feedbacks: any[] = Object.values(data);
				const modelStats: Record<string, { total_rating: number; count: number; model_id: string }> = {};

				feedbacks.forEach((f) => {
					const mId = f.data?.model_id || f.meta?.model_id || 'aria-basic';
					const rating = Number(f.data?.rating ?? 0);
					if (!modelStats[mId]) {
						modelStats[mId] = { total_rating: 0, count: 0, model_id: mId };
					}
					modelStats[mId].total_rating += rating;
					modelStats[mId].count += 1;
				});

				const entries = Object.values(modelStats).map((s) => ({
					model_id: s.model_id,
					score: s.count > 0 ? (s.total_rating / s.count).toFixed(2) : '0',
					evaluations_count: s.count
				}));

				return { entries };
			}
		}
	} catch (e) {}

	return { entries: [] };
};

export const getModelHistory = async (token: string = '', modelId: string, days: number = 30) => {
	return [];
};

export const getFeedbackModelIds = async (token: string = '') => {
	try {
		const res = await fetch(`${RTDB_BASE_URL}/feedbacks.json`);
		if (res.ok) {
			const data = await res.json();
			if (data && typeof data === 'object') {
				const list: any[] = Object.values(data);
				const modelIdsSet = new Set<string>();
				list.forEach((f) => {
					if (f.data?.model_id) modelIdsSet.add(f.data.model_id);
					if (f.meta?.model_id) modelIdsSet.add(f.meta.model_id);
					if (Array.isArray(f.data?.sibling_model_ids)) {
						f.data.sibling_model_ids.forEach((id: string) => modelIdsSet.add(id));
					}
				});
				return Array.from(modelIdsSet);
			}
		}
	} catch (e) {}

	return [];
};

export const getFeedbackItems = async (
	token: string = '',
	orderBy: string = 'updated_at',
	direction: 'asc' | 'desc' = 'desc',
	page: number = 1,
	modelId: string = ''
) => {
	let list: any[] = [];

	try {
		const res = await fetch(`${RTDB_BASE_URL}/feedbacks.json`);
		if (res.ok) {
			const data = await res.json();
			if (data && typeof data === 'object') {
				list = Object.values(data);
			}
		}
	} catch (e) {
		console.warn('Failed to fetch feedbacks from Firebase:', e);
	}

	if (list.length === 0 && typeof window !== 'undefined') {
		try {
			const saved = localStorage.getItem('aria_feedbacks');
			if (saved && saved.trim() !== '') {
				list = JSON.parse(saved);
			}
		} catch (e) {}
	}

	// Filter by modelId if specified
	if (modelId) {
		list = list.filter(
			(f: any) =>
				f.data?.model_id === modelId ||
				f.meta?.model_id === modelId ||
				(Array.isArray(f.data?.sibling_model_ids) && f.data.sibling_model_ids.includes(modelId))
		);
	}

	// Sort list
	list.sort((a: any, b: any) => {
		let valA = a[orderBy] ?? a.data?.[orderBy] ?? a.meta?.[orderBy] ?? 0;
		let valB = b[orderBy] ?? b.data?.[orderBy] ?? b.meta?.[orderBy] ?? 0;

		if (orderBy === 'user') {
			valA = a.user?.name || '';
			valB = b.user?.name || '';
		} else if (orderBy === 'rating') {
			valA = Number(a.data?.rating ?? 0);
			valB = Number(b.data?.rating ?? 0);
		}

		if (valA < valB) return direction === 'asc' ? -1 : 1;
		if (valA > valB) return direction === 'asc' ? 1 : -1;
		return 0;
	});

	const limit = 20;
	const startIndex = (page - 1) * limit;
	const paginatedItems = list.slice(startIndex, startIndex + limit);

	return {
		items: paginatedItems,
		total: list.length
	};
};

export const exportAllFeedbacks = async (token: string = '', modelId: string = '') => {
	try {
		const res = await fetch(`${RTDB_BASE_URL}/feedbacks.json`);
		if (res.ok) {
			const data = await res.json();
			if (data && typeof data === 'object') {
				let list: any[] = Object.values(data);
				if (modelId) {
					list = list.filter(
						(f: any) =>
							f.data?.model_id === modelId ||
							f.meta?.model_id === modelId ||
							(Array.isArray(f.data?.sibling_model_ids) && f.data.sibling_model_ids.includes(modelId))
					);
				}
				return list;
			}
		}
	} catch (e) {}

	return [];
};

export const createNewFeedback = async (token: string, feedbackData: any) => {
	const feedbackId =
		typeof crypto !== 'undefined' && crypto.randomUUID
			? crypto.randomUUID()
			: `fb-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

	const now = Math.floor(Date.now() / 1000);
	const userInfo = getCurrentUserInfo();

	const feedbackItem = {
		id: feedbackId,
		user_id: userInfo.id,
		user: userInfo,
		type: feedbackData?.type || 'rating',
		data: feedbackData?.data || {},
		meta: feedbackData?.meta || {},
		snapshot: feedbackData?.snapshot || {},
		created_at: now,
		updated_at: now
	};

	try {
		await fetch(`${RTDB_BASE_URL}/feedbacks/${feedbackId}.json`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(feedbackItem)
		});

		if (typeof window !== 'undefined') {
			const saved = localStorage.getItem('aria_feedbacks');
			const list = saved && saved.trim() !== '' ? JSON.parse(saved) : [];
			list.unshift(feedbackItem);
			localStorage.setItem('aria_feedbacks', JSON.stringify(list));
		}
	} catch (e) {
		console.warn('Failed to save feedback to Firebase:', e);
	}

	return feedbackItem;
};

export const getFeedbackById = async (token: string, feedbackId: string) => {
	if (!feedbackId) return null;
	try {
		const res = await fetch(`${RTDB_BASE_URL}/feedbacks/${feedbackId}.json`);
		if (res.ok) {
			const data = await res.json();
			if (data) return data;
		}
	} catch (e) {}

	if (typeof window !== 'undefined') {
		try {
			const saved = localStorage.getItem('aria_feedbacks');
			if (saved && saved.trim() !== '') {
				const list = JSON.parse(saved);
				const found = list.find((f: any) => f.id === feedbackId);
				if (found) return found;
			}
		} catch (e) {}
	}

	return null;
};

export const updateFeedbackById = async (token: string, feedbackId: string, feedbackData: any) => {
	if (!feedbackId) return null;
	const now = Math.floor(Date.now() / 1000);

	let existing: any = null;
	try {
		const res = await fetch(`${RTDB_BASE_URL}/feedbacks/${feedbackId}.json`);
		if (res.ok) {
			existing = await res.json();
		}
	} catch (e) {}

	const updatedItem = {
		...(existing || {}),
		id: feedbackId,
		type: feedbackData?.type || existing?.type || 'rating',
		data: { ...(existing?.data || {}), ...(feedbackData?.data || {}) },
		meta: { ...(existing?.meta || {}), ...(feedbackData?.meta || {}) },
		snapshot: { ...(existing?.snapshot || {}), ...(feedbackData?.snapshot || {}) },
		updated_at: now
	};

	try {
		await fetch(`${RTDB_BASE_URL}/feedbacks/${feedbackId}.json`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(updatedItem)
		});

		if (typeof window !== 'undefined') {
			const saved = localStorage.getItem('aria_feedbacks');
			const list = saved && saved.trim() !== '' ? JSON.parse(saved) : [];
			const idx = list.findIndex((f: any) => f.id === feedbackId);
			if (idx >= 0) {
				list[idx] = updatedItem;
			} else {
				list.unshift(updatedItem);
			}
			localStorage.setItem('aria_feedbacks', JSON.stringify(list));
		}
	} catch (e) {
		console.warn('Failed to update feedback in Firebase:', e);
	}

	return updatedItem;
};

export const deleteFeedbackById = async (token: string, feedbackId: string) => {
	if (!feedbackId) return false;
	try {
		await fetch(`${RTDB_BASE_URL}/feedbacks/${feedbackId}.json`, {
			method: 'DELETE'
		});

		if (typeof window !== 'undefined') {
			const saved = localStorage.getItem('aria_feedbacks');
			if (saved && saved.trim() !== '') {
				const list = JSON.parse(saved);
				const updated = list.filter((f: any) => f.id !== feedbackId);
				localStorage.setItem('aria_feedbacks', JSON.stringify(updated));
			}
		}
	} catch (e) {}

	return true;
};
