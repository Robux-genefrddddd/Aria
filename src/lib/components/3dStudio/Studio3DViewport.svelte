<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import * as THREE from 'three';
	import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
	import type { Model3DPart, ShadingMode, CameraPreset, LightingPreset, Model3DStats } from '$lib/services/3d/types';
	import { buildSceneGroup, calculateModelStats } from '$lib/services/3d/virtualBlenderEngine';

	export let parts: Model3DPart[] = [];
	export let shadingMode: ShadingMode = 'flat';
	export let lightingPreset: LightingPreset = 'studio';
	export let showGrid = true;
	export let autoRotate = false;
	export let stats: Model3DStats | null = null;

	const dispatch = createEventDispatcher<{
		partSelected: Model3DPart | null;
	}>();

	let container: HTMLDivElement;
	let canvas: HTMLCanvasElement;

	let scene: THREE.Scene;
	let camera: THREE.PerspectiveCamera;
	let renderer: THREE.WebGLRenderer;
	let controls: OrbitControls;
	let animationFrameId: number;

	let modelGroup: THREE.Group | null = null;
	let gridHelper: THREE.GridHelper | null = null;

	let dirLight: THREE.DirectionalLight;
	let hemiLight: THREE.HemisphereLight;
	let fillLight: THREE.DirectionalLight;

	let isHovering = false;

	// Initialisation Three.js
	onMount(() => {
		initScene();
		updateModel(parts, shadingMode);
		applyLighting(lightingPreset);
		window.addEventListener('resize', handleResize);

		return () => {
			window.removeEventListener('resize', handleResize);
			cancelAnimationFrame(animationFrameId);
			if (renderer) renderer.dispose();
		};
	});

	$: if (parts && scene) {
		updateModel(parts, shadingMode);
	}

	$: if (shadingMode && scene) {
		updateModel(parts, shadingMode);
	}

	$: if (lightingPreset && scene) {
		applyLighting(lightingPreset);
	}

	$: if (gridHelper) {
		gridHelper.visible = showGrid;
	}

	$: if (controls) {
		controls.autoRotate = autoRotate;
		controls.autoRotateSpeed = 2.0;
	}

	function initScene() {
		if (!container || !canvas) return;

		const width = container.clientWidth || 600;
		const height = container.clientHeight || 500;

		// 1. Scène
		scene = new THREE.Scene();
		scene.background = new THREE.Color(0x0e1015);

		// 2. Caméra
		camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
		camera.position.set(4, 3, 5);

		// 3. Renderer WebGL avec ombres douces et antialiasing
		renderer = new THREE.WebGLRenderer({
			canvas,
			antialias: true,
			alpha: false,
			preserveDrawingBuffer: true
		});
		renderer.setSize(width, height);
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		renderer.shadowMap.enabled = true;
		renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		renderer.toneMapping = THREE.ACESFilmicToneMapping;
		renderer.toneMappingExposure = 1.1;

		// 4. OrbitControls
		controls = new OrbitControls(camera, renderer.domElement);
		controls.enableDamping = true;
		controls.dampingFactor = 0.05;
		controls.maxDistance = 30;
		controls.minDistance = 1;
		controls.target.set(0, 1.2, 0);

		// 5. Lumières du studio
		hemiLight = new THREE.HemisphereLight(0xffffff, 0x1f2430, 1.2);
		scene.add(hemiLight);

		dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
		dirLight.position.set(5, 8, 5);
		dirLight.castShadow = true;
		dirLight.shadow.mapSize.width = 1024;
		dirLight.shadow.mapSize.height = 1024;
		dirLight.shadow.camera.near = 0.5;
		dirLight.shadow.camera.far = 25;
		dirLight.shadow.bias = -0.001;
		scene.add(dirLight);

		fillLight = new THREE.DirectionalLight(0x70a1ff, 0.6);
		fillLight.position.set(-5, 4, -5);
		scene.add(fillLight);

		// 6. Grille stylisée façon Roblox Studio Baseplate
		gridHelper = new THREE.GridHelper(12, 24, 0x3d4452, 0x1e232e);
		gridHelper.position.y = 0;
		scene.add(gridHelper);

		// 7. Boucle d'animation
		const animate = () => {
			animationFrameId = requestAnimationFrame(animate);
			controls.update();
			renderer.render(scene, camera);
		};
		animate();
	}

	function updateModel(currentParts: Model3DPart[], mode: ShadingMode) {
		if (!scene) return;

		// Supprimer l'ancien modèle
		if (modelGroup) {
			scene.remove(modelGroup);
			modelGroup.traverse((child) => {
				if (child instanceof THREE.Mesh) {
					child.geometry.dispose();
					if (Array.isArray(child.material)) {
						child.material.forEach((m) => m.dispose());
					} else {
						child.material.dispose();
					}
				}
			});
		}

		// Reconstruire le groupe
		modelGroup = buildSceneGroup(currentParts, mode);
		scene.add(modelGroup);

		// Centrer le pivot de contrôle
		const box = new THREE.Box3().setFromObject(modelGroup);
		const center = box.getCenter(new THREE.Vector3());
		if (controls) {
			controls.target.copy(center);
		}
	}

	function applyLighting(preset: LightingPreset) {
		if (!scene || !hemiLight || !dirLight || !fillLight) return;

		switch (preset) {
			case 'sunset':
				scene.background = new THREE.Color(0x1a0f1d);
				hemiLight.color.setHex(0xff7675);
				hemiLight.groundColor.setHex(0x2d142c);
				dirLight.color.setHex(0xffaa44);
				dirLight.intensity = 1.6;
				fillLight.color.setHex(0xd63031);
				break;
			case 'cyberpunk':
				scene.background = new THREE.Color(0x05050f);
				hemiLight.color.setHex(0x00f0ff);
				hemiLight.groundColor.setHex(0x1a0033);
				dirLight.color.setHex(0xff0055);
				dirLight.intensity = 1.8;
				fillLight.color.setHex(0x00f0ff);
				break;
			case 'ambient':
				scene.background = new THREE.Color(0x16181d);
				hemiLight.color.setHex(0xffffff);
				hemiLight.groundColor.setHex(0x333333);
				dirLight.intensity = 0.9;
				fillLight.intensity = 0.9;
				break;
			case 'studio':
			default:
				scene.background = new THREE.Color(0x0e1015);
				hemiLight.color.setHex(0xffffff);
				hemiLight.groundColor.setHex(0x1f2430);
				dirLight.color.setHex(0xffffff);
				dirLight.intensity = 1.4;
				fillLight.color.setHex(0x70a1ff);
				fillLight.intensity = 0.6;
		}
	}

	export function setCameraPreset(preset: CameraPreset) {
		if (!camera || !controls || !modelGroup) return;

		const box = new THREE.Box3().setFromObject(modelGroup);
		const center = box.getCenter(new THREE.Vector3());
		const size = box.getSize(new THREE.Vector3());
		const maxDim = Math.max(size.x, size.y, size.z, 2);
		const dist = maxDim * 2.2;

		controls.target.copy(center);

		switch (preset) {
			case 'isometric':
				camera.position.set(center.x + dist, center.y + dist * 0.9, center.z + dist);
				break;
			case 'top':
				camera.position.set(center.x, center.y + dist * 1.5, center.z + 0.001);
				break;
			case 'front':
				camera.position.set(center.x, center.y, center.z + dist * 1.3);
				break;
			case 'side':
				camera.position.set(center.x + dist * 1.3, center.y, center.z);
				break;
			case 'perspective':
			default:
				camera.position.set(center.x + dist * 0.9, center.y + dist * 0.7, center.z + dist * 1.1);
		}

		camera.lookAt(center);
		controls.update();
	}

	export function get3DObject(): THREE.Group | null {
		return modelGroup;
	}

	export function takeScreenshot(): string {
		if (!renderer) return '';
		renderer.render(scene, camera);
		return renderer.domElement.toDataURL('image/png');
	}

	function handleResize() {
		if (!container || !camera || !renderer) return;
		const width = container.clientWidth;
		const height = container.clientHeight;
		camera.aspect = width / height;
		camera.updateProjectionMatrix();
		renderer.setSize(width, height);
	}
</script>

<div
	bind:this={container}
	class="relative w-full h-full min-h-[420px] bg-neutral-950 rounded-2xl overflow-hidden select-none border border-neutral-800 shadow-2xl flex items-center justify-center"
	on:mouseenter={() => (isHovering = true)}
	on:mouseleave={() => (isHovering = false)}
	role="region"
	aria-label="Aria 3D Studio Viewport"
>
	<canvas bind:this={canvas} class="w-full h-full block cursor-grab active:cursor-grabbing outline-none"></canvas>

	<!-- Badge Flottant HUD Polycount & Limite Roblox Studio -->
	<div class="absolute top-3 left-3 flex flex-wrap items-center gap-2 pointer-events-none z-10">
		<div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-900/80 backdrop-blur-md border border-neutral-700/60 text-xs font-medium text-neutral-200 shadow-lg">
			<span class="size-2 rounded-full bg-emerald-400 animate-pulse"></span>
			<span>{stats?.triangles ?? 0} tris</span>
			<span class="text-neutral-500">•</span>
			<span>{parts.length} pièces</span>
			<span class="text-neutral-500">•</span>
			<span class="text-emerald-400 font-semibold">Roblox OK (&lt; 10k)</span>
		</div>
	</div>

	<!-- Barre d'outils flottante supérieure droite : Angles caméra -->
	<div class="absolute top-3 right-3 flex items-center gap-1 p-1 rounded-xl bg-neutral-900/80 backdrop-blur-md border border-neutral-700/60 shadow-lg z-10">
		<button
			type="button"
			on:click={() => setCameraPreset('perspective')}
			class="px-2.5 py-1 text-xs rounded-lg font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 transition"
			title="Vue Perspective"
		>
			Persp
		</button>
		<button
			type="button"
			on:click={() => setCameraPreset('isometric')}
			class="px-2.5 py-1 text-xs rounded-lg font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 transition"
			title="Vue Isométrique"
		>
			Iso 45°
		</button>
		<button
			type="button"
			on:click={() => setCameraPreset('front')}
			class="px-2.5 py-1 text-xs rounded-lg font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 transition"
			title="Vue de Face"
		>
			Face
		</button>
		<button
			type="button"
			on:click={() => setCameraPreset('top')}
			class="px-2.5 py-1 text-xs rounded-lg font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 transition"
			title="Vue de Dessus"
		>
			Haut
		</button>
	</div>

	<!-- Barre de contrôle inférieure flottante : Rendu & Rotation -->
	<div class="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 p-1.5 rounded-2xl bg-neutral-900/85 backdrop-blur-md border border-neutral-700/60 shadow-2xl z-10">
		<!-- Modes de Shading -->
		<div class="flex items-center gap-1 border-r border-neutral-700/60 pr-2">
			<button
				type="button"
				on:click={() => (shadingMode = 'flat')}
				class="px-2.5 py-1 text-xs rounded-xl font-medium transition {shadingMode === 'flat' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm' : 'text-neutral-400 hover:text-white'}"
			>
				Low-Poly Flat
			</button>
			<button
				type="button"
				on:click={() => (shadingMode = 'wireframe')}
				class="px-2.5 py-1 text-xs rounded-xl font-medium transition {shadingMode === 'wireframe' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm' : 'text-neutral-400 hover:text-white'}"
			>
				Filaire
			</button>
			<button
				type="button"
				on:click={() => (shadingMode = 'clay')}
				class="px-2.5 py-1 text-xs rounded-xl font-medium transition {shadingMode === 'clay' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm' : 'text-neutral-400 hover:text-white'}"
			>
				Argile
			</button>
		</div>

		<!-- Toggles : Rotation automatique & Grille -->
		<button
			type="button"
			on:click={() => (autoRotate = !autoRotate)}
			class="px-2.5 py-1 text-xs rounded-xl font-medium transition flex items-center gap-1.5 {autoRotate ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'text-neutral-400 hover:text-white'}"
			title="Rotation automatique 360°"
		>
			<span>🔄</span>
			<span>Tourner</span>
		</button>

		<button
			type="button"
			on:click={() => (showGrid = !showGrid)}
			class="px-2.5 py-1 text-xs rounded-xl font-medium transition flex items-center gap-1.5 {showGrid ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-white'}"
			title="Afficher/Masquer la grille Studio"
		>
			<span>#</span>
			<span>Grille</span>
		</button>
	</div>
</div>
