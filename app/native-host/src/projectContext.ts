import { readdirSync } from 'fs';
import { join } from 'path';
import { ProjectSummary } from './types.js';

export function scanProject(root: string): ProjectSummary {
  const files = readdirSync(root);
  return { root, files };
}
