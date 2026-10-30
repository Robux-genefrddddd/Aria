/**
 * Analyseur d'images de référence pour Aria 3D Studio.
 * Extrait la palette de couleurs dominante et prépare les consignes
 * pour la reconstruction géométrique en low-poly stylisé.
 */

export interface ImageAnalysisResult {
	palette: string[];
	aspectRatio: number;
	width: number;
	height: number;
}

/**
 * Extrait une palette de 5 à 7 couleurs dominantes depuis une image via Canvas.
 */
export async function extractPaletteFromImage(imageSrc: string, colorCount = 6): Promise<ImageAnalysisResult> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = 'anonymous';

		img.onload = () => {
			try {
				const canvas = document.createElement('canvas');
				const ctx = canvas.getContext('2d');
				if (!ctx) {
					resolve({ palette: ['#3A3A3C', '#007AFF', '#34C759', '#FF9500'], aspectRatio: 1, width: 100, height: 100 });
					return;
				}

				// Redimensionner à une petite vignette pour accélérer l'analyse
				const sampleWidth = 64;
				const sampleHeight = Math.round((64 * img.height) / img.width);
				canvas.width = sampleWidth;
				canvas.height = sampleHeight;

				ctx.drawImage(img, 0, 0, sampleWidth, sampleHeight);
				const imgData = ctx.getImageData(0, 0, sampleWidth, sampleHeight).data;

				// Compteur de couleurs simplifiées (quantification)
				const colorBucket: Record<string, number> = {};

				for (let i = 0; i < imgData.length; i += 16) {
					const r = imgData[i];
					const g = imgData[i + 1];
					const b = imgData[i + 2];
					const a = imgData[i + 3];

					// Ignorer les pixels transparents ou quasi-noirs extrêmes / quasi-blancs
					if (a < 128) continue;
					const brightness = (r + g + b) / 3;
					if (brightness < 15 || brightness > 245) continue;

					// Quantification sur grille de 32
					const qr = Math.round(r / 32) * 32;
					const qg = Math.round(g / 32) * 32;
					const qb = Math.round(b / 32) * 32;

					const hex = `#${Math.min(255, qr).toString(16).padStart(2, '0')}${Math.min(255, qg).toString(16).padStart(2, '0')}${Math.min(255, qb).toString(16).padStart(2, '0')}`.toUpperCase();
					colorBucket[hex] = (colorBucket[hex] || 0) + 1;
				}

				// Trier par fréquence
				const sortedColors = Object.entries(colorBucket)
					.sort((a, b) => b[1] - a[1])
					.map((item) => item[0]);

				const finalPalette = sortedColors.slice(0, colorCount);
				if (finalPalette.length < 3) {
					finalPalette.push('#4A90E2', '#50E3C2', '#F5A623');
				}

				resolve({
					palette: finalPalette,
					aspectRatio: img.width / img.height,
					width: img.width,
					height: img.height
				});
			} catch (err) {
				console.error('Erreur analyse image :', err);
				resolve({ palette: ['#2C3E50', '#E74C3C', '#ECF0F1', '#3498DB'], aspectRatio: 1, width: 100, height: 100 });
			}
		};

		img.onerror = () => {
			resolve({ palette: ['#3A3A3C', '#007AFF', '#FF9500'], aspectRatio: 1, width: 100, height: 100 });
		};

		img.src = imageSrc;
	});
}

/**
 * Construit un prompt optimisé pour la reconstruction fidèle en 3D Low-Poly
 * à partir de l'image de référence et de sa palette.
 */
export function buildReferencePrompt(userPrompt: string, palette: string[], imageAttached = false): string {
	const paletteStr = palette.join(', ');

	return `
[CONSIGNE 3D ARIA STUDIO — RECONSTRUCTION FIDÈLE LOW-POLY]
Objet demandé : ${userPrompt || 'Modèle 3D fidèle à la référence'}
Palette de couleurs extraite de la référence : [${paletteStr}]
${imageAttached ? 'Image de référence fournie : Décompose la silhouette en primitives géométriques nettes et facettées (Cubes, Cylindres, Cônes, Icosaèdres, Wedges).' : 'Pas d’image : Imagine une composition low-poly ultra soignée avec un style RPG Roblox distinctif.'}

Exigences géométriques :
1. Primitives nettes et facettées (flat shading low-poly).
2. Couleurs vives et contrastées issues de la palette.
3. Chaque pièce maîtresse doit être un objet séparé nommé clairement (Lame, Garde, Châssis, Ailes, Toit, etc.).
4. Script Python Blender (bpy) 100% exécutable et propre.
`;
}
