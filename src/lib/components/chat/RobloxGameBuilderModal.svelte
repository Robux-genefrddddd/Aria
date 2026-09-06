<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import XMark from '$lib/components/icons/XMark.svelte';
	import Sparkles from '$lib/components/icons/Sparkles.svelte';

	export let show = false;

	const dispatch = createEventDispatcher();

	// Genres & Styles
	let genres = [
		{ id: 'anime_rpg', name: '⚔️ Anime & Combat RPG (Blox Fruits, Anime Vanguards)', checked: true },
		{ id: 'fisch_rpg', name: '🎣 Pêche, Quêtes & Collection (Fisch)', checked: false },
		{ id: 'fps_rivals', name: '🔫 Shooter FPS Compétitif & Ultra-Réactif (Rivals)', checked: false },
		{ id: 'steal_resource', name: '🤝 Simulation & Vol de Temps/Ressources (Steal Time)', checked: false },
		{ id: 'slap_chaos', name: '💥 Chaos & Pouvoirs Fun (Slap Battles)', checked: false },
		{ id: 'tycoon_sim', name: '🏰 Tycoon, Économie & Crafting', checked: false },
		{ id: 'horror_survival', name: '👻 Horreur, Enquête & Survival', checked: false }
	];

	// Mécaniques de Rétention & Systèmes
	let systems = [
		{ id: 'rebirth', name: '🔄 Système de Rebirth / Prestige avec Multiplicateurs', checked: true },
		{ id: 'pets_gacha', name: '🐾 Pets, Montures & Gacha avec Raretés (Pet Sim 99)', checked: true },
		{ id: 'trading', name: '🤝 Marketplace & Échange (Trade) entre Joueurs', checked: true },
		{ id: 'clans_leaderboard', name: '🏆 Clans / Guildes & Classement Mondial', checked: true },
		{ id: 'battle_pass', name: '📜 Quêtes Quotidiennes, Saisons & Battle Pass', checked: false },
		{ id: 'pvp_zones', name: '⚔️ Zones PVP Securisées & Boss de Raid', checked: false }
	];

	// Analyses & Détails demandés
	let details = [
		{ id: 'monetization', name: '💰 Monétisation Robux (Gamepasses & Developer Products)', checked: true },
		{ id: 'luau_arch', name: '🛠️ Architecture Technique Luau & Découpage Roblox Studio', checked: true },
		{ id: 'virality', name: '📈 Stratégie de Retention & Viralité (TikTok/YouTube)', checked: true }
	];

	let customIdea = '';

	function close() {
		show = false;
	}

	function generatePrompt() {
		const selectedGenres = genres.filter((g) => g.checked).map((g) => g.name);
		const selectedSystems = systems.filter((s) => s.checked).map((s) => s.name);
		const selectedDetails = details.filter((d) => d.checked).map((d) => d.name);

		let prompt = `Donne-moi un concept de jeu Roblox **MEGA-PRO** ultra-détaillé et innovant.\n\n`;

		if (selectedGenres.length > 0) {
			prompt += `🎮 **Styles & Genres ciblés** :\n- ${selectedGenres.join('\n- ')}\n\n`;
		}

		if (selectedSystems.length > 0) {
			prompt += `⚡ **Mécaniques & Systèmes souhaités** :\n- ${selectedSystems.join('\n- ')}\n\n`;
		}

		if (selectedDetails.length > 0) {
			prompt += `🔍 **Éléments du Cahier des Charges (GDD) à inclure absolument** :\n- ${selectedDetails.join('\n- ')}\n\n`;
		}

		if (customIdea.trim()) {
			prompt += `💡 **Règles ou idées spécifiques** :\n${customIdea.trim()}\n\n`;
		}

		prompt += `Fais une analyse approfondie des meilleurs jeux Roblox actuels, combine leurs mécaniques les plus addictives et fournis un Game Design Document (GDD) Mega-Pro extrêmement détaillé avec la boucle de jeu (Core Loop), la stratégie de rétention, la monétisation Robux et l'architecture des scripts Luau pour Roblox Studio.`;

		dispatch('submit', prompt);
		show = false;
	}
</script>

{#if show}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
		<div
			class="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl p-6 transition-all"
		>
			<!-- Header -->
			<div class="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
				<div class="flex items-center gap-3">
					<div class="p-2.5 bg-gradient-to-tr from-amber-500 to-amber-400 rounded-xl text-white shadow-md">
						<Sparkles class="w-6 h-6" />
					</div>
					<div>
						<h3 class="text-xl font-bold text-gray-900 dark:text-white">
							Générateur d'Idée Roblox <span class="text-amber-500">Mega-Pro</span>
						</h3>
						<p class="text-xs text-gray-500 dark:text-gray-400">
							Coche tes préférences pour obtenir un Cahier des Charges (GDD) de jeu d'un niveau professionnel.
						</p>
					</div>
				</div>
				<button
					type="button"
					on:click={close}
					class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
				>
					<XMark class="w-5 h-5" />
				</button>
			</div>

			<!-- Body -->
			<div class="mt-5 space-y-6">
				<!-- Genres -->
				<div>
					<h4 class="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2.5">
						1. Styles & Inspirations de Jeux Roblox
					</h4>
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
						{#each genres as genre}
							<label
								class="flex items-center gap-2.5 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-850 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition text-xs font-medium text-gray-700 dark:text-gray-300"
							>
								<input
									type="checkbox"
									bind:checked={genre.checked}
									class="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 border-gray-300 dark:border-gray-700"
								/>
								<span>{genre.name}</span>
							</label>
						{/each}
					</div>
				</div>

				<!-- Mécaniques -->
				<div>
					<h4 class="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2.5">
						2. Mécaniques de Rétention & Gameplay
					</h4>
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
						{#each systems as sys}
							<label
								class="flex items-center gap-2.5 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-850 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition text-xs font-medium text-gray-700 dark:text-gray-300"
							>
								<input
									type="checkbox"
									bind:checked={sys.checked}
									class="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 border-gray-300 dark:border-gray-700"
								/>
								<span>{sys.name}</span>
							</label>
						{/each}
					</div>
				</div>

				<!-- Détails -->
				<div>
					<h4 class="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2.5">
						3. Éléments du Document (GDD Mega-Pro)
					</h4>
					<div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
						{#each details as det}
							<label
								class="flex items-center gap-2.5 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-850 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition text-xs font-medium text-gray-700 dark:text-gray-300"
							>
								<input
									type="checkbox"
									bind:checked={det.checked}
									class="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 border-gray-300 dark:border-gray-700"
								/>
								<span>{det.name}</span>
							</label>
						{/each}
					</div>
				</div>

				<!-- Champ libre -->
				<div>
					<h4 class="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
						4. Remarques ou thèmes particuliers (Optionnel)
					</h4>
					<textarea
						bind:value={customIdea}
						placeholder="Ex: Je veux un univers cyberpunk futuriste avec des katanas et un système d'îles volantes..."
						rows="2"
						class="w-full p-3 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
					></textarea>
				</div>
			</div>

			<!-- Footer -->
			<div class="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
				<button
					type="button"
					on:click={() => {
						genres.forEach(g => g.checked = false);
						systems.forEach(s => s.checked = false);
						customIdea = '';
					}}
					class="px-4 py-2 text-xs font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
				>
					Réinitialiser
				</button>
				<div class="flex items-center gap-2">
					<button
						type="button"
						on:click={close}
						class="px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition"
					>
						Annuler
					</button>
					<button
						type="button"
						on:click={generatePrompt}
						class="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 transition active:scale-95"
					>
						<Sparkles class="w-4 h-4" />
						Générer le Concept Mega-Pro
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
