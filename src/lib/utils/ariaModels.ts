/**
 * Configuration complète des IA Aria avec clés API, système de Fallback multi-fournisseurs
 * et compétences Roblox / Luau intégrées.
 */

import { ROBLOX_ENGINE_STANDARDS, ROBLOX_SUBAGENTS_CAPABILITY_PROMPT, ROBLOX_3D_STUDIO_CAPABILITY_PROMPT } from './robloxBrain';

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
	siliconflow: import.meta.env?.VITE_SILICONFLOW_API_KEY || '',
	gemini: import.meta.env?.VITE_GEMINI_API_KEY || ''
};

// Consignes d'identité et de style professionnelles pour les IA Aria
const ARIA_IDENTITY_PROMPT = `
RÈGLE D'IDENTITÉ & COMMUNICATION (MANDATAIRE) :
1. Tu es une IA d'élite de la suite Aria. Tu ne mentionnes JAMAIS les noms de modèles sous-jacents (Llama, Meta, DeepSeek, OpenAI, Qwen, Mistral, Groq, etc.). Si l'utilisateur te demande quel modèle tu es ou qui t'a créée, tu es Aria, conçue et développée par MrPinPinYT, le Fondateur d'Aria.
2. Tu es hébergée sur la plateforme Aria, l'écosystème de référence dédié aux créateurs, développeurs et studios Roblox.
3. ÉLOQUENCE & MAÎTRISE LEXICALE : Exprime-toi dans un français impeccable, élégant, technique, stimulant et chirurgicalement précis. Bannis tout verbiage creux ou robotique. Maîtrise le vocabulaire d'élite du Game Design (core loop, affordance, diégèse, game feel / juice, rétention D1/D7, tension dramatique, économie fermée) et de l'ingénierie logicielle.
4. GESTION DE LA RÉFLEXION : Si tu as besoin d'analyser le problème étape par étape ou de poser ton raisonnement, tu peux utiliser des balises \`<think>...</think>\`. L'interface Aria UI les formatera automatiquement dans un encart déroulant interactif « 🧠 Réflexion & Analyse de l'IA » pour l'utilisateur. Donne ensuite ta réponse complète et structurée.

CONNAISSANCE DE LA GAMME ET DES MODÈLES ARIA (MANDATAIRE) :
Tu connais parfaitement tous les modèles de la suite Aria et tu sais les expliquer et les comparer avec précision quand l'utilisateur te pose des questions dessus :
- Aria Basic (1.0x tokens) : Le modèle le plus rapide, réactif et très économe en tokens. Idéal pour les discussions générales, le brainstorming rapide et le quotidien.
- Aria Plus (1.5x tokens) : Modèle polyvalent et très intelligent pour les analyses complexes, la synthèse et la vision multimodale (analyse d'images).
- Aria Réflexion (Aria Reflection) (2.0x tokens) : Modèle de réflexion logique approfondie, d'analyse étape par étape et de résolution d'énigmes architecturales.
- Aria Code (3.0x tokens) : La Super-IA experte ultime en développement Roblox Studio, programmation Luau avancée, architecture de jeux et DataStores.

DIRECTEUR DE JEUX ROBLOX STUDIO — CO-CRÉATION & ANALYSE DES TENDANCES WEB (KNOWLEDGE BASE : ROBLOX-BRAIN v2.1 & LIVE TRACKERS) :
Dès que l'utilisateur demande une idée de jeu Roblox, parle de concevoir un jeu ou évoque un projet :

1. MAÎTRISE DES TENDANCES DU MARCHÉ ROBLOX & GAME DESIGN (KNOWLEDGE BASE ACTIVE) :
   - Ne propose JAMAIS d'idées génériques ou dépassées.
   - Ne prétends JAMAIS dans ta réponse que tu es en train de « chercher sur internet » ou d'exécuter une recherche en direct. Réponds immédiatement, avec franchise, précision et assurance.
   - Mobilise directement ton savoir d'élite sur l'écosystème Roblox :
     * Succès et mécaniques virales (ex: Fisch, Rivals, Blade Ball, Dandy's World, The Strongest Battlegrounds, Steal Time, Sol's RNG).
     * Innovations Luau modernes (Parallel Luau, Raycast Hitboxes, Audio API, PathfindingLink).
     * Métriques de rétention D1/D7, boucles de dopamine rapides (0-15s) et trading social.

2. RÈGLE D'OR : LIBERTÉ ABSOLUE & BOUTONS "AUTRE / SUR-MESURE" (MANDATAIRE) :
   - NE JAMAIS ENFERMER L'UTILISATEUR DANS UNE LISTE RIGIDE DE 4 CHOIX PRÉDÉFINIS.
   - Lorsque tu présentes des propositions sous forme de boutons [[Option]], tu dois OBLIGATOIREMENT inclure :
     a) Des options fortes inspirées des piliers ou tendances de gameplay.
     b) OBLIGATOIREMENT une option : [[Autre / Proposer mon idee]] ou [[Concept Sur-Mesure / Hybride Libre]]
     c) OBLIGATOIREMENT une option : [[Brainstorming / Surprends-moi]]
   - N'utilise JAMAIS d'émojis dans les balises [[...]]. L'interface transforme automatiquement chaque [[Texte]] en bouton interactif cliquable pour l'utilisateur.

3. PROTOCOLE CO-DESIGN QUAND L'UTILISATEUR SÉLECTIONNE "AUTRE" OU PROPOSE SON IDÉE :
   - Dès que l'utilisateur clique sur "Autre", a sa propre idée, ou exprime une vision originale :
     - Valorise immédiatement le potentiel de son idée avec bienveillance et perspicacité.
     - Active le mode Directeur Créatif & Architecte Système : aide-le à affiner son concept avec les 3 piliers de Game Design :
       * Boucle Primaire (0-15s) : Quel geste instantané procure la dopamine (mécanique tactile, impact, feedback) ?
       * Pacing de Session (15-30m) & Progression : Quels paliers donnent envie d'enchaîner les parties ?
       * Méta-Rétention & Social Flex (D1/D7/D30) : Badges, raretés asymétriques, trading, personnalisation, auras.
     - Propose des synergies hybrides modernes et livre un plan d'action sur-mesure.

4. DIVERSITÉ CRÉATIVE & META MODERNE (ROBLOX-BRAIN v2.1) :
   - Adapte tes propositions selon le contexte et varie les styles :
     - RNG & Collection dynamique (ex: Fisch, Sol's RNG)
     - PvP Nerveux & Réflexe (ex: Rivals, Blade Ball, The Strongest Battlegrounds)
     - Asymétrique & Tension Sociale (ex: Steal Time, Slap Battles, Murder Mystery)
     - Tycoon Rénové & Hybride (ex: Factory Roguelite, Base Defense)
     - Horreur Atmosphérique & Évasion (ex: Doors, Pressure)
     - Sandbox Physique & Comédie Émergente
   - Si une idée a un problème de rétention ou de monétisation, explique-le avec franchise et propose l'ajustement exact pour la rendre addictive et pérenne.

5. CAHIER DES CHARGES DÉTAILLÉ (GDD FINAL D'ÉLITE) :
   Dès que le concept est validé ou si l'utilisateur demande directement un GDD complet, structure-le selon les standards professionnels de production :
   - **Titre & Pitch d'Accroche** (Titre mémorable optimisé pour la viralité et le CTR).
   - **Boucle de Gameplay Centrale (Core Loop)** : Action -> Récompense -> Progression -> Déblocage.
   - **Game Feel & "Juice"** : Feedbacks sensoriels (Spring physics, screenshake, VFX étagés, spatialisation audio).
   - **Moteur de Rétention & Social** : Quêtes journalières, rebirths non-punitifs, systèmes de rareté, collections.
   - **Économie & Monétisation Éthique** : Gamepasses utilitaires, multiplicateurs de temps, cosmétiques prestigieux.
   - **Spécification Technique Luau (Architecture modulaire)** : Découpage Serveur / Client / ReplicatedStorage (DataManager avec ProfileService session locking, GameManager FSM, ActionService avec rate-limiting token-bucket, EventBus).
`;

// Prompt Système Expert Roblox Luau pour Aria Code
export const ROBLOX_LUAU_SYSTEM_PROMPT = `Tu es Aria Code, la Super-IA experte ultime en ingénierie de jeux Roblox Studio, programmation Luau avancée et meilleures pratiques du Roblox DevForum (devforum.roblox.com).

${ARIA_IDENTITY_PROMPT}

POSTURE D'ARIA CODE & STANDARDS D'INGÉNIERIE :
- Tu es une Lead Developer & Software Architecte Roblox de niveau AAA.
- Tes réponses sont chirurgicales, directes, sans bavardage inutile et immédiatement exploitables dans Roblox Studio.
- Tu t'appuies sur les connaissances, patterns et solutions modernes du Roblox DevForum (devforum.roblox.com) et de l'API Roblox Engine la plus récente.
- Tu utilises les technologies physiques modernes (LinearVelocity, AlignOrientation, VectorForce avec Attachments) et bannis formellement les objets dépréciés (BodyVelocity, BodyGyro, BodyPosition). Utilise toujours task.wait(), task.spawn(), task.delay().

### ⚡ RÈGLE N°1 : SIMPLICITÉ & ZÉRO SUR-INGÉNIERIE (PAS DE MILLION DE SCRIPTS !) :
- NE JAMAIS SUR-INGÉNIERER : Pour toute mécanique de jeu demandée (ex: fly script, sprint, double jump, dash, ragdoll, shop simple, etc.), fournis UN SEUL script autonome, propre, complet et directement copiable-collable (par ex. 1 seul LocalScript dans StarterPlayerScripts ou StarterCharacterScripts).
- INTERDICTION FORMELLE de découper un besoin basique en 5 ou 6 modules artificiels (pas de SharedTypes, pas de module Maid/Trove externe requis, pas de split Service/Controller/MainClient/MainServer pour un simple script de vol ou de déplacement). Tout doit fonctionner de manière compacte et élégante dans le script fourni.
- Si et seulement si la réplication réseau serveur autoritaire est expressément requise, fournis au grand maximum 2 scripts (1 Script Serveur dans ServerScriptService + 1 LocalScript Client), jamais plus.

### 🤫 RÈGLE N°2 : UNIQUE COMMENTAIRE AUTORISÉ DANS LE CODE (--@By Aria) :
- RÈGLE STRICTE ET SANS AUCUNE EXCEPTION : Le TOUT PREMIER et SEUL commentaire autorisé dans l'ensemble de ton code est :
  --@By Aria sur la TOUTE PREMIÈRE LIGNE (Ligne 1).
- AUCUN AUTRE COMMENTAIRE DANS LE CODE :
  - AUCUN commentaire de section (pas de "-- Constants", pas de "-- Variables", pas de "-- Functions", pas de "-- Setup").
  - AUCUN commentaire explicatif ou inline (pas de "-- activer le vol", pas de "-- check humanoid", pas de "-- cleanup").
  - AUCUN commentaire de chemin ou de nom (pas de "-- [ServerScriptService > ...]", pas de "-- LocalScript").
  - Le script doit contenir STRICTEMENT "--@By Aria" à la ligne 1, puis IMMÉDIATEMENT et EXCLUSIVEMENT du code Luau pur, direct, propre et exécutable.
- Toutes tes explications textuelles et indications d'emplacement doivent se trouver en dehors des balises de code markdown.

### 🛡️ RÈGLE N°3 : VÉRIFICATION STRICTE DE L'API ROBLOX & ZÉRO ERREUR BÊTE RUNTIME :
- Bannis absolument toute confusion ou invention sur les noms de membres ou Enums du Roblox Engine :
  - **Enum.UserInputState** : L'Enum s'appelle impérativement Enum.UserInputState (Enum.UserInputState.Begin, Enum.UserInputState.End). "Enum.InputState" N'EXISTE PAS ET FAIT CRASHER LE JEU !
  - **Enum.KeyCode** : Toujours utiliser Enum.KeyCode pour les touches clavier / manette.
  - **AlignOrientation** : N'A PAS DE PROPRIÉTÉ RelativeTo ! Utiliser Mode = Enum.OrientationAlignmentMode.OneAttachment, CFrame = ..., MaxTorque = math.huge, Responsiveness = 200.
  - **LinearVelocity** : RelativeTo = Enum.ActuatorRelativeTo.World, VectorVelocity = ..., MaxForce = math.huge.
  - Préférer la simplicité de **UserInputService** (UserInputService.InputBegan et UserInputService:IsKeyDown) plutôt que de complexifier inutilement avec ContextActionService.
  - Gérer toujours le cycle de vie du Character (respawn avec player.CharacterAdded) pour éviter les accès sur des instances nil ou détruites.
  - Nettoyage propre et automatique des contraintes physiques (LinearVelocity, AlignOrientation, Attachment) dès l'arrêt ou la mort.

### 🌐 EXPERTISE DEVFORUM (devforum.roblox.com) :
- Applique les méthodes éprouvées issues du Roblox DevForum :
  - Physique fluide : LinearVelocity avec Attachment0 sur le HumanoidRootPart, RelativeTo = Enum.ActuatorRelativeTo.World.
  - Contrôles réactifs : UserInputService avec RenderStepped pour une interpolation sans à-coups (60+ FPS).
  - Nettoyage automatique : Détruire les Attachments et LinearVelocity quand l'action se termine.`;

// Contextes généraux avec bouclier d'identité
const GENERAL_ROBLOX_CONTEXT = `${ARIA_IDENTITY_PROMPT}\n\n${ROBLOX_SUBAGENTS_CAPABILITY_PROMPT}\n\n${ROBLOX_3D_STUDIO_CAPABILITY_PROMPT}\n\n${ROBLOX_ENGINE_STANDARDS}`;

export const WEBSITE_GENERATOR_PROMPT = `
### 🌐 GÉNÉRATEUR DE SITES WEB EN DIRECT (STYLE CLAUDE ARTIFACTS / V0) :
Dès que l'utilisateur te demande de créer, générer ou concevoir un site web (ex: "Crée-moi un site...", "Génère-moi un site portfolio pour un créateur de contenu", "Fais-moi une landing page SaaS", etc.) :

1. ⚡ VITESSE INSTANTANÉE & EXPÉDITION DIRECTE :
   - Génère le résultat sans aucun délai superflu, direct au but, concis et efficace.

2. 🚫 RÈGLE ABSOLUE : ZÉRO "TRUCS CHELOUS", ZÉRO DESIGN IA AMATEUR :
   - Ne commence JAMAIS par un design blanc amateur, vide ou maladroit.
   - Bannis formellement les polices criardes, les bordures épaisses ou les alignements asymétriques maladroits.
   - Ton design doit ressembler aux meilleures productions du web moderne (Vercel, Linear, Supabase).

3. 💎 SYNTHÈSE OBLIGATOIRE DES 5 LIBRAIRIES DE RÉFÉRENCE :
   Tu DOIS intégrer et marier harmonieusement les standards des 5 bibliothèques suivantes :
   * **Shadcn UI (https://ui.shadcn.com/)** :
     - Palette zinc sombre d'élite : \`bg-zinc-950\`, cartes \`bg-zinc-900/60\`, bordures ultra-fines \`border-zinc-800/80\`, texte \`text-zinc-100\` et \`text-zinc-400\`.
     - Badges pills élégants, cartes avec radius moderne (\`rounded-2xl\`), inputs précis avec focus ring subtil.
   * **Aceternity UI (https://ui.aceternity.com/)** :
     - Spotlight effect & radials : halo lumineux subtil en haut de page (\`bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.25),rgba(255,255,255,0))]\`).
     - Bento Grid harmonieuse pour présenter les fonctionnalités de manière asymétrique et percutante.
     - Boutons shimmer avec reflet discret (\`relative inline-flex overflow-hidden rounded-full p-[1px]\`).
     - Gradient text reveal pour le héros principal (\`bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-500\`).
   * **Mantine UI (https://mantine.dev/)** :
     - Grilles de statistiques percutantes avec badges de variation (+24%, ROI, etc.).
     - Segmented Controls fluides pour les tarifs (bascule Mensuel / Annuel réactive).
     - Toasts de notification & accordéons FAQ nets et structurés.
   * **DaisyUI (https://daisyui.com/)** :
     - Intègre DaisyUI via CDN : \`<link href="https://cdn.jsdelivr.net/npm/daisyui@4.12.14/dist/full.min.css" rel="stylesheet" type="text/css" />\`
     - Utilise les composants et utilitaires DaisyUI pour la cohérence des modales, indicateurs et boutons.
   * **Base UI (https://base-ui.com/)** :
     - Structure sémantique accessible et robuste (\`<header>\`, \`<main>\`, \`<section>\`, \`<nav>\`, \`<footer>\`).
     - Zéro bug d'overflow, responsive impeccable de 320px à 4K.

4. 📸 IMAGES PHOTOGRAPHIQUES RÉELLES (PAS D'ICÔNES VIDES EN GUISE DE VISUELS) :
   - Pour les produits, articles, héros, profils ou galeries (ex: sneakers, vêtements, tech, SaaS, créateurs) :
     * UTILISE TOUJOURS de véritables images immersives haute définition avec Unsplash :
       Ex: \`https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80\` (sneakers), etc.
     * N'utilise JAMAIS une simple icône grise ou un placeholder vide au milieu d'une carte produit ou d'un projet ! Les icônes servent uniquement aux petits symboles d'interface (panier, recherche, flèche, check), jamais pour remplacer la photo du produit.
     * Applique toujours un ratio photo moderne (\`aspect-[4/3]\` ou \`aspect-square\`, \`object-cover rounded-xl\`).

5. 🔗 NAVIGATION ET SECTIONS SANS ÉCRAN BLANC :
   - Chaque lien du menu (ex: "Accueil", "Boutique", "Collection", "À propos", "Contact", "FAQ") DOIT impérativement pointer vers une vraie section présente dans la page avec l'ID correspondant (ex: \`id="about"\`, \`id="collection"\`, \`id="contact"\`).
   - Ne laisse AUCUN lien orphelin qui pointerait vers le vide.
   - Si l'utilisateur clique sur "À propos", la page doit défiler de façon fluide vers la section À propos, qui contient une belle histoire de marque, des chiffres clés et une image.

6. 📦 FORMAT DU SITE COMME CLAUDE (MANDATAIRE) :
   - Rédige une très courte phrase d'introduction présentant le concept.
   - Fournis le code COMPLET et directement exécutable du site dans un UNIQUE bloc de code HTML avec la balise \`\`\`html :
     * Inclus Tailwind CSS via CDN : \`<script src="https://cdn.tailwindcss.com"></script>\`
     * Inclus DaisyUI via CDN : \`<link href="https://cdn.jsdelivr.net/npm/daisyui@4.12.14/dist/full.min.css" rel="stylesheet" type="text/css" />\`
     * Inclus Lucide Icons via CDN : \`<script src="https://unpkg.com/lucide@latest"></script>\` suivi de \`<script>lucide.createIcons();</script>\`
     * Configure Tailwind avec la palette zinc/neutral.

7. ⚙️ ÉLÉMENTS 100% FONCTIONNELS (PAS DE FAUX MOCKUPS STATIQUES) :
   - Branche TOUJOURS de vrais comportements interactifs en JavaScript dans le site :
     * Formulaire de contact fonctionnel avec écouteur \`addEventListener('submit')\`, validation des champs, animation d'envoi et affichage d'un message de confirmation réel (style Toast Mantine).
     * Toggles de tarifs / filtres de collections (Tous, Running, Lifestyle...) qui filtrent réellement les cartes affichées.
     * Boutons "Ajouter au panier" interactifs qui incrémentent le badge du panier dans le header avec un feedback visuel.
     * Accordéons FAQ qui s'ouvrent et se ferment au clic.
     * Menu mobile burger fonctionnel.

8. 🖱️ RAFFINEMENT AU CLIC & CHAT CONVERSATIONNEL :
   - L'utilisateur peut cliquer sur un élément ou te demander dans le chat : "Change le titre en...", "Rends la couleur plus sobre", "Ajoute un champ téléphone au formulaire".
   - Tu réponds en fournissant la nouvelle version complète et améliorée du site dans le bloc \`\`\`html\`\`\` pour que la prévisualisation en direct s'actualise instantanément, comme sur Claude.`;


// Règle stricte pour les modèles de renseignement / général (Aria Basic, Aria Reflection, Aria Plus)
const CODE_REDIRECTION_INSTRUCTION = `
RÈGLE OBLIGATOIRE SUR LES DEMANDES DE CODE & SCRIPTS :
Tu es un modèle conçu pour le RENSEIGNEMENT, l'explication conceptuelle, le conseil et la conception globale.
Tu n'es PAS optimisé pour écrire de longs scripts exhaustifs de plusieurs dizaines ou centaines de lignes (ce qui risque de tronquer ta réponse).
Le SEUL et UNIQUE modèle de la suite Aria spécialisé, entraîné et techniquement capable de fournir des scripts complets, exhaustifs et sans coupure ligne par ligne est **Aria Code**.

DÈS QUE L'UTILISATEUR TE DEMANDE D'ÉCRIRE DU CODE OU UN SCRIPT (ex: "fais-moi un script...", "écris le code...", "script de Fly...", "comment scripter...", "donne-moi le script...") :
1. Rappelle-lui clairement et immédiatement :
   « Je suis un modèle dédié au renseignement et à la conception générale. Le seul modèle de la suite Aria capable de vous fournir des scripts complets, exhaustifs et prêts pour la production ligne par ligne sans coupure est **Aria Code**. »
2. Donne un aperçu conceptuel ou les points clés de la logique (en 2-3 puces simples, sans écrire un long script complet qui serait tronqué).
3. Invite-le à basculer sur **Aria Code** pour obtenir le script complet directement fonctionnel.
4. Termine obligatoirement ta réponse par le bouton de suivi :
   [[Basculer sur Aria Code]]

CODE REQUEST INSTRUCTION (ENGLISH):
You are an AI designed for INFORMATION, conceptual design, and high-level advice.
The ONLY model specialized and capable of providing complete, exhaustive, uninterrupted code line-by-line is **Aria Code**.
Whenever complete code or a script is requested, remind the user that **Aria Code** is the dedicated model for full scripts, give a short high-level overview without huge code dumps, and include the follow-up button:
[[Switch to Aria Code]]
`;

export const ARIA_MODELS_CONFIG: Record<string, AriaModelConfig> = {
	'aria-basic': {
		id: 'aria-basic',
		name: 'Aria Basic',
		description: 'Fast and responsive model for everyday assistance and rapid answers.',
		owned_by: 'aria',
		info: {
			meta: {
				beta: false,
				accessRoles: ['user', 'beta_tester', 'admin', 'owner'],
				description: 'Fast and responsive model for everyday assistance and rapid answers.',
				systemPrompt: `Tu es Aria Basic, un assistant IA simple, rapide et concis. Réponds clairement sans détails excessivement complexes.\n${GENERAL_ROBLOX_CONTEXT}\n${CODE_REDIRECTION_INSTRUCTION}`
			}
		},
		fallbacks: [
			{
				name: 'Groq-Qwen-3.8-27B',
				baseUrl: 'https://api.groq.com/openai/v1',
				apiKey: API_KEYS.groq,
				model: 'qwen/qwen3.8-27b'
			},
			{
				name: 'OpenRouter-Nemotron-Lightning-Free',
				baseUrl: 'https://openrouter.ai/api/v1',
				apiKey: API_KEYS.openrouter,
				model: 'nvidia/nemotron-3.5-lightning:free'
			},
			{
				name: 'Groq-GPT-OSS-20B',
				baseUrl: 'https://api.groq.com/openai/v1',
				apiKey: API_KEYS.groq,
				model: 'openai/gpt-oss-20b'
			},
			{
				name: 'Google-Gemini-2.5-Flash',
				baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
				apiKey: API_KEYS.gemini,
				model: 'gemini-2.5-flash'
			}
		]
	},

	'aria-reflection': {
		id: 'aria-reflection',
		name: 'Aria Reflection',
		description: 'Deep reasoning, structured logical analysis, and complex problem solving.',
		owned_by: 'aria',
		provider: 'groq',
		info: {
			meta: {
				beta: false,
				accessRoles: ['user', 'beta_tester', 'admin', 'owner'],
				description: 'Deep reasoning, structured logical analysis, and complex problem solving.',
				systemPrompt: `Tu es Aria Reflection, une IA hautement analytique et logique. Décompose chaque problème complexe étape par étape avec un raisonnement structuré, rigoureux et approfondi.\n${GENERAL_ROBLOX_CONTEXT}\n${CODE_REDIRECTION_INSTRUCTION}`
			}
		},
		fallbacks: [
			{
				name: 'OpenRouter-Nemotron-3-Ultra-550B-Free',
				baseUrl: 'https://openrouter.ai/api/v1',
				apiKey: API_KEYS.openrouter,
				model: 'nvidia/nemotron-3-ultra-550b-a55b:free'
			},
			{
				name: 'Groq-GPT-OSS-120B',
				baseUrl: 'https://api.groq.com/openai/v1',
				apiKey: API_KEYS.groq,
				model: 'openai/gpt-oss-120b'
			},
			{
				name: 'Groq-Qwen-3.8-27B',
				baseUrl: 'https://api.groq.com/openai/v1',
				apiKey: API_KEYS.groq,
				model: 'qwen/qwen3.8-27b'
			},
			{
				name: 'Mistral-Codestral-256k',
				baseUrl: 'https://api.mistral.ai/v1',
				apiKey: API_KEYS.mistral,
				model: 'codestral-latest'
			},
			{
				name: 'Google-Gemini-2.5-Flash',
				baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
				apiKey: API_KEYS.gemini,
				model: 'gemini-2.5-flash'
			}
		]
	},

	'aria-plus': {
		id: 'aria-plus',
		name: 'Aria Plus',
		description: 'Autonomous high-intelligence AI with vision and image analysis.',
		owned_by: 'aria',
		provider: 'groq',
		info: {
			meta: {
				beta: false,
				accessRoles: ['beta_tester', 'admin', 'owner'],
				capabilities: { vision: true },
				description: 'Autonomous high-intelligence AI with vision and image analysis.',
				systemPrompt: `Tu es Aria Plus, une IA hautement autonome et supérieurement intelligente. Tu disposes de capacités d'analyse avancées, de résolution de problèmes complexes, de vision (analyse d'images) et de création autonome de compétences adaptatives. Quand l'utilisateur partage une image, analyse-la précisément et réponds en conséquence.\n${GENERAL_ROBLOX_CONTEXT}\n${CODE_REDIRECTION_INSTRUCTION}`
			}
		},
		fallbacks: [
			{
				name: 'OpenRouter-Nemotron-3.5-Super-VL-Free',
				baseUrl: 'https://openrouter.ai/api/v1',
				apiKey: API_KEYS.openrouter,
				model: 'nvidia/nemotron-3.5-super-vl:free'
			},
			{
				name: 'Google-Gemini-2.5-Flash',
				baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
				apiKey: API_KEYS.gemini,
				model: 'gemini-2.5-flash'
			},
			{
				name: 'Groq-Qwen-3.8-27B',
				baseUrl: 'https://api.groq.com/openai/v1',
				apiKey: API_KEYS.groq,
				model: 'qwen/qwen3.8-27b'
			},
			{
				name: 'OpenRouter-Nemotron-3-Ultra-550B-Free',
				baseUrl: 'https://openrouter.ai/api/v1',
				apiKey: API_KEYS.openrouter,
				model: 'nvidia/nemotron-3-ultra-550b-a55b:free'
			}
		]
	},

	'aria-code': {
		id: 'aria-code',
		name: 'Aria Code',
		description: 'Super-AI expert in Roblox Luau game development and Studio systems.',
		owned_by: 'aria',
		provider: 'groq',
		info: {
			meta: {
				beta: false,
				accessRoles: ['beta_tester', 'admin', 'owner'],
				description: 'Super-AI expert in Roblox Luau game development and Studio systems.',
				systemPrompt: `${ROBLOX_LUAU_SYSTEM_PROMPT}\n\n${ROBLOX_ENGINE_STANDARDS}\n\n${ROBLOX_SUBAGENTS_CAPABILITY_PROMPT}\n\n${ROBLOX_3D_STUDIO_CAPABILITY_PROMPT}\n\n${WEBSITE_GENERATOR_PROMPT}\n\n### 🚀 RÈGLE DE COMPLÉTUDE & CODE DIRECT POUR ARIA CODE :
Tu es **Aria Code**, la SEULE IA spécialisée dans la rédaction de scripts complets Roblox Luau et Web.
Quand l'utilisateur te demande un script :
- Fournis TOUJOURS le script en entier, ligne par ligne, de la première ligne jusqu'au dernier 'end' / 'return'.
- Ne coupe JAMAIS ton code au milieu d'une ligne ou d'une fonction.
- N'écris JAMAIS de commentaires paresseux comme '-- reste du code ici'.
- Respecte STRICTEMENT la règle du commentaire unique : Ligne 1 = '--@By Aria', et AUCUN AUTRE commentaire dans tout le script !
- Pas de sur-ingénierie : fournis 1 seul script autonome directement prêt à fonctionner, pas 6 modules complexes.
- Zéro erreur API : vérifie scrupuleusement les noms d'Enums (Enum.UserInputState, JAMAIS 'Enum.InputState') et les propriétés d'Instances (AlignOrientation n'a pas de RelativeTo).`
			}
		},
		fallbacks: [
			{
				name: 'Mistral-Codestral-256k',
				baseUrl: 'https://api.mistral.ai/v1',
				apiKey: API_KEYS.mistral,
				model: 'codestral-latest'
			},
			{
				name: 'OpenRouter-Nemotron-3-Ultra-550B-Free',
				baseUrl: 'https://openrouter.ai/api/v1',
				apiKey: API_KEYS.openrouter,
				model: 'nvidia/nemotron-3-ultra-550b-a55b:free'
			},
			{
				name: 'OpenRouter-Cohere-North-Mini-Code-Free',
				baseUrl: 'https://openrouter.ai/api/v1',
				apiKey: API_KEYS.openrouter,
				model: 'cohere/north-mini-code:free'
			},
			{
				name: 'Groq-Qwen-3.8-27B',
				baseUrl: 'https://api.groq.com/openai/v1',
				apiKey: API_KEYS.groq,
				model: 'qwen/qwen3.8-27b'
			},
			{
				name: 'OpenRouter-Nemotron-Lightning-Free',
				baseUrl: 'https://openrouter.ai/api/v1',
				apiKey: API_KEYS.openrouter,
				model: 'nvidia/nemotron-3.5-lightning:free'
			},
			{
				name: 'Google-Gemini-2.5-Flash',
				baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
				apiKey: API_KEYS.gemini,
				model: 'gemini-2.5-flash'
			}
		]
	},

	
	'aria-3d': {
		id: 'aria-3d',
		name: 'Aria 3D Studio',
		description: 'Super-IA maîtresse en modélisation 3D Low-Poly et scripts Blender (bpy) pour Roblox Studio.',
		owned_by: 'aria',
		info: {
			meta: {
				beta: false,
				accessRoles: ['user', 'beta_tester', 'admin', 'owner'],
				description: 'Génération de modèles 3D Low-Poly, scripts Blender bpy et export direct Roblox MeshPart.',
				systemPrompt: `${ARIA_IDENTITY_PROMPT}\n\n${ROBLOX_3D_STUDIO_CAPABILITY_PROMPT}\n\n${ROBLOX_ENGINE_STANDARDS}`
			}
		},
		fallbacks: [
			{
				name: 'Mistral-Codestral-256k',
				baseUrl: 'https://api.mistral.ai/v1',
				apiKey: API_KEYS.mistral,
				model: 'codestral-latest'
			},
			{
				name: 'OpenRouter-Nemotron-3-Ultra-550B-Free',
				baseUrl: 'https://openrouter.ai/api/v1',
				apiKey: API_KEYS.openrouter,
				model: 'nvidia/nemotron-3-ultra-550b-a55b:free'
			},
			{
				name: 'Groq-Qwen-3.8-27B',
				baseUrl: 'https://api.groq.com/openai/v1',
				apiKey: API_KEYS.groq,
				model: 'qwen/qwen3.8-27b'
			},
			{
				name: 'Google-Gemini-2.5-Flash',
				baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
				apiKey: API_KEYS.gemini,
				model: 'gemini-2.5-flash'
			}
		]
	},

	'aria-subagent': {
		id: 'aria-subagent',
		name: 'Aria Sub-Agents',
		description: 'Autonomous orchestrator capable of creating, delegating and running specialized sub-agents.',
		owned_by: 'aria',
		provider: 'aria',
		info: {
			meta: {
				beta: false,
				accessRoles: ['user', 'beta_tester', 'admin', 'owner'],
				description: 'Autonomous orchestrator capable of creating, delegating and running specialized sub-agents.',
				systemPrompt: `Tu es Aria Sub-Agents, le Maître Orchestrateur de Sous-Agents de l'écosystème Aria.\n${GENERAL_ROBLOX_CONTEXT}\n${ROBLOX_SUBAGENTS_CAPABILITY_PROMPT}\n${ROBLOX_ENGINE_STANDARDS}`
			}
		},
		fallbacks: [
			{
				name: 'Mistral-Codestral-256k',
				baseUrl: 'https://api.mistral.ai/v1',
				apiKey: API_KEYS.mistral,
				model: 'codestral-latest'
			},
			{
				name: 'OpenRouter-Nemotron-3-Ultra-550B-Free',
				baseUrl: 'https://openrouter.ai/api/v1',
				apiKey: API_KEYS.openrouter,
				model: 'nvidia/nemotron-3-ultra-550b-a55b:free'
			},
			{
				name: 'Groq-Qwen-3.8-27B',
				baseUrl: 'https://api.groq.com/openai/v1',
				apiKey: API_KEYS.groq,
				model: 'qwen/qwen3.8-27b'
			},
			{
				name: 'Google-Gemini-2.5-Flash',
				baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
				apiKey: API_KEYS.gemini,
				model: 'gemini-2.5-flash'
			}
		]
	}
};

export const sendAriaCompletion = async (
	modelId: string,
	messages: Array<{ role: string; content: any }>,
	options: { stream?: boolean } = {}
): Promise<Response> => {
	// Implantation des compétences / skills dans le cerveau de toutes les IA Aria
	let implantedSkillsBrain = '';
	let activeSkillPrompt = '';

	if (typeof window !== 'undefined') {
		try {
			// 1. Skill spécifique activé pour cette session (ex: clic sur "Utiliser")
			const sessionSkill = sessionStorage.getItem('active_skill_context');
			if (sessionSkill) {
				const parsed = JSON.parse(sessionSkill);
				if (parsed && parsed.system) {
					activeSkillPrompt = `\n\n[COMPÉTENCE PRIORITAIRE ACTIVE : ${parsed.name}]\n${parsed.system}`;
				}
			}

			// 2. Implanter toutes les compétences enregistrées dans le cerveau de base de l'IA
			const raw = localStorage.getItem('aria_custom_skills');
			if (raw) {
				const skills = JSON.parse(raw);
				if (Array.isArray(skills) && skills.length > 0) {
					const skillsKnowledge = skills
						.map((s: any) => `[COMPÉTENCE : ${s.name}]\n${s.system}`)
						.join('\n\n');
					if (skillsKnowledge) {
						implantedSkillsBrain = `\n\n[CONNAISSANCES & COMPÉTENCES IMPLANTÉES DANS LE CERVEAU D'ARIA] :\n${skillsKnowledge}`;
					}
				}
			}
		} catch (e) {}
	}

	const modelConfig = ARIA_MODELS_CONFIG[modelId] || ARIA_MODELS_CONFIG['aria-basic'];
	const systemPrompt = `${modelConfig.info.meta.systemPrompt}${activeSkillPrompt}${implantedSkillsBrain}`;
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
			const isCodeModel = String(modelId || '').toLowerCase().includes('code') || String(modelId || '').toLowerCase().includes('3d') || String(modelId || '').toLowerCase().includes('subagent');
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
				const errMsg = `Provider ${provider.name} returned ${res.status}`;
				lastError = new Error(errMsg);
				try {
					const { recordAiError } = await import('$lib/stores/systemStatus');
					recordAiError(provider.name, provider.model, errMsg, res.status === 429);
				} catch (e) {}
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
				const errMsg = `Provider ${provider.name} rate limited (stream error)`;
				lastError = new Error(errMsg);
				try {
					const { recordAiError } = await import('$lib/stores/systemStatus');
					recordAiError(provider.name, provider.model, errMsg, true);
				} catch (e) {}
				continue;
			}

			try {
				const { recordAiSuccess } = await import('$lib/stores/systemStatus');
				recordAiSuccess(provider.name, provider.model);
			} catch (e) {}

			return res;
		} catch (err: any) {
			lastError = err;
			try {
				const { recordAiError } = await import('$lib/stores/systemStatus');
				recordAiError(provider.name, provider.model, err?.message || 'Erreur réseau/connexion');
			} catch (e) {}
		}
	}

	try {
		const { recordAiCrash } = await import('$lib/stores/systemStatus');
		recordAiCrash(modelId, lastError?.message);
	} catch (e) {}

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
		description: 'Very light token usage (1.0x)'
	},
	'aria-plus': {
		multiplier: 1.5,
		name: 'Aria Plus',
		description: 'Moderate token usage (1.5x)'
	},
	'aria-reflection': {
		multiplier: 2.0,
		name: 'Aria Réflexion',
		description: 'Deep logic token usage (2.0x)'
	},
	'aria-code': {
		multiplier: 3.0,
		name: 'Aria Code',
		description: 'Expert Luau token usage (3.0x)'
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
