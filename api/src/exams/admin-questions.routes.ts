import type { DatabaseSync } from 'node:sqlite';
import { Router } from 'express';
import { requireAdmin } from '../auth/require-admin.ts';
import { requireUser } from '../auth/require-user.ts';
import {
  isGeneratedQuestion,
  parseTopic,
  type GeneratedQuestionError,
} from './generated-question.ts';
import type { QuestionRow } from './question.ts';

const GENERATED_SECTION = 'GENERADA';

export const adminQuestionsRoutes = (database: DatabaseSync): Router => {
  const findTopic = database.prepare(
    `SELECT topics.id FROM topics JOIN syllabus_blocks ON syllabus_blocks.id = topics.block_id
      WHERE syllabus_blocks.label = ? AND topics.number = ?`,
  );
  const insertQuestion = database.prepare(
    `INSERT INTO questions
      (topic_id, section, number, statement, options, correct_option, explanation, source, is_official, review_status)
      VALUES (?, '${GENERATED_SECTION}', 0, ?, ?, ?, ?, ?, 0, 'pending')`,
  );
  const listPending = database.prepare(
    "SELECT * FROM questions WHERE review_status = 'pending' ORDER BY id",
  );

  const topicIdOf = (topic: string): number | undefined => {
    const parsed = parseTopic(topic);
    const row =
      parsed && (findTopic.get(parsed.blockLabel, parsed.number) as { id: number } | undefined);
    return row ? row.id : undefined;
  };

  return Router()
    .use(requireUser(database), requireAdmin)
    .get('/pending', (_req, res) => {
      const rows = listPending.all() as unknown as QuestionRow[];
      res.json(
        rows.map((row) => ({
          id: row.id,
          topicId: row.topic_id,
          statement: row.statement,
          options: JSON.parse(row.options) as string[],
          correctOption: row.correct_option,
          explanation: row.explanation,
          source: row.source,
        })),
      );
    })
    .post('/import', (req, res) => {
      const { questions } = req.body ?? {};
      if (!Array.isArray(questions) || !questions.length) return void res.sendStatus(400);
      const errors: { index: number; reason: GeneratedQuestionError }[] = [];
      database.exec('BEGIN');
      questions.forEach((question: unknown, index) => {
        if (!isGeneratedQuestion(question)) return void errors.push({ index, reason: 'format' });
        const topicId = topicIdOf(question.topic);
        if (!topicId) return void errors.push({ index, reason: 'topic' });
        insertQuestion.run(
          topicId,
          question.statement.trim(),
          JSON.stringify(question.options.map((option) => option.trim())),
          question.correctOption,
          question.explanation?.trim() || null,
          question.source?.trim() || null,
        );
      });
      database.exec('COMMIT');
      res.status(201).json({ imported: questions.length - errors.length, errors });
    });
};
