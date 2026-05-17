// ─── Enums & Literals ────────────────────────────────────────────────────────

export type Role = 'employee' | 'manager' | 'admin';

export type UoM = 'numeric_min' | 'numeric_max' | 'timeline' | 'zero';

export type GoalStatus =
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'returned';

export type AchievementStatus = 'not_started' | 'on_track' | 'completed';

export type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';

export type CyclePhase =
  | 'goal_setting'
  | 'q1_checkin'
  | 'q2_checkin'
  | 'q3_checkin'
  | 'q4_annual';

// ─── Core Entities ────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string; // simple bcrypt-less hash for demo
  role: Role;
  managerId: string | null;
  department: string;
  avatarInitials: string;
}

export interface Goal {
  id: string;
  employeeId: string;
  thrustArea: string;
  title: string;
  description: string;
  uom: UoM;
  /** Numeric/% target value, or ISO date string for timeline, or 0 for zero */
  target: string;
  /** 10–100, multiples of 5 recommended */
  weightage: number;
  status: GoalStatus;
  /** true = title & target are read-only (pushed from shared goal) */
  isShared: boolean;
  sharedBy: string | null;
  /** true after manager approval — immutable without admin unlock */
  isLocked: boolean;
  returnNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Achievement {
  id: string;
  goalId: string;
  quarter: Quarter;
  /** Numeric value or ISO date or "0" */
  actualValue: string;
  status: AchievementStatus;
  /** Computed 0–1 (or >1 for overachievement) */
  score: number | null;
  updatedAt: string;
}

export interface CheckIn {
  id: string;
  managerId: string;
  employeeId: string;
  quarter: Quarter;
  comment: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  entityType: 'goal' | 'achievement' | 'cycle' | 'user';
  entityId: string;
  action: string;
  changedBy: string;
  changedAt: string;
  /** JSON string describing the diff */
  diff: string;
}

export interface Cycle {
  id: string;
  name: string;
  phase: CyclePhase;
  openDate: string;
  closeDate: string;
  isActive: boolean;
}

export interface Session {
  userId: string;
  role: Role;
  name: string;
  email: string;
}

// ─── API Response Shapes ──────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

export interface ApiError {
  ok: false;
  error: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ─── Thrust Areas ─────────────────────────────────────────────────────────────

export const THRUST_AREAS = [
  'Revenue Growth',
  'Cost Optimization',
  'Customer Satisfaction',
  'Operational Excellence',
  'People & Culture',
  'Digital Transformation',
  'Quality & Compliance',
  'Innovation',
  'Safety & Sustainability',
] as const;

export type ThrustArea = (typeof THRUST_AREAS)[number];
