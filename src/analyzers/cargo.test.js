import test from 'ava';
import { checkCargo } from './cargo.js';

test('checkCargo: returns null for non-cargo path', t => {
  const result = checkCargo('node', '/usr/bin/node');
  t.is(result, null);
});

test('checkCargo: detects cargo path', t => {
  const home = process.env.HOME || '/home/user';
  const result = checkCargo('cargo', `${home}/.cargo/bin/cargo`);
  t.truthy(result);
  t.true(result.type.includes('Rust'));
});

test('checkCargo: detects rustup toolchain components', t => {
  const home = process.env.HOME || '/home/user';
  const result = checkCargo('rustc', `${home}/.cargo/bin/rustc`);
  t.truthy(result);
  t.is(result.type, 'Rustup (Rust toolchain)');
  t.true(result.install.includes('rustup'));
});

test('checkCargo: detects rustup toolchain - rustup', t => {
  const home = process.env.HOME || '/home/user';
  const result = checkCargo('rustup', `${home}/.cargo/bin/rustup`);
  t.truthy(result);
  t.is(result.type, 'Rustup (Rust toolchain)');
});

test('checkCargo: detects rustup toolchain - cargo-fmt', t => {
  const home = process.env.HOME || '/home/user';
  const result = checkCargo('cargo-fmt', `${home}/.cargo/bin/cargo-fmt`);
  t.truthy(result);
  t.is(result.type, 'Rustup (Rust toolchain)');
});
