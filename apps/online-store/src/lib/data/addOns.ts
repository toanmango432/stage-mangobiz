// Add-ons Library - Reusable add-ons for services
// Organized by category for easy assignment to services

export interface AddOn {
  id: string;
  name: string;
  description: string;
  price: number;
  duration?: number; // Extra time needed in minutes
  popular?: boolean;
  category?: string;
}

export const commonAddOns: Record<string, AddOn> = {
  // Nail Services Add-ons
  frenchTips: {
    id: 'addon-french',
    name: 'French Tips',
    description: 'Classic elegant white tips for a timeless look',
    price: 5,
    duration: 5,
    popular: true,
    category: 'nails',
  },
  gelRemoval: {
    id: 'addon-gel-removal',
    name: 'Gel Polish Removal',
    description: 'Safe removal of existing gel polish',
    price: 10,
    duration: 15,
    popular: true,
    category: 'nails',
  },
  nailArt: {
    id: 'addon-nail-art',
    name: 'Custom Nail Art',
    description: 'Per nail artistic design (simple to complex)',
    price: 8,
    duration: 10,
    category: 'nails',
  },
  cuticleOil: {
    id: 'addon-cuticle-oil',
    name: 'Cuticle Oil Treatment',
    description: 'Nourishing cuticle oil for healthy nail beds',
    price: 5,
    duration: 5,
    category: 'nails',
  },
  quickDry: {
    id: 'addon-quick-dry',
    name: 'Quick Dry Top Coat',
    description: 'Fast-drying top coat to save time',
    price: 3,
    duration: 0,
    popular: true,
    category: 'nails',
  },
  nailStrengthener: {
    id: 'addon-strengthener',
    name: 'Nail Strengthener Base',
    description: 'Protective base coat for weak nails',
    price: 7,
    duration: 0,
    category: 'nails',
  },

  // Hair Services Add-ons
  deepConditioning: {
    id: 'addon-deep-conditioning',
    name: 'Deep Conditioning Treatment',
    description: 'Intensive moisture treatment for damaged hair',
    price: 25,
    duration: 20,
    popular: true,
    category: 'hair',
  },
  scalpTreatment: {
    id: 'addon-scalp-treatment',
    name: 'Scalp Treatment',
    description: 'Therapeutic scalp massage and treatment',
    price: 15,
    duration: 15,
    category: 'hair',
  },
  hairMask: {
    id: 'addon-hair-mask',
    name: 'Repair Hair Mask',
    description: 'Intensive repair mask for damaged hair',
    price: 20,
    duration: 30,
    category: 'hair',
  },
  blowDry: {
    id: 'addon-blow-dry',
    name: 'Professional Blow Dry',
    description: 'Styling and blow dry service',
    price: 15,
    duration: 20,
    popular: true,
    category: 'hair',
  },
  hairGloss: {
    id: 'addon-hair-gloss',
    name: 'Hair Gloss Treatment',
    description: 'Shine-enhancing gloss treatment',
    price: 30,
    duration: 15,
    category: 'hair',
  },

  // Facial Services Add-ons
  extraction: {
    id: 'addon-extraction',
    name: 'Facial Extraction',
    description: 'Professional blackhead and pore extraction',
    price: 20,
    duration: 15,
    category: 'facial',
  },
  faceMask: {
    id: 'addon-face-mask',
    name: 'Custom Face Mask',
    description: 'Personalized mask for your skin type',
    price: 15,
    duration: 20,
    category: 'facial',
  },
  eyeTreatment: {
    id: 'addon-eye-treatment',
    name: 'Eye Area Treatment',
    description: 'Specialized treatment for delicate eye area',
    price: 25,
    duration: 15,
    category: 'facial',
  },
  ledTherapy: {
    id: 'addon-led-therapy',
    name: 'LED Light Therapy',
    description: 'Anti-aging LED light treatment',
    price: 35,
    duration: 20,
    category: 'facial',
  },

  // Massage Services Add-ons
  hotStone: {
    id: 'addon-hot-stone',
    name: 'Hot Stone Therapy',
    description: 'Relaxing hot stone massage',
    price: 30,
    duration: 15,
    popular: true,
    category: 'massage',
  },
  aromatherapy: {
    id: 'addon-aromatherapy',
    name: 'Aromatherapy Upgrade',
    description: 'Essential oils for enhanced relaxation',
    price: 10,
    duration: 0,
    category: 'massage',
  },
  cupping: {
    id: 'addon-cupping',
    name: 'Cupping Therapy',
    description: 'Traditional cupping for muscle tension',
    price: 25,
    duration: 10,
    category: 'massage',
  },

  // Waxing Services Add-ons
  numbingCream: {
    id: 'addon-numbing-cream',
    name: 'Numbing Cream',
    description: 'Topical anesthetic for sensitive areas',
    price: 8,
    duration: 5,
    category: 'waxing',
  },
  aftercare: {
    id: 'addon-aftercare',
    name: 'Aftercare Kit',
    description: 'Take-home aftercare products',
    price: 12,
    duration: 0,
    category: 'waxing',
  },

  // General Add-ons
  consultation: {
    id: 'addon-consultation',
    name: 'Extended Consultation',
    description: '15-minute detailed consultation',
    price: 15,
    duration: 15,
    category: 'general',
  },
  expressService: {
    id: 'addon-express',
    name: 'Express Service',
    description: 'Rush service for busy schedules',
    price: 20,
    duration: -10, // Reduces total time
    category: 'general',
  },
};

// Helper functions
export const getAddOnsByCategory = (category: string): AddOn[] => {
  return Object.values(commonAddOns).filter(addon => addon.category === category);
};

export const getPopularAddOns = (): AddOn[] => {
  return Object.values(commonAddOns).filter(addon => addon.popular);
};

export const getAddOnById = (id: string): AddOn | undefined => {
  return Object.values(commonAddOns).find(addon => addon.id === id);
};

// Pre-defined add-on sets for common service combinations
export const addOnSets = {
  nailServices: ['addon-french', 'addon-gel-removal', 'addon-cuticle-oil', 'addon-quick-dry'],
  hairServices: ['addon-deep-conditioning', 'addon-scalp-treatment', 'addon-blow-dry'],
  facialServices: ['addon-extraction', 'addon-face-mask', 'addon-eye-treatment'],
  massageServices: ['addon-hot-stone', 'addon-aromatherapy'],
  premiumServices: ['addon-led-therapy', 'addon-cupping', 'addon-hair-gloss'],
};



