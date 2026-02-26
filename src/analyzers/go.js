/**
 * Go package analyzer
 */

import path from 'path';

/**
 * Check if a command is installed via Go
 * @param {string} name - Command name
 * @param {string} cmdPath - Full path to the command
 * @returns {Object|null} - Analysis result or null
 */
export function checkGo(name, cmdPath) {
  const home = process.env.HOME || '/home/user';
  const goPaths = [
    path.join(process.env.GOPATH || '', 'bin'),
    path.join(home, 'go', 'bin'),
    '/usr/local/go/bin',
    path.join(home, '.go', 'bin')
  ];

  const isGoPath = goPaths.some(p => cmdPath.startsWith(p) || cmdPath.includes('/go/bin'));
  if (!isGoPath) return null;

  return {
    type: 'Go',
    name: name,
    path: cmdPath,
    install: `go install ${name}@latest`,
    uninstall: `rm ${cmdPath}`,
    update: `go install ${name}@latest`,
    info: `go version -m ${cmdPath}`,
    reason: 'Found in Go bin directory (GOPATH)'
  };
}
