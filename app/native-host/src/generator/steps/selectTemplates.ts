import { registry } from '../registry.js';

export function selectTemplates(intents: string[]) {
  return registry.filter(r => intents.includes(r.name));
}
