import * as THREE from 'three';
import type { Model3DPart, ShadingMode, Model3DStats } from './types';
import { getSemanticFallbackParts } from './archetypeParts';

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

	const vertices = new Float32Array([
		-w, -h, -d,   w, -h, -d,   w,  h, -d,
		-w, -h, -d,   w,  h, -d,  -w,  h, -d,
		-w, -h, -d,   w, -h,  d,   w, -h, -d,
		-w, -h, -d,  -w, -h,  d,   w, -h,  d,
		-w,  h, -d,   w,  h, -d,   w, -h,  d,
		-w,  h, -d,   w, -h,  d,  -w, -h,  d,
		-w, -h, -d,  -w,  h, -d,  -w, -h,  d,
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
			geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 10);
			break;
		case 'cone':
			geometry = new THREE.ConeGeometry(0.5, 1, 8);
			break;
		case 'pyramid':
			geometry = new THREE.ConeGeometry(0.7, 1, 4);
			break;
		case 'sphere':
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
		material = new THREE.MeshStandardMaterial({
			color: baseColor,
			roughness: 0.25,
			metalness: 0.1,
			flatShading: true,
			emissive: part.emissive ? new THREE.Color(part.emissive) : new THREE.Color(0x000000),
			emissiveIntensity: part.emissiveIntensity ?? 0.3
		});
	} else {
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

	mesh.position.set(part.location[0], part.location[1], part.location[2]);

	const degToRad = Math.PI / 180;
	mesh.rotation.set(
		part.rotation[0] * degToRad,
		part.rotation[1] * degToRad,
		part.rotation[2] * degToRad
	);

	mesh.scale.set(part.scale[0], part.scale[1], part.scale[2]);
	mesh.visible = part.visible !== false;

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
				tris = 40;
				verts = 22;
				break;
			case 'cone':
				tris = 16;
				verts = 10;
				break;
			case 'pyramid':
				tris = 8;
				verts = 5;
				break;
			case 'sphere':
				tris = 80;
				verts = 42;
				break;
			case 'torus':
				tris = 144;
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
 * Analyseur syntaxique robuste de scripts Python Blender (`bpy`).
 * Supporte les définitions multi-lignes, les dictionnaires et le fallback intelligent.
 */
export function parseBlenderScript(code: string): Model3DPart[] {
	if (!code || !code.trim()) {
		return getSemanticFallbackParts('sword');
	}

	// 1. Tenter d'extraire d'abord un manifeste JSON s'il est présent
	const jsonMatch = code.match(/```(?:json:3d_manifest|json:3d|json)\s*([\s\S]*?)```/);
	if (jsonMatch) {
		try {
			const data = JSON.parse(jsonMatch[1].trim());
			if (data.parts && Array.isArray(data.parts) && data.parts.length > 0) {
				return data.parts.map((p: any, idx: number) => ({
					id: `part_${Date.now()}_${idx + 1}`,
					name: p.name || `Piece_${idx + 1}`,
					type: p.type || 'cube',
					location: p.location || [0, 0, 0],
					rotation: p.rotation || [0, 0, 0],
					scale: p.scale || [1, 1, 1],
					color: p.color || '#4A90E2',
					roughness: p.roughness ?? 0.5,
					metalness: p.metalness ?? 0.1,
					visible: true
				}));
			}
		} catch (e) {}
	}

	const parts: Model3DPart[] = [];
	const fallbackColors = ['#B0C4DE', '#FFD700', '#5C3826', '#E50914', '#00E5FF', '#2ED573', '#FF7675', '#A29BFE'];

	// 2. Recherche multi-lignes de toutes les primitives Blender : primitive_*_add(...)
	const primRegex = /bpy\.ops\.mesh\.primitive_([a-zA-Z0-9_]+)_add\s*\(([\s\S]*?)\)/gi;
	const matches: Array<{ type: string; args: string; startIndex: number; endIndex: number }> = [];

	let match: RegExpExecArray | null;
	while ((match = primRegex.exec(code)) !== null) {
		matches.push({
			type: match[1],
			args: match[2],
			startIndex: match.index,
			endIndex: primRegex.lastIndex
		});
	}

	for (let i = 0; i < matches.length; i++) {
		const m = matches[i];
		const nextStart = i + 1 < matches.length ? matches[i + 1].startIndex : code.length;
		const trailingBlock = code.slice(m.endIndex, nextStart);
		const fullBlock = m.args + '\n' + trailingBlock;

		let partType: Model3DPart['type'] = 'cube';
		const rawType = m.type.toLowerCase();
		if (rawType.includes('cyl')) partType = 'cylinder';
		else if (rawType.includes('cone')) partType = 'cone';
		else if (rawType.includes('sphere')) partType = 'sphere';
		else if (rawType.includes('torus')) partType = 'torus';
		else if (rawType.includes('wedge')) partType = 'wedge';
		else if (rawType.includes('pyramid')) partType = 'pyramid';

		// Nom
		let name = `Piece_${i + 1}`;
		const nameMatch = trailingBlock.match(/\.name\s*=\s*["']([^"']+)["']/);
		if (nameMatch) {
			name = nameMatch[1];
			if (name.toLowerCase().includes('wedge')) partType = 'wedge';
			if (name.toLowerCase().includes('pyramid')) partType = 'pyramid';
		}

		// Position (location)
		let location: [number, number, number] = [0, 0, 0];
		const locMatch = fullBlock.match(/location\s*=\s*\(\s*([-\d.e]+)\s*,\s*([-\d.e]+)\s*,\s*([-\d.e]+)\s*\)/i);
		if (locMatch) {
			const bx = parseFloat(locMatch[1]) || 0;
			const by = parseFloat(locMatch[2]) || 0;
			const bz = parseFloat(locMatch[3]) || 0;

			// Blender (X, Y, Z Z-up) -> Three.js (X, Y, Z Y-up)
			if (bz !== 0) {
				location = [bx, bz, -by];
			} else {
				location = [bx, by, bz];
			}
		}

		// Rotation (rotation_euler)
		let rotation: [number, number, number] = [0, 0, 0];
		const rotMatch = fullBlock.match(/rotation(?:_euler)?\s*=\s*\(\s*([-\d.e]+)\s*,\s*([-\d.e]+)\s*,\s*([-\d.e]+)\s*\)/i);
		if (rotMatch) {
			const rx = parseFloat(rotMatch[1]) || 0;
			const ry = parseFloat(rotMatch[2]) || 0;
			const rz = parseFloat(rotMatch[3]) || 0;
			const toDeg = 180 / Math.PI;
			rotation = [rx * toDeg, rz * toDeg, -ry * toDeg];
		}

		// Échelle (scale)
		let scale: [number, number, number] = [1, 1, 1];
		const scaleMatch = fullBlock.match(/scale\s*=\s*\(\s*([-\d.e]+)\s*,\s*([-\d.e]+)\s*,\s*([-\d.e]+)\s*\)/i);
		if (scaleMatch) {
			const sx = Math.abs(parseFloat(scaleMatch[1]) || 1);
			const sy = Math.abs(parseFloat(scaleMatch[2]) || 1);
			const sz = Math.abs(parseFloat(scaleMatch[3]) || 1);
			scale = [sx, sz, sy];
		} else {
			const sizeMatch = m.args.match(/size\s*=\s*([-\d.e]+)/i);
			const radMatch = m.args.match(/radius(?:1)?\s*=\s*([-\d.e]+)/i);
			const depthMatch = m.args.match(/depth\s*=\s*([-\d.e]+)/i);
			if (sizeMatch) {
				const s = parseFloat(sizeMatch[1]) || 1;
				scale = [s, s, s];
			} else if (radMatch || depthMatch) {
				const r = (radMatch ? parseFloat(radMatch[1]) * 2 : 1) || 1;
				const d = (depthMatch ? parseFloat(depthMatch[1]) : 1) || 1;
				scale = [r, d, r];
			}
		}

		// Couleur
		let color = fallbackColors[i % fallbackColors.length];
		const colorMatch =
			fullBlock.match(/default_value\s*=\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i) ||
			fullBlock.match(/diffuse_color\s*=\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);

		if (colorMatch) {
			const r = Math.round(parseFloat(colorMatch[1]) * 255);
			const g = Math.round(parseFloat(colorMatch[2]) * 255);
			const b = Math.round(parseFloat(colorMatch[3]) * 255);
			const toHex = (c: number) => Math.max(0, Math.min(255, c)).toString(16).padStart(2, '0');
			color = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
		}

		const hexMatch = fullBlock.match(/(#[0-9A-Fa-f]{6})/);
		if (hexMatch) {
			color = hexMatch[1];
		}

		parts.push({
			id: `part_${Date.now()}_${i + 1}`,
			name,
			type: partType,
			location,
			rotation,
			scale,
			color,
			roughness: 0.5,
			metalness: 0.1,
			visible: true
		});
	}

	// 3. Filet de sécurité absolu : Si 0 pièces ont pu être extraites de la syntaxe,
	// activer le fallback sémantique pour que la scène 3D ne soit JAMAIS vide !
	if (parts.length === 0) {
		console.warn('Aria 3D: Fallback sémantique activé pour le script');
		return getSemanticFallbackParts(code);
	}

	return parts;
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

# 1. Nettoyage de la scène initiale
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
`;

	parts.forEach((part, idx) => {
		const varName = `obj_${idx + 1}`;
		const matName = `mat_${idx + 1}`;

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
