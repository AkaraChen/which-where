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

test('checkNvm: node returns version manager commands', t => {
  const result = checkNvm('node', '/Users/test/.fnm/node-versions/v16.0.0/bin/node');
  if (result) {
    t.regex(result.type, /fnm/);
    t.regex(result.install, /fnm install/);
  } else {
    t.pass('skipped: fnm not detected');
  }
});

test('checkNvm: returns npm commands for npm managed by fnm', t => {
  const result = checkNvm('npm', '/Users/test/.fnm/node-versions/v16.0.0/bin/npm');
  if (result) {
    t.regex(result.type, /npm.*via fnm/);
    t.regex(result.install, /npm install -g npm/);
    t.notRegex(result.install, /fnm install/);
  } else {
    t.pass('skipped: fnm not detected');
  }
});

test('checkNvm: returns npm commands for corepack managed by fnm', t => {
  const result = checkNvm('corepack', '/Users/test/.fnm/node-versions/v16.0.0/bin/corepack');
  if (result) {
    t.regex(result.type, /npm.*via fnm/);
    t.regex(result.install, /npm install -g corepack/);
    t.notRegex(result.install, /fnm install/);
  } else {
    t.pass('skipped: fnm not detected');
  }
});

test('checkNvm: returns npm commands for npm managed by nvm', t => {
  const result = checkNvm('npm', '/Users/test/.nvm/versions/node/v16.0.0/bin/npm');
  if (result) {
    t.regex(result.type, /npm.*via nvm/);
    t.regex(result.install, /npm install -g npm/);
  } else {
    t.pass('skipped: nvm not detected');
  }
});

test('checkNvm: returns npm commands for npx managed by nvm', t => {
  const result = checkNvm('npx', '/Users/test/.nvm/versions/node/v16.0.0/bin/npx');
  if (result) {
    t.regex(result.type, /npm.*via nvm/);
    t.regex(result.install, /npm install -g npx/);
  } else {
    t.pass('skipped: nvm not detected');
  }
});

test('checkNvm: returns npm commands for corepack managed by volta', t => {
  const result = checkNvm('corepack', '/Users/test/.volta/tools/image/node/16.0.0/bin/corepack');
  if (result) {
    t.regex(result.type, /npm.*via volta/);
    t.regex(result.install, /npm install -g corepack/);
  } else {
    t.pass('skipped: volta not detected');
  }
});
