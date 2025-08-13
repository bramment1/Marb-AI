import { existsSync, readFileSync, writeFileSync } from 'fs';
import { createTwoFilesPatch } from 'diff';
import { isBinaryPath } from './utils/isBinary.js';
import { PreviewItem } from './types.js';

export function preview(path: string, content: string | Buffer | null): PreviewItem {
  const exists = existsSync(path);
  const isBinary = isBinaryPath(path);
  if (isBinary) {
    let sizeBefore: number | undefined;
    let sizeAfter: number | undefined;
    if (exists) sizeBefore = readFileSync(path).length;
    if (content) sizeAfter = Buffer.isBuffer(content) ? content.length : Buffer.byteLength(content);
    const status: any = content === null ? 'deleted' : exists ? 'modified' : 'added';
    return { path, kind: 'binary', status, sizeBefore, sizeAfter };
  }
  const before = exists ? readFileSync(path, 'utf8') : '';
  const after = content ? (Buffer.isBuffer(content) ? content.toString('utf8') : content) : '';
  const diff = createTwoFilesPatch(path, path, before, after);
  return { path, kind: 'text', diff };
}

export function apply(path: string, content: string | Buffer | null) {
  if (content === null) {
    // deletions omitted for brevity
    return;
  }
  writeFileSync(path, content);
}
