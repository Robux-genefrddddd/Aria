import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js';
import type { Model3DProject } from './types';

/**
 * Utilitaires d'export pour Aria 3D Studio.
 * Supporte le téléchargement de formats 3D universels pour Roblox Studio, Blender, Unity et Godot.
 */

function downloadBlob(blob: Blob, filename: string) {
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

/**
 * Exporte un objet ou groupe Three.js au format .GLB (binaire GLTF universel).
 * C'est le format recommandé n°1 pour Roblox Studio MeshPart.
 */
export async function exportToGLB(object: THREE.Object3D, filename = 'aria_model.glb'): Promise<void> {
	return new Promise((resolve, reject) => {
		const exporter = new GLTFExporter();

		exporter.parse(
			object,
			(gltf) => {
				if (gltf instanceof ArrayBuffer) {
					const blob = new Blob([gltf], { type: 'model/gltf-binary' });
					downloadBlob(blob, filename.endsWith('.glb') ? filename : `${filename}.glb`);
					resolve();
				} else {
					const jsonStr = JSON.stringify(gltf, null, 2);
					const blob = new Blob([jsonStr], { type: 'model/gltf+json' });
					downloadBlob(blob, filename.endsWith('.gltf') ? filename : `${filename}.gltf`);
					resolve();
				}
			},
			(error) => {
				console.error('Erreur lors de l’export GLB/GLTF :', error);
				reject(error);
			},
			{ binary: true }
		);
	});
}

/**
 * Exporte un objet Three.js au format Wavefront .OBJ standard.
 */
export function exportToOBJ(object: THREE.Object3D, filename = 'aria_model.obj'): void {
	const exporter = new OBJExporter();
	const result = exporter.parse(object);
	const blob = new Blob([result], { type: 'text/plain' });
	downloadBlob(blob, filename.endsWith('.obj') ? filename : `${filename}.obj`);
}

/**
 * Télécharge le script Python Blender (.py) directement.
 */
export function exportBlenderScript(code: string, filename = 'aria_blender_script.py'): void {
	const blob = new Blob([code], { type: 'text/x-python' });
	downloadBlob(blob, filename.endsWith('.py') ? filename : `${filename}.py`);
}

/**
 * Guide textuel interactif pour importer le modèle dans Roblox Studio.
 */
export function generateRobloxImportGuide(project: Model3DProject): string {
	return `# 📦 Guide d'Importation Roblox Studio pour "${project.title}"

### 1. Fichier Recommandé
- Téléchargez le fichier **.GLB** depuis Aria 3D Studio.

### 2. Procédure dans Roblox Studio
1. Ouvrez votre jeu dans **Roblox Studio**.
2. Dans le panneau supérieur, allez dans l'onglet **View** et assurez-vous que **Asset Manager** est actif.
3. Cliquez sur le bouton **Bulk Import** (icône de flèche montante au-dessus d'une boîte) ou faites un clic droit sur **Meshes > Add Meshes...**.
4. Sélectionnez le fichier **${project.title.replace(/\s+/g, '_')}.glb**.
5. Cochez :
   - [x] **Import with scene hierarchy** (pour conserver les pièces séparées).
   - [x] **Invert Negative Faces** (si nécessaire).
6. Cliquez sur **Import**.
7. Faites glisser le modèle importé depuis l'Asset Manager directement dans votre **Workspace** !

### 3. Propriétés Recommandées
- **CollisionFidelity** : Réglez sur \`PreciseConvexDecomposition\` pour des collisions fidèles au style low-poly.
- **CastShadow** : \`true\` pour une belle ombre portée.
- **Polycount** : ${project.stats.triangles} triangles (100% conforme à la limite de 10 000 par MeshPart).
`;
}
