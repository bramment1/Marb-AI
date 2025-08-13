import { ImprovedPrompt } from './types.js';

export function improve(raw: string): ImprovedPrompt {
  const improved = `${raw}\n- Include TypeScript 5, React 18.`;
  const checklist = [
    'specificity',
    'language/version',
    'io-examples',
    'constraints',
    'tests'
  ];
  const score = Math.min(100, raw.length);
  return { improved, score, checklist };
}
