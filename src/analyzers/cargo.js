/**
 * Cargo/Rust package analyzer
 */

import { exec } from '../utils.js';

const TOOLCHAIN_COMPONENTS = new Set([
  'cargo',
  'rustc',
  'rustup',
  'rustdoc',
  'rls',
  'rustfmt',
  'clippy-driver',
  'cargo-fmt',
  'cargo-clippy'
]);

/**
 * Check if a command is installed via Cargo/Rust
 * @param {string} name - Command name
 * @param {string} cmdPath - Full path to the command
 * @returns {Object|null} - Analysis result or null
 */
export function checkCargo(name, cmdPath) {
  const home = process.env.HOME || '/home/user';
  const cargoPath = `${home}/.cargo/bin`;

  if (
    !cmdPath.startsWith(cargoPath) &&
    !cmdPath.includes('.cargo/bin') &&
    !cmdPath.includes('.rustup')
  ) {
    return null;
  }

  if (TOOLCHAIN_COMPONENTS.has(name)) {
    return {
      type: 'Rustup (Rust toolchain)',
      name: `rust-toolchain (${name})`,
      path: cmdPath,
      install: 'curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh',
      uninstall: 'rustup self uninstall',
      update: 'rustup update',
      info: 'rustup show',
      reason: 'Standard rust toolchain component'
    };
  }

  const crateName = findCrateName(name) || name;

  return {
    type: 'Cargo (Rust)',
    name: crateName,
    path: cmdPath,
    install: `cargo install ${crateName}`,
    uninstall: `cargo uninstall ${crateName}`,
    update: `cargo install ${crateName} --force`,
    info: `cargo search ${crateName}`,
    reason:
      crateName !== name
        ? `Found in cargo install --list as '${crateName}'`
        : 'Path matches cargo bin directory'
  };
}

/**
 * Find the crate name that provides a given binary
 * @param {string} binName - Binary name to look up
 * @returns {string|null} - Crate name or null if not found
 */
function findCrateName(binName) {
  const cargoList = exec('cargo install --list 2>/dev/null');
  if (!cargoList) return null;

  const lines = cargoList.split('\n');
  let currentCrate = null;

  for (const line of lines) {
    const crateMatch = line.match(/^(\S+)\s+v[\d.]+:/);
    if (crateMatch) {
      currentCrate = crateMatch[1];
      continue;
    }

    if (currentCrate && line.includes(binName)) {
      return currentCrate;
    }

    if (line.trim() === '') {
      currentCrate = null;
    }
  }

  return null;
}
