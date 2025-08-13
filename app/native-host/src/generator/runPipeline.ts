import { inferIntent } from './steps/inferIntent.js';
import { selectTemplates } from './steps/selectTemplates.js';
import { fillTemplates } from './steps/fillTemplates.js';
import { astTransforms } from './steps/astTransforms.js';
import { validation } from './steps/validation.js';
import { isBinaryPath } from '../utils/isBinary.js';
import { PreviewItem } from '../types.js';

export async function runPipeline(prompt: string): Promise<PreviewItem[]> {
  const intents = inferIntent(prompt);
  const templates = selectTemplates(intents);
  const files = fillTemplates(templates);
  const transformed = astTransforms(files);
  await validation(transformed);
  return transformed.map((f: any) =>
    isBinaryPath(f.path)
      ? { path: f.path, kind: 'binary', status: 'added', sizeAfter: Buffer.byteLength(f.content) }
      : { path: f.path, kind: 'text', diff: f.content }
  );
}
