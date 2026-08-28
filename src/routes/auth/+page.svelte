<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { onMount, getContext } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	import { getBackendConfig } from '$lib/apis';
	import {
		ldapUserSignIn,
		getSessionUser,
		updateUserTimezone
	} from '$lib/apis/auths';

	import {
		signInWithEmail as firebaseSignIn,
		signUpWithEmail as firebaseSignUp,
		signInWithGoogle as firebaseGoogleSignIn,
		signInWithGithub as firebaseGithubSignIn,
		createAriaSessionFromFirebaseUser,
		saveUserToFirebaseDatabase
	} from '$lib/firebase';
	import { updateProfile } from 'firebase/auth';

	import { WEBUI_API_BASE_URL, WEBUI_BASE_URL } from '$lib/constants';
	import { WEBUI_NAME, config, user, socket } from '$lib/stores';
	import { getUserTimezone } from '$lib/utils';

	import Spinner from '$lib/components/common/Spinner.svelte';
	import SensitiveInput from '$lib/components/common/SensitiveInput.svelte';

	const i18n = getContext('i18n');

	let loaded = false;
	let mode: 'signin' | 'signup' | 'ldap' = 'signin';

	let name = '';
	let email = '';
	let password = '';
	let confirmPassword = '';
	let ldapUsername = '';
	let submitting = false;

	const setSessionUser = async (sessionUser: any, redirectPath: string | null = null) => {
		if (sessionUser) {
			toast.success($i18n.t(`Connexion réussie.`));
			if (sessionUser.token) {
				localStorage.token = sessionUser.token;
				localStorage.setItem('token', sessionUser.token);
			}
			localStorage.setItem('aria_user', JSON.stringify(sessionUser));
			document.cookie = `token=${sessionUser.token}; path=/; max-age=31536000; SameSite=Lax`;

			$socket?.emit('user-join', { auth: { token: sessionUser.token } });
			await user.set(sessionUser);
			await config.set(await getBackendConfig());

			// Update user timezone
			const timezone = getUserTimezone();
			if (sessionUser.token && timezone) {
				updateUserTimezone(sessionUser.token, timezone);
			}

			if (!redirectPath) {
				redirectPath = $page.url.searchParams.get('redirect') || '/';
			}

			goto(redirectPath);
			localStorage.removeItem('redirectPath');
		}
	};

	import { executeRecaptcha } from '$lib/utils/recaptcha';

	const signInHandler = async () => {
		try {
			await executeRecaptcha('LOGIN');
			const userCredential = await firebaseSignIn(email, password);
			const sessionUser = await createAriaSessionFromFirebaseUser(userCredential.user);
			await setSessionUser(sessionUser);
		} catch (error: any) {
			console.error('Firebase sign-in error:', error);
			let msg = error.message || `${error}`;
			if (
				error.code === 'auth/invalid-credential' ||
				error.code === 'auth/wrong-password' ||
				error.code === 'auth/user-not-found'
			) {
				msg = $i18n.t('Identifiants de connexion incorrects.');
			} else if (error.code === 'auth/too-many-requests') {
				msg = $i18n.t('Trop de tentatives. Veuillez réessayer plus tard.');
			} else if (error.code === 'auth/invalid-email') {
				msg = $i18n.t('Adresse email invalide.');
			}
			toast.error(msg);
		}
	};

	const signUpHandler = async () => {
		if ($config?.features?.enable_signup_password_confirmation) {
			if (password !== confirmPassword) {
				toast.error($i18n.t('Les mots de passe ne correspondent pas.'));
				return;
			}
		}

		try {
			const userCredential = await firebaseSignUp(email, password);
			const displayName = name || email.split('@')[0];

			try {
				await updateProfile(userCredential.user, { displayName });
			} catch {}

			await saveUserToFirebaseDatabase(userCredential.user.uid, {
				email: userCredential.user.email || email,
				name: displayName,
				role: 'user'
			});

			const sessionUser = await createAriaSessionFromFirebaseUser(userCredential.user, displayName);
			await setSessionUser(sessionUser);
		} catch (error: any) {
			console.error('Firebase sign-up error:', error);
			let msg = error.message || `${error}`;
			if (error.code === 'auth/email-already-in-use') {
				msg = $i18n.t('Cette adresse email est déjà enregistrée.');
			} else if (error.code === 'auth/weak-password') {
				msg = $i18n.t('Le mot de passe doit comporter au moins 6 caractères.');
			} else if (error.code === 'auth/invalid-email') {
				msg = $i18n.t('Adresse email invalide.');
			}
			toast.error(msg);
		}
	};

	const googleSignInHandler = async () => {
		try {
			submitting = true;
			const userCredential = await firebaseGoogleSignIn();
			const sessionUser = await createAriaSessionFromFirebaseUser(userCredential.user);
			await setSessionUser(sessionUser);
		} catch (error: any) {
			if (error.code !== 'auth/popup-closed-by-user') {
				toast.error(error.message || `${error}`);
			}
		} finally {
			submitting = false;
		}
	};

	const githubSignInHandler = async () => {
		try {
			submitting = true;
			const userCredential = await firebaseGithubSignIn();
			const sessionUser = await createAriaSessionFromFirebaseUser(userCredential.user);
			await setSessionUser(sessionUser);
		} catch (error: any) {
			if (error.code !== 'auth/popup-closed-by-user') {
				toast.error(error.message || `${error}`);
			}
		} finally {
			submitting = false;
		}
	};

	const ldapSignInHandler = async () => {
		const sessionUser = await ldapUserSignIn(ldapUsername, password).catch((error) => {
			toast.error(`${error}`);
			return null;
		});
		await setSessionUser(sessionUser);
	};

	const submitHandler = async () => {
		if (submitting) return;

		submitting = true;
		try {
			if (mode === 'ldap') {
				await ldapSignInHandler();
			} else if (mode === 'signin') {
				await signInHandler();
			} else {
				await signUpHandler();
			}
		} finally {
			submitting = false;
		}
	};

	onMount(async () => {
		const redirectPath = $page.url.searchParams.get('redirect') || '/';
		if ($user || localStorage.token) {
			goto(redirectPath);
			return;
		}

		if ($config?.features?.enable_ldap) {
			mode = 'ldap';
		}

		const error = $page.url.searchParams.get('error');
		if (error) {
			toast.error(error);
		}

		loaded = true;
	});
</script>

<svelte:head>
	<title>Connexion — {$WEBUI_NAME}</title>
</svelte:head>

<div
	class="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 relative bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 select-none font-sans"
	id="auth-page"
>
	{#if loaded}
		<div class="w-full max-w-[380px] z-10 my-auto">
			<!-- Main Auth Card Minimaliste Noir / Blanc -->
			<div
				id="auth-login-card"
				class="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 sm:p-7 shadow-xs transition-all"
			>
				<!-- Brand Header Minimaliste -->
				<div class="flex flex-col items-center text-center mb-6">
					<h1 class="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
						Aria
					</h1>
					<p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
						{#if mode === 'signup'}
							{$i18n.t('Créez un compte pour continuer')}
						{:else if mode === 'ldap'}
							{$i18n.t('Identifiants LDAP')}
						{:else}
							{$i18n.t('Connectez-vous pour continuer')}
						{/if}
					</p>
				</div>

				<!-- Mode Switcher Tabs (Se connecter / S'inscrire) -->
				{#if mode !== 'ldap'}
					<div
						class="grid grid-cols-2 p-1 mb-5 rounded-xl bg-gray-100 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/50 text-xs font-medium"
					>
						<button
							type="button"
							class="py-1.5 rounded-lg transition-all text-center {mode === 'signin'
								? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-xs font-semibold'
								: 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}"
							on:click={() => {
								mode = 'signin';
							}}
						>
							{$i18n.t('Se connecter')}
						</button>

						<button
							type="button"
							class="py-1.5 rounded-lg transition-all text-center {mode === 'signup'
								? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-xs font-semibold'
								: 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}"
							on:click={() => {
								mode = 'signup';
							}}
						>
							{$i18n.t("S'inscrire")}
						</button>
					</div>
				{/if}

				<!-- Auth Form -->
				<form
					class="flex flex-col space-y-3.5"
					on:submit={(e) => {
						e.preventDefault();
						submitHandler();
					}}
				>
					{#if mode === 'signup'}
						<div class="space-y-1.5 text-left">
							<label for="name" class="text-xs font-medium text-gray-700 dark:text-gray-300">
								{$i18n.t('Nom complet')}
							</label>
							<div class="relative">
								<input
									bind:value={name}
									type="text"
									id="name"
									class="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-gray-900 dark:focus:border-white focus:ring-1 focus:ring-gray-900 dark:focus:ring-white transition"
									autocomplete="name"
									placeholder={$i18n.t('Votre nom')}
									required
								/>
							</div>
						</div>

						<div class="space-y-1.5 text-left">
							<label for="email" class="text-xs font-medium text-gray-700 dark:text-gray-300">
								{$i18n.t('Adresse email')}
							</label>
							<div class="relative">
								<input
									bind:value={email}
									type="email"
									id="email"
									name="email"
									class="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-gray-900 dark:focus:border-white focus:ring-1 focus:ring-gray-900 dark:focus:ring-white transition"
									autocomplete="email"
									placeholder={$i18n.t('nom@exemple.com')}
									required
								/>
							</div>
						</div>

						<div class="space-y-1.5 text-left">
							<label for="password" class="text-xs font-medium text-gray-700 dark:text-gray-300">
								{$i18n.t('Mot de passe')}
							</label>
							<div class="relative">
								<SensitiveInput
									bind:value={password}
									type="password"
									id="password"
									name="password"
									class="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-gray-900 dark:focus:border-white focus:ring-1 focus:ring-gray-900 dark:focus:ring-white transition"
									placeholder={$i18n.t('••••••••')}
									autocomplete="new-password"
									screenReader={true}
									required
									aria-required="true"
								/>
							</div>
						</div>

						{#if $config?.features?.enable_signup_password_confirmation}
							<div class="space-y-1.5 text-left">
								<label
									for="confirm-password"
									class="text-xs font-medium text-gray-700 dark:text-gray-300"
								>
									{$i18n.t('Confirmer le mot de passe')}
								</label>
								<div class="relative">
									<SensitiveInput
										bind:value={confirmPassword}
										type="password"
										id="confirm-password"
										name="confirm-password"
										class="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-gray-900 dark:focus:border-white focus:ring-1 focus:ring-gray-900 dark:focus:ring-white transition"
										placeholder={$i18n.t('••••••••')}
										autocomplete="new-password"
										required
									/>
								</div>
							</div>
						{/if}
					{:else if mode === 'ldap'}
						<div class="space-y-1.5 text-left">
							<label for="username" class="text-xs font-medium text-gray-700 dark:text-gray-300">
								{$i18n.t("Nom d'utilisateur")}
							</label>
							<div class="relative">
								<input
									bind:value={ldapUsername}
									type="text"
									id="username"
									name="username"
									class="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-gray-900 dark:focus:border-white focus:ring-1 focus:ring-gray-900 dark:focus:ring-white transition"
									autocomplete="username"
									placeholder={$i18n.t("Nom d'utilisateur")}
									required
								/>
							</div>
						</div>

						<div class="space-y-1.5 text-left">
							<label for="password" class="text-xs font-medium text-gray-700 dark:text-gray-300">
								{$i18n.t('Mot de passe')}
							</label>
							<div class="relative">
								<SensitiveInput
									bind:value={password}
									type="password"
									id="password"
									name="password"
									class="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-gray-900 dark:focus:border-white focus:ring-1 focus:ring-gray-900 dark:focus:ring-white transition"
									placeholder={$i18n.t('••••••••')}
									autocomplete="current-password"
									screenReader={true}
									required
									aria-required="true"
								/>
							</div>
						</div>
					{:else}
						<!-- Mode Sign In -->
						<div class="space-y-1.5 text-left">
							<label for="email" class="text-xs font-medium text-gray-700 dark:text-gray-300">
								{$i18n.t('Adresse email')}
							</label>
							<div class="relative">
								<input
									bind:value={email}
									type="email"
									id="email"
									name="email"
									class="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-gray-900 dark:focus:border-white focus:ring-1 focus:ring-gray-900 dark:focus:ring-white transition"
									autocomplete="email"
									placeholder={$i18n.t('nom@exemple.com')}
									required
								/>
							</div>
						</div>

						<div class="space-y-1.5 text-left">
							<label for="password" class="text-xs font-medium text-gray-700 dark:text-gray-300">
								{$i18n.t('Mot de passe')}
							</label>
							<div class="relative">
								<SensitiveInput
									bind:value={password}
									type="password"
									id="password"
									name="password"
									class="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-gray-900 dark:focus:border-white focus:ring-1 focus:ring-gray-900 dark:focus:ring-white transition"
									placeholder={$i18n.t('••••••••')}
									autocomplete="current-password"
									screenReader={true}
									required
									aria-required="true"
								/>
							</div>
						</div>
					{/if}

					<!-- Submit Button Minimaliste Noir / Blanc -->
					<button
						class="w-full mt-2 py-2 px-4 rounded-xl font-medium text-xs transition-all shadow-xs bg-gray-900 hover:bg-black text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
						type="submit"
						disabled={submitting}
					>
						{#if submitting}
							<Spinner className="size-4" />
							<span>{$i18n.t('Connexion...')}</span>
						{:else if mode === 'signup'}
							<span>{$i18n.t("S'inscrire")}</span>
						{:else}
							<span>{$i18n.t('Se connecter')}</span>
						{/if}
					</button>
				</form>

				<!-- Social Auth Providers (Google & GitHub) -->
				{#if mode !== 'ldap'}
					<div class="relative my-4">
						<div class="absolute inset-0 flex items-center">
							<div class="w-full border-t border-gray-200 dark:border-gray-800"></div>
						</div>
						<div class="relative flex justify-center text-[10px] uppercase">
							<span class="bg-white dark:bg-gray-900 px-2 text-gray-400 dark:text-gray-500">
								{$i18n.t('ou continuer avec')}
							</span>
						</div>
					</div>

					<div class="grid grid-cols-2 gap-2">
						<!-- Google Login Button -->
						<button
							type="button"
							class="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-gray-200 dark:border-gray-700/80 bg-gray-50/50 hover:bg-gray-100 dark:bg-gray-800/40 dark:hover:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-200 transition active:scale-95 cursor-pointer disabled:opacity-50"
							on:click={googleSignInHandler}
							disabled={submitting}
						>
							<svg class="size-3.5" viewBox="0 0 24 24">
								<path
									fill="#4285F4"
									d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
								/>
								<path
									fill="#34A853"
									d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
								/>
								<path
									fill="#FBBC05"
									d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
								/>
								<path
									fill="#EA4335"
									d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
								/>
							</svg>
							<span>Google</span>
						</button>

						<!-- GitHub Login Button -->
						<button
							type="button"
							class="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-gray-200 dark:border-gray-700/80 bg-gray-50/50 hover:bg-gray-100 dark:bg-gray-800/40 dark:hover:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-200 transition active:scale-95 cursor-pointer disabled:opacity-50"
							on:click={githubSignInHandler}
							disabled={submitting}
						>
							<svg class="size-3.5 fill-current" viewBox="0 0 24 24">
								<path
									d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"
								/>
							</svg>
							<span>GitHub</span>
						</button>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
