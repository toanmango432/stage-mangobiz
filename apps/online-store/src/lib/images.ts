// Image assets
import heroSalon from "@/assets/hero-salon.jpg";
import productsHero from "@/assets/products-hero.jpg";
import giftCard from "@/assets/gift-card.jpg";

// Team images
import teamSarahChen from "@/assets/team-sarah-chen.jpg";
import teamMichaelTan from "@/assets/team-michael-tan.jpg";
import teamJessicaLee from "@/assets/team-jessica-lee.jpg";
import teamDavidPark from "@/assets/team-david-park.jpg";
import teamEmilyRodriguez from "@/assets/team-emily-rodriguez.jpg";
import teamMarcusWilliams from "@/assets/team-marcus-williams.jpg";

// Work gallery images
import workBalayage from "@/assets/work-balayage.jpg";
import workBeachWaves from "@/assets/work-beach-waves.jpg";
import workBobCut from "@/assets/work-bob-cut.jpg";
import workBridalMakeup from "@/assets/work-bridal-makeup.jpg";
import workCrystalNails from "@/assets/work-crystal-nails.jpg";
import workDimensionalColor from "@/assets/work-dimensional-color.jpg";
import workEveningMakeup from "@/assets/work-evening-makeup.jpg";
import workFloralNails from "@/assets/work-floral-nails.jpg";
import workFrenchManicure from "@/assets/work-french-manicure.jpg";
import workGlowingFacial from "@/assets/work-glowing-facial.jpg";
import workHydratingTreatment from "@/assets/work-hydrating-treatment.jpg";
import workNaturalMakeup from "@/assets/work-natural-makeup.jpg";
import workNudeNails from "@/assets/work-nude-nails.jpg";
import workOmbreNails from "@/assets/work-ombre-nails.jpg";
import workWeddingUpdo from "@/assets/work-wedding-updo.jpg";

// Product images
import hairShampooLuxury from "@/assets/products/hair-shampoo-luxury.jpg";
import hairConditionerLuxury from "@/assets/products/hair-conditioner-luxury.jpg";
import hairMaskRepair from "@/assets/products/hair-mask-repair.jpg";
import nailPolishCollection from "@/assets/products/nail-polish-collection.jpg";
import cuticleOilNourish from "@/assets/products/cuticle-oil-nourish.jpg";
import handCreamLuxury from "@/assets/products/hand-cream-luxury.jpg";

// Service images
import gelManicureProcess from "@/assets/services/gel-manicure-process.jpg";
import pedicureSpa from "@/assets/services/pedicure-spa.jpg";
import haircutStyling from "@/assets/services/haircut-styling.jpg";
import hairColorBalayage from "@/assets/services/hair-color-balayage.jpg";
import facialTreatment from "@/assets/services/facial-treatment.jpg";
import makeupApplication from "@/assets/services/makeup-application.jpg";

// Salon environment images
import salonReception from "@/assets/salon/reception-area.jpg";
import salonManicureStations from "@/assets/salon/manicure-stations.jpg";
import salonRetailDisplay from "@/assets/salon/retail-display.jpg";

// Gift card imports
import gcClassicElegance from '@/assets/giftcards/classic-elegance.jpg';
import gcModernMinimal from '@/assets/giftcards/modern-minimal.jpg';
import gcFloralGarden from '@/assets/giftcards/floral-garden.jpg';
import gcBirthdayCelebration from '@/assets/giftcards/birthday-celebration.jpg';
import gcHolidaySpecial from '@/assets/giftcards/holiday-special.jpg';
import gcSpaSerenity from '@/assets/giftcards/spa-serenity.jpg';

// Membership imports
import membershipBasicHero from '@/assets/memberships/basic-hero.jpg';
import membershipPremiumHero from '@/assets/memberships/premium-hero.jpg';
import membershipVipHero from '@/assets/memberships/vip-hero.jpg';

// Placeholder image path
const placeholder = "/placeholder.svg";

// Comprehensive Media Library
export const MEDIA_LIBRARY = {
  // Products
  products: {
    hairCare: {
      shampooLuxury: hairShampooLuxury,
      conditionerLuxury: hairConditionerLuxury,
      maskRepair: hairMaskRepair,
    },
    nailCare: {
      polishCollection: nailPolishCollection,
      cuticleOil: cuticleOilNourish,
      handCream: handCreamLuxury,
    },
  },

  // Services
  services: {
    nails: {
      gelManicure: gelManicureProcess,
      pedicure: pedicureSpa,
    },
    hair: {
      haircut: haircutStyling,
      colorBalayage: hairColorBalayage,
    },
    skincare: {
      facial: facialTreatment,
    },
    makeup: {
      application: makeupApplication,
    },
  },

  // Salon Environment
  salon: {
    interior: {
      reception: salonReception,
      manicureStations: salonManicureStations,
      retailDisplay: salonRetailDisplay,
    },
  },

  // Team
  team: {
    sarahChen: teamSarahChen,
    michaelTan: teamMichaelTan,
    jessicaLee: teamJessicaLee,
    davidPark: teamDavidPark,
    emilyRodriguez: teamEmilyRodriguez,
    marcusWilliams: teamMarcusWilliams,
  },

  // Work Gallery
  gallery: {
    balayage: workBalayage,
    beachWaves: workBeachWaves,
    bobCut: workBobCut,
    bridalMakeup: workBridalMakeup,
    crystalNails: workCrystalNails,
    dimensionalColor: workDimensionalColor,
    eveningMakeup: workEveningMakeup,
    floralNails: workFloralNails,
    frenchManicure: workFrenchManicure,
    glowingFacial: workGlowingFacial,
    hydratingTreatment: workHydratingTreatment,
    naturalMakeup: workNaturalMakeup,
    nudeNails: workNudeNails,
    ombreNails: workOmbreNails,
    weddingUpdo: workWeddingUpdo,
  },

  // Hero Images
  hero: {
    heroSalon,
    productsHero,
    giftCard,
  },

  placeholder,
};

// Legacy export for backward compatibility
export const IMAGES = {
  heroSalon: MEDIA_LIBRARY.hero.heroSalon,
  productsHero: MEDIA_LIBRARY.hero.productsHero,
  giftCard: MEDIA_LIBRARY.hero.giftCard,
  teamSarahChen: MEDIA_LIBRARY.team.sarahChen,
  teamMarcusWilliams: MEDIA_LIBRARY.team.marcusWilliams,
  teamJessicaLee: MEDIA_LIBRARY.team.jessicaLee,
  teamDavidPark: MEDIA_LIBRARY.team.davidPark,
  teamEmilyRodriguez: MEDIA_LIBRARY.team.emilyRodriguez,
  teamMichaelTan: MEDIA_LIBRARY.team.michaelTan,
  workFrenchManicure: MEDIA_LIBRARY.gallery.frenchManicure,
  workOmbreNails: MEDIA_LIBRARY.gallery.ombreNails,
  workCrystalNails: MEDIA_LIBRARY.gallery.crystalNails,
  workBalayage: MEDIA_LIBRARY.gallery.balayage,
  workDimensionalColor: MEDIA_LIBRARY.gallery.dimensionalColor,
  workBobCut: MEDIA_LIBRARY.gallery.bobCut,
  workGlowingFacial: MEDIA_LIBRARY.gallery.glowingFacial,
  workHydratingTreatment: MEDIA_LIBRARY.gallery.hydratingTreatment,
  workBridalMakeup: MEDIA_LIBRARY.gallery.bridalMakeup,
  workEveningMakeup: MEDIA_LIBRARY.gallery.eveningMakeup,
  workNaturalMakeup: MEDIA_LIBRARY.gallery.naturalMakeup,
  workNudeNails: MEDIA_LIBRARY.gallery.nudeNails,
  workFloralNails: MEDIA_LIBRARY.gallery.floralNails,
  workBeachWaves: MEDIA_LIBRARY.gallery.beachWaves,
  workWeddingUpdo: MEDIA_LIBRARY.gallery.weddingUpdo,
  placeholder: MEDIA_LIBRARY.placeholder,
};

export const getImageUrl = (path: string, fallback = placeholder): string => {
  const imageMap: Record<string, string> = {
    '/assets/hero-salon.jpg': heroSalon,
    '/assets/products-hero.jpg': productsHero,
    '/assets/gift-card.jpg': giftCard,
  };
  
  return imageMap[path] || fallback;
};

/**
 * Smart image getter for products with fallback
 */
export function getProductImage(productId: string, category: string = ""): string[] {
  const productImageMap: Record<string, string[]> = {
    'prod_shampoo_luxury': [hairShampooLuxury],
    'prod_conditioner_luxury': [hairConditionerLuxury],
    'prod_mask_repair': [hairMaskRepair],
    'prod_hair_mask': [hairMaskRepair],
    'prod_nail_polish': [nailPolishCollection],
    'prod_nail_oil': [cuticleOilNourish],
    'prod_cuticle_oil': [cuticleOilNourish],
    'prod_hand_cream': [handCreamLuxury],
  };

  if (productImageMap[productId]) {
    return productImageMap[productId];
  }

  // Category-based fallback
  if (category.toLowerCase().includes('hair')) {
    return [hairShampooLuxury];
  } else if (category.toLowerCase().includes('nail')) {
    return [nailPolishCollection];
  }

  return [placeholder];
}

/**
 * Smart image getter for services with fallback
 */
export function getServiceImage(serviceId: string, category: string = ""): string {
  const serviceImageMap: Record<string, string> = {
    'srv_gel_manicure': gelManicureProcess,
    'srv_pedicure': pedicureSpa,
    'srv_acrylic_nails': gelManicureProcess,
    'srv_nail_art': gelManicureProcess,
    'srv_haircut': haircutStyling,
    'srv_haircut_style': haircutStyling,
    'srv_color': hairColorBalayage,
    'srv_balayage': hairColorBalayage,
    'srv_facial': facialTreatment,
    'srv_makeup': makeupApplication,
    'srv_bridal_package': makeupApplication,
  };

  if (serviceImageMap[serviceId]) {
    return serviceImageMap[serviceId];
  }

  // Category-based fallback
  if (category.toLowerCase().includes('nail')) {
    return gelManicureProcess;
  } else if (category.toLowerCase().includes('hair')) {
    return haircutStyling;
  } else if (category.toLowerCase().includes('facial') || category.toLowerCase().includes('skin')) {
    return facialTreatment;
  } else if (category.toLowerCase().includes('makeup')) {
    return makeupApplication;
  }

  return placeholder;
}

/**
 * Get salon environment images
 */
export function getSalonImage(type: 'interior' | 'detail' = 'interior', index: number = 0): string {
  const interiorImages = [salonReception, salonManicureStations, salonRetailDisplay];
  const detailImages = [salonRetailDisplay];

  const images = type === 'interior' ? interiorImages : detailImages;
  return images[index % images.length];
}

/**
 * Get a team member image by index
 */
export function getTeamImage(index: number): string {
  const teamImages = [
    teamSarahChen,
    teamMichaelTan,
    teamJessicaLee,
    teamDavidPark,
    teamEmilyRodriguez,
    teamMarcusWilliams,
  ];
  return teamImages[index % teamImages.length];
}

// Generate diverse gallery images
export const getGalleryImage = (index: number): string => {
  const images = [heroSalon, productsHero, giftCard, placeholder];
  return images[index % images.length];
};

// Generate diverse social images
export const getSocialImage = (index: number): string => {
  const images = [heroSalon, productsHero, giftCard];
  return images[index % images.length];
};

/**
 * Get gift card design image by ID
 */
export function getGiftCardImage(designId: string): string {
  const designMap: Record<string, string> = {
    'gc_classic': gcClassicElegance,
    'gc_modern': gcModernMinimal,
    'gc_floral': gcFloralGarden,
    'gc_birthday': gcBirthdayCelebration,
    'gc_holiday': gcHolidaySpecial,
    'gc_spa': gcSpaSerenity,
  };

  return designMap[designId] || gcClassicElegance;
}

/**
 * Get membership tier hero image
 */
export function getMembershipHero(tier: string): string {
  const tierMap: Record<string, string> = {
    'basic': membershipBasicHero,
    'premium': membershipPremiumHero,
    'vip': membershipVipHero,
  };

  return tierMap[tier.toLowerCase()] || membershipBasicHero;
}

// Generate contextual placeholders for products
export const getProductPlaceholder = (name: string, category: string, index: number): string => {
  const colors: Record<string, string> = {
    'Nails': 'FF6B9D',
    'Hand & Body': '95E1D3',
    'Tools': '8B8B8B',
    'Spa': 'C3ACD0'
  };
  const bgColor = colors[category] || 'EAEAEA';
  const displayName = name.length > 20 ? name.substring(0, 20) + '...' : name;
  return `https://via.placeholder.com/400x400/${bgColor}/FFFFFF?text=${encodeURIComponent(displayName)}`;
};

// Generate contextual placeholders for services
export const getServicePlaceholder = (name: string, category: string): string => {
  const colors: Record<string, string> = {
    'Manicure': 'FFB6C1',
    'Pedicure': '87CEEB',
    'Waxing': 'DDA0DD',
    'Nail Art': 'FF69B4'
  };
  const bgColor = colors[category] || 'E0E0E0';
  return `https://via.placeholder.com/600x400/${bgColor}/FFFFFF?text=${encodeURIComponent(name)}`;
};

// Generate diverse team member placeholders
export const getTeamPlaceholder = (name: string, role: string, index: number): string => {
  const colors = ['6C5CE7', 'A29BFE', 'FD79A8', '00B894', '0984E3', 'FDCB6E'];
  const bgColor = colors[index % colors.length];
  const initials = name.split(' ').map(n => n[0]).join('');
  return `https://via.placeholder.com/300x300/${bgColor}/FFFFFF?text=${encodeURIComponent(initials)}`;
};
