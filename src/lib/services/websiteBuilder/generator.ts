import type { WebsiteProject, WebsiteElementTarget } from './types';
import { DEFAULT_TEMPLATES } from './templates';
import { sendAriaCompletion } from '$lib/utils/ariaModels';

/**
 * Détermine le meilleur archétype de départ pour ne JAMAIS partir d'une page blanche.
 */
export function selectBestArchetype(prompt: string): 'portfolio' | 'saas' | 'agency' {
	const lower = prompt.toLowerCase();
	if (
		lower.includes('portfolio') ||
		lower.includes('créateur') ||
		lower.includes('createur') ||
		lower.includes('streamer') ||
		lower.includes('vidéaste') ||
		lower.includes('videaste') ||
		lower.includes('youtube') ||
		lower.includes('artiste')
	) {
		return 'portfolio';
	}
	if (
		lower.includes('saas') ||
		lower.includes('logiciel') ||
		lower.includes('plateforme') ||
		lower.includes('ia') ||
		lower.includes('ai') ||
		lower.includes('startup') ||
		lower.includes('app')
	) {
		return 'saas';
	}
	return 'agency';
}

/**
 * Génère un site web sur-mesure complet à partir d'un prompt utilisateur via Aria Code.
 */
export async function generateWebsiteWithAriaCode(
	prompt: string,
	onProgress?: (step: string) => void
): Promise<WebsiteProject> {
	const archetypeKey = selectBestArchetype(prompt);
	const baseTemplate = structuredClone(DEFAULT_TEMPLATES[archetypeKey] || DEFAULT_TEMPLATES.portfolio);

	if (onProgress) onProgress('1/3 — Synthèse des composants (Shadcn, Aceternity, Mantine, DaisyUI, Base UI)...');

	const systemPrompt = `Tu es Aria Code, la Super-IA experte en ingénierie logicielle et design d'interfaces modernes haut de gamme.
L'utilisateur te demande de concevoir un site web d'élite fusionnant les codes visuels de Shadcn UI (palette zinc sombre), Aceternity UI (bento grid, gradient text reveal, spotlight), Mantine (stats grid, segmented controls), DaisyUI et Base UI (sémantique impeccable).
Zéro design d'IA amateur, zéro bizarrerie ou truc chelou.
Tu dois répondre UNIQUEMENT avec un objet JSON valide sans markdown additionnel ni balises autour.
Structure JSON attendue :
{
  "title": "Titre court du site",
  "tagline": "Slogan percutant",
  "brandName": "Nom de marque ou créateur",
  "hero": {
    "badge": "Badge supérieur court",
    "title": "Début du grand titre",
    "highlightText": "Fin du titre mise en valeur",
    "subtitle": "Description 2 lignes percutante",
    "primaryCta": "Bouton principal",
    "secondaryCta": "Bouton secondaire",
    "stats": [
      { "value": "Chiffre", "label": "Libellé" },
      { "value": "Chiffre", "label": "Libellé" },
      { "value": "Chiffre", "label": "Libellé" }
    ]
  },
  "features": [
    { "title": "Point fort 1", "description": "Explication claire", "tag": "Tag 1" },
    { "title": "Point fort 2", "description": "Explication claire", "tag": "Tag 2" },
    { "title": "Point fort 3", "description": "Explication claire", "tag": "Tag 3" }
  ],
  "contact": {
    "title": "Titre du formulaire de contact",
    "subtitle": "Sous-titre invitant au contact",
    "emailPlaceholder": "exemple@domaine.com",
    "submitText": "Texte du bouton d'envoi",
    "successMessage": "Message de confirmation après envoi réel"
  }
}`;

	try {
		if (onProgress) onProgress('2/3 — Génération ultra-rapide via Aria Code...');
		const res = await sendAriaCompletion(
			'aria-code',
			[
				{ role: 'system', content: systemPrompt },
				{
					role: 'user',
					content: `Génère le site suivant pour : "${prompt}". Style sobre, ultra-moderne, zéro défaut.`
				}
			],
			{ stream: false }
		);

		if (onProgress) onProgress('3/3 — Assemblage réactif & rendu en direct...');

		const dataText = await res.text();
		// Nettoyage pour extraire le JSON
		let jsonStr = dataText.trim();
		const matchJson = jsonStr.match(/\{[\s\S]*\}/);
		if (matchJson) {
			jsonStr = matchJson[0];
		}

		const parsed = JSON.parse(jsonStr);

		// Fusion intelligente avec le template
		const newProject: WebsiteProject = {
			...baseTemplate,
			id: `site-${Date.now()}`,
			title: parsed.title || baseTemplate.title,
			tagline: parsed.tagline || baseTemplate.tagline,
			prompt: prompt,
			data: {
				...baseTemplate.data,
				brandName: parsed.brandName || baseTemplate.data.brandName,
				hero: {
					...baseTemplate.data.hero,
					...(parsed.hero || {})
				},
				features:
					Array.isArray(parsed.features) && parsed.features.length > 0
						? parsed.features.map((f: any, i: number) => ({
								id: `feat-${i + 1}`,
								icon: 'zap',
								title: f.title || `Caractéristique ${i + 1}`,
								description: f.description || '',
								tag: f.tag || 'Essentiel'
							}))
						: baseTemplate.data.features,
				contact: {
					...baseTemplate.data.contact,
					...(parsed.contact || {})
				}
			}
		};

		return newProject;
	} catch (err) {
		console.warn('Aria Code fallback to baseline template:', err);
		// En cas d'erreur réseau ou parsing, le template haut de gamme s'adapte immédiatement
		baseTemplate.prompt = prompt;
		baseTemplate.title = `Site Web : ${prompt.slice(0, 40)}`;
		return baseTemplate;
	}
}

/**
 * Modifie un élément précis cliqué par l'utilisateur via Aria Code.
 */
export async function modifyElementWithAriaCode(
	project: WebsiteProject,
	target: WebsiteElementTarget,
	instruction: string
): Promise<WebsiteProject> {
	const cloned = structuredClone(project);

	const promptInstruction = `Tu es Aria Code. L'utilisateur a cliqué sur l'élément "${target.name}" (${target.elementId}) dont la valeur actuelle est : "${target.currentText}".
Il souhaite la modification suivante : "${instruction}".
Réponds avec un JSON contenant UNIQUEMENT les clés modifiées adaptées à cet élément.
Exemple: { "newText": "Nouveau texte", "subtitle": "Nouveau sous-titre" }`;

	try {
		const res = await sendAriaCompletion(
			'aria-code',
			[{ role: 'user', content: promptInstruction }],
			{ stream: false }
		);

		const text = await res.text();
		const match = text.match(/\{[\s\S]*\}/);
		if (match) {
			const delta = JSON.parse(match[0]);
			const val = delta.newText || delta.title || delta.badge || delta.subtitle || instruction;

			// Application ciblée selon l'identifiant de l'élément cliqué
			if (target.elementId === 'hero-title') {
				cloned.data.hero.title = val;
			} else if (target.elementId === 'hero-highlight') {
				cloned.data.hero.highlightText = val;
			} else if (target.elementId === 'hero-badge') {
				cloned.data.hero.badge = val;
			} else if (target.elementId === 'hero-subtitle') {
				cloned.data.hero.subtitle = val;
			} else if (target.elementId === 'hero-primary-cta') {
				cloned.data.hero.primaryCta = val;
			} else if (target.elementId === 'brand-name') {
				cloned.data.brandName = val;
			} else if (target.elementId === 'contact-title') {
				cloned.data.contact.title = val;
			} else if (target.elementId === 'contact-subtitle') {
				cloned.data.contact.subtitle = val;
			} else if (target.elementId === 'contact-submit') {
				cloned.data.contact.submitText = val;
			} else if (target.elementId.startsWith('feat-title-')) {
				const idx = parseInt(target.elementId.replace('feat-title-', ''));
				if (cloned.data.features[idx]) cloned.data.features[idx].title = val;
			} else if (target.elementId.startsWith('feat-desc-')) {
				const idx = parseInt(target.elementId.replace('feat-desc-', ''));
				if (cloned.data.features[idx]) cloned.data.features[idx].description = val;
			}
		}
	} catch (e) {
		// Modification directe si l'API est indisponible
		if (target.elementId === 'hero-title') cloned.data.hero.title = instruction;
		else if (target.elementId === 'hero-badge') cloned.data.hero.badge = instruction;
		else if (target.elementId === 'hero-subtitle') cloned.data.hero.subtitle = instruction;
		else if (target.elementId === 'brand-name') cloned.data.brandName = instruction;
		else if (target.elementId === 'contact-title') cloned.data.contact.title = instruction;
	}

	return cloned;
}
