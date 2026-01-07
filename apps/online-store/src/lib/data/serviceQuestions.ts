// Service Questions Library - Pre-defined questions for different service types
// Organized by category and service type for easy assignment

export interface ServiceQuestion {
  id: string;
  text: string;
  type: 'text' | 'multiple_choice' | 'yes_no' | 'scale';
  required: boolean;
  options?: string[];
  helpText?: string;
  category?: string;
}

export const commonQuestions: Record<string, ServiceQuestion> = {
  // General Health & Safety Questions
  allergyCheck: {
    id: 'q-allergies',
    text: 'Do you have any allergies we should know about?',
    type: 'yes_no',
    required: true,
    helpText: 'This helps us select safe products for you',
    category: 'safety',
  },
  skinConditions: {
    id: 'q-skin-conditions',
    text: 'Do you have any skin conditions or sensitivities?',
    type: 'yes_no',
    required: true,
    helpText: 'Important for facial and waxing services',
    category: 'safety',
  },
  medications: {
    id: 'q-medications',
    text: 'Are you currently taking any medications that might affect your service?',
    type: 'yes_no',
    required: false,
    helpText: 'Some medications can affect hair color or skin sensitivity',
    category: 'safety',
  },
  pregnancy: {
    id: 'q-pregnancy',
    text: 'Are you pregnant or nursing?',
    type: 'yes_no',
    required: false,
    helpText: 'Some treatments may not be suitable during pregnancy',
    category: 'safety',
  },

  // Nail Service Questions
  previousGel: {
    id: 'q-previous-gel',
    text: 'Do you currently have gel polish that needs removal?',
    type: 'yes_no',
    required: true,
    options: ['Yes (+$10, +15min)', 'No'],
    helpText: 'Gel removal requires additional time and cost',
    category: 'nails',
  },
  nailLength: {
    id: 'q-nail-length',
    text: 'What nail length would you like?',
    type: 'multiple_choice',
    required: true,
    options: ['Natural', 'Short', 'Medium', 'Long', 'Extra Long (+$15)'],
    category: 'nails',
  },
  nailShape: {
    id: 'q-nail-shape',
    text: 'What nail shape do you prefer?',
    type: 'multiple_choice',
    required: true,
    options: ['Round', 'Square', 'Oval', 'Almond', 'Stiletto'],
    category: 'nails',
  },
  nailArtStyle: {
    id: 'q-nail-art-style',
    text: 'What style of nail art are you interested in?',
    type: 'multiple_choice',
    required: false,
    options: ['Simple', 'Floral', 'Geometric', 'Abstract', 'Custom Design'],
    helpText: 'Custom designs may require additional time',
    category: 'nails',
  },
  nailHealth: {
    id: 'q-nail-health',
    text: 'How would you describe your nail health?',
    type: 'multiple_choice',
    required: true,
    options: ['Excellent', 'Good', 'Fair', 'Poor', 'Very Brittle'],
    helpText: 'This helps us recommend the best treatment',
    category: 'nails',
  },

  // Hair Service Questions
  hairType: {
    id: 'q-hair-type',
    text: 'What is your hair type?',
    type: 'multiple_choice',
    required: true,
    options: ['Straight', 'Wavy', 'Curly', 'Coily', 'Mixed Texture'],
    category: 'hair',
  },
  hairCondition: {
    id: 'q-hair-condition',
    text: 'How would you describe your hair condition?',
    type: 'multiple_choice',
    required: true,
    options: ['Healthy', 'Dry', 'Damaged', 'Oily', 'Color-Treated'],
    helpText: 'This helps us choose the right products',
    category: 'hair',
  },
  previousColor: {
    id: 'q-previous-color',
    text: 'Do you currently have color-treated hair?',
    type: 'yes_no',
    required: true,
    helpText: 'Previous color affects new color results',
    category: 'hair',
  },
  hairGoals: {
    id: 'q-hair-goals',
    text: 'What are your hair goals for this visit?',
    type: 'multiple_choice',
    required: true,
    options: ['Maintenance', 'Color Change', 'Cut & Style', 'Repair', 'Special Event'],
    category: 'hair',
  },
  scalpSensitivity: {
    id: 'q-scalp-sensitivity',
    text: 'Do you have a sensitive scalp?',
    type: 'yes_no',
    required: true,
    helpText: 'Important for chemical treatments',
    category: 'hair',
  },

  // Facial Service Questions
  skinType: {
    id: 'q-skin-type',
    text: 'What is your skin type?',
    type: 'multiple_choice',
    required: true,
    options: ['Normal', 'Dry', 'Oily', 'Combination', 'Sensitive'],
    category: 'facial',
  },
  skinConcerns: {
    id: 'q-skin-concerns',
    text: 'What are your main skin concerns?',
    type: 'multiple_choice',
    required: true,
    options: ['Acne', 'Aging', 'Dark Spots', 'Dryness', 'Sensitivity', 'None'],
    category: 'facial',
  },
  currentProducts: {
    id: 'q-current-products',
    text: 'What skincare products do you currently use?',
    type: 'text',
    required: false,
    helpText: 'This helps us avoid product conflicts',
    category: 'facial',
  },
  facialFrequency: {
    id: 'q-facial-frequency',
    text: 'How often do you get facials?',
    type: 'multiple_choice',
    required: true,
    options: ['First time', 'Monthly', 'Quarterly', 'Rarely', 'Never'],
    category: 'facial',
  },

  // Massage Service Questions
  pressurePreference: {
    id: 'q-pressure-preference',
    text: 'What pressure level do you prefer?',
    type: 'multiple_choice',
    required: true,
    options: ['Light', 'Medium', 'Firm', 'Deep Tissue'],
    category: 'massage',
  },
  focusAreas: {
    id: 'q-focus-areas',
    text: 'Which areas need the most attention?',
    type: 'multiple_choice',
    required: true,
    options: ['Neck & Shoulders', 'Back', 'Legs', 'Feet', 'Full Body'],
    category: 'massage',
  },
  massageExperience: {
    id: 'q-massage-experience',
    text: 'How experienced are you with massage therapy?',
    type: 'multiple_choice',
    required: true,
    options: ['First time', 'Occasional', 'Regular', 'Very experienced'],
    category: 'massage',
  },

  // Waxing Service Questions
  waxingExperience: {
    id: 'q-waxing-experience',
    text: 'How experienced are you with waxing?',
    type: 'multiple_choice',
    required: true,
    options: ['First time', 'Occasional', 'Regular', 'Very experienced'],
    category: 'waxing',
  },
  skinSensitivity: {
    id: 'q-skin-sensitivity',
    text: 'Do you have sensitive skin?',
    type: 'yes_no',
    required: true,
    helpText: 'We can use gentler products if needed',
    category: 'waxing',
  },
  hairLength: {
    id: 'q-hair-length',
    text: 'How long is the hair we\'ll be waxing?',
    type: 'multiple_choice',
    required: true,
    options: ['Very short (1-2 weeks)', 'Short (2-4 weeks)', 'Medium (4-6 weeks)', 'Long (6+ weeks)'],
    helpText: 'Optimal length is 1/4 inch for best results',
    category: 'waxing',
  },

  // Booking Preferences
  appointmentType: {
    id: 'q-appointment-type',
    text: 'What type of appointment is this?',
    type: 'multiple_choice',
    required: true,
    options: ['Regular', 'First Time', 'Special Event', 'Maintenance', 'Emergency'],
    category: 'booking',
  },
  timeConstraints: {
    id: 'q-time-constraints',
    text: 'Do you have any time constraints today?',
    type: 'yes_no',
    required: false,
    helpText: 'We can adjust our service timing if needed',
    category: 'booking',
  },
  groupSize: {
    id: 'q-group-size',
    text: 'How many people are in your group?',
    type: 'multiple_choice',
    required: false,
    options: ['Just me', '2 people', '3 people', '4 people', '5+ people'],
    helpText: 'Group bookings may require special scheduling',
    category: 'booking',
  },
};

// Helper functions
export const getQuestionsByCategory = (category: string): ServiceQuestion[] => {
  return Object.values(commonQuestions).filter(question => question.category === category);
};

export const getRequiredQuestions = (): ServiceQuestion[] => {
  return Object.values(commonQuestions).filter(question => question.required);
};

export const getQuestionById = (id: string): ServiceQuestion | undefined => {
  return Object.values(commonQuestions).find(question => question.id === id);
};

// Pre-defined question sets for common service combinations
export const questionSets = {
  nailServices: ['q-allergies', 'q-previous-gel', 'q-nail-length', 'q-nail-shape', 'q-nail-health'],
  hairServices: ['q-allergies', 'q-hair-type', 'q-hair-condition', 'q-previous-color', 'q-hair-goals', 'q-scalp-sensitivity'],
  facialServices: ['q-allergies', 'q-skin-conditions', 'q-skin-type', 'q-skin-concerns', 'q-facial-frequency'],
  massageServices: ['q-pressure-preference', 'q-focus-areas', 'q-massage-experience'],
  waxingServices: ['q-waxing-experience', 'q-skin-sensitivity', 'q-hair-length'],
  safetyQuestions: ['q-allergies', 'q-skin-conditions', 'q-medications', 'q-pregnancy'],
  bookingQuestions: ['q-appointment-type', 'q-time-constraints', 'q-group-size'],
};



