import test from 'ava';
import { checkYarn } from './yarn.js';

test('checkYarn: returns null for non-yarn path', t => {
  const result = checkYarn('node', '/usr/bin/node');
  t.is(result, null);
});

test('checkYarn: detects yarn path - .yarn', t => {
  const home = process.env.HOME || '/home/user';
  const result = checkYarn('yarn', `${home}/.yarn/bin/yarn`);
  t.truthy(result);
  t.is(result.type, 'Yarn (Node.js)');
});

test('checkYarn: detects yarn path - Library', t => {
  const home = process.env.HOME || '/home/user';
  const result = checkYarn('yarn', `${home}/Library/pnpm/yarn`);
  t.truthy(result);
  t.is(result.type, 'Yarn (Node.js)');
});
