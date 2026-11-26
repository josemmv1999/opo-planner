import syllabus from './c1-syllabus.json' with { type: 'json' };
import fuengirolaSyllabus from './fuengirola-syllabus.json' with { type: 'json' };

const quote = (text: string): string => `'${text.replaceAll("'", "''")}'`;

export const syllabusSeedSql = (start: number, end?: number): string =>
  syllabus
    .slice(start, end)
    .flatMap(({ label, name, topics }, i) => [
      `INSERT INTO syllabus_blocks (id, label, name) VALUES (${start + i + 1}, ${quote(label)}, ${quote(name)});`,
      ...topics.map(
        (topic) =>
          `INSERT INTO topics (block_id, number, name, description) VALUES (${start + i + 1}, ${topic.number}, ${quote(topic.name)}, ${quote(topic.description)});`,
      ),
    ])
    .join('\n');

export const FUENGIROLA_ID = 'ayto-fuengirola-c1';
const FIRST_FUENGIROLA_BLOCK_ID = 7;

export const fuengirolaSeedSql = (): string =>
  fuengirolaSyllabus
    .flatMap(({ label, name, topics }, i) => {
      const blockId = FIRST_FUENGIROLA_BLOCK_ID + i;
      return [
        `INSERT INTO syllabus_blocks (id, label, name, opposition_id) VALUES (${blockId}, ${quote(label)}, ${quote(name)}, '${FUENGIROLA_ID}');`,
        ...topics.flatMap((topic) =>
          'topicId' in topic
            ? [
                `INSERT INTO opposition_topics VALUES ('${FUENGIROLA_ID}', ${blockId}, ${topic.topicId}, ${topic.number});`,
              ]
            : [
                `INSERT INTO topics (block_id, number, name, description) VALUES (${blockId}, ${topic.number}, ${quote(topic.name)}, ${quote(topic.description)});`,
                `INSERT INTO opposition_topics VALUES ('${FUENGIROLA_ID}', ${blockId}, last_insert_rowid(), ${topic.number});`,
              ],
        ),
      ];
    })
    .join('\n');
