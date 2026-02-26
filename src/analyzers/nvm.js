/**
 * Node.js version manager analyzer (nvm, fnm, volta, etc.)
 */

import fs from 'fs';
import { exec } from '../utils.js';

const MANAGER_CONFIGS = {
  nvm: {
    type: 'nvm (Node Version Manager)',
    install: 'nvm install <version>',
    reinstall: 'nvm reinstall-packages <version>',
    uninstall: 'nvm uninstall <version>',
    update: 'nvm install --lts or nvm install <version>',
    info: 'nvm ls'
  },
  fnm: {
    type: 'fnm (Fast Node Manager)',
    install: 'fnm install <version>',
    reinstall: 'fnm use <version> && npm install -g <package>',
    uninstall: 'fnm uninstall <version>',
    update: 'fnm install --latest',
    info: 'fnm list'
  },
  volta: {
    type: 'Volta',
    install: 'volta install node@<version>',
    reinstall: 'volta install node@<version>',
    uninstall: 'volta uninstall node@<version>',
    update: 'volta install node@latest',
    info: 'volta list'
  }
};

const PATH_PATTERNS = [
  { manager: 'nvm', patterns: ['/.nvm/', '/.nvmrc', '.nvm/'] },
  { manager: 'fnm', patterns: ['/.fnm/', '.fnm/'] },
  { manager: 'volta', patterns: ['/.volta/', 'volta/'] }
];

/**
 * Check if a command is installed via a Node.js version manager
 * @param {string} name - Command name
 * @param {string} cmdPath - Full path to the command
 * @returns {Object|null} - Analysis result or null
 */
export function checkNvm(name, cmdPath) {
  const nodeCommands = ['node', 'npm', 'npx', 'corepack'];
  if (!nodeCommands.includes(name)) return null;

  // Check path patterns for known version managers
  for (const { manager, patterns } of PATH_PATTERNS) {
    if (patterns.some(p => cmdPath.includes(p))) {
      return buildResult(name, cmdPath, manager);
    }
  }

  // Check if a version manager is active via environment variables
  const activeManager = detectActiveManager();
  if (activeManager) {
    return buildResult(name, cmdPath, activeManager);
  }

  return null;
}

/**
 * Build a result object for a given version manager
 * @param {string} name - Command name
 * @param {string} cmdPath - Full path to the command
 * @param {string} manager - Manager key (nvm, fnm, volta)
 * @returns {Object} - Analysis result
 */
function buildResult(name, cmdPath, manager) {
  const config = MANAGER_CONFIGS[manager];
  return {
    ...config,
    name: name,
    path: cmdPath
  };
}

/**
 * Detect which version manager is currently active
 * @returns {string|null} - Manager key or null
 */
function detectActiveManager() {
  if (isManagerActive('NVM_DIR', 'nvm --version 2>/dev/null')) {
    return 'nvm';
  }

  if (isManagerActive('FNM_DIR', 'fnm --version 2>/dev/null')) {
    return 'fnm';
  }

  const voltaHome = process.env.VOLTA_HOME;
  if (voltaHome && fs.existsSync(voltaHome)) {
    return 'volta';
  }

  return null;
}

/**
 * Check if a version manager is active by its env var and version command
 * @param {string} envVar - Environment variable name
 * @param {string} versionCmd - Command to check if the manager is available
 * @returns {boolean}
 */
function isManagerActive(envVar, versionCmd) {
  const dir = process.env[envVar];
  return dir && fs.existsSync(dir) && exec(versionCmd) !== null;
}
