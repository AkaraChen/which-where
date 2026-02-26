import test from 'ava';
import { checkNpm } from './npm.js';

test('checkNpm: returns null for non-npm path', t => {
  const result = checkNpm('node', '/usr/bin/node');
  t.is(result, null);
});

test('checkNpm: detects npm global path - /usr/local/lib/node_modules', t => {
  const result = checkNpm('npm', '/usr/local/lib/node_modules/npm/bin/npm-cli.js');
  t.truthy(result);
  t.is(result.type, 'npm (Node.js)');
});

test('checkNpm: detects npm global path - nvm', t => {
  const home = process.env.HOME || '/home/user';
  const result = checkNpm('npm', `${home}/.nvm/versions/node/v18.0.0/bin/npm`);
  t.truthy(result);
  t.is(result.type, 'npm (Node.js)');
});
