/**
 * Types & Définitions pour Aria 3D Studio (Low-Poly Engine & Blender Virtual Bridge)
 */

export type Primitive3DType =
	| 'cube'
	| 'cylinder'
	| 'cone'
	| 'sphere'
	| 'torus'
	| 'wedge'
	| 'pyramid'
	| 'mesh';

export interface Model3DPart {
	id: string;
	name: string;
	type: Primitive3DType;
	location: [number, number, number];
	rotation: [number, number, number]; // en degrés
	scale: [number, number, number];
	color: string; // format hex #RRGGBB ou nom
	roughness?: number;
	metalness?: number;
	emissive?: string;
	emissiveIntensity?: number;
	visible?: boolean;
	wireframe?: boolean;
}

export interface Model3DStats {
	triangles: number;
	vertices: number;
	partsCount: number;
	robloxCompatible: boolean;
	estimatedMemoryKb: number;
}

export interface Model3DProject {
	id: string;
	title: string;
	description: string;
	category: 'weapon' | 'vehicle' | 'building' | 'nature' | 'prop' | 'character' | 'scifi' | 'custom';
	pythonCode: string;
	parts: Model3DPart[];
	palette: string[];
	referenceImage?: string; // Data URL ou URL
	referenceDescription?: string;
	stats: Model3DStats;
	createdAt: number;
}

export type CameraPreset = 'perspective' | 'isometric' | 'top' | 'front' | 'side';

export type ShadingMode = 'flat' | 'wireframe' | 'clay' | 'roblox';

export type LightingPreset = 'studio' | 'sunset' | 'cyberpunk' | 'ambient';
