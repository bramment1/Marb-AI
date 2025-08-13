import AdmZip from 'adm-zip';
import { readFileSync } from 'fs';

export function zipProject(paths: string[]): string {
  const zip = new AdmZip();
  for (const p of paths) {
    zip.addFile(p, readFileSync(p));
  }
  return zip.toBuffer().toString('base64');
}
