import type { Model3DProject } from './types';
import { generateBlenderPythonScript, calculateModelStats } from './virtualBlenderEngine';
import {
	SWORD_PARTS,
	CAR_PARTS,
	HOUSE_PARTS,
	TREE_PARTS,
	STARFIGHTER_PARTS,
	CHEST_PARTS
} from './archetypeParts';

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
