/**
 * Utility functions for which-where
 */

const { execSync } = require('child_process');

/**
 * Execute a shell command and return trimmed output
 * @param {string} command - Shell command to execute
 * @returns {string|null} - Trimmed output or null if command fails
 */
function exec(command) {
  try {
    return execSync(command, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch (e) {
    return null;
  }
}

/**
 * Get Homebrew prefix path
 * @returns {string|null} - Homebrew prefix or null if not installed
 */
function getBrewPrefix() {
  const result = exec('brew --prefix');
  return result;
}

module.exports = {
  exec,
  getBrewPrefix
};
