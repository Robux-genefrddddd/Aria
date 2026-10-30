/**
 * Service Modly AI - Connecteur Client Open-Source (Hunyuan3D, Trellis, TripoSG)
 * Permet à Aria UI (hébergé sur Vercel) de se connecter à un serveur Modly (local GPU ou serveur Cloud)
 * pour des générations 3D 100% ILLIMITÉES et 100% GRATUITES.
 */

const STORAGE_MODLY_URL_KEY = 'aria_modly_server_url';
export const DEFAULT_MODLY_URL = 'http://localhost:8000';

export function getModlyServerUrl(): string {
	if (typeof window !== 'undefined') {
		const stored = localStorage.getItem(STORAGE_MODLY_URL_KEY);
		if (stored && stored.trim()) {
			return stored.trim().replace(/\/+$/, '');
		}
	}
	return DEFAULT_MODLY_URL;
}

export function setModlyServerUrl(url: string): void {
	if (typeof window !== 'undefined') {
		if (url && url.trim()) {
			localStorage.setItem(STORAGE_MODLY_URL_KEY, url.trim().replace(/\/+$/, ''));
		} else {
			localStorage.removeItem(STORAGE_MODLY_URL_KEY);
		}
	}
}

/**
 * Vérifie si le serveur Modly est joignable
 */
export async function checkModlyHealth(serverUrl?: string): Promise<{ ok: boolean; message: string; version?: string }> {
	const base = (serverUrl || getModlyServerUrl()).replace(/\/+$/, '');
	try {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 4000);

		const res = await fetch(`${base}/status`, {
			signal: controller.signal
		});
		clearTimeout(timeoutId);

		if (res.ok) {
			const data = await res.json();
			return {
				ok: true,
				message: 'Serveur Modly connecté et opérationnel !',
				version: data.version || '0.4.3'
			};
		}
		return {
			ok: false,
			message: `Réponse inattendue de Modly (${res.status})`
		};
	} catch (err: any) {
		if (err.name === 'AbortError') {
			return { ok: false, message: 'Délai d\'attente dépassé (timeout 4s).' };
		}
		return {
			ok: false,
			message: 'Impossible de joindre le serveur Modly. Vérifiez que `uvicorn main:app` ou l\'app Modly est lancée.'
		};
	}
}

/**
 * Génère un modèle 3D via Modly (Image to 3D)
 */
export async function generate3DWithModly(
	imageBlob: Blob | File,
	options: {
		modelId?: string;
		remesh?: 'quad' | 'triangle' | 'none';
		enableTexture?: boolean;
		textureResolution?: number;
		serverUrl?: string;
		onProgress?: (step: string, percent: number) => void;
	} = {}
): Promise<{ glbUrl: string; jobId: string }> {
	const base = (options.serverUrl || getModlyServerUrl()).replace(/\/+$/, '');
	const onProgress = options.onProgress;

	onProgress?.('Envoi de l\'image au serveur Modly GPU...', 10);

	const formData = new FormData();
	if (imageBlob instanceof File) {
		formData.append('image', imageBlob);
	} else {
		formData.append('image', imageBlob, 'input_mesh_source.png');
	}

	formData.append('model_id', options.modelId || 'sf3d');
	formData.append('collection', 'AriaWorkspace');
	formData.append('remesh', options.remesh || 'quad');
	formData.append('enable_texture', (options.enableTexture ?? true).toString());
	formData.append('texture_resolution', (options.textureResolution || 1024).toString());
	formData.append('params', '{}');

	const res = await fetch(`${base}/generate/from-image`, {
		method: 'POST',
		body: formData
	});

	if (!res.ok) {
		const errTxt = await res.text();
		throw new Error(`Erreur Modly (${res.status}): ${errTxt}`);
	}

	const initData = await res.json();
	const jobId = initData.job_id;

	if (!jobId) {
		throw new Error('Identifiant de job manquant dans la réponse Modly.');
	}

	onProgress?.('Calcul neuronal 3D en cours sur votre carte graphique GPU...', 20);

	// Polling de l'état du job
	const maxAttempts = 120; // 6 minutes max
	let attempts = 0;

	while (attempts < maxAttempts) {
		attempts++;
		await new Promise((r) => setTimeout(r, 2500));

		const statusRes = await fetch(`${base}/generate/status/${jobId}`);
		if (!statusRes.ok) {
			continue;
		}

		const statusData = await statusRes.json();
		const currentStatus = statusData.status;
		const progress = statusData.progress || Math.min(20 + Math.round((attempts / 40) * 75), 95);
		const step = statusData.step || 'Génération du maillage 3D...';

		onProgress?.(`Modly GPU: ${step} (${progress}%)`, progress);

		if (currentStatus === 'done') {
			const outputRel = statusData.output_url;
			if (!outputRel) {
				throw new Error('Le job Modly est terminé mais aucun output_url n\'a été renvoyé.');
			}
			const fullGlbUrl = outputRel.startsWith('http') ? outputRel : `${base}${outputRel}`;
			onProgress?.('Modèle 3D prêt ! Chargement...', 100);
			return { glbUrl: fullGlbUrl, jobId };
		}

		if (currentStatus === 'error' || currentStatus === 'cancelled') {
			throw new Error(`Échec de la génération Modly: ${statusData.error || 'Erreur GPU interne'}`);
		}
	}

	throw new Error('Délai d\'attente dépassé (timeout 6 minutes) pour la génération Modly.');
}
