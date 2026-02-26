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
  if (!cmdPath.startsWith(brewPrefix)) return null;

  return getBrewInfo(name, cmdPath, brewPrefix);
}

/**
 * Get brew info for a formula or cask
 * @param {string} name - Command name
 * @param {string} cmdPath - Full path to the command
 * @param {string} brewPrefix - Homebrew prefix
 * @returns {Object|null} - Analysis result or null
 */
function getBrewInfo(name, cmdPath, brewPrefix) {
  const { realPath, symlinkTarget } = resolveSymlink(cmdPath);

  // Check for Cellar path (formula)
  if (realPath.includes('/Cellar/')) {
    return buildCellarResult(cmdPath, realPath, brewPrefix);
  }

  // If the path points to node_modules, let checkBrewNpm handle it
  const hasNpmModules =
    realPath.includes('/lib/node_modules/') ||
    (symlinkTarget && symlinkTarget.includes('/lib/node_modules/'));

  if (hasNpmModules) {
    return null;
  }

  // Check for Cask packages
  if (realPath.includes('/Caskroom/') || cmdPath.includes('/Caskroom/')) {
    const caskPath = realPath.includes('/Caskroom/') ? realPath : cmdPath;
    const relative = caskPath.replace(`${brewPrefix}/Caskroom/`, '');
    const caskName = relative.split('/')[0];
    return buildCaskResult(caskName, cmdPath);
  }

  return null;
}

/**
 * Resolve a symlink to its real path
 * @param {string} cmdPath - Path to resolve
 * @returns {{realPath: string, symlinkTarget: string|null}}
 */
function resolveSymlink(cmdPath) {
  try {
    if (fs.lstatSync(cmdPath).isSymbolicLink()) {
      return {
        realPath: fs.realpathSync(cmdPath),
        symlinkTarget: fs.readlinkSync(cmdPath)
      };
    }
  } catch {
    // File doesn't exist or can't be read
  }
  return { realPath: cmdPath, symlinkTarget: null };
}

/**
 * Build a result for a Homebrew Cellar formula
 */
function buildCellarResult(cmdPath, realPath, brewPrefix) {
  const relative = realPath.replace(`${brewPrefix}/Cellar/`, '');
  const formula = relative.split('/')[0];

  let type = 'Homebrew';
  const tapInfo = getTapInfo(formula);
  if (tapInfo && tapInfo !== 'homebrew/core') {
    type = `Homebrew (tap: ${tapInfo})`;
  }

  return {
    type,
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

/**
 * Build a result for a Homebrew Cask package
 */
function buildCaskResult(caskName, cmdPath) {
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

/**
 * Get tap information for a formula
 * @param {string} formula - Formula name
 * @returns {string|null} - Tap name or null
 */
function getTapInfo(formula) {
  const output = exec(`brew info --json=v2 --formula ${formula} 2>/dev/null`);
  if (!output) return null;

  try {
    const info = JSON.parse(output);
    const tap = info.formulae?.[0]?.tap;
    if (tap && tap !== 'homebrew/core') {
      return tap.replace('homebrew/', '');
    }
  } catch {
    // Invalid JSON
  }

  return null;
}
