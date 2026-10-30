import type { Model3DProject } from './types';
import { generateBlenderPythonScript, calculateModelStats } from './virtualBlenderEngine';

/**
 * Archétypes 3D Low-Poly d'élite pour Aria 3D Studio.
 * Conçus pour Roblox Studio et le style Low-Poly RPG moderne.
 */

// 1. Épée Royale Fantaisie
const SWORD_PARTS = [
	// Lame principale (Cube étiré & affûté)
	{ id: 'blade_main', name: 'Lame_Acier', type: 'cube' as const, location: [0, 1.8, 0] as [number, number, number], rotation: [0, 0, 0] as [number, number, number], scale: [0.15, 2.6, 0.4] as [number, number, number], color: '#B0C4DE', roughness: 0.3, metalness: 0.8 },
	// Pointe de la lame (Pyramide/Cone facetté)
	{ id: 'blade_tip', name: 'Pointe_Lame', type: 'pyramid' as const, location: [0, 3.3, 0] as [number, number, number], rotation: [0, 45, 0] as [number, number, number], scale: [0.22, 0.6, 0.4] as [number, number, number], color: '#CFE2F3', roughness: 0.25, metalness: 0.85 },
	// Rainure d'énergie centrale (Néon cyan)
	{ id: 'blade_core', name: 'Cristal_Energie', type: 'cube' as const, location: [0, 1.6, 0] as [number, number, number], rotation: [0, 0, 0] as [number, number, number], scale: [0.05, 1.8, 0.1] as [number, number, number], color: '#00E5FF', roughness: 0.1, metalness: 0.2, emissive: '#00E5FF', emissiveIntensity: 0.6 },
	// Garde dorée centrale
	{ id: 'guard_center', name: 'Garde_Centrale', type: 'cube' as const, location: [0, 0.4, 0] as [number, number, number], rotation: [0, 0, 0] as [number, number, number], scale: [0.4, 0.2, 0.6] as [number, number, number], color: '#FFD700', roughness: 0.35, metalness: 0.9 },
	// Garde branche gauche
	{ id: 'guard_wing_l', name: 'Garde_Branche_G', type: 'cube' as const, location: [0, 0.45, 0.55] as [number, number, number], rotation: [20, 0, 0] as [number, number, number], scale: [0.25, 0.16, 0.5] as [number, number, number], color: '#FFC700', roughness: 0.35, metalness: 0.9 },
	// Garde branche droite
	{ id: 'guard_wing_r', name: 'Garde_Branche_D', type: 'cube' as const, location: [0, 0.45, -0.55] as [number, number, number], rotation: [-20, 0, 0] as [number, number, number], scale: [0.25, 0.16, 0.5] as [number, number, number], color: '#FFC700', roughness: 0.35, metalness: 0.9 },
	// Poignée en cuir
	{ id: 'handle', name: 'Poignee_Cuir', type: 'cylinder' as const, location: [0, -0.2, 0] as [number, number, number], rotation: [0, 0, 0] as [number, number, number], scale: [0.2, 0.9, 0.2] as [number, number, number], color: '#5C3826', roughness: 0.85, metalness: 0.05 },
	// Anneau poignée or
	{ id: 'handle_ring', name: 'Bague_Poignee', type: 'torus' as const, location: [0, -0.2, 0] as [number, number, number], rotation: [90, 0, 0] as [number, number, number], scale: [0.35, 0.35, 0.3] as [number, number, number], color: '#FFD700', roughness: 0.4, metalness: 0.85 },
	// Pommeau en gemme rubis facetté
	{ id: 'pommel_gem', name: 'Pommeau_Rubis', type: 'sphere' as const, location: [0, -0.75, 0] as [number, number, number], rotation: [0, 0, 0] as [number, number, number], scale: [0.35, 0.45, 0.35] as [number, number, number], color: '#E50914', roughness: 0.15, metalness: 0.3, emissive: '#E50914', emissiveIntensity: 0.4 }
];

// 2. Voiture Low-Poly Cyberpunk
const CAR_PARTS = [
	// Châssis principal bas
	{ id: 'car_chassis', name: 'Chassis_Base', type: 'cube' as const, location: [0, 0.4, 0] as [number, number, number], rotation: [0, 0, 0] as [number, number, number], scale: [1.8, 0.45, 3.8] as [number, number, number], color: '#1A1C23', roughness: 0.4, metalness: 0.8 },
	// Habitacle / Pare-brise facetté
	{ id: 'car_cabin', name: 'Habitacle_Vitre', type: 'cube' as const, location: [0, 0.8, -0.2] as [number, number, number], rotation: [-10, 0, 0] as [number, number, number], scale: [1.4, 0.55, 1.8] as [number, number, number], color: '#00F0FF', roughness: 0.1, metalness: 0.5, emissive: '#00F0FF', emissiveIntensity: 0.3 },
	// Aileron arrière sport
	{ id: 'car_spoiler', name: 'Aileron_Arriere', type: 'cube' as const, location: [0, 0.85, -1.6] as [number, number, number], rotation: [5, 0, 0] as [number, number, number], scale: [1.7, 0.08, 0.4] as [number, number, number], color: '#FF0055', roughness: 0.3, metalness: 0.6 },
	// Supports aileron
	{ id: 'car_spoiler_sup_l', name: 'Support_Aileron_G', type: 'cube' as const, location: [0.6, 0.65, -1.6] as [number, number, number], rotation: [0, 0, 0] as [number, number, number], scale: [0.08, 0.35, 0.2] as [number, number, number], color: '#111216', roughness: 0.5, metalness: 0.5 },
	{ id: 'car_spoiler_sup_r', name: 'Support_Aileron_D', type: 'cube' as const, location: [-0.6, 0.65, -1.6] as [number, number, number], rotation: [0, 0, 0] as [number, number, number], scale: [0.08, 0.35, 0.2] as [number, number, number], color: '#111216', roughness: 0.5, metalness: 0.5 },
	// Roues avant (Cylindres horizontaux 10 segments)
	{ id: 'wheel_fl', name: 'Roue_Av_G', type: 'cylinder' as const, location: [1.0, 0.35, 1.2] as [number, number, number], rotation: [0, 0, 90] as [number, number, number], scale: [0.7, 0.3, 0.7] as [number, number, number], color: '#2B2D35', roughness: 0.8, metalness: 0.2 },
	{ id: 'wheel_fr', name: 'Roue_Av_D', type: 'cylinder' as const, location: [-1.0, 0.35, 1.2] as [number, number, number], rotation: [0, 0, 90] as [number, number, number], scale: [0.7, 0.3, 0.7] as [number, number, number], color: '#2B2D35', roughness: 0.8, metalness: 0.2 },
	// Roues arrière
	{ id: 'wheel_rl', name: 'Roue_Ar_G', type: 'cylinder' as const, location: [1.0, 0.38, -1.2] as [number, number, number], rotation: [0, 0, 90] as [number, number, number], scale: [0.76, 0.35, 0.76] as [number, number, number], color: '#2B2D35', roughness: 0.8, metalness: 0.2 },
	{ id: 'wheel_rr', name: 'Roue_Ar_D', type: 'cylinder' as const, location: [-1.0, 0.38, -1.2] as [number, number, number], rotation: [0, 0, 90] as [number, number, number], scale: [0.76, 0.35, 0.76] as [number, number, number], color: '#2B2D35', roughness: 0.8, metalness: 0.2 },
	// Jantes néon cyan
	{ id: 'rim_fl', name: 'Jante_Av_G', type: 'cylinder' as const, location: [1.12, 0.35, 1.2] as [number, number, number], rotation: [0, 0, 90] as [number, number, number], scale: [0.4, 0.08, 0.4] as [number, number, number], color: '#00F0FF', roughness: 0.2, metalness: 0.8, emissive: '#00F0FF', emissiveIntensity: 0.8 },
	{ id: 'rim_fr', name: 'Jante_Av_D', type: 'cylinder' as const, location: [-1.12, 0.35, 1.2] as [number, number, number], rotation: [0, 0, 90] as [number, number, number], scale: [0.4, 0.08, 0.4] as [number, number, number], color: '#00F0FF', roughness: 0.2, metalness: 0.8, emissive: '#00F0FF', emissiveIntensity: 0.8 },
	// Phares avant LED
	{ id: 'headlight_l', name: 'Phare_Av_G', type: 'cube' as const, location: [0.65, 0.45, 1.9] as [number, number, number], rotation: [0, 0, 0] as [number, number, number], scale: [0.35, 0.12, 0.1] as [number, number, number], color: '#FFE600', roughness: 0.1, metalness: 0.1, emissive: '#FFE600', emissiveIntensity: 1.0 },
	{ id: 'headlight_r', name: 'Phare_Av_D', type: 'cube' as const, location: [-0.65, 0.45, 1.9] as [number, number, number], rotation: [0, 0, 0] as [number, number, number], scale: [0.35, 0.12, 0.1] as [number, number, number], color: '#FFE600', roughness: 0.1, metalness: 0.1, emissive: '#FFE600', emissiveIntensity: 1.0 },
	// Bandeau arrière LED rouge
	{ id: 'taillight', name: 'Bandeau_LED_Ar', type: 'cube' as const, location: [0, 0.5, -1.9] as [number, number, number], rotation: [0, 0, 0] as [number, number, number], scale: [1.6, 0.08, 0.1] as [number, number, number], color: '#FF003C', roughness: 0.1, metalness: 0.1, emissive: '#FF003C', emissiveIntensity: 1.0 }
];

// 3. Maison Médiévale / Auberge
const HOUSE_PARTS = [
	// Rez-de-chaussée en pierre
	{ id: 'stone_base', name: 'Base_Pierre', type: 'cube' as const, location: [0, 0.9, 0] as [number, number, number], rotation: [0, 0, 0] as [number, number, number], scale: [2.6, 1.8, 2.4] as [number, number, number], color: '#7F8C8D', roughness: 0.85, metalness: 0.1 },
	// Étage en colombages bois
	{ id: 'wood_floor', name: 'Etage_Colombages', type: 'cube' as const, location: [0, 2.3, 0] as [number, number, number], rotation: [0, 0, 0] as [number, number, number], scale: [2.8, 1.2, 2.6] as [number, number, number], color: '#FDFEFE', roughness: 0.7, metalness: 0.05 },
	// Poutres d'angles
	{ id: 'beam_1', name: 'Poutre_Angle_1', type: 'cube' as const, location: [1.38, 2.3, 1.28] as [number, number, number], rotation: [0, 0, 0] as [number, number, number], scale: [0.18, 1.25, 0.18] as [number, number, number], color: '#5A3825', roughness: 0.9, metalness: 0.0 },
	{ id: 'beam_2', name: 'Poutre_Angle_2', type: 'cube' as const, location: [-1.38, 2.3, 1.28] as [number, number, number], rotation: [0, 0, 0] as [number, number, number], scale: [0.18, 1.25, 0.18] as [number, number, number], color: '#5A3825', roughness: 0.9, metalness: 0.0 },
	// Toiture en tuiles biseautées (Pyramide étirée / toit deux pentes)
	{ id: 'roof_l', name: 'Toit_Pente_G', type: 'cube' as const, location: [0.8, 3.4, 0] as [number, number, number], rotation: [0, 0, -35] as [number, number, number], scale: [1.9, 0.15, 3.0] as [number, number, number], color: '#883A27', roughness: 0.75, metalness: 0.1 },
	{ id: 'roof_r', name: 'Toit_Pente_D', type: 'cube' as const, location: [-0.8, 3.4, 0] as [number, number, number], rotation: [0, 0, 35] as [number, number, number], scale: [1.9, 0.15, 3.0] as [number, number, number], color: '#883A27', roughness: 0.75, metalness: 0.1 },
	// Pignon avant en bois
	{ id: 'roof_gable', name: 'Pignon_Toit', type: 'cone' as const, location: [0, 3.4, 1.3] as [number, number, number], rotation: [0, 0, 0] as [number, number, number], scale: [2.0, 1.3, 0.1] as [number, number, number], color: '#684531', roughness: 0.85, metalness: 0.0 },
	// Cheminée en pierre
	{ id: 'chimney', name: 'Cheminee_Pierre', type: 'cube' as const, location: [0.8, 3.8, -0.6] as [number, number, number], rotation: [0, 0, 0] as [number, number, number], scale: [0.55, 1.6, 0.55] as [number, number, number], color: '#596275', roughness: 0.9, metalness: 0.1 },
	// Porte en bois voûtée
	{ id: 'door', name: 'Porte_Chene', type: 'cube' as const, location: [0, 0.65, 1.22] as [number, number, number], rotation: [0, 0, 0] as [number, number, number], scale: [0.7, 1.3, 0.12] as [number, number, number], color: '#442817', roughness: 0.85, metalness: 0.1 },
	// Lanterne extérieure lumineuse
	{ id: 'lantern', name: 'Lanterne_Nuit', type: 'sphere' as const, location: [0.65, 1.3, 1.35] as [number, number, number], rotation: [0, 0, 0] as [number, number, number], scale: [0.22, 0.28, 0.22] as [number, number, number], color: '#FFA502', roughness: 0.2, metalness: 0.2, emissive: '#FFA502', emissiveIntensity: 0.9 }
];

// 4. Arbre Magique Stylisé Low-Poly
const TREE_PARTS = [
	// Tronc tortueux
	{ id: 'trunk_base', name: 'Tronc_Racines', type: 'cylinder' as const, location: [0, 0.8, 0] as [number, number, number], rotation: [0, 0, 3] as [number, number, number], scale: [0.75, 1.6, 0.75] as [number, number, number], color: '#5A3D28', roughness: 0.9, metalness: 0.05 },
	{ id: 'trunk_mid', name: 'Tronc_Superieur', type: 'cylinder' as const, location: [0.1, 2.0, 0] as [number, number, number], rotation: [0, 0, -8] as [number, number, number], scale: [0.55, 1.2, 0.55] as [number, number, number], color: '#4E3420', roughness: 0.9, metalness: 0.05 },
	// Masses de feuillage facetté (Icosaèdres aux dégradés verts)
	{ id: 'foliage_main', name: 'Feuillage_Majeur', type: 'sphere' as const, location: [0, 3.2, 0] as [number, number, number], rotation: [15, 20, 0] as [number, number, number], scale: [2.2, 1.8, 2.2] as [number, number, number], color: '#2ED573', roughness: 0.6, metalness: 0.1 },
	{ id: 'foliage_top', name: 'Feuillage_Sommet', type: 'sphere' as const, location: [0.2, 4.2, 0.1] as [number, number, number], rotation: [-25, 45, 10] as [number, number, number], scale: [1.6, 1.4, 1.6] as [number, number, number], color: '#7BED9F', roughness: 0.6, metalness: 0.1 },
	{ id: 'foliage_left', name: 'Feuillage_Branche_G', type: 'sphere' as const, location: [-0.9, 2.7, 0.3] as [number, number, number], rotation: [10, -30, -20] as [number, number, number], scale: [1.3, 1.1, 1.3] as [number, number, number], color: '#10AC84', roughness: 0.6, metalness: 0.1 },
	{ id: 'foliage_right', name: 'Feuillage_Branche_D', type: 'sphere' as const, location: [0.9, 2.9, -0.4] as [number, number, number], rotation: [20, 60, 25] as [number, number, number], scale: [1.2, 1.0, 1.2] as [number, number, number], color: '#2ED573', roughness: 0.6, metalness: 0.1 },
	// Champignon lumineux féerique à la base
	{ id: 'mush_cap', name: 'Chapeau_Fonge_Magique', type: 'cone' as const, location: [0.65, 0.28, 0.5] as [number, number, number], rotation: [10, 0, 15] as [number, number, number], scale: [0.35, 0.2, 0.35] as [number, number, number], color: '#FF4757', roughness: 0.3, metalness: 0.1, emissive: '#FF4757', emissiveIntensity: 0.6 },
	{ id: 'mush_stem', name: 'Pied_Champignon', type: 'cylinder' as const, location: [0.62, 0.12, 0.48] as [number, number, number], rotation: [10, 0, 15] as [number, number, number], scale: [0.12, 0.25, 0.12] as [number, number, number], color: '#F1F2F6', roughness: 0.8, metalness: 0.05 }
];

// 5. Vaisseau Spatial Intercepteur Sci-Fi
const STARFIGHTER_PARTS = [
	// Fuselage central effilé
	{ id: 'ship_body', name: 'Fuselage_Central', type: 'cone' as const, location: [0, 0.5, 0.5] as [number, number, number], rotation: [-90, 0, 0] as [number, number, number], scale: [0.9, 3.2, 0.6] as [number, number, number], color: '#2F3542', roughness: 0.4, metalness: 0.8 },
	// Cockpit facetté ambre
	{ id: 'ship_cockpit', name: 'Verriere_Cockpit', type: 'sphere' as const, location: [0, 0.8, 0.3] as [number, number, number], rotation: [0, 0, 0] as [number, number, number], scale: [0.55, 0.35, 1.1] as [number, number, number], color: '#FFA502', roughness: 0.1, metalness: 0.3, emissive: '#FFA502', emissiveIntensity: 0.5 },
	// Aile gauche en flèche delta
	{ id: 'wing_l', name: 'Aile_Delta_G', type: 'cube' as const, location: [1.5, 0.45, -0.4] as [number, number, number], rotation: [0, 25, 5] as [number, number, number], scale: [2.2, 0.08, 1.2] as [number, number, number], color: '#3742FA', roughness: 0.35, metalness: 0.7 },
	// Aile droite
	{ id: 'wing_r', name: 'Aile_Delta_D', type: 'cube' as const, location: [-1.5, 0.45, -0.4] as [number, number, number], rotation: [0, -25, -5] as [number, number, number], scale: [2.2, 0.08, 1.2] as [number, number, number], color: '#3742FA', roughness: 0.35, metalness: 0.7 },
	// Réacteur gauche
	{ id: 'thruster_l', name: 'Reacteur_G', type: 'cylinder' as const, location: [0.55, 0.48, -1.2] as [number, number, number], rotation: [90, 0, 0] as [number, number, number], scale: [0.4, 0.9, 0.4] as [number, number, number], color: '#1E272E', roughness: 0.5, metalness: 0.9 },
	// Réacteur droit
	{ id: 'thruster_r', name: 'Reacteur_D', type: 'cylinder' as const, location: [-0.55, 0.48, -1.2] as [number, number, number], rotation: [90, 0, 0] as [number, number, number], scale: [0.4, 0.9, 0.4] as [number, number, number], color: '#1E272E', roughness: 0.5, metalness: 0.9 },
	// Flammes plasma ioniques
	{ id: 'plasma_l', name: 'Tuyere_Plasma_G', type: 'cone' as const, location: [0.55, 0.48, -1.8] as [number, number, number], rotation: [90, 0, 0] as [number, number, number], scale: [0.25, 0.7, 0.25] as [number, number, number], color: '#00D2D3', roughness: 0.1, metalness: 0.1, emissive: '#00D2D3', emissiveIntensity: 1.0 },
	{ id: 'plasma_r', name: 'Tuyere_Plasma_D', type: 'cone' as const, location: [-0.55, 0.48, -1.8] as [number, number, number], rotation: [90, 0, 0] as [number, number, number], scale: [0.25, 0.7, 0.25] as [number, number, number], color: '#00D2D3', roughness: 0.1, metalness: 0.1, emissive: '#00D2D3', emissiveIntensity: 1.0 }
];

// 6. Coffre d'Aventure RPG
const CHEST_PARTS = [
	// Bac inférieur en bois
	{ id: 'chest_base', name: 'Cuve_Bois', type: 'cube' as const, location: [0, 0.55, 0] as [number, number, number], rotation: [0, 0, 0] as [number, number, number], scale: [1.8, 1.1, 1.2] as [number, number, number], color: '#684531', roughness: 0.85, metalness: 0.05 },
	// Couvercle cintré
	{ id: 'chest_lid', name: 'Couvercle_Cintre', type: 'cylinder' as const, location: [0, 1.1, 0] as [number, number, number], rotation: [0, 0, 90] as [number, number, number], scale: [1.2, 1.82, 1.2] as [number, number, number], color: '#7A5239', roughness: 0.85, metalness: 0.05 },
	// Cerclage métallique gauche
	{ id: 'strap_l', name: 'Cerclage_Fer_G', type: 'cube' as const, location: [0.55, 0.55, 0] as [number, number, number], rotation: [0, 0, 0] as [number, number, number], scale: [0.15, 1.14, 1.24] as [number, number, number], color: '#2F3640', roughness: 0.45, metalness: 0.9 },
	// Cerclage métallique droit
	{ id: 'strap_r', name: 'Cerclage_Fer_D', type: 'cube' as const, location: [-0.55, 0.55, 0] as [number, number, number], rotation: [0, 0, 0] as [number, number, number], scale: [0.15, 1.14, 1.24] as [number, number, number], color: '#2F3640', roughness: 0.45, metalness: 0.9 },
	// Serrure en laiton
	{ id: 'lock_plate', name: 'Serrure_Laiton', type: 'cube' as const, location: [0, 0.95, 0.62] as [number, number, number], rotation: [0, 0, 0] as [number, number, number], scale: [0.35, 0.45, 0.08] as [number, number, number], color: '#FFD700', roughness: 0.3, metalness: 0.9 },
	// Trou de serrure
	{ id: 'keyhole', name: 'Trou_Cle', type: 'cylinder' as const, location: [0, 0.92, 0.67] as [number, number, number], rotation: [90, 0, 0] as [number, number, number], scale: [0.08, 0.05, 0.08] as [number, number, number], color: '#1E272E', roughness: 0.9, metalness: 0.1 }
];

export const TEMPLATES_3D: Record<string, Model3DProject> = {
	sword: {
		id: 'tpl_sword',
		title: 'Épée Royale Fantaisie',
		description: 'Lame d’acier facettée avec cœur d’énergie cyan, garde dorée ornée et pommeau serti d’un rubis.',
		category: 'weapon',
		pythonCode: generateBlenderPythonScript('Epee_Royale_Fantaisie', SWORD_PARTS),
		parts: SWORD_PARTS,
		palette: ['#B0C4DE', '#CFE2F3', '#00E5FF', '#FFD700', '#5C3826', '#E50914'],
		stats: calculateModelStats(SWORD_PARTS),
		createdAt: Date.now()
	},
	car: {
		id: 'tpl_car',
		title: 'Cyber Cruiser Low-Poly',
		description: 'Voiture de sport futuriste aux arêtes acérées, jantes néon cyan et bandeau lumineux arrière.',
		category: 'vehicle',
		pythonCode: generateBlenderPythonScript('Cyber_Cruiser_LowPoly', CAR_PARTS),
		parts: CAR_PARTS,
		palette: ['#1A1C23', '#00F0FF', '#FF0055', '#2B2D35', '#FFE600', '#FF003C'],
		stats: calculateModelStats(CAR_PARTS),
		createdAt: Date.now()
	},
	house: {
		id: 'tpl_house',
		title: 'Auberge Médiévale',
		description: 'Bâtisse médiévale avec soubassement en pierre, étage en colombages, toit à deux versants et lanterne.',
		category: 'building',
		pythonCode: generateBlenderPythonScript('Auberge_Medievale', HOUSE_PARTS),
		parts: HOUSE_PARTS,
		palette: ['#7F8C8D', '#FDFEFE', '#5A3825', '#883A27', '#596275', '#FFA502'],
		stats: calculateModelStats(HOUSE_PARTS),
		createdAt: Date.now()
	},
	tree: {
		id: 'tpl_tree',
		title: 'Arbre Enchanté Stylisé',
		description: 'Arbre féerique low-poly aux touffes de feuillage facettées et champignon phosphorescent.',
		category: 'nature',
		pythonCode: generateBlenderPythonScript('Arbre_Enchante_Stylise', TREE_PARTS),
		parts: TREE_PARTS,
		palette: ['#5A3D28', '#2ED573', '#7BED9F', '#10AC84', '#FF4757', '#F1F2F6'],
		stats: calculateModelStats(TREE_PARTS),
		createdAt: Date.now()
	},
	scifi: {
		id: 'tpl_scifi',
		title: 'Chasseur Stellaire Intercepteur',
		description: 'Vaisseau spatial rapide aux ailes delta en flèche, cockpit ambré et double propulsion ionique.',
		category: 'scifi',
		pythonCode: generateBlenderPythonScript('Chasseur_Stellaire', STARFIGHTER_PARTS),
		parts: STARFIGHTER_PARTS,
		palette: ['#2F3542', '#FFA502', '#3742FA', '#1E272E', '#00D2D3'],
		stats: calculateModelStats(STARFIGHTER_PARTS),
		createdAt: Date.now()
	},
	chest: {
		id: 'tpl_chest',
		title: 'Coffre au Trésor RPG',
		description: 'Coffre d’aventurier en chêne massif cerclé de fer forgé avec imposante serrure dorée.',
		category: 'prop',
		pythonCode: generateBlenderPythonScript('Coffre_Tresor_RPG', CHEST_PARTS),
		parts: CHEST_PARTS,
		palette: ['#684531', '#7A5239', '#2F3640', '#FFD700', '#1E272E'],
		stats: calculateModelStats(CHEST_PARTS),
		createdAt: Date.now()
	}
};
