import type { Model3DPart, Model3DProject } from './types';
import { TEMPLATES_3D } from './templates3d';
import {
	parseBlenderScript,
	generateBlenderPythonScript,
	calculateModelStats
} from './virtualBlenderEngine';
import { sendAriaCompletion } from '$lib/utils/ariaModels';

/**
 * Invite Système spécialisée pour Aria 3D Studio.
 * Guide l'IA pour concevoir des modèles 3D Low-Poly d'élite adaptés à Roblox Studio.
 */
export const ARIA_3D_STUDIO_PROMPT = `Tu es Aria 3D Studio, la Super-IA maîtresse en modélisation 3D Low-Poly et automatisation Blender (bpy) pour Roblox Studio.
Ta mission est de créer des modèles 3D époustouflants, ultra soignés, purement Low-Poly (flat-shaded stylisé), parfaits pour Roblox MeshPart ou les jeux indépendants.

RÈGLES D'EXCELLENCE GÉOMÉTRIQUE & BLENDER (bpy) :
1. PURE LOW-POLY : Pas d'over-engineering ou de polygones inutiles. Utilise des primitives nettes : Cube, Cylindre (8-12 segments), Cône (6-8 segments), Icosaèdre / Sphère facettée (subd 1), Pyramide (4 segments), Torus (10 segments).
2. DÉCOMPOSITION EN PIÈCES DISTINCTES : Tout objet complexe doit être composé de 6 à 15 pièces élémentaires nommées clairement (ex: Lame_Acier, Garde_Or, Poignee_Cuir, Pommeau_Rubis, Toit_Tuiles, Poutre_Angle, Roue_Av_G, etc.).
3. PALETTE DE COULEURS HARMONIEUSE : Utilise des couleurs vives et contrastées. Applique des matériaux Principled BSDF avec Base Color en format RGB float ou Hex.
4. COMPATIBILITÉ ROBLOX STUDIO : Le modèle doit être immédiatement utilisable en tant que MeshPart (< 10 000 triangles au total).
5. FORMAT DE RÉPONSE OBLIGATOIRE :
Tu dois fournir :
A) Un bloc JSON \`\`\`json:3d_manifest\`\`\` contenant les métadonnées et la liste des pièces :
{
  "title": "Nom du modèle",
  "description": "Description stylistique courte",
  "category": "weapon|vehicle|building|nature|prop|character|scifi|custom",
  "palette": ["#HEX1", "#HEX2", "#HEX3"],
  "parts": [
    {
      "name": "Nom_De_La_Piece",
      "type": "cube|cylinder|cone|pyramid|sphere|torus|wedge",
      "location": [x, y, z],
      "rotation": [rx_deg, ry_deg, rz_deg],
      "scale": [sx, sy, sz],
      "color": "#HEXCODE",
      "roughness": 0.5,
      "metalness": 0.1
    }
  ]
}

B) Le script Python Blender complet et 100% exécutable dans un bloc \`\`\`python:blender\`\`\` qui crée exactement ces pièces avec l'API bpy.`;

/**
 * Choisit le meilleur archétype de secours selon les mots-clés du prompt.
 */
export function selectBestArchetype(prompt: string): string {
	const lower = prompt.toLowerCase();
	if (lower.includes('épée') || lower.includes('epee') || lower.includes('sword') || lower.includes('arme') || lower.includes('dague') || lower.includes('hache')) {
		return 'sword';
	}
	if (lower.includes('voiture') || lower.includes('car') || lower.includes('véhicule') || lower.includes('vehicule') || lower.includes('cyber') || lower.includes('moto')) {
		return 'car';
	}
	if (lower.includes('maison') || lower.includes('house') || lower.includes('château') || lower.includes('chateau') || lower.includes('bâtiment') || lower.includes('donjon') || lower.includes('auberge')) {
		return 'house';
	}
	if (lower.includes('arbre') || lower.includes('tree') || lower.includes('nature') || lower.includes('forêt') || lower.includes('plante') || lower.includes('champignon')) {
		return 'tree';
	}
	if (lower.includes('vaisseau') || lower.includes('ship') || lower.includes('fusée') || lower.includes('espace') || lower.includes('sci-fi') || lower.includes('scifi') || lower.includes('avion')) {
		return 'scifi';
	}
	if (lower.includes('coffre') || lower.includes('chest') || lower.includes('trésor') || lower.includes('tresor') || lower.includes('boite') || lower.includes('loot')) {
		return 'chest';
	}
	return 'sword';
}

/**
 * Génère un modèle 3D sur-mesure complet avec Aria.
 */
export async function generate3DModelWithAria(
	prompt: string,
	referenceImage?: string,
	palette: string[] = [],
	onProgress?: (step: string) => void
): Promise<Model3DProject> {
	if (onProgress) onProgress('1/3 — Analyse morphologique et décomposition géométrique low-poly...');

	const archetypeKey = selectBestArchetype(prompt);
	const fallbackProject = structuredClone(TEMPLATES_3D[archetypeKey] || TEMPLATES_3D.sword);

	let userContent = `Créer un modèle 3D Low-Poly pour Roblox Studio basé sur la demande suivante : "${prompt}".`;
	if (palette.length > 0) {
		userContent += `\nPalette de couleurs imposée extraite de la référence : ${palette.join(', ')}.`;
	}
	if (referenceImage) {
		userContent += `\nUne image de référence est fournie. Reconstitue fidèlement les proportions, la silhouette et les contrastes de cette référence en low-poly.`;
	}

	const messages: any[] = [
		{ role: 'system', content: ARIA_3D_STUDIO_PROMPT },
		{ role: 'user', content: userContent }
	];

	if (onProgress) onProgress('2/3 — Synthèse du script Python Blender (bpy) et calibration des coordonnées...');

	try {
		// On utilise aria-code pour sa supériorité en code & géométrie algorithmique
		const response = await sendAriaCompletion(messages, 'aria-code');
		const text = response?.choices?.[0]?.message?.content || '';

		if (onProgress) onProgress('3/3 — Compilation dans le moteur virtuel 3D et calcul des polygones...');

		// 1. Tenter d'extraire le manifeste JSON
		let extractedParts: Model3DPart[] | null = null;
		let projectTitle = prompt.slice(0, 30) || fallbackProject.title;
		let projectDesc = 'Modèle low-poly généré sur-mesure par Aria 3D Studio.';
		let projectCat: any = fallbackProject.category;
		let projectPalette = palette.length > 0 ? palette : fallbackProject.palette;

		const jsonMatch = text.match(/```(?:json:3d_manifest|json:3d|json)\s*([\s\S]*?)```/);
		if (jsonMatch) {
			try {
				const data = JSON.parse(jsonMatch[1].trim());
				if (data.title) projectTitle = data.title;
				if (data.description) projectDesc = data.description;
				if (data.category) projectCat = data.category;
				if (data.palette && Array.isArray(data.palette)) projectPalette = data.palette;

				if (data.parts && Array.isArray(data.parts) && data.parts.length > 0) {
					extractedParts = data.parts.map((p: any, idx: number) => ({
						id: `part_${Date.now()}_${idx + 1}`,
						name: p.name || `Piece_${idx + 1}`,
						type: p.type || 'cube',
						location: p.location || [0, 0, 0],
						rotation: p.rotation || [0, 0, 0],
						scale: p.scale || [1, 1, 1],
						color: p.color || projectPalette[idx % projectPalette.length] || '#4A90E2',
						roughness: p.roughness ?? 0.5,
						metalness: p.metalness ?? 0.1,
						visible: true
					}));
				}
			} catch (err) {
				console.warn('Erreur parsing json:3d_manifest :', err);
			}
		}

		// 2. Extraire le script Python Blender
		let pythonScript = '';
		const pyMatch = text.match(/```(?:python:blender|python|blender)\s*([\s\S]*?)```/);
		if (pyMatch) {
			pythonScript = pyMatch[1].trim();
		}

		// 3. Si les pièces n'ont pas été trouvées via JSON, analyser le script Python avec notre parser
		if (!extractedParts || extractedParts.length === 0) {
			if (pythonScript) {
				extractedParts = parseBlenderScript(pythonScript);
			}
		}

		// 4. Si nous avons des pièces mais pas de script Python complet, le générer
		if (extractedParts && extractedParts.length > 0) {
			if (!pythonScript) {
				pythonScript = generateBlenderPythonScript(projectTitle, extractedParts);
			}

			const stats = calculateModelStats(extractedParts);

			return {
				id: `project_3d_${Date.now()}`,
				title: projectTitle,
				description: projectDesc,
				category: projectCat,
				pythonCode: pythonScript,
				parts: extractedParts,
				palette: projectPalette,
				referenceImage,
				stats,
				createdAt: Date.now()
			};
		}

		// Si le modèle a échoué à renvoyer un format valide, adapter l'archétype le plus proche
		const adaptedParts = fallbackProject.parts.map((p, idx) => ({
			...p,
			color: projectPalette[idx % projectPalette.length] || p.color
		}));

		return {
			...fallbackProject,
			id: `project_3d_${Date.now()}`,
			title: `${projectTitle} (Stylisé)`,
			description: projectDesc,
			parts: adaptedParts,
			palette: projectPalette,
			referenceImage,
			pythonCode: generateBlenderPythonScript(projectTitle, adaptedParts),
			stats: calculateModelStats(adaptedParts),
			createdAt: Date.now()
		};
	} catch (error) {
		console.error('Erreur génération Aria 3D Studio :', error);
		return fallbackProject;
	}
}
