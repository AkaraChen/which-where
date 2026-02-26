import test from 'ava';
import { detectShim } from './shim.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'shim-test-'));

test.afterEach(() => {
  // Clean up temp files
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
});

test('detectShim: returns null for non-shim path', t => {
  const fakePath = '/usr/local/bin/node';
  const result = detectShim('node', fakePath);
  t.is(result, null);
});

test('detectShim: detects fnm shim path', t => {
  const fnmShimPath = path.join(tmpDir, '.fnm', 'shims', 'node');
  fs.mkdirSync(path.dirname(fnmShimPath), { recursive: true });
  fs.writeFileSync(fnmShimPath, '#!/bin/bash\nexec node "$@"');

  const result = detectShim('node', fnmShimPath);
  t.truthy(result);
  t.true(result.type.includes('fnm'));
  t.true(result.isShim);
});

test('detectShim: detects fnm shim with yarn reference', t => {
  const fnmShimPath = path.join(tmpDir, '.fnm', 'shims', 'yarn');
  fs.mkdirSync(path.dirname(fnmShimPath), { recursive: true });
  fs.writeFileSync(fnmShimPath, '#!/bin/bash\nexec yarn "$@"');

  const result = detectShim('yarn', fnmShimPath);
  t.truthy(result);
  t.true(result.type.includes('fnm shim'));
  t.true(result.type.includes('Yarn'));
});

test('detectShim: detects fnm shim with pnpm reference', t => {
  const fnmShimPath = path.join(tmpDir, '.fnm', 'shims', 'pnpm');
  fs.mkdirSync(path.dirname(fnmShimPath), { recursive: true });
  fs.writeFileSync(fnmShimPath, '#!/bin/bash\nexec pnpm "$@"');

  const result = detectShim('pnpm', fnmShimPath);
  t.truthy(result);
  t.true(result.type.includes('fnm shim'));
  t.true(result.type.includes('pnpm'));
});

test('detectShim: detects nvm wrapper', t => {
  const nvmPath = path.join(tmpDir, '.nvm', 'versions', 'node', 'v20.0.0', 'bin', 'node');
  fs.mkdirSync(path.dirname(nvmPath), { recursive: true });
  fs.writeFileSync(nvmPath, 'fake node');

  const result = detectShim('node', nvmPath);
  t.truthy(result);
  t.true(result.type.includes('nvm'));
});

test('detectShim: detects volta shim', t => {
  const voltaPath = path.join(tmpDir, '.volta', 'tools', 'image', 'node', '20.0.0', 'bin', 'node');
  fs.mkdirSync(path.dirname(voltaPath), { recursive: true });
  fs.writeFileSync(voltaPath, 'fake node');

  const result = detectShim('node', voltaPath);
  t.truthy(result);
  t.true(result.type.includes('Volta'));
});

test('detectShim: detects asdf shim', t => {
  const asdfPath = path.join(tmpDir, '.asdf', 'shims', 'node');
  fs.mkdirSync(path.dirname(asdfPath), { recursive: true });
  fs.writeFileSync(asdfPath, 'fake node');

  const result = detectShim('node', asdfPath);
  t.truthy(result);
  t.true(result.type.includes('asdf'));
});

test('detectShim: detects pyenv shim', t => {
  const pyenvPath = path.join(tmpDir, '.pyenv', 'shims', 'pip');
  fs.mkdirSync(path.dirname(pyenvPath), { recursive: true });
  fs.writeFileSync(pyenvPath, 'fake pip');

  const result = detectShim('pip', pyenvPath);
  t.truthy(result);
  t.true(result.type.includes('pyenv'));
});

test('detectShim: detects rbenv shim', t => {
  const rbenvPath = path.join(tmpDir, '.rbenv', 'shims', 'gem');
  fs.mkdirSync(path.dirname(rbenvPath), { recursive: true });
  fs.writeFileSync(rbenvPath, 'fake gem');

  const result = detectShim('gem', rbenvPath);
  t.truthy(result);
  t.true(result.type.includes('rbenv'));
});

test('detectShim: detects mise shim', t => {
  const misePath = path.join(
    tmpDir,
    '.local',
    'share',
    'mise',
    'installs',
    'node',
    '20.0.0',
    'bin',
    'node'
  );
  fs.mkdirSync(path.dirname(misePath), { recursive: true });
  fs.writeFileSync(misePath, 'fake node');

  const result = detectShim('node', misePath);
  t.truthy(result);
  t.true(result.type.includes('mise'));
});
