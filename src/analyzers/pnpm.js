/**
 * pnpm package analyzer
 */

import path from 'path';

/**
 * Check if a command is installed via pnpm
 * @param {string} name - Command name
 * @param {string} cmdPath - Full path to the command
 * @returns {Object|null} - Analysis result or null
 */
export function checkPnpm(name, cmdPath) {
  const home = process.env.HOME || '/home/user';
  const pnpmPaths = [
    path.join(home, '.pnpm-store'),
    path.join(home, 'Library', 'pnpm')
  ];

  const isPnpmPath = pnpmPaths.some(p => cmdPath.includes(p));
  if (!isPnpmPath) return null;

  return {
    type: 'pnpm (Node.js)',
    name: name,
    path: cmdPath,
    install: `pnpm add -g ${name}`,
    uninstall: `pnpm remove -g ${name}`,
    update: `pnpm update -g ${name}`,
    info: `pnpm info ${name}`
  };
}
