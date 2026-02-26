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
    path.join(home, '.nvm'),
    path.join(home, '.npm-global')
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
    // Cannot resolve symlink
  }

  return {
    type: 'npm (Node.js)',
    name: packageName,
    path: cmdPath,
    install: `npm install -g ${packageName}`,
    uninstall: `npm uninstall -g ${packageName}`,
    update: `npm update -g ${packageName}`,
    info: `npm view ${packageName}`,
    reason: 'Found in npm global paths (node_modules)'
  };
}

/**
 * Check if a command is installed via homebrew's npm
 * @param {string} name - Command name
 * @param {string} cmdPath - Full path to the command
 * @returns {Object|null} - Analysis result or null
 */
export function checkBrewNpm(name, cmdPath) {
  const brewPrefix = '/opt/homebrew';
  const brewPrefixAlt = '/usr/local';

  // Check both ARM and Intel homebrew paths
  for (const prefix of [brewPrefix, brewPrefixAlt]) {
    const npmModulesPath = `${prefix}/lib/node_modules/`;
    const binPath = `${prefix}/bin/`;

    const isInNpmModules = cmdPath.startsWith(npmModulesPath);
    const isInBin = cmdPath.startsWith(binPath);

    if (!isInNpmModules && !isInBin) continue;

    let realPath;
    let symlinkTarget;

    try {
      realPath = fs.realpathSync(cmdPath);
      if (fs.lstatSync(cmdPath).isSymbolicLink()) {
        symlinkTarget = fs.readlinkSync(cmdPath);
      }
    } catch {
      continue;
    }

    // Check if it's an npm package (via realPath or symlink target)
    let npmPathToCheck = null;
    if (realPath.includes('/lib/node_modules/')) {
      npmPathToCheck = realPath;
    } else if (symlinkTarget && symlinkTarget.includes('/lib/node_modules/')) {
      npmPathToCheck = symlinkTarget;
    }

    if (npmPathToCheck) {
      const match = npmPathToCheck.match(/\/lib\/node_modules\/([^/]+)/);
      if (match) {
        const packageName = match[1];
        const brewNpm = `${prefix}/bin/npm`;
        return {
          type: 'npm (via Homebrew Node.js)',
          name: packageName,
          path: cmdPath,
          install: `${brewNpm} install -g ${packageName}`,
          reinstall: `${brewNpm} install -g --force ${packageName}`,
          uninstall: `${brewNpm} uninstall -g ${packageName}`,
          update: `${brewNpm} update -g ${packageName}`,
          info: `${brewNpm} ls -g ${packageName}`,
          reason: `Found in Homebrew's node_modules (${prefix})`
        };
      }
    }
  }

  return null;
}
