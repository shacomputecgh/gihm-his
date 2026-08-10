import { execSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const apiRoot = path.join(here, '..');

export default function globalSetup(): void {
  const tmp = path.join(here, '.tmp');
  rmSync(tmp, { recursive: true, force: true });
  mkdirSync(tmp, { recursive: true });
  execSync('npx prisma db push --force-reset --skip-generate', {
    cwd: apiRoot,
    env: { ...process.env, DATABASE_URL: 'file:./tests/.tmp/test.db' },
    stdio: 'pipe',
  });
}
