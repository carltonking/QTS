import type { Operation, Problem, SessionConfig } from './types';

function randomInt(min: number, max: number) {
  const normalizedMin = Math.min(min, max);
  const normalizedMax = Math.max(min, max);
  return Math.floor(Math.random() * (normalizedMax - normalizedMin + 1)) + normalizedMin;
}

function normalizeRange(range: [number, number]): [number, number] {
  const min = Number.isFinite(range[0]) ? Math.max(1, Math.floor(range[0])) : 1;
  const max = Number.isFinite(range[1]) ? Math.max(1, Math.floor(range[1])) : min;
  return [Math.min(min, max), Math.max(min, max)];
}

function operationSymbol(operation: Operation) {
  switch (operation) {
    case 'ADD':
      return '+';
    case 'SUB':
      return '−';
    case 'MUL':
      return '×';
    case 'DIV':
      return '÷';
  }
}

export function generateProblem(config: SessionConfig): Problem {
  const operation =
    config.operations[Math.floor(Math.random() * config.operations.length)] ?? 'ADD';

  const [min, max] = normalizeRange(config.ranges[operation]);

  if (operation === 'DIV') {
    const b = Math.max(1, randomInt(min, max));
    const quotient = randomInt(min, max);
    const a = b * quotient;

    return {
      a,
      b,
      operation,
      answer: quotient,
      display: `${a} ${operationSymbol(operation)} ${b} = ?`,
    };
  }

  if (operation === 'SUB') {
    const first = randomInt(min, max);
    const second = randomInt(min, max);
    const a = Math.max(first, second);
    const b = Math.min(first, second);

    return {
      a,
      b,
      operation,
      answer: a - b,
      display: `${a} ${operationSymbol(operation)} ${b} = ?`,
    };
  }

  const a = randomInt(min, max);
  const b = randomInt(min, max);

  const answer =
    operation === 'ADD' ? a + b : operation === 'MUL' ? a * b : 0;

  return {
    a,
    b,
    operation,
    answer,
    display: `${a} ${operationSymbol(operation)} ${b} = ?`,
  };
}
