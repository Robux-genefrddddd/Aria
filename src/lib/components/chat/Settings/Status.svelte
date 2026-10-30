<script lang="ts">
	import { getContext } from 'svelte';
	import { systemStatusStore } from '$lib/stores/systemStatus';

	const i18n = getContext('i18n');
	$: statusState = $systemStatusStore;

	let activeView: 'line' | 'bar' = 'line';

	// Calcul des pourcentages réactifs
	$: totalBugs = Math.max(
		statusState.failedRequests + statusState.rateLimitCount + statusState.clientBugCount,
		0
	);

	// Répartition dynamique ou proportions représentatives calquées sur l'image
	$: pctRed = totalBugs > 0 ? Math.round((statusState.failedRequests / Math.max(totalBugs, 1)) * 100) : 61;
	$: pctBlue = totalBugs > 0 ? Math.round((statusState.rateLimitCount / Math.max(totalBugs, 1)) * 100) : 28;
	$: pctYellow = totalBugs > 0 ? Math.max(0, 100 - pctRed - pctBlue - 2 - 1) : 9;
	$: pctGreen = 2;
	$: pctPurple = 1;
</script>

<div class="w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-xl border border-gray-200/80 dark:border-gray-800 p-4 sm:p-5 shadow-xs">
	<!-- En-tête : "Bug", icônes vue, menu et Actions (Conforme image) -->
	<div class="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-800">
		<div class="flex items-center gap-3">
			<span class="text-lg sm:text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
				Bug
			</span>

			<!-- Sélecteur d'affichage Linéaire / Barres (exactement comme sur l'image) -->
			<div class="inline-flex items-center rounded-lg border border-gray-200 dark:border-gray-700 p-0.5 bg-gray-50 dark:bg-gray-800">
				<button
					type="button"
					class="p-1 rounded-md transition {activeView === 'line' ? 'bg-[#3b82f6] text-white shadow-xs' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'}"
					on:click={() => (activeView = 'line')}
					title="Graphique linéaire"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
						<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
					</svg>
				</button>
				<button
					type="button"
					class="p-1 rounded-md transition {activeView === 'bar' ? 'bg-[#3b82f6] text-white shadow-xs' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'}"
					on:click={() => (activeView = 'bar')}
					title="Histogramme"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
						<line x1="18" y1="20" x2="18" y2="10"/>
						<line x1="12" y1="20" x2="12" y2="4"/>
						<line x1="6" y1="20" x2="6" y2="14"/>
					</svg>
				</button>
			</div>
		</div>

		<!-- Sélecteur à droite & Actions -->
		<div class="flex items-center gap-2">
			<div class="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">
				<span>Bugs (V)</span>
				<svg xmlns="http://www.w3.org/2000/svg" class="size-3 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="m7 15 5 5 5-5"/>
					<path d="m7 9 5-5 5 5"/>
				</svg>
			</div>

			<button
				type="button"
				class="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750 transition"
			>
				<span>Actions</span>
				<svg xmlns="http://www.w3.org/2000/svg" class="size-3 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="12" cy="12" r="3"/>
					<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
				</svg>
			</button>
		</div>
	</div>

	<!-- Corps du Graphique : Lignes à gauche + Camembert à droite -->
	<div class="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
		<!-- Section Gauche : Graphique Linéaire SVG avec courbes et points -->
		<div class="lg:col-span-8 w-full overflow-hidden">
			<svg viewBox="0 0 540 180" class="w-full h-48 overflow-visible text-gray-400 dark:text-gray-500">
				<!-- Grille horizontale en pointillés gris -->
				<line x1="45" y1="20" x2="530" y2="20" stroke="currentColor" stroke-opacity="0.15" stroke-dasharray="2 2" />
				<line x1="45" y1="45" x2="530" y2="45" stroke="currentColor" stroke-opacity="0.15" stroke-dasharray="2 2" />
				<line x1="45" y1="70" x2="530" y2="70" stroke="currentColor" stroke-opacity="0.15" stroke-dasharray="2 2" />
				<line x1="45" y1="95" x2="530" y2="95" stroke="currentColor" stroke-opacity="0.15" stroke-dasharray="2 2" />
				<line x1="45" y1="120" x2="530" y2="120" stroke="currentColor" stroke-opacity="0.15" stroke-dasharray="2 2" />
				<line x1="45" y1="145" x2="530" y2="145" stroke="currentColor" stroke-opacity="0.15" stroke-dasharray="2 2" />

				<!-- Échelle Y (nombres clairs) -->
				<text x="38" y="23" font-size="8" text-anchor="end" fill="currentColor">400</text>
				<text x="38" y="48" font-size="8" text-anchor="end" fill="currentColor">300</text>
				<text x="38" y="73" font-size="8" text-anchor="end" fill="currentColor">200</text>
				<text x="38" y="98" font-size="8" text-anchor="end" fill="currentColor">100</text>
				<text x="38" y="123" font-size="8" text-anchor="end" fill="currentColor">50</text>
				<text x="38" y="148" font-size="8" text-anchor="end" fill="currentColor">0</text>

				<!-- Courbe 1 : Rouge (#ef4444) avec oscillations et points blancs cerclés -->
				<path
					d="M 55 52 Q 85 32, 115 48 T 175 36 T 235 56 T 295 24 T 355 42 T 415 30 T 475 50 T 525 35"
					fill="none"
					stroke="#ef4444"
					stroke-width="2"
				/>
				{#each [
					[55, 52], [85, 38], [115, 48], [145, 42], [175, 36], [205, 50],
					[235, 56], [265, 40], [295, 24], [325, 36], [355, 42], [385, 34],
					[415, 30], [445, 46], [475, 50], [500, 38], [525, 35]
				] as [cx, cy]}
					<circle cx={cx} cy={cy} r="2.5" fill="#ffffff" stroke="#ef4444" stroke-width="1.5" />
				{/each}

				<!-- Courbe 2 : Bleue (#3b82f6) -->
				<path
					d="M 55 95 Q 85 88, 115 92 T 175 89 T 235 98 T 295 78 T 355 86 T 415 82 T 475 92 T 525 80"
					fill="none"
					stroke="#3b82f6"
					stroke-width="1.8"
				/>
				{#each [
					[55, 95], [115, 92], [175, 89], [235, 98], [295, 78], [355, 86],
					[415, 82], [475, 92], [525, 80]
				] as [cx, cy]}
					<circle cx={cx} cy={cy} r="2.5" fill="#ffffff" stroke="#3b82f6" stroke-width="1.5" />
				{/each}

				<!-- Courbe 3 : Jaune (#eab308) -->
				<path
					d="M 55 125 Q 85 122, 115 126 T 175 123 T 235 127 T 295 121 T 355 125 T 415 122 T 475 126 T 525 123"
					fill="none"
					stroke="#eab308"
					stroke-width="1.5"
				/>
				{#each [[55, 125], [175, 123], [295, 121], [415, 122], [525, 123]] as [cx, cy]}
					<circle cx={cx} cy={cy} r="2" fill="#ffffff" stroke="#eab308" stroke-width="1.5" />
				{/each}

				<!-- Courbe 4 : Verte (#84cc16) -->
				<path
					d="M 55 138 Q 115 137, 235 138 T 355 137 T 525 138"
					fill="none"
					stroke="#84cc16"
					stroke-width="1.2"
				/>

				<!-- Courbe 5 : Violette (#a855f7) le long de la ligne 0 -->
				<path
					d="M 55 145 L 525 145"
					fill="none"
					stroke="#a855f7"
					stroke-width="1.2"
				/>

				<!-- Dates inclinées sous l'axe X (style exact capture) -->
				<g font-size="7" fill="currentColor" text-anchor="end">
					<text x="60" y="162" transform="rotate(-40 60 162)">12/02</text>
					<text x="120" y="162" transform="rotate(-40 120 162)">16/02</text>
					<text x="180" y="162" transform="rotate(-40 180 162)">20/02</text>
					<text x="240" y="162" transform="rotate(-40 240 162)">24/02</text>
					<text x="300" y="162" transform="rotate(-40 300 162)">28/02</text>
					<text x="360" y="162" transform="rotate(-40 360 162)">04/03</text>
					<text x="420" y="162" transform="rotate(-40 420 162)">08/03</text>
					<text x="480" y="162" transform="rotate(-40 480 162)">12/03</text>
					<text x="525" y="162" transform="rotate(-40 525 162)">Auj.</text>
				</g>
			</svg>
		</div>

		<!-- Section Droite : Camembert / Donut SVG (Style exact capture) -->
		<div class="lg:col-span-4 flex items-center justify-center p-2">
			<svg viewBox="0 0 120 120" class="size-40 sm:size-44">
				<!-- Tranche Rouge (61%) -->
				<circle
					cx="60" cy="60" r="45"
					fill="transparent"
					stroke="#ef4444"
					stroke-width="30"
					stroke-dasharray="172.4 282.7"
					stroke-dashoffset="0"
				/>
				<!-- Tranche Bleue (28%) -->
				<circle
					cx="60" cy="60" r="45"
					fill="transparent"
					stroke="#3b82f6"
					stroke-width="30"
					stroke-dasharray="79.1 282.7"
					stroke-dashoffset="-172.4"
				/>
				<!-- Tranche Jaune (9%) -->
				<circle
					cx="60" cy="60" r="45"
					fill="transparent"
					stroke="#eab308"
					stroke-width="30"
					stroke-dasharray="25.4 282.7"
					stroke-dashoffset="-251.5"
				/>
				<!-- Tranche Verte (2%) -->
				<circle
					cx="60" cy="60" r="45"
					fill="transparent"
					stroke="#84cc16"
					stroke-width="30"
					stroke-dasharray="5.8 282.7"
					stroke-dashoffset="-276.9"
				/>
				<!-- Tranche Violette (1%) -->
				<circle
					cx="60" cy="60" r="45"
					fill="transparent"
					stroke="#a855f7"
					stroke-width="30"
					stroke-dasharray="2.8 282.7"
					stroke-dashoffset="-282.7"
				/>

				<!-- Pourcentages en blanc au centre des tranches -->
				<text x="75" y="55" font-size="9" font-weight="bold" fill="#ffffff" text-anchor="middle">61%</text>
				<text x="45" y="75" font-size="8" font-weight="bold" fill="#ffffff" text-anchor="middle">28%</text>
				<text x="50" y="38" font-size="7" font-weight="bold" fill="#ffffff" text-anchor="middle">9%</text>
			</svg>
		</div>
	</div>

	<!-- Bas du Widget : Légendes + Nombres + Barre Segmentée multicolore -->
	<div class="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 text-center">
		<div class="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs mb-2.5">
			<div>
				<div class="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Bugs IA</div>
				<div class="font-bold text-gray-900 dark:text-gray-100 mt-0.5">{statusState.failedRequests}</div>
			</div>
			<div>
				<div class="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Rate Limits (429)</div>
				<div class="font-bold text-gray-900 dark:text-gray-100 mt-0.5">{statusState.rateLimitCount}</div>
			</div>
			<div>
				<div class="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Bugs Frontend</div>
				<div class="font-bold text-gray-900 dark:text-gray-100 mt-0.5">{statusState.clientBugCount}</div>
			</div>
			<div>
				<div class="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Requêtes IA</div>
				<div class="font-bold text-gray-900 dark:text-gray-100 mt-0.5">{statusState.successfulRequests}</div>
			</div>
			<div>
				<div class="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Total Flux</div>
				<div class="font-bold text-gray-900 dark:text-gray-100 mt-0.5">{statusState.totalRequests}</div>
			</div>
		</div>

		<!-- Barre segmentée multicolore (Style exact image) -->
		<div class="w-full h-2 rounded-full overflow-hidden flex shadow-xs">
			<div class="bg-[#ef4444] h-full" style="width: 61%"></div>
			<div class="bg-[#3b82f6] h-full" style="width: 28%"></div>
			<div class="bg-[#eab308] h-full" style="width: 9%"></div>
			<div class="bg-[#84cc16] h-full" style="width: 1.5%"></div>
			<div class="bg-[#a855f7] h-full" style="width: 0.5%"></div>
		</div>
	</div>
</div>
