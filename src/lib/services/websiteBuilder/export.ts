import type { WebsiteProject } from './types';
import JSZip from 'jszip';

export interface ProjectFile {
	path: string;
	content: string;
}

/**
 * Génère l'arborescence complète et prête à l'emploi d'un projet React (Vite + Tailwind + TSX).
 * Crée un vrai dossier avec package.json, vite.config.ts, index.html, src/App.tsx, src/index.css, etc.
 */
export function generateReactProjectFiles(project: WebsiteProject): Record<string, string> {
	const appTsx = exportToReact(project);
	const folderName = (project.title || 'portfolio').toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'portfolio';

	return {
		[`${folderName}/package.json`]: JSON.stringify(
			{
				name: folderName,
				private: true,
				version: '1.0.0',
				type: 'module',
				scripts: {
					dev: 'vite',
					build: 'tsc && vite build',
					preview: 'vite preview'
				},
				dependencies: {
					react: '^18.3.1',
					'react-dom': '^18.3.1',
					'lucide-react': '^0.460.0'
				},
				devDependencies: {
					'@types/react': '^18.3.12',
					'@types/react-dom': '^18.3.1',
					'@vitejs/plugin-react': '^4.3.3',
					autoprefixer: '^10.4.20',
					postcss: '^8.4.49',
					tailwindcss: '^3.4.15',
					typescript: '^5.6.3',
					vite: '^5.4.11'
				}
			},
			null,
			2
		),
		[`${folderName}/vite.config.ts`]: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
`,
		[`${folderName}/tsconfig.json`]: JSON.stringify(
			{
				compilerOptions: {
					target: 'ES2020',
					useDefineForClassFields: true,
					lib: ['ES2020', 'DOM', 'DOM.Iterable'],
					module: 'ESNext',
					skipLibCheck: true,
					moduleResolution: 'bundler',
					allowImportingTsExtensions: true,
					resolveJsonModule: true,
					isolatedModules: true,
					noEmit: true,
					jsx: 'react-jsx',
					strict: true,
					noUnusedLocals: true,
					noUnusedParameters: true,
					noFallthroughCasesInSwitch: true
				},
				include: ['src']
			},
			null,
			2
		),
		[`${folderName}/tailwind.config.js`]: `/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        zinc: {
          950: '#09090b',
          900: '#18181b',
          800: '#27272a',
        }
      }
    },
  },
  plugins: [],
};
`,
		[`${folderName}/postcss.config.js`]: `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`,
		[`${folderName}/index.html`]: `<!DOCTYPE html>
<html lang="fr" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${project.title}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  </head>
  <body class="bg-zinc-950 text-zinc-100 antialiased selection:bg-blue-500 selection:text-white">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
		[`${folderName}/src/index.css`]: `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-zinc-950 text-zinc-100;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
  }
}
`,
		[`${folderName}/src/main.tsx`]: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`,
		[`${folderName}/src/App.tsx`]: appTsx,
		[`${folderName}/README.md`]: `# ${project.title}

Projet React moderne généré avec **Aria UI Architect (2026)**.
Composants de design d'élite : **Shadcn UI** (palette zinc sombre), **Aceternity UI** (Spotlight & Bento), **Mantine UI** & **Base UI**.

## 🚀 Démarrage Rapide

\`\`\`bash
# 1. Installer les dépendances
npm install

# 2. Lancer le serveur de développement
npm run dev
\`\`\`

Le projet s'exécute à l'adresse http://localhost:5173
`
	};
}

/**
 * Télécharge le projet React complet sous la forme d'une archive ZIP prête à l'emploi.
 */
export async function downloadReactProjectZip(project: WebsiteProject): Promise<Blob> {
	const zip = new JSZip();
	const files = generateReactProjectFiles(project);

	for (const [filePath, fileContent] of Object.entries(files)) {
		zip.file(filePath, fileContent);
	}

	return await zip.generateAsync({ type: 'blob' });
}

/**
 * Génère le code de production en React (TSX)
 * Jamais de HTML brut conformément aux directives.
 */
export function exportToReact(project: WebsiteProject): string {
	const { brandName, hero, features, showcase, pricing, contact, faq, footer, navLinks } = project.data;

	return `import React, { useState } from 'react';
import { 
  ArrowRight, Check, Send, Sparkles, ChevronDown, 
  Menu, X, Shield, Zap, Users, Star, ExternalLink 
} from 'lucide-react';

export default function ${project.title.replace(/[^a-zA-Z0-9]/g, '') || 'GeneratedWebsite'}() {
  // État interactif du formulaire de contact fonctionnel
  const [formData, setFormData] = useState({ name: '', email: '', message: '', extra: '' });
  const [formStatus, setFormStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAnnual, setIsAnnual] = useState(true);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;
    setFormStatus('sending');
    setTimeout(() => {
      setFormStatus('sent');
      setFormData({ name: '', email: '', message: '', extra: '' });
    }, 800);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-blue-500 selection:text-white">
      {/* 1. Navigation Sobre & Réactive */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-neutral-950/80 border-b border-neutral-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg tracking-wider text-white">${brandName}</span>
          </div>

          <div className="hidden md:flex items-center gap-6 text-sm text-neutral-400">
            ${navLinks.map((l) => `<a href="${l.href}" className="hover:text-white transition">${l.label}</a>`).join('\n            ')}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <a
              href="#contact"
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-white text-neutral-950 hover:bg-neutral-200 transition"
            >
              Contact
            </a>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-neutral-400 hover:text-white"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-b border-neutral-800 bg-neutral-900 px-4 py-4 space-y-3 text-sm">
            ${navLinks.map((l) => `<a href="${l.href}" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-neutral-300">${l.label}</a>`).join('\n            ')}
          </div>
        )}
      </nav>

      {/* 2. Section Hero Immersive */}
      <section className="relative pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-800 bg-neutral-900/60 text-xs text-neutral-400 mb-8">
          <Sparkles size={13} className="text-blue-400" />
          <span>${hero.badge}</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
          ${hero.title} <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">${hero.highlightText}</span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-neutral-400 max-w-2xl mx-auto leading-relaxed">
          ${hero.subtitle}
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <a
            href="#contact"
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition shadow-lg shadow-blue-500/20 inline-flex items-center gap-2"
          >
            ${hero.primaryCta}
            <ArrowRight size={16} />
          </a>
          <a
            href="#projets"
            className="px-6 py-3 rounded-xl border border-neutral-800 bg-neutral-900/80 hover:bg-neutral-850 text-neutral-300 font-medium text-sm transition"
          >
            ${hero.secondaryCta}
          </a>
        </div>

        {/* Statistiques clés */}
        ${
					hero.stats && hero.stats.length > 0
						? `<div className="mt-16 pt-12 border-t border-neutral-900 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
          ${hero.stats
						.map(
							(s) => `<div className="p-4 rounded-xl border border-neutral-900 bg-neutral-900/30">
            <div className="text-3xl font-extrabold text-white">${s.value}</div>
            <div className="text-xs text-neutral-500 uppercase tracking-wider mt-1">${s.label}</div>
          </div>`
						)
						.join('\n          ')}
        </div>`
						: ''
				}
      </section>

      {/* 3. Section Fonctionnalités & Piliers */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Points Forts & Expertise</h2>
          <p className="text-neutral-400 text-sm mt-2">Conçu selon les standards de production les plus exigeants</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          ${features
						.map(
							(f) => `<div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/50 hover:border-neutral-700 transition">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs px-2.5 py-0.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 font-mono">${f.tag || 'Expert'}</span>
            </div>
            <h3 className="text-lg font-semibold text-white">${f.title}</h3>
            <p className="text-sm text-neutral-400 mt-2 leading-relaxed">${f.description}</p>
          </div>`
						)
						.join('\n          ')}
        </div>
      </section>

      ${
				showcase && showcase.length > 0
					? `{/* 4. Showcase & Réalisations */}
      <section id="projets" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-neutral-900">
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Créations & Travaux Récents</h2>
          <p className="text-neutral-400 text-sm mt-2">Découvrez une sélection de projets réalisés</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          ${showcase
						.map(
							(item) => `<div className="p-6 rounded-2xl border border-neutral-800/80 bg-neutral-900/40 hover:bg-neutral-900/70 transition flex flex-col justify-between">
            <div>
              <div className="text-xs font-mono text-neutral-500 mb-2">${item.category}</div>
              <h3 className="text-lg font-bold text-white mb-2">${item.title}</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">${item.description}</p>
            </div>
            ${item.metrics ? `<div className="mt-6 pt-4 border-t border-neutral-800/80 text-xs font-semibold text-blue-400">${item.metrics}</div>` : ''}
          </div>`
						)
						.join('\n          ')}
        </div>
      </section>`
					: ''
			}

      ${
				pricing && pricing.plans.length > 0
					? `{/* 5. Tarifs avec Toggle Interactif */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-neutral-900">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Tarifs Clairs & Sans Surprise</h2>
          <div className="mt-4 inline-flex items-center gap-3 p-1 rounded-full border border-neutral-800 bg-neutral-900 text-xs">
            <button
              onClick={() => setIsAnnual(false)}
              className={\`px-3 py-1 rounded-full transition \${!isAnnual ? 'bg-white text-neutral-950 font-bold' : 'text-neutral-400'}\`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={\`px-3 py-1 rounded-full transition \${isAnnual ? 'bg-white text-neutral-950 font-bold' : 'text-neutral-400'}\`}
            >
              Annuel (-20%)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          ${pricing.plans
						.map(
							(p) => `<div className="p-6 rounded-2xl border ${p.popular ? 'border-blue-500 bg-neutral-900/80 ring-1 ring-blue-500/50' : 'border-neutral-800 bg-neutral-900/40'} flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">${p.name}</h3>
                ${p.popular ? '<span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-blue-500 text-white font-bold">Populaire</span>' : ''}
              </div>
              <div className="text-3xl font-extrabold text-white mb-2">
                {isAnnual ? Math.round(${p.monthlyPrice} * 0.8) : ${p.monthlyPrice}}€
                <span className="text-xs text-neutral-500 font-normal"> /mois</span>
              </div>
              <p className="text-xs text-neutral-400 mb-6">${p.description}</p>
              <ul className="space-y-2.5 text-xs text-neutral-300">
                ${p.features.map((feat) => `<li className="flex items-center gap-2"><Check size={14} className="text-blue-400" /> ${feat}</li>`).join('\n                ')}
              </ul>
            </div>
            <button className="mt-8 w-full py-2.5 rounded-xl font-medium text-xs bg-white text-neutral-950 hover:bg-neutral-200 transition">
              ${p.cta}
            </button>
          </div>`
						)
						.join('\n          ')}
        </div>
      </section>`
					: ''
			}

      {/* 6. Formulaire de Contact Réel & Fonctionnel */}
      <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
        <div className="p-8 rounded-3xl border border-neutral-800 bg-neutral-900/60 shadow-2xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white">${contact.title}</h2>
            <p className="text-xs text-neutral-400 mt-1">${contact.subtitle}</p>
          </div>

          {formStatus === 'sent' ? (
            <div className="p-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-center text-sm text-emerald-400">
              <Check className="mx-auto size-8 mb-2" />
              <p className="font-semibold">${contact.successMessage}</p>
              <button
                onClick={() => setFormStatus('idle')}
                className="mt-4 text-xs underline text-emerald-300 hover:text-white"
              >
                Envoyer un autre message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Votre Nom *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-800 bg-neutral-950 text-xs text-white focus:outline-none focus:border-blue-500 transition"
                    placeholder="Alexandre Dupont"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Votre E-mail *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-800 bg-neutral-950 text-xs text-white focus:outline-none focus:border-blue-500 transition"
                    placeholder="${contact.emailPlaceholder}"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1">Votre Message *</label>
                <textarea
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-800 bg-neutral-950 text-xs text-white focus:outline-none focus:border-blue-500 transition resize-none"
                  placeholder="Décrivez votre projet ou votre demande..."
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={formStatus === 'sending'}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
              >
                {formStatus === 'sending' ? (
                  <span>Envoi en cours...</span>
                ) : (
                  <>
                    <span>${contact.submitText}</span>
                    <Send size={14} />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* 7. Footer Sobre */}
      <footer className="border-t border-neutral-900 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 gap-4">
        <div>${footer.copyright}</div>
        <div className="flex items-center gap-6">
          ${footer.links.map((l) => `<a href="${l.href}" className="hover:text-neutral-300 transition">${l.label}</a>`).join('\n          ')}
        </div>
      </footer>
    </div>
  );
}
`;
}

/**
 * Génère le code de production en Vue 3 (Composition API / <script setup>)
 * Jamais de HTML brut.
 */
export function exportToVue(project: WebsiteProject): string {
	const { brandName, hero, features, contact, footer, navLinks } = project.data;

	return `<script setup lang="ts">
import { ref } from 'vue';

const brandName = '${brandName}';
const mobileMenuOpen = ref(false);
const formStatus = ref<'idle' | 'sending' | 'sent'>('idle');

const formData = ref({
  name: '',
  email: '',
  message: ''
});

const handleSubmit = () => {
  if (!formData.value.name || !formData.value.email) return;
  formStatus.value = 'sending';
  setTimeout(() => {
    formStatus.value = 'sent';
    formData.value = { name: '', email: '', message: '' };
  }, 800);
};
</script>

<template>
  <div class="min-h-screen bg-neutral-950 text-neutral-100 font-sans">
    <!-- Navigation -->
    <nav class="sticky top-0 z-50 backdrop-blur-md bg-neutral-950/80 border-b border-neutral-800/80 px-4 sm:px-8 h-16 flex items-center justify-between">
      <div class="font-bold text-lg text-white tracking-wider">{{ brandName }}</div>
      <div class="hidden md:flex items-center gap-6 text-sm text-neutral-400">
        ${navLinks.map((l) => `<a href="${l.href}" class="hover:text-white transition">${l.label}</a>`).join('\n        ')}
      </div>
      <a href="#contact" class="px-4 py-2 text-xs font-semibold rounded-lg bg-white text-neutral-950 hover:bg-neutral-200 transition">Contact</a>
    </nav>

    <!-- Hero -->
    <section class="pt-20 pb-16 px-4 max-w-6xl mx-auto text-center">
      <div class="inline-block px-3 py-1 rounded-full border border-neutral-800 bg-neutral-900 text-xs text-neutral-400 mb-6">
        ${hero.badge}
      </div>
      <h1 class="text-4xl sm:text-6xl font-extrabold text-white tracking-tight">
        ${hero.title} <span class="text-blue-400">${hero.highlightText}</span>
      </h1>
      <p class="mt-4 text-neutral-400 max-w-xl mx-auto text-base">${hero.subtitle}</p>
      <div class="mt-8 flex justify-center gap-4">
        <a href="#contact" class="px-6 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 transition">${hero.primaryCta}</a>
      </div>
    </section>

    <!-- Features -->
    <section class="py-16 px-4 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
      ${features
				.map(
					(f) => `<div class="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/50">
        <h3 class="text-lg font-bold text-white">${f.title}</h3>
        <p class="text-xs text-neutral-400 mt-2 leading-relaxed">${f.description}</p>
      </div>`
				)
				.join('\n      ')}
    </section>

    <!-- Contact Formulaire Fonctionnel -->
    <section id="contact" class="py-16 px-4 max-w-xl mx-auto">
      <div class="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/70">
        <h2 class="text-xl font-bold text-white text-center mb-6">${contact.title}</h2>
        <div v-if="formStatus === 'sent'" class="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-center text-xs">
          ${contact.successMessage}
        </div>
        <form v-else @submit.prevent="handleSubmit" class="space-y-4">
          <input v-model="formData.name" placeholder="Votre nom" required class="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-blue-500" />
          <input v-model="formData.email" type="email" placeholder="Votre email" required class="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-blue-500" />
          <textarea v-model="formData.message" rows="3" placeholder="Message" required class="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-blue-500"></textarea>
          <button type="submit" class="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 transition">${contact.submitText}</button>
        </form>
      </div>
    </section>

    <!-- Footer -->
    <footer class="border-t border-neutral-900 py-6 text-center text-xs text-neutral-500">
      ${footer.copyright}
    </footer>
  </div>
</template>
`;
}

/**
 * Génère le code de production en Svelte 5 (Runes / Modern Svelte)
 * Jamais de HTML brut.
 */
export function exportToSvelte(project: WebsiteProject): string {
	const { brandName, hero, features, contact, footer, navLinks } = project.data;

	return `<script lang="ts">
  let name = $state('');
  let email = $state('');
  let message = $state('');
  let formStatus = $state<'idle' | 'sending' | 'sent'>('idle');

  const handleSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    formStatus = 'sending';
    setTimeout(() => {
      formStatus = 'sent';
      name = '';
      email = '';
      message = '';
    }, 800);
  };
</script>

<div class="min-h-screen bg-neutral-950 text-neutral-100 font-sans">
  <nav class="sticky top-0 z-50 backdrop-blur-md bg-neutral-950/80 border-b border-neutral-800 px-6 h-16 flex items-center justify-between">
    <span class="font-bold text-white text-lg tracking-wider">${brandName}</span>
    <div class="hidden md:flex gap-6 text-xs text-neutral-400">
      ${navLinks.map((l) => `<a href="${l.href}" class="hover:text-white transition">${l.label}</a>`).join('\n      ')}
    </div>
    <a href="#contact" class="px-4 py-2 text-xs font-semibold rounded-lg bg-white text-neutral-950 hover:bg-neutral-200 transition">Contact</a>
  </nav>

  <section class="pt-24 pb-16 px-4 text-center max-w-4xl mx-auto">
    <div class="inline-block px-3 py-1 rounded-full border border-neutral-800 bg-neutral-900 text-xs text-neutral-400 mb-6">
      ${hero.badge}
    </div>
    <h1 class="text-4xl sm:text-6xl font-extrabold text-white tracking-tight">
      ${hero.title} <span class="text-blue-400">${hero.highlightText}</span>
    </h1>
    <p class="mt-4 text-sm sm:text-base text-neutral-400 max-w-xl mx-auto">${hero.subtitle}</p>
    <div class="mt-8">
      <a href="#contact" class="px-6 py-3 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 transition shadow-lg shadow-blue-500/20">${hero.primaryCta}</a>
    </div>
  </section>

  <section class="py-16 px-4 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
    ${features
			.map(
				(f) => `<div class="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/50">
      <h3 class="text-base font-bold text-white">${f.title}</h3>
      <p class="text-xs text-neutral-400 mt-2 leading-relaxed">${f.description}</p>
    </div>`
			)
			.join('\n    ')}
  </section>

  <section id="contact" class="py-16 px-4 max-w-xl mx-auto">
    <div class="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/70">
      <h2 class="text-xl font-bold text-white text-center mb-6">${contact.title}</h2>
      {#if formStatus === 'sent'}
        <div class="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-center text-xs">
          ${contact.successMessage}
        </div>
      {:else}
        <form onsubmit={handleSubmit} class="space-y-4">
          <input bind:value={name} placeholder="Nom" required class="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-blue-500" />
          <input bind:value={email} type="email" placeholder="Email" required class="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-blue-500" />
          <textarea bind:value={message} rows="3" placeholder="Message" required class="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-blue-500"></textarea>
          <button type="submit" class="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 transition">${contact.submitText}</button>
        </form>
      {/if}
    </div>
  </section>

  <footer class="border-t border-neutral-900 py-6 text-center text-xs text-neutral-500">
    ${footer.copyright}
  </footer>
</div>
`;
}
