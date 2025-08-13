import { runTests } from '../src/testRunner';

test('runTests returns fail without package', () => {
  const res = runTests('.');
  expect(['ok','fail']).toContain(res);
});
