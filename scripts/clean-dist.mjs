import { rmSync } from 'node:fs';
import { resolve, relative } from 'node:path';

const root = process.cwd();
const distPath = resolve(root, 'dist');
const relativeDist = relative(root, distPath);

if (relativeDist.startsWith('..') || relativeDist === '') {
  throw new Error(`Refusing to remove unsafe dist path: ${distPath}`);
}

rmSync(distPath, { recursive: true, force: true });
