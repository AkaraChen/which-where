/**
 * npm package analyzer
 */

import path from 'path';
import fs from 'fs';

/**
 * Check if a command is installed via npm
 * @param {string} name - Command name
 * @param {string} cmdPath - Full path to the command
 * @returns {Object|null} - Analysis result or null
 */
export function checkNpm(name, cmdPath) {
  const home = process.env.HOME || '/home/user';
  const npmGlobalPaths = [
    '/usr/local/lib/node_modules',
    '/usr/local/bin',
    path.join(home, '.nvm'),
    path.join(home, '.npm-global'),
    '/opt/homebrew/lib/node_modules'
  ];

  const isNpmPath = npmGlobalPaths.some(p => cmdPath.includes(p));
  if (!isNpmPath) return null;

  // Try to find the package name
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
    // Not a symlink
  }

  return {
    type: 'npm (Node.js)',
    name: packageName,
    path: cmdPath,
    install: `npm install -g ${packageName}`,
    uninstall: `npm uninstall -g ${packageName}`,
    update: `npm update -g ${packageName}`,
    info: `npm view ${packageName}`
  };
}
