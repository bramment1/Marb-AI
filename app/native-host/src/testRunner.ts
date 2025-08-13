import { execSync } from 'child_process';

export function runTests(cwd: string): string {
  try {
    execSync('npm test', { cwd, stdio: 'pipe' });
    return 'ok';
  } catch (e) {
    return 'fail';
  }
}
