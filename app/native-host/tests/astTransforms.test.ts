import { astTransforms } from '../src/generator/steps/astTransforms';

test('adds transformed comment', () => {
  const res = astTransforms([{ path: 'a.ts', content: 'const a=1;' }]);
  expect(res[0].content).toContain('transformed');
});
