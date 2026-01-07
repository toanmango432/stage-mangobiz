import { Service } from '@/types/catalog';
import { Staff, Booking } from '@/types/booking';
import { initializeTemplateStorage } from '@/lib/storage/templateStorage';
import { initializeStorefrontConfig } from '@/lib/storage/configStorage';
import { initializeGiftCardConfig } from '@/lib/storage/giftCardStorage';
import { initializeMembershipPlans } from '@/lib/storage/membershipStorage';
import { seedTemplateSections } from '@/lib/storage/templateStorage';
// import salonShowcase from '@/lib/templates/salon-showcase.json';

// Generate mock services - 10 services with proper data structure
export const generateMockServices = () => {
  const services = [
    // Featured Services (Hero Services)
    {
      id: '1',
      name: 'Luxury Gel Manicure',
      category: 'Nail Services',
      description: 'Our signature gel manicure with premium polish, perfect shaping, and long-lasting results that stay beautiful for weeks.',
      duration: 60,
      basePrice: 45,
      price: 45,
      showOnline: true,
      featured: true,
      badge: 'Popular',
      imageUrl: '/src/assets/services/gel-manicure-process.jpg',
      gallery: ['/src/assets/services/gel-manicure-process.jpg', '/src/assets/services/french-manicure-BRMkhUvc.jpg'],
      addOns: [
        { id: 'addon-french', name: 'French Tips', description: 'Classic elegant white tips', price: 5, duration: 5, popular: true },
        { id: 'addon-nail-art', name: 'Custom Nail Art', description: 'Per nail artistic design', price: 8, duration: 10 },
        { id: 'addon-cuticle-oil', name: 'Cuticle Oil Treatment', description: 'Nourishing cuticle oil', price: 5, duration: 5 },
        { id: 'addon-quick-dry', name: 'Quick Dry Top Coat', description: 'Fast-drying top coat', price: 3, duration: 0, popular: true },
      ],
      questions: [
        { id: 'q-allergies', text: 'Do you have any allergies we should know about?', type: 'yes_no', required: true, helpText: 'This helps us select safe products for you' },
        { id: 'q-previous-gel', text: 'Do you currently have gel polish that needs removal?', type: 'yes_no', required: true, options: ['Yes (+$10, +15min)', 'No'] },
        { id: 'q-nail-length', text: 'What nail length would you like?', type: 'multiple_choice', required: true, options: ['Natural', 'Short', 'Medium', 'Long', 'Extra Long (+$15)'] },
        { id: 'q-nail-shape', text: 'What nail shape do you prefer?', type: 'multiple_choice', required: true, options: ['Round', 'Square', 'Oval', 'Almond', 'Stiletto'] },
      ],
      requiresDeposit: false,
      allowsGroupBooking: true,
      maxGroupSize: 4,
      tags: ['manicure', 'gel', 'luxury', 'popular'],
      assignedStaff: ['staff-1', 'staff-2', 'staff-3'],
      recommendedFor: ['Special occasions', 'Long-lasting results', 'Professional look'],
      contraindications: ['Severe nail damage', 'Active infections'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      rating: 4.9,
      reviewCount: 234,
      bookingCount: 156,
    },
    {
      id: '2',
      name: 'Premium Hair Color',
      category: 'Hair Services',
      description: 'Expert color transformation with premium products, personalized consultation, and stunning results that turn heads.',
      duration: 120,
      basePrice: 120,
      price: 120,
      showOnline: true,
      featured: true,
      badge: 'Trending',
      imageUrl: '/src/assets/services/hair-color-balayage-BnHzcEww.jpg',
      gallery: ['/src/assets/services/hair-color-balayage-BnHzcEww.jpg', '/src/assets/services/work-balayage-CcxDGK12.jpg'],
      addOns: [
        { id: 'addon-deep-conditioning', name: 'Deep Conditioning Treatment', description: 'Intensive moisture treatment', price: 25, duration: 20, popular: true },
        { id: 'addon-scalp-treatment', name: 'Scalp Treatment', description: 'Therapeutic scalp massage', price: 15, duration: 15 },
        { id: 'addon-hair-gloss', name: 'Hair Gloss Treatment', description: 'Shine-enhancing gloss', price: 30, duration: 15 },
        { id: 'addon-blow-dry', name: 'Professional Blow Dry', description: 'Styling and blow dry', price: 15, duration: 20, popular: true },
      ],
      questions: [
        { id: 'q-allergies', text: 'Do you have any allergies we should know about?', type: 'yes_no', required: true },
        { id: 'q-hair-type', text: 'What is your hair type?', type: 'multiple_choice', required: true, options: ['Straight', 'Wavy', 'Curly', 'Coily', 'Mixed Texture'] },
        { id: 'q-hair-condition', text: 'How would you describe your hair condition?', type: 'multiple_choice', required: true, options: ['Healthy', 'Dry', 'Damaged', 'Oily', 'Color-Treated'] },
        { id: 'q-previous-color', text: 'Do you currently have color-treated hair?', type: 'yes_no', required: true },
        { id: 'q-hair-goals', text: 'What are your hair goals for this visit?', type: 'multiple_choice', required: true, options: ['Maintenance', 'Color Change', 'Cut & Style', 'Repair', 'Special Event'] },
      ],
      requiresDeposit: true,
      depositAmount: 50,
      depositType: 'flat',
      allowsGroupBooking: false,
      tags: ['hair', 'color', 'premium', 'transformation'],
      assignedStaff: ['staff-4', 'staff-5'],
      recommendedFor: ['Color changes', 'Special events', 'Hair transformation'],
      contraindications: ['Severe hair damage', 'Recent chemical treatments'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      rating: 4.8,
      reviewCount: 189,
      bookingCount: 98,
    },
    {
      id: '3',
      name: 'Signature Facial',
      category: 'Facial Services',
      description: 'Rejuvenating facial treatment with deep cleansing, exfoliation, and hydrating mask for radiant, glowing skin.',
      duration: 75,
      basePrice: 85,
      price: 85,
      showOnline: true,
      featured: true,
      badge: 'Best Value',
      imageUrl: '/src/assets/services/facial-treatment-BfIqRVLV.jpg',
      gallery: ['/src/assets/services/facial-treatment-BfIqRVLV.jpg', '/src/assets/services/work-glowing-facial-Bqteh-u5.jpg'],
      addOns: [
        { id: 'addon-extraction', name: 'Facial Extraction', description: 'Professional blackhead removal', price: 20, duration: 15 },
        { id: 'addon-face-mask', name: 'Custom Face Mask', description: 'Personalized mask for your skin', price: 15, duration: 20 },
        { id: 'addon-eye-treatment', name: 'Eye Area Treatment', description: 'Specialized eye treatment', price: 25, duration: 15 },
        { id: 'addon-led-therapy', name: 'LED Light Therapy', description: 'Anti-aging LED treatment', price: 35, duration: 20 },
      ],
      questions: [
        { id: 'q-allergies', text: 'Do you have any allergies we should know about?', type: 'yes_no', required: true },
        { id: 'q-skin-conditions', text: 'Do you have any skin conditions or sensitivities?', type: 'yes_no', required: true },
        { id: 'q-skin-type', text: 'What is your skin type?', type: 'multiple_choice', required: true, options: ['Normal', 'Dry', 'Oily', 'Combination', 'Sensitive'] },
        { id: 'q-skin-concerns', text: 'What are your main skin concerns?', type: 'multiple_choice', required: true, options: ['Acne', 'Aging', 'Dark Spots', 'Dryness', 'Sensitivity', 'None'] },
        { id: 'q-facial-frequency', text: 'How often do you get facials?', type: 'multiple_choice', required: true, options: ['First time', 'Monthly', 'Quarterly', 'Rarely', 'Never'] },
      ],
      requiresDeposit: false,
      allowsGroupBooking: true,
      maxGroupSize: 2,
      tags: ['facial', 'skincare', 'rejuvenation', 'glowing'],
      assignedStaff: ['staff-6', 'staff-7'],
      recommendedFor: ['Skin rejuvenation', 'Special occasions', 'Monthly maintenance'],
      contraindications: ['Active acne', 'Recent chemical peels', 'Pregnancy'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      rating: 4.7,
      reviewCount: 167,
      bookingCount: 89,
    },
    {
      id: '4',
      name: 'Relaxing Massage',
      category: 'Massage Services',
      description: 'Therapeutic massage to relieve stress, tension, and promote overall wellness with personalized pressure and techniques.',
      duration: 60,
      basePrice: 80,
      price: 80,
      showOnline: true,
      featured: true,
      badge: 'New',
      imageUrl: '/src/assets/services/spa-serenity-DiPOobOc.jpg',
      gallery: ['/src/assets/services/spa-serenity-DiPOobOc.jpg'],
      addOns: [
        { id: 'addon-hot-stone', name: 'Hot Stone Therapy', description: 'Relaxing hot stone massage', price: 30, duration: 15, popular: true },
        { id: 'addon-aromatherapy', name: 'Aromatherapy Upgrade', description: 'Essential oils for relaxation', price: 10, duration: 0 },
        { id: 'addon-cupping', name: 'Cupping Therapy', description: 'Traditional cupping for tension', price: 25, duration: 10 },
      ],
      questions: [
        { id: 'q-pressure-preference', text: 'What pressure level do you prefer?', type: 'multiple_choice', required: true, options: ['Light', 'Medium', 'Firm', 'Deep Tissue'] },
        { id: 'q-focus-areas', text: 'Which areas need the most attention?', type: 'multiple_choice', required: true, options: ['Neck & Shoulders', 'Back', 'Legs', 'Feet', 'Full Body'] },
        { id: 'q-massage-experience', text: 'How experienced are you with massage therapy?', type: 'multiple_choice', required: true, options: ['First time', 'Occasional', 'Regular', 'Very experienced'] },
      ],
      requiresDeposit: false,
      allowsGroupBooking: false,
      tags: ['massage', 'relaxation', 'wellness', 'therapeutic'],
      assignedStaff: ['staff-8', 'staff-9'],
      recommendedFor: ['Stress relief', 'Muscle tension', 'Wellness routine'],
      contraindications: ['Recent injuries', 'Pregnancy', 'Blood pressure issues'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      rating: 4.9,
      reviewCount: 145,
      bookingCount: 78,
    },

    // Regular Services
    {
      id: '5',
      name: 'Classic Manicure',
      category: 'Nail Services',
      description: 'Essential nail care with perfect shaping, cuticle treatment, and your choice of classic polish.',
      duration: 30,
      basePrice: 25,
      price: 25,
      showOnline: true,
      featured: false,
      imageUrl: '/src/assets/services/gel-manicure-process.jpg',
      addOns: [
        { id: 'addon-french', name: 'French Tips', description: 'Classic elegant white tips', price: 5, duration: 5, popular: true },
        { id: 'addon-cuticle-oil', name: 'Cuticle Oil Treatment', description: 'Nourishing cuticle oil', price: 5, duration: 5 },
        { id: 'addon-quick-dry', name: 'Quick Dry Top Coat', description: 'Fast-drying top coat', price: 3, duration: 0 },
      ],
      questions: [
        { id: 'q-allergies', text: 'Do you have any allergies we should know about?', type: 'yes_no', required: true },
        { id: 'q-nail-length', text: 'What nail length would you like?', type: 'multiple_choice', required: true, options: ['Natural', 'Short', 'Medium', 'Long'] },
      ],
      requiresDeposit: false,
      allowsGroupBooking: true,
      maxGroupSize: 6,
      tags: ['manicure', 'classic', 'polish'],
      assignedStaff: ['staff-1', 'staff-2', 'staff-3'],
      recommendedFor: ['Regular maintenance', 'Quick service'],
      contraindications: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      rating: 4.6,
      reviewCount: 198,
      bookingCount: 134,
    },
    {
      id: '6',
      name: 'Express Manicure',
      category: 'Nail Services',
      description: 'Perfect for busy schedules - quick professional shaping and polish application.',
      duration: 20,
      basePrice: 20,
      price: 20,
      showOnline: true,
      featured: false,
      imageUrl: '/src/assets/services/gel-manicure-process.jpg',
      addOns: [
        { id: 'addon-quick-dry', name: 'Quick Dry Top Coat', description: 'Fast-drying top coat', price: 3, duration: 0, popular: true },
      ],
      questions: [
        { id: 'q-allergies', text: 'Do you have any allergies we should know about?', type: 'yes_no', required: true },
      ],
      requiresDeposit: false,
      allowsGroupBooking: true,
      maxGroupSize: 8,
      tags: ['manicure', 'express', 'quick'],
      assignedStaff: ['staff-1', 'staff-2', 'staff-3'],
      recommendedFor: ['Busy schedules', 'Quick touch-ups'],
      contraindications: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      rating: 4.4,
      reviewCount: 156,
      bookingCount: 98,
    },
    {
      id: '7',
      name: 'Pedicure',
      category: 'Nail Services',
      description: 'Complete foot care with exfoliation, massage, and beautiful polish for healthy, beautiful feet.',
      duration: 45,
      basePrice: 40,
      price: 40,
      showOnline: true,
      featured: false,
      imageUrl: '/src/assets/services/pedicure-spa-B0Hu4mLo.jpg',
      addOns: [
        { id: 'addon-french', name: 'French Tips', description: 'Classic elegant white tips', price: 5, duration: 5 },
        { id: 'addon-cuticle-oil', name: 'Cuticle Oil Treatment', description: 'Nourishing cuticle oil', price: 5, duration: 5 },
      ],
      questions: [
        { id: 'q-allergies', text: 'Do you have any allergies we should know about?', type: 'yes_no', required: true },
        { id: 'q-nail-length', text: 'What nail length would you like?', type: 'multiple_choice', required: true, options: ['Natural', 'Short', 'Medium', 'Long'] },
      ],
      requiresDeposit: false,
      allowsGroupBooking: true,
      maxGroupSize: 4,
      tags: ['pedicure', 'foot care', 'relaxation'],
      assignedStaff: ['staff-1', 'staff-2', 'staff-3'],
      recommendedFor: ['Foot care', 'Summer prep', 'Relaxation'],
      contraindications: ['Foot infections', 'Open wounds'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      rating: 4.7,
      reviewCount: 178,
      bookingCount: 112,
    },
    {
      id: '8',
      name: 'Hair Cut & Style',
      category: 'Hair Services',
      description: 'Professional haircut with personalized styling consultation and beautiful finish.',
      duration: 60,
      basePrice: 65,
      price: 65,
      showOnline: true,
      featured: false,
      imageUrl: '/src/assets/services/haircut-styling-Ce42DRR0.jpg',
      addOns: [
        { id: 'addon-deep-conditioning', name: 'Deep Conditioning Treatment', description: 'Intensive moisture treatment', price: 25, duration: 20 },
        { id: 'addon-blow-dry', name: 'Professional Blow Dry', description: 'Styling and blow dry', price: 15, duration: 20, popular: true },
      ],
      questions: [
        { id: 'q-allergies', text: 'Do you have any allergies we should know about?', type: 'yes_no', required: true },
        { id: 'q-hair-type', text: 'What is your hair type?', type: 'multiple_choice', required: true, options: ['Straight', 'Wavy', 'Curly', 'Coily', 'Mixed Texture'] },
        { id: 'q-hair-goals', text: 'What are your hair goals for this visit?', type: 'multiple_choice', required: true, options: ['Maintenance', 'New Style', 'Trim', 'Major Change'] },
      ],
      requiresDeposit: false,
      allowsGroupBooking: false,
      tags: ['haircut', 'styling', 'consultation'],
      assignedStaff: ['staff-4', 'staff-5'],
      recommendedFor: ['Regular maintenance', 'Style changes'],
      contraindications: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      rating: 4.8,
      reviewCount: 203,
      bookingCount: 145,
    },
    {
      id: '9',
      name: 'Balayage Highlights',
      category: 'Hair Services',
      description: 'Hand-painted highlights for natural, sun-kissed look with seamless color blending.',
      duration: 150,
      basePrice: 150,
      price: 150,
      showOnline: true,
      featured: false,
      imageUrl: '/src/assets/services/work-balayage-CcxDGK12.jpg',
      addOns: [
        { id: 'addon-deep-conditioning', name: 'Deep Conditioning Treatment', description: 'Intensive moisture treatment', price: 25, duration: 20, popular: true },
        { id: 'addon-hair-gloss', name: 'Hair Gloss Treatment', description: 'Shine-enhancing gloss', price: 30, duration: 15 },
        { id: 'addon-blow-dry', name: 'Professional Blow Dry', description: 'Styling and blow dry', price: 15, duration: 20 },
      ],
      questions: [
        { id: 'q-allergies', text: 'Do you have any allergies we should know about?', type: 'yes_no', required: true },
        { id: 'q-hair-type', text: 'What is your hair type?', type: 'multiple_choice', required: true, options: ['Straight', 'Wavy', 'Curly', 'Coily', 'Mixed Texture'] },
        { id: 'q-hair-condition', text: 'How would you describe your hair condition?', type: 'multiple_choice', required: true, options: ['Healthy', 'Dry', 'Damaged', 'Oily', 'Color-Treated'] },
        { id: 'q-previous-color', text: 'Do you currently have color-treated hair?', type: 'yes_no', required: true },
      ],
      requiresDeposit: true,
      depositAmount: 75,
      depositType: 'flat',
      allowsGroupBooking: false,
      tags: ['balayage', 'highlights', 'color', 'natural'],
      assignedStaff: ['staff-4', 'staff-5'],
      recommendedFor: ['Natural highlights', 'Low maintenance color'],
      contraindications: ['Severe hair damage', 'Recent chemical treatments'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      rating: 4.9,
      reviewCount: 167,
      bookingCount: 89,
    },
    {
      id: '10',
      name: 'Deep Cleansing Facial',
      category: 'Facial Services',
      description: 'Intensive cleansing facial for oily and combination skin with extraction and purifying mask.',
      duration: 60,
      basePrice: 70,
      price: 70,
      showOnline: true,
      featured: false,
      imageUrl: '/src/assets/services/facial-treatment-BfIqRVLV.jpg',
      addOns: [
        { id: 'addon-extraction', name: 'Facial Extraction', description: 'Professional blackhead removal', price: 20, duration: 15, popular: true },
        { id: 'addon-face-mask', name: 'Custom Face Mask', description: 'Personalized mask for your skin', price: 15, duration: 20 },
      ],
      questions: [
        { id: 'q-allergies', text: 'Do you have any allergies we should know about?', type: 'yes_no', required: true },
        { id: 'q-skin-conditions', text: 'Do you have any skin conditions or sensitivities?', type: 'yes_no', required: true },
        { id: 'q-skin-type', text: 'What is your skin type?', type: 'multiple_choice', required: true, options: ['Normal', 'Dry', 'Oily', 'Combination', 'Sensitive'] },
        { id: 'q-skin-concerns', text: 'What are your main skin concerns?', type: 'multiple_choice', required: true, options: ['Acne', 'Aging', 'Dark Spots', 'Dryness', 'Sensitivity', 'None'] },
      ],
      requiresDeposit: false,
      allowsGroupBooking: true,
      maxGroupSize: 2,
      tags: ['facial', 'deep cleansing', 'extraction'],
      assignedStaff: ['staff-6', 'staff-7'],
      recommendedFor: ['Oily skin', 'Acne concerns', 'Deep cleansing'],
      contraindications: ['Active acne', 'Sensitive skin'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      rating: 4.6,
      reviewCount: 134,
      bookingCount: 78,
    },
  ];

  return services;
};

// Generate mock staff - 10 diverse staff members matching booking flow
export const generateMockStaff = (): Staff[] => {
  return [
    {
      id: 'staff-1',
      name: 'Sarah Johnson',
      title: 'Master Nail Artist',
      photo: '/src/assets/services/team-sarah-chen-URQerpPJ.jpg',
      rating: 4.9,
      specialties: ['Gel Extensions', 'Nail Art', 'French Tips', 'Custom Designs'],
      workingHours: {
        monday: { start: '09:00', end: '18:00' },
        tuesday: { start: '09:00', end: '18:00' },
        wednesday: { start: '09:00', end: '18:00' },
        thursday: { start: '09:00', end: '18:00' },
        friday: { start: '09:00', end: '18:00' },
        saturday: { start: '10:00', end: '16:00' },
      },
      daysOff: [],
    },
    {
      id: 'staff-2',
      name: 'Emily Chen',
      title: 'Color Specialist',
      photo: '/src/assets/services/team-emily-rodriguez-DTqBpi97.jpg',
      rating: 4.8,
      specialties: ['Ombre Designs', 'Seasonal Art', 'Color Matching', 'Gel Polish'],
      workingHours: {
        monday: { start: '10:00', end: '19:00' },
        tuesday: { start: '10:00', end: '19:00' },
        wednesday: { start: '10:00', end: '19:00' },
        thursday: { start: '10:00', end: '19:00' },
        friday: { start: '10:00', end: '19:00' },
        saturday: { start: '09:00', end: '17:00' },
      },
      daysOff: [],
    },
    {
      id: 'staff-3',
      name: 'Jessica Lee',
      title: 'Express Service Expert',
      photo: '/src/assets/services/team-jessica-lee-D-ibEIML.jpg',
      rating: 4.7,
      specialties: ['Express Services', 'Classic Manicures', 'Quick Polish Changes'],
      workingHours: {
        monday: { start: '08:00', end: '16:00' },
        tuesday: { start: '08:00', end: '16:00' },
        wednesday: { start: '08:00', end: '16:00' },
        thursday: { start: '08:00', end: '16:00' },
        friday: { start: '08:00', end: '16:00' },
        saturday: { start: '09:00', end: '15:00' },
      },
      daysOff: [],
    },
    {
      id: 'staff-4',
      name: 'Marcus Williams',
      title: 'Master Colorist',
      photo: '/src/assets/services/team-marcus-williams-BlTij_Pl.jpg',
      rating: 4.9,
      specialties: ['Color Correction', 'Balayage', 'Highlights', 'Color Consultation'],
      workingHours: {
        monday: { start: '09:00', end: '18:00' },
        tuesday: { start: '09:00', end: '18:00' },
        wednesday: { start: '09:00', end: '18:00' },
        thursday: { start: '09:00', end: '18:00' },
        friday: { start: '09:00', end: '18:00' },
        saturday: { start: '10:00', end: '16:00' },
      },
      daysOff: [],
    },
    {
      id: 'staff-5',
      name: 'Michael Tan',
      title: 'Cut & Style Specialist',
      photo: '/src/assets/services/team-michael-tan-BUXpYYbp.jpg',
      rating: 4.8,
      specialties: ['Precision Cuts', 'Modern Styling', 'Trend Consultation', 'Blowouts'],
      workingHours: {
        monday: { start: '10:00', end: '19:00' },
        tuesday: { start: '10:00', end: '19:00' },
        wednesday: { start: '10:00', end: '19:00' },
        thursday: { start: '10:00', end: '19:00' },
        friday: { start: '10:00', end: '19:00' },
        saturday: { start: '09:00', end: '17:00' },
      },
      daysOff: [],
    },
    {
      id: 'staff-6',
      name: 'David Park',
      title: 'Skin Care Specialist',
      photo: '/src/assets/services/team-david-park-BBEtCVwm.jpg',
      rating: 4.9,
      specialties: ['Facial Treatments', 'Skin Analysis', 'Anti-Aging', 'Acne Treatment'],
      workingHours: {
        monday: { start: '09:00', end: '18:00' },
        tuesday: { start: '09:00', end: '18:00' },
        wednesday: { start: '09:00', end: '18:00' },
        thursday: { start: '09:00', end: '18:00' },
        friday: { start: '09:00', end: '18:00' },
        saturday: { start: '10:00', end: '16:00' },
      },
      daysOff: [],
    },
    {
      id: 'staff-7',
      name: 'Lisa Rodriguez',
      title: 'Facial Specialist',
      photo: '/src/assets/services/team-emily-rodriguez-DTqBpi97.jpg',
      rating: 4.7,
      specialties: ['Deep Cleansing', 'Extraction', 'Sensitive Skin', 'Custom Treatments'],
      workingHours: {
        monday: { start: '10:00', end: '19:00' },
        tuesday: { start: '10:00', end: '19:00' },
        wednesday: { start: '10:00', end: '19:00' },
        thursday: { start: '10:00', end: '19:00' },
        friday: { start: '10:00', end: '19:00' },
        saturday: { start: '09:00', end: '17:00' },
      },
      daysOff: [],
    },
    {
      id: 'staff-8',
      name: 'Robert Kim',
      title: 'Therapeutic Massage Specialist',
      photo: '/src/assets/services/team-michael-tan-BUXpYYbp.jpg',
      rating: 4.9,
      specialties: ['Therapeutic Massage', 'Stress Relief', 'Deep Tissue', 'Hot Stone Therapy'],
      workingHours: {
        monday: { start: '09:00', end: '18:00' },
        tuesday: { start: '09:00', end: '18:00' },
        wednesday: { start: '09:00', end: '18:00' },
        thursday: { start: '09:00', end: '18:00' },
        friday: { start: '09:00', end: '18:00' },
        saturday: { start: '10:00', end: '16:00' },
      },
      daysOff: [],
    },
    {
      id: 'staff-9',
      name: 'Amanda Foster',
      title: 'Relaxation Specialist',
      photo: '/src/assets/services/team-sarah-chen-URQerpPJ.jpg',
      rating: 4.8,
      specialties: ['Relaxation Massage', 'Aromatherapy', 'Swedish Massage', 'Couples Massage'],
      workingHours: {
        monday: { start: '10:00', end: '19:00' },
        tuesday: { start: '10:00', end: '19:00' },
        wednesday: { start: '10:00', end: '19:00' },
        thursday: { start: '10:00', end: '19:00' },
        friday: { start: '10:00', end: '19:00' },
        saturday: { start: '09:00', end: '17:00' },
      },
      daysOff: [],
    },
    {
      id: 'staff-10',
      name: 'Jennifer Martinez',
      title: 'Wellness Specialist',
      photo: '/src/assets/services/team-jessica-lee-D-ibEIML.jpg',
      rating: 4.8,
      specialties: ['Spa Coordination', 'Wellness Treatments', 'Client Consultation', 'Treatment Planning'],
      workingHours: {
        monday: { start: '09:00', end: '18:00' },
        tuesday: { start: '09:00', end: '18:00' },
        wednesday: { start: '09:00', end: '18:00' },
        thursday: { start: '09:00', end: '18:00' },
        friday: { start: '09:00', end: '18:00' },
        saturday: { start: '10:00', end: '16:00' },
      },
      daysOff: [],
    },
  ];
};

// Get staff data
export const getStaff = (): Staff[] => {
  return JSON.parse(localStorage.getItem('mango-staff') || '[]');
};

// Generate mock orders for admin dashboard
export const generateMockOrders = (): Order[] => {
  const orders: Order[] = [
    {
      id: 'ORD-001',
      orderNumber: 'ORD-001',
      customerId: 'client-1',
      customerName: 'Sarah Johnson',
      customerEmail: 'sarah.johnson@example.com',
      customerPhone: '(555) 123-4567',
      orderDate: '2024-01-15T10:30:00Z',
      status: 'completed',
      total: 89.50,
      subtotal: 79.50,
      tax: 8.00,
      tip: 2.00,
      items: [
        {
          id: 'item-1',
          type: 'service',
          serviceId: '1',
          name: 'Classic Manicure',
          price: 35.00,
          quantity: 1,
          addOns: [
            {
              id: 'addon-1',
              name: 'Gel Polish',
              price: 10.00,
              quantity: 1,
            },
          ],
        },
        {
          id: 'item-2',
          type: 'product',
          productId: '1',
          name: 'Cuticle Oil',
          price: 12.00,
          quantity: 1,
        },
      ],
      paymentMethod: 'card',
      paymentStatus: 'paid',
      notes: 'Regular customer, prefers natural colors',
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-15T11:00:00Z',
    },
    {
      id: 'ORD-002',
      orderNumber: 'ORD-002',
      customerId: 'client-2',
      customerName: 'Emily Chen',
      customerEmail: 'emily.chen@example.com',
      customerPhone: '(555) 234-5678',
      orderDate: '2024-01-14T14:15:00Z',
      status: 'pending',
      total: 125.00,
      subtotal: 115.00,
      tax: 10.00,
      tip: 0,
      items: [
        {
          id: 'item-3',
          type: 'service',
          serviceId: '2',
          name: 'Gel Manicure',
          price: 45.00,
          quantity: 1,
        },
        {
          id: 'item-4',
          type: 'service',
          serviceId: '3',
          name: 'Pedicure',
          price: 50.00,
          quantity: 1,
        },
      ],
      paymentMethod: 'card',
      paymentStatus: 'pending',
      notes: 'First-time customer',
      createdAt: '2024-01-14T14:15:00Z',
      updatedAt: '2024-01-14T14:15:00Z',
    },
    {
      id: 'ORD-003',
      orderNumber: 'ORD-003',
      customerId: 'client-3',
      customerName: 'Jessica Lee',
      customerEmail: 'jessica.lee@example.com',
      customerPhone: '(555) 345-6789',
      orderDate: '2024-01-13T09:45:00Z',
      status: 'cancelled',
      total: 0,
      subtotal: 0,
      tax: 0,
      tip: 0,
      items: [],
      paymentMethod: 'card',
      paymentStatus: 'refunded',
      notes: 'Customer cancelled due to emergency',
      createdAt: '2024-01-13T09:45:00Z',
      updatedAt: '2024-01-13T10:30:00Z',
    },
  ];

  return orders;
};

// Get orders data
export const getOrders = (): Order[] => {
  return JSON.parse(localStorage.getItem('mango-orders') || '[]');
};

// Initialize all mock data
export const initializeMockData = (): void => {
  if (typeof window === 'undefined') {
    console.log('⏭️  Skipping mock data initialization (SSR)');
    return;
  }

  try {
    // Initialize services if not already done
    if (!localStorage.getItem('mango-services')) {
      const services = generateMockServices();
      localStorage.setItem('mango-services', JSON.stringify(services));
      console.log('✅ Services initialized');
    }

    // Initialize staff if not already done
    if (!localStorage.getItem('mango-staff')) {
      const staff = generateMockStaff();
      localStorage.setItem('mango-staff', JSON.stringify(staff));
      console.log('✅ Staff initialized');
    }

    // Initialize orders if not already done
    if (!localStorage.getItem('mango-orders')) {
      const orders = generateMockOrders();
      localStorage.setItem('mango-orders', JSON.stringify(orders));
      console.log('✅ Orders initialized');
    }

    console.log('✅ Mock data initialized successfully');
  } catch (error) {
    console.error('❌ Mock data initialization failed:', error);
  }
};

// Get revenue data
export const getRevenueData = () => {
  return JSON.parse(localStorage.getItem('mango-revenue') || '[]');
};

// Get bookings data
export const getBookings = (): Booking[] => {
  return JSON.parse(localStorage.getItem('mango-bookings') || '[]');
};

// Get products data
export const getProducts = () => {
  return JSON.parse(localStorage.getItem('mango-products') || '[]');
};

// Mock review data for testing
export const mockReviews = [
  {
    id: "review-1",
    clientName: "Sarah Johnson",
    rating: 5,
    text: "Amazing experience! The staff was professional and my nails look perfect. Will definitely be back!",
    date: "2023-12-15",
    serviceName: "Luxury Gel Manicure",
    verified: true,
  },
  {
    id: "review-2",
    clientName: "Emily Chen",
    rating: 5,
    text: "Best salon in town! The facial treatment was incredible and my skin has never looked better.",
    date: "2023-12-12",
    serviceName: "Signature Facial",
    verified: true,
  },
  {
    id: "review-3",
    clientName: "Marcus Williams",
    rating: 4,
    text: "Great haircut and color! The stylist really listened to what I wanted and delivered exactly that.",
    date: "2023-12-10",
    serviceName: "Premium Hair Color",
    verified: true,
  },
  {
    id: "review-4",
    clientName: "Jessica Lee",
    rating: 5,
    text: "The massage was so relaxing! Perfect way to unwind after a stressful week. Highly recommend!",
    date: "2023-12-08",
    serviceName: "Relaxing Massage",
    verified: true,
  },
  {
    id: "review-5",
    clientName: "David Park",
    rating: 5,
    text: "Professional service and beautiful results. The team really knows what they're doing!",
    date: "2023-12-05",
    serviceName: "Classic Manicure",
    verified: true,
  },
];

/**
 * Initialize template data in localStorage
 * Should be called on app startup
 */
export function initializeTemplateData(): void {
  if (typeof window === 'undefined') {
    console.log('⏭️  Skipping template initialization (SSR)');
    return;
  }

  try {
    // Initialize all storage
    console.log('📦 Initializing template storage...');
    initializeTemplateStorage();
    
    console.log('⚙️  Initializing storefront config...');
    initializeStorefrontConfig();
    
    console.log('🎁 Initializing gift card config...');
    initializeGiftCardConfig();
    
    console.log('💎 Initializing membership plans...');
    initializeMembershipPlans();

    // Seed default template sections from salon-showcase.json
    console.log('🌱 Seeding template sections...');
    // seedTemplateSections('salon-showcase', salonShowcase.sections as any);

    console.log('✅ Template data initialized successfully');
  } catch (error) {
    console.error('❌ Template data initialization failed:', error);
    throw error; // Re-throw so main.tsx can catch it
  }
}
