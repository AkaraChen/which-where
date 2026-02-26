import test from 'ava';
import { checkPnpm } from './pnpm.js';

test('checkPnpm: returns null for non-pnpm path', t => {
  const result = checkPnpm('node', '/usr/bin/node');
  t.is(result, null);
});

test('checkPnpm: detects pnpm path - .local/bin', t => {
  const home = process.env.HOME || '/home/user';
  const result = checkPnpm('pnpm', `${home}/.local/bin/pnpm`);
  t.truthy(result);
  t.is(result.type, 'pnpm (Node.js)');
});

test('checkPnpm: detects pnpm path - Library', t => {
  const home = process.env.HOME || '/home/user';
  const result = checkPnpm('pnpm', `${home}/Library/pnpm/pnpm`);
  t.truthy(result);
  t.is(result.type, 'pnpm (Node.js)');
});

test('checkPnpm: detects pnpm path - pnpm-store', t => {
  const home = process.env.HOME || '/home/user';
  const result = checkPnpm('pnpm', `${home}/.pnpm-store/v3/pnpm`);
  t.truthy(result);
  t.is(result.type, 'pnpm (Node.js)');
});
