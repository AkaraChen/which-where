/**
 * Bun package analyzer
 */

import path from 'path';
import fs from 'fs';

/**
 * Check if a command is installed via Bun
 * @param {string} name - Command name
 * @param {string} cmdPath - Full path to the command
 * @returns {Object|null} - Analysis result or null
 */
export function checkBun(name, cmdPath) {
  const bunPaths = ['.bun/bin', '.bun/install/bin', path.join(path.sep, '.bun')];

  const isBunPath = bunPaths.some(p => cmdPath.includes(p));
  if (!isBunPath) return null;

  // Try to get the package name from the bun installation
  let packageName = name;

  try {
    const realPath = fs.realpathSync(cmdPath);
    if (realPath.includes('node_modules')) {
      const match = realPath.match(/node_modules\/(@[^/]+\/[^/]+|[^/]+)/);
      if (match) {
        packageName = match[1];
      }
    }
  } catch {
    // Not a symlink or bun-managed path
  }

  return {
    type: 'Bun',
    name: packageName,
    path: cmdPath,
    install: `bun add -g ${packageName}`,
    uninstall: `bun remove -g ${packageName}`,
    update: `bun update -g ${packageName}`,
    info: 'bun pm ls -g',
    reason: 'Found in Bun bin directory'
  };
}
