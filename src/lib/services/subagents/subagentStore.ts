import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import type { AriaSubagent, SubagentExecutionTask } from './subagentTypes';
import { sendAriaCompletion } from '$lib/utils/ariaModels';

export const DEFAULT_BUILTIN_SUBAGENTS: AriaSubagent[] = [
	{
		id: 'subagent-luau-architect',
		name: 'Architecte Systèmes Modulaires',
		role: 'Lead Systems & Module Architect',
		description: 'Conçoit les architectures modulaires AAA, hiérarchies Server/Client/ReplicatedStorage, typage strict (--!strict) et State Machines.',
		model: 'aria-code',
		isBuiltin: true,
		tags: ['Architecture', 'Luau', 'Modules'],
		systemPrompt: `Tu es l'Architecte Systèmes Modulaires, expert en architecture logicielle pour Roblox Studio.
Mission : Structurer le code avec une modularité chirurgicale, un typage strict (--!strict), le respect du Single Responsibility Principle (SRP) et une séparation nette entre ServerScriptService, ReplicatedStorage et StarterPlayerScripts.
Fournis un code élégant, modulaire, sécurisé et prêt pour la production.`
	},
	{
		id: 'subagent-netcode-security',
		name: 'Auditeur Sécurité & Netcode',
		role: 'Security & Network Hardening Specialist',
		description: 'Audite la sécurité des RemoteEvents, implémente le token-bucket rate limiting, les sanity checks et protège contre les exploits.',
		model: 'aria-code',
		isBuiltin: true,
		tags: ['Sécurité', 'Anti-Exploit', 'Netcode'],
		systemPrompt: `Tu es l'Auditeur Sécurité & Netcode, spécialisé dans la sécurité autoritaire Roblox.
Règle suprême : Le client est TOUJOURS compromis. Ne jamais lui faire confiance.
Mission : Auditer les RemoteEvents/RemoteFunctions, valider scrupuleusement chaque type d'argument, appliquer un rate-limiting token-bucket côté serveur, et empêcher toute triche sur les dégâts, l'or et l'inventaire.`
	},
	{
		id: 'subagent-perf-optimizer',
		name: 'Ingénieur Rendu & Optimisation',
		role: 'Lag Elimination & Microprofiler Engineer',
		description: 'Optimise les performances à 60+ FPS, exploite le Parallel Luau (Actors), supprime les fuites de mémoire et optimise les requêtes spatiales.',
		model: 'aria-code',
		isBuiltin: true,
		tags: ['Performance', 'Parallel Luau', 'FPS'],
		systemPrompt: `Tu es l'Ingénieur Rendu & Optimisation, spécialisé dans la haute performance pour Roblox Studio.
Mission : Réduire l'empreinte mémoire, éliminer les fuites (déconnexion des RBXScriptConnections, nettoyage d'instances), exploiter le parallélisme Luau (Actors et task.desynchronize) et optimiser les boucles RunService.Heartbeat pour un framerate constant de 60+ FPS.`
	},
	{
		id: 'subagent-juice-vfx',
		name: 'Concepteur Dynamique & Effets Visuels',
		role: 'Combat & Movement Juice Designer',
		description: 'Sublime le ressenti joueur : physique de ressorts (Springs), screenshake directionnel, easings TweenService, VFX et spatialisation sonore.',
		model: 'aria-code',
		isBuiltin: true,
		tags: ['Game Feel', 'Juice', 'VFX', 'Animation'],
		systemPrompt: `Tu es le Concepteur Dynamique & Effets Visuels, dédié au "Juice" et à la satisfaction tactile dans Roblox.
Mission : Transformer chaque action ordinaire (frapper, courir, sauter, collecter) en un moment de pur plaisir sensoriel :
- Ressorts physiques pour le recul et la caméra (Spring physics).
- Screen shake directionnel proportionnel à l'impact.
- Easing d'animation dynamique (anticipation, overshoot, OutBack, OutQuad).
- Spatialisation audio 3D et retours visuels réactifs.`
	},
	{
		id: 'subagent-profilestore-data',
		name: 'Gestionnaire Persistance & Sauvegardes',
		role: 'DataStore & Session-Locking Guardian',
		description: 'Gère la persistance des données joueur via ProfileStore/ProfileService, sauvegardes atomiques, session locking et anti-wipe.',
		model: 'aria-code',
		isBuiltin: true,
		tags: ['DataStore', 'ProfileStore', 'Sauvegarde'],
		systemPrompt: `Tu es le Gestionnaire Persistance & Sauvegardes, garant de l'intégrité absolue des données des joueurs.
Mission : Implémenter des sauvegardes infaillibles avec session locking (empêchant deux serveurs de corrompre le profil d'un même joueur), retry automatique par exponentielle en cas d'erreur réseau, 'BindToClose' serveur pour la clôture propre, et réconciliation de schémas.`
	},
	{
		id: 'subagent-retention-design',
		name: 'Directeur Conception & Rétention',
		role: 'Core Loop & Dopamine Pacing Director',
		description: 'Conçoit les boucles de dopamine 0-15s, le pacing de session 15-30m, la rétention virale D1/D7 et les économies fermées pérennes.',
		model: 'aria-reflection',
		isBuiltin: true,
		tags: ['Game Design', 'Rétention', 'Monétisation'],
		systemPrompt: `Tu es le Directeur Conception & Rétention, stratège de l'expérience et de l'engagement joueur sur Roblox.
Mission : Analyser et concevoir des boucles de gameplay captivantes et pérennes :
- Boucle primaire ultra-rapide (0-15s) génératrice de satisfaction immédiate.
- Pacing de session (15-30m) incitant au "one more run".
- Leviers de méta-rétention (D1/D7/D30) : raretés asymétriques, social flex, badges prestigieux, rebirths non-punitifs et économie équilibrée.`
	}
];

const STORAGE_KEY = 'aria_subagents';

const loadSubagents = (): AriaSubagent[] => {
	if (!browser) return DEFAULT_BUILTIN_SUBAGENTS;
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return DEFAULT_BUILTIN_SUBAGENTS;
		const parsed = JSON.parse(raw);
		if (Array.isArray(parsed) && parsed.length > 0) {
			const existingIds = new Set(parsed.map((s) => s.id));
			const missingBuiltins = DEFAULT_BUILTIN_SUBAGENTS.filter((b) => !existingIds.has(b.id));
			return [...missingBuiltins, ...parsed];
		}
	} catch (e) {
		console.warn('Failed to load subagents from localStorage:', e);
	}
	return DEFAULT_BUILTIN_SUBAGENTS;
};

export const subagents = writable<AriaSubagent[]>(loadSubagents());

export const activeSubagentExecutions = writable<SubagentExecutionTask[]>([]);

if (browser) {
	subagents.subscribe((list) => {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
		} catch (e) {}
	});
}

/** Enregistre ou met à jour un sous-agent (créé automatiquement par l'IA ou manuellement) */
export const registerSubagent = (subagentData: Partial<AriaSubagent> & { name: string; systemPrompt: string }): AriaSubagent => {
	const current = get(subagents);
	const id = subagentData.id || `subagent-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
	
	const newSubagent: AriaSubagent = {
		id,
		name: subagentData.name,
		role: subagentData.role || 'Spécialiste Technique',
		description: subagentData.description || 'Sous-agent spécialisé dans ce domaine technique.',
		model: subagentData.model || 'aria-code',
		systemPrompt: subagentData.systemPrompt,
		tags: subagentData.tags || ['Roblox', 'Ingénierie'],
		isBuiltin: false,
		createdAt: subagentData.createdAt || Date.now(),
		updatedAt: Date.now()
	};

	const existingIndex = current.findIndex((s) => s.id === id);
	if (existingIndex >= 0) {
		current[existingIndex] = { ...current[existingIndex], ...newSubagent };
		subagents.set([...current]);
	} else {
		subagents.set([newSubagent, ...current]);
	}

	return newSubagent;
};

/** Supprime un sous-agent personnalisé */
export const deleteSubagent = (id: string): boolean => {
	const current = get(subagents);
	const target = current.find((s) => s.id === id);
	if (!target || target.isBuiltin) return false;
	subagents.set(current.filter((s) => s.id !== id));
	return true;
};

/** Exécute une tâche spécifique avec un sous-agent */
export const executeSubagent = async (
	subagentOrId: string | AriaSubagent,
	taskDescription: string,
	context: string = ''
): Promise<SubagentExecutionTask> => {
	const current = get(subagents);
	const subagent =
		typeof subagentOrId === 'string'
			? current.find((s) => s.id === subagentOrId) || DEFAULT_BUILTIN_SUBAGENTS[0]
			: subagentOrId;

	const taskId = `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
	const execution: SubagentExecutionTask = {
		id: taskId,
		subagentId: subagent.id,
		subagentName: subagent.name,
		task: taskDescription,
		status: 'running',
		timestamp: Date.now()
	};

	activeSubagentExecutions.update((tasks) => [execution, ...tasks]);
	const startTime = Date.now();

	try {
		const messages = [
			{
				role: 'system',
				content: `${subagent.systemPrompt}\n\nTu interviens en tant que sous-agent dédié '${subagent.name}'. Reste strictement dans ton rôle d'expert. Sois direct, chirurgical et concis.`
			},
			...(context ? [{ role: 'system', content: `[CONTEXTE ADDITIONNEL DU PROJET]\n${context}` }] : []),
			{
				role: 'user',
				content: taskDescription
			}
		];

		const res = await sendAriaCompletion(subagent.model, messages, { stream: false });
		if (!res || !res.ok) {
			throw new Error(`Erreur lors de l'appel du sous-agent (${res?.status || 'réseau'})`);
		}

		const text = await res.text();
		let content = '';

		if (text.startsWith('data:')) {
			const lines = text.split('\n');
			for (const line of lines) {
				const trimmed = line.trim();
				if (trimmed.startsWith('data:') && !trimmed.includes('[DONE]')) {
					try {
						const json = JSON.parse(trimmed.replace(/^data:\s*/, ''));
						const delta =
							json.choices?.[0]?.delta?.content ??
							json.choices?.[0]?.delta?.reasoning_content ??
							json.choices?.[0]?.delta?.reasoning ??
							json.choices?.[0]?.message?.content ??
							'';
						content += delta;
					} catch {}
				}
			}
		} else {
			try {
				const json = JSON.parse(text);
				const msg = json.choices?.[0]?.message;
				content = msg?.content || msg?.reasoning || text;
			} catch {
				content = text;
			}
		}

		execution.status = 'completed';
		execution.result = content.trim();
		execution.durationMs = Date.now() - startTime;
		execution.modelUsed = subagent.model;

		activeSubagentExecutions.update((tasks) =>
			tasks.map((t) => (t.id === taskId ? execution : t))
		);

		return execution;
	} catch (err: any) {
		execution.status = 'failed';
		execution.error = err?.message || 'Erreur inconnue';
		execution.durationMs = Date.now() - startTime;

		activeSubagentExecutions.update((tasks) =>
			tasks.map((t) => (t.id === taskId ? execution : t))
		);

		return execution;
	}
};
