import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TrueFalseStatement } from '../../models/true-false-statement.model';
import { TrueFalseGame } from './true-false-game';

const statement = (id: number, isTrue: boolean): TrueFalseStatement => ({
  id,
  text: `Afirmación ${id}`,
  isTrue,
  explanation: `Explicación ${id}`,
});

const SEVEN_STATEMENTS = [
  statement(1, true),
  statement(2, false),
  statement(3, true),
  statement(4, false),
  statement(5, true),
  statement(6, false),
  statement(7, true),
];

describe('TrueFalseGame', () => {
  let fixture: ComponentFixture<TrueFalseGame>;
  let element: HTMLElement;

  const render = async (statements: TrueFalseStatement[]) => {
    fixture.componentRef.setInput('statements', statements);
    await fixture.whenStable();
  };
  const button = (key: string) =>
    [...element.querySelectorAll('button')].find((b) =>
      b.textContent?.includes(key),
    ) as HTMLButtonElement;
  const click = async (key: string) => {
    button(key).click();
    await fixture.whenStable();
  };
  const clickNext = async () => {
    (button('trueFalseGame.next') ?? button('trueFalseGame.seeResult')).click();
    await fixture.whenStable();
  };
  const feedback = () => element.querySelector('[role="status"]');
  const explanation = () =>
    element.querySelector('.true-false-game__explanation')?.textContent?.trim();
  const statementText = () =>
    element.querySelector('.true-false-game__statement')?.textContent?.trim();
  const segments = () =>
    [...element.querySelectorAll('.true-false-game__segment')].map((s) =>
      ['bg-success', 'bg-danger', 'bg-primary', 'bg-dark-subtle'].find((c) =>
        s.classList.contains(c),
      ),
    );
  const playRound = async (answers: boolean[]) => {
    for (const value of answers) {
      await click(value ? 'trueFalseGame.true' : 'trueFalseGame.false');
      await clickNext();
    }
  };

  beforeEach(() => {
    HTMLDialogElement.prototype.showModal ??= vi.fn();
    HTMLDialogElement.prototype.close ??= vi.fn();
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
    fixture = TestBed.createComponent(TrueFalseGame);
    element = fixture.nativeElement;
  });

  it('starts with the first statement, the first segment current and no answer', async () => {
    await render(SEVEN_STATEMENTS);
    expect(statementText()).toBe('Afirmación 1');
    expect(segments()).toEqual([
      'bg-primary',
      'bg-dark-subtle',
      'bg-dark-subtle',
      'bg-dark-subtle',
      'bg-dark-subtle',
    ]);
    expect(button('trueFalseGame.true').disabled).toBe(false);
    expect(explanation()).toBeUndefined();
    expect(feedback()).toBeNull();
    expect(element.querySelector('.true-false-game__progress')?.textContent).toContain(
      'trueFalseGame.progress',
    );
  });

  it('a right answer swaps the answers for "next" and shows the explanation', async () => {
    await render(SEVEN_STATEMENTS);
    await click('trueFalseGame.true');

    expect(button('trueFalseGame.true')).toBeUndefined();
    expect(button('trueFalseGame.false')).toBeUndefined();
    expect(button('trueFalseGame.next')).toBeTruthy();
    expect(feedback()?.classList).toContain('text-success');
    expect(feedback()?.textContent).toContain('trueFalseGame.correct');
    expect(explanation()).toBe('Explicación 1');
    expect(segments()[0]).toBe('bg-success');
  });

  it('a wrong answer shows the error feedback, the right answer and a red segment', async () => {
    await render(SEVEN_STATEMENTS);
    await click('trueFalseGame.false');

    expect(feedback()?.classList).toContain('text-danger');
    expect(feedback()?.textContent).toContain('trueFalseGame.incorrect');
    expect(feedback()?.textContent).toContain('trueFalseGame.wasTrue');
    expect(segments()[0]).toBe('bg-danger');
  });

  it('only lets you answer once per statement', async () => {
    await render(SEVEN_STATEMENTS);
    await click('trueFalseGame.true');

    expect(segments()[0]).toBe('bg-success');
    expect(element.querySelectorAll('.true-false-game__answer').length).toBe(0);
  });

  it('lists every statement of the round with its result at the end', async () => {
    await render(SEVEN_STATEMENTS);
    await playRound([true, true, true, false, false]);

    const recap = [...element.querySelectorAll('.true-false-game__recap li')].map(
      (li) => li.textContent,
    );
    expect(recap.length).toBe(5);
    expect(recap[1]).toContain('trueFalseGame.recapWrong');
    expect(recap[2]).toContain('trueFalseGame.recapRight');
  });

  it('"next" moves to the following statement and marks it as current', async () => {
    await render(SEVEN_STATEMENTS);
    await click('trueFalseGame.true');
    await clickNext();

    expect(statementText()).toBe('Afirmación 2');
    expect(segments()).toEqual([
      'bg-success',
      'bg-primary',
      'bg-dark-subtle',
      'bg-dark-subtle',
      'bg-dark-subtle',
    ]);
    expect(button('trueFalseGame.true').disabled).toBe(false);
    expect(explanation()).toBeUndefined();
  });

  it('shows see result instead of next on the last statement', async () => {
    await render(SEVEN_STATEMENTS);
    await playRound([true, true, true, true]);
    await click('trueFalseGame.true');

    expect(button('trueFalseGame.next')).toBeUndefined();
    expect(button('trueFalseGame.seeResult')).toBeTruthy();
  });

  it('ends the round after 5 statements with the number of right answers', async () => {
    await render(SEVEN_STATEMENTS);
    await playRound([true, true, true, false, false]);

    expect(statementText()).toBeUndefined();
    expect(element.querySelector('.true-false-game__final')?.textContent?.trim()).toBe('3/5');
    expect(segments()).toEqual([
      'bg-success',
      'bg-danger',
      'bg-success',
      'bg-success',
      'bg-danger',
    ]);
    expect(element.textContent).toContain('trueFalseGame.verdict.good');
    expect(button('trueFalseGame.playAgain')).toBeTruthy();
  });

  it('"play again" takes the next 5 statements and resets the round', async () => {
    await render(SEVEN_STATEMENTS);
    await playRound([true, false, true, false, true]);
    await click('trueFalseGame.playAgain');

    expect(statementText()).toBe('Afirmación 6');
    expect(segments()).toEqual([
      'bg-primary',
      'bg-dark-subtle',
      'bg-dark-subtle',
      'bg-dark-subtle',
      'bg-dark-subtle',
    ]);
    expect(element.querySelector('.badge')?.textContent).toContain('trueFalseGame.score');
  });

  it('wraps around to the start of the bank when it runs out', async () => {
    await render(SEVEN_STATEMENTS);
    await playRound([true, false, true, false, true]);
    await click('trueFalseGame.playAgain');

    const seen: string[] = [];
    for (let i = 0; i < 5; i++) {
      seen.push(statementText() ?? '');
      await click('trueFalseGame.true');
      await clickNext();
    }
    expect(seen).toEqual([
      'Afirmación 6',
      'Afirmación 7',
      'Afirmación 1',
      'Afirmación 2',
      'Afirmación 3',
    ]);
  });

  it('plays a shorter round when the bank has fewer than 5 statements', async () => {
    await render(SEVEN_STATEMENTS.slice(0, 3));
    expect(segments().length).toBe(3);
    await playRound([true, true, true]);
    expect(element.querySelector('.true-false-game__final')?.textContent?.trim()).toBe('2/3');
  });
});
