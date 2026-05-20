/**
 * In-memory singleton store — survives hot-module-replacement via
 * globalThis caching, but resets on a full server restart.
 */
import type {
  User,
  Goal,
  Achievement,
  CheckIn,
  AuditLog,
  Cycle,
} from './types';
import {
  SEED_USERS,
  SEED_GOALS,
  SEED_ACHIEVEMENTS,
  SEED_CHECKINS,
  SEED_AUDIT_LOGS,
  SEED_CYCLES,
} from './seed';

// ─── Global store shape ───────────────────────────────────────────────────────

interface Store {
  users: Map<string, User>;
  goals: Map<string, Goal>;
  achievements: Map<string, Achievement>;
  checkIns: Map<string, CheckIn>;
  auditLogs: Map<string, AuditLog>;
  cycles: Map<string, Cycle>;
  idCounters: Map<string, number>;
}

declare global {
  // eslint-disable-next-line no-var
  var __portalStore: Store | undefined;
}

function initStore(): Store {
  const s: Store = {
    users: new Map(SEED_USERS.map((u) => [u.id, u])),
    goals: new Map(SEED_GOALS.map((g) => [g.id, g])),
    achievements: new Map(SEED_ACHIEVEMENTS.map((a) => [a.id, a])),
    checkIns: new Map(SEED_CHECKINS.map((c) => [c.id, c])),
    auditLogs: new Map(SEED_AUDIT_LOGS.map((l) => [l.id, l])),
    cycles: new Map(SEED_CYCLES.map((c) => [c.id, c])),
    idCounters: new Map([
      ['user', 10],
      ['goal', 20],
      ['achievement', 10],
      ['checkin', 10],
      ['audit', 10],
      ['cycle', 10],
    ]),
  };
  return s;
}

export const store: Store =
  globalThis.__portalStore ?? (globalThis.__portalStore = initStore());

// ─── ID generator ─────────────────────────────────────────────────────────────

export function nextId(entity: string): string {
  const n = (store.idCounters.get(entity) ?? 0) + 1;
  store.idCounters.set(entity, n);
  return `${entity[0]}${n}`;
}

// ─── User helpers ─────────────────────────────────────────────────────────────

export function getUserById(id: string): User | undefined {
  return store.users.get(id);
}

export function getUserByEmail(email: string): User | undefined {
  return [...store.users.values()].find((u) => u.email === email);
}

export function getAllUsers(): User[] {
  return [...store.users.values()];
}

export function getTeamOf(managerId: string): User[] {
  return [...store.users.values()].filter((u) => u.managerId === managerId);
}

export function createUser(user: User): User {
  store.users.set(user.id, user);
  return user;
}

// ─── Goal helpers ─────────────────────────────────────────────────────────────

export function getGoalById(id: string): Goal | undefined {
  return store.goals.get(id);
}

export function getGoalsByEmployee(employeeId: string): Goal[] {
  return [...store.goals.values()].filter(
    (g) => g.employeeId === employeeId,
  );
}

export function getGoalsByManager(managerId: string): Goal[] {
  const teamIds = getTeamOf(managerId).map((u) => u.id);
  return [...store.goals.values()].filter((g) =>
    teamIds.includes(g.employeeId),
  );
}

export function getAllGoals(): Goal[] {
  return [...store.goals.values()];
}

export function upsertGoal(goal: Goal): Goal {
  store.goals.set(goal.id, goal);
  return goal;
}

export function deleteGoal(id: string): boolean {
  return store.goals.delete(id);
}

/** Validate goal-sheet rules for a given employee */
export function validateGoalSheet(
  employeeId: string,
  goals: Goal[],
): string | null {
  if (goals.length > 8) return 'Maximum 8 goals allowed per employee.';
  for (const g of goals) {
    if (g.weightage < 10)
      return `Goal "${g.title}" has weightage below 10%.`;
  }
  const total = goals.reduce((s, g) => s + g.weightage, 0);
  if (Math.round(total) !== 100)
    return `Total weightage must equal 100% (currently ${total}%).`;
  return null;
}

// ─── Achievement helpers ──────────────────────────────────────────────────────

export function getAchievementsByGoal(goalId: string): Achievement[] {
  return [...store.achievements.values()].filter(
    (a) => a.goalId === goalId,
  );
}

export function getAchievementByGoalQuarter(
  goalId: string,
  quarter: string,
): Achievement | undefined {
  return [...store.achievements.values()].find(
    (a) => a.goalId === goalId && a.quarter === quarter,
  );
}

export function getAllAchievements(): Achievement[] {
  return [...store.achievements.values()];
}

export function upsertAchievement(ach: Achievement): Achievement {
  store.achievements.set(ach.id, ach);
  return ach;
}

// ─── Check-in helpers ─────────────────────────────────────────────────────────

export function getCheckInsByManager(managerId: string): CheckIn[] {
  return [...store.checkIns.values()].filter(
    (c) => c.managerId === managerId,
  );
}

export function getCheckInByEmployeeQuarter(
  employeeId: string,
  quarter: string,
): CheckIn | undefined {
  return [...store.checkIns.values()].find(
    (c) => c.employeeId === employeeId && c.quarter === quarter,
  );
}

export function upsertCheckIn(ci: CheckIn): CheckIn {
  store.checkIns.set(ci.id, ci);
  return ci;
}

// ─── Audit log helpers ────────────────────────────────────────────────────────

export function getAllAuditLogs(): AuditLog[] {
  return [...store.auditLogs.values()].sort(
    (a, b) =>
      new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime(),
  );
}

export function addAuditLog(log: AuditLog): void {
  store.auditLogs.set(log.id, log);
}

// ─── Cycle helpers ────────────────────────────────────────────────────────────

export function getAllCycles(): Cycle[] {
  return [...store.cycles.values()].sort(
    (a, b) =>
      new Date(a.openDate).getTime() - new Date(b.openDate).getTime(),
  );
}

export function getActiveCycles(): Cycle[] {
  return [...store.cycles.values()].filter((c) => c.isActive);
}

export function getCycleById(id: string): Cycle | undefined {
  return store.cycles.get(id);
}

export function upsertCycle(c: Cycle): Cycle {
  store.cycles.set(c.id, c);
  return c;
}
