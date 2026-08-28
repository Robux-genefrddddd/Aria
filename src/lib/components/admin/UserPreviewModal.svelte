<script lang="ts">
	import { getContext } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { getUserPreview } from '$lib/apis/users';
	import { getAuthParam } from '$lib/firebase';
	import Modal from '$lib/components/common/Modal.svelte';
	import Spinner from '$lib/components/common/Spinner.svelte';
	import XMark from '$lib/components/icons/XMark.svelte';

	const i18n = getContext('i18n');

	export let show = false;
	export let userId: string = '';
	export let userName: string = '';

	let loading = true;
	let preview: any = null;
	let error: string = '';

	$: if (show && userId) {
		loadPreview();
	}

	const loadPreview = async () => {
		loading = true;
		error = '';
		try {
			// Fetch real data from Firebase Realtime Database
			let fbUser: any = null;
			try {
				const authParam = await getAuthParam();
				const fbRes = await fetch(
					`https://vostockfr-3b08c-default-rtdb.firebaseio.com/users/${userId}.json${authParam}`
				);
				if (fbRes.ok) {
					fbUser = await fbRes.json();
				}
			} catch {}

			// Real token counts (0 by default)
			const totalTokens = fbUser?.tokens?.total ?? fbUser?.stats?.total_tokens ?? 0;
			const promptTokens = fbUser?.tokens?.input ?? fbUser?.stats?.input_tokens ?? (totalTokens > 0 ? Math.round(totalTokens * 0.65) : 0);
			const completionTokens = fbUser?.tokens?.output ?? fbUser?.stats?.output_tokens ?? (totalTokens > 0 ? Math.round(totalTokens * 0.35) : 0);

			customTokenLimit = fbUser?.token_limit ?? 50000;

			// Real notes
			let notesList = [];
			if (fbUser?.notes && Array.isArray(fbUser.notes)) {
				notesList = fbUser.notes;
			} else if (fbUser?.notes && typeof fbUser.notes === 'object') {
				notesList = Object.values(fbUser.notes);
			}

			// Real searches
			let searchesList = [];
			if (fbUser?.searches && Array.isArray(fbUser.searches)) {
				searchesList = fbUser.searches;
			} else if (fbUser?.searches && typeof fbUser.searches === 'object') {
				searchesList = Object.values(fbUser.searches);
			}

			preview = {
				id: userId,
				name: fbUser?.name || userName || 'Utilisateur',
				email:
					fbUser?.email ||
					(userName ? `${userName.toLowerCase()}@aria.local` : 'Non renseigné'),
				role:
					fbUser?.role ||
					(userId === 'QH8wKG8nWZVtUQEy2pppuBuNZgC3' ? 'owner' : 'user'),
				created_at: fbUser?.created_at || fbUser?.createdAt || null,
				last_active_at: fbUser?.updatedAt || fbUser?.last_active_at || null,
				profile_image_url: fbUser?.profile_image_url || '/User.avif',
				tokens: {
					total: totalTokens,
					input: promptTokens,
					output: completionTokens
				},
				token_limit: fbUser?.token_limit ?? 50000,
				notes: notesList,
				searches: searchesList,
				models: [
					{ id: 'aria-basic', name: 'Aria Basic', access: true },
					{ id: 'aria-reflection', name: 'Aria Réflexion', access: true },
					{
						id: 'aria-plus',
						name: 'Aria Plus',
						access: fbUser?.role === 'owner' || fbUser?.role === 'admin' || fbUser?.role === 'beta_tester' || fbUser?.role === 'beta-tester'
					},
					{
						id: 'aria-code',
						name: 'Aria Code',
						access: fbUser?.role === 'owner' || fbUser?.role === 'admin' || fbUser?.role === 'beta_tester' || fbUser?.role === 'beta-tester'
					}
				]
			};
		} catch (err: any) {
			error = err.message || 'Erreur de chargement';
		} finally {
			loading = false;
		}
	};

	let notifMessage = '';
	let notifTitle = 'Message de l\'administration';
	let sendingNotif = false;
	let customTokenLimit = 50000;
	let savingLimit = false;

	const sendNotificationToUser = async () => {
		if (!notifMessage.trim() || !userId) return;
		sendingNotif = true;
		try {
			const authParam = await getAuthParam();
			const res = await fetch(
				`https://vostockfr-3b08c-default-rtdb.firebaseio.com/users/${userId}/notification.json${authParam}`,
				{
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						id: 'notif-' + Date.now(),
						title: notifTitle || 'Message de l\'administration',
						message: notifMessage.trim(),
						created_at: Date.now()
					})
				}
			);
			if (res.ok) {
				toast.success('Notification envoyée avec succès');
				notifMessage = '';
			} else {
				toast.error('Erreur lors de l\'envoi');
			}
		} catch (e) {
			toast.error(`${e}`);
		} finally {
			sendingNotif = false;
		}
	};

	const saveUserTokenLimit = async () => {
		if (!userId) return;
		savingLimit = true;
		try {
			const authParam = await getAuthParam();
			const limitNum = Number(customTokenLimit) || 1300;
			await Promise.all([
				fetch(
					`https://vostockfr-3b08c-default-rtdb.firebaseio.com/users/${userId}/token_limit.json${authParam}`,
					{
						method: 'PUT',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify(limitNum)
					}
				),
				fetch(
					`https://vostockfr-3b08c-default-rtdb.firebaseio.com/users/${userId}.json${authParam}`,
					{
						method: 'PATCH',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ token_limit: limitNum, updatedAt: Date.now() })
					}
				)
			]);
			if (preview) {
				preview.token_limit = limitNum;
			}
			toast.success('Limite de tokens enregistrée avec succès !');
		} catch (e) {
			toast.error(`${e}`);
		} finally {
			savingLimit = false;
		}
	};

	const formatNumber = (num: number) => (num ? num.toLocaleString('fr-FR') : '0');
	const formatDate = (ts: any) => {
		if (!ts) return 'Récemment';
		const d = new Date(typeof ts === 'number' && ts < 10000000000 ? ts * 1000 : ts);
		return isNaN(d.getTime())
			? 'Récemment'
			: d.toLocaleDateString('fr-FR', {
					day: '2-digit',
					month: 'short',
					year: 'numeric',
					hour: '2-digit',
					minute: '2-digit'
			  });
	};
</script>

<Modal size="md" bind:show>
	<div class="p-2 font-sans text-gray-900 dark:text-gray-100">
		<!-- Header Flat -->
		<div class="flex justify-between items-center px-4 pt-3 pb-3 border-b border-gray-100 dark:border-gray-800">
			<div class="flex items-center gap-3">
				<img
					referrerpolicy="no-referrer"
					src={preview?.profile_image_url || '/User.avif'}
					class="size-9 rounded-full object-cover border border-gray-200 dark:border-gray-700"
					alt=""
					on:error={(e) => {
						e.currentTarget.src = '/User.avif';
					}}
				/>
				<div>
					<div class="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
						<span>{preview?.name || userName || 'Utilisateur'}</span>
						<span class="text-xs font-normal text-gray-500 dark:text-gray-400 capitalize">
							• {preview?.role === 'admin' ? 'Admin' : (preview?.role === 'beta_tester' || preview?.role === 'beta-tester' ? 'Bêta-Testeur' : (preview?.role === 'banned' ? 'Banni' : 'Utilisateur'))}
						</span>
					</div>
					<div class="text-xs text-gray-500 dark:text-gray-400 font-mono">
						{preview?.email}
					</div>
				</div>
			</div>

			<button
				class="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-500 hover:text-gray-900 dark:hover:text-white"
				on:click={() => {
					show = false;
				}}
			>
				<XMark className="size-4" />
			</button>
		</div>

		<!-- Single Frame Flat Body (No background boxes) -->
		<div class="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
			{#if loading}
				<div class="flex justify-center items-center py-12">
					<Spinner className="size-5" />
				</div>
			{:else if error}
				<div class="text-rose-500 text-xs text-center py-4">{error}</div>
			{:else if preview}
				<!-- 1. Identité & Compte Flat -->
				<div class="space-y-1.5 text-xs pb-3 border-b border-gray-100 dark:border-gray-800/80">
					<div class="font-semibold text-gray-900 dark:text-white mb-2">Identité & Compte</div>
					<div class="grid grid-cols-2 gap-x-4 gap-y-1.5 text-gray-600 dark:text-gray-300">
						<div>
							<span class="text-gray-400 dark:text-gray-500">UID :</span>
							<span class="font-mono text-[11px] ml-1 text-gray-900 dark:text-gray-100">{preview.id}</span>
						</div>
						<div>
							<span class="text-gray-400 dark:text-gray-500">Email :</span>
							<span class="font-mono text-[11px] ml-1 text-gray-900 dark:text-gray-100">{preview.email}</span>
						</div>
						<div>
							<span class="text-gray-400 dark:text-gray-500">Inscription :</span>
							<span class="ml-1 text-gray-900 dark:text-gray-100">{formatDate(preview.created_at)}</span>
						</div>
						<div>
							<span class="text-gray-400 dark:text-gray-500">Dernière activité :</span>
							<span class="ml-1 text-gray-900 dark:text-gray-100">{formatDate(preview.last_active_at)}</span>
						</div>
					</div>
				</div>

				<!-- 2. Consommation de Tokens Flat -->
				<div class="space-y-2 text-xs pb-3 border-b border-gray-100 dark:border-gray-800/80">
					<div class="flex justify-between items-center">
						<span class="font-semibold text-gray-900 dark:text-white">Consommation de Tokens</span>
						<span class="font-mono font-semibold text-gray-900 dark:text-white">{formatNumber(preview.tokens.total)} tokens</span>
					</div>

					<div class="grid grid-cols-3 gap-3 text-left pt-1">
						<div>
							<div class="text-[10.5px] text-gray-400">Total</div>
							<div class="text-sm font-semibold font-mono text-gray-900 dark:text-white mt-0.5">
								{formatNumber(preview.tokens.total)}
							</div>
						</div>

						<div>
							<div class="text-[10.5px] text-gray-400">Entrée (Prompts)</div>
							<div class="text-sm font-semibold font-mono text-gray-900 dark:text-white mt-0.5">
								{formatNumber(preview.tokens.input)}
							</div>
						</div>

						<div>
							<div class="text-[10.5px] text-gray-400">Sortie (Réponses)</div>
							<div class="text-sm font-semibold font-mono text-gray-900 dark:text-white mt-0.5">
								{formatNumber(preview.tokens.output)}
							</div>
						</div>
					</div>
				</div>

				<!-- 3. Notes & Recherches Récentes Flat -->
				<div class="grid grid-cols-2 gap-4 text-xs pb-3 border-b border-gray-100 dark:border-gray-800/80">
					<!-- Notes -->
					<div class="space-y-1.5">
						<div class="flex justify-between items-center">
							<span class="font-semibold text-gray-900 dark:text-white">Notes</span>
							<span class="text-[10px] text-gray-400">{preview.notes.length}</span>
						</div>
						{#if preview.notes.length === 0}
							<div class="py-2 text-gray-400 text-[11px]">Aucune note enregistrée</div>
						{:else}
							<div class="space-y-1 max-h-28 overflow-y-auto">
								{#each preview.notes as note}
									<div class="py-1 border-b border-gray-50 dark:border-gray-850">
										<div class="font-medium text-gray-900 dark:text-white text-[11px] truncate">{note.title || 'Sans titre'}</div>
										{#if note.content}
											<div class="text-[10px] text-gray-500 line-clamp-1">{note.content}</div>
										{/if}
									</div>
								{/each}
							</div>
						{/if}
					</div>

					<!-- Recherches Récentes -->
					<div class="space-y-1.5">
						<div class="flex justify-between items-center">
							<span class="font-semibold text-gray-900 dark:text-white">Recherches Récentes</span>
							<span class="text-[10px] text-gray-400">{preview.searches.length}</span>
						</div>
						{#if preview.searches.length === 0}
							<div class="py-2 text-gray-400 text-[11px]">Aucune recherche récente</div>
						{:else}
							<div class="space-y-1 max-h-28 overflow-y-auto">
								{#each preview.searches as search}
									<div class="text-[11px] text-gray-700 dark:text-gray-300 truncate py-0.5">
										{search.query || search}
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>

				<!-- 4. Quota de Tokens Personnalisé (pour non-admins) -->
				{#if preview.role !== 'admin'}
					<div class="space-y-2 text-xs pb-3 border-b border-gray-100 dark:border-gray-800/80">
						<div class="flex justify-between items-center">
							<span class="font-semibold text-gray-900 dark:text-white">Limite & Quota de Tokens</span>
							<span class="text-[10px] text-gray-400 font-mono">Actuel : {formatNumber(customTokenLimit)}</span>
						</div>
						<div class="flex items-center gap-2 pt-1">
							<input
								type="number"
								min="0"
								step="1000"
								bind:value={customTokenLimit}
								class="flex-1 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-750 bg-transparent text-xs text-gray-900 dark:text-white outline-hidden focus:border-gray-400 dark:focus:border-gray-500 font-mono"
								placeholder="Limite en tokens (ex: 50000)"
							/>
							<button
								disabled={savingLimit}
								class="px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 text-xs font-medium transition cursor-pointer disabled:opacity-50"
								on:click={saveUserTokenLimit}
							>
								{savingLimit ? 'Enregistrement...' : 'Enregistrer'}
							</button>
						</div>
					</div>
				{/if}

				<!-- 5. Envoyer une Notification / Message Popup -->
				<div class="space-y-2 text-xs pb-3 border-b border-gray-100 dark:border-gray-800/80">
					<div class="font-semibold text-gray-900 dark:text-white">Envoyer une Notification (Pop-up avec Slider)</div>
					<div class="space-y-2 pt-1">
						<input
							type="text"
							bind:value={notifTitle}
							class="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-750 bg-transparent text-xs text-gray-900 dark:text-white outline-hidden focus:border-gray-400 dark:focus:border-gray-500"
							placeholder="Titre de la notification..."
						/>
						<textarea
							bind:value={notifMessage}
							rows="2"
							class="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-750 bg-transparent text-xs text-gray-900 dark:text-white outline-hidden focus:border-gray-400 dark:focus:border-gray-500 resize-none"
							placeholder="Écrivez le message que l'utilisateur verra en pop-up sur son écran..."
						></textarea>
						<button
							disabled={sendingNotif || !notifMessage.trim()}
							class="w-full py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 text-xs font-medium transition cursor-pointer disabled:opacity-50"
							on:click={sendNotificationToUser}
						>
							{sendingNotif ? 'Envoi en cours...' : 'Envoyer la notification à cet utilisateur'}
						</button>
					</div>
				</div>

				<!-- 6. Accès Modèles Flat -->
				<div class="space-y-2 text-xs">
					<div class="font-semibold text-gray-900 dark:text-white">Accès Modèles</div>
					<div class="grid grid-cols-2 gap-x-4 gap-y-1">
						{#each preview.models as model}
							<div class="flex justify-between items-center py-1">
								<span class="text-gray-800 dark:text-gray-200">{model.name}</span>
								{#if model.access}
									<span class="text-[11px] text-gray-500 dark:text-gray-400">Autorisé</span>
								{:else}
									<span class="text-[11px] text-gray-400 dark:text-gray-600">Verrouillé</span>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>
</Modal>
