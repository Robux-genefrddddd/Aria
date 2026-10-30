import { browser } from '$app/environment';

export interface CustomSkill {
	id: string;
	name: string;
	description: string;
	system: string;
	profile_image_url?: string;
	visibility: 'public' | 'private';
	user_id: string;
	user_name: string;
	created_at: number;
	updated_at: number;
	tags?: string[];
}

export const OWNER_UIDS = ['QH8wKG8nWZVtUQEy2pppuBuNZgC3'];

export const DEFAULT_FOUNDER_SKILLS: CustomSkill[] = [
	{
		id: 'skill-luau-architect',
		name: 'Roblox Luau Architect',
		description: 'Expert en architecture de jeux Roblox Studio, modularité Knit/Services et typage strict Luau 2026.',
		system: `Tu es Roblox Luau Architect, un mentor en programmation Luau de niveau AAA.
Tu guides sur la hiérarchie ServerScriptService/ReplicatedStorage, le typage strict (--!strict) et les patterns de production (ProfileService, EventBus, FSM).
Fournis toujours du code modulaire, typé et sécurisé.`,
		profile_image_url: '/static/favicon.png',
		visibility: 'public',
		user_id: 'QH8wKG8nWZVtUQEy2pppuBuNZgC3',
		user_name: 'Fondateur',
		created_at: 1772496000,
		updated_at: 1772496000,
		tags: ['Roblox', 'Luau', 'Architecture']
	},
	{
		id: 'skill-game-design-retention',
		name: 'Game Design & Retention Pro',
		description: 'Directeur créatif spécialisé dans la rétention D1/D7, les boucles de dopamine 0-15s et la méta Roblox.',
		system: `Tu es un Directeur de Game Design Roblox chevronné.
Tu analyses les core loops (0-15s), le pacing de session (15-30m) et les leviers de rétention virale (social flex, raretés asymétriques, rebirths).
Aide à transformer n'importe quel concept en hit addictif et équilibré.`,
		profile_image_url: '/static/favicon.png',
		visibility: 'public',
		user_id: 'QH8wKG8nWZVtUQEy2pppuBuNZgC3',
		user_name: 'Fondateur',
		created_at: 1772500000,
		updated_at: 1772500000,
		tags: ['Game Design', 'Rétention', 'Monétisation']
	},
	{
		id: 'skill-anti-exploit-security',
		name: 'Anti-Exploit & Netcode Hardening',
		description: 'Skill exclusif pour auditer la sécurité des RemoteEvents, les rate-limits token-bucket et les sanity checks.',
		system: `Tu es un Ingénieur Sécurité Roblox & Netcode autoritaire.
Règle d'or : Ne jamais faire confiance au client.
Audit de vulnérabilités, RemoteEvent token-bucket rate limiting et synchronisation sans faille.`,
		profile_image_url: '/static/favicon.png',
		visibility: 'private',
		user_id: 'QH8wKG8nWZVtUQEy2pppuBuNZgC3',
		user_name: 'Fondateur',
		created_at: 1772510000,
		updated_at: 1772510000,
		tags: ['Sécurité', 'Anti-Exploit', 'Privé']
	}
];

const RTDB_URL = 'https://vostockfr-3b08c-default-rtdb.firebaseio.com/custom_skills.json';

/** Récupère tous les custom skills (Firebase + LocalStorage + Defaults) */
export const getCustomSkills = async (): Promise<CustomSkill[]> => {
	let list: CustomSkill[] = [];

	// 1. Lire depuis LocalStorage
	if (browser) {
		try {
			const localRaw = localStorage.getItem('aria_custom_skills');
			if (localRaw) {
				const parsed = JSON.parse(localRaw);
				if (Array.isArray(parsed)) list = parsed;
			}
		} catch (e) {}
	}

	// 2. Synchroniser avec Firebase Realtime DB
	try {
		const res = await fetch(RTDB_URL);
		if (res.ok) {
			const data = await res.json();
			if (data && typeof data === 'object') {
				const remoteList: CustomSkill[] = Object.values(data);
				// Fusionner sans doublons
				remoteList.forEach((remoteSkill) => {
					const idx = list.findIndex((s) => s.id === remoteSkill.id);
					if (idx >= 0) {
						list[idx] = { ...list[idx], ...remoteSkill };
					} else {
						list.push(remoteSkill);
					}
				});
			}
		}
	} catch (e) {}

	// 3. Si vide, injecter les skills de base du fondateur
	if (list.length === 0) {
		list = [...DEFAULT_FOUNDER_SKILLS];
	} else {
		// S'assurer que les skills du fondateur existent
		DEFAULT_FOUNDER_SKILLS.forEach((founderSkill) => {
			if (!list.some((s) => s.id === founderSkill.id)) {
				list.push(founderSkill);
			}
		});
	}

	if (browser) {
		try {
			localStorage.setItem('aria_custom_skills', JSON.stringify(list));
		} catch (e) {}
	}

	return list;
};

/** Enregistre ou met à jour un Skill */
export const saveCustomSkill = async (skill: CustomSkill): Promise<CustomSkill> => {
	const skills = await getCustomSkills();
	const idx = skills.findIndex((s) => s.id === skill.id);
	if (idx >= 0) {
		skills[idx] = { ...skills[idx], ...skill, updated_at: Date.now() };
	} else {
		skills.unshift({ ...skill, created_at: Date.now(), updated_at: Date.now() });
	}

	if (browser) {
		try {
			localStorage.setItem('aria_custom_skills', JSON.stringify(skills));
		} catch (e) {}
	}

	// Sauvegarder dans Firebase Realtime DB
	try {
		await fetch(`https://vostockfr-3b08c-default-rtdb.firebaseio.com/custom_skills/${skill.id}.json`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(skill)
		});
	} catch (e) {}

	return skill;
};

/** Supprime un Skill */
export const deleteCustomSkill = async (skillId: string): Promise<boolean> => {
	const skills = await getCustomSkills();
	const filtered = skills.filter((s) => s.id !== skillId);

	if (browser) {
		try {
			localStorage.setItem('aria_custom_skills', JSON.stringify(filtered));
		} catch (e) {}
	}

	try {
		await fetch(`https://vostockfr-3b08c-default-rtdb.firebaseio.com/custom_skills/${skillId}.json`, {
			method: 'DELETE'
		});
	} catch (e) {}

	return true;
};

/** Vérifie si l'utilisateur actuel peut accéder et utiliser ce Skill */
export const canAccessSkill = (skill: CustomSkill, currentUser: any): boolean => {
	if (!skill) return false;
	if (skill.visibility === 'public') return true;
	if (!currentUser) return false;
	const isOwner = currentUser.role === 'owner' || OWNER_UIDS.includes(currentUser.id) || currentUser.email === 'mrpinpinpro@gmail.com';
	if (isOwner) return true;
	return skill.user_id === currentUser.id;
};

/** Vérifie si l'utilisateur actuel peut modifier ou supprimer ce Skill */
export const canManageSkill = (skill: CustomSkill, currentUser: any): boolean => {
	if (!skill || !currentUser) return false;
	const isOwner = currentUser.role === 'owner' || OWNER_UIDS.includes(currentUser.id) || currentUser.email === 'mrpinpinpro@gmail.com';
	if (isOwner) return true;
	return skill.user_id === currentUser.id;
};
