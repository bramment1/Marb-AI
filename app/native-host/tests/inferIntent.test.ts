import { inferIntent } from '../src/generator/steps/inferIntent';

test('infer route', () => {
  expect(inferIntent('make route')).toContain('express-route');
});
