import * as THREE from 'three';
import type { Model3DPart, Model3DProject, Model3DStats, ShadingMode } from './types';

/**
 * Moteur Virtuel Blender pour Aria 3D Studio.
 * Exécute et interprète les scripts Python Blender (`bpy`) directement dans Three.js
 * avec un rendu stylisé Low-Poly optimisé pour Roblox Studio.
 */

// Crée une géométrie de prisme triangulaire (Wedge Roblox standard)
function createWedgeGeometry(width = 1, height = 1, depth = 1): THREE.BufferGeometry {
	const w = width / 2;
	const h = height / 2;
	const d = depth / 2;

	// 5 faces : base, dos, pente, 2 côtés triangulaires
	const vertices = new Float32Array([
		// Face arrière (rectangle vertical)
		-w, -h, -d,   w, -h, -d,   w,  h, -d,
		-w, -h, -d,   w,  h, -d,  -w,  h, -d,

		// Base inférieure (rectangle horizontal)
		-w, -h, -d,   w, -h,  d,   w, -h, -d,
		-w, -h, -d,  -w, -h,  d,   w, -h,  d,

		// Face inclinée / Pente
		-w,  h, -d,   w,  h, -d,   w, -h,  d,
		-w,  h, -d,   w, -h,  d,  -w, -h,  d,

		// Côté gauche (triangle)
		-w, -h, -d,  -w,  h, -d,  -w, -h,  d,

		// Côté droit (triangle)
		 w, -h, -d,   w, -h,  d,   w,  h, -d
	]);

	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
	geometry.computeVertexNormals();
	return geometry;
}

/**
 * Crée un objet Mesh Three.js low-poly à partir d'une définition de pièce.
 */
export function createPartMesh(part: Model3DPart, mode: ShadingMode = 'flat'): THREE.Mesh {
	let geometry: THREE.BufferGeometry;

	switch (part.type) {
		case 'cube':
			geometry = new THREE.BoxGeometry(1, 1, 1);
			break;
		case 'cylinder':
			// 10-12 segments pour un rendu low-poly facetté ultra net
			geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 10);
			break;
		case 'cone':
			geometry = new THREE.ConeGeometry(0.5, 1, 8);
			break;
		case 'pyramid':
			geometry = new THREE.ConeGeometry(0.7, 1, 4);
			break;
		case 'sphere':
			// Icosaèdre pour les sphères facettées stylisées low-poly
			geometry = new THREE.IcosahedronGeometry(0.5, 1);
			break;
		case 'torus':
			geometry = new THREE.TorusGeometry(0.5, 0.2, 6, 12);
			break;
		case 'wedge':
			geometry = createWedgeGeometry(1, 1, 1);
			break;
		default:
			geometry = new THREE.BoxGeometry(1, 1, 1);
	}

	let material: THREE.Material;

	const baseColor = new THREE.Color(part.color || '#888888');

	if (mode === 'wireframe') {
		material = new THREE.MeshBasicMaterial({
			color: baseColor,
			wireframe: true
		});
	} else if (mode === 'clay') {
		material = new THREE.MeshStandardMaterial({
			color: '#E0E0E0',
			roughness: 0.9,
			metalness: 0.05,
			flatShading: true
		});
	} else if (mode === 'roblox') {
		// Style Roblox plastique saturé / néon si spécifié
		material = new THREE.MeshStandardMaterial({
			color: baseColor,
			roughness: 0.25,
			metalness: 0.1,
			flatShading: true,
			emissive: part.emissive ? new THREE.Color(part.emissive) : new THREE.Color(0x000000),
			emissiveIntensity: part.emissiveIntensity ?? 0.3
		});
	} else {
		// Rendu Flat Shading Low-Poly Signature
		material = new THREE.MeshStandardMaterial({
			color: baseColor,
			roughness: part.roughness ?? 0.55,
			metalness: part.metalness ?? 0.15,
			flatShading: true,
			emissive: part.emissive ? new THREE.Color(part.emissive) : new THREE.Color(0x000000),
			emissiveIntensity: part.emissiveIntensity ?? 0
		});
	}

	const mesh = new THREE.Mesh(geometry, material);
	mesh.name = part.name;
	mesh.castShadow = true;
	mesh.receiveShadow = true;

	// Positions
	mesh.position.set(part.location[0], part.location[1], part.location[2]);

	// Rotations (conversion degrés -> radians)
	const degToRad = Math.PI / 180;
	mesh.rotation.set(
		part.rotation[0] * degToRad,
		part.rotation[1] * degToRad,
		part.rotation[2] * degToRad
	);

	// Échelles
	mesh.scale.set(part.scale[0], part.scale[1], part.scale[2]);

	// Visibilité
	mesh.visible = part.visible !== false;

	// Stocker les métadonnées sur l'objet Three.js
	mesh.userData = {
		partId: part.id,
		partName: part.name,
		type: part.type,
		color: part.color
	};

	return mesh;
}

/**
 * Construit un Three.Group contenant l'ensemble des pièces 3D.
 */
export function buildSceneGroup(parts: Model3DPart[], mode: ShadingMode = 'flat'): THREE.Group {
	const group = new THREE.Group();
	group.name = 'Aria3D_ModelRoot';

	for (const part of parts) {
		const mesh = createPartMesh(part, mode);
		group.add(mesh);
	}

	return group;
}

/**
 * Calcule avec précision le polycount (triangles et sommets) et la compatibilité Roblox.
 */
export function calculateModelStats(parts: Model3DPart[]): Model3DStats {
	let totalTriangles = 0;
	let totalVertices = 0;

	for (const part of parts) {
		let tris = 12;
		let verts = 8;

		switch (part.type) {
			case 'cube':
				tris = 12;
				verts = 8;
				break;
			case 'cylinder':
				tris = 10 * 4; // 10 segments * (2 côtés + 2 bouchons) = ~40 tris
				verts = 22;
				break;
			case 'cone':
				tris = 8 * 2; // ~16 tris
				verts = 10;
				break;
			case 'pyramid':
				tris = 4 * 2; // ~8 tris
				verts = 5;
				break;
			case 'sphere':
				tris = 80; // Icosaèdre subd 1
				verts = 42;
				break;
			case 'torus':
				tris = 6 * 12 * 2; // ~144 tris
				verts = 72;
				break;
			case 'wedge':
				tris = 8;
				verts = 6;
				break;
			default:
				tris = 12;
				verts = 8;
		}

		totalTriangles += tris;
		totalVertices += verts;
	}

	// Limite Roblox MeshPart = 10 000 triangles max par mesh
	const robloxCompatible = totalTriangles <= 10000;
	const estimatedMemoryKb = Math.round((totalVertices * 32 + totalTriangles * 12) / 1024);

	return {
		triangles: totalTriangles,
		vertices: totalVertices,
		partsCount: parts.length,
		robloxCompatible,
		estimatedMemoryKb: Math.max(1, estimatedMemoryKb)
	};
}

/**
 * Convertit un vecteur RGB (0.0 - 1.0) Blender en code HEX standard (#RRGGBB).
 */
function rgbToHex(r: number, g: number, b: number): string {
	const toHex = (c: number) => {
		const clamped = Math.max(0, Math.min(255, Math.round(c * 255)));
		return clamped.toString(16).padStart(2, '0');
	};
	return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Analyseur syntaxique de scripts Python Blender (`bpy`).
 * Reconstitue les formes 3D, positions, rotations, échelles et couleurs.
 */
export function parseBlenderScript(code: string): Model3DPart[] {
	const parts: Model3DPart[] = [];
	const lines = code.split('\n');

	let currentPart: Partial<Model3DPart> | null = null;
	let currentPartIndex = 1;

	// Palette de secours pour les pièces sans couleur définie
	const fallbackColors = ['#4A90E2', '#50E3C2', '#F5A623', '#D0021B', '#9013FE', '#B8E986'];

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim();

		// Détection de primitive_cube_add, cylinder_add, etc.
		const cubeMatch = line.match(/bpy\.ops\.mesh\.primitive_cube_add\((.*?)\)/);
		const cylMatch = line.match(/bpy\.ops\.mesh\.primitive_cylinder_add\((.*?)\)/);
		const coneMatch = line.match(/bpy\.ops\.mesh\.primitive_cone_add\((.*?)\)/);
		const sphereMatch = line.match(/bpy\.ops\.mesh\.primitive_uv_sphere_add\((.*?)\)/) || line.match(/primitive_ico_sphere_add\((.*?)\)/);
		const torusMatch = line.match(/bpy\.ops\.mesh\.primitive_torus_add\((.*?)\)/);

		if (cubeMatch || cylMatch || coneMatch || sphereMatch || torusMatch) {
			if (currentPart && currentPart.name) {
				parts.push(finalizePart(currentPart, currentPartIndex++));
			}

			let type: Model3DPart['type'] = 'cube';
			let paramsStr = '';

			if (cubeMatch) {
				type = 'cube';
				paramsStr = cubeMatch[1];
			} else if (cylMatch) {
				type = 'cylinder';
				paramsStr = cylMatch[1];
			} else if (coneMatch) {
				type = 'cone';
				paramsStr = coneMatch[1];
			} else if (sphereMatch) {
				type = 'sphere';
				paramsStr = sphereMatch[1];
			} else if (torusMatch) {
				type = 'torus';
				paramsStr = torusMatch[1];
			}

			currentPart = {
				id: `part_${Date.now()}_${currentPartIndex}`,
				name: `Part_${type}_${currentPartIndex}`,
				type,
				location: [0, 0, 0],
				rotation: [0, 0, 0],
				scale: [1, 1, 1],
				color: fallbackColors[(currentPartIndex - 1) % fallbackColors.length],
				roughness: 0.5,
				metalness: 0.1,
				visible: true
			};

			// Extraction des paramètres inline comme location=(x, y, z)
			const locInline = paramsStr.match(/location\s*=\s*\(([^)]+)\)/);
			if (locInline) {
				const coords = locInline[1].split(',').map((n) => parseFloat(n.trim()) || 0);
				if (coords.length >= 3) currentPart.location = [coords[0], coords[2], -coords[1]]; // Blender Z-up to Three.js Y-up
			}

			const rotInline = paramsStr.match(/rotation\s*=\s*\(([^)]+)\)/);
			if (rotInline) {
				const rads = rotInline[1].split(',').map((n) => parseFloat(n.trim()) || 0);
				if (rads.length >= 3) {
					const toDeg = 180 / Math.PI;
					currentPart.rotation = [rads[0] * toDeg, rads[2] * toDeg, -rads[1] * toDeg];
				}
			}

			const scaleInline = paramsStr.match(/scale\s*=\s*\(([^)]+)\)/);
			if (scaleInline) {
				const sc = scaleInline[1].split(',').map((n) => parseFloat(n.trim()) || 1);
				if (sc.length >= 3) currentPart.scale = [sc[0], sc[2], sc[1]];
			}

			continue;
		}

		if (!currentPart) continue;

		// Détection du nom : obj.name = "Blade" ou active_object.name = "Roof"
		const nameMatch = line.match(/\.name\s*=\s*["']([^"']+)["']/);
		if (nameMatch) {
			currentPart.name = nameMatch[1];
			// Spécial : si le nom contient "wedge" ou "slope", assigner le type wedge
			if (currentPart.name.toLowerCase().includes('wedge') || currentPart.name.toLowerCase().includes('pente')) {
				currentPart.type = 'wedge';
			} else if (currentPart.name.toLowerCase().includes('pyramid')) {
				currentPart.type = 'pyramid';
			}
		}

		// Détection de la position : location = (x, y, z) ou obj.location.x = ...
		const locMatch = line.match(/\.location\s*=\s*\(([^)]+)\)/);
		if (locMatch) {
			const coords = locMatch[1].split(',').map((n) => parseFloat(n.trim()) || 0);
			if (coords.length >= 3) {
				// Blender (X, Y, Z Z-up) -> Three.js (X, Z, -Y Y-up)
				currentPart.location = [coords[0], coords[2], -coords[1]];
			}
		}

		// Détection de la rotation : rotation_euler = (rx, ry, rz)
		const rotMatch = line.match(/\.rotation_euler\s*=\s*\(([^)]+)\)/);
		if (rotMatch) {
			const rads = rotMatch[1].split(',').map((n) => parseFloat(n.trim()) || 0);
			if (rads.length >= 3) {
				const toDeg = 180 / Math.PI;
				currentPart.rotation = [rads[0] * toDeg, rads[2] * toDeg, -rads[1] * toDeg];
			}
		}

		// Détection de l'échelle : scale = (sx, sy, sz)
		const scaleMatch = line.match(/\.scale\s*=\s*\(([^)]+)\)/);
		if (scaleMatch) {
			const sc = scaleMatch[1].split(',').map((n) => parseFloat(n.trim()) || 1);
			if (sc.length >= 3) {
				currentPart.scale = [Math.abs(sc[0]), Math.abs(sc[2]), Math.abs(sc[1])];
			}
		}

		// Détection des couleurs : inputs['Base Color'].default_value = (r, g, b, 1.0)
		const colorMatch = line.match(/default_value\s*=\s*\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/) ||
			line.match(/diffuse_color\s*=\s*\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/);

		if (colorMatch) {
			const r = parseFloat(colorMatch[1]);
			const g = parseFloat(colorMatch[2]);
			const b = parseFloat(colorMatch[3]);
			currentPart.color = rgbToHex(r, g, b);
		}

		// Détection de couleur Hex éventuelle : #RRGGBB dans un commentaire ou chaîne
		const hexMatch = line.match(/(#[0-9A-Fa-f]{6})/);
		if (hexMatch) {
			currentPart.color = hexMatch[1];
		}

		// Détection de roughness / metalness
		if (line.includes('Metallic') || line.includes('metallic')) {
			const m = line.match(/default_value\s*=\s*([\d.]+)/);
			if (m) currentPart.metalness = parseFloat(m[1]);
		}
		if (line.includes('Roughness') || line.includes('roughness')) {
			const m = line.match(/default_value\s*=\s*([\d.]+)/);
			if (m) currentPart.roughness = parseFloat(m[1]);
		}
		if (line.includes('Emission') || line.includes('emissive')) {
			currentPart.emissive = currentPart.color;
			currentPart.emissiveIntensity = 0.5;
		}
	}

	if (currentPart && currentPart.name) {
		parts.push(finalizePart(currentPart, currentPartIndex++));
	}

	return parts;
}

function finalizePart(raw: Partial<Model3DPart>, index: number): Model3DPart {
	return {
		id: raw.id || `part_${Date.now()}_${index}`,
		name: raw.name || `Piece_${index}`,
		type: raw.type || 'cube',
		location: raw.location || [0, 0, 0],
		rotation: raw.rotation || [0, 0, 0],
		scale: raw.scale || [1, 1, 1],
		color: raw.color || '#4A90E2',
		roughness: raw.roughness ?? 0.5,
		metalness: raw.metalness ?? 0.1,
		emissive: raw.emissive,
		emissiveIntensity: raw.emissiveIntensity,
		visible: raw.visible ?? true
	};
}

/**
 * Génère un script Python Blender 4.x/5.x officiel et propre à partir des pièces.
 */
export function generateBlenderPythonScript(title: string, parts: Model3DPart[]): string {
	let py = `"""
=============================================================================
Aria 3D Studio - Blender Python Script (bpy)
Modèle : ${title}
Généré pour : Roblox Studio (Low-Poly / Stylized MeshPart)
Instructions : Ouvrez Blender > Scripting > Nouveau > Collez et appuyez sur Run (Alt+P)
=============================================================================
"""

import bpy
import math

# 1. Nettoyage de la scène initiale (cube et caméras par défaut)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

# 2. Création de la collection dédiée
collection_name = "${title.replace(/[^a-zA-Z0-9_]/g, '_')}_Model"
model_col = bpy.data.collections.new(collection_name)
bpy.context.scene.collection.children.link(model_col)
bpy.context.view_layer.active_layer_collection = bpy.context.view_layer.layer_collection.children[collection_name]

# Helper pour créer un matériau Principled BSDF coloré
def create_material(name, hex_color, roughness=0.5, metalness=0.1, is_emission=False):
    mat = bpy.data.materials.new(name=f"Mat_{name}")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    
    # Conversion Hex -> RGB float (0.0 - 1.0)
    hex_clean = hex_color.lstrip('#')
    r = int(hex_clean[0:2], 16) / 255.0
    g = int(hex_clean[2:4], 16) / 255.0
    b = int(hex_clean[4:6], 16) / 255.0
    
    if bsdf:
        bsdf.inputs['Base Color'].default_value = (r, g, b, 1.0)
        bsdf.inputs['Roughness'].default_value = roughness
        bsdf.inputs['Metallic'].default_value = metalness
        if is_emission:
            try:
                bsdf.inputs['Emission Color'].default_value = (r, g, b, 1.0)
                bsdf.inputs['Emission Strength'].default_value = 2.0
            except:
                pass
    return mat

deg_to_rad = math.pi / 180.0
`;

	parts.forEach((part, idx) => {
		const varName = `obj_${idx + 1}`;
		const matName = `mat_${idx + 1}`;

		// Conversion Three.js Y-up -> Blender Z-up
		const bx = part.location[0].toFixed(3);
		const by = (-part.location[2]).toFixed(3);
		const bz = part.location[1].toFixed(3);

		const rx = (part.rotation[0] * (Math.PI / 180)).toFixed(3);
		const ry = (-(part.rotation[2]) * (Math.PI / 180)).toFixed(3);
		const rz = (part.rotation[1] * (Math.PI / 180)).toFixed(3);

		const sx = part.scale[0].toFixed(3);
		const sy = part.scale[2].toFixed(3);
		const sz = part.scale[1].toFixed(3);

		py += `\n# --- Pièce : ${part.name} (${part.type}) ---\n`;

		switch (part.type) {
			case 'cylinder':
				py += `bpy.ops.mesh.primitive_cylinder_add(vertices=10, radius=0.5, depth=1.0, location=(${bx}, ${by}, ${bz}))\n`;
				break;
			case 'cone':
			case 'pyramid':
				const segs = part.type === 'pyramid' ? 4 : 8;
				py += `bpy.ops.mesh.primitive_cone_add(vertices=${segs}, radius1=0.5, depth=1.0, location=(${bx}, ${by}, ${bz}))\n`;
				break;
			case 'sphere':
				py += `bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.5, location=(${bx}, ${by}, ${bz}))\n`;
				break;
			case 'torus':
				py += `bpy.ops.mesh.primitive_torus_add(major_segments=12, minor_segments=6, major_radius=0.5, minor_radius=0.2, location=(${bx}, ${by}, ${bz}))\n`;
				break;
			default:
				py += `bpy.ops.mesh.primitive_cube_add(size=1.0, location=(${bx}, ${by}, ${bz}))\n`;
		}

		py += `${varName} = bpy.context.active_object\n`;
		py += `${varName}.name = "${part.name}"\n`;
		py += `${varName}.rotation_euler = (${rx}, ${ry}, ${rz})\n`;
		py += `${varName}.scale = (${sx}, ${sy}, ${sz})\n`;
		py += `bpy.ops.object.shade_flat()\n`;

		const isEmission = !!part.emissive;
		py += `${matName} = create_material("${part.name}", "${part.color}", roughness=${part.roughness ?? 0.5}, metalness=${part.metalness ?? 0.1}, is_emission=${isEmission})\n`;
		py += `${varName}.data.materials.append(${matName})\n`;
	});

	py += `\n# 3. Finalisation pour export Roblox MeshPart\n`;
	py += `bpy.ops.object.select_all(action='SELECT')\n`;
	py += `print("✨ Modèle '${title}' généré avec succès dans Blender !")\n`;

	return py;
}
