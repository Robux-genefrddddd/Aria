<script lang="ts">
	import { getContext } from 'svelte';
	import { toast } from 'svelte-sonner';
	import Modal from '../common/Modal.svelte';
	import XMark from '$lib/components/icons/XMark.svelte';
	import Sparkles from '$lib/components/icons/Sparkles.svelte';
	import Plus from '$lib/components/icons/Plus.svelte';
	import Trash from '$lib/components/icons/Trash.svelte';
	import Play from '$lib/components/icons/Play.svelte';
	import Spinner from '../common/Spinner.svelte';

	import {
		subagents,
		registerSubagent,
		deleteSubagent,
		executeSubagent,
		activeSubagentExecutions
	} from '$lib/services/subagents/subagentStore';
	import type { AriaSubagent, SubagentExecutionTask } from '$lib/services/subagents/subagentTypes';

	const i18n = getContext('i18n');

	export let show = false;
	export let onSelectSubagent: ((subagent: AriaSubagent) => void) | undefined = undefined;

	let searchQuery = '';
	let activeTab: 'list' | 'create' | 'run' = 'list';
	let selectedSubagent: AriaSubagent | null = null;

	// Formulaire de création
	let newName = '';
	let newRole = '';
	let newDescription = '';
	let newModel: 'aria-code' | 'aria-reflection' | 'aria-basic' | 'aria-plus' = 'aria-code';
	let newSystemPrompt = '';

	// Test d'exécution
	let testTask = '';
	let isExecuting = false;
	let currentExecution: SubagentExecutionTask | null = null;

	$: filteredSubagents = ($subagents || []).filter((agent) => {
		if (!searchQuery) return true;
		const q = searchQuery.toLowerCase();
		return (
			agent.name.toLowerCase().includes(q) ||
			agent.role.toLowerCase().includes(q) ||
			agent.description.toLowerCase().includes(q) ||
			(agent.tags && agent.tags.some((t) => t.toLowerCase().includes(q)))
		);
	});

	const handleCreate = () => {
		if (!newName.trim() || !newSystemPrompt.trim()) {
			toast.error('Le nom et les instructions du sous-agent sont obligatoires.');
			return;
		}

		const created = registerSubagent({
			name: newName.trim(),
			role: newRole.trim() || 'Spécialiste Technique',
			description: newDescription.trim() || 'Sous-agent spécialisé dans ce domaine.',
			model: newModel,
			systemPrompt: newSystemPrompt.trim()
		});

		toast.success(`Sous-agent "${created.name}" créé avec succès.`);
		newName = '';
		newRole = '';
		newDescription = '';
		newSystemPrompt = '';
		activeTab = 'list';
	};

	const handleDelete = (id: string, name: string) => {
		if (confirm(`Voulez-vous supprimer le sous-agent "${name}" ?`)) {
			const ok = deleteSubagent(id);
			if (ok) {
				toast.success(`Sous-agent "${name}" supprimé.`);
			} else {
				toast.error('Ce sous-agent système ne peut pas être supprimé.');
			}
		}
	};

	const handleRunTest = async (agent: AriaSubagent) => {
		if (!testTask.trim()) {
			toast.error('Précisez la tâche à exécuter.');
			return;
		}
		isExecuting = true;
		currentExecution = null;
		try {
			const res = await executeSubagent(agent, testTask);
			currentExecution = res;
			if (res.status === 'completed') {
				toast.success(`Tâche exécutée par ${agent.name} (${res.durationMs}ms)`);
			} else {
				toast.error(`Erreur : ${res.error}`);
			}
		} catch (err: any) {
			toast.error(`Erreur : ${err?.message}`);
		} finally {
			isExecuting = false;
		}
	};

	const handleUseInChat = (agent: AriaSubagent) => {
		if (onSelectSubagent) {
			onSelectSubagent(agent);
		}
		show = false;
	};
</script>

<Modal bind:show size="xl">
	<div class="flex flex-col h-[680px] max-h-[85vh] bg-white dark:bg-gray-900 rounded-3xl overflow-hidden">
		<!-- Header Sobre et Professionnel -->
		<div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
			<div class="flex items-center gap-2.5">
				<div class="size-8 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 flex items-center justify-center">
					<Sparkles className="size-4" />
				</div>
				<div>
					<div class="flex items-center gap-2">
						<h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Sous-Agents de Développement</h2>
						<span class="px-2 py-0.5 text-[10px] font-medium rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
							Roblox Studio
						</span>
					</div>
					<p class="text-xs text-gray-500 dark:text-gray-400">
						Délégation ciblée à des modèles spécialisés (256k à 1M de tokens).
					</p>
				</div>
			</div>

			<div class="flex items-center gap-2">
				<!-- Tabs navigation -->
				<div class="flex items-center bg-gray-100 dark:bg-gray-800 p-0.5 rounded-xl text-xs font-medium">
					<button
						type="button"
						class="px-3 py-1.5 rounded-lg transition {activeTab === 'list'
							? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
							: 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}"
						on:click={() => (activeTab = 'list')}
					>
						Sous-Agents ({filteredSubagents.length})
					</button>
					<button
						type="button"
						class="px-3 py-1.5 rounded-lg transition flex items-center gap-1 {activeTab === 'create'
							? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
							: 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}"
						on:click={() => (activeTab = 'create')}
					>
						<Plus className="size-3.5" />
						Ajouter
					</button>
				</div>

				<button
					type="button"
					class="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
					on:click={() => (show = false)}
				>
					<XMark className="size-5" />
				</button>
			</div>
		</div>

		<!-- Body -->
		<div class="flex-1 overflow-y-auto p-6">
			{#if activeTab === 'list'}
				<!-- Search -->
				<div class="mb-5">
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="Rechercher par domaine, rôle ou intitulé..."
						class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-hidden focus:ring-1 focus:ring-gray-400"
					/>
				</div>

				<!-- Grid of Subagents -->
				<div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
					{#each filteredSubagents as agent (agent.id)}
						<div
							class="flex flex-col justify-between p-4 rounded-2xl border border-gray-200/70 dark:border-gray-800 bg-white dark:bg-gray-850 hover:border-gray-400 dark:hover:border-gray-600 transition"
						>
							<div>
								<div class="flex items-start justify-between gap-2 mb-2">
									<div class="flex items-center gap-2.5">
										<div class="size-8 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center font-mono text-xs font-semibold text-gray-700 dark:text-gray-300 shrink-0">
											{agent.name.slice(0, 2).toUpperCase()}
										</div>
										<div>
											<h3 class="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
												{agent.name}
											</h3>
											<span class="text-[11px] font-medium text-gray-500 dark:text-gray-400">
												{agent.role}
											</span>
										</div>
									</div>

									<div class="flex items-center gap-1">
										{#if agent.isBuiltin}
											<span class="px-2 py-0.5 text-[9px] font-medium rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
												Système
											</span>
										{:else}
											<span class="px-2 py-0.5 text-[9px] font-medium rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
												Sur-Mesure
											</span>
											<button
												type="button"
												class="p-1 text-gray-400 hover:text-red-500 transition"
												title="Supprimer"
												on:click={() => handleDelete(agent.id, agent.name)}
											>
												<Trash className="size-3.5" />
											</button>
										{/if}
									</div>
								</div>

								<p class="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2 leading-relaxed">
									{agent.description}
								</p>

								<!-- Tags -->
								{#if agent.tags && agent.tags.length > 0}
									<div class="flex flex-wrap gap-1 mb-3">
										{#each agent.tags as tag}
											<span class="px-2 py-0.5 text-[10px] rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200/50 dark:border-gray-700/50">
												{tag}
											</span>
										{/each}
									</div>
								{/if}
							</div>

							<div class="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800 text-xs">
								<span class="font-mono text-[10px] text-gray-400 dark:text-gray-500">
									{agent.model}
								</span>

								<div class="flex items-center gap-2">
									<button
										type="button"
										class="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium transition flex items-center gap-1"
										on:click={() => {
											selectedSubagent = agent;
											testTask = '';
											currentExecution = null;
											activeTab = 'run';
										}}
									>
										<Play className="size-3" />
										Tester
									</button>

									<button
										type="button"
										class="px-2.5 py-1 rounded-lg bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 font-medium transition flex items-center gap-1"
										on:click={() => handleUseInChat(agent)}
									>
										Sélectionner
									</button>
								</div>
							</div>
						</div>
					{/each}
				</div>

			{:else if activeTab === 'create'}
				<!-- Formulaire sobre de création -->
				<div class="max-w-2xl mx-auto space-y-4">
					<div>
						<label class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
							Intitulé du Spécialiste
						</label>
						<input
							type="text"
							bind:value={newName}
							placeholder="ex: Spécialiste Cinématique & Physique de Vol"
							class="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm"
						/>
					</div>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
						<div>
							<label class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
								Rôle Technique
							</label>
							<input
								type="text"
								bind:value={newRole}
								placeholder="ex: Aerial Kinetics & LinearVelocity Engineer"
								class="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm"
							/>
						</div>

						<div>
							<label class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
								Modèle d'Exécution
							</label>
							<select
								bind:value={newModel}
								class="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm"
							>
								<option value="aria-code">Aria Code (Codestral 256k / Nemotron 1M)</option>
								<option value="aria-reflection">Aria Reflection (Nemotron 550B 1M)</option>
								<option value="aria-plus">Aria Plus (Nemotron Super VL 1M)</option>
								<option value="aria-basic">Aria Basic (Qwen 3.8 27B)</option>
							</select>
						</div>
					</div>

					<div>
						<label class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
							Description
						</label>
						<input
							type="text"
							bind:value={newDescription}
							placeholder="Périmètre d'action et responsabilités..."
							class="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm"
						/>
					</div>

					<div>
						<label class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
							Consignes Système (System Prompt Spécialisé)
						</label>
						<textarea
							bind:value={newSystemPrompt}
							rows="7"
							placeholder="Tu es [Intitulé], spécialiste en... Tes consignes d'ingénierie sont... Applique toujours --!strict..."
							class="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs font-mono"
						></textarea>
					</div>

					<div class="flex justify-end gap-2 pt-2">
						<button
							type="button"
							class="px-4 py-2 rounded-xl text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
							on:click={() => (activeTab = 'list')}
						>
							Annuler
						</button>
						<button
							type="button"
							class="px-5 py-2 rounded-xl text-xs font-medium bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 transition"
							on:click={handleCreate}
						>
							Enregistrer
						</button>
					</div>
				</div>

			{:else if activeTab === 'run' && selectedSubagent}
				<!-- Exécution d'un test -->
				<div class="max-w-2xl mx-auto space-y-4">
					<div class="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
						<h3 class="text-sm font-semibold text-gray-900 dark:text-white">
							{selectedSubagent.name}
						</h3>
						<p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
							{selectedSubagent.role} • Modèle: {selectedSubagent.model}
						</p>
					</div>

					<div>
						<label class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
							Tâche à exécuter
						</label>
						<textarea
							bind:value={testTask}
							rows="4"
							placeholder="Décrivez la tâche technique à confier..."
							class="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-hidden focus:ring-1 focus:ring-gray-400"
						></textarea>
					</div>

					<div class="flex items-center justify-between">
						<button
							type="button"
							class="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
							on:click={() => (activeTab = 'list')}
						>
							← Retour
						</button>

						<button
							type="button"
							disabled={isExecuting || !testTask.trim()}
							class="px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 text-xs font-medium transition flex items-center gap-2 disabled:opacity-50"
							on:click={() => handleRunTest(selectedSubagent)}
						>
							{#if isExecuting}
								<Spinner className="size-3.5" />
								Exécution en cours...
							{:else}
								<Play className="size-3.5" />
								Lancer la tâche
							{/if}
						</button>
					</div>

					{#if currentExecution}
						<div class="mt-4 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
							<div class="flex items-center justify-between text-xs font-medium mb-2">
								<span class="text-gray-700 dark:text-gray-300">
									Terminé en {currentExecution.durationMs}ms
								</span>
								<button
									type="button"
									class="text-gray-600 dark:text-gray-300 hover:underline"
									on:click={() => {
										navigator.clipboard.writeText(currentExecution?.result || '');
										toast.success('Résultat copié dans le presse-papier.');
									}}
								>
									Copier le résultat
								</button>
							</div>
							<div class="p-3 rounded-xl bg-white dark:bg-gray-900 text-xs font-mono text-gray-800 dark:text-gray-200 whitespace-pre-wrap max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-800">
								{currentExecution.result}
							</div>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</Modal>
