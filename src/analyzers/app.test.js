import test from 'ava';
import { checkApp } from './app.js';

test('checkApp: returns null for non-app path', t => {
  const result = checkApp('node', '/usr/bin/node');
  t.is(result, null);
});

test('checkApp: detects app bundle path', t => {
  const result = checkApp('docker', '/Applications/Docker.app/Contents/Resources/bin/docker');
  t.truthy(result);
  t.is(result.type, 'macOS App Bundle');
  t.is(result.appBundle, 'Docker');
  t.truthy(result.reason.includes('Docker.app'));
});

test('checkApp: extracts correct app name from path', t => {
  const result = checkApp('kubectl', '/Users/test/Apps/Rancher.app/Contents/MacOS/kubectl');
  t.truthy(result);
  t.is(result.appBundle, 'Rancher');
});
