/**
 * Configuration complète des IA Aria avec clés API, système de Fallback multi-fournisseurs
 * et compétences Roblox / Luau intégrées.
 */

export interface AriaProviderConfig {
	name: string;
	baseUrl: string;
	apiKey: string;
	model: string;
}

export interface AriaModelConfig {
	id: string;
	name: string;
	description: string;
	owned_by: string;
	info: {
		meta: {
			beta: boolean;
			accessRoles: string[];
			systemPrompt: string;
			description: string;
		};
	};
	fallbacks: AriaProviderConfig[];
}

// Clés API Fournisseurs (via Variables d'environnement Vercel / Vite)
export const API_KEYS = {
	groq: import.meta.env?.VITE_GROQ_API_KEY || '',
	openrouter: import.meta.env?.VITE_OPENROUTER_API_KEY || '',
	mistral: import.meta.env?.VITE_MISTRAL_API_KEY || '',
	cerebras: import.meta.env?.VITE_CEREBRAS_API_KEY || '',
	huggingface: import.meta.env?.VITE_HUGGINGFACE_API_KEY || '',
	siliconflow: import.meta.env?.VITE_SILICONFLOW_API_KEY || ''
};

// Consignes d'identité et de style professionnelles pour les IA Aria
const ARIA_IDENTITY_PROMPT = `
RÈGLE D'IDENTITÉ & COMMUNICATION (MANDATAIRE) :
1. Tu es une IA de la suite Aria. Tu ne mentionnes JAMAIS les noms de modèles sous-jacents (Llama, Meta, DeepSeek, OpenAI, Qwen, Mistral, Groq, etc.). Si l'utilisateur te demande quel modèle tu es ou qui t'a créée, tu es Aria, conçue et développée par MrPinPinYT, le Fondateur d'Aria.
2. Tu es hébergée sur la plateforme Aria, l'écosystème dédié au développement et aux créateurs de jeux Roblox.
3. EXPRESSION & ORTHOGRAPHE : Exprime-toi dans un français parfaitement fluide, naturel, professionnel, courtois et irréprochable. Sois claire, pertinente et directement utile.
4. GESTION DE LA RÉFLEXION : Si tu as besoin d'analyser le problème étape par étape ou de poser ton raisonnement, tu peux utiliser des balises \`<think>...</think>\`. L'interface Aria UI les formatera automatiquement dans un encart déroulant interactif « 🧠 Réflexion & Analyse de l'IA » pour l'utilisateur. Donne ensuite ta réponse complète et structurée.

🌐 CONNAISSANCE DE LA GAMME & DES MODÈLES ARIA (MANDATAIRE) :
Tu connais parfaitement tous les modèles de la suite Aria et tu sais les expliquer et les comparer avec précision quand l'utilisateur te pose des questions dessus :
- ⚡ **Aria Basic** (1.0x tokens) : Le modèle le plus rapide, réactif et très économe en tokens. Idéal pour les discussions générales et le quotidien.
- 🌟 **Aria Plus** (1.5x tokens) : Modèle polyvalent et très intelligent pour les analyses complexes et la synthèse.
- 🧠 **Aria Réflexion (Aria Reflection)** (2.0x tokens) : Modèle de réflexion logique et d'analyse étape par étape.
- 💻 **Aria Code** (3.0x tokens) : La Super-IA experte ultime en développement Roblox Studio, programmation Luau avancée, architecture de jeux et DataStores.

👉 Si un utilisateur te demande par exemple "Aria Réflexion est-elle meilleure ?", "quelle différence entre Aria Basic et Aria Code ?", ou quel modèle choisir, explique-lui clairement les spécialités de chaque modèle pour l'orienter selon son besoin !
`;

// Prompt Système Expert Roblox Luau pour Aria Code
export const ROBLOX_LUAU_SYSTEM_PROMPT = `Tu es Aria Code, la Super-IA experte en développement Roblox Studio, programmation Luau avancée et ingénierie de jeux sur la plateforme Aria.

${ARIA_IDENTITY_PROMPT}

 TON & POSTURE D'ARIA CODE :
- Tu es une ingénieure de code Roblox hautement qualifiée et professionnelle.
- Tes réponses sont précises, techniques, structurées et directement exploitables dans Roblox Studio.
- Tu fournis du code Luau propre, optimisé et sécurisé, avec des explications concises.

### 🎮 ARCHITECTURE & HIERARCHIE ROBLOX MANDATAIRES :
1. **ServerScriptService** — Scripts serveur autoritaires (logique globale, sauvegarde de données, anti-cheat, gestion des joueurs).
2. **ReplicatedStorage** — ModuleScripts partagés, RemoteEvents, RemoteFunctions et assets requis par le client et le serveur.
3. **StarterPlayerScripts / StarterCharacterScripts** — LocalScripts client (gestion des entrées, caméra, contrôles, effets visuels).
4. **StarterGui** — ScreenGuis et interfaces utilisateur (clonées automatiquement dans PlayerGui lors du spawn).
5. **ServerStorage** — Modèles, cartes et assets confidentiels serveur clonés à la demande.
6. **Workspace** — Le monde 3D dynamique. Conserver une hiérarchie propre et optimisée.

### 🛡️ SÉCURITÉ REMOTE EVENT & NETWORK (RÈGLE D'OR) :
- **NE JAMAIS FAIRE CONFIANCE AU CLIENT.** Tout argument envoyé via \`RemoteEvent:FireServer()\` est contrôlé par un attaquant potentiel.
- Valider impérativement les types, valeurs, cooldowns et autorisations côté serveur dans \`OnServerEvent\`.
- Filtrer tous les textes utilisateur avec \`TextService:FilterStringAsync()\`.

### 💾 PERSISTANCE & DATASTORE :
- Toujours envelopper les appels \`GetDataStore()\` dans des blocs \`pcall()\`.
- Pour les données de production des joueurs, recommander et implémenter le pattern **ProfileService / Session Locking** pour éviter la perte de données lors des sauvegardes simultanées.

### ⚡ PERFORMANCE & BONNES PRATIQUES LUAU :
- Stocker la valeur de retour de chaque \`:Connect()\` et appeler \`:Disconnect()\` lors de la destruction des objets (ou utiliser Maid/Trove).
- Utiliser la syntaxe Luau moderne (types explicites \`type PlayerData = { ... }\`, interpolations de chaînes).
- Fournir un code propre, structuré, commenté en français et prêt à être copié-collé dans Roblox Studio.

### 🚫 RÈGLE DE PORTÉE & D'ÉQUILIBRE (ABSOLUE) :
- **JAMAIS générer un jeu Roblox complet en une seule réponse.** Si l'utilisateur demande "fais-moi un jeu complet" ou "génère tout le jeu", tu DOIS poliment refuser et expliquer que ce n'est pas faisable en une seule session.
- **Pourquoi ?** Un jeu complet représente des dizaines de scripts, des milliers de lignes et une architecture complexe. Aucune IA ne peut le générer de manière fiable et optimisée en une fois.
- **À la place**, propose une approche par modules : "Je peux construire le système de combat, puis le système de sauvegarde, puis l'interface, etc. Par quel module veux-tu commencer ?"
- Tu peux fournir **plusieurs scripts dans une même réponse** pour un système cohérent (ex : ServerScript + LocalScript + ModuleScript pour un système de combat). C'est encouragé.
- Un système = 2 à 5 scripts max par réponse. Si c'est plus grand, découper en étapes.`;

// Contextes généraux avec bouclier d'identité
const GENERAL_ROBLOX_CONTEXT = ARIA_IDENTITY_PROMPT;

export const ARIA_MODELS_CONFIG: Record<string, AriaModelConfig> = {
	'aria-basic': {
		id: 'aria-basic',
		name: 'Aria Basic',
		description: 'Modèle rapide et réactif pour un usage quotidien.',
		owned_by: 'aria',
		info: {
			meta: {
				beta: false,
				accessRoles: ['user', 'beta_tester', 'admin', 'owner'],
				description: 'Modèle rapide et réactif pour un usage quotidien.',
				systemPrompt: `Tu es Aria Basic, un assistant IA simple, rapide et concis. Réponds clairement sans détails excessivement complexes.\n${GENERAL_ROBLOX_CONTEXT}`
			}
		},
		fallbacks: [
			{
				name: 'Groq-Compound-Mini',
				baseUrl: 'https://api.groq.com/openai/v1',
				apiKey: API_KEYS.groq,
				model: 'groq/compound-mini'
			},
			{
				name: 'Groq-GPT-OSS-20B',
				baseUrl: 'https://api.groq.com/openai/v1',
				apiKey: API_KEYS.groq,
				model: 'openai/gpt-oss-20b'
			},
			{
				name: 'OpenRouter-Free',
				baseUrl: 'https://openrouter.ai/api/v1',
				apiKey: API_KEYS.openrouter,
				model: 'openrouter/free'
			},
			{
				name: 'OpenRouter-MiniMax',
				baseUrl: 'https://openrouter.ai/api/v1',
				apiKey: API_KEYS.openrouter,
				model: 'minimax/minimax-m3:free'
			}
		]
	},

	'aria-reflection': {
		id: 'aria-reflection',
		name: 'Aria Réflexion',
		description: 'Modèle de réflexion approfondie, raisonnement logique et analyse complexe.',
		owned_by: 'aria',
		provider: 'groq',
		info: {
			meta: {
				beta: false,
				accessRoles: ['user', 'beta_tester', 'admin', 'owner'],
				description: 'Modèle de réflexion approfondie, raisonnement logique et analyse complexe.',
				systemPrompt: `Tu es Aria Réflexion, une IA hautement analytique et logique. Décompose chaque problème complexe étape par étape avec un raisonnement structuré, rigoureux et approfondi.\n${GENERAL_ROBLOX_CONTEXT}`
			}
		},
		fallbacks: [
			{
				name: 'Groq-Compound',
				baseUrl: 'https://api.groq.com/openai/v1',
				apiKey: API_KEYS.groq,
				model: 'groq/compound'
			},
			{
				name: 'Groq-GPT-OSS-120B',
				baseUrl: 'https://api.groq.com/openai/v1',
				apiKey: API_KEYS.groq,
				model: 'openai/gpt-oss-120b'
			},
			{
				name: 'OpenRouter-Free',
				baseUrl: 'https://openrouter.ai/api/v1',
				apiKey: API_KEYS.openrouter,
				model: 'openrouter/free'
			},
			{
				name: 'OpenRouter-MiniMax',
				baseUrl: 'https://openrouter.ai/api/v1',
				apiKey: API_KEYS.openrouter,
				model: 'minimax/minimax-m3:free'
			}
		]
	},

	'aria-plus': {
		id: 'aria-plus',
		name: 'Aria Plus',
		description: 'IA autonome ultra-intelligente avec vision et analyse d\'images.',
		owned_by: 'aria',
		info: {
			meta: {
				beta: true,
				accessRoles: ['beta_tester', 'admin', 'owner'],
				capabilities: { vision: true },
				description: 'IA autonome ultra-intelligente avec vision et analyse d\'images.',
				systemPrompt: `Tu es Aria Plus, une IA hautement autonome et supérieurement intelligente. Tu disposes de capacités d'analyse avancées, de résolution de problèmes complexes, de vision (analyse d'images) et de création autonome de compétences adaptatives. Quand l'utilisateur partage une image, analyse-la précisément et réponds en conséquence.\n${GENERAL_ROBLOX_CONTEXT}`
			}
		},
		fallbacks: [
			{
				name: 'OpenRouter-Llama4-Vision',
				baseUrl: 'https://openrouter.ai/api/v1',
				apiKey: API_KEYS.openrouter,
				model: 'meta-llama/llama-4-scout:free'
			},
			{
				name: 'OpenRouter-Gemini-Vision',
				baseUrl: 'https://openrouter.ai/api/v1',
				apiKey: API_KEYS.openrouter,
				model: 'google/gemini-2.0-flash-exp:free'
			},
			{
				name: 'Groq-GPT-OSS-120B',
				baseUrl: 'https://api.groq.com/openai/v1',
				apiKey: API_KEYS.groq,
				model: 'openai/gpt-oss-120b'
			},
			{
				name: 'OpenRouter-MiniMax',
				baseUrl: 'https://openrouter.ai/api/v1',
				apiKey: API_KEYS.openrouter,
				model: 'minimax/minimax-m3:free'
			}
		]
	},

	'aria-code': {
		id: 'aria-code',
		name: 'Aria Code',
		description: 'Super-IA experte en développement Roblox, Luau & Architecture Studio.',
		owned_by: 'aria',
		info: {
			meta: {
				beta: true,
				accessRoles: ['beta_tester', 'admin', 'owner'],
				description: 'Super-IA experte en développement Roblox, Luau & Architecture Studio.',
				systemPrompt: ROBLOX_LUAU_SYSTEM_PROMPT
			}
		},
		fallbacks: [
			{
				name: 'Groq-Qwen36',
				baseUrl: 'https://api.groq.com/openai/v1',
				apiKey: API_KEYS.groq,
				model: 'qwen/qwen3.6-27b'
			},
			{
				name: 'Groq-Qwen38',
				baseUrl: 'https://api.groq.com/openai/v1',
				apiKey: API_KEYS.groq,
				model: 'qwen/qwen3.8-27b'
			},
			{
				name: 'Groq-GPT-OSS-120B',
				baseUrl: 'https://api.groq.com/openai/v1',
				apiKey: API_KEYS.groq,
				model: 'openai/gpt-oss-120b'
			},
			{
				name: 'OpenRouter-Free',
				baseUrl: 'https://openrouter.ai/api/v1',
				apiKey: API_KEYS.openrouter,
				model: 'openrouter/free'
			}
		]
	}
};

/**
 * Exécute une requête de complétion vers le modèle demandé avec basculement automatique (Fallback)
 * sur la chaîne de fournisseurs (Groq -> OpenRouter -> Cerebras -> Mistral -> SiliconFlow -> HuggingFace).
 */
export const sendAriaCompletion = async (
	modelId: string,
	messages: Array<{ role: string; content: any }>,
	options: { stream?: boolean } = {}
): Promise<Response> => {
	const modelConfig = ARIA_MODELS_CONFIG[modelId] || ARIA_MODELS_CONFIG['aria-basic'];
	const systemPrompt = modelConfig.info.meta.systemPrompt;
	const supportsVision = modelId === 'aria-plus';

	// Sanitisations des messages pour garantir que le dernier message est bien de rôle 'user'
	let formattedMessages = (messages || [])
		.filter((m) => m && m.role && (m.content !== undefined || (m as any).output))
		.map((m) => {
			// Preserve vision content (array format with image_url) for vision-capable models
			if (supportsVision && Array.isArray(m.content) && m.content.some((c: any) => c.type === 'image_url')) {
				return { role: m.role, content: m.content };
			}
			return {
				role: m.role,
				content: typeof m.content === 'string' ? m.content : (Array.isArray(m.content) ? m.content.map((c: any) => c.text || '').join('\n') : String(m.content || ''))
			};
		});

	// Retirer les messages assistant vides ou résiduels à la fin de la liste
	while (formattedMessages.length > 0 && formattedMessages[formattedMessages.length - 1].role === 'assistant') {
		formattedMessages.pop();
	}

	// Si aucun message utilisateur n'est présent dans la liste nettoyée, récupérer le dernier message valide
	const hasUserMessage = formattedMessages.some((m) => m.role === 'user');
	if (!hasUserMessage) {
		const rawUserMsg = (messages || []).reverse().find((m) => m && m.role === 'user' && m.content);
		if (rawUserMsg) {
			formattedMessages.push({
				role: 'user',
				content: typeof rawUserMsg.content === 'string' ? rawUserMsg.content : String(rawUserMsg.content || 'Bonjour')
			});
		} else {
			formattedMessages.push({ role: 'user', content: 'Bonjour' });
		}
	}

	if (formattedMessages[0]?.role === 'system') {
		formattedMessages[0].content = `${systemPrompt}\n\n${formattedMessages[0].content}`;
	} else {
		formattedMessages.unshift({ role: 'system', content: systemPrompt });
	}

	// Limit context window history to last 16 messages to prevent 413 Payload Too Large errors
	if (formattedMessages.length > 17) {
		const sys = formattedMessages[0];
		formattedMessages = [sys, ...formattedMessages.slice(-16)];
	}

	let lastError: Error | null = null;

	for (const provider of modelConfig.fallbacks) {
		try {
			const isCodeModel = String(modelId || '').toLowerCase().includes('code');
			const res = await fetch(`${provider.baseUrl}/chat/completions`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${provider.apiKey}`,
					...(provider.name.startsWith('OpenRouter') && {
						'HTTP-Referer': 'https://aria-studio-ia.vercel.app',
						'X-Title': 'Aria Studio'
					})
				},
				body: JSON.stringify({
					model: provider.model,
					messages: formattedMessages,
					stream: options.stream ?? true,
					max_tokens: isCodeModel ? 16384 : 4096,
					temperature: isCodeModel ? 0.3 : 0.7
				})
			});

			if (!res.ok) {
				lastError = new Error(`Provider ${provider.name} returned ${res.status}`);
				continue;
			}

			// Peek the first chunk to detect SSE-level errors (Groq returns 200 OK then streams the error)
			const cloned = res.clone();
			const peekReader = cloned.body!.getReader();
			const { value: firstChunk } = await peekReader.read();
			peekReader.cancel();
			const firstText = firstChunk ? new TextDecoder().decode(firstChunk) : '';
			const firstLower = firstText.toLowerCase();
			const isStreamError =
				firstLower.includes('"error"') &&
				(firstLower.includes('rate_limit') ||
					firstLower.includes('rate limit') ||
					firstLower.includes('quota') ||
					firstLower.includes('limit exceeded') ||
					firstLower.includes('429'));

			if (isStreamError) {
				lastError = new Error(`Provider ${provider.name} rate limited (stream error)`);
				continue;
			}

			return res;
		} catch (err: any) {
			lastError = err;
		}
	}

	throw lastError || new Error(`All providers for ${modelId} failed.`);
};

export const getAriaModelsList = () => {
	return Object.values(ARIA_MODELS_CONFIG).map((m) => ({
		id: m.id,
		name: m.name,
		description: m.description,
		owned_by: m.owned_by,
		info: {
			...m.info,
			meta: {
				...m.info.meta,
				capabilities: (m.info.meta as any).capabilities || { vision: false }
			}
		}
	}));
};

/** Multiplicateurs de consommation de tokens par modèle Aria */
export const MODEL_TOKEN_MULTIPLIERS: Record<string, { multiplier: number; name: string; description: string }> = {
	'aria-basic': {
		multiplier: 1.0,
		name: 'Aria Basic',
		description: 'Consommation très légère (1.0x)'
	},
	'aria-plus': {
		multiplier: 1.5,
		name: 'Aria Plus',
		description: 'Consommation modérée (1.5x)'
	},
	'aria-reflection': {
		multiplier: 2.0,
		name: 'Aria Réflexion',
		description: 'Consommation logique (2.0x)'
	},
	'aria-code': {
		multiplier: 3.0,
		name: 'Aria Code',
		description: 'Consommation experte Luau (3.0x)'
	}
};

/** Calcule le nombre pondéré de tokens selon le modèle sélectionné */
export const calculateModelTokenUsage = (
	modelId: string | undefined,
	inputLength: number,
	outputLength: number
): number => {
	const cleanKey = String(modelId || 'aria-basic').toLowerCase();
	let multiplier = 1.0;

	if (cleanKey.includes('code')) {
		multiplier = 5.0;
	} else if (cleanKey.includes('reflection') || cleanKey.includes('réflexion')) {
		multiplier = 3.5;
	} else if (cleanKey.includes('plus')) {
		multiplier = 2.5;
	} else {
		multiplier = 1.5;
	}

	// ~1 token pour 4 caractères (ratio réaliste)
	const totalChars = (inputLength || 0) + (outputLength || 0);
	const baseTokens = Math.max(10, Math.ceil(totalChars / 4));
	return Math.ceil(baseTokens * multiplier);
};

/** Clé de fenêtre horaire pour reset toutes les heures */
export const getTokenWindowKey = (): string => {
	const now = new Date();
	return `${now.toISOString().split('T')[0]}T${String(now.getUTCHours()).padStart(2, '0')}`;
};

/** Limite de tokens par rôle */
export const getRoleTokenLimit = (user: any): number => {
	if (!user) return 500;
	const role = user.role || '';
	// Role check first — owner/admin are always infinite regardless of stored token_limit
	if (role === 'owner' || user.id === 'QH8wKG8nWZVtUQEy2pppuBuNZgC3') return Infinity;
	if (role === 'admin') return Infinity;
	// Custom override only for non-privileged users
	if (user.token_limit && Number(user.token_limit) > 0) return Number(user.token_limit);
	if (role === 'beta_tester') return 1000;
	return 500;
};

/** Vérifie si l'utilisateur est privilégié (pas de limite stricte) */
export const isPrivilegedUser = (user: any): boolean => {
	return getRoleTokenLimit(user) === Infinity;
};
