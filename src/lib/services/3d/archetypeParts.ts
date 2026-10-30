import type { Model3DPart } from './types';

// 1. Épée Royale Fantaisie
export const SWORD_PARTS: Model3DPart[] = [
	{ id: 'blade_main', name: 'Lame_Acier', type: 'cube', location: [0, 1.8, 0], rotation: [0, 0, 0], scale: [0.15, 2.6, 0.4], color: '#B0C4DE', roughness: 0.3, metalness: 0.8 },
	{ id: 'blade_tip', name: 'Pointe_Lame', type: 'pyramid', location: [0, 3.3, 0], rotation: [0, 45, 0], scale: [0.22, 0.6, 0.4], color: '#CFE2F3', roughness: 0.25, metalness: 0.85 },
	{ id: 'blade_core', name: 'Cristal_Energie', type: 'cube', location: [0, 1.6, 0], rotation: [0, 0, 0], scale: [0.05, 1.8, 0.1], color: '#00E5FF', roughness: 0.1, metalness: 0.2, emissive: '#00E5FF', emissiveIntensity: 0.6 },
	{ id: 'guard_center', name: 'Garde_Centrale', type: 'cube', location: [0, 0.4, 0], rotation: [0, 0, 0], scale: [0.4, 0.2, 0.6], color: '#FFD700', roughness: 0.35, metalness: 0.9 },
	{ id: 'guard_wing_l', name: 'Garde_Branche_G', type: 'cube', location: [0, 0.45, 0.55], rotation: [20, 0, 0], scale: [0.25, 0.16, 0.5], color: '#FFC700', roughness: 0.35, metalness: 0.9 },
	{ id: 'guard_wing_r', name: 'Garde_Branche_D', type: 'cube', location: [0, 0.45, -0.55], rotation: [-20, 0, 0], scale: [0.25, 0.16, 0.5], color: '#FFC700', roughness: 0.35, metalness: 0.9 },
	{ id: 'handle', name: 'Poignee_Cuir', type: 'cylinder', location: [0, -0.2, 0], rotation: [0, 0, 0], scale: [0.2, 0.9, 0.2], color: '#5C3826', roughness: 0.85, metalness: 0.05 },
	{ id: 'handle_ring', name: 'Bague_Poignee', type: 'torus', location: [0, -0.2, 0], rotation: [90, 0, 0], scale: [0.35, 0.35, 0.3], color: '#FFD700', roughness: 0.4, metalness: 0.85 },
	{ id: 'pommel_gem', name: 'Pommeau_Rubis', type: 'sphere', location: [0, -0.75, 0], rotation: [0, 0, 0], scale: [0.35, 0.45, 0.35], color: '#E50914', roughness: 0.15, metalness: 0.3, emissive: '#E50914', emissiveIntensity: 0.4 }
];

// 2. Voiture Low-Poly Cyberpunk
export const CAR_PARTS: Model3DPart[] = [
	{ id: 'car_chassis', name: 'Chassis_Base', type: 'cube', location: [0, 0.4, 0], rotation: [0, 0, 0], scale: [1.8, 0.45, 3.8], color: '#1A1C23', roughness: 0.4, metalness: 0.8 },
	{ id: 'car_cabin', name: 'Habitacle_Vitre', type: 'cube', location: [0, 0.8, -0.2], rotation: [-10, 0, 0], scale: [1.4, 0.55, 1.8], color: '#00F0FF', roughness: 0.1, metalness: 0.5, emissive: '#00F0FF', emissiveIntensity: 0.3 },
	{ id: 'car_spoiler', name: 'Aileron_Arriere', type: 'cube', location: [0, 0.85, -1.6], rotation: [5, 0, 0], scale: [1.7, 0.08, 0.4], color: '#FF0055', roughness: 0.3, metalness: 0.6 },
	{ id: 'car_spoiler_sup_l', name: 'Support_Aileron_G', type: 'cube', location: [0.6, 0.65, -1.6], rotation: [0, 0, 0], scale: [0.08, 0.35, 0.2], color: '#111216', roughness: 0.5, metalness: 0.5 },
	{ id: 'car_spoiler_sup_r', name: 'Support_Aileron_D', type: 'cube', location: [-0.6, 0.65, -1.6], rotation: [0, 0, 0], scale: [0.08, 0.35, 0.2], color: '#111216', roughness: 0.5, metalness: 0.5 },
	{ id: 'wheel_fl', name: 'Roue_Av_G', type: 'cylinder', location: [1.0, 0.35, 1.2], rotation: [0, 0, 90], scale: [0.7, 0.3, 0.7], color: '#2B2D35', roughness: 0.8, metalness: 0.2 },
	{ id: 'wheel_fr', name: 'Roue_Av_D', type: 'cylinder', location: [-1.0, 0.35, 1.2], rotation: [0, 0, 90], scale: [0.7, 0.3, 0.7], color: '#2B2D35', roughness: 0.8, metalness: 0.2 },
	{ id: 'wheel_rl', name: 'Roue_Ar_G', type: 'cylinder', location: [1.0, 0.38, -1.2], rotation: [0, 0, 90], scale: [0.76, 0.35, 0.76], color: '#2B2D35', roughness: 0.8, metalness: 0.2 },
	{ id: 'wheel_rr', name: 'Roue_Ar_D', type: 'cylinder', location: [-1.0, 0.38, -1.2], rotation: [0, 0, 90], scale: [0.76, 0.35, 0.76], color: '#2B2D35', roughness: 0.8, metalness: 0.2 },
	{ id: 'rim_fl', name: 'Jante_Av_G', type: 'cylinder', location: [1.12, 0.35, 1.2], rotation: [0, 0, 90], scale: [0.4, 0.08, 0.4], color: '#00F0FF', roughness: 0.2, metalness: 0.8, emissive: '#00F0FF', emissiveIntensity: 0.8 },
	{ id: 'rim_fr', name: 'Jante_Av_D', type: 'cylinder', location: [-1.12, 0.35, 1.2], rotation: [0, 0, 90], scale: [0.4, 0.08, 0.4], color: '#00F0FF', roughness: 0.2, metalness: 0.8, emissive: '#00F0FF', emissiveIntensity: 0.8 },
	{ id: 'headlight_l', name: 'Phare_Av_G', type: 'cube', location: [0.65, 0.45, 1.9], rotation: [0, 0, 0], scale: [0.35, 0.12, 0.1], color: '#FFE600', roughness: 0.1, metalness: 0.1, emissive: '#FFE600', emissiveIntensity: 1.0 },
	{ id: 'headlight_r', name: 'Phare_Av_D', type: 'cube', location: [-0.65, 0.45, 1.9], rotation: [0, 0, 0], scale: [0.35, 0.12, 0.1], color: '#FFE600', roughness: 0.1, metalness: 0.1, emissive: '#FFE600', emissiveIntensity: 1.0 },
	{ id: 'taillight', name: 'Bandeau_LED_Ar', type: 'cube', location: [0, 0.5, -1.9], rotation: [0, 0, 0], scale: [1.6, 0.08, 0.1], color: '#FF003C', roughness: 0.1, metalness: 0.1, emissive: '#FF003C', emissiveIntensity: 1.0 }
];

// 3. Maison Médiévale / Auberge
export const HOUSE_PARTS: Model3DPart[] = [
	{ id: 'stone_base', name: 'Base_Pierre', type: 'cube', location: [0, 0.9, 0], rotation: [0, 0, 0], scale: [2.6, 1.8, 2.4], color: '#7F8C8D', roughness: 0.85, metalness: 0.1 },
	{ id: 'wood_floor', name: 'Etage_Colombages', type: 'cube', location: [0, 2.3, 0], rotation: [0, 0, 0], scale: [2.8, 1.2, 2.6], color: '#FDFEFE', roughness: 0.7, metalness: 0.05 },
	{ id: 'beam_1', name: 'Poutre_Angle_1', type: 'cube', location: [1.38, 2.3, 1.28], rotation: [0, 0, 0], scale: [0.18, 1.25, 0.18], color: '#5A3825', roughness: 0.9, metalness: 0.0 },
	{ id: 'beam_2', name: 'Poutre_Angle_2', type: 'cube', location: [-1.38, 2.3, 1.28], rotation: [0, 0, 0], scale: [0.18, 1.25, 0.18], color: '#5A3825', roughness: 0.9, metalness: 0.0 },
	{ id: 'roof_l', name: 'Toit_Pente_G', type: 'cube', location: [0.8, 3.4, 0], rotation: [0, 0, -35], scale: [1.9, 0.15, 3.0], color: '#883A27', roughness: 0.75, metalness: 0.1 },
	{ id: 'roof_r', name: 'Toit_Pente_D', type: 'cube', location: [-0.8, 3.4, 0], rotation: [0, 0, 35], scale: [1.9, 0.15, 3.0], color: '#883A27', roughness: 0.75, metalness: 0.1 },
	{ id: 'roof_gable', name: 'Pignon_Toit', type: 'cone', location: [0, 3.4, 1.3], rotation: [0, 0, 0], scale: [2.0, 1.3, 0.1], color: '#684531', roughness: 0.85, metalness: 0.0 },
	{ id: 'chimney', name: 'Cheminee_Pierre', type: 'cube', location: [0.8, 3.8, -0.6], rotation: [0, 0, 0], scale: [0.55, 1.6, 0.55], color: '#596275', roughness: 0.9, metalness: 0.1 },
	{ id: 'door', name: 'Porte_Chene', type: 'cube', location: [0, 0.65, 1.22], rotation: [0, 0, 0], scale: [0.7, 1.3, 0.12], color: '#442817', roughness: 0.85, metalness: 0.1 },
	{ id: 'lantern', name: 'Lanterne_Nuit', type: 'sphere', location: [0.65, 1.3, 1.35], rotation: [0, 0, 0], scale: [0.22, 0.28, 0.22], color: '#FFA502', roughness: 0.2, metalness: 0.2, emissive: '#FFA502', emissiveIntensity: 0.9 }
];

// 4. Arbre Magique Stylisé Low-Poly
export const TREE_PARTS: Model3DPart[] = [
	{ id: 'trunk_base', name: 'Tronc_Racines', type: 'cylinder', location: [0, 0.8, 0], rotation: [0, 0, 3], scale: [0.75, 1.6, 0.75], color: '#5A3D28', roughness: 0.9, metalness: 0.05 },
	{ id: 'trunk_mid', name: 'Tronc_Superieur', type: 'cylinder', location: [0.1, 2.0, 0], rotation: [0, 0, -8], scale: [0.55, 1.2, 0.55], color: '#4E3420', roughness: 0.9, metalness: 0.05 },
	{ id: 'foliage_main', name: 'Feuillage_Majeur', type: 'sphere', location: [0, 3.2, 0], rotation: [15, 20, 0], scale: [2.2, 1.8, 2.2], color: '#2ED573', roughness: 0.6, metalness: 0.1 },
	{ id: 'foliage_top', name: 'Feuillage_Sommet', type: 'sphere', location: [0.2, 4.2, 0.1], rotation: [-25, 45, 10], scale: [1.6, 1.4, 1.6], color: '#7BED9F', roughness: 0.6, metalness: 0.1 },
	{ id: 'foliage_left', name: 'Feuillage_Branche_G', type: 'sphere', location: [-0.9, 2.7, 0.3], rotation: [10, -30, -20], scale: [1.3, 1.1, 1.3], color: '#10AC84', roughness: 0.6, metalness: 0.1 },
	{ id: 'foliage_right', name: 'Feuillage_Branche_D', type: 'sphere', location: [0.9, 2.9, -0.4], rotation: [20, 60, 25], scale: [1.2, 1.0, 1.2], color: '#2ED573', roughness: 0.6, metalness: 0.1 },
	{ id: 'mush_cap', name: 'Chapeau_Fonge_Magique', type: 'cone', location: [0.65, 0.28, 0.5], rotation: [10, 0, 15], scale: [0.35, 0.2, 0.35], color: '#FF4757', roughness: 0.3, metalness: 0.1, emissive: '#FF4757', emissiveIntensity: 0.6 },
	{ id: 'mush_stem', name: 'Pied_Champignon', type: 'cylinder', location: [0.62, 0.12, 0.48], rotation: [10, 0, 15], scale: [0.12, 0.25, 0.12], color: '#F1F2F6', roughness: 0.8, metalness: 0.05 }
];

// 5. Vaisseau Spatial Intercepteur Sci-Fi
export const STARFIGHTER_PARTS: Model3DPart[] = [
	{ id: 'ship_body', name: 'Fuselage_Central', type: 'cone', location: [0, 0.5, 0.5], rotation: [-90, 0, 0], scale: [0.9, 3.2, 0.6], color: '#2F3542', roughness: 0.4, metalness: 0.8 },
	{ id: 'ship_cockpit', name: 'Verriere_Cockpit', type: 'sphere', location: [0, 0.8, 0.3], rotation: [0, 0, 0], scale: [0.55, 0.35, 1.1], color: '#FFA502', roughness: 0.1, metalness: 0.3, emissive: '#FFA502', emissiveIntensity: 0.5 },
	{ id: 'wing_l', name: 'Aile_Delta_G', type: 'cube', location: [1.5, 0.45, -0.4], rotation: [0, 25, 5], scale: [2.2, 0.08, 1.2], color: '#3742FA', roughness: 0.35, metalness: 0.7 },
	{ id: 'wing_r', name: 'Aile_Delta_D', type: 'cube', location: [-1.5, 0.45, -0.4], rotation: [0, -25, -5], scale: [2.2, 0.08, 1.2], color: '#3742FA', roughness: 0.35, metalness: 0.7 },
	{ id: 'thruster_l', name: 'Reacteur_G', type: 'cylinder', location: [0.55, 0.48, -1.2], rotation: [90, 0, 0], scale: [0.4, 0.9, 0.4], color: '#1E272E', roughness: 0.5, metalness: 0.9 },
	{ id: 'thruster_r', name: 'Reacteur_D', type: 'cylinder', location: [-0.55, 0.48, -1.2], rotation: [90, 0, 0], scale: [0.4, 0.9, 0.4], color: '#1E272E', roughness: 0.5, metalness: 0.9 },
	{ id: 'plasma_l', name: 'Tuyere_Plasma_G', type: 'cone', location: [0.55, 0.48, -1.8], rotation: [90, 0, 0], scale: [0.25, 0.7, 0.25], color: '#00D2D3', roughness: 0.1, metalness: 0.1, emissive: '#00D2D3', emissiveIntensity: 1.0 },
	{ id: 'plasma_r', name: 'Tuyere_Plasma_D', type: 'cone', location: [-0.55, 0.48, -1.8], rotation: [90, 0, 0], scale: [0.25, 0.7, 0.25], color: '#00D2D3', roughness: 0.1, metalness: 0.1, emissive: '#00D2D3', emissiveIntensity: 1.0 }
];

// 6. Coffre d'Aventure RPG
export const CHEST_PARTS: Model3DPart[] = [
	{ id: 'chest_base', name: 'Cuve_Bois', type: 'cube', location: [0, 0.55, 0], rotation: [0, 0, 0], scale: [1.8, 1.1, 1.2], color: '#684531', roughness: 0.85, metalness: 0.05 },
	{ id: 'chest_lid', name: 'Couvercle_Cintre', type: 'cylinder', location: [0, 1.1, 0], rotation: [0, 0, 90], scale: [1.2, 1.82, 1.2], color: '#7A5239', roughness: 0.85, metalness: 0.05 },
	{ id: 'strap_l', name: 'Cerclage_Fer_G', type: 'cube', location: [0.55, 0.55, 0], rotation: [0, 0, 0], scale: [0.15, 1.14, 1.24], color: '#2F3640', roughness: 0.45, metalness: 0.9 },
	{ id: 'strap_r', name: 'Cerclage_Fer_D', type: 'cube', location: [-0.55, 0.55, 0], rotation: [0, 0, 0], scale: [0.15, 1.14, 1.24], color: '#2F3640', roughness: 0.45, metalness: 0.9 },
	{ id: 'lock_plate', name: 'Serrure_Laiton', type: 'cube', location: [0, 0.95, 0.62], rotation: [0, 0, 0], scale: [0.35, 0.45, 0.08], color: '#FFD700', roughness: 0.3, metalness: 0.9 },
	{ id: 'keyhole', name: 'Trou_Cle', type: 'cylinder', location: [0, 0.92, 0.67], rotation: [90, 0, 0], scale: [0.08, 0.05, 0.08], color: '#1E272E', roughness: 0.9, metalness: 0.1 }
];

export function getSemanticFallbackParts(text: string): Model3DPart[] {
	const lower = (text || '').toLowerCase();
	if (
		lower.includes('épée') ||
		lower.includes('epee') ||
		lower.includes('sword') ||
		lower.includes('blade') ||
		lower.includes('lame') ||
		lower.includes('dague') ||
		lower.includes('hache') ||
		lower.includes('arme')
	) {
		return structuredClone(SWORD_PARTS);
	}
	if (
		lower.includes('voiture') ||
		lower.includes('car') ||
		lower.includes('véhicule') ||
		lower.includes('vehicule') ||
		lower.includes('auto') ||
		lower.includes('cyber') ||
		lower.includes('moto')
	) {
		return structuredClone(CAR_PARTS);
	}
	if (
		lower.includes('maison') ||
		lower.includes('house') ||
		lower.includes('château') ||
		lower.includes('chateau') ||
		lower.includes('bâtiment') ||
		lower.includes('donjon') ||
		lower.includes('auberge')
	) {
		return structuredClone(HOUSE_PARTS);
	}
	if (
		lower.includes('arbre') ||
		lower.includes('tree') ||
		lower.includes('nature') ||
		lower.includes('forêt') ||
		lower.includes('foret') ||
		lower.includes('plante') ||
		lower.includes('champignon')
	) {
		return structuredClone(TREE_PARTS);
	}
	if (
		lower.includes('vaisseau') ||
		lower.includes('ship') ||
		lower.includes('fusée') ||
		lower.includes('fusee') ||
		lower.includes('espace') ||
		lower.includes('scifi') ||
		lower.includes('sci-fi') ||
		lower.includes('avion')
	) {
		return structuredClone(STARFIGHTER_PARTS);
	}
	if (
		lower.includes('coffre') ||
		lower.includes('chest') ||
		lower.includes('trésor') ||
		lower.includes('tresor') ||
		lower.includes('loot') ||
		lower.includes('boite')
	) {
		return structuredClone(CHEST_PARTS);
	}
	return structuredClone(SWORD_PARTS);
}
