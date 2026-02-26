import test from 'ava';
import { exec, getBrewPrefix } from './utils.js';

test('exec: returns trimmed output for successful command', t => {
  const result = exec('echo "hello world"');
  t.is(result, 'hello world');
});

test('exec: returns null for failing command', t => {
  const result = exec('nonexistent_command_12345');
  t.is(result, null);
});

test('exec: handles command with no output', t => {
  const result = exec('true');
  t.is(result, '');
});

test('getBrewPrefix: returns brew prefix on macOS', t => {
  const result = getBrewPrefix();
  if (process.platform === 'darwin') {
    t.truthy(result);
    t.true(result.startsWith('/'));
  } else {
    t.pass('skipped: not macOS');
  }
});
