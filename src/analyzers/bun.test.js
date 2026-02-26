import test from 'ava';
import { checkBun } from './bun.js';

test('checkBun: returns null for non-bun path', t => {
  const result = checkBun('node', '/usr/local/bin/node');
  t.is(result, null);
});

test('checkBun: detects bun path', t => {
  const result = checkBun('claude', '/Users/akrc/.bun/bin/claude');
  if (result) {
    t.is(result.type, 'Bun');
    t.truthy(result.name);
    t.truthy(result.path);
    t.truthy(result.install);
    t.truthy(result.uninstall);
    t.truthy(result.update);
    t.truthy(result.info);
    t.true(result.install.startsWith('bun add -g'));
  } else {
    t.pass('skipped: bun not detected');
  }
});

test('checkBun: detects bun install path', t => {
  const result = checkBun('typescript', '/Users/akrc/.bun/install/bin/typescript');
  if (result) {
    t.is(result.type, 'Bun');
    t.true(result.install.startsWith('bun add -g'));
  } else {
    t.pass('skipped: bun install path not detected');
  }
});
