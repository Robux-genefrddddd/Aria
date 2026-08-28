const RECAPTCHA_SITE_KEY = '6LdTPJ0tAAAAABZ3JKjqxC7e08_X0lt-Mn9BKV5Y';

/**
 * Exécute reCAPTCHA Enterprise avec gestion de secours gratuite en cas de blocage ou d'échec
 */
export const executeRecaptcha = async (action: string = 'PAGE_LOAD'): Promise<string> => {
	if (typeof window === 'undefined') return 'fallback-token';

	return new Promise((resolve) => {
		try {
			const grecaptcha = (window as any).grecaptcha;
			if (grecaptcha && grecaptcha.enterprise) {
				grecaptcha.enterprise.ready(async () => {
					try {
						const token = await grecaptcha.enterprise.execute(RECAPTCHA_SITE_KEY, { action });
						resolve(token || 'fallback-token');
					} catch (err) {
						console.warn('reCAPTCHA execution error, fallback active:', err);
						resolve('fallback-token');
					}
				});
			} else {
				// Fallback gratuit si reCAPTCHA est bloqué (AdBlockers, etc.)
				resolve('fallback-token');
			}
		} catch (e) {
			console.warn('reCAPTCHA error, fallback active:', e);
			resolve('fallback-token');
		}
	});
};
