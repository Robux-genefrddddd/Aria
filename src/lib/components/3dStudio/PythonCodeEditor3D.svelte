<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { copyToClipboard } from '$lib/utils';
	import { exportBlenderScript } from '$lib/services/3d/exporters';
	import { toast } from 'svelte-sonner';

	export let code = '';
	export let title = 'modele_aria';

	const dispatch = createEventDispatcher<{
		codeChanged: string;
		reRunCode: string;
	}>();

	let copied = false;

	const handleCopy = async () => {
		copied = true;
		await copyToClipboard(code);
		toast.success('Script Python Blender (bpy) copié !');
		setTimeout(() => (copied = false), 1500);
	};

	const handleDownload = () => {
		const cleanName = title.toLowerCase().replace(/[^a-z0-9_]/g, '_');
		exportBlenderScript(code, `${cleanName}_blender.py`);
		toast.success('Fichier Python .py téléchargé.');
	};

	const handleReRun = () => {
		dispatch('reRunCode', code);
		toast.info('Script ré-exécuté dans le moteur 3D !');
	};
</script>

<div class="w-full flex flex-col gap-2">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2">
			<span class="text-xs font-semibold text-neutral-300">Script Blender Python (bpy)</span>
			<span class="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30">
				Blender 4.x / 5.x
			</span>
		</div>
		<div class="flex items-center gap-1.5">
			<button
				type="button"
				on:click={handleReRun}
				class="px-2 py-1 text-xs rounded-lg bg-neutral-800 hover:bg-neutral-700 text-cyan-400 hover:text-cyan-300 transition flex items-center gap-1"
				title="Ré-exécuter le script dans la scène 3D"
			>
				<span>▶</span>
				<span>Exécuter</span>
			</button>
			<button
				type="button"
				on:click={handleCopy}
				class="px-2 py-1 text-xs rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition"
			>
				{copied ? 'Copié !' : 'Copier'}
			</button>
			<button
				type="button"
				on:click={handleDownload}
				class="px-2 py-1 text-xs rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition"
			>
				.py
			</button>
		</div>
	</div>

	<div class="relative w-full rounded-xl border border-neutral-800 bg-neutral-950/90 overflow-hidden">
		<textarea
			bind:value={code}
			on:input={() => dispatch('codeChanged', code)}
			rows={12}
			spellcheck="false"
			class="w-full p-3 font-mono text-xs text-neutral-300 bg-transparent resize-y outline-hidden leading-relaxed"
		></textarea>
	</div>
</div>
