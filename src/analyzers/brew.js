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

  // Try to get formula/cask info using brew info --json
  const brewInfo = getBrewInfo(name, cmdPath, brewPrefix);
  if (brewInfo) {
    return brewInfo;
  }

  // Don't fallback blindly - if we can't determine the formula,
  // let other analyzers try (e.g., checkBrewNpm for npm packages)
  return null;
}

/**
 * Get brew info for a formula or cask
 * @param {string} name - Command name
 * @param {string} cmdPath - Full path to the command
 * @param {string} brewPrefix - Homebrew prefix
 * @returns {Object|null} - Analysis result or null
 */
function getBrewInfo(name, cmdPath, brewPrefix) {
  let realPath;
  let symlinkTarget;

  try {
    if (fs.lstatSync(cmdPath).isSymbolicLink()) {
      symlinkTarget = fs.readlinkSync(cmdPath);
      realPath = fs.realpathSync(cmdPath);
    } else {
      realPath = cmdPath;
    }
  } catch {
    // File doesn't exist or can't be read - use cmdPath as fallback
    realPath = cmdPath;
  }

  // Check for Cellar path (formula)
  if (realPath.includes('/Cellar/')) {
    const relative = realPath.replace(`${brewPrefix}/Cellar/`, '');
    const parts = relative.split('/');
    const formula = parts[0];

    // Check if it's from a tap
    let type = 'Homebrew';
    const tapInfo = getTapInfo(formula);
    if (tapInfo && tapInfo !== 'homebrew/core') {
      type = `Homebrew (tap: ${tapInfo})`;
    }

    return {
      type: type,
      name: formula,
      path: cmdPath,
      install: `brew install ${formula}`,
      reinstall: `brew reinstall ${formula}`,
      uninstall: `brew uninstall ${formula}`,
      update: `brew upgrade ${formula}`,
      info: `brew info ${formula}`,
      reason: 'Found in Homebrew Cellar directory'
    };
  }

  // If the path points to something in lib/node_modules, let checkBrewNpm handle it
  const npmPathToCheck = realPath.includes('/lib/node_modules/')
    ? realPath
    : symlinkTarget && symlinkTarget.includes('/lib/node_modules/')
      ? symlinkTarget
      : null;

  if (npmPathToCheck) {
    // This is an npm package installed via homebrew's node
    // Return null to let checkBrewNpm handle it
    return null;
  }

  // Check for Cask packages (opt/homebrew/Caskroom)
  if (realPath.includes('/Caskroom/')) {
    const relative = realPath.replace(`${brewPrefix}/Caskroom/`, '');
    const caskName = relative.split('/')[0];
    return {
      type: 'Homebrew (Cask)',
      name: caskName,
      path: cmdPath,
      install: `brew install --cask ${caskName}`,
      reinstall: `brew reinstall --cask ${caskName}`,
      uninstall: `brew uninstall --cask ${caskName}`,
      update: `brew upgrade --cask ${caskName}`,
      info: `brew info --cask ${caskName}`,
      reason: 'Found in Homebrew Caskroom directory'
    };
  }

  // Check for Cask app directories
  const caskPath = `${brewPrefix}/Caskroom/`;
  if (cmdPath.startsWith(caskPath)) {
    const relative = cmdPath.replace(caskPath, '');
    const caskName = relative.split('/')[0];
    return {
      type: 'Homebrew (Cask)',
      name: caskName,
      path: cmdPath,
      install: `brew install --cask ${caskName}`,
      reinstall: `brew reinstall --cask ${caskName}`,
      uninstall: `brew uninstall --cask ${caskName}`,
      update: `brew upgrade --cask ${caskName}`,
      info: `brew info --cask ${caskName}`,
      reason: 'Found in Homebrew Caskroom directory'
    };
  }

  return null;
}

/**
 * Get tap information for a formula
 * @param {string} formula - Formula name
 * @returns {string|null} - Tap name or null
 */
function getTapInfo(formula) {
  try {
    // Use brew info --json to get tap info
    const output = exec(`brew info --json=v2 --formula ${formula} 2>/dev/null`);
    if (!output) return null;

    const info = JSON.parse(output);
    if (info.formulae && info.formulae[0]) {
      const f = info.formulae[0];
      if (f.tap && f.tap !== 'homebrew/core') {
        return f.tap.replace('homebrew/', '');
      }
    }
  } catch {
    // Can't get tap info
  }
  return null;
}
