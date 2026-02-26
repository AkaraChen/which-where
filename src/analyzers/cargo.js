/**
 * Cargo/Rust package analyzer
 */

import { exec } from '../utils.js';

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

  // Check if it's a rustup-managed toolchain component
  const toolchainComponents = [
    'cargo',
    'rustc',
    'rustup',
    'rustdoc',
    'rls',
    'rustfmt',
    'clippy-driver',
    'cargo-fmt',
    'cargo-clippy'
  ];
  if (toolchainComponents.includes(name)) {
    return {
      type: 'Rustup (Rust toolchain)',
      name: `rust-toolchain (${name})`,
      path: cmdPath,
      install: 'curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh',
      uninstall: 'rustup self uninstall',
      update: 'rustup update',
      info: 'rustup show'
    };
  }

  // Try to find the crate name from cargo install --list
  let crateName = name;
  const cargoList = exec('cargo install --list 2>/dev/null');

  if (cargoList) {
    const lines = cargoList.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const crateMatch = line.match(/^(\S+)\s+v[\d.]+:/);
      if (crateMatch) {
        const currentCrate = crateMatch[1];
        for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
          const binLine = lines[j];
          if (binLine.trim() === '' || binLine.match(/^\S+\s+v[\d.]+:/)) break;
          if (binLine.includes(name)) {
            crateName = currentCrate;
            break;
          }
        }
      }
    }
  }

  return {
    type: 'Cargo (Rust)',
    name: crateName,
    path: cmdPath,
    install: `cargo install ${crateName}`,
    uninstall: `cargo uninstall ${crateName}`,
    update: `cargo install ${crateName} --force`,
    info: `cargo search ${crateName}`
  };
}
