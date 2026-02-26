/**
 * Homebrew package analyzer
 */

import fs from 'fs';
import { exec, getBrewPrefix } from '../utils.js';

/**
 * Check if a command is installed via Homebrew
 * @param {string} name - Command name
 * @param {string} cmdPath - Full path to the command
 * @returns {Object|null} - Analysis result or null
 */
export function checkBrew(name, cmdPath) {
  const brewPrefix = getBrewPrefix();
  if (!brewPrefix) return null;

  // Check if path is under homebrew
  if (!cmdPath.startsWith(brewPrefix)) {
    return null;
  }

  // Fast path: check if the command name matches a formula
  const brewFormula = exec(`brew --formula ${name} 2>/dev/null`);
  if (brewFormula && fs.existsSync(brewFormula)) {
    return {
      type: 'Homebrew',
      name: name,
      path: cmdPath,
      install: `brew install ${name}`,
      reinstall: `brew reinstall ${name}`,
      uninstall: `brew uninstall ${name}`,
      update: `brew upgrade ${name}`,
      info: `brew info ${name}`
    };
  }

  // Fast path: read symlink to get formula name from Cellar
  try {
    const realPath = fs.realpathSync(cmdPath);
    if (realPath.includes('/Cellar/')) {
      const relative = realPath.replace(`${brewPrefix}/Cellar/`, '');
      const formula = relative.split('/')[0];
      return {
        type: 'Homebrew',
        name: formula,
        path: cmdPath,
        install: `brew install ${formula}`,
        reinstall: `brew reinstall ${formula}`,
        uninstall: `brew uninstall ${formula}`,
        update: `brew upgrade ${formula}`,
        info: `brew info ${formula}`
      };
    }
  } catch {
    // Not a symlink
  }

  // Fast path: check Cellar path directly
  const cellarPath = `${brewPrefix}/Cellar/`;
  if (cmdPath.startsWith(cellarPath)) {
    const relative = cmdPath.replace(cellarPath, '');
    const formula = relative.split('/')[0];
    return {
      type: 'Homebrew',
      name: formula,
      path: cmdPath,
      install: `brew install ${formula}`,
      reinstall: `brew reinstall ${formula}`,
      uninstall: `brew uninstall ${formula}`,
      update: `brew upgrade ${formula}`,
      info: `brew info ${formula}`
    };
  }

  // Final fallback to command name
  return {
    type: 'Homebrew',
    name: name,
    path: cmdPath,
    install: `brew install ${name}`,
    reinstall: `brew reinstall ${name}`,
    uninstall: `brew uninstall ${name}`,
    update: `brew upgrade ${name}`,
    info: `brew info ${name}`
  };
}
