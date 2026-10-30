<script lang="ts">
	import DOMPurify from 'dompurify';
	import { marked } from 'marked';
	import { getAdminDetails, userSignOut } from '$lib/apis/auths';
	import { onMount, getContext } from 'svelte';
	import { config, user } from '$lib/stores';
	import { auth, getUserRoleFromFirebase } from '$lib/firebase';
	import { toast } from 'svelte-sonner';

	const i18n = getContext('i18n');

	let adminDetails: any = null;
	let checking = false;

	const defaultAdmin = {
		name: 'MrPinPin',
		email: 'contact@pincorpstudio.site'
	};

	onMount(async () => {
		adminDetails = await getAdminDetails(localStorage.token).catch((err) => {
			console.error(err);
			return null;
		});
	});

	const checkApprovalStatus = async () => {
		checking = true;
		try {
			const currentUser = auth.currentUser;
			const targetUid = currentUser?.uid || $user?.id || $user?.uid;
			const targetEmail = currentUser?.email || $user?.email;

			const role = await getUserRoleFromFirebase({
				uid: targetUid,
				id: targetUid,
				email: targetEmail
			});

			if (role && ['user', 'admin', 'beta_tester', 'owner'].includes(role)) {
				if ($user) {
					user.set({ ...$user, role });
					localStorage.setItem('aria_user', JSON.stringify({ ...$user, role }));
				}
				if (targetUid) {
					localStorage.setItem('aria_role_' + targetUid, role);
				}
				toast.success('Account activated! Welcome to Aria.');
				window.location.reload();
				return;
			}
			toast.info('Your account is still pending administrator review. Please check back shortly!');
		} catch (e) {
			console.error(e);
			window.location.reload();
		} finally {
			checking = false;
		}
	};

	$: adminName = (adminDetails?.name && adminDetails.name.trim() !== '') ? adminDetails.name : defaultAdmin.name;
	$: adminEmail = (adminDetails?.email && adminDetails.email.trim() !== '') ? adminDetails.email : defaultAdmin.email;
</script>

<div class="fixed w-full h-full flex z-999">
	<div
		class="absolute w-full h-full backdrop-blur-lg bg-white/10 dark:bg-gray-900/50 flex justify-center"
	>
		<div class="m-auto pb-10 flex flex-col justify-center">
			<div class="max-w-md px-6">
				<div
					class="text-center dark:text-white text-2xl font-normal z-50 tracking-tight"
					style="white-space: pre-wrap;"
				>
					{#if ($config?.ui?.pending_user_overlay_title ?? '').trim() !== ''}
						{$config.ui.pending_user_overlay_title}
					{:else}
						{$i18n.t('Account Activation Pending')}
					{/if}
				</div>

				<div
					class="mt-4 text-center text-sm dark:text-gray-300 text-gray-600 w-full leading-relaxed"
					style="white-space: pre-wrap;"
				>
					{#if ($config?.ui?.pending_user_overlay_content ?? '').trim() !== ''}
						{@html DOMPurify.sanitize(
							marked.parse(($config?.ui?.pending_user_overlay_content ?? '').replace(/\n/g, '<br>'))
						)}
					{:else}
						{$i18n.t('Your account is currently awaiting activation.')}{'\n'}{$i18n.t('Please reach out to the administrator to request access.')}
					{/if}
				</div>

				<div class="mt-4 text-sm font-normal text-center text-gray-500 dark:text-gray-400">
					<span>{$i18n.t('Administrator')}: </span>
					<a
						href="mailto:{adminEmail}?subject=Aria%20Studio%20-%20Access%20Request"
						class="text-gray-800 dark:text-gray-200 underline hover:opacity-80 transition"
					>
						{adminName} ({adminEmail})
					</a>
				</div>

				<div class="mt-6 mx-auto relative group w-fit flex flex-col items-center">
					<button
						disabled={checking}
						class="relative z-20 flex px-5 py-2 rounded-full bg-white border border-gray-100 dark:border-none hover:bg-gray-100 text-gray-700 transition font-normal text-sm shadow-sm disabled:opacity-60"
						on:click={checkApprovalStatus}
					>
						{#if checking}
							{$i18n.t('Checking...')}
						{:else}
							{$i18n.t('Check Status')}
						{/if}
					</button>

					<button
						class="text-xs text-center w-full mt-2 text-gray-400 hover:text-gray-300 underline transition"
						on:click={async () => {
							const res = await userSignOut().catch((err) => {
								console.error(err);
								return null;
							});
							localStorage.removeItem('token');
							location.href = res?.redirect_url ?? '/auth';
						}}
					>
						{$i18n.t('Sign Out')}
					</button>
				</div>
			</div>
		</div>
	</div>
</div>
