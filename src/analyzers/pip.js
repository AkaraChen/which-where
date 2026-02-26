/**
 * Pip/Python package analyzer
 */

import fs from 'fs';
import path from 'path';
import { exec } from '../utils.js';

/**
 * Check if a command is installed via pip
 * @param {string} name - Command name
 * @param {string} cmdPath - Full path to the command
 * @returns {Object|null} - Analysis result or null
 */
export function checkPip(name, cmdPath) {
  const pipCmd = findPipCommand();
  if (!pipCmd) return null;

  // Check if cmdPath is a symlink and resolve it
  let realPath = cmdPath;
  try {
    if (fs.existsSync(cmdPath) && fs.lstatSync(cmdPath).isSymbolicLink()) {
      realPath = fs.realpathSync(cmdPath);
    }
  } catch {
    // Can't resolve symlink, use original path
  }

  const isPythonPath =
    cmdPath.includes('site-packages') ||
    cmdPath.includes('/bin/') && (cmdPath.includes('.venv') || cmdPath.includes('virtualenv') || cmdPath.includes('/test-venv/') || cmdPath.includes('venv/bin/')) ||
    cmdPath.includes('.pyenv') ||
    cmdPath.includes('pipx/venvs') ||
    realPath.includes('pipx/venvs') ||
    (cmdPath.includes('bin') && cmdPath.includes('python'));

  if (!isPythonPath) return null;

  const isPipx = cmdPath.includes('pipx/venvs') || realPath.includes('pipx/venvs');
  const isVenv = cmdPath.includes('.venv') || cmdPath.includes('virtualenv') || cmdPath.includes('/test-venv/') || cmdPath.includes('venv/bin/');

  let packageName;
  if (isPipx) {
    const pipxPath = realPath.includes('pipx/venvs') ? realPath : cmdPath;
    const match = pipxPath.match(/pipx\/venvs\/([^/]+)/);
    packageName = match ? match[1] : name;
  } else {
    packageName = resolvePackageName(name, pipCmd, isVenv ? cmdPath : null);
  }

  let verified;
  if (isPipx) {
    const pipxPython = realPath.replace(/\/bin\/[^/]+$/, '/bin/python');
    verified = exec(`${pipxPython} -m pip show ${packageName} 2>/dev/null`);
  } else if (isVenv) {
    const venvPip = cmdPath.replace(/\/bin\/[^/]+$/, '/bin/pip');
    verified = exec(`${venvPip} show ${packageName} 2>/dev/null`);
  } else {
    verified =
      exec(`${pipCmd} show ${packageName} 2>/dev/null`) ||
      exec(`pip show ${packageName} 2>/dev/null`);
  }

  if (!verified) return null;

  const result = {
    type: isPipx ? 'pipx' : 'pip',
    name: packageName,
    path: cmdPath,
    reason: isPipx ? 'Found in pipx managed environment' : 'Found in Python site-packages directory'
  };

  if (isPipx) {
    result.install = `pipx install ${packageName}`;
    result.reinstall = `pipx reinstall ${packageName}`;
    result.uninstall = `pipx uninstall ${packageName}`;
    result.update = `pipx upgrade ${packageName}`;
    result.info = `pipx list --include-injected | grep ${packageName}`;
  } else {
    result.install = `pip install ${packageName}`;
    result.reinstall = `pip install --force-reinstall ${packageName}`;
    result.uninstall = `pip uninstall ${packageName}`;
    result.update = `pip install --upgrade ${packageName}`;
    result.info = `pip show ${packageName}`;
  }

  return result;
}

/**
 * Find the available pip command (pip3 preferred over pip)
 * @returns {string|null} - pip command name or null
 */
function findPipCommand() {
  if (exec('which pip3 2>/dev/null')) return 'pip3';
  if (exec('which pip 2>/dev/null')) return 'pip';
  return null;
}

/**
 * Resolve the pip package name for a command
 * @param {string} name - Command name
 * @param {string} pipCmd - pip command to use (pip or pip3)
 * @param {string} venvPath - Optional venv path to use pip from
 * @returns {string} - Resolved package name
 */
function resolvePackageName(name, pipCmd, venvPath = null) {
  let directShow;
  if (venvPath) {
    const venvPip = venvPath.replace(/\/bin\/[^/]+$/, '/bin/pip');
    directShow = exec(`${venvPip} show ${name} 2>/dev/null`);
  } else {
    directShow =
      exec(`${pipCmd} show ${name} 2>/dev/null`) || exec(`pip show ${name} 2>/dev/null`);
  }
  if (directShow) return name;

  return findPackageByEntryPoint(name, pipCmd, venvPath) || name;
}

/**
 * Search dist-info RECORD files to find which package provides a command
 * @param {string} name - Command name
 * @param {string} pipCmd - pip command to use
 * @param {string} venvPath - Optional venv path to use pip from
 * @returns {string|null} - Package name or null
 */
function findPackageByEntryPoint(name, pipCmd, venvPath = null) {
  const pipVersion = venvPath
    ? exec(`${venvPath.replace(/\/bin\/[^/]+$/, '/bin/pip')} --version 2>/dev/null`)
    : (exec(`${pipCmd} --version 2>/dev/null`) || exec('pip --version 2>/dev/null'));
  if (!pipVersion) return null;

  const match = pipVersion.match(/from (.+?) \(/);
  if (!match) return null;

  const distInfoDir = path.dirname(match[1]);

  try {
    if (!fs.existsSync(distInfoDir)) return null;

    const entries = fs.readdirSync(distInfoDir);
    const binPath = name.includes('/') ? name : `bin/${name}`;

    for (const entry of entries) {
      if (!entry.endsWith('.dist-info')) continue;

      const recordPath = path.join(distInfoDir, entry, 'RECORD');
      if (!fs.existsSync(recordPath)) continue;

      const record = fs.readFileSync(recordPath, 'utf-8');
      if (record.includes(binPath) || record.includes(name)) {
        return entry.split('-')[0];
      }
    }
  } catch {
    // Fallback to command name
  }

  return null;
}
