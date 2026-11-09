import { MockExamLog, PlannerTask } from '../../../common/models/home.model';
import { buildAgenda } from './build-agenda';

const at = (hours: number, minutes = 0): string => new Date(2026, 10, 9, hours, minutes).toISOString();

const task = (id: number, start: string): PlannerTask => ({ id, text: `Task ${id}`, start, end: start, isDone: false });
const log = (id: number, start: string): MockExamLog => ({
  id,
  text: `Log ${id}`,
  start,
  end: start,
  correctAnswers: 8,
  totalQuestions: 10,
});

describe('buildAgenda', () => {
  it('sorts tasks and logs by start time', () => {
    const agenda = buildAgenda([task(1, at(17)), task(2, at(9))], [log(1, at(11))], new Date(2026, 10, 9, 20));
    expect(agenda.map(({ id }) => id)).toEqual(['task-2', 'log-1', 'task-1', 'now']);
  });

  it('places now before the first entry that starts later', () => {
    const agenda = buildAgenda([task(1, at(9)), task(2, at(11)), task(3, at(17))], [], new Date(2026, 10, 9, 10));
    expect(agenda.map(({ id }) => id)).toEqual(['task-1', 'now', 'task-2', 'task-3']);
  });

  it('places now first when nothing has started', () => {
    const agenda = buildAgenda([task(1, at(9))], [], new Date(2026, 10, 9, 8));
    expect(agenda.map(({ id }) => id)).toEqual(['now', 'task-1']);
  });

  it('only shows now when the day is empty', () => {
    expect(buildAgenda([], [], new Date())).toEqual([{ kind: 'now', id: 'now' }]);
  });
});
