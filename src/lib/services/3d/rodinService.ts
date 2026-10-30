/**
 * Service Hyper3D Rodin AI - Générateur de modèles 3D par IA (Text-to-3D et Image-to-3D)
 * Basé sur l'implémentation de ctate/3d-model-generator
 */

export interface RodinOptions {
	condition_mode: 'concat';
	quality: 'medium' | 'high';
	geometry_file_format: 'glb';
	material: 'PBR' | 'Diffuse';
	use_hyper: boolean;
	tier: 'Regular' | 'Pro';
	TAPose: boolean;
	mesh_mode: 'Quad' | 'Tri';
	mesh_simplify: boolean;
	mesh_smooth: boolean;
}

export const DEFAULT_RODIN_OPTIONS: RodinOptions = {
	condition_mode: 'concat',
	quality: 'medium',
	geometry_file_format: 'glb',
	material: 'PBR',
	use_hyper: false,
	tier: 'Regular',
	TAPose: false,
	mesh_mode: 'Quad',
	mesh_simplify: true,
	mesh_smooth: true
};

const RODIN_BASE_URL = 'https://hyperhuman.deemos.com/api/v2';
const DEFAULT_PUBLIC_KEY = 'vibecoding';
const STORAGE_KEY = 'aria_hyper3d_rodin_api_key';

export function getRodinApiKey(): string {
	if (typeof window !== 'undefined') {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored && stored.trim()) {
			return stored.trim();
		}
	}
	return DEFAULT_PUBLIC_KEY;
}

export function setRodinApiKey(key: string): void {
	if (typeof window !== 'undefined') {
		if (key && key.trim()) {
			localStorage.setItem(STORAGE_KEY, key.trim());
		} else {
			localStorage.removeItem(STORAGE_KEY);
		}
	}
}

export function isUsingCustomApiKey(): boolean {
	if (typeof window !== 'undefined') {
		const stored = localStorage.getItem(STORAGE_KEY);
		return Boolean(stored && stored.trim() && stored.trim() !== DEFAULT_PUBLIC_KEY);
	}
	return false;
}

/**
 * Soumet une tâche de génération 3D à Hyper3D Rodin
 */
export async function submitRodinJob(
	prompt: string,
	images?: (File | Blob)[],
	options: Partial<RodinOptions> = {},
	apiKey?: string
): Promise<{ uuid: string; jobs: { subscription_key: string } }> {
	const key = apiKey || getRodinApiKey();
	const mergedOptions = { ...DEFAULT_RODIN_OPTIONS, ...options };

	const formData = new FormData();
	if (prompt && prompt.trim()) {
		formData.append('prompt', prompt.trim());
	}

	if (images && images.length > 0) {
		images.forEach((img, idx) => {
			if (img instanceof File) {
				formData.append('images', img);
			} else {
				formData.append('images', img, `ref_image_${idx}.png`);
			}
		});
	}

	formData.append('condition_mode', mergedOptions.condition_mode);
	formData.append('geometry_file_format', mergedOptions.geometry_file_format);
	formData.append('material', mergedOptions.material);
	formData.append('quality', mergedOptions.quality);
	formData.append('use_hyper', mergedOptions.use_hyper.toString());
	formData.append('tier', mergedOptions.tier);
	formData.append('TAPose', mergedOptions.TAPose.toString());
	formData.append('mesh_mode', mergedOptions.mesh_mode);
	formData.append('mesh_simplify', mergedOptions.mesh_simplify.toString());
	formData.append('mesh_smooth', mergedOptions.mesh_smooth.toString());

	const response = await fetch(`${RODIN_BASE_URL}/rodin`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${key}`
		},
		body: formData
	});

	if (!response.ok) {
		const errorText = await response.text();
		let parsedError: any = null;
		try {
			parsedError = JSON.parse(errorText);
		} catch {
			// ignore
		}

		if (parsedError?.error === 'API_INSUFFICIENT_FUNDS') {
			throw new Error(
				'API_INSUFFICIENT_FUNDS: La clé Hyper3D Rodin actuelle n\'a plus de crédits. Veuillez configurer votre clé API personnelle Hyper3D (sur hyperhuman.deemos.com) ou basculer sur le moteur Blender Virtuel Low-Poly.'
			);
		}

		throw new Error(
			`Erreur Hyper3D Rodin (${response.status}): ${parsedError?.message || parsedError?.error || errorText || 'Requête refusée'}`
		);
	}

	const data = await response.json();
	return data;
}

/**
 * Vérifie l'état d'avancement d'un job Rodin
 */
export async function checkRodinJobStatus(
	subscriptionKey: string,
	apiKey?: string
): Promise<{ jobs: Array<{ uuid: string; status: 'Done' | 'Failed' | 'Processing' | 'Pending' | string }> }> {
	const key = apiKey || getRodinApiKey();

	const response = await fetch(`${RODIN_BASE_URL}/status`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${key}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ subscription_key: subscriptionKey })
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Échec du suivi Rodin (${response.status}): ${errorText}`);
	}

	return await response.json();
}

/**
 * Récupère les liens de téléchargement du modèle final
 */
export async function downloadRodinModel(
	taskUuid: string,
	apiKey?: string
): Promise<{ list: Array<{ name: string; url: string }>; error?: string }> {
	const key = apiKey || getRodinApiKey();

	const response = await fetch(`${RODIN_BASE_URL}/download`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${key}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ task_uuid: taskUuid })
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Échec du téléchargement Rodin (${response.status}): ${errorText}`);
	}

	return await response.json();
}

/**
 * Pipeline complet : Soumission -> Polling -> Récupération du lien .GLB
 */
export async function generate3DWithRodin(
	prompt: string,
	images?: (File | Blob)[],
	onProgress?: (message: string, percent?: number) => void,
	options: Partial<RodinOptions> = {},
	apiKey?: string
): Promise<{ glbUrl: string; downloadUrl: string; taskUuid: string; allFiles: Array<{ name: string; url: string }> }> {
	onProgress?.('Envoi de la requête au réseau de neurones Hyper3D Rodin...', 10);

	const jobData = await submitRodinJob(prompt, images, options, apiKey);

	if (!jobData?.jobs?.subscription_key || !jobData?.uuid) {
		throw new Error('Réponse invalide de Hyper3D: identifiants de tâche manquants.');
	}

	const subKey = jobData.jobs.subscription_key;
	const taskUuid = jobData.uuid;

	onProgress?.('Modélisation 3D neuronale en cours sur les clusters GPU...', 25);

	// Polling toutes les 3 secondes jusqu'à complétion (max 5 minutes)
	const maxAttempts = 100;
	let attempts = 0;

	while (attempts < maxAttempts) {
		attempts++;
		await new Promise((res) => setTimeout(res, 3000));

		const statusData = await checkRodinJobStatus(subKey, apiKey);
		const jobs = statusData.jobs || [];

		if (jobs.length === 0) {
			continue;
		}

		const allDone = jobs.every((j) => j.status === 'Done');
		const anyFailed = jobs.some((j) => j.status === 'Failed');

		const progressEstimate = Math.min(25 + Math.round((attempts / 30) * 65), 90);
		onProgress?.(`Génération de la géométrie et texturation PBR (${jobs[0]?.status || 'Processing'})...`, progressEstimate);

		if (allDone) {
			onProgress?.('Finalisation et assemblage du fichier .GLB...', 95);
			break;
		}

		if (anyFailed) {
			throw new Error('La génération neuronale Hyper3D a échoué. Essayez avec un prompt plus explicite.');
		}
	}

	if (attempts >= maxAttempts) {
		throw new Error('Délai d\'attente dépassé (timeout 5 minutes) pour la génération 3D.');
	}

	// Récupérer le fichier .glb
	const downloadData = await downloadRodinModel(taskUuid, apiKey);
	const files = downloadData.list || [];

	const glbFile = files.find((f) => f.name.toLowerCase().endsWith('.glb')) || files[0];

	if (!glbFile) {
		throw new Error('Aucun fichier .GLB trouvé dans le package généré.');
	}

	onProgress?.('Modèle 3D prêt ! Chargement dans le viewport...', 100);

	return {
		glbUrl: glbFile.url,
		downloadUrl: glbFile.url,
		taskUuid,
		allFiles: files
	};
}
