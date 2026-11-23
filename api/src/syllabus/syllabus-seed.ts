import syllabus from './c1-syllabus.json' with { type: 'json' };

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
