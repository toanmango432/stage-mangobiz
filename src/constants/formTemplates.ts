/**
 * Pre-built Form Templates
 * PRD Reference: 2.3.4 Consultation Forms - Form Templates Library
 */

import type { TemplateLibraryItem, FormSection } from '../types/form';
import { v4 as uuidv4 } from 'uuid';

/** Helper to create a section with auto-generated ID */
const createSection = (
  type: FormSection['type'],
  label: string,
  required: boolean,
  config: FormSection['config'],
  order: number,
  description?: string
): FormSection => ({
  id: uuidv4(),
  type,
  label,
  description,
  required,
  config,
  order,
});

// ==================== COVID-19 HEALTH SCREENING ====================

export const COVID_HEALTH_SCREENING: TemplateLibraryItem = {
  id: 'tpl_covid_screening',
  name: 'COVID-19 Health Screening',
  description: 'Standard health screening questionnaire for COVID-19 symptoms and exposure.',
  category: 'health_safety',
  template: {
    name: 'COVID-19 Health Screening',
    description: 'Required health screening before your appointment',
    category: 'health',
    sendMode: 'automatic',
    frequency: 'every_time',
    requiresSignature: true,
    sendBeforeHours: 24,
    reminderEnabled: true,
    reminderIntervalHours: 4,
    expirationHours: 48,
    isActive: true,
    isBuiltIn: true,
    sections: [
      createSection('info_text', 'Health Screening Notice', false, {
        content: '## Health Screening Questionnaire\n\nPlease complete this questionnaire honestly. Your responses help us maintain a safe environment for all clients and staff.',
        variant: 'info',
      }, 1),
      createSection('single_choice', 'Do you currently have any of the following symptoms?', true, {
        options: [
          'No symptoms',
          'Fever or chills',
          'Cough',
          'Shortness of breath',
          'Fatigue',
          'Body aches',
          'Loss of taste or smell',
          'Other symptoms',
        ],
      }, 2, 'Select the option that best describes your current health status'),
      createSection('single_choice', 'Have you tested positive for COVID-19 in the last 10 days?', true, {
        options: ['No', 'Yes'],
      }, 3),
      createSection('single_choice', 'Have you been in close contact with someone who tested positive for COVID-19 in the last 14 days?', true, {
        options: ['No', 'Yes', 'Unsure'],
      }, 4),
      createSection('single_choice', 'Have you traveled internationally in the last 14 days?', true, {
        options: ['No', 'Yes'],
      }, 5),
      createSection('consent_checkbox', 'Health Acknowledgment', true, {
        consentText: 'I confirm that all information provided is accurate to the best of my knowledge. I understand that providing false information may result in service refusal and could put others at risk.',
      }, 6),
      createSection('signature', 'Your Signature', true, {}, 7),
    ],
  },
};

// ==================== HAIR COLOR CONSULTATION ====================

export const HAIR_COLOR_CONSULTATION: TemplateLibraryItem = {
  id: 'tpl_hair_color',
  name: 'Hair Color Consultation',
  description: 'Comprehensive consultation form for hair color services including allergy information.',
  category: 'consultation',
  template: {
    name: 'Hair Color Consultation',
    description: 'Please complete this form before your color service',
    category: 'consultation',
    sendMode: 'automatic',
    frequency: 'once',
    requiresSignature: true,
    sendBeforeHours: 48,
    reminderEnabled: true,
    reminderIntervalHours: 12,
    expirationHours: 72,
    isActive: true,
    isBuiltIn: true,
    sections: [
      createSection('info_text', 'Color Service Information', false, {
        content: '## Hair Color Consultation\n\nThis form helps us understand your hair history and any potential allergies. Please answer all questions honestly for your safety.',
        variant: 'default',
      }, 1),
      createSection('single_choice', 'Is this your first time coloring your hair?', true, {
        options: ['Yes, first time', 'No, I have colored before'],
      }, 2),
      createSection('text_input', 'Current hair color', true, {
        placeholder: 'e.g., Dark brown with some gray',
        multiline: false,
      }, 3),
      createSection('text_input', 'Desired hair color', true, {
        placeholder: 'e.g., Light auburn with highlights',
        multiline: false,
      }, 4),
      createSection('single_choice', 'Have you used any hair color products in the last 6 months?', true, {
        options: ['No', 'Yes - Professional salon', 'Yes - Box dye at home', 'Yes - Both'],
      }, 5),
      createSection('text_input', 'If yes, what products/colors were used?', false, {
        placeholder: 'Brand and color name if known',
        multiline: true,
      }, 6),
      createSection('single_choice', 'Have you had any chemical treatments in the last year?', true, {
        options: ['None', 'Keratin treatment', 'Relaxer/Straightening', 'Perm', 'Other'],
      }, 7),
      createSection('info_text', 'Allergy Information', false, {
        content: '### Allergy Screening\n\n**Important:** Some individuals may be allergic to hair color ingredients. Please answer the following questions carefully.',
        variant: 'warning',
      }, 8),
      createSection('single_choice', 'Have you ever had an allergic reaction to hair color?', true, {
        options: ['No', 'Yes - Mild reaction', 'Yes - Severe reaction'],
      }, 9),
      createSection('multi_choice', 'Do you have any of the following conditions?', true, {
        options: [
          'None of the below',
          'Sensitive scalp',
          'Eczema or psoriasis',
          'Recent surgery or open wounds on scalp',
          'Currently pregnant or breastfeeding',
          'Taking medication that affects skin sensitivity',
        ],
      }, 10),
      createSection('single_choice', 'Have you completed a patch test in the last 48 hours?', true, {
        options: ['Yes, with no reaction', 'Yes, with reaction', 'No, not yet'],
      }, 11, 'A patch test is required 48 hours before color service'),
      createSection('consent_checkbox', 'Color Service Consent', true, {
        consentText: 'I understand that hair color contains chemicals that may cause allergic reactions. I confirm that I have disclosed all relevant information about my hair history and health conditions. I agree to follow all aftercare instructions provided.',
      }, 12),
      createSection('signature', 'Your Signature', true, {}, 13),
    ],
  },
};

// ==================== MEDICAL HISTORY ====================

export const MEDICAL_HISTORY: TemplateLibraryItem = {
  id: 'tpl_medical_history',
  name: 'Medical History Form',
  description: 'Comprehensive medical history for spa and treatment services.',
  category: 'health_safety',
  template: {
    name: 'Medical History Form',
    description: 'Your health information helps us provide safe and effective treatments',
    category: 'health',
    sendMode: 'manual',
    frequency: 'once',
    requiresSignature: true,
    sendBeforeHours: 72,
    reminderEnabled: true,
    reminderIntervalHours: 24,
    expirationHours: 168,
    isActive: true,
    isBuiltIn: true,
    sections: [
      createSection('info_text', 'Medical History Notice', false, {
        content: '## Medical History Questionnaire\n\nThis confidential form helps us understand your health needs. All information is kept secure and used only to provide you with safe treatments.',
        variant: 'info',
      }, 1),
      createSection('client_details', 'Your Information', true, {
        fields: ['name', 'email', 'phone', 'birthday'],
      }, 2),
      createSection('multi_choice', 'Do you have any of the following medical conditions?', true, {
        options: [
          'None of the below',
          'Heart condition',
          'High or low blood pressure',
          'Diabetes',
          'Epilepsy',
          'Asthma',
          'Blood clotting disorder',
          'Autoimmune condition',
          'Cancer (current or history)',
          'Skin condition (eczema, psoriasis, etc.)',
          'Thyroid condition',
        ],
      }, 3),
      createSection('text_input', 'Please describe any conditions checked above', false, {
        placeholder: 'Provide details about your medical conditions...',
        multiline: true,
      }, 4),
      createSection('text_input', 'Current Medications', false, {
        placeholder: 'List any medications, vitamins, or supplements you take regularly',
        multiline: true,
      }, 5),
      createSection('text_input', 'Known Allergies', false, {
        placeholder: 'List any allergies (medications, foods, products, etc.)',
        multiline: true,
      }, 6),
      createSection('single_choice', 'Are you currently pregnant or breastfeeding?', true, {
        options: ['No', 'Yes - Pregnant', 'Yes - Breastfeeding', 'Prefer not to answer'],
      }, 7),
      createSection('single_choice', 'Have you had any surgeries in the last 6 months?', true, {
        options: ['No', 'Yes'],
      }, 8),
      createSection('text_input', 'If yes, please describe', false, {
        placeholder: 'Type of surgery and date',
        multiline: false,
      }, 9),
      createSection('single_choice', 'Do you have any metal implants or pacemaker?', true, {
        options: ['No', 'Yes - Metal implants', 'Yes - Pacemaker', 'Yes - Both'],
      }, 10),
      createSection('text_input', 'Emergency Contact', true, {
        placeholder: 'Name and phone number',
        multiline: false,
      }, 11),
      createSection('consent_checkbox', 'Medical History Consent', true, {
        consentText: 'I confirm that all information provided is accurate and complete. I understand that withholding information may affect the safety and effectiveness of my treatments. I agree to notify the salon of any changes to my health status.',
      }, 12),
      createSection('signature', 'Your Signature', true, {}, 13),
    ],
  },
};

// ==================== PHOTO RELEASE WAIVER ====================

export const PHOTO_RELEASE_WAIVER: TemplateLibraryItem = {
  id: 'tpl_photo_release',
  name: 'Photo Release Waiver',
  description: 'Permission form for using client photos for marketing and portfolio.',
  category: 'consent_waiver',
  template: {
    name: 'Photo Release Waiver',
    description: 'Permission to use photos of your service results',
    category: 'consent',
    sendMode: 'manual',
    frequency: 'once',
    requiresSignature: true,
    sendBeforeHours: 0,
    reminderEnabled: false,
    expirationHours: 168,
    isActive: true,
    isBuiltIn: true,
    sections: [
      createSection('info_text', 'Photo Release Information', false, {
        content: '## Photo Release Waiver\n\nWe love showcasing our work! With your permission, we may use photos of your service results for marketing, social media, and our portfolio.',
        variant: 'default',
      }, 1),
      createSection('client_details', 'Your Information', true, {
        fields: ['name', 'email'],
      }, 2),
      createSection('multi_choice', 'I grant permission to use my photos for:', true, {
        options: [
          'Social media (Instagram, Facebook, TikTok)',
          'Website portfolio',
          'Print materials (brochures, flyers)',
          'In-salon displays',
          'Training purposes',
        ],
        minSelections: 1,
      }, 3, 'Select all that apply'),
      createSection('single_choice', 'May we tag you in social media posts?', true, {
        options: ['Yes, please tag me', 'No, do not tag me', 'Ask me each time'],
      }, 4),
      createSection('single_choice', 'Duration of this release', true, {
        options: ['Indefinitely', 'One year', 'Six months', 'This visit only'],
      }, 5),
      createSection('info_text', 'Terms', false, {
        content: '**Terms of Photo Release:**\n- Photos will not be sold to third parties\n- You may request removal at any time by contacting us\n- Photos may be edited for lighting and color correction\n- Your full name will not be shared without additional consent',
        variant: 'info',
      }, 6),
      createSection('consent_checkbox', 'Photo Release Agreement', true, {
        consentText: 'I grant permission for the use of my photographs as specified above. I understand I may revoke this permission at any time by providing written notice. I release the salon from any claims related to the use of these photographs.',
      }, 7),
      createSection('signature', 'Your Signature', true, {}, 8),
    ],
  },
};

// ==================== LASH EXTENSION CONSENT ====================

export const LASH_EXTENSION_CONSENT: TemplateLibraryItem = {
  id: 'tpl_lash_consent',
  name: 'Lash Extension Consent',
  description: 'Consent and waiver form for eyelash extension services.',
  category: 'consent_waiver',
  template: {
    name: 'Lash Extension Consent Form',
    description: 'Required consent form for lash extension services',
    category: 'consent',
    sendMode: 'automatic',
    frequency: 'once',
    requiresSignature: true,
    sendBeforeHours: 24,
    reminderEnabled: true,
    reminderIntervalHours: 6,
    expirationHours: 48,
    isActive: true,
    isBuiltIn: true,
    sections: [
      createSection('info_text', 'Lash Extension Information', false, {
        content: '## Eyelash Extension Consent Form\n\nPlease read the following information carefully before your appointment.',
        variant: 'default',
      }, 1),
      createSection('single_choice', 'Is this your first time getting lash extensions?', true, {
        options: ['Yes', 'No'],
      }, 2),
      createSection('single_choice', 'Have you ever had an allergic reaction to lash adhesive?', true, {
        options: ['No', 'Yes', 'Not sure'],
      }, 3),
      createSection('multi_choice', 'Do you have any of the following conditions?', true, {
        options: [
          'None of the below',
          'Sensitive eyes',
          'Dry eyes',
          'Eye allergies',
          'Blepharitis',
          'Recent eye surgery',
          'Contact lens wearer',
          'Currently using Latisse or lash growth serum',
        ],
      }, 4),
      createSection('info_text', 'Pre-Service Instructions', false, {
        content: '**Before your appointment:**\n- Remove all eye makeup\n- Avoid caffeine (to reduce eye twitching)\n- Remove contact lenses\n- Arrive with clean lashes (no mascara)',
        variant: 'info',
      }, 5),
      createSection('info_text', 'Aftercare Information', false, {
        content: '**After your appointment:**\n- Avoid water on lashes for 24 hours\n- No steam, sauna, or swimming for 48 hours\n- Do not use oil-based products near eyes\n- Brush lashes daily with provided spoolie\n- Schedule fills every 2-3 weeks',
        variant: 'info',
      }, 6),
      createSection('consent_checkbox', 'Service Consent', true, {
        consentText: 'I understand that eyelash extensions are a cosmetic procedure. I have disclosed all relevant medical information. I understand the aftercare requirements and agree to follow them. I release the salon and technician from liability for any adverse reactions that may occur.',
      }, 7),
      createSection('signature', 'Your Signature', true, {}, 8),
    ],
  },
};

// ==================== EXPORTS ====================

/** All pre-built templates */
export const PRE_BUILT_TEMPLATES: TemplateLibraryItem[] = [
  COVID_HEALTH_SCREENING,
  HAIR_COLOR_CONSULTATION,
  MEDICAL_HISTORY,
  PHOTO_RELEASE_WAIVER,
  LASH_EXTENSION_CONSENT,
];

/** Get template by ID */
export function getPreBuiltTemplate(id: string): TemplateLibraryItem | undefined {
  return PRE_BUILT_TEMPLATES.find(t => t.id === id);
}

/** Get templates by category */
export function getTemplatesByCategory(category: TemplateLibraryItem['category']): TemplateLibraryItem[] {
  return PRE_BUILT_TEMPLATES.filter(t => t.category === category);
}
