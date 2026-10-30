/**
 * Service Trellis Cloud AI - Génération 3D 100% Cloud (NVIDIA GPU A10G)
 * Ne nécessite AUCUN PC personnel ni GPU local.
 * Fonctionne 24h/24 pour tous les visiteurs du site Vercel.
 */

import { Client, handle_file } from '@gradio/client';

const TRELLIS_SPACE = 'trellis-community/TRELLIS';

/**
 * Génère une image de référence par IA si l'utilisateur n'en fournit pas
 */
export async function generateReferenceImageFromText(prompt: string): Promise<Blob> {
	const cleanPrompt = `${prompt}, 3d asset style, clean white isolated background, high details, centered, single object, octane render`;
	const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?width=512&height=512&nologo=true&seed=${Math.floor(Math.random() * 100000)}`;

	const response = await fetch(url);
	if (!response.ok) {
		throw new Error('Impossible de générer l\'image de référence pour le prompt.');
	}
	return await response.blob();
}

/**
 * Pipeline complet Trellis Cloud : Image -> Modèle 3D .GLB
 */
export async function generate3DWithTrellisCloud(
	imageBlobOrFile: Blob | File,
	onProgress?: (step: string, percent?: number) => void
): Promise<{ glbUrl: string }> {
	onProgress?.('Connexion au cluster Cloud GPU (NVIDIA A10G)...', 15);

	const app = await Client.connect(TRELLIS_SPACE);

	onProgress?.('Prétraitement & détourage automatique de l\'image...', 30);
	const filePayload = handle_file(imageBlobOrFile);

	onProgress?.('Calcul neuronal 3D (Sparse Structure & SLAT) en cours...', 60);

	// Appel de l'endpoint Trellis generate_and_extract_glb
	const result = (await app.predict('/generate_and_extract_glb', {
		image: filePayload,
		multiimages: [],
		seed: 0,
		ss_guidance_strength: 7.5,
		ss_sampling_steps: 12,
		slat_guidance_strength: 3,
		slat_sampling_steps: 12,
		multiimage_algo: 'stochastic',
		mesh_simplify: 0.95,
		texture_size: 1024
	})) as any;

	onProgress?.('Extraction du maillage .GLB et finalisation...', 90);

	const dataArray = result?.data;
	if (!dataArray || !Array.isArray(dataArray)) {
		throw new Error('Réponse inattendue du cluster Trellis Cloud.');
	}

	// dataArray contient : [video, litmodel3d (glb), downloadbutton (glb)]
	const glbObj = dataArray[2] || dataArray[1];
	const rawUrl = glbObj?.url || glbObj?.path || glbObj;

	if (!rawUrl || typeof rawUrl !== 'string') {
		throw new Error('Aucun lien de fichier .GLB n\'a été renvoyé par le modèle 3D.');
	}

	onProgress?.('Modèle 3D haute fidélité prêt !', 100);

	return {
		glbUrl: rawUrl
	};
}
