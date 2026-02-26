/**
 * Go package analyzer
 */

import { exec } from '../utils.js';
import path from 'path';

/**
 * Extract module info from go version -m output
 * @param {string} output - Output from `go version -m`
 * @returns {{module: string, version: string}|null} - Module info or null
 */
function extractModuleInfo(output) {
  const lines = output.split('\n');
  for (const line of lines) {
    // mod lines are: \tmod\t<path>\t<version>\t<hash>
    if (line.includes('\tmod\t')) {
      const parts = line.split('\t');
      // parts[0] is empty (before first tab), parts[1] is 'mod', parts[2] is path, parts[3] is version
      if (parts.length >= 4) {
        return { module: parts[2], version: parts[3] };
      }
    }
  }
  return null;
}

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

  // Try to get module info from go version -m
  let moduleInfo = null;
  try {
    const output = exec('go', ['version', '-m', cmdPath]);
    if (output) {
      moduleInfo = extractModuleInfo(output);
    }
  } catch {
    // If go version -m fails, continue without module info
  }

  const reason = moduleInfo
    ? `Found in Go bin directory (module: ${moduleInfo.module}@${moduleInfo.version})`
    : 'Found in Go bin directory (unable to determine module)';

  return {
    type: 'Go',
    name: name,
    path: cmdPath,
    install: moduleInfo ? `go install ${moduleInfo.module}@${moduleInfo.version}` : null,
    uninstall: `rm ${cmdPath}`,
    update: moduleInfo ? `go install ${moduleInfo.module}@latest` : null,
    info: `go version -m ${cmdPath}`,
    reason: reason
  };
}
