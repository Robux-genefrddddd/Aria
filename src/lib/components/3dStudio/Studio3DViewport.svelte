<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import * as THREE from 'three';
	import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
	import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
	import type { Model3DPart, ShadingMode, CameraPreset, LightingPreset, Model3DStats } from '$lib/services/3d/types';
	import { buildSceneGroup, calculateModelStats } from '$lib/services/3d/virtualBlenderEngine';
	import { getSemanticFallbackParts } from '$lib/services/3d/archetypeParts';

	export let parts: Model3DPart[] = [];
	export let modelUrl: string | null = null;
	export let shadingMode: ShadingMode = 'flat';
	export let lightingPreset: LightingPreset = 'studio';
	export let showGrid = true;
	export let autoRotate = false;
	export let stats: Model3DStats | null = null;

	const dispatch = createEventDispatcher<{
		partSelected: Model3DPart | null;
		modelLoaded: { triangles: number; partsCount: number };
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
	let isLoadingModel = false;
	let loadError: string | null = null;

	// Initialisation Three.js
	onMount(() => {
		initScene();

		if (modelUrl) {
			loadGLBModel(modelUrl);
		} else {
			const effectiveParts = parts.length > 0 ? parts : getSemanticFallbackParts('sword');
			updateModel(effectiveParts, shadingMode);
		}

		applyLighting(lightingPreset);
		window.addEventListener('resize', handleResize);

		return () => {
			window.removeEventListener('resize', handleResize);
			cancelAnimationFrame(animationFrameId);
			if (renderer) renderer.dispose();
		};
	});

	$: if (modelUrl && scene) {
		loadGLBModel(modelUrl);
	}

	$: if (!modelUrl && parts && scene) {
		const effectiveParts = parts.length > 0 ? parts : getSemanticFallbackParts('sword');
		updateModel(effectiveParts, shadingMode);
	}

	$: if (shadingMode && scene) {
		applyShadingMode(shadingMode);
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
		controls.maxDistance = 35;
		controls.minDistance = 0.8;
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

	function cleanCurrentModel() {
		if (!scene || !modelGroup) return;
		scene.remove(modelGroup);
		modelGroup.traverse((child) => {
			if (child instanceof THREE.Mesh) {
				child.geometry?.dispose();
				if (Array.isArray(child.material)) {
					child.material.forEach((m) => m?.dispose());
				} else if (child.material) {
					child.material.dispose();
				}
			}
		});
		modelGroup = null;
	}

	function loadGLBModel(url: string) {
		if (!scene) return;
		isLoadingModel = true;
		loadError = null;

		const loader = new GLTFLoader();
		loader.load(
			url,
			(gltf) => {
				cleanCurrentModel();
				modelGroup = gltf.scene;

				let totalTriangles = 0;
				let meshCount = 0;

				modelGroup.traverse((child) => {
					if (child instanceof THREE.Mesh) {
						meshCount++;
						child.castShadow = true;
						child.receiveShadow = true;
						if (child.geometry) {
							const index = child.geometry.index;
							const position = child.geometry.attributes.position;
							if (index) {
								totalTriangles += index.count / 3;
							} else if (position) {
								totalTriangles += position.count / 3;
							}
						}
					}
				});

				scene.add(modelGroup);

				// Centrage automatique et calcul de caméra
				const box = new THREE.Box3().setFromObject(modelGroup);
				const center = box.getCenter(new THREE.Vector3());
				const size = box.getSize(new THREE.Vector3());
				const maxDim = Math.max(size.x, size.y, size.z, 1.5);

				// Centrer le modèle sur le sol (Y = 0)
				modelGroup.position.sub(center);
				modelGroup.position.y += size.y / 2;

				if (controls) {
					controls.target.set(0, size.y / 2, 0);
				}
				if (camera) {
					const dist = maxDim * 2.2;
					camera.position.set(dist * 0.8, size.y / 2 + dist * 0.5, dist * 0.9);
					camera.lookAt(0, size.y / 2, 0);
					controls?.update();
				}

				stats = {
					triangles: Math.round(totalTriangles),
					vertices: Math.round(totalTriangles * 1.5),
					partsCount: meshCount,
					isRobloxOptimized: totalTriangles <= 10000,
					estimatedFileSizeKb: Math.round(totalTriangles * 0.05 + 50)
				};

				dispatch('modelLoaded', {
					triangles: stats.triangles,
					partsCount: meshCount
				});

				isLoadingModel = false;
			},
			undefined,
			(err) => {
				console.error('Erreur chargement GLB:', err);
				loadError = 'Impossible de charger le fichier .GLB en direct.';
				isLoadingModel = false;
				// Fallback sur le modèle procédural
				const fallbackParts = parts.length > 0 ? parts : getSemanticFallbackParts('sword');
				updateModel(fallbackParts, shadingMode);
			}
		);
	}

	function updateModel(currentParts: Model3DPart[], mode: ShadingMode) {
		if (!scene) return;
		cleanCurrentModel();

		// Reconstruire le groupe
		modelGroup = buildSceneGroup(currentParts, mode);
		scene.add(modelGroup);

		// Centrer et ajuster la caméra sur le modèle
		const box = new THREE.Box3().setFromObject(modelGroup);
		const center = box.getCenter(new THREE.Vector3());
		const size = box.getSize(new THREE.Vector3());
		const maxDim = Math.max(size.x, size.y, size.z, 2);

		if (controls) {
			controls.target.copy(center);
		}
		if (camera && currentParts.length > 0) {
			const dist = maxDim * 2.0;
			camera.position.set(center.x + dist * 0.8, center.y + dist * 0.6, center.z + dist * 0.9);
			camera.lookAt(center);
			controls?.update();
		}

		stats = calculateModelStats(currentParts);
	}

	function applyShadingMode(mode: ShadingMode) {
		if (!modelGroup) return;
		modelGroup.traverse((child) => {
			if (child instanceof THREE.Mesh && child.material) {
				const mats = Array.isArray(child.material) ? child.material : [child.material];
				mats.forEach((m) => {
					if (m) {
						m.wireframe = mode === 'wireframe';
						if (mode === 'clay') {
							m.color = new THREE.Color(0xcccccc);
							m.roughness = 0.9;
						}
					}
				});
			}
		});
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

	<!-- Spinner de chargement du modèle GLB -->
	{#if isLoadingModel}
		<div class="absolute inset-0 bg-neutral-950/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-20 pointer-events-none">
			<div class="size-9 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
			<p class="text-xs text-neutral-300 font-medium">Chargement du modèle 3D .GLB...</p>
		</div>
	{/if}

	<!-- Badge Flottant HUD Polycount & Limite Roblox Studio -->
	<div class="absolute top-3 left-3 flex flex-wrap items-center gap-2 pointer-events-none z-10">
		<div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-900/80 backdrop-blur-md border border-neutral-700/60 text-xs font-medium text-neutral-200 shadow-lg">
			<span class="size-2 rounded-full {stats?.isRobloxOptimized !== false ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse"></span>
			<span>{stats?.triangles ?? 0} tris</span>
			<span class="text-neutral-500">•</span>
			<span>{stats?.partsCount ?? parts.length} pièces</span>
			<span class="text-neutral-500">•</span>
			<span class="{stats?.isRobloxOptimized !== false ? 'text-emerald-400' : 'text-amber-400'} font-semibold">
				{stats?.isRobloxOptimized !== false ? 'Roblox OK (< 10k)' : 'Haute Définition'}
			</span>
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
				Rendu Complet
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
