import type { WebsiteProject } from './types';

export const DEFAULT_TEMPLATES: Record<string, WebsiteProject> = {
	portfolio: {
		id: 'creator-portfolio',
		title: 'Portfolio Créateur de Contenu',
		tagline: 'Vidéaste, streamer & storyteller digital de nouvelle génération',
		prompt: 'Génère-moi un site portfolio pour un créateur de contenu',
		theme: 'dark',
		presetType: 'portfolio',
		accentColor: '#3b82f6',
		sections: {
			navbar: true,
			hero: true,
			features: true,
			showcase: true,
			pricing: false,
			testimonials: true,
			contact: true,
			faq: false,
			footer: true
		},
		data: {
			brandName: 'ALEXIS V.',
			navLinks: [
				{ label: 'Projets', href: '#projets' },
				{ label: 'Statistiques', href: '#stats' },
				{ label: 'Partenariats', href: '#contact' }
			],
			hero: {
				badge: 'Disponible pour collaborations 2026',
				title: 'Créateur de contenu immersif &',
				highlightText: 'Expériences Visuelles.',
				subtitle:
					'Je conçois des vidéos, des récits et des univers de marque captivants pour une communauté de plus de 450 000 passionnés.',
				primaryCta: 'Lancer un projet ensemble',
				secondaryCta: 'Voir mes créations',
				stats: [
					{ value: '450K+', label: 'Abonnés engagés' },
					{ value: '32M', label: 'Vues cumulées' },
					{ value: '8.4%', label: 'Taux d’engagement' }
				]
			},
			features: [
				{
					id: 'feat-1',
					icon: 'video',
					title: 'Production Vidéo AAA',
					description: 'Tournage 4K, étalonnage cinéma et sound design immersif taillés pour la rétention.',
					tag: 'Ultra-HD'
				},
				{
					id: 'feat-2',
					icon: 'trending-up',
					title: 'Stratégie de Rétention',
					description: 'Hooks narratifs étudiés pour maximiser l’algorithme YouTube & TikTok dès les 5 premières secondes.',
					tag: 'Viralité'
				},
				{
					id: 'feat-3',
					icon: 'users',
					title: 'Sponsoring & Intégration',
					description: 'Placements de produits organiques et respectueux de la communauté avec reporting de conversion.',
					tag: 'ROI Garanti'
				}
			],
			showcase: [
				{
					id: 'show-1',
					title: 'Série Documentaire "Dans l\'Ombre"',
					category: 'YouTube • 1.2M Vues',
					metrics: '94% Rétention moyenne',
					description: 'Mini-série de 3 épisodes sur l’envers du décor des créateurs numériques.'
				},
				{
					id: 'show-2',
					title: 'Campagne Digitale "CyberPulse"',
					category: 'Sponsoring Clavier Mécanique',
					metrics: '+340% Ventes en 48h',
					description: 'Intégration narrative native d’une marque tech sans coupure publicitaire agressive.'
				},
				{
					id: 'show-3',
					title: 'Format Court "Tech & Minimalisme"',
					category: 'Shorts & TikTok • 4.8M Vues',
					metrics: '120K Partages',
					description: 'Série de micro-tutoriels stylisés sur le setup minimaliste et productivité.'
				}
			],
			contact: {
				title: 'Discutons d’une future collaboration',
				subtitle: 'Une idée de vidéo, un partenariat sponsorisé ou une direction artistique ? Remplissez ce formulaire et je vous réponds sous 24h.',
				emailPlaceholder: 'votre.email@entreprise.com',
				submitText: 'Envoyer ma proposition',
				successMessage: 'Votre message a bien été reçu ! Alexis vous répondra dans les plus brefs délais.',
				fields: [
					{ name: 'name', label: 'Nom complet ou Marque', type: 'text', required: true },
					{ name: 'email', label: 'Adresse e-mail professionnelle', type: 'email', required: true },
					{ name: 'budget', label: 'Budget estimé (EUR)', type: 'select', required: false },
					{ name: 'message', label: 'Détails du projet ou brief', type: 'textarea', required: true }
				]
			},
			footer: {
				copyright: '© 2026 Alexis V. Tous droits réservés.',
				links: [
					{ label: 'YouTube', href: 'https://youtube.com' },
					{ label: 'Twitter / X', href: 'https://x.com' },
					{ label: 'Instagram', href: 'https://instagram.com' }
				]
			}
		}
	},

	saas: {
		id: 'saas-minimal',
		title: 'Plateforme SaaS & IA Moderne',
		tagline: 'L’infrastructure logicielle conçue pour les équipes exigeantes',
		prompt: 'Génère-moi une landing page SaaS IA ultra sobre',
		theme: 'midnight',
		presetType: 'saas',
		accentColor: '#10b981',
		sections: {
			navbar: true,
			hero: true,
			features: true,
			showcase: false,
			pricing: true,
			testimonials: true,
			contact: true,
			faq: true,
			footer: true
		},
		data: {
			brandName: 'NEXUS.IO',
			navLinks: [
				{ label: 'Fonctionnalités', href: '#features' },
				{ label: 'Tarifs', href: '#pricing' },
				{ label: 'FAQ', href: '#faq' },
				{ label: 'Contact', href: '#contact' }
			],
			hero: {
				badge: 'Nexus v3.0 est disponible en accès anticipé',
				title: 'L’orchestration intelligente de vos',
				highlightText: 'Flux de Travail.',
				subtitle:
					'Automatisez vos analyses, synchronisez vos données et pilotez vos projets avec une latence inférieure à 40ms.',
				primaryCta: 'Démarrer gratuitement',
				secondaryCta: 'Voir la démo interactive',
				stats: [
					{ value: '< 40ms', label: 'Temps de réponse' },
					{ value: '99.99%', label: 'Disponibilité SLA' },
					{ value: '12K+', label: 'Développeurs actifs' }
				]
			},
			features: [
				{
					id: 'feat-1',
					icon: 'cpu',
					title: 'Moteur d’inférence hybride',
					description: 'Bascule automatique entre edge computing local et cloud haute performance.',
					tag: 'Zero-latency'
				},
				{
					id: 'feat-2',
					icon: 'shield-check',
					title: 'Chiffrement de bout en bout',
					description: 'Vos données restent strictement isolées et protégées sous conformité SOC-2.',
					tag: 'Sécurité AAA'
				},
				{
					id: 'feat-3',
					icon: 'git-branch',
					title: 'Pipelines d’automatisation',
					description: 'Créez des workflows visuels réactifs sans écrire une seule ligne de boilerplate.',
					tag: 'No-Code & API'
				}
			],
			pricing: {
				yearlyDiscount: 'Économisez 20% par an',
				plans: [
					{
						name: 'Starter',
						monthlyPrice: 0,
						description: 'Idéal pour explorer et valider vos premiers prototypes.',
						features: ['Jusqu’à 5 000 requêtes / mois', '1 workspace actif', 'Support communautaire Discord', 'Mises à jour standards'],
						cta: 'Commencer gratuitement'
					},
					{
						name: 'Pro',
						monthlyPrice: 29,
						popular: true,
						description: 'Pour les créateurs et studios qui expédient en production.',
						features: ['Requêtes illimitées', 'Workspaces d’équipe illimités', 'Pipelines en temps réel', 'Support prioritaire 24/7', 'Accès aux modèles bêta'],
						cta: 'Passer à la vitesse Pro'
					},
					{
						name: 'Entreprise',
						monthlyPrice: 99,
						description: 'Garanties d’infrastructure et déploiement sur-mesure.',
						features: ['Instance dédiée sur votre VPC', 'SLA garanti 99.99%', 'Audits de sécurité dédiés', 'Account manager attitré', 'Facturation sur devis'],
						cta: 'Contacter l’équipe'
					}
				]
			},
			contact: {
				title: 'Demandez une démonstration personnalisée',
				subtitle: 'Notre équipe d’ingénieurs vous présente la solution en 15 minutes chrono.',
				emailPlaceholder: 'alex@startup.io',
				submitText: 'Réserver ma démo',
				successMessage: 'Parfait ! Un ingénieur Nexus prendra contact avec vous d’ici 2 heures.',
				fields: [
					{ name: 'name', label: 'Prénom & Nom', type: 'text', required: true },
					{ name: 'email', label: 'E-mail professionnel', type: 'email', required: true },
					{ name: 'company', label: 'Entreprise', type: 'text', required: true },
					{ name: 'message', label: 'Cas d’usage principal', type: 'textarea', required: false }
				]
			},
			faq: [
				{
					question: 'Puis-je utiliser Nexus avec mon infrastructure existante ?',
					answer: 'Oui. Nexus propose des SDKs officiels pour React, Next.js, Node.js, Python et Luau ainsi qu’une API REST et gRPC ouverte.'
				},
				{
					question: 'Mes données sont-elles utilisées pour entraîner des modèles ?',
					answer: 'Absolument jamais. Vos flux de données et vos requêtes bénéficient d’une clause stricte de non-conservation et d’isolation.'
				},
				{
					question: 'Puis-je annuler ou changer de forfait à tout moment ?',
					answer: 'Oui, sans aucun engagement ni frais caché. Le changement de plan est instantané et proratisé à la seconde près.'
				}
			],
			footer: {
				copyright: '© 2026 Nexus Technologies Inc. Tous droits réservés.',
				links: [
					{ label: 'Documentation', href: '#' },
					{ label: 'Statut du système', href: '/status' },
					{ label: 'Conditions', href: '#' }
				]
			}
		}
	},

	agency: {
		id: 'creative-agency',
		title: 'Studio & Agence Créative',
		tagline: 'Direction artistique, 3D et branding pour marques visionnaires',
		prompt: 'Génère-moi un site pour une agence créative haut de gamme',
		theme: 'minimal',
		presetType: 'agency',
		accentColor: '#f59e0b',
		sections: {
			navbar: true,
			hero: true,
			features: true,
			showcase: true,
			pricing: false,
			testimonials: true,
			contact: true,
			faq: false,
			footer: true
		},
		data: {
			brandName: 'ATELIER NOIR',
			navLinks: [
				{ label: 'Expertise', href: '#features' },
				{ label: 'Travaux', href: '#showcase' },
				{ label: 'Le Studio', href: '#about' },
				{ label: 'Démarrer', href: '#contact' }
			],
			hero: {
				badge: 'Paris • Tokyo • New York',
				title: 'Nous sculptons des identités qui',
				highlightText: 'Marquent l’Époque.',
				subtitle:
					'Atelier indépendant spécialisé dans le design d’interfaces radicales, la typographie expressive et l’animation interactive.',
				primaryCta: 'Demander un devis',
				secondaryCta: 'Explorer le portfolio',
				stats: [
					{ value: '48+', label: 'Distinctions & Awwwards' },
					{ value: '10 Ans', label: 'D’artisanat numérique' },
					{ value: '100%', label: 'Sur-mesure' }
				]
			},
			features: [
				{
					id: 'feat-1',
					icon: 'layers',
					title: 'Identité Visuelle & Typographie',
					description: 'Logotypes, systèmes modulaires et polices de caractères dessinées sur-mesure pour votre univers.',
					tag: 'Branding'
				},
				{
					id: 'feat-2',
					icon: 'monitor',
					title: 'UI/UX & Développement Créatif',
					description: 'Expériences web réactives, transitions cinématiques et micro-interactions haut de gamme.',
					tag: 'Digital'
				},
				{
					id: 'feat-3',
					icon: 'compass',
					title: 'Direction Artistique 3D',
					description: 'Rendus photoréalistes, shaders temps-réel et environnements spatiaux immersifs.',
					tag: 'Spatial 3D'
				}
			],
			showcase: [
				{
					id: 'show-1',
					title: 'KRONOS HORLOGERIE',
					category: 'E-Commerce Luxe & 3D WebGL',
					metrics: '+180% Taux de conversion',
					description: 'Refonte complète de l’expérience d’achat d’un fabricant suisse de montres mécaniques.'
				},
				{
					id: 'show-2',
					title: 'SOLARIS ARCHITECTURE',
					category: 'Branding & Monographie',
					metrics: 'Site du jour Awwwards',
					description: 'Identité monochrome et catalogue interactif pour un cabinet d’architectes tokyoïtes.'
				}
			],
			contact: {
				title: 'Parlons de votre prochain projet',
				subtitle: 'Partagez-nous vos ambitions, votre planning et vos idées. Nous revenons vers vous avec une note d’intention.',
				emailPlaceholder: 'contact@votre-marque.com',
				submitText: 'Transmettre le brief',
				successMessage: 'Brief bien reçu. Nos directeurs de création étudieront votre demande avec soin.',
				fields: [
					{ name: 'client', label: 'Votre nom ou agence', type: 'text', required: true },
					{ name: 'email', label: 'E-mail de contact', type: 'email', required: true },
					{ name: 'timeline', label: 'Délai souhaité', type: 'text', required: false },
					{ name: 'brief', label: 'Description du projet', type: 'textarea', required: true }
				]
			},
			footer: {
				copyright: '© 2026 Atelier Noir. Design & Ingénierie indépendants.',
				links: [
					{ label: 'Instagram', href: '#' },
					{ label: 'Behance', href: '#' },
					{ label: 'LinkedIn', href: '#' }
				]
			}
		}
	}
};
