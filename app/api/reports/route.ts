import { getSession } from '@/app/_lib/auth';
import {
  getAllUsers,
  getAllGoals,
  getAllAchievements,
} from '@/app/_lib/store';
import { computeScore, formatScore } from '@/app/_lib/scoring';
import type { Quarter } from '@/app/_lib/types';

const QUARTERS: Quarter[] = ['Q1', 'Q2', 'Q3', 'Q4'];

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  if (session.role !== 'admin' && session.role !== 'manager')
    return Response.json({ ok: false, error: 'Forbidden.' }, { status: 403 });

  const url = new URL(request.url);
  const format = url.searchParams.get('format') ?? 'json';
  const department = url.searchParams.get('department');

  const users = getAllUsers().filter(
    (u) => u.role === 'employee' && (!department || u.department === department),
  );
  const goals = getAllGoals();
  const achievements = getAllAchievements();

  type Row = {
    employee: string;
    department: string;
    thrustArea: string;
    goalTitle: string;
    uom: string;
    target: string;
    weightage: number;
  } & Record<string, string>;

  const rows: Row[] = [];

  for (const user of users) {
    const userGoals = goals.filter((g) => g.employeeId === user.id && g.status === 'approved');
    for (const goal of userGoals) {
      const row: Row = {
        employee: user.name,
        department: user.department,
        thrustArea: goal.thrustArea,
        goalTitle: goal.title,
        uom: goal.uom,
        target: goal.target,
        weightage: goal.weightage,
      };
      for (const q of QUARTERS) {
        const ach = achievements.find((a) => a.goalId === goal.id && a.quarter === q);
        row[`${q}_actual`] = ach?.actualValue ?? '';
        row[`${q}_status`] = ach?.status ?? '';
        row[`${q}_score`] = ach ? formatScore(computeScore(goal, ach)) : '';
      }
      rows.push(row);
    }
  }

  if (format === 'csv') {
    const headers = [
      'Employee',
      'Department',
      'Thrust Area',
      'Goal Title',
      'UoM',
      'Target',
      'Weightage',
      'Q1 Actual',
      'Q1 Status',
      'Q1 Score',
      'Q2 Actual',
      'Q2 Status',
      'Q2 Score',
      'Q3 Actual',
      'Q3 Status',
      'Q3 Score',
      'Q4 Actual',
      'Q4 Status',
      'Q4 Score',
    ];

    const csv = [
      headers.join(','),
      ...rows.map((r) =>
        [
          `"${r.employee}"`,
          `"${r.department}"`,
          `"${r.thrustArea}"`,
          `"${r.goalTitle}"`,
          r.uom,
          r.target,
          r.weightage,
          r.Q1_actual,
          r.Q1_status,
          r.Q1_score,
          r.Q2_actual,
          r.Q2_status,
          r.Q2_score,
          r.Q3_actual,
          r.Q3_status,
          r.Q3_score,
          r.Q4_actual,
          r.Q4_status,
          r.Q4_score,
        ].join(','),
      ),
    ].join('\n');

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="achievement-report.csv"',
      },
    });
  }

  return Response.json({ ok: true, data: rows });
}
