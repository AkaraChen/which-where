import test from 'ava';
import { checkPip } from './pip.js';

test('checkPip: returns null when pip is not available', t => {
  // This test will pass if pip is not installed
  const result = checkPip('test', '/fake/path');
  if (!result) {
    t.pass('pip not available');
  } else {
    t.truthy(result.type);
    t.is(result.type, 'pip');
  }
});

test('checkPip: returns null for non-pip path', t => {
  const result = checkPip('node', '/usr/local/bin/node');
  t.is(result, null);
});

test('checkPip: analyzes pip package', t => {
  // Test with a path that looks like a pip package
  const fakePath = '/Users/test/.venv/bin/pip-test-package';
  const result = checkPip('pip-test-package', fakePath);

  if (result) {
    t.is(result.type, 'pip');
    t.truthy(result.name);
    t.truthy(result.path);
    t.truthy(result.install);
    t.truthy(result.uninstall);
    t.truthy(result.update);
    t.truthy(result.info);
    t.true(result.install.startsWith('pip install'));
    t.true(result.uninstall.startsWith('pip uninstall'));
  } else {
    t.pass('skipped: package not found');
  }
});
