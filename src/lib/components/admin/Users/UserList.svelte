<script lang="ts">
	import { WEBUI_API_BASE_URL } from '$lib/constants';
	import { adminUserCount, config, user } from '$lib/stores';
	import { getContext, onDestroy } from 'svelte';

	import dayjs from 'dayjs';
	import relativeTime from 'dayjs/plugin/relativeTime';
	import localizedFormat from 'dayjs/plugin/localizedFormat';
	dayjs.extend(relativeTime);
	dayjs.extend(localizedFormat);

	import { toast } from 'svelte-sonner';

	import { getUsers, deleteUserById } from '$lib/apis/users';

	import Pagination from '$lib/components/common/Pagination.svelte';
	import ChatBubbles from '$lib/components/icons/ChatBubbles.svelte';
	import EditPencil from '$lib/components/icons/EditPencil.svelte';
	import Eye from '$lib/components/icons/Eye.svelte';
	import Trash from '$lib/components/icons/Trash.svelte';
	import Tooltip from '$lib/components/common/Tooltip.svelte';

	import EditUserModal from '$lib/components/admin/Users/UserList/EditUserModal.svelte';
	import UserChatsModal from '$lib/components/admin/Users/UserList/UserChatsModal.svelte';
	import AddUserModal from '$lib/components/admin/Users/UserList/AddUserModal.svelte';

	import ConfirmDialog from '$lib/components/common/ConfirmDialog.svelte';

	import Search from '$lib/components/icons/Search.svelte';
	import XMark from '$lib/components/icons/XMark.svelte';
	import ChevronUp from '$lib/components/icons/ChevronUp.svelte';
	import ChevronDown from '$lib/components/icons/ChevronDown.svelte';
	import Banner from '$lib/components/common/Banner.svelte';
	import Spinner from '$lib/components/common/Spinner.svelte';
	import ProfilePreview from '$lib/components/channel/Messages/Message/ProfilePreview.svelte';
	import UserPreviewModal from '$lib/components/admin/UserPreviewModal.svelte';

	const i18n = getContext('i18n');

	let page = 1;

	let users = null;
	let total = null;

	let query = '';
	let searchDebounceTimer: ReturnType<typeof setTimeout>;
	let orderBy = 'created_at'; // default sort key
	let direction = 'asc'; // default sort order

	let selectedUser = null;

	let showDeleteConfirmDialog = false;
	let showAddUserModal = false;

	let showUserChatsModal = false;
	let showEditUserModal = false;
	let showUserPreviewModal = false;

	const deleteUserHandler = async (id) => {
		const res = await deleteUserById(localStorage.token, id).catch((error) => {
			toast.error(`${error}`);
			return null;
		});

		// if the user is deleted and the current page has only one user, go back to the previous page
		if (users.length === 1 && page > 1) {
			page -= 1;
		}

		if (res) {
			getUserList();
		}
	};

	const sortState = (key) =>
		orderBy === key ? (direction === 'asc' ? 'ascending' : 'descending') : 'none';

	const setSortKey = (key) => {
		if (orderBy === key) {
			direction = direction === 'asc' ? 'desc' : 'asc';
		} else {
			orderBy = key;
			direction = 'asc';
		}
	};

	const toggleBanUser = async (userToToggle) => {
		const newRole = userToToggle.role === 'banned' ? 'user' : 'banned';
		try {
			const { updateFirebaseUserRole } = await import('$lib/firebase');
			await updateFirebaseUserRole(userToToggle.id, newRole);
			userToToggle.role = newRole;
			users = [...users];
			toast.success(newRole === 'banned' ? $i18n.t('Utilisateur banni') : $i18n.t('Utilisateur débanni'));
			await getUserList();
		} catch (error) {
			toast.error(`${error}`);
		}
	};

	$: isOwner = $user?.role === 'owner' || $user?.id === 'QH8wKG8nWZVtUQEy2pppuBuNZgC3';

	const canModifyUser = (targetUser) => {
		if (!targetUser) return false;
		if (isOwner) return true;
		if (targetUser.role === 'owner' || targetUser.id === 'QH8wKG8nWZVtUQEy2pppuBuNZgC3') return false;
		if (targetUser.role === 'admin') return false;
		if (targetUser.id === $user?.id) return false;
		return true;
	};

	const roleClass = (role) => {
		if (role === 'owner') {
			return 'text-amber-500 dark:text-amber-400 font-semibold';
		}
		if (role === 'admin') {
			return 'text-[#4f6f93] dark:text-[#8ba6c6] font-medium';
		}
		if (role === 'beta_tester') {
			return 'text-purple-600 dark:text-purple-400 font-medium';
		}
		if (role === 'user') {
			return 'text-[#4f7a5a] dark:text-[#8db395]';
		}
		if (role === 'banned') {
			return 'text-rose-500 dark:text-rose-400 font-semibold';
		}
		return 'text-gray-500 dark:text-gray-400';
	};

	const getUserList = async () => {
		try {
			const res = await getUsers(localStorage.token, query, orderBy, direction, page).catch(
				(error) => {
					toast.error(`${error}`);
					return null;
				}
			);

			if (res) {
				users = res.users;
				total = res.total;
				adminUserCount.set(total);
			}
		} catch (err) {
			console.error(err);
		}
	};

	const handleSearchInput = () => {
		clearTimeout(searchDebounceTimer);
		searchDebounceTimer = setTimeout(() => {
			if (page !== 1) {
				page = 1;
			} else {
				getUserList();
			}
		}, 300);
	};

	$: if (page !== null && orderBy !== null && direction !== null) {
		getUserList();
	}

	onDestroy(() => {
		clearTimeout(searchDebounceTimer);
	});
</script>

<ConfirmDialog
	bind:show={showDeleteConfirmDialog}
	on:confirm={() => {
		deleteUserHandler(selectedUser.id);
	}}
/>

<AddUserModal
	bind:show={showAddUserModal}
	on:save={async () => {
		getUserList();
	}}
/>

<EditUserModal
	bind:show={showEditUserModal}
	{selectedUser}
	sessionUser={$user}
	on:save={async () => {
		getUserList();
	}}
/>

{#if selectedUser}
	<UserChatsModal bind:show={showUserChatsModal} user={selectedUser} />
	<UserPreviewModal
		bind:show={showUserPreviewModal}
		userId={selectedUser?.id}
		userName={selectedUser?.name}
	/>
{/if}

{#if ($config?.license_metadata?.seats ?? null) !== null && total && total > $config?.license_metadata?.seats}
	<div class=" mt-1 mb-2 text-xs text-red-500">
		<Banner
			className="mx-0"
			banner={{
				type: 'error',
				title: 'License Error',
				content:
					'Exceeded the number of seats in your license. Please contact support to increase the number of seats.'
			}}
		/>
	</div>
{/if}

{#if users === null || total === null}
	<div class="my-10">
		<Spinner className="size-5" />
	</div>
{:else}
	<div class="sticky top-0 z-10 bg-white dark:bg-gray-900">
		<div class="flex h-8 flex-1 items-center w-full gap-2">
			<div class="flex min-w-0 flex-1 items-center">
				<div class="self-center ml-1 mr-3">
					<Search className="size-3.5" />
				</div>
				<input
					class="w-full text-sm pr-4 py-1 rounded-r-xl outline-hidden bg-transparent"
					bind:value={query}
					on:input={handleSearchInput}
					aria-label={$i18n.t('Search')}
					placeholder={$i18n.t('Search')}
				/>

				{#if query}
					<div class="self-center pl-1.5 translate-y-[0.5px] rounded-l-xl bg-transparent">
						<button
							class="p-0.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 transition"
							aria-label={$i18n.t('Clear search')}
							on:click={() => {
								query = '';
								handleSearchInput();
							}}
						>
							<XMark className="size-3" strokeWidth="2" />
						</button>
					</div>
				{/if}
			</div>

			<button
				class="ml-1 shrink-0 rounded-lg bg-gray-50 px-2.5 py-1 text-xs text-gray-900 transition ring-1 ring-gray-200 hover:bg-gray-100 dark:bg-gray-850 dark:text-gray-100 dark:ring-gray-800 dark:hover:bg-gray-800"
				on:click={() => {
					showAddUserModal = !showAddUserModal;
				}}
			>
				{$i18n.t('Add User')}
			</button>
		</div>
	</div>

	<div class="scrollbar-hidden relative whitespace-nowrap overflow-x-auto max-w-full">
		<table class="w-full text-sm text-left text-gray-500 dark:text-gray-400 table-auto max-w-full">
			<thead class="text-xs text-gray-800 uppercase bg-transparent dark:text-gray-200">
				<tr class=" border-b-[1.5px] border-gray-50 dark:border-gray-850/30">
					<th scope="col" class="font-normal select-none" aria-sort={sortState('name')}>
						<button
							type="button"
							class="flex w-full gap-1.5 items-center px-2.5 py-1.5"
							on:click={() => setSortKey('name')}
						>
							{$i18n.t('Name')}

							{#if orderBy === 'name'}
								<span class="font-normal"
									>{#if direction === 'asc'}
										<ChevronUp className="size-2" />
									{:else}
										<ChevronDown className="size-2" />
									{/if}
								</span>
							{:else}
								<span class="invisible">
									<ChevronUp className="size-2" />
								</span>
							{/if}
						</button>
					</th>
					<th scope="col" class="font-normal select-none" aria-sort={sortState('role')}>
						<button
							type="button"
							class="flex w-full gap-1.5 items-center px-2.5 py-1.5"
							on:click={() => setSortKey('role')}
						>
							{$i18n.t('Role')}

							{#if orderBy === 'role'}
								<span class="font-normal"
									>{#if direction === 'asc'}
										<ChevronUp className="size-2" />
									{:else}
										<ChevronDown className="size-2" />
									{/if}
								</span>
							{:else}
								<span class="invisible">
									<ChevronUp className="size-2" />
								</span>
							{/if}
						</button>
					</th>
					<th scope="col" class="font-normal select-none" aria-sort={sortState('email')}>
						<button
							type="button"
							class="flex w-full gap-1.5 items-center px-2.5 py-1.5"
							on:click={() => setSortKey('email')}
						>
							{$i18n.t('Email')}

							{#if orderBy === 'email'}
								<span class="font-normal"
									>{#if direction === 'asc'}
										<ChevronUp className="size-2" />
									{:else}
										<ChevronDown className="size-2" />
									{/if}
								</span>
							{:else}
								<span class="invisible">
									<ChevronUp className="size-2" />
								</span>
							{/if}
						</button>
					</th>

					<th scope="col" class="font-normal select-none" aria-sort={sortState('last_active_at')}>
						<button
							type="button"
							class="flex w-full gap-1.5 items-center px-2.5 py-1.5"
							on:click={() => setSortKey('last_active_at')}
						>
							{$i18n.t('Last Active')}
							<!-- {$i18n.t('Last Modified')} -->

							{#if orderBy === 'last_active_at'}
								<span class="font-normal"
									>{#if direction === 'asc'}
										<ChevronUp className="size-2" />
									{:else}
										<ChevronDown className="size-2" />
									{/if}
								</span>
							{:else}
								<span class="invisible">
									<ChevronUp className="size-2" />
								</span>
							{/if}
						</button>
					</th>
					<th scope="col" class="font-normal select-none" aria-sort={sortState('created_at')}>
						<button
							type="button"
							class="flex w-full gap-1.5 items-center px-2.5 py-1.5"
							on:click={() => setSortKey('created_at')}
						>
							{$i18n.t('Created at')}
							{#if orderBy === 'created_at'}
								<span class="font-normal"
									>{#if direction === 'asc'}
										<ChevronUp className="size-2" />
									{:else}
										<ChevronDown className="size-2" />
									{/if}
								</span>
							{:else}
								<span class="invisible">
									<ChevronUp className="size-2" />
								</span>
							{/if}
						</button>
					</th>

					<th scope="col" class="px-2.5 py-1.5 font-normal text-right"></th>
				</tr>
			</thead>
			<tbody class="">
				{#each users as userItem (userItem.id)}
					<tr class="dark:border-gray-850 text-xs">
						<td class="px-3 py-1 font-normal text-gray-900 dark:text-white max-w-48">
							<div class="flex items-center gap-2">
								<ProfilePreview user={userItem} side="right" align="center" sideOffset={6}>
									<img
										class="rounded-full size-5.5 object-cover flex-shrink-0"
										referrerpolicy="no-referrer"
										src={userItem.profile_image_url || `${WEBUI_API_BASE_URL}/users/${userItem.id}/profile/image`}
										alt="user"
										on:error={(e) => {
											e.currentTarget.src = '/User.avif';
										}}
									/>
								</ProfilePreview>

								<div class="font-normal truncate">{userItem.name}</div>

								{#if userItem?.last_active_at && Date.now() / 1000 - userItem.last_active_at < 180}
									<div>
										<span class="relative flex size-1.5">
											<span
												class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"
											></span>
											<span class="relative inline-flex size-1.5 rounded-full bg-green-500"></span>
										</span>
									</div>
								{/if}
							</div>
						</td>
						<td class="px-3 py-1 min-w-[5rem] w-24">
							{#if canModifyUser(userItem)}
								<button
									class="text-xs font-normal leading-4 capitalize transition hover:opacity-80 cursor-pointer {roleClass(userItem.role)}"
									aria-label={$i18n.t('Change User Role')}
									on:click={() => {
										selectedUser = userItem;
										showEditUserModal = !showEditUserModal;
									}}
								>
									{userItem.role === 'owner' ? 'Owner' : userItem.role === 'beta_tester' ? 'Bêta-Testeur' : $i18n.t(userItem.role)}
								</button>
							{:else}
								<span
									class="text-xs font-normal leading-4 capitalize select-none inline-flex items-center gap-1 {roleClass(userItem.role)}"
									title={userItem.role === 'owner' ? 'Owner (Protégé)' : 'Administrateur (Protégé)'}
								>
									{userItem.role === 'owner' ? 'Owner' : userItem.role === 'beta_tester' ? 'Bêta-Testeur' : $i18n.t(userItem.role)}
								</span>
							{/if}
						</td>
						<td class=" px-3 py-1 max-w-48 truncate"> {userItem.email} </td>

						<td class=" px-3 py-1">
							{dayjs(userItem.last_active_at * 1000).fromNow()}
						</td>

						<td class=" px-3 py-1">
							{dayjs(userItem.created_at * 1000).format('LL')}
						</td>

						<td class="px-3 py-1 text-right">
							<div class="flex justify-end items-center gap-0.5 w-full">
								{#if $config.features.enable_admin_chat_access && userItem.role !== 'admin' && userItem.role !== 'owner'}
									<Tooltip content={$i18n.t('Chats')}>
										<button
											class="self-center w-fit p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg cursor-pointer"
											aria-label={$i18n.t('Chats')}
											on:click={async () => {
												showUserChatsModal = !showUserChatsModal;
												selectedUser = userItem;
											}}
										>
											<ChatBubbles className="size-3.5" />
										</button>
									</Tooltip>
								{/if}

								<Tooltip content={$i18n.t('Aperçu')}>
									<button
										class="self-center w-fit p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg cursor-pointer"
										aria-label={$i18n.t('Aperçu')}
										on:click={() => {
											showUserChatsModal = false;
											showEditUserModal = false;
											selectedUser = userItem;
											showUserPreviewModal = true;
										}}
									>
										<Eye className="size-3.5" />
									</button>
								</Tooltip>

								{#if canModifyUser(userItem)}
									<Tooltip content={$i18n.t('Edit User')}>
										<button
											class="self-center w-fit p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg cursor-pointer"
											aria-label={$i18n.t('Edit User')}
											on:click={async () => {
												showEditUserModal = !showEditUserModal;
												selectedUser = userItem;
											}}
										>
											<EditPencil className="size-3.5" />
										</button>
									</Tooltip>

									{#if isOwner ? (userItem.id !== $user?.id) : (userItem.role !== 'admin' && userItem.role !== 'owner')}
										<Tooltip content={userItem.role === 'banned' ? $i18n.t('Débannir') : $i18n.t('Bannir')}>
											<button
												class="self-center w-fit p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg cursor-pointer {userItem.role === 'banned' ? 'text-amber-500 hover:text-amber-600' : 'text-gray-500 hover:text-red-500'} transition"
												aria-label={userItem.role === 'banned' ? 'Débannir' : 'Bannir'}
												on:click={async () => {
													await toggleBanUser(userItem);
												}}
											>
												{#if userItem.role === 'banned'}
													<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-3.5">
														<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
													</svg>
												{:else}
													<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-3.5">
														<path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
													</svg>
												{/if}
											</button>
										</Tooltip>

										<Tooltip content={$i18n.t('Delete User')}>
											<button
												class="self-center w-fit p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg cursor-pointer"
												aria-label={$i18n.t('Delete User')}
												on:click={async () => {
													showDeleteConfirmDialog = true;
													selectedUser = userItem;
												}}
											>
												<Trash className="size-3.5" />
											</button>
										</Tooltip>
									{/if}
								{:else if userItem.id !== $user?.id}
									<Tooltip content={userItem.role === 'owner' ? 'Fondateur (Protégé)' : 'Administrateur (Protégé)'}>
										<div class="self-center p-1.5 text-gray-400 dark:text-gray-600">
											<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-3.5">
												<path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
											</svg>
										</div>
									</Tooltip>
								{/if}
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<div class=" text-gray-500 text-xs mt-1.5 text-right">
		ⓘ {$i18n.t("Click on the user role button to change a user's role.")}
	</div>

	{#if total > 30}
		<Pagination bind:page count={total} perPage={30} />
	{/if}
{/if}

{#if !$config?.license_metadata}
	{#if total > 50}
		<!-- LICENSE covers the Aria UI branding narrative here.
		Do not alter, remove, obscure, or replace it except as LICENSE permits:
		https://docs.Aria.com/license. -->
		<div class="mt-3 mb-3 pb-1 text-gray-700 dark:text-gray-300">
			<div class="max-w-3xl text-xs leading-5">
				<div class="text-gray-900 dark:text-gray-100">
					<!-- LICENSE covers this Aria UI wordmark.
					Do not alter, remove, obscure, or replace it except as LICENSE permits:
					https://docs.Aria.com/license. -->
					{$i18n.t('Running Aria UI for a team?')}
				</div>
				<div class="mt-2 space-y-2">
					<p>
						<!-- LICENSE covers this Aria UI branding copy.
						Do not alter, remove, obscure, or replace it except as LICENSE permits:
						https://docs.Aria.com/license. -->
						{$i18n.t(
							'You have more than 50 users, which often means this workspace is supporting organizational use. Aria UI is free to use as-is, with no restrictions or hidden limits, and we want to keep it that way.'
						)}
					</p>
					<p class="text-gray-500 dark:text-gray-400">
						<!-- LICENSE covers this Aria UI branding copy.
						Do not alter, remove, obscure, or replace it except as LICENSE permits:
						https://docs.Aria.com/license. -->
						{$i18n.t(
							'By supporting the project through sponsorship or an enterprise license, you help us stay independent, ship new features faster, improve stability, and grow Aria UI for the long haul.'
						)}
					</p>
					<p class="text-gray-500 dark:text-gray-400">
						{$i18n.t(
							'Enterprise licenses also include dedicated support, customization options, and more, at a fraction of the cost of building and maintaining this stack internally.'
						)}
					</p>
				</div>

				<div class="mt-2 flex items-center gap-3">
					<a
						class="text-xs text-gray-700 underline transition hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
						href="https://docs.Aria.com/enterprise"
						target="_blank"
						rel="noreferrer"
					>
						{$i18n.t('Enterprise licensing')}
					</a>
					<a
						class="text-xs text-gray-500 underline transition hover:text-gray-900 dark:text-gray-500 dark:hover:text-gray-100"
						href="https://github.com/sponsors/open-webui"
						target="_blank"
						rel="noreferrer"
					>
						{$i18n.t('Sponsor on GitHub')}
					</a>
				</div>
			</div>
		</div>
	{/if}
{/if}

{#if selectedUser}
	<UserPreviewModal
		bind:show={showUserPreviewModal}
		userId={selectedUser.id}
		userName={selectedUser.name}
	/>
{/if}
