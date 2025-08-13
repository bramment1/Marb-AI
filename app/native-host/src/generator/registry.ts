export interface TemplateEntry {
  name: string;
  file: string;
}

export const registry: TemplateEntry[] = [
  { name: 'react-component', file: 'react-component.eta' },
  { name: 'express-route', file: 'express-route.eta' },
  { name: 'jest-test', file: 'jest-test.eta' },
  { name: 'util-module', file: 'util-module.eta' }
];
