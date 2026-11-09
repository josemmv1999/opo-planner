import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { beforeEach, describe, expect, it } from 'vitest';
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
    [...element.querySelectorAll('button')].find((b) => b.textContent?.includes(key)) as HTMLButtonElement;
  const click = async (key: string) => {
    button(key).click();
    await fixture.whenStable();
  };
  const statementText = () => element.querySelector('p.fs-4')?.textContent?.trim();
  const segments = () =>
    [...element.querySelectorAll('.true-false-game__segment')].map((s) =>
      ['bg-success', 'bg-danger', 'bg-primary', 'bg-dark-subtle'].find((c) => s.classList.contains(c)),
    );
  const playRound = async (answers: boolean[]) => {
    for (const value of answers) {
      await click(value ? 'trueFalseGame.true' : 'trueFalseGame.false');
      await click('trueFalseGame.next');
    }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
    fixture = TestBed.createComponent(TrueFalseGame);
    element = fixture.nativeElement;
  });

  it('starts with the first statement, the first segment current and no answer', async () => {
    await render(SEVEN_STATEMENTS);
    expect(statementText()).toBe('Afirmación 1');
    expect(segments()).toEqual(['bg-primary', 'bg-dark-subtle', 'bg-dark-subtle', 'bg-dark-subtle', 'bg-dark-subtle']);
    expect(button('trueFalseGame.true').disabled).toBe(false);
    expect(element.querySelector('.alert')).toBeNull();
  });

  it('a right answer fills the chosen button, disables both and shows the explanation', async () => {
    await render(SEVEN_STATEMENTS);
    await click('trueFalseGame.true');

    expect(button('trueFalseGame.true').classList).toContain('btn-success');
    expect(button('trueFalseGame.false').classList).toContain('btn-outline-danger');
    expect(button('trueFalseGame.true').disabled).toBe(true);
    expect(button('trueFalseGame.false').disabled).toBe(true);
    const feedback = element.querySelector('.alert');
    expect(feedback?.classList).toContain('alert-success');
    expect(feedback?.textContent).toContain('trueFalseGame.correct');
    expect(feedback?.textContent).toContain('Explicación 1');
    expect(segments()[0]).toBe('bg-success');
  });

  it('a wrong answer shows the error feedback and a red segment', async () => {
    await render(SEVEN_STATEMENTS);
    await click('trueFalseGame.false');

    expect(button('trueFalseGame.false').classList).toContain('btn-danger');
    expect(element.querySelector('.alert')?.classList).toContain('alert-danger');
    expect(element.querySelector('.alert')?.textContent).toContain('trueFalseGame.incorrect');
    expect(segments()[0]).toBe('bg-danger');
  });

  it('only counts the first answer of each statement', async () => {
    await render(SEVEN_STATEMENTS);
    await click('trueFalseGame.true');
    button('trueFalseGame.false').click();
    await fixture.whenStable();

    expect(segments()[0]).toBe('bg-success');
    expect(button('trueFalseGame.true').classList).toContain('btn-success');
  });

  it('"next" moves to the following statement and marks it as current', async () => {
    await render(SEVEN_STATEMENTS);
    await click('trueFalseGame.true');
    await click('trueFalseGame.next');

    expect(statementText()).toBe('Afirmación 2');
    expect(segments()).toEqual(['bg-success', 'bg-primary', 'bg-dark-subtle', 'bg-dark-subtle', 'bg-dark-subtle']);
    expect(button('trueFalseGame.true').disabled).toBe(false);
    expect(element.querySelector('.alert')).toBeNull();
  });

  it('ends the round after 5 statements with the number of right answers', async () => {
    await render(SEVEN_STATEMENTS);
    await playRound([true, true, true, false, false]);

    expect(statementText()).toBeUndefined();
    expect(element.querySelector('.display-4')?.textContent?.trim()).toBe('3/5');
    expect(segments()).toEqual(['bg-success', 'bg-danger', 'bg-success', 'bg-success', 'bg-danger']);
    expect(button('trueFalseGame.playAgain')).toBeTruthy();
  });

  it('"play again" takes the next 5 statements and resets the round', async () => {
    await render(SEVEN_STATEMENTS);
    await playRound([true, false, true, false, true]);
    await click('trueFalseGame.playAgain');

    expect(statementText()).toBe('Afirmación 6');
    expect(segments()).toEqual(['bg-primary', 'bg-dark-subtle', 'bg-dark-subtle', 'bg-dark-subtle', 'bg-dark-subtle']);
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
      await click('trueFalseGame.next');
    }
    expect(seen).toEqual(['Afirmación 6', 'Afirmación 7', 'Afirmación 1', 'Afirmación 2', 'Afirmación 3']);
  });

  it('plays a shorter round when the bank has fewer than 5 statements', async () => {
    await render(SEVEN_STATEMENTS.slice(0, 3));
    expect(segments().length).toBe(3);
    await playRound([true, true, true]);
    expect(element.querySelector('.display-4')?.textContent?.trim()).toBe('2/3');
  });
});
