import { OPENAI_API_BASE_URL, WEBUI_API_BASE_URL, WEBUI_BASE_URL } from '$lib/constants';

export const getErrorMessage = (err: any, fallback = 'Server connection failed') => {
	const detail = err?.detail;
	if (typeof detail === 'string') return detail;

	return (
		detail?.error?.message ??
		detail?.message ??
		err?.error?.message ??
		err?.message ??
		(typeof err === 'string' ? err : fallback)
	);
};

export const getOpenAIConfig = async (token: string = '') => {
	let error = null;

	const res = await fetch(`${OPENAI_API_BASE_URL}/config`, {
		method: 'GET',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			...(token && { authorization: `Bearer ${token}` })
		}
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.catch((err) => {
			console.error(err);
			error = getErrorMessage(err);
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

type OpenAIConfig = {
	ENABLE_OPENAI_API: boolean;
	OPENAI_API_BASE_URLS: string[];
	OPENAI_API_KEYS: string[];
	OPENAI_API_CONFIGS: object;
};

export const updateOpenAIConfig = async (token: string = '', config: OpenAIConfig) => {
	let error = null;

	const res = await fetch(`${OPENAI_API_BASE_URL}/config/update`, {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			...(token && { authorization: `Bearer ${token}` })
		},
		body: JSON.stringify({
			...config
		})
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.catch((err) => {
			console.error(err);
			error = getErrorMessage(err);
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const getOpenAIModelsDirect = async (url: string, key: string) => {
	let error = null;

	const res = await fetch(`${url}/models`, {
		method: 'GET',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			...(key && { authorization: `Bearer ${key}` })
		}
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.catch((err) => {
			error = `OpenAI: ${err?.error?.message ?? 'Network Problem'}`;
			return [];
		});

	if (error) {
		throw error;
	}

	return res;
};

export const getOpenAIModels = async (token: string, urlIdx?: number) => {
	let error = null;

	const res = await fetch(
		`${OPENAI_API_BASE_URL}/models${typeof urlIdx === 'number' ? `/${urlIdx}` : ''}`,
		{
			method: 'GET',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
				...(token && { authorization: `Bearer ${token}` })
			}
		}
	)
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.catch((err) => {
			error = `OpenAI: ${err?.error?.message ?? 'Network Problem'}`;
			return [];
		});

	if (error) {
		throw error;
	}

	return res;
};

export const getProviderModelCatalog = async (token: string, urlIdx: number) => {
	let error = null;

	const res = await fetch(`${OPENAI_API_BASE_URL}/models/${urlIdx}/catalog`, {
		method: 'GET',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			...(token && { authorization: `Bearer ${token}` })
		}
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.catch((err) => {
			error = getErrorMessage(err);
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const downloadProviderModel = async (
	token: string,
	urlIdx: number,
	model: string,
	signal?: AbortSignal
) => {
	let error = null;

	const res = await fetch(`${OPENAI_API_BASE_URL}/models/${urlIdx}/download`, {
		signal,
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`
		},
		body: JSON.stringify({ model })
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.catch((err) => {
			error = getErrorMessage(err);
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const getProviderModelDownloadStatus = async (
	token: string,
	urlIdx: number,
	jobId: string,
	signal?: AbortSignal
) => {
	let error = null;

	const res = await fetch(
		`${OPENAI_API_BASE_URL}/models/${urlIdx}/download/status/${encodeURIComponent(jobId)}`,
		{
			signal,
			method: 'GET',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			}
		}
	)
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.catch((err) => {
			error = getErrorMessage(err);
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const loadProviderModel = async (token: string, urlIdx: number, model: string) => {
	let error = null;

	const res = await fetch(`${OPENAI_API_BASE_URL}/models/${urlIdx}/load`, {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`
		},
		body: JSON.stringify({ model })
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.catch((err) => {
			error = getErrorMessage(err);
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const unloadProviderModel = async (
	token: string,
	urlIdx: number,
	model: string,
	instanceId?: string
) => {
	let error = null;

	const res = await fetch(`${OPENAI_API_BASE_URL}/models/${urlIdx}/unload`, {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`
		},
		body: JSON.stringify({ model, ...(instanceId ? { instance_id: instanceId } : {}) })
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.catch((err) => {
			error = getErrorMessage(err);
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const deleteProviderModel = async (token: string, urlIdx: number, model: string) => {
	let error = null;

	const res = await fetch(
		`${OPENAI_API_BASE_URL}/models/${urlIdx}?${new URLSearchParams({ model })}`,
		{
			method: 'DELETE',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			}
		}
	)
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.catch((err) => {
			error = getErrorMessage(err);
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

export const verifyOpenAIConnection = async (
	token: string = '',
	connection: Record<string, any> = {},
	direct: boolean = false
) => {
	const { url, key, config } = connection;
	if (!url) {
		throw 'OpenAI: URL is required';
	}

	let error = null;
	let res = null;

	if (direct) {
		res = await fetch(`${url}/models`, {
			method: 'GET',
			headers: {
				Accept: 'application/json',
				Authorization: `Bearer ${key}`,
				'Content-Type': 'application/json'
			}
		})
			.then(async (res) => {
				if (!res.ok) throw await res.json();
				return res.json();
			})
			.catch((err) => {
				error = `OpenAI: ${err?.error?.message ?? 'Network Problem'}`;
				return [];
			});

		if (error) {
			throw error;
		}
	} else {
		res = await fetch(`${OPENAI_API_BASE_URL}/verify`, {
			method: 'POST',
			headers: {
				Accept: 'application/json',
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				url,
				key,
				config
			})
		})
			.then(async (res) => {
				if (!res.ok) throw await res.json();
				return res.json();
			})
			.catch((err) => {
				error = `OpenAI: ${err?.error?.message ?? 'Network Problem'}`;
				return [];
			});

		if (error) {
			throw error;
		}
	}

	return res;
};

export const chatCompletion = async (
	token: string = '',
	body: any,
	url: string = `${WEBUI_BASE_URL}/api`
): Promise<[Response | null, AbortController]> => {
	const controller = new AbortController();
	try {
		const { sendAriaCompletion } = await import('$lib/utils/ariaModels');
		const modelId = body?.model || 'aria-basic';
		const messages = body?.messages || [];
		const stream = body?.stream ?? true;

		const res = await sendAriaCompletion(modelId, messages, { stream });
		return [res, controller];
	} catch (e) {
		console.warn('Direct Aria completion fallback to API url:', e);
		const res = await fetch(`${url}/chat/completions`, {
			signal: controller.signal,
			method: 'POST',
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(body)
		}).catch(() => null);

		return [res, controller];
	}
};

export const generateOpenAIChatCompletion = async (
	token: string = '',
	body: any,
	url: string = `${WEBUI_BASE_URL}/api`
) => {
	try {
		const { sendAriaCompletion } = await import('$lib/utils/ariaModels');
		const modelId = body?.model || 'aria-basic';
		const messages = body?.messages || [];
		const stream = body?.stream ?? false;

		const res = await sendAriaCompletion(modelId, messages, { stream });
		if (res && res.ok) {
			const text = await res.text();
			if (text.startsWith('data:')) {
				const lines = text.split('\n');
				let fullContent = '';
				for (const line of lines) {
					const trimmed = line.trim();
					if (trimmed.startsWith('data:') && !trimmed.includes('[DONE]')) {
						try {
							const jsonStr = trimmed.replace(/^data:\s*/, '');
							const parsed = JSON.parse(jsonStr);
							const delta = parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.message?.content || '';
							fullContent += delta;
						} catch {}
					}
				}
				// Clean thinking / reasoning blocks from response (e.g. <think>...</think> or "Here's a thinking process:")
				fullContent = fullContent
					.replace(/<think>[\s\S]*?<\/think>/gi, '')
					.replace(/Here'?s a thinking process[\s\S]*?(?=(Salut|Bonjour|Hey|1\.|#|\n\n))/gi, '')
					.trim();
				return { choices: [{ message: { content: fullContent } }] };
			} else {
				try {
					const jsonRes = JSON.parse(text);
					if (jsonRes?.choices?.[0]?.message?.content) {
						jsonRes.choices[0].message.content = jsonRes.choices[0].message.content
							.replace(/<think>[\s\S]*?<\/think>/gi, '')
							.replace(/Here'?s a thinking process[\s\S]*?(?=(Salut|Bonjour|Hey|1\.|#|\n\n))/gi, '')
							.trim();
					}
					return jsonRes;
				} catch {
					const cleaned = text
						.replace(/<think>[\s\S]*?<\/think>/gi, '')
						.replace(/Here'?s a thinking process[\s\S]*?(?=(Salut|Bonjour|Hey|1\.|#|\n\n))/gi, '')
						.trim();
					return { choices: [{ message: { content: cleaned } }] };
				}
			}
		}
	} catch (err: any) {
		console.warn('Direct Aria completion fallback:', err);
	}

	return null;
};

export const synthesizeOpenAISpeech = async (
	token: string = '',
	speaker: string = 'alloy',
	text: string = '',
	model: string = 'tts-1'
) => {
	let error = null;

	const res = await fetch(`${OPENAI_API_BASE_URL}/audio/speech`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			model: model,
			input: text,
			voice: speaker
		})
	}).catch((err) => {
		console.error(err);
		error = err;
		return null;
	});

	if (error) {
		throw error;
	}

	return res;
};
