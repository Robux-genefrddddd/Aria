import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

export interface Incident {
	id: string;
	timestamp: number;
	type: 'ai_crash' | 'provider_fail' | 'rate_limit' | 'client_error' | 'network_error';
	title: string;
	message: string;
	details?: string;
	provider?: string;
	model?: string;
}

export interface ProviderHealth {
	name: string;
	status: 'operational' | 'degraded' | 'outage';
	successCount: number;
	errorCount: number;
	lastError?: string;
	lastChecked: number;
}

export interface SystemStatusData {
	totalRequests: number;
	successfulRequests: number;
	failedRequests: number;
	rateLimitCount: number;
	clientBugCount: number;
	providers: Record<string, ProviderHealth>;
	incidents: Incident[];
	lastUpdated: number;
}

const DEFAULT_PROVIDERS: Record<string, ProviderHealth> = {
	Groq: { name: 'Groq Cloud', status: 'operational', successCount: 0, errorCount: 0, lastChecked: Date.now() },
	OpenRouter: { name: 'OpenRouter API', status: 'operational', successCount: 0, errorCount: 0, lastChecked: Date.now() },
	Mistral: { name: 'Mistral AI', status: 'operational', successCount: 0, errorCount: 0, lastChecked: Date.now() },
	Cerebras: { name: 'Cerebras Inference', status: 'operational', successCount: 0, errorCount: 0, lastChecked: Date.now() },
	SiliconFlow: { name: 'SiliconFlow Cloud', status: 'operational', successCount: 0, errorCount: 0, lastChecked: Date.now() },
	HuggingFace: { name: 'HuggingFace Hub', status: 'operational', successCount: 0, errorCount: 0, lastChecked: Date.now() }
};

const DEFAULT_STATE: SystemStatusData = {
	totalRequests: 0,
	successfulRequests: 0,
	failedRequests: 0,
	rateLimitCount: 0,
	clientBugCount: 0,
	providers: { ...DEFAULT_PROVIDERS },
	incidents: [],
	lastUpdated: Date.now()
};

const loadInitialState = (): SystemStatusData => {
	if (!browser) return DEFAULT_STATE;
	try {
		const raw = localStorage.getItem('aria_system_status');
		if (raw) {
			const parsed = JSON.parse(raw);
			return {
				...DEFAULT_STATE,
				...parsed,
				providers: { ...DEFAULT_PROVIDERS, ...(parsed.providers || {}) }
			};
		}
	} catch (e) {}
	return DEFAULT_STATE;
};

export const systemStatusStore = writable<SystemStatusData>(loadInitialState());

// BroadcastChannel pour synchro instantanée inter-onglets
let statusChannel: BroadcastChannel | null = null;
if (browser && typeof BroadcastChannel !== 'undefined') {
	try {
		statusChannel = new BroadcastChannel('aria_system_status_channel');
		statusChannel.onmessage = (event) => {
			if (event?.data) {
				systemStatusStore.set(event.data);
			}
		};
	} catch (e) {}
}

const persistState = (state: SystemStatusData) => {
	if (!browser) return;
	try {
		localStorage.setItem('aria_system_status', JSON.stringify(state));
		if (statusChannel) {
			statusChannel.postMessage(state);
		}
		// Synchronisation optionnelle avec Firebase Realtime Database
		try {
			import('$lib/firebase').then(({ getAuthParam }) => {
				getAuthParam().then((authParam) => {
					// Only attempt write if authenticated
					if (authParam) {
						fetch(`https://vostockfr-3b08c-default-rtdb.firebaseio.com/system_status.json${authParam}`, {
							method: 'PATCH',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({
								totalRequests: state.totalRequests,
								successfulRequests: state.successfulRequests,
								failedRequests: state.failedRequests,
								rateLimitCount: state.rateLimitCount,
								clientBugCount: state.clientBugCount,
								lastUpdated: state.lastUpdated
							})
						}).catch(() => {});
					}
				}).catch(() => {});
			}).catch(() => {});
		} catch (e) {}
	} catch (e) {}
};

/** Score de santé calculé en temps réel (100% à 0%) */
export const healthScore = derived(systemStatusStore, ($s) => {
	const totalIssues = $s.failedRequests * 3 + $s.rateLimitCount * 2 + $s.clientBugCount;
	const totalEvents = $s.totalRequests + $s.clientBugCount;
	if (totalEvents === 0) return 100;
	const penalty = Math.min(100, Math.round((totalIssues / Math.max(1, totalEvents)) * 100));
	return Math.max(0, 100 - penalty);
});

/** Enregistre un succès d'appel IA en temps réel */
export const recordAiSuccess = (providerName: string, modelName?: string) => {
	systemStatusStore.update((state) => {
		const provKey = Object.keys(state.providers).find((k) =>
			providerName.toLowerCase().includes(k.toLowerCase())
		) || providerName;

		const currentProv = state.providers[provKey] || {
			name: providerName,
			status: 'operational',
			successCount: 0,
			errorCount: 0,
			lastChecked: Date.now()
		};

		const updatedProviders = {
			...state.providers,
			[provKey]: {
				...currentProv,
				successCount: currentProv.successCount + 1,
				status: 'operational' as const,
				lastChecked: Date.now()
			}
		};

		const newState: SystemStatusData = {
			...state,
			totalRequests: state.totalRequests + 1,
			successfulRequests: state.successfulRequests + 1,
			providers: updatedProviders,
			lastUpdated: Date.now()
		};

		persistState(newState);
		return newState;
	});
};

/** Enregistre une erreur / crash de fournisseur IA */
export const recordAiError = (
	providerName: string,
	modelName: string | undefined,
	errorMessage: string,
	isRateLimit = false
) => {
	systemStatusStore.update((state) => {
		const provKey = Object.keys(state.providers).find((k) =>
			providerName.toLowerCase().includes(k.toLowerCase())
		) || providerName;

		const currentProv = state.providers[provKey] || {
			name: providerName,
			status: 'degraded',
			successCount: 0,
			errorCount: 0,
			lastChecked: Date.now()
		};

		const newErrorCount = currentProv.errorCount + 1;
		const status = newErrorCount >= 3 ? ('outage' as const) : ('degraded' as const);

		const updatedProviders = {
			...state.providers,
			[provKey]: {
				...currentProv,
				errorCount: newErrorCount,
				status: status,
				lastError: errorMessage,
				lastChecked: Date.now()
			}
		};

		const incident: Incident = {
			id: `inc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
			timestamp: Date.now(),
			type: isRateLimit ? 'rate_limit' : 'provider_fail',
			title: isRateLimit ? `Quota dépassé (${providerName})` : `Échec de requête (${providerName})`,
			message: errorMessage,
			provider: providerName,
			model: modelName
		};

		const newState: SystemStatusData = {
			...state,
			totalRequests: state.totalRequests + 1,
			failedRequests: isRateLimit ? state.failedRequests : state.failedRequests + 1,
			rateLimitCount: isRateLimit ? state.rateLimitCount + 1 : state.rateLimitCount,
			providers: updatedProviders,
			incidents: [incident, ...state.incidents.slice(0, 49)],
			lastUpdated: Date.now()
		};

		persistState(newState);
		return newState;
	});
};

/** Enregistre un crash total du modèle IA (tous les fallbacks ont échoué) */
export const recordAiCrash = (modelId: string, errorDetail?: string) => {
	systemStatusStore.update((state) => {
		const incident: Incident = {
			id: `crash-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
			timestamp: Date.now(),
			type: 'ai_crash',
			title: `Crash du modèle IA : ${modelId}`,
			message: errorDetail || 'Tous les fournisseurs et fallbacks ont échoué.',
			model: modelId
		};

		const newState: SystemStatusData = {
			...state,
			failedRequests: state.failedRequests + 1,
			incidents: [incident, ...state.incidents.slice(0, 49)],
			lastUpdated: Date.now()
		};

		persistState(newState);
		return newState;
	});
};

/** Enregistre un bug frontend ou erreur d'exécution utilisateur */
export const recordClientBug = (errorMsg: string, source?: string) => {
	systemStatusStore.update((state) => {
		const incident: Incident = {
			id: `bug-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
			timestamp: Date.now(),
			type: 'client_error',
			title: 'Bug d’exécution interface / script',
			message: errorMsg,
			details: source
		};

		const newState: SystemStatusData = {
			...state,
			clientBugCount: state.clientBugCount + 1,
			incidents: [incident, ...state.incidents.slice(0, 49)],
			lastUpdated: Date.now()
		};

		persistState(newState);
		return newState;
	});
};

/** Écouteur global automatique d'erreurs en production */
if (browser) {
	window.addEventListener('error', (event) => {
		if (event?.message && !event.message.includes('ResizeObserver')) {
			recordClientBug(event.message, `${event.filename || ''}:${event.lineno || ''}`);
		}
	});

	window.addEventListener('unhandledrejection', (event) => {
		const reason = event.reason;
		const msg = typeof reason === 'string' ? reason : (reason?.message || 'Promesse non gérée');
		if (msg && !msg.includes('AbortError')) {
			recordClientBug(msg, 'unhandledrejection');
		}
	});
}
