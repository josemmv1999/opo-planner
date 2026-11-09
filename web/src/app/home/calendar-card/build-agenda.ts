import { compareAsc, isAfter, parseISO } from 'date-fns';
import { MockExamLog, PlannerTask } from '../../../common/models/home.model';

export type AgendaEntry =
  | { kind: 'task'; id: string; task: PlannerTask }
  | { kind: 'log'; id: string; log: MockExamLog }
  | { kind: 'now'; id: string };

export const buildAgenda = (tasks: PlannerTask[], logs: MockExamLog[], now: Date): AgendaEntry[] => {
  const entries = [
    ...tasks.map((task) => ({ start: parseISO(task.start), entry: { kind: 'task', id: `task-${task.id}`, task } as const })),
    ...logs.map((log) => ({ start: parseISO(log.start), entry: { kind: 'log', id: `log-${log.id}`, log } as const })),
  ].sort((a, b) => compareAsc(a.start, b.start));
  const nowIndex = entries.findIndex(({ start }) => isAfter(start, now));
  const agenda: AgendaEntry[] = entries.map(({ entry }) => entry);
  agenda.splice(nowIndex === -1 ? agenda.length : nowIndex, 0, { kind: 'now', id: 'now' });
  return agenda;
};
