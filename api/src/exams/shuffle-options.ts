const REFERS_TO_OTHERS = /\banteriores\b|\b[a-d]\)\s*(y|e|o)\s*[a-d]\)/i;

export interface Shuffled {
  options: string[];
  correctOption: number | null;
}

export const shuffleOptions = (
  options: string[],
  correctOption: number | null,
  random: () => number = Math.random,
): Shuffled => {
  const movable = options.flatMap((option, index) =>
    REFERS_TO_OTHERS.test(option) ? [] : [index],
  );
  const order = [...movable];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const sources = options.map((_, index) =>
    movable.includes(index) ? order[movable.indexOf(index)] : index,
  );
  return {
    options: sources.map((source) => options[source]),
    correctOption: correctOption === null ? null : sources.indexOf(correctOption),
  };
};
