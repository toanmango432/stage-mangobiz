// Policies Library - Booking policies and agreements
// Used in PolicyAgreementFlow component

export interface BookingPolicy {
  id: string;
  title: string;
  description: string;
  fullText: string;
  requiresAgreement: boolean;
  category?: string;
}

export const bookingPolicies: Record<string, BookingPolicy> = {
  cancellation: {
    id: 'policy-cancellation',
    title: 'Cancellation Policy',
    description: '24-hour notice required for cancellations',
    fullText: 'We require at least 24 hours notice for cancellations or rescheduling. Cancellations made less than 24 hours in advance will be charged 50% of the service cost. No-shows will be charged the full service amount.',
    requiresAgreement: true,
    category: 'booking',
  },
  noShow: {
    id: 'policy-no-show',
    title: 'No-Show Policy',
    description: 'No-shows will be charged 50% of service cost',
    fullText: 'If you fail to show up for your appointment without prior notice, you will be charged 50% of the scheduled service cost. This helps us maintain availability for other clients.',
    requiresAgreement: true,
    category: 'booking',
  },
  lateArrival: {
    id: 'policy-late-arrival',
    title: 'Late Arrival Policy',
    description: 'Late arrivals may result in shortened service time',
    fullText: 'Please arrive on time for your appointment. If you arrive more than 15 minutes late, we may need to shorten your service time to accommodate other clients. In extreme cases, we may need to reschedule your appointment.',
    requiresAgreement: true,
    category: 'booking',
  },
  deposit: {
    id: 'policy-deposit',
    title: 'Deposit Policy',
    description: 'Deposits are required for certain services',
    fullText: 'Some services require a deposit to secure your appointment. Deposits are applied to your service total and are non-refundable for cancellations made less than 24 hours in advance.',
    requiresAgreement: true,
    category: 'payment',
  },
  refunds: {
    id: 'policy-refunds',
    title: 'Refund Policy',
    description: 'Service satisfaction guarantee',
    fullText: 'We strive for 100% client satisfaction. If you are not completely satisfied with your service, please let us know within 48 hours and we will work to make it right. Refunds are at the discretion of management.',
    requiresAgreement: true,
    category: 'service',
  },
  healthSafety: {
    id: 'policy-health-safety',
    title: 'Health & Safety Policy',
    description: 'Important health and safety information',
    fullText: 'Please inform us of any allergies, medical conditions, or medications that may affect your service. We maintain strict sanitation standards and use only professional-grade products. If you experience any adverse reactions, please contact us immediately.',
    requiresAgreement: true,
    category: 'safety',
  },
  children: {
    id: 'policy-children',
    title: 'Children Policy',
    description: 'Guidelines for children in the salon',
    fullText: 'Children under 12 must be accompanied by an adult. We ask that children remain supervised at all times for their safety and the comfort of other clients. Some services may not be suitable for young children.',
    requiresAgreement: false,
    category: 'general',
  },
  photography: {
    id: 'policy-photography',
    title: 'Photography Policy',
    description: 'Guidelines for photos and social media',
    fullText: 'We love when you share your beautiful results! Please ask permission before taking photos of other clients or staff. We may take before/after photos for our portfolio with your consent.',
    requiresAgreement: false,
    category: 'general',
  },
  covid: {
    id: 'policy-covid',
    title: 'COVID-19 Safety',
    description: 'Current health and safety protocols',
    fullText: 'We follow all current health department guidelines. If you are feeling unwell or have been exposed to COVID-19, please reschedule your appointment. We maintain enhanced cleaning protocols and may require masks in certain areas.',
    requiresAgreement: true,
    category: 'safety',
  },
  gratuity: {
    id: 'policy-gratuity',
    title: 'Gratuity Policy',
    description: 'Information about tipping',
    fullText: 'Gratuities are appreciated but not required. Standard gratuity is 15-20% of service cost. You can add gratuity when booking online or pay directly to your service provider.',
    requiresAgreement: false,
    category: 'payment',
  },
};

// Helper functions
export const getPoliciesByCategory = (category: string): BookingPolicy[] => {
  return Object.values(bookingPolicies).filter(policy => policy.category === category);
};

export const getRequiredPolicies = (): BookingPolicy[] => {
  return Object.values(bookingPolicies).filter(policy => policy.requiresAgreement);
};

export const getPolicyById = (id: string): BookingPolicy | undefined => {
  return Object.values(bookingPolicies).find(policy => policy.id === id);
};

// Pre-defined policy sets for different service types
export const policySets = {
  allPolicies: Object.keys(bookingPolicies),
  essentialPolicies: ['policy-cancellation', 'policy-no-show', 'policy-health-safety'],
  bookingPolicies: ['policy-cancellation', 'policy-no-show', 'policy-late-arrival'],
  paymentPolicies: ['policy-deposit', 'policy-refunds', 'policy-gratuity'],
  safetyPolicies: ['policy-health-safety', 'policy-covid'],
  generalPolicies: ['policy-children', 'policy-photography'],
};



