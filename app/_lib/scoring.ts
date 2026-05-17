import type { Goal, Achievement, UoM } from './types';

/**
 * Compute progress score for a single (goal, achievement) pair.
 * Returns a value 0–1+ (>1 = overachievement).
 * Returns null if inputs are invalid.
 */
export function computeScore(goal: Goal, ach: Achievement): number | null {
  const target = parseFloat(goal.target);
  const actual = parseFloat(ach.actualValue);

  if (goal.uom === 'numeric_min') {
    // Higher is better: Sales Revenue, etc.
    if (!target) return null;
    return actual / target;
  }

  if (goal.uom === 'numeric_max') {
    // Lower is better: TAT, Cost, etc.
    if (!actual) return null;
    return target / actual;
  }

  if (goal.uom === 'zero') {
    // Zero = success (e.g. safety incidents)
    return actual === 0 ? 1 : 0;
  }

  if (goal.uom === 'timeline') {
    // Date-based: ach.actualValue is ISO completion date, goal.target is deadline
    const deadline = new Date(goal.target).getTime();
    const completed = new Date(ach.actualValue).getTime();
    if (isNaN(deadline) || isNaN(completed)) return null;
    if (ach.status !== 'completed') return null;
    // Completed on time or early → 100%; late → proportional reduction
    if (completed <= deadline) return 1;
    // 1 day late = -5% penalty, capped at 0
    const daysLate = Math.floor(
      (completed - deadline) / 86_400_000,
    );
    return Math.max(0, 1 - daysLate * 0.05);
  }

  return null;
}

/** Format score as a percentage string (e.g. "78%" or "N/A") */
export function formatScore(score: number | null): string {
  if (score === null) return 'N/A';
  return `${Math.round(score * 100)}%`;
}

/** Weighted average score across multiple (goal, achievement) pairs */
export function weightedScore(
  pairs: { goal: Goal; ach: Achievement }[],
): number | null {
  if (!pairs.length) return null;
  let totalWeight = 0;
  let weightedSum = 0;
  for (const { goal, ach } of pairs) {
    const s = computeScore(goal, ach);
    if (s === null) continue;
    weightedSum += s * goal.weightage;
    totalWeight += goal.weightage;
  }
  if (!totalWeight) return null;
  return weightedSum / totalWeight;
}

/** Human-readable label for UoM */
export function uomLabel(uom: UoM): string {
  const labels: Record<UoM, string> = {
    numeric_min: 'Numeric (Higher is Better)',
    numeric_max: 'Numeric (Lower is Better)',
    timeline: 'Timeline (Date-based)',
    zero: 'Zero-based (Zero = Success)',
  };
  return labels[uom];
}
