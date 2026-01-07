export interface SlotHold {
  date: string;
  time: string;
  serviceId: string;
  expiresAt: number;
  holdId: string;
}

const HOLD_KEY = 'slot-holds';
const HOLD_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

export const slotHolds = {
  /**
   * Create a temporary hold on a time slot
   */
  create: (date: string, time: string, serviceId: string): SlotHold => {
    const hold: SlotHold = {
      date,
      time,
      serviceId,
      expiresAt: Date.now() + HOLD_DURATION,
      holdId: `hold-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    const holds = slotHolds.getAll();
    holds.push(hold);
    localStorage.setItem(HOLD_KEY, JSON.stringify(holds));

    return hold;
  },

  /**
   * Get all active holds (non-expired)
   */
  getAll: (): SlotHold[] => {
    const holds = JSON.parse(localStorage.getItem(HOLD_KEY) || '[]') as SlotHold[];
    const now = Date.now();
    
    // Filter out expired holds
    const activeHolds = holds.filter(hold => hold.expiresAt > now);
    
    // Update localStorage if we removed expired holds
    if (activeHolds.length !== holds.length) {
      localStorage.setItem(HOLD_KEY, JSON.stringify(activeHolds));
    }

    return activeHolds;
  },

  /**
   * Check if a slot is currently held
   */
  isHeld: (date: string, time: string, excludeHoldId?: string): boolean => {
    const holds = slotHolds.getAll();
    return holds.some(
      hold => hold.date === date && hold.time === time && hold.holdId !== excludeHoldId
    );
  },

  /**
   * Release a specific hold
   */
  release: (holdId: string): void => {
    const holds = slotHolds.getAll();
    const updatedHolds = holds.filter(hold => hold.holdId !== holdId);
    localStorage.setItem(HOLD_KEY, JSON.stringify(updatedHolds));
  },

  /**
   * Get time remaining for a hold
   */
  getTimeRemaining: (holdId: string): number => {
    const holds = slotHolds.getAll();
    const hold = holds.find(h => h.holdId === holdId);
    
    if (!hold) return 0;
    
    const remaining = hold.expiresAt - Date.now();
    return remaining > 0 ? remaining : 0;
  },

  /**
   * Clean up all expired holds
   */
  cleanup: (): void => {
    slotHolds.getAll(); // This automatically cleans up expired holds
  },
};
