import test from 'ava';
import { checkGo } from './go.js';

test('checkGo: returns null for non-go path', t => {
  const result = checkGo('node', '/usr/bin/node');
  t.is(result, null);
});

test('checkGo: detects go path - GOPATH', t => {
  const result = checkGo('go', '/home/user/go/bin/go');
  t.truthy(result);
  t.is(result.type, 'Go');
});

test('checkGo: detects go path - home', t => {
  const result = checkGo('go', '/Users/test/go/bin/go');
  t.truthy(result);
  t.is(result.type, 'Go');
});
