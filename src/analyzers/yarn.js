/**
 * Yarn package analyzer
 */

import path from 'path';

/**
 * Check if a command is installed via Yarn
 * @param {string} name - Command name
 * @param {string} cmdPath - Full path to the command
 * @returns {Object|null} - Analysis result or null
 */
export function checkYarn(name, cmdPath) {
  const home = process.env.HOME || '/home/user';
  const yarnPaths = [
    path.join(home, '.yarn'),
    path.join(home, 'Library', 'pnpm')
  ];

  const isYarnPath = yarnPaths.some(p => cmdPath.includes(p));
  if (!isYarnPath) return null;

  return {
    type: 'Yarn (Node.js)',
    name: name,
    path: cmdPath,
    install: `yarn global add ${name}`,
    uninstall: `yarn global remove ${name}`,
    update: 'yarn global upgrade',
    info: `yarn info ${name}`,
    reason: 'Found in Yarn global directory'
  };
}
