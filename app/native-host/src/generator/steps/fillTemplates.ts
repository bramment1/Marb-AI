import { readFileSync } from 'fs';
import { resolve } from 'path';
import { Eta } from 'eta';
import type { TemplateEntry } from '../registry.js';

const eta = new Eta();

export function fillTemplates(entries: TemplateEntry[]) {
  return entries.map(e => {
    const tpl = readFileSync(resolve('src/generator/templates', e.file), 'utf8');
    const content = eta.renderString(tpl, { name: 'Example', route: 'hello', value: 'v' });
    return { path: `${e.name}.ts`, content };
  });
}
