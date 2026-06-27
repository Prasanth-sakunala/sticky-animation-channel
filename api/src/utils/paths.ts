import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CURRENT_DIR = path.dirname(fileURLToPath(import.meta.url));
const API_DIR = path.resolve(CURRENT_DIR, '..', '..');
const REPO_ROOT = path.resolve(API_DIR, '..');

export const REPO_ROOT_DIR = REPO_ROOT;
export const OUTPUT_ROOT_DIR = path.join(REPO_ROOT, 'output');
export const ASSETS_ROOT_DIR = path.join(REPO_ROOT, 'assets');
export const REMOTION_ROOT_DIR = path.join(REPO_ROOT, 'remotion');

export const outputPath = (...segments: string[]) => path.join(OUTPUT_ROOT_DIR, ...segments);
export const assetsPath = (...segments: string[]) => path.join(ASSETS_ROOT_DIR, ...segments);