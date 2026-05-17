import type { GoalStatus, AchievementStatus } from '@/app/_lib/types';

interface StatusBadgeProps {
  status: GoalStatus | AchievementStatus | 'locked' | 'shared';
}

const CONFIG: Record<string, { label: string; cls: string }> = {
  draft:       { label: 'Draft',       cls: 'badge-draft' },
  submitted:   { label: 'Submitted',   cls: 'badge-submitted' },
  approved:    { label: 'Approved',    cls: 'badge-approved' },
  returned:    { label: 'Returned',    cls: 'badge-returned' },
  locked:      { label: '🔒 Locked',  cls: 'badge-locked' },
  shared:      { label: '🔗 Shared',  cls: 'badge-shared' },
  not_started: { label: 'Not Started', cls: 'badge-not_started' },
  on_track:    { label: 'On Track',   cls: 'badge-on_track' },
  completed:   { label: 'Completed',  cls: 'badge-completed' },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const cfg = CONFIG[status] ?? { label: status, cls: 'badge-draft' };
  return <span className={`badge ${cfg.cls}`}>{cfg.label}</span>;
}
