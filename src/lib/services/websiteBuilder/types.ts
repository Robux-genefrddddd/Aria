export interface WebsiteElementTarget {
	elementId: string;
	tagName: string;
	name: string;
	currentText: string;
	sectionId?: string;
	category?: 'heading' | 'button' | 'card' | 'form' | 'navbar' | 'text' | 'image';
}

export interface WebsiteProject {
	id: string;
	title: string;
	tagline: string;
	prompt: string;
	theme: 'dark' | 'light' | 'midnight' | 'minimal';
	presetType: 'portfolio' | 'saas' | 'agency' | 'ecommerce' | 'contact';
	accentColor: string;
	sections: {
		navbar: boolean;
		hero: boolean;
		features: boolean;
		showcase: boolean;
		pricing: boolean;
		testimonials: boolean;
		contact: boolean;
		faq: boolean;
		footer: boolean;
	};
	data: {
		brandName: string;
		navLinks: Array<{ label: string; href: string }>;
		hero: {
			badge: string;
			title: string;
			highlightText: string;
			subtitle: string;
			primaryCta: string;
			secondaryCta: string;
			stats?: Array<{ value: string; label: string }>;
		};
		features: Array<{
			id: string;
			icon: string;
			title: string;
			description: string;
			tag?: string;
		}>;
		showcase?: Array<{
			id: string;
			title: string;
			category: string;
			metrics?: string;
			description: string;
		}>;
		pricing?: {
			yearlyDiscount: string;
			plans: Array<{
				name: string;
				monthlyPrice: number;
				description: string;
				popular?: boolean;
				features: string[];
				cta: string;
			}>;
		};
		contact: {
			title: string;
			subtitle: string;
			emailPlaceholder: string;
			submitText: string;
			successMessage: string;
			fields: Array<{ name: string; label: string; type: string; required: boolean }>;
		};
		faq?: Array<{
			question: string;
			answer: string;
		}>;
		footer: {
			copyright: string;
			links: Array<{ label: string; href: string }>;
		};
	};
}
