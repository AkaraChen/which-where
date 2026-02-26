import test from 'ava';
import { analyzeCommand } from './analyzer.js';

test('analyzeCommand: returns null for non-existent command', t => {
  const result = analyzeCommand('nonexistent_command_12345');
  t.is(result, null);
});

test('analyzeCommand: analyzes node command', t => {
  const result = analyzeCommand('node');
  if (result) {
    t.truthy(result.type);
    t.truthy(result.name);
    t.truthy(result.path);
    t.truthy(result.install);
    t.truthy(result.uninstall);
    t.truthy(result.update);
    t.truthy(result.info);
  } else {
    t.pass('skipped: node not installed');
  }
});

test('analyzeCommand: analyzes npm command', t => {
  const result = analyzeCommand('npm');
  if (result) {
    t.truthy(result.type);
    t.truthy(result.name);
    t.truthy(result.path);
    t.truthy(result.install);
  } else {
    t.pass('skipped: npm not installed');
  }
});

test('analyzeCommand: analyzes git command', t => {
  const result = analyzeCommand('git');
  if (result) {
    t.truthy(result.type);
    t.truthy(result.name);
    t.truthy(result.path);
    t.truthy(result.install);
  } else {
    t.pass('skipped: git not installed');
  }
});

test('analyzeCommand: analyzes cargo command', t => {
  const result = analyzeCommand('cargo');
  if (result) {
    t.truthy(result.type);
    t.true(result.type.includes('Rust') || result.type.includes('Homebrew'));
    t.truthy(result.install);
  } else {
    t.pass('skipped: cargo not installed');
  }
});

test('analyzeCommand: analyzes ls command', t => {
  const result = analyzeCommand('ls');
  if (result) {
    t.truthy(result.type);
    t.truthy(result.path);
  }
});
