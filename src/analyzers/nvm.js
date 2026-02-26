/**
 * Node.js version manager analyzer (nvm, fnm, volta, etc.)
 */

import fs from 'fs';
import path from 'path';
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
  { manager: 'fnm', patterns: ['/.fnm/', '.fnm/', '/fnm_multishells/'] },
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
 * Resolve the npm binary path from a managed command's path
 * @param {string} cmdPath - Full path to the command
 * @param {string} manager - Manager key (nvm, fnm, volta)
 * @returns {string|null} - Path to npm or null if not found
 */
function resolveNpmPath(cmdPath, manager) {
  const binDir = path.dirname(cmdPath);

  // For fnm, try to resolve the actual npm path from the node-versions directory
  if (manager === 'fnm') {
    // Parse fnm path like: /Users/akrc/.local/state/fnm_multishells/5883_1772116876566/bin/openclaw
    // or: /Users/test/.fnm/node-versions/v16.0.0/bin/npm
    const fnmMatch = cmdPath.match(/(.+\/\.local\/state\/fnm)_[^/]+\/(.+)/);
    const fnmDirect = cmdPath.match(/(.+\/\.fnm)\/node-versions\/([^/]+)\/(.+)/);

    if (fnmMatch) {
      const fnmBase = fnmMatch[1]; // /Users/akrc/.local/state/fnm
      // Try to find the node-versions path
      try {
        const versionsDir = path.join(fnmBase, 'node-versions');
        if (fs.existsSync(versionsDir)) {
          const versions = fs.readdirSync(versionsDir);
          if (versions.length > 0) {
            // Use the first (active) version
            return path.join(versionsDir, versions[0], 'installation', 'bin', 'npm');
          }
        }
      } catch {
        // Fallback to constructing path
      }
      // Construct path from pattern
      return path.join(fnmBase, 'node-versions', 'current', 'installation', 'bin', 'npm');
    }

    if (fnmDirect) {
      // Direct fnm path: construct npm path
      return path.join(fnmDirect[1], 'node-versions', fnmDirect[2], 'installation', 'bin', 'npm');
    }
  }

  // For nvm and volta, or fnm without resolved path, use binDir
  return path.join(binDir, 'npm');
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

  // For node command, return version manager commands (existing behavior)
  if (name === 'node') {
    return {
      ...config,
      name: name,
      path: cmdPath,
      reason: `Node.js binary managed by ${manager}`
    };
  }

  // Try to resolve the real path and extract package name
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
    // Cannot resolve symlink, use command name
  }

  // For npm, npx, corepack: resolve npm and return npm-based commands
  const npmPath = resolveNpmPath(cmdPath, manager);
  if (npmPath) {
    return {
      type: `npm (via ${manager})`,
      name: packageName,
      path: cmdPath,
      install: `${npmPath} install -g ${packageName}`,
      reinstall: `${npmPath} install -g --force ${packageName}`,
      uninstall: `${npmPath} uninstall -g ${packageName}`,
      update: `${npmPath} update -g ${packageName}`,
      info: `${npmPath} view ${packageName}`,
      reason: `npm-managed package via ${manager}`
    };
  }

  // Fallback: return version manager commands
  return {
    ...config,
    name: packageName,
    path: cmdPath,
    reason: `Node.js binary managed by ${manager}`
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
