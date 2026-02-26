import test from 'ava';
import { checkSystem } from './system.js';

test('checkSystem: returns null for non-system path', t => {
  const result = checkSystem('node', '/opt/homebrew/bin/node');
  t.is(result, null);
});

test('checkSystem: detects /usr/bin path', t => {
  const result = checkSystem('ls', '/usr/bin/ls');
  t.truthy(result);
  t.truthy(result.type);
});

test('checkSystem: detects /bin path', t => {
  const result = checkSystem('bash', '/bin/bash');
  t.truthy(result);
  t.truthy(result.type);
});

test('checkSystem: detects /usr/sbin path', t => {
  const result = checkSystem('sshd', '/usr/sbin/sshd');
  t.truthy(result);
  t.truthy(result.type);
});

test('checkSystem: detects /sbin path', t => {
  const result = checkSystem('init', '/sbin/init');
  t.truthy(result);
  t.truthy(result.type);
});

test('checkSystem: returns proper commands for system packages', t => {
  const result = checkSystem('ls', '/bin/ls');
  if (result) {
    t.truthy(result.install);
    t.truthy(result.uninstall);
    t.truthy(result.update);
    t.truthy(result.info);
  }
});
