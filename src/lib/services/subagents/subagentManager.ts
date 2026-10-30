import { registerSubagent, executeSubagent, type AriaSubagent } from './subagentStore';
import type { SubagentExecutionTask } from './subagentTypes';

/**
 * Analyse une réponse textuelle de l'IA pour détecter d'éventuels blocs de création de sous-agents
 * de la forme:
 * ```json:create_subagent
 * { "name": "...", "role": "...", "systemPrompt": "..." }
 * ```
 * ou <create_subagent> ... </create_subagent>
 */
export const extractAndRegisterSubagentsFromText = (
	text: string
): { cleanedText: string; createdSubagents: AriaSubagent[] } => {
	const createdSubagents: AriaSubagent[] = [];
	let cleanedText = text;

	// Pattern 1 : Balise XML <create_subagent>...</create_subagent>
	const tagRegex = /<create_subagent>([\s\S]*?)<\/create_subagent>/gi;
	let match;

	while ((match = tagRegex.exec(text)) !== null) {
		const rawJson = match[1].trim();
		try {
			const parsed = JSON.parse(rawJson);
			if (parsed.name && (parsed.systemPrompt || parsed.system || parsed.description)) {
				const registered = registerSubagent({
					id: parsed.id,
					name: parsed.name,
					role: parsed.role,
					description: parsed.description,
					model: parsed.model || 'aria-code',
					icon: parsed.icon || '🤖',
					systemPrompt: parsed.systemPrompt || parsed.system || parsed.description,
					tags: parsed.tags
				});
				createdSubagents.push(registered);
			}
		} catch (e) {
			console.warn('Could not parse create_subagent JSON block:', e, rawJson);
		}
	}

	// Pattern 2 : Fenced code block ```json:create_subagent ou ```json:subagent
	const codeBlockRegex = /```(?:json:create_subagent|json:subagent|subagent)\s*([\s\S]*?)```/gi;
	while ((match = codeBlockRegex.exec(text)) !== null) {
		const rawJson = match[1].trim();
		try {
			const parsed = JSON.parse(rawJson);
			if (parsed.name && (parsed.systemPrompt || parsed.system || parsed.description)) {
				const registered = registerSubagent({
					id: parsed.id,
					name: parsed.name,
					role: parsed.role,
					description: parsed.description,
					model: parsed.model || 'aria-code',
					icon: parsed.icon || '🤖',
					systemPrompt: parsed.systemPrompt || parsed.system || parsed.description,
					tags: parsed.tags
				});
				if (!createdSubagents.some((s) => s.id === registered.id)) {
					createdSubagents.push(registered);
				}
			}
		} catch (e) {
			console.warn('Could not parse fenced subagent JSON:', e, rawJson);
		}
	}

	return { cleanedText, createdSubagents };
};

/**
 * Lance plusieurs sous-agents en parallèle pour décomposer un cahier des charges
 */
export const runSubagentsOrchestration = async (
	tasks: Array<{ subagentId: string; taskDescription: string; context?: string }>
): Promise<SubagentExecutionTask[]> => {
	const promises = tasks.map((t) =>
		executeSubagent(t.subagentId, t.taskDescription, t.context || '')
	);
	return Promise.all(promises);
};
