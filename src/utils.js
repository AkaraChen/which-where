/**
 * Utility functions for which-where
 */

import { execSync } from 'child_process';

/**
 * Execute a shell command and return trimmed output
 * @param {string} command - Shell command to execute
 * @returns {string|null} - Trimmed output or null if command fails
 */
export function exec(command) {
  try {
    return execSync(command, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    return null;
  }
}

/**
 * Get Homebrew prefix path
 * @returns {string|null} - Homebrew prefix or null if not installed
 */
export function getBrewPrefix() {
  return exec('brew --prefix');
}
