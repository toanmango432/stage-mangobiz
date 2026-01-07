/**
 * Survey Management Constants
 * Icon mappings and status configurations
 */

import {
  TrendingUp,
  Star,
  Activity,
  ClipboardList,
  Hash,
  BarChart3,
  Smile,
  CircleDot,
  CheckSquare,
  ChevronDown,
  Minus,
  AlignLeft,
  ToggleLeft,
  Grid,
  ListOrdered,
} from 'lucide-react';
import type { SurveyType, SurveyStatus, QuestionType } from '@/types';

// Icons for survey types
export const TYPE_ICONS: Record<SurveyType, typeof TrendingUp> = {
  nps: TrendingUp,
  csat: Star,
  ces: Activity,
  custom: ClipboardList,
};

// Icons for question types
export const QUESTION_ICONS: Record<QuestionType, typeof Hash> = {
  nps_scale: Hash,
  rating_stars: Star,
  rating_numeric: BarChart3,
  rating_emoji: Smile,
  single_choice: CircleDot,
  multiple_choice: CheckSquare,
  dropdown: ChevronDown,
  text_short: Minus,
  text_long: AlignLeft,
  yes_no: ToggleLeft,
  matrix: Grid,
  ranking: ListOrdered,
};

// Status config for display
export const STATUS_CONFIG: Record<SurveyStatus, { label: string; color: string; bgColor: string }> = {
  draft: { label: 'Draft', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  scheduled: { label: 'Scheduled', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  active: { label: 'Active', color: 'text-green-600', bgColor: 'bg-green-100' },
  paused: { label: 'Paused', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  closed: { label: 'Closed', color: 'text-gray-500', bgColor: 'bg-gray-100' },
  archived: { label: 'Archived', color: 'text-gray-400', bgColor: 'bg-gray-50' },
};
