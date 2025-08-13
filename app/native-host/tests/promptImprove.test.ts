import { improve } from '../src/promptImprove';

test('improve adds note', () => {
  const res = improve('hello');
  expect(res.improved).toContain('TypeScript');
});
