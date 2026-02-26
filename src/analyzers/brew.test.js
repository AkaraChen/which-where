import test from 'ava';
import { checkBrew } from './brew.js';
import { getBrewPrefix } from '../utils.js';

test('checkBrew: returns null for non-homebrew path', t => {
  const result = checkBrew('node', '/usr/bin/node');
  t.is(result, null);
});

test('checkBrew: detects homebrew path', t => {
  const brewPrefix = getBrewPrefix();
  if (brewPrefix) {
    const result = checkBrew('node', `${brewPrefix}/bin/node`);
    t.truthy(result);
    t.is(result.type, 'Homebrew');
    t.truthy(result.install);
    t.truthy(result.uninstall);
    t.truthy(result.update);
  } else {
    t.pass('skipped: brew not installed');
  }
});

test('checkBrew: detects homebrew formula from Cellar path', t => {
  const brewPrefix = getBrewPrefix();
  if (brewPrefix) {
    const result = checkBrew('python', `${brewPrefix}/Cellar/python@3.14/bin/python3`);
    t.truthy(result);
    t.is(result.type, 'Homebrew');
    t.truthy(result.name);
  }
});
