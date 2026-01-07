/**
 * Survey System Types
 * Comprehensive feedback collection system for user insights
 *
 * Best Practices Implemented:
 * - Multiple survey types (NPS, CSAT, CES, custom)
 * - Various question types (rating, choice, text, scale)
 * - Flexible triggering (event-based, time-based, manual)
 * - Granular targeting (tier, role, behavior)
 * - Response analytics and sentiment tracking
 */

// ============================================================================
// SURVEY TYPES
// ============================================================================

/** Type of survey determines scoring methodology */
export type SurveyType =
  | 'nps'           // Net Promoter Score (0-10 scale)
  | 'csat'          // Customer Satisfaction (1-5 stars)
  | 'ces'           // Customer Effort Score (1-7 scale)
  | 'custom';       // Custom survey with flexible questions

/** Survey status in lifecycle */
export type SurveyStatus =
  | 'draft'         // Being edited
  | 'scheduled'     // Scheduled for future
  | 'active'        // Currently collecting responses
  | 'paused'        // Temporarily paused
  | 'closed'        // No longer accepting responses
  | 'archived';     // Archived for reference

// ============================================================================
// QUESTION TYPES
// ============================================================================

/** Types of questions supported */
export type QuestionType =
  | 'nps_scale'         // 0-10 NPS scale
  | 'rating_stars'      // 1-5 star rating
  | 'rating_numeric'    // Numeric scale (customizable)
  | 'rating_emoji'      // Emoji-based rating
  | 'single_choice'     // Radio buttons
  | 'multiple_choice'   // Checkboxes
  | 'dropdown'          // Dropdown select
  | 'text_short'        // Single line text
  | 'text_long'         // Multi-line textarea
  | 'yes_no'            // Boolean yes/no
  | 'matrix'            // Grid/matrix question
  | 'ranking';          // Drag-to-rank items

/** Configuration for rating questions */
export interface RatingConfig {
  min: number;
  max: number;
  minLabel?: string;        // e.g., "Not at all likely"
  maxLabel?: string;        // e.g., "Extremely likely"
  showLabels?: boolean;
  step?: number;            // For numeric ratings
}

/** Configuration for choice questions */
export interface ChoiceConfig {
  options: {
    id: string;
    label: string;
    value: string;
    icon?: string;          // Optional icon
  }[];
  allowOther?: boolean;     // Allow "Other" free text option
  randomize?: boolean;      // Randomize option order
  maxSelections?: number;   // For multiple choice
}

/** Configuration for matrix questions */
export interface MatrixConfig {
  rows: { id: string; label: string }[];
  columns: { id: string; label: string; value: string }[];
  allowMultiplePerRow?: boolean;
}

/** A single question in a survey */
export interface SurveyQuestion {
  id: string;
  type: QuestionType;
  text: string;
  description?: string;     // Help text
  required: boolean;
  order: number;

  // Type-specific configuration
  ratingConfig?: RatingConfig;
  choiceConfig?: ChoiceConfig;
  matrixConfig?: MatrixConfig;

  // Conditional logic
  conditions?: {
    questionId: string;     // Show only if this question...
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
    value: string | number;
  }[];

  // Validation
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;       // Regex pattern
    errorMessage?: string;
  };
}

// ============================================================================
// TARGETING & TRIGGERING
// ============================================================================

/** When to show the survey */
export type SurveyTrigger =
  | 'manual'              // Admin manually sends
  | 'after_transaction'   // After completing a transaction
  | 'after_appointment'   // After appointment completion
  | 'after_login'         // After user login
  | 'time_on_platform'    // After X days on platform
  | 'inactivity'          // After period of inactivity
  | 'feature_usage'       // After using specific feature
  | 'support_ticket'      // After support interaction
  | 'periodic';           // Recurring (e.g., monthly)

/** Trigger configuration */
export interface TriggerConfig {
  trigger: SurveyTrigger;

  // Time-based triggers
  delayMinutes?: number;          // Delay after trigger event
  cooldownDays?: number;          // Min days between showing same survey

  // Feature-based triggers
  featureKey?: string;            // Which feature triggers survey
  usageCount?: number;            // After N uses of feature

  // Periodic triggers
  intervalDays?: number;          // For periodic surveys
  maxResponses?: number;          // Max responses from same user

  // Time restrictions
  showDuringHours?: {
    start: number;                // Hour (0-23)
    end: number;
    timezone?: string;
  };
}

/** Who should see this survey */
export interface SurveyTargeting {
  // Tier-based targeting
  tiers: ('all' | 'free' | 'basic' | 'professional' | 'enterprise')[];

  // Role-based targeting
  roles: ('all' | 'owner' | 'manager' | 'staff')[];

  // Specific tenant IDs
  specificTenantIds?: string[];

  // Behavior-based targeting
  behavior?: {
    newUsers?: boolean;           // Users in first 30 days
    activeUsers?: boolean;        // Users active in last 7 days
    churningUsers?: boolean;      // Users showing churn signals
    powerUsers?: boolean;         // High-engagement users
  };

  // Sampling
  samplePercentage?: number;      // Only show to X% of eligible users
}

// ============================================================================
// SURVEY CONTENT
// ============================================================================

/** Survey appearance and branding */
export interface SurveyAppearance {
  theme: 'light' | 'dark' | 'auto';
  primaryColor?: string;
  showProgressBar: boolean;
  showQuestionNumbers: boolean;
  logoUrl?: string;
}

/** Thank you page configuration */
export interface ThankYouConfig {
  title: string;
  message: string;
  showScore?: boolean;            // Show their NPS/CSAT score
  ctaButton?: {
    label: string;
    url?: string;
    action?: string;
  };
  redirectAfterSeconds?: number;
}

// ============================================================================
// RESPONSES & ANALYTICS
// ============================================================================

/** A single answer to a question */
export interface QuestionAnswer {
  questionId: string;
  questionType: QuestionType;
  value: string | number | string[] | Record<string, string>;
  text?: string;                  // For "other" or text responses
}

/** A complete survey response */
export interface SurveyResponse {
  id: string;
  surveyId: string;

  // Respondent info
  tenantId: string;
  storeId?: string;
  userId?: string;

  // Response data
  answers: QuestionAnswer[];

  // Calculated scores
  npsScore?: number;              // 0-10 for NPS surveys
  csatScore?: number;             // 1-5 for CSAT surveys
  cesScore?: number;              // 1-7 for CES surveys

  // Sentiment analysis
  sentiment?: 'positive' | 'neutral' | 'negative';
  sentimentScore?: number;        // -1 to 1

  // Metadata
  completedAt: Date;
  startedAt: Date;
  durationSeconds: number;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  source?: string;                // How they accessed survey

  // Follow-up
  followUpRequested?: boolean;
  followUpStatus?: 'pending' | 'contacted' | 'resolved';
  followUpNotes?: string;
}

/** Aggregated survey statistics */
export interface SurveyStats {
  totalResponses: number;
  completionRate: number;         // Started vs completed
  avgDurationSeconds: number;

  // Score distributions
  npsDistribution?: {
    promoters: number;            // 9-10
    passives: number;             // 7-8
    detractors: number;           // 0-6
    score: number;                // -100 to 100
  };
  csatDistribution?: {
    scores: Record<number, number>;
    avgScore: number;
  };
  cesDistribution?: {
    scores: Record<number, number>;
    avgScore: number;
  };

  // Sentiment
  sentimentBreakdown?: {
    positive: number;
    neutral: number;
    negative: number;
  };

  // Response trends
  responsesPerDay?: { date: string; count: number }[];
}

// ============================================================================
// MAIN SURVEY TYPE
// ============================================================================

export interface Survey {
  id: string;

  // Basic info
  name: string;                   // Internal name
  title: string;                  // Displayed to users
  description?: string;
  type: SurveyType;
  status: SurveyStatus;

  // Questions
  questions: SurveyQuestion[];

  // Configuration
  targeting: SurveyTargeting;
  trigger: TriggerConfig;
  appearance: SurveyAppearance;
  thankYou: ThankYouConfig;

  // Scheduling
  startsAt?: Date;
  endsAt?: Date;

  // Limits
  maxResponses?: number;          // Total responses allowed
  maxResponsesPerUser?: number;   // Per user limit

  // Stats (denormalized)
  stats: SurveyStats;

  // Metadata
  tags?: string[];
  internalNotes?: string;

  // Audit
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  closedAt?: Date;
}

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface CreateSurveyInput {
  name: string;
  title: string;
  description?: string;
  type: SurveyType;
  questions: Omit<SurveyQuestion, 'id'>[];
  targeting: SurveyTargeting;
  trigger: TriggerConfig;
  appearance?: Partial<SurveyAppearance>;
  thankYou?: Partial<ThankYouConfig>;
  startsAt?: Date;
  endsAt?: Date;
  maxResponses?: number;
  maxResponsesPerUser?: number;
  tags?: string[];
  internalNotes?: string;
}

export interface UpdateSurveyInput {
  name?: string;
  title?: string;
  description?: string;
  type?: SurveyType;
  status?: SurveyStatus;
  questions?: SurveyQuestion[];
  targeting?: Partial<SurveyTargeting>;
  trigger?: Partial<TriggerConfig>;
  appearance?: Partial<SurveyAppearance>;
  thankYou?: Partial<ThankYouConfig>;
  startsAt?: Date;
  endsAt?: Date;
  maxResponses?: number;
  maxResponsesPerUser?: number;
  tags?: string[];
  internalNotes?: string;
}

export interface CreateSurveyResponseInput {
  surveyId: string;
  tenantId: string;
  storeId?: string;
  userId?: string;
  answers: QuestionAnswer[];
  startedAt: Date;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  source?: string;
}

// ============================================================================
// UI CONFIGURATION
// ============================================================================

export const SURVEY_TYPE_CONFIG: Record<SurveyType, {
  label: string;
  description: string;
  icon: string;
  defaultQuestion: Partial<SurveyQuestion>;
}> = {
  nps: {
    label: 'Net Promoter Score',
    description: 'Measure customer loyalty with the classic 0-10 scale',
    icon: 'trending-up',
    defaultQuestion: {
      type: 'nps_scale',
      text: 'How likely are you to recommend us to a friend or colleague?',
      required: true,
      ratingConfig: {
        min: 0,
        max: 10,
        minLabel: 'Not at all likely',
        maxLabel: 'Extremely likely',
      },
    },
  },
  csat: {
    label: 'Customer Satisfaction',
    description: 'Measure satisfaction with a 1-5 star rating',
    icon: 'star',
    defaultQuestion: {
      type: 'rating_stars',
      text: 'How satisfied are you with our service?',
      required: true,
      ratingConfig: {
        min: 1,
        max: 5,
        minLabel: 'Very dissatisfied',
        maxLabel: 'Very satisfied',
      },
    },
  },
  ces: {
    label: 'Customer Effort Score',
    description: 'Measure ease of use with a 1-7 effort scale',
    icon: 'activity',
    defaultQuestion: {
      type: 'rating_numeric',
      text: 'How easy was it to accomplish your goal today?',
      required: true,
      ratingConfig: {
        min: 1,
        max: 7,
        minLabel: 'Very difficult',
        maxLabel: 'Very easy',
      },
    },
  },
  custom: {
    label: 'Custom Survey',
    description: 'Build your own survey with flexible questions',
    icon: 'clipboard-list',
    defaultQuestion: {
      type: 'single_choice',
      text: 'Enter your question here',
      required: true,
    },
  },
};

export const QUESTION_TYPE_CONFIG: Record<QuestionType, {
  label: string;
  icon: string;
  description: string;
  category: 'rating' | 'choice' | 'text' | 'advanced';
}> = {
  nps_scale: {
    label: 'NPS Scale (0-10)',
    icon: 'hash',
    description: 'Net Promoter Score scale',
    category: 'rating',
  },
  rating_stars: {
    label: 'Star Rating',
    icon: 'star',
    description: '1-5 star rating',
    category: 'rating',
  },
  rating_numeric: {
    label: 'Numeric Scale',
    icon: 'sliders',
    description: 'Custom numeric scale',
    category: 'rating',
  },
  rating_emoji: {
    label: 'Emoji Rating',
    icon: 'smile',
    description: 'Emoji-based rating',
    category: 'rating',
  },
  single_choice: {
    label: 'Single Choice',
    icon: 'circle-dot',
    description: 'Select one option',
    category: 'choice',
  },
  multiple_choice: {
    label: 'Multiple Choice',
    icon: 'check-square',
    description: 'Select multiple options',
    category: 'choice',
  },
  dropdown: {
    label: 'Dropdown',
    icon: 'chevron-down',
    description: 'Select from dropdown',
    category: 'choice',
  },
  text_short: {
    label: 'Short Text',
    icon: 'minus',
    description: 'Single line answer',
    category: 'text',
  },
  text_long: {
    label: 'Long Text',
    icon: 'align-left',
    description: 'Multi-line answer',
    category: 'text',
  },
  yes_no: {
    label: 'Yes/No',
    icon: 'toggle-left',
    description: 'Boolean response',
    category: 'choice',
  },
  matrix: {
    label: 'Matrix/Grid',
    icon: 'grid',
    description: 'Grid of options',
    category: 'advanced',
  },
  ranking: {
    label: 'Ranking',
    icon: 'list-ordered',
    description: 'Rank items in order',
    category: 'advanced',
  },
};

export const TRIGGER_CONFIG: Record<SurveyTrigger, {
  label: string;
  icon: string;
  description: string;
}> = {
  manual: {
    label: 'Manual',
    icon: 'send',
    description: 'Send manually via link or email',
  },
  after_transaction: {
    label: 'After Transaction',
    icon: 'credit-card',
    description: 'Show after checkout completion',
  },
  after_appointment: {
    label: 'After Appointment',
    icon: 'calendar-check',
    description: 'Show after appointment ends',
  },
  after_login: {
    label: 'After Login',
    icon: 'log-in',
    description: 'Show after user logs in',
  },
  time_on_platform: {
    label: 'Time on Platform',
    icon: 'clock',
    description: 'Show after X days as customer',
  },
  inactivity: {
    label: 'After Inactivity',
    icon: 'moon',
    description: 'Show when user returns after inactivity',
  },
  feature_usage: {
    label: 'Feature Usage',
    icon: 'zap',
    description: 'Show after using specific feature',
  },
  support_ticket: {
    label: 'After Support',
    icon: 'headphones',
    description: 'Show after support interaction',
  },
  periodic: {
    label: 'Periodic',
    icon: 'repeat',
    description: 'Show on recurring schedule',
  },
};

export const SURVEY_STATUS_CONFIG: Record<SurveyStatus, {
  label: string;
  color: string;
  bgColor: string;
}> = {
  draft: { label: 'Draft', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  scheduled: { label: 'Scheduled', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  active: { label: 'Active', color: 'text-green-600', bgColor: 'bg-green-100' },
  paused: { label: 'Paused', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  closed: { label: 'Closed', color: 'text-red-600', bgColor: 'bg-red-100' },
  archived: { label: 'Archived', color: 'text-gray-400', bgColor: 'bg-gray-50' },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate NPS score from responses
 */
export function calculateNPSScore(scores: number[]): {
  promoters: number;
  passives: number;
  detractors: number;
  score: number;
} {
  if (scores.length === 0) {
    return { promoters: 0, passives: 0, detractors: 0, score: 0 };
  }

  let promoters = 0;
  let passives = 0;
  let detractors = 0;

  for (const score of scores) {
    if (score >= 9) promoters++;
    else if (score >= 7) passives++;
    else detractors++;
  }

  const total = scores.length;
  const npsScore = Math.round(((promoters - detractors) / total) * 100);

  return {
    promoters,
    passives,
    detractors,
    score: npsScore,
  };
}

/**
 * Calculate average score
 */
export function calculateAverageScore(scores: number[]): number {
  if (scores.length === 0) return 0;
  const sum = scores.reduce((a, b) => a + b, 0);
  return Math.round((sum / scores.length) * 10) / 10;
}

/**
 * Determine sentiment from text using simple keywords
 */
export function analyzeSentiment(text: string): {
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number;
} {
  const positiveWords = ['great', 'excellent', 'amazing', 'love', 'fantastic', 'wonderful', 'best', 'happy', 'satisfied', 'easy', 'helpful'];
  const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'disappointed', 'frustrated', 'difficult', 'slow', 'confusing', 'unhappy'];

  const lowerText = text.toLowerCase();
  let score = 0;

  for (const word of positiveWords) {
    if (lowerText.includes(word)) score += 0.2;
  }
  for (const word of negativeWords) {
    if (lowerText.includes(word)) score -= 0.2;
  }

  score = Math.max(-1, Math.min(1, score));

  return {
    sentiment: score > 0.1 ? 'positive' : score < -0.1 ? 'negative' : 'neutral',
    score,
  };
}

/**
 * Create empty survey stats
 */
export function createEmptySurveyStats(): SurveyStats {
  return {
    totalResponses: 0,
    completionRate: 0,
    avgDurationSeconds: 0,
  };
}

/**
 * Create default appearance
 */
export function createDefaultAppearance(): SurveyAppearance {
  return {
    theme: 'light',
    showProgressBar: true,
    showQuestionNumbers: true,
  };
}

/**
 * Create default thank you config
 */
export function createDefaultThankYou(): ThankYouConfig {
  return {
    title: 'Thank you for your feedback!',
    message: 'Your response has been recorded. We appreciate you taking the time to help us improve.',
  };
}
