// utils/creditHelpers.ts
export interface UserCreditData {
  credits_allowed: number | null;
  credits_used: number | null;
  carryover: number | null;
  carryover_expiry: Date | null;
  next_credit_reset: Date | null;
  credit_reset_day: number | null;
  current_period_start?: Date | null;
}

/**
 * Available credits including non-expired carryover.
 */
export interface AvailableCredits {
  available: number;
  total: number;
}

export function getAvailableCredits(user: UserCreditData): AvailableCredits {
  const base = Math.max(0, (user.credits_allowed || 0) - (user.credits_used || 0));

  let carryover = 0;
  const now = new Date();
  
  // Include carryover credits if:
  // 1. No expiry is set (undefined/null) - treat as non-expiring
  // 2. OR expiry exists and hasn't passed yet
  if (!user.carryover_expiry || now < user.carryover_expiry) {
    carryover = user.carryover || 0;
  }

  return {
    available: base + carryover,
    total: base + carryover,
  };
}

/**
 * Reset check: should we reset credits now?
 */
export function shouldResetCredits(user: UserCreditData, currentDate: Date = new Date()): boolean {
  if (!user.next_credit_reset) return false;
  const nextReset = new Date(user.next_credit_reset);
  nextReset.setHours(0, 0, 0, 0);
  const now = new Date(currentDate);
  now.setHours(0, 0, 0, 0);
  return now >= nextReset;
}

/**
 * Calculate next reset date based on a reset day (1..31).
 * Uses UTC to avoid timezone issues.
 */
export function calculateNextResetDate(currentDate: Date, resetDay: number): Date {
  // Work in UTC to avoid timezone issues
  const year = currentDate.getUTCFullYear();
  const month = currentDate.getUTCMonth();
  
  // Next month in UTC
  const nextMonth = month + 1;
  const nextYear = nextMonth > 11 ? year + 1 : year;
  const normalizedMonth = nextMonth % 12;
  
  // Get the last day of next month
  const lastDayOfNext = new Date(Date.UTC(nextYear, normalizedMonth + 1, 0)).getUTCDate();
  const day = Math.min(resetDay, lastDayOfNext);
  
  // Create date at midnight UTC on the reset day
  return new Date(Date.UTC(nextYear, normalizedMonth, day, 0, 0, 0));
}

/**
 * Reset monthly credits.
 */
export function resetMonthlyCredits(user: UserCreditData): {
  credits_used: number;
  carryover: number;
  carryover_expiry: Date | null;
  next_credit_reset: Date;
} {
  const now = new Date();
  const carryExpired = !user.carryover_expiry || now >= user.carryover_expiry;
  
  let resetDay = user.credit_reset_day;
  if (user.current_period_start) {
    resetDay = new Date(user.current_period_start).getDate();
  }
  if (!resetDay) {
    resetDay = user.next_credit_reset ? new Date(user.next_credit_reset).getDate() : now.getDate();
  }

  const candidate = new Date(now);
  const currentMonthIndices = now.getDate() < resetDay ? 0 : 1;
  
  candidate.setMonth(candidate.getMonth() + currentMonthIndices);
  const totalDaysInMonth = new Date(candidate.getFullYear(), candidate.getMonth() + 1, 0).getDate();
  const actualDay = Math.min(resetDay, totalDaysInMonth);
  
  candidate.setDate(actualDay);
  candidate.setHours(0, 0, 0, 0);

  return {
    credits_used: 0,
    carryover: carryExpired ? 0 : (user.carryover || 0),
    carryover_expiry: carryExpired ? null : user.carryover_expiry,
    next_credit_reset: candidate,
  };
}

/**
 * Calculate carryover when a plan changes.
 */
export function calculateCarryover(
  oldAllowed: number,
  oldUsed: number,
  oldNextReset: Date | null,
  existingCarryover: number = 0,
  existingExpiry: Date | null = null
): {
  carryoverAmount: number;
  carryoverExpiry: Date | null;
} {
  const remaining = Math.max(0, (oldAllowed || 0) - (oldUsed || 0));
  
  const now = new Date();
  let validExisting = 0;
  if (existingExpiry && existingExpiry > now) {
    validExisting = existingCarryover;
  }

  const totalCarryover = remaining + validExisting;

  let newExpiry = oldNextReset;
  if (existingExpiry && oldNextReset) {
    newExpiry = existingExpiry > oldNextReset ? existingExpiry : oldNextReset;
  } else if (existingExpiry) {
    newExpiry = existingExpiry;
  }

  return {
    carryoverAmount: totalCarryover,
    carryoverExpiry: newExpiry || null,
  };
}

/**
 * Initialize credit reset tracking for new subscription.
 * Uses UTC to avoid timezone issues.
 */
export function initializeCreditReset(subscriptionStartDate: Date): {
  credit_reset_day: number;
  next_credit_reset: Date;
} {
  // Use UTC date to avoid timezone drift
  const resetDay = subscriptionStartDate.getUTCDate();
  const nextReset = calculateNextResetDate(subscriptionStartDate, resetDay);
  return {
    credit_reset_day: resetDay,
    next_credit_reset: nextReset,
  };
}

/**
 * Deduct credits from user account (carryover first, then actual).
 * Returns updated credit values to persist to DB.
 */
export function deductCredits(
  user: UserCreditData,
  amount: number
): {
  credits_used: number;
  carryover: number;
} {
  const available = getAvailableCredits(user);

  if (available.available < amount) {
    throw new Error(`Insufficient credits. Required: ${amount}, Available: ${available.available}`);
  }

  let remainingToDeduct = amount;
  let newCarryover = user.carryover || 0;
  let newUsed = user.credits_used || 0;

  // Check if carryover is still valid
  const now = new Date();
  const carryoverValid = !user.carryover_expiry || now < user.carryover_expiry;

  // First deduct from carryover if available and valid
  if (carryoverValid && newCarryover > 0) {
    const fromCarryover = Math.min(remainingToDeduct, newCarryover);
    newCarryover -= fromCarryover;
    remainingToDeduct -= fromCarryover;
  }
  
  // Then deduct from actual credits
  if (remainingToDeduct > 0) {
    newUsed += remainingToDeduct;
  }

  return {
    credits_used: newUsed,
    carryover: newCarryover,
  };
}
