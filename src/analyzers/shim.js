/**
 * Shim detector for version managers and tool shims
 */

import fs from 'fs';

/**
 * Detect if a command path is a shim and return the actual manager info
 * @param {string} name - Command name
 * @param {string} cmdPath - Full path to the command
 * @returns {Object|null} - Shim info or null
 */
export function detectShim(name, cmdPath) {
  const shimInfo =
    checkFnmShim(name, cmdPath) ||
    checkNvmShim(name, cmdPath) ||
    checkVoltaShim(name, cmdPath) ||
    checkSimpleShim(name, cmdPath);

  if (shimInfo) {
    shimInfo.isShim = true;
    shimInfo.shimPath = cmdPath;
  }

  return shimInfo;
}

/**
 * Check if path is an fnm shim.
 * fnm creates shims that point to .fnm/versions/<version>/bin/<cmd>
 */
function checkFnmShim(name, cmdPath) {
  const isFnmShimPath = cmdPath.includes('.fnm/shims') || cmdPath.includes('/.fnm/shims');

  if (!isFnmShimPath) {
    try {
      if (fs.lstatSync(cmdPath).isSymbolicLink()) {
        const realPath = fs.realpathSync(cmdPath);
        if (realPath.includes('.fnm')) {
          return buildFnmResult(name, cmdPath, realPath);
        }
      }
    } catch {
      // File doesn't exist or isn't a symlink
    }
    return null;
  }

  return buildFnmResult(name, cmdPath, null);
}

/**
 * Build an fnm shim result, detecting the actual package manager from shim content
 */
function buildFnmResult(name, shimPath, realPath) {
  let actualManager = 'npm (Node.js)';
  let reinstallCmd = `npm install -g ${name}`;

  try {
    const shimContent = fs.readFileSync(shimPath, 'utf-8');
    if (shimContent.includes('yarn')) {
      actualManager = 'Yarn (Node.js)';
      reinstallCmd = `yarn global add ${name}`;
    } else if (shimContent.includes('pnpm')) {
      actualManager = 'pnpm (Node.js)';
      reinstallCmd = `pnpm add -g ${name}`;
    } else if (shimContent.includes('bun')) {
      actualManager = 'Bun';
      reinstallCmd = `bun add -g ${name}`;
    } else if (shimContent.includes('corepack')) {
      actualManager = 'Corepack (Node.js)';
      reinstallCmd = `corepack install -g ${name}`;
    }
  } catch {
    // Can't read shim
  }

  let version = 'current';
  if (realPath) {
    const versionMatch = realPath.match(/\.fnm\/versions\/node-([^/]+)/);
    if (versionMatch) {
      version = versionMatch[1];
    }
  }

  return {
    type: `fnm shim -> ${actualManager}`,
    name: name,
    path: shimPath,
    install: `fnm install <version> && npm install -g ${name}`,
    reinstall: reinstallCmd,
    uninstall: `fnm exec --using node-${version} npm uninstall -g ${name}`,
    update: `npm update -g ${name}`,
    info: `fnm list && npm ls -g ${name}`,
    shimDetails: {
      manager: 'fnm',
      version: version,
      actualManager: actualManager
    }
  };
}

/**
 * Check if path is an nvm shim/wrapper
 */
function checkNvmShim(name, cmdPath) {
  const isNvmPath = cmdPath.includes('/.nvm/versions/node/') || cmdPath.includes('/.nvm/nvm-exec');

  if (!isNvmPath) return null;

  let version = 'current';
  const versionMatch = cmdPath.match(/\/\.nvm\/versions\/node\/v([^/]+)/);
  if (versionMatch) {
    version = versionMatch[1];
  }

  return {
    type: 'nvm wrapper -> npm (Node.js)',
    name: name,
    path: cmdPath,
    install: `nvm install <version> && npm install -g ${name}`,
    reinstall: `npm install -g --force ${name}`,
    uninstall: `npm uninstall -g ${name}`,
    update: `npm update -g ${name}`,
    info: `nvm ls && npm ls -g ${name}`,
    shimDetails: {
      manager: 'nvm',
      version: version,
      actualManager: 'npm (Node.js)'
    }
  };
}

/**
 * Check if path is a volta shim
 */
function checkVoltaShim(name, cmdPath) {
  const isVoltaPath = cmdPath.includes('/.volta/') || cmdPath.includes('volta/');
  if (!isVoltaPath) return null;

  return {
    type: 'Volta shim -> managed',
    name: name,
    path: cmdPath,
    install: `volta install ${name}`,
    reinstall: `volta install ${name}`,
    uninstall: `volta uninstall ${name}`,
    update: `volta install ${name}@latest`,
    info: 'volta list',
    shimDetails: {
      manager: 'volta',
      version: 'pinned',
      actualManager: 'Volta'
    }
  };
}

/**
 * Simple shim configurations that share the same detection pattern:
 * check if the command path matches known directory patterns.
 */
const SIMPLE_SHIMS = [
  {
    patterns: ['/.asdf/', '/asdf/'],
    type: 'asdf shim',
    manager: 'asdf',
    actualManager: 'asdf',
    version: 'configured',
    commands: name => ({
      install: 'asdf install <plugin> <version>',
      reinstall: 'asdf reshim <plugin>',
      uninstall: 'asdf uninstall <plugin> <version>',
      info: `asdf list && asdf where ${name}`
    })
  },
  {
    patterns: ['/.rbenv/', '/rbenv/'],
    type: 'rbenv shim',
    manager: 'rbenv',
    actualManager: 'Ruby Gems',
    version: 'configured',
    commands: name => ({
      install: 'rbenv install <version>',
      reinstall: 'rbenv rehash',
      uninstall: 'rbenv uninstall <version>',
      info: `rbenv versions && gem which ${name}`
    })
  },
  {
    patterns: ['/.pyenv/', '/pyenv/'],
    type: 'pyenv shim',
    manager: 'pyenv',
    actualManager: 'pip',
    version: 'configured',
    commands: name => ({
      install: `pyenv install <version> && pip install ${name}`,
      reinstall: 'pyenv rehash',
      uninstall: `pip uninstall ${name}`,
      info: `pyenv versions && pip show ${name}`
    })
  },
  {
    patterns: ['/.sdkman/', '/sdkman/'],
    type: 'SDKMAN! shim',
    manager: 'sdkman',
    actualManager: 'SDKMAN!',
    version: 'current',
    commands: name => ({
      install: `sdk install ${name}`,
      reinstall: `sdk reinstall ${name}`,
      uninstall: `sdk uninstall ${name}`,
      info: `sdk list ${name}`
    })
  },
  {
    patterns: ['/.local/share/mise/', '/mise/'],
    type: 'mise shim',
    manager: 'mise',
    actualManager: 'mise',
    version: 'configured',
    commands: name => ({
      install: `mise install ${name}`,
      reinstall: `mise reshim ${name}`,
      uninstall: `mise uninstall ${name}`,
      info: `mise list && mise where ${name}`
    })
  },
  {
    patterns: ['/.local/share/rtx/', '/rtx/'],
    type: 'rtx shim (now mise)',
    manager: 'rtx/mise',
    actualManager: 'mise',
    version: 'configured',
    commands: name => ({
      install: `mise install ${name}`,
      reinstall: `mise reshim ${name}`,
      uninstall: `mise uninstall ${name}`,
      info: `mise list && mise where ${name}`
    })
  }
];

/**
 * Check if the path matches any of the simple shim patterns
 * @param {string} name - Command name
 * @param {string} cmdPath - Full path to the command
 * @returns {Object|null} - Shim result or null
 */
function checkSimpleShim(name, cmdPath) {
  for (const shim of SIMPLE_SHIMS) {
    if (!shim.patterns.some(p => cmdPath.includes(p))) continue;

    return {
      type: shim.type,
      name: name,
      path: cmdPath,
      ...shim.commands(name),
      shimDetails: {
        manager: shim.manager,
        version: shim.version,
        actualManager: shim.actualManager
      }
    };
  }

  return null;
}
