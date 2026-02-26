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
  // Check for various shim patterns
  const shimInfo =
    checkFnmShim(name, cmdPath) ||
    checkNvmShim(name, cmdPath) ||
    checkVoltaShim(name, cmdPath) ||
    checkAsdfShim(name, cmdPath) ||
    checkRbenvShim(name, cmdPath) ||
    checkPyenvShim(name, cmdPath) ||
    checkSdkmanShim(name, cmdPath) ||
    checkMiseShim(name, cmdPath) ||
    checkRtxShim(name, cmdPath);

  if (shimInfo) {
    shimInfo.isShim = true;
    shimInfo.shimPath = cmdPath;
  }

  return shimInfo;
}

/**
 * Check if path is an fnm shim
 * fnm creates shims that point to .fnm/versions/<version>/bin/<cmd>
 */
function checkFnmShim(name, cmdPath) {
  const fnmPatterns = ['.fnm/shims', '/.fnm/shims'];
  const isFnmShimPath = fnmPatterns.some(p => cmdPath.includes(p));

  if (!isFnmShimPath) {
    // Also check if it's a symlink to fnm
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

function buildFnmResult(name, shimPath, realPath) {
  // Try to determine the actual package manager by reading the shim
  let actualManager = 'npm (Node.js)';
  let reinstallCmd = `npm install -g ${name}`;

  // Read shim content to determine actual manager
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

  // If we have a real path, try to extract version
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
  const nvmPatterns = ['/.nvm/versions/node/', '/.nvm/nvm-exec'];
  const isNvmPath = nvmPatterns.some(p => cmdPath.includes(p));

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
  const voltaPatterns = ['/.volta/', 'volta/'];
  const isVoltaPath = voltaPatterns.some(p => cmdPath.includes(p));

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
 * Check if path is an asdf shim
 */
function checkAsdfShim(name, cmdPath) {
  const asdfPatterns = ['/.asdf/', '/asdf/'];
  const isAsdfPath = asdfPatterns.some(p => cmdPath.includes(p));

  if (!isAsdfPath) return null;

  return {
    type: 'asdf shim',
    name: name,
    path: cmdPath,
    install: 'asdf install <plugin> <version>',
    reinstall: 'asdf reshim <plugin>',
    uninstall: 'asdf uninstall <plugin> <version>',
    info: `asdf list && asdf where ${name}`,
    shimDetails: {
      manager: 'asdf',
      version: 'configured',
      actualManager: 'asdf'
    }
  };
}

/**
 * Check if path is an rbenv shim
 */
function checkRbenvShim(name, cmdPath) {
  const rbenvPatterns = ['/.rbenv/', '/rbenv/'];
  const isRbenvPath = rbenvPatterns.some(p => cmdPath.includes(p));

  if (!isRbenvPath) return null;

  return {
    type: 'rbenv shim',
    name: name,
    path: cmdPath,
    install: 'rbenv install <version>',
    reinstall: 'rbenv rehash',
    uninstall: 'rbenv uninstall <version>',
    info: `rbenv versions && gem which ${name}`,
    shimDetails: {
      manager: 'rbenv',
      version: 'configured',
      actualManager: 'Ruby Gems'
    }
  };
}

/**
 * Check if path is a pyenv shim
 */
function checkPyenvShim(name, cmdPath) {
  const pyenvPatterns = ['/.pyenv/', '/pyenv/'];
  const isPyenvPath = pyenvPatterns.some(p => cmdPath.includes(p));

  if (!isPyenvPath) return null;

  return {
    type: 'pyenv shim',
    name: name,
    path: cmdPath,
    install: `pyenv install <version> && pip install ${name}`,
    reinstall: 'pyenv rehash',
    uninstall: `pip uninstall ${name}`,
    info: `pyenv versions && pip show ${name}`,
    shimDetails: {
      manager: 'pyenv',
      version: 'configured',
      actualManager: 'pip'
    }
  };
}

/**
 * Check if path is an sdkman shim
 */
function checkSdkmanShim(name, cmdPath) {
  const sdkmanPatterns = ['/.sdkman/', '/sdkman/'];
  const isSdkmanPath = sdkmanPatterns.some(p => cmdPath.includes(p));

  if (!isSdkmanPath) return null;

  return {
    type: 'SDKMAN! shim',
    name: name,
    path: cmdPath,
    install: `sdk install ${name}`,
    reinstall: `sdk reinstall ${name}`,
    uninstall: `sdk uninstall ${name}`,
    info: `sdk list ${name}`,
    shimDetails: {
      manager: 'sdkman',
      version: 'current',
      actualManager: 'SDKMAN!'
    }
  };
}

/**
 * Check if path is a mise (formerly rtx) shim
 */
function checkMiseShim(name, cmdPath) {
  const misePatterns = ['/.local/share/mise/', '/mise/'];
  const isMisePath = misePatterns.some(p => cmdPath.includes(p));

  if (!isMisePath) return null;

  return {
    type: 'mise shim',
    name: name,
    path: cmdPath,
    install: `mise install ${name}`,
    reinstall: `mise reshim ${name}`,
    uninstall: `mise uninstall ${name}`,
    info: `mise list && mise where ${name}`,
    shimDetails: {
      manager: 'mise',
      version: 'configured',
      actualManager: 'mise'
    }
  };
}

/**
 * Check if path is an rtx shim (old name for mise)
 */
function checkRtxShim(name, cmdPath) {
  const rtxPatterns = ['/.local/share/rtx/', '/rtx/'];
  const isRtxPath = rtxPatterns.some(p => cmdPath.includes(p));

  if (!isRtxPath) return null;

  return {
    type: 'rtx shim (now mise)',
    name: name,
    path: cmdPath,
    install: `mise install ${name}`,
    reinstall: `mise reshim ${name}`,
    uninstall: `mise uninstall ${name}`,
    info: `mise list && mise where ${name}`,
    shimDetails: {
      manager: 'rtx/mise',
      version: 'configured',
      actualManager: 'mise'
    }
  };
}
