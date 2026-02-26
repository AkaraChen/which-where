/**
 * Utility functions for which-where
 */

import { execaSync } from 'execa';

/**
 * Execute a shell command and return trimmed output
 * @param {string} command - Shell command to execute, or command name when args provided
 * @param {string[]} args - Command arguments (safely escaped). If omitted, command runs in shell mode
 * @returns {string|null} - Trimmed output or null if command fails
 */
export function exec(command, args) {
  try {
    if (args === undefined) {
      // No args provided - run as shell command (backward compatibility)
      const result = execaSync(command, { shell: true, all: true });
      return result.stdout?.trim() ?? null;
    } else {
      // Args provided - run with argument array (safe from injection)
      const result = execaSync(command, args, { all: true });
      return result.stdout?.trim() ?? null;
    }
  } catch {
    return null;
  }
}

/**
 * Get Homebrew prefix path
 * @returns {string|null} - Homebrew prefix or null if not installed
 */
export function getBrewPrefix() {
  return exec('brew', ['--prefix']);
}
