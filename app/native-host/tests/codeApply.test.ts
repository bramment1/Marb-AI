import { preview } from '../src/codeApply';
import { writeFileSync } from 'fs';

const tmp = 'tmp.txt';
writeFileSync(tmp, 'old');

test('preview shows text diff', () => {
  const diff = preview(tmp, 'new');
  expect(diff.kind).toBe('text');
  if (diff.kind === 'text') {
    expect(diff.diff).toContain('new');
  }
});

test('binary file preview', () => {
  const bin = 'image.png';
  writeFileSync(bin, Buffer.from([0]));
  const res = preview(bin, Buffer.from([1,2]));
  expect(res.kind).toBe('binary');
  if (res.kind === 'binary') {
    expect(res.status).toBe('modified');
  }
});
