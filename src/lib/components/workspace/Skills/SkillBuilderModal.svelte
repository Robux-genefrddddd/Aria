<script lang="ts">
	import { getContext, onMount, tick } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { user } from '$lib/stores';
	import { sendAriaCompletion } from '$lib/utils/ariaModels';
	import { saveCustomSkill, type CustomSkill } from '$lib/apis/customSkills';

	const i18n = getContext('i18n');

	export let show = false;
	export let onSave: (skill: CustomSkill) => void = () => {};
	export let editingSkill: CustomSkill | null = null;

	let activeTab: 'create' | 'configure' = 'create';

	// Paramètres déduits du Skill
	let skillName = '';
	let skillDescription = '';
	let skillInstructions = '';
	let skillVisibility: 'public' | 'private' = 'public';
	let skillTags = 'Roblox, IA';

	$: if (editingSkill) {
		skillName = editingSkill.name || '';
		skillDescription = editingSkill.description || '';
		skillInstructions = editingSkill.system || '';
		skillVisibility = editingSkill.visibility || 'public';
		skillTags = (editingSkill.tags || []).join(', ') || 'Roblox, IA';
		activeTab = 'configure';
	}

	// État du chat conversationnel
	interface ChatMessage {
		role: 'assistant' | 'user';
		content: string;
	}

	let messages: ChatMessage[] = [
		{
			role: 'assistant',
			content:
				"Bonjour, je suis le Skill Builder. Décrivez le modèle ou le rôle que vous souhaitez concevoir (instructions, domaine de compétence, ton) :"
		}
	];

	let inputText = '';
	let isGenerating = false;
	let chatContainer: HTMLDivElement;

	const scrollToBottom = async () => {
		await tick();
		if (chatContainer) {
			chatContainer.scrollTop = chatContainer.scrollHeight;
		}
	};

	const extractParametersFromAiResponse = (content: string) => {
		// Extraction automatique via balises structurées ou JSON si renvoyé par l'IA
		const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
		if (jsonMatch) {
			try {
				const parsed = JSON.parse(jsonMatch[1]);
				if (parsed.name) skillName = parsed.name;
				if (parsed.description) skillDescription = parsed.description;
				if (parsed.instructions || parsed.system) skillInstructions = parsed.instructions || parsed.system;
				if (parsed.visibility) skillVisibility = parsed.visibility === 'private' ? 'private' : 'public';
			} catch (e) {}
		}

		// Extraction par motifs regex heuristiques
		const nameMatch = content.match(/(?:Nom suggéré|Nom du Skill|Name)\s*:\s*([^\n\r]+)/i);
		if (nameMatch && !skillName) skillName = nameMatch[1].replace(/[*_"`]/g, '').trim();

		const descMatch = content.match(/(?:Description)\s*:\s*([^\n\r]+)/i);
		if (descMatch && !skillDescription) skillDescription = descMatch[1].replace(/[*_"`]/g, '').trim();

		const instMatch = content.match(/(?:Instructions|Rôle système|Prompt système)\s*:\s*([\s\S]+?)(?=\n\n[A-Z]|$)/i);
		if (instMatch && !skillInstructions) skillInstructions = instMatch[1].trim();
	};

	const sendMessage = async () => {
		const userQuery = inputText.trim();
		if (!userQuery || isGenerating) return;

		inputText = '';
		messages = [...messages, { role: 'user', content: userQuery }];
		await scrollToBottom();

		isGenerating = true;

		const systemPrompt = `Tu es le "Skill Builder" officiel d'Aria Studio, inspiré du GPT Builder de ChatGPT.
Ton objectif est de co-concevoir avec l'utilisateur un Skill d'IA personnalisé pour Roblox Studio ou l'écosystème Aria.
À chaque message de l'utilisateur :
1. Analyse son besoin avec enthousiasme et pose 1 ou 2 questions stimulantes pour affiner le ton, les règles et les connaissances du Skill.
2. Déduis et formalise à la fin de ta réponse un bloc JSON délimitant les paramètres du Skill :
\`\`\`json
{
  "name": "Nom accrocheur du Skill",
  "description": "Une description claire en 1-2 phrases",
  "instructions": "Le prompt système complet et détaillé définissant le rôle de l'assistant",
  "visibility": "public"
}
\`\`\`
Reste concis, chaleureux, professionnel et efficace en français.`;

		const formattedForApi = [
			{ role: 'system', content: systemPrompt },
			...messages.map((m) => ({ role: m.role, content: m.content }))
		];

		try {
			const res = await sendAriaCompletion('aria-basic', formattedForApi, { stream: false });
			if (res.ok) {
				const json = await res.json();
				const reply = json.choices?.[0]?.message?.content || "Je n'ai pas pu générer de réponse.";
				messages = [...messages, { role: 'assistant', content: reply }];
				extractParametersFromAiResponse(reply);
			} else {
				messages = [
					...messages,
					{
						role: 'assistant',
						content:
							"D'accord ! J'ai bien noté vos consignes. Vous pouvez affiner les paramètres dans l'onglet Configuration."
					}
				];
				if (!skillName) skillName = userQuery.slice(0, 30);
				if (!skillInstructions) skillInstructions = `Tu es un assistant IA spécialisé : ${userQuery}`;
			}
		} catch (e: any) {
			messages = [
				...messages,
				{
					role: 'assistant',
					content: `Entendu ! J'ai appliqué vos idées. Vous pouvez personnaliser les détails ci-contre.`
				}
			];
			if (!skillName) skillName = userQuery.slice(0, 30);
		} finally {
			isGenerating = false;
			await scrollToBottom();
		}
	};

	const handleSave = async () => {
		if (!skillName.trim()) {
			toast.error('Veuillez spécifier un nom pour votre Skill.');
			activeTab = 'configure';
			return;
		}

		const id = editingSkill?.id || `skill-${skillName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`;
		const newSkill: CustomSkill = {
			id,
			name: skillName.trim(),
			description: skillDescription.trim() || 'Modèle personnalisé créé avec le Skill Builder.',
			system: skillInstructions.trim() || 'Tu es un assistant IA sur-mesure.',
			profile_image_url: editingSkill?.profile_image_url || '/static/favicon.png',
			visibility: skillVisibility,
			user_id: editingSkill?.user_id || $user?.id || 'QH8wKG8nWZVtUQEy2pppuBuNZgC3',
			user_name: editingSkill?.user_name || $user?.name || 'Fondateur',
			created_at: editingSkill?.created_at || Date.now(),
			updated_at: Date.now(),
			tags: skillTags.split(',').map((t) => t.trim()).filter(Boolean)
		};

		try {
			await saveCustomSkill(newSkill);
			toast.success(
				skillVisibility === 'public'
					? `Skill public "${newSkill.name}" créé avec succès !`
					: `Skill privé "${newSkill.name}" sauvegardé pour votre usage exclusif.`
			);
			onSave(newSkill);
			show = false;
		} catch (e: any) {
			toast.error(`Erreur lors de la sauvegarde : ${e?.message}`);
		}
	};
</script>

{#if show}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
		<div
			class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl overflow-hidden"
		>
			<!-- En-tête -->
			<div class="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-800">
				<div>
					<h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100">
						Skill Builder
					</h2>
					<p class="text-xs text-gray-500 dark:text-gray-400">
						Création conversationnelle d'un modèle d'IA personnalisé
					</p>
				</div>

				<!-- Onglets & Bouton Fermer -->
				<div class="flex items-center gap-2">
					<div class="flex p-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs font-medium">
						<button
							type="button"
							class="px-2.5 py-1 rounded-md transition {activeTab === 'create' ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-xs' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-100'}"
							on:click={() => (activeTab = 'create')}
						>
							Créer
						</button>
						<button
							type="button"
							class="px-2.5 py-1 rounded-md transition {activeTab === 'configure' ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-xs' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-100'}"
							on:click={() => (activeTab = 'configure')}
						>
							Configurer
						</button>
					</div>

					<button
						type="button"
						class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
						on:click={() => (show = false)}
					>
						<svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<line x1="18" y1="6" x2="6" y2="18"></line>
							<line x1="6" y1="6" x2="18" y2="18"></line>
						</svg>
					</button>
				</div>
			</div>

			<!-- Corps Principal -->
			<div class="flex-1 overflow-hidden flex flex-col md:flex-row min-h-0">
				<!-- Vue Conversationnelle (Style GPT Builder) -->
				{#if activeTab === 'create'}
					<div class="flex-1 flex flex-col h-full min-h-0 bg-white dark:bg-gray-900">
						<!-- Messages -->
						<div
							bind:this={chatContainer}
							class="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 scrollbar-thin"
						>
							{#each messages as msg}
								<div class="flex {msg.role === 'user' ? 'justify-end' : 'justify-start'}">
									<div
										class="max-w-[85%] sm:max-w-[75%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed {msg.role === 'user' ? 'bg-amber-500 text-white rounded-br-xs' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-xs'}"
									>
										<div class="whitespace-pre-wrap">{msg.content}</div>
									</div>
								</div>
							{/each}

							{#if isGenerating}
								<div class="flex justify-start">
									<div class="p-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-xs flex items-center gap-2 text-gray-500">
										<span class="animate-pulse">Le Skill Builder réfléchit et extrait vos paramètres...</span>
									</div>
								</div>
							{/if}
						</div>

						<!-- Input Message -->
						<div class="p-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-850/50">
							<form
								on:submit|preventDefault={sendMessage}
								class="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-amber-500/50"
							>
								<input
									type="text"
									bind:value={inputText}
									placeholder="Ex: Fais-en un expert en combat PvP et combos de pouvoirs avec un ton direct..."
									class="flex-1 bg-transparent border-0 outline-none text-xs sm:text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 py-1"
								/>
								<button
									type="submit"
									disabled={!inputText.trim() || isGenerating}
									class="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white text-xs font-medium transition cursor-pointer"
								>
									Envoyer
								</button>
							</form>
						</div>
					</div>

					<!-- Aperçu Rapide des Paramètres Déduits (Barre latérale droite) -->
					<div class="w-full md:w-80 border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-800 p-4 bg-gray-50 dark:bg-gray-950 overflow-y-auto space-y-4">
						<div class="text-xs font-bold uppercase tracking-wider text-gray-500">Paramètres Déduits en Direct</div>

						<div class="space-y-3 text-xs">
							<div>
								<span class="text-gray-400 block mb-1">Nom du Skill :</span>
								<input
									type="text"
									bind:value={skillName}
									placeholder="En attente de discussion..."
									class="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-medium"
								/>
							</div>

							<div>
								<span class="text-gray-400 block mb-1">Description :</span>
								<textarea
									bind:value={skillDescription}
									rows="2"
									placeholder="Déduite automatiquement..."
									class="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 resize-none"
								></textarea>
							</div>

							<div>
								<span class="text-gray-400 block mb-1">Confidentialité & Accès :</span>
								<div class="grid grid-cols-2 gap-1.5">
									<button
										type="button"
										class="p-2 rounded-lg border text-center transition cursor-pointer {skillVisibility === 'public' ? 'border-gray-900 bg-gray-100 dark:border-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-semibold' : 'border-gray-200 dark:border-gray-800 text-gray-500'}"
										on:click={() => (skillVisibility = 'public')}
									>
										Public
									</button>
									<button
										type="button"
										class="p-2 rounded-lg border text-center transition cursor-pointer {skillVisibility === 'private' ? 'border-gray-900 bg-gray-100 dark:border-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-semibold' : 'border-gray-200 dark:border-gray-800 text-gray-500'}"
										on:click={() => (skillVisibility = 'private')}
									>
										Privé
									</button>
								</div>
							</div>
						</div>

						<div class="pt-3 border-t border-gray-200 dark:border-gray-800">
							<button
								type="button"
								class="w-full py-2 px-3 rounded-lg bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 font-medium text-xs transition cursor-pointer"
								on:click={handleSave}
							>
								Sauvegarder le Skill
							</button>
						</div>
					</div>
				{:else}
					<!-- Vue Configuration Manuelle Détaillée -->
					<div class="flex-1 p-6 overflow-y-auto space-y-5 bg-white dark:bg-gray-900 text-xs sm:text-sm">
						<div>
							<label class="block font-semibold mb-1 text-gray-900 dark:text-gray-100">Nom du Skill</label>
							<input
								type="text"
								bind:value={skillName}
								placeholder="Nom du modèle..."
								class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-gray-900 dark:text-gray-100 outline-none"
							/>
						</div>

						<div>
							<label class="block font-semibold mb-1 text-gray-900 dark:text-gray-100">Description du Skill</label>
							<input
								type="text"
								bind:value={skillDescription}
								placeholder="Description courte..."
								class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-gray-900 dark:text-gray-100 outline-none"
							/>
						</div>

						<div>
							<label class="block font-semibold mb-1 text-gray-900 dark:text-gray-100">
								Instructions Système & Rôle de l'Assistant
							</label>
							<p class="text-xs text-gray-500 mb-2">
								Ces instructions définissent le rôle, les règles et la façon dont le modèle doit répondre.
							</p>
							<textarea
								bind:value={skillInstructions}
								rows="8"
								placeholder="Tu es un assistant IA spécialisé dans..."
								class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-gray-900 dark:text-gray-100 outline-none font-mono text-xs"
							></textarea>
						</div>

						<!-- Gestion de la Confidentialité -->
						<div class="p-4 rounded-lg bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-800 space-y-2">
							<label class="block font-semibold text-gray-900 dark:text-gray-100">Visibilité & Accès</label>
							<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
								<label
									class="flex items-start gap-3 p-3 rounded-lg border transition cursor-pointer {skillVisibility === 'public' ? 'border-gray-900 bg-white dark:border-white dark:bg-gray-900' : 'border-gray-200 dark:border-gray-700'}"
								>
									<input type="radio" bind:group={skillVisibility} value="public" class="mt-0.5" />
									<div>
										<div class="font-semibold text-gray-900 dark:text-gray-100">Skill Public</div>
										<p class="text-xs text-gray-500 mt-0.5">
											Accessible, visible et utilisable par tout le monde dans la liste.
										</p>
									</div>
								</label>

								<label
									class="flex items-start gap-3 p-3 rounded-lg border transition cursor-pointer {skillVisibility === 'private' ? 'border-gray-900 bg-white dark:border-white dark:bg-gray-900' : 'border-gray-200 dark:border-gray-700'}"
								>
									<input type="radio" bind:group={skillVisibility} value="private" class="mt-0.5" />
									<div>
										<div class="font-semibold text-gray-900 dark:text-gray-100">Skill Privé</div>
										<p class="text-xs text-gray-500 mt-0.5">
											Le créateur (ou fondateur) est le seul à pouvoir l'ouvrir et l'utiliser. Les autres utilisateurs verront le nom mais le bouton d'accès sera bloqué.
										</p>
									</div>
								</label>
							</div>
						</div>
					</div>
				{/if}
			</div>

			<!-- Pied de page -->
			<div class="px-5 py-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 flex items-center justify-between">
				<button
					type="button"
					class="px-3.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-xs font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition"
					on:click={() => (show = false)}
				>
					Annuler
				</button>

				<button
					type="button"
					class="px-4 py-1.5 rounded-lg bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 font-medium text-xs transition cursor-pointer"
					on:click={handleSave}
				>
					Enregistrer le Skill
				</button>
			</div>
		</div>
	</div>
{/if}
