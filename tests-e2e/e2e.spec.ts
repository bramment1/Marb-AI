import { test, expect } from '@playwright/test';
import { existsSync } from 'fs';
import { execSync } from 'child_process';

const icon16 = 'app/extension/public/icon16.png';

test('build assets generates icons', () => {
  if (existsSync(icon16)) {
    // remove if exists
    execSync(`rm ${icon16}`);
  }
  execSync('npm --prefix app/native-host run build:assets');
  expect(existsSync(icon16)).toBe(true);
});
