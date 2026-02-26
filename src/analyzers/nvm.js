/**
 * Node.js version manager analyzer (nvm, fnm, volta, etc.)
 */

import fs from 'fs';
import { exec } from '../utils.js';

/**
 * Check if a command is installed via a Node.js version manager
 * @param {string} name - Command name
 * @param {string} cmdPath - Full path to the command
 * @returns {Object|null} - Analysis result or null
 */
export function checkNvm(name, cmdPath) {
  // Only check for node, npm, npx, corepack
  const nodeCommands = ['node', 'npm', 'npx', 'corepack'];
  if (!nodeCommands.includes(name)) return null;

  // Check for nvm path pattern
  const nvmPatterns = [
    '/.nvm/',
    '/.nvmrc',
    '.nvm/'
  ];

  const fnmPatterns = [
    '/.fnm/',
    '.fnm/'
  ];

  const voltaPatterns = [
    '/.volta/',
    'volta/'
  ];

  const isNvm = nvmPatterns.some(p => cmdPath.includes(p));
  const isFnm = fnmPatterns.some(p => cmdPath.includes(p));
  const isVolta = voltaPatterns.some(p => cmdPath.includes(p));

  if (isNvm) {
    return {
      type: 'nvm (Node Version Manager)',
      name: name,
      path: cmdPath,
      install: 'nvm install <version>',
      reinstall: 'nvm reinstall-packages <version>',
      uninstall: 'nvm uninstall <version>',
      update: 'nvm install --lts or nvm install <version>',
      info: 'nvm ls'
    };
  }

  if (isFnm) {
    return {
      type: 'fnm (Fast Node Manager)',
      name: name,
      path: cmdPath,
      install: 'fnm install <version>',
      reinstall: 'fnm use <version> && npm install -g <package>',
      uninstall: 'fnm uninstall <version>',
      update: 'fnm install --latest',
      info: 'fnm list'
    };
  }

  if (isVolta) {
    return {
      type: 'Volta',
      name: name,
      path: cmdPath,
      install: 'volta install node@<version>',
      reinstall: 'volta install node@<version>',
      uninstall: 'volta uninstall node@<version>',
      update: 'volta install node@latest',
      info: 'volta list'
    };
  }

  // Check if fnm or nvm is the active version manager
  const activeManager = detectActiveManager();
  if (activeManager) {
    return {
      type: activeManager.type,
      name: name,
      path: cmdPath,
      install: activeManager.install,
      reinstall: activeManager.reinstall,
      uninstall: activeManager.uninstall,
      update: activeManager.update,
      info: activeManager.info
    };
  }

  return null;
}

/**
 * Detect which version manager is currently active
 * @returns {Object|null} - Manager info or null
 */
function detectActiveManager() {
  // Check NVM_DIR environment
  const nvmDir = process.env.NVM_DIR;
  if (nvmDir && fs.existsSync(nvmDir)) {
    const currentVersion = exec('nvm --version 2>/dev/null');
    if (currentVersion) {
      return {
        type: 'nvm (Node Version Manager)',
        install: 'nvm install <version>',
        reinstall: 'nvm reinstall-packages <version>',
        uninstall: 'nvm uninstall <version>',
        update: 'nvm install --lts',
        info: 'nvm ls'
      };
    }
  }

  // Check FNM_DIR environment
  const fnmDir = process.env.FNM_DIR;
  if (fnmDir && fs.existsSync(fnmDir)) {
    const currentVersion = exec('fnm --version 2>/dev/null');
    if (currentVersion) {
      return {
        type: 'fnm (Fast Node Manager)',
        install: 'fnm install <version>',
        reinstall: 'fnm use <version> && npm install -g <package>',
        uninstall: 'fnm uninstall <version>',
        update: 'fnm install --latest',
        info: 'fnm list'
      };
    }
  }

  // Check VOLTA_HOME environment
  const voltaHome = process.env.VOLTA_HOME;
  if (voltaHome && fs.existsSync(voltaHome)) {
    return {
      type: 'Volta',
      install: 'volta install node@<version>',
      reinstall: 'volta install node@<version>',
      uninstall: 'volta uninstall node@<version>',
      update: 'volta install node@latest',
      info: 'volta list'
    };
  }

  return null;
}
