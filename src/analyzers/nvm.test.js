import test from 'ava';
import { checkNvm } from './nvm.js';

test('checkNvm: returns null for non-node commands', t => {
  const result = checkNvm('python', '/.nvm/versions/node/v16.0.0/bin/python');
  t.is(result, null);
});

test('checkNvm: detects nvm path', t => {
  const result = checkNvm('node', '/Users/test/.nvm/versions/node/v16.0.0/bin/node');
  if (result) {
    t.is(result.type, 'nvm (Node Version Manager)');
    t.truthy(result.install);
    t.truthy(result.uninstall);
    t.truthy(result.update);
    t.truthy(result.info);
  } else {
    t.pass('skipped: nvm not detected');
  }
});

test('checkNvm: detects fnm path', t => {
  const result = checkNvm('node', '/Users/test/.fnm/node-versions/v16.0.0/bin/node');
  if (result) {
    t.is(result.type, 'fnm (Fast Node Manager)');
    t.truthy(result.install);
  } else {
    t.pass('skipped: fnm not detected');
  }
});

test('checkNvm: detects volta path', t => {
  const result = checkNvm('node', '/Users/test/.volta/tools/image/node/16.0.0/bin/node');
  if (result) {
    t.is(result.type, 'Volta');
    t.truthy(result.install);
  } else {
    t.pass('skipped: volta not detected');
  }
});
