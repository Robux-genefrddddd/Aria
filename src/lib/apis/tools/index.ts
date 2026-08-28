import { getAuthParam } from '$lib/firebase';

export const createNewTool = async (token: string, tool: any) => {
	const toolId = tool?.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `tool-${Date.now()}`);
	const newTool = { ...tool, id: toolId, updated_at: Math.floor(Date.now() / 1000) };
	try {
		const authParam = await getAuthParam();
		await fetch(
			`https://vostockfr-3b08c-default-rtdb.firebaseio.com/public_configs/tools/${toolId}.json${authParam}`,
			{
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(newTool)
			}
		);
	} catch (e) {}
	return newTool;
};

export const loadToolByUrl = async (token: string = '', url: string) => {
	return null;
};

export const getTools = async (token: string = '', query: string | null = null) => {
	try {
		const { getAuthParam } = await import('$lib/firebase');
		const authParam = await getAuthParam();
		const res = await fetch(
			`https://vostockfr-3b08c-default-rtdb.firebaseio.com/public_configs/tools.json${authParam}`
		);
		if (res.status === 401) return [];
		if (res.ok) {
			const data = await res.json();
			if (data && typeof data === 'object') {
				const list = Array.isArray(data) ? data.filter(Boolean) : Object.values(data);
				if (query) {
					const q = query.toLowerCase();
					return list.filter((t: any) => (t?.name || '').toLowerCase().includes(q));
				}
				return list;
			}
		}
	} catch (e) {}
	return [];
};

export const getToolList = async (token: string = '') => {
	return getTools(token);
};

export const exportTools = async (token: string = '') => {
	return getTools(token);
};

export const getToolById = async (token: string, id: string) => {
	try {
		const authParam = await getAuthParam();
		const res = await fetch(
			`https://vostockfr-3b08c-default-rtdb.firebaseio.com/public_configs/tools/${id}.json${authParam}`
		);
		if (res.ok) return await res.json();
	} catch (e) {}
	return null;
};

export const updateToolById = async (token: string, id: string, tool: object) => {
	try {
		const authParam = await getAuthParam();
		const existing = await getToolById(token, id);
		const updated = { ...(existing || {}), ...tool, id, updated_at: Math.floor(Date.now() / 1000) };
		await fetch(
			`https://vostockfr-3b08c-default-rtdb.firebaseio.com/public_configs/tools/${id}.json${authParam}`,
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

export const updateToolAccessGrants = async (token: string, id: string, accessGrants: any[]) => {
	return true;
};

export const deleteToolById = async (token: string, id: string) => {
	try {
		const authParam = await getAuthParam();
		await fetch(
			`https://vostockfr-3b08c-default-rtdb.firebaseio.com/public_configs/tools/${id}.json${authParam}`,
			{ method: 'DELETE' }
		);
	} catch (e) {}
	return true;
};

export const getToolValvesById = async (token: string, id: string) => {
	return {};
};

export const getToolValvesSpecById = async (token: string, id: string) => {
	return {};
};

export const updateToolValvesById = async (token: string, id: string, valves: object) => {
	return valves;
};

export const getUserValvesById = async (token: string, id: string) => {
	return {};
};

export const getUserValvesSpecById = async (token: string, id: string) => {
	return {};
};

export const updateUserValvesById = async (token: string, id: string, valves: object) => {
	return valves;
};
