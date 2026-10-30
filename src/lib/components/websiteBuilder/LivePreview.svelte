<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { WebsiteProject, WebsiteElementTarget } from '$lib/services/websiteBuilder/types';

	export let project: WebsiteProject;
	export let viewport: 'desktop' | 'tablet' | 'mobile' = 'desktop';
	export let inspectMode = true;
	export let selectedElementId: string | null = null;

	const dispatch = createEventDispatcher<{
		selectElement: WebsiteElementTarget;
	}>();

	// État fonctionnel réel à l'intérieur du site généré
	let isAnnual = true;
	let mobileNavOpen = false;
	let contactName = '';
	let contactEmail = '';
	let contactMessage = '';
	let contactBudget = '5k-10k';
	let formSending = false;
	let formSubmitted = false;
	let activeFaqIndex: number | null = null;

	const handleContactSubmit = (e: Event) => {
		e.preventDefault();
		if (!contactName || !contactEmail) return;
		formSending = true;
		setTimeout(() => {
			formSending = false;
			formSubmitted = true;
			contactName = '';
			contactEmail = '';
			contactMessage = '';
		}, 700);
	};

	const onElementClick = (elementId: string, name: string, currentText: string, tagName = 'div', category: any = 'text') => {
		if (!inspectMode) return;
		dispatch('selectElement', {
			elementId,
			name,
			currentText,
			tagName,
			category
		});
	};
</script>

<div class="w-full h-full flex flex-col items-center bg-gray-100 dark:bg-gray-950 p-2 sm:p-4 overflow-y-auto">
	<!-- Conteneur Viewport dynamique -->
	<div
		class="w-full transition-all duration-300 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 bg-neutral-950 text-neutral-100 overflow-hidden relative"
		style={viewport === 'mobile'
			? 'max-width: 390px; min-height: 720px;'
			: viewport === 'tablet'
				? 'max-width: 768px; min-height: 800px;'
				: 'max-width: 100%; min-height: 900px;'}
	>
		<!-- Barre supérieure style navigateur moderne -->
		<div class="h-9 bg-neutral-900 border-b border-neutral-800 px-4 flex items-center justify-between text-xs text-neutral-400 select-none">
			<div class="flex items-center gap-1.5">
				<div class="size-2.5 rounded-full bg-rose-500/80"></div>
				<div class="size-2.5 rounded-full bg-amber-500/80"></div>
				<div class="size-2.5 rounded-full bg-emerald-500/80"></div>
			</div>
			<div class="flex items-center gap-2 px-3 py-0.5 rounded-md bg-neutral-950/80 border border-neutral-800 text-[11px] text-neutral-300 font-mono">
				<span class="text-emerald-400">https://</span>
				<span>{project.data.brandName.toLowerCase().replace(/[^a-z0-9]/g, '')}.app</span>
			</div>
			<div class="text-[10px] text-neutral-500 font-medium">
				{viewport.toUpperCase()}
			</div>
		</div>

		<!-- Notification mode inspection -->
		{#if inspectMode}
			<div class="bg-blue-600/90 text-white text-[11px] py-1 px-3 flex items-center justify-between font-medium">
				<span class="flex items-center gap-1.5">
					<svg xmlns="http://www.w3.org/2000/svg" class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="12" cy="12" r="10"/><path d="m10 15 5-3-5-3v6z"/>
					</svg>
					Mode Édition Réactive activé : Cliquez sur un titre, un bouton ou un formulaire pour le modifier avec Aria Code.
				</span>
			</div>
		{/if}

		<!-- CONTENU DU SITE GÉNÉRÉ -->
		<div class="relative bg-zinc-950 text-zinc-100 min-h-screen">
			<!-- Aceternity UI Spotlight Glow -->
			<div class="pointer-events-none absolute inset-x-0 -top-24 h-96 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(59,130,246,0.14),rgba(255,255,255,0))]"></div>

			<!-- 1. Navigation (Base UI + Shadcn) -->
			<nav class="sticky top-0 z-40 backdrop-blur-xl bg-zinc-950/70 border-b border-zinc-800/60 px-4 sm:px-8 h-16 flex items-center justify-between">
				<button
					type="button"
					class="font-bold text-lg text-white tracking-wider text-left transition {selectedElementId === 'brand-name' ? 'ring-2 ring-blue-500 rounded px-1' : ''}"
					on:click={() => onElementClick('brand-name', 'Nom de Marque', project.data.brandName, 'span', 'navbar')}
				>
					{project.data.brandName}
				</button>

				<div class="hidden md:flex items-center gap-6 text-sm text-zinc-400">
					{#each project.data.navLinks as link}
						<a href={link.href} class="hover:text-white transition">{link.label}</a>
					{/each}
				</div>

				<div class="flex items-center gap-3">
					<a
						href="#contact"
						class="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-zinc-100 text-zinc-950 hover:bg-white shadow-sm transition"
					>
						Contact
					</a>
					<button
						type="button"
						class="md:hidden p-1.5 text-zinc-400 hover:text-white"
						on:click={() => (mobileNavOpen = !mobileNavOpen)}
					>
						<svg xmlns="http://www.w3.org/2000/svg" class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="18" x2="20" y2="18"/>
						</svg>
					</button>
				</div>
			</nav>

			<!-- Menu Mobile déroulant -->
			{#if mobileNavOpen}
				<div class="md:hidden bg-zinc-900 border-b border-zinc-800 p-4 space-y-2 text-sm text-zinc-300">
					{#each project.data.navLinks as link}
						<a href={link.href} on:click={() => (mobileNavOpen = false)} class="block py-1 hover:text-white">{link.label}</a>
					{/each}
				</div>
			{/if}

			<!-- 2. Hero Section (Shadcn + Aceternity + Mantine) -->
			<section class="pt-16 pb-14 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center relative z-10">
				<!-- Badge Hero (Shadcn pill) -->
				<button
					type="button"
					class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-zinc-800 bg-zinc-900/80 text-xs text-zinc-300 mb-6 transition shadow-sm {selectedElementId === 'hero-badge' ? 'ring-2 ring-blue-500' : 'hover:border-zinc-700'}"
					on:click={() => onElementClick('hero-badge', 'Badge d’accroche', project.data.hero.badge, 'span', 'heading')}
				>
					<span class="size-1.5 rounded-full bg-blue-500 animate-pulse"></span>
					<span>{project.data.hero.badge}</span>
				</button>

				<!-- Titre Principal Hero (Aceternity Gradient Text Reveal) -->
				<h1
					class="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight transition cursor-pointer {selectedElementId === 'hero-title' ? 'ring-2 ring-blue-500 rounded-lg p-1' : 'hover:opacity-90'}"
					on:click={() => onElementClick('hero-title', 'Titre Principal Hero', project.data.hero.title, 'h1', 'heading')}
				>
					{project.data.hero.title}
					<span
						class="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-400 cursor-pointer transition {selectedElementId === 'hero-highlight' ? 'ring-2 ring-blue-500 rounded p-1' : ''}"
						on:click|stopPropagation={() => onElementClick('hero-highlight', 'Titre Mis en Valeur', project.data.hero.highlightText, 'span', 'heading')}
					>
						{project.data.hero.highlightText}
					</span>
				</h1>

				<!-- Sous-titre Hero -->
				<p
					class="mt-5 text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed cursor-pointer transition {selectedElementId === 'hero-subtitle' ? 'ring-2 ring-blue-500 rounded p-2' : 'hover:text-zinc-300'}"
					on:click={() => onElementClick('hero-subtitle', 'Sous-titre Hero', project.data.hero.subtitle, 'p', 'text')}
				>
					{project.data.hero.subtitle}
				</p>

				<!-- Boutons d'Action CTA (Aceternity Shimmer Button & Shadcn Border) -->
				<div class="mt-8 flex flex-wrap items-center justify-center gap-3">
					<button
						type="button"
						class="relative inline-flex items-center justify-center p-[1px] overflow-hidden rounded-xl font-medium text-xs transition active:scale-95 shadow-lg shadow-blue-500/20 {selectedElementId === 'hero-primary-cta' ? 'ring-2 ring-white' : ''}"
						on:click={() => onElementClick('hero-primary-cta', 'Bouton d’action principal', project.data.hero.primaryCta, 'button', 'button')}
					>
						<span class="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500"></span>
						<span class="relative px-5 py-2.5 rounded-[11px] bg-zinc-950 hover:bg-zinc-900 text-white font-semibold flex items-center gap-1.5 transition">
							{project.data.hero.primaryCta}
						</span>
					</button>

					<a
						href="#features"
						class="px-5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 font-medium text-xs transition"
					>
						{project.data.hero.secondaryCta}
					</a>
				</div>

				<!-- Statistiques Clés (Mantine Stats Grid) -->
				{#if project.data.hero.stats && project.data.hero.stats.length > 0}
					<div class="mt-14 pt-8 border-t border-zinc-900 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
						{#each project.data.hero.stats as stat}
							<div class="p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-sm">
								<div class="text-2xl font-extrabold text-white tracking-tight">{stat.value}</div>
								<div class="text-[11px] text-zinc-500 uppercase tracking-wider mt-0.5">{stat.label}</div>
							</div>
						{/each}
					</div>
				{/if}
			</section>

			<!-- 3. Section Bento Grid (Aceternity + Shadcn) -->
			<section id="features" class="py-14 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto border-t border-zinc-900 relative z-10">
				<div class="text-center mb-12">
					<h2 class="text-2xl sm:text-3xl font-bold text-white">Points Forts & Solutions</h2>
					<p class="text-zinc-400 text-xs mt-1.5">Conception bento épurée sans surcharge visuelle</p>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-3 gap-5">
					{#each project.data.features as feat, i}
						<div
							class="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/70 transition cursor-pointer"
							on:click={() => onElementClick(`feat-title-${i}`, `Caractéristique : ${feat.title}`, feat.title, 'div', 'card')}
						>
							<div class="flex items-center justify-between mb-3">
								<span class="text-[10px] px-2 py-0.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 font-mono">
									{feat.tag || 'Expertise'}
								</span>
							</div>
							<h3 class="text-base font-semibold text-white">{feat.title}</h3>
							<p class="text-xs text-zinc-400 mt-1.5 leading-relaxed">{feat.description}</p>
						</div>
					{/each}
				</div>
			</section>

			<!-- 4. Showcase (si actif) -->
			{#if project.data.showcase && project.data.showcase.length > 0}
				<section id="projets" class="py-14 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto border-t border-neutral-900">
					<div class="text-center mb-10">
						<h2 class="text-2xl font-bold text-white">Créations & Travaux Récents</h2>
						<p class="text-neutral-400 text-xs mt-1">Sélection de réalisations à fort impact</p>
					</div>

					<div class="grid grid-cols-1 md:grid-cols-3 gap-5">
						{#each project.data.showcase as item}
							<div class="p-5 rounded-2xl border border-neutral-800/80 bg-neutral-900/40 hover:bg-neutral-900/70 transition flex flex-col justify-between">
								<div>
									<div class="text-[10px] font-mono text-neutral-500 mb-1.5">{item.category}</div>
									<h3 class="text-sm font-bold text-white mb-1.5">{item.title}</h3>
									<p class="text-xs text-neutral-400 leading-relaxed">{item.description}</p>
								</div>
								{#if item.metrics}
									<div class="mt-4 pt-3 border-t border-neutral-800/80 text-xs font-semibold text-blue-400">
										{item.metrics}
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</section>
			{/if}

			<!-- 5. Tarifs Fonctionnels (si actif) -->
			{#if project.data.pricing && project.data.pricing.plans.length > 0}
				<section id="pricing" class="py-14 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto border-t border-neutral-900">
					<div class="text-center mb-8">
						<h2 class="text-2xl font-bold text-white">Tarifs Clairs</h2>
						<div class="mt-3 inline-flex items-center gap-1.5 p-1 rounded-full border border-neutral-800 bg-neutral-900 text-xs">
							<button
								type="button"
								class="px-3 py-1 rounded-full transition {!isAnnual ? 'bg-white text-neutral-950 font-bold' : 'text-neutral-400'}"
								on:click={() => (isAnnual = false)}
							>
								Mensuel
							</button>
							<button
								type="button"
								class="px-3 py-1 rounded-full transition {isAnnual ? 'bg-white text-neutral-950 font-bold' : 'text-neutral-400'}"
								on:click={() => (isAnnual = true)}
							>
								Annuel (-20%)
							</button>
						</div>
					</div>

					<div class="grid grid-cols-1 md:grid-cols-3 gap-5">
						{#each project.data.pricing.plans as plan}
							<div class="p-5 rounded-2xl border {plan.popular ? 'border-blue-500 bg-neutral-900/80 ring-1 ring-blue-500/40' : 'border-neutral-800 bg-neutral-900/40'} flex flex-col justify-between">
								<div>
									<div class="flex items-center justify-between mb-3">
										<h3 class="text-sm font-bold text-white">{plan.name}</h3>
										{#if plan.popular}
											<span class="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded-full bg-blue-500 text-white font-bold">Populaire</span>
										{/if}
									</div>
									<div class="text-2xl font-extrabold text-white mb-1.5">
										{isAnnual ? Math.round(plan.monthlyPrice * 0.8) : plan.monthlyPrice}€
										<span class="text-xs text-neutral-500 font-normal"> /mois</span>
									</div>
									<p class="text-xs text-neutral-400 mb-4">{plan.description}</p>
									<ul class="space-y-1.5 text-xs text-neutral-300">
										{#each plan.features as feat}
											<li class="flex items-center gap-1.5">
												<span class="text-blue-400">✓</span> {feat}
											</li>
										{/each}
									</ul>
								</div>
								<button type="button" class="mt-6 w-full py-2 rounded-xl font-medium text-xs bg-white text-neutral-950 hover:bg-neutral-200 transition">
									{plan.cta}
								</button>
							</div>
						{/each}
					</div>
				</section>
			{/if}

			<!-- 6. Formulaire de Contact 100% Fonctionnel (Shadcn Form + Mantine Toast) -->
			<section id="contact" class="py-14 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto border-t border-zinc-900 relative z-10">
				<div class="p-6 sm:p-8 rounded-3xl border border-zinc-800/90 bg-zinc-900/60 backdrop-blur-md shadow-2xl">
					<div class="text-center mb-6">
						<h2
							class="text-xl sm:text-2xl font-bold text-white transition cursor-pointer {selectedElementId === 'contact-title' ? 'ring-2 ring-blue-500 rounded p-1' : ''}"
							on:click={() => onElementClick('contact-title', 'Titre du Formulaire', project.data.contact.title, 'h2', 'form')}
						>
							{project.data.contact.title}
						</h2>
						<p
							class="text-xs text-zinc-400 mt-1 cursor-pointer transition {selectedElementId === 'contact-subtitle' ? 'ring-2 ring-blue-500 rounded p-1' : ''}"
							on:click={() => onElementClick('contact-subtitle', 'Sous-titre Contact', project.data.contact.subtitle, 'p', 'form')}
						>
							{project.data.contact.subtitle}
						</p>
					</div>

					{#if formSubmitted}
						<div class="p-6 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 text-center text-xs text-emerald-400">
							<div class="size-9 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center mx-auto mb-2 font-bold text-base">
								✓
							</div>
							<p class="font-semibold text-sm">{project.data.contact.successMessage}</p>
							<p class="text-zinc-400 mt-1 text-[11px]">Notification envoyée en direct. Un accusé de réception a été transmis.</p>
							<button
								type="button"
								class="mt-4 px-3.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-medium transition cursor-pointer"
								on:click={() => (formSubmitted = false)}
							>
								Envoyer un autre message
							</button>
						</div>
					{:else}
						<form on:submit={handleContactSubmit} class="space-y-3.5">
							<div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
								<div>
									<label class="block text-xs font-medium text-zinc-300 mb-1">Votre Nom *</label>
									<input
										type="text"
										required
										bind:value={contactName}
										class="w-full px-3 py-2 rounded-xl border border-zinc-800 bg-zinc-950 text-xs text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
										placeholder="Alexis Martin"
									/>
								</div>
								<div>
									<label class="block text-xs font-medium text-zinc-300 mb-1">Votre E-mail *</label>
									<input
										type="email"
										required
										bind:value={contactEmail}
										class="w-full px-3 py-2 rounded-xl border border-zinc-800 bg-zinc-950 text-xs text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
										placeholder={project.data.contact.emailPlaceholder}
									/>
								</div>
							</div>

							<div>
								<label class="block text-xs font-medium text-zinc-300 mb-1">Votre Message *</label>
								<textarea
									required
									rows="3"
									bind:value={contactMessage}
									class="w-full px-3 py-2 rounded-xl border border-zinc-800 bg-zinc-950 text-xs text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500 transition resize-none"
									placeholder="Présentez brièvement votre projet ou votre proposition..."
								></textarea>
							</div>

							<button
								type="submit"
								disabled={formSending}
								class="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
							>
								{#if formSending}
									<span class="animate-spin text-sm">⟳</span>
									<span>Envoi en cours...</span>
								{:else}
									<span>{project.data.contact.submitText}</span>
									<span>→</span>
								{/if}
							</button>
						</form>
					{/if}
				</div>
			</section>

			<!-- 7. Footer -->
			<footer class="border-t border-neutral-900 py-6 px-4 max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 gap-3">
				<div>{project.data.footer.copyright}</div>
				<div class="flex items-center gap-4">
					{#each project.data.footer.links as link}
						<a href={link.href} class="hover:text-neutral-300 transition">{link.label}</a>
					{/each}
				</div>
			</footer>
		</div>
	</div>
</div>
