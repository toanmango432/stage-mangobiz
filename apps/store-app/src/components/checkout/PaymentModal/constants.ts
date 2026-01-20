/**
 * PaymentModal Constants
 * Configuration and constant values for the payment modal
 */

import { CreditCard, Banknote, Gift, DollarSign } from "lucide-react";
import type { PaymentMethodOption, Step } from "./types";

/** Default tip percentage options */
export const TIP_PERCENTAGES: number[] = [15, 18, 20, 25];

/** Default tip percentage (pre-selected) */
export const DEFAULT_TIP_PERCENTAGE = 20;

/** Wizard steps for the payment flow */
export const STEPS: Step[] = [
  { id: 1, label: "Add Tip", sublabel: "optional" },
  { id: 2, label: "Payment", sublabel: "required" },
  { id: 3, label: "Complete", sublabel: "final" },
];

/** Available payment method options */
export const PAYMENT_METHODS: PaymentMethodOption[] = [
  { id: "card", label: "Credit Card", icon: CreditCard },
  { id: "cash", label: "Cash", icon: Banknote },
  { id: "gift_card", label: "Gift Card", icon: Gift },
  { id: "custom", label: "Other", icon: DollarSign },
];

/** Delay before showing success animation (ms) */
export const SUCCESS_ANIMATION_DELAY = 800;

/** Minimum amount remaining to consider payment incomplete */
export const PAYMENT_COMPLETION_THRESHOLD = 0.01;
