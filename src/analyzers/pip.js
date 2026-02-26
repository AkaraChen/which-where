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

  const isPythonPath =
    cmdPath.includes('site-packages') ||
    cmdPath.includes('.venv') ||
    cmdPath.includes('virtualenv') ||
    cmdPath.includes('.pyenv') ||
    (cmdPath.includes('bin') && cmdPath.includes('python'));

  if (!isPythonPath) return null;

  const packageName = resolvePackageName(name, pipCmd);

  const verified =
    exec(`${pipCmd} show ${packageName} 2>/dev/null`) ||
    exec(`pip show ${packageName} 2>/dev/null`);

  if (!verified) return null;

  return {
    type: 'pip',
    name: packageName,
    path: cmdPath,
    install: `pip install ${packageName}`,
    reinstall: `pip install --force-reinstall ${packageName}`,
    uninstall: `pip uninstall ${packageName}`,
    update: `pip install --upgrade ${packageName}`,
    info: `pip show ${packageName}`
  };
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
 * @returns {string} - Resolved package name
 */
function resolvePackageName(name, pipCmd) {
  const directShow =
    exec(`${pipCmd} show ${name} 2>/dev/null`) || exec(`pip show ${name} 2>/dev/null`);
  if (directShow) return name;

  return findPackageByEntryPoint(name, pipCmd) || name;
}

/**
 * Search dist-info RECORD files to find which package provides a command
 * @param {string} name - Command name
 * @param {string} pipCmd - pip command to use
 * @returns {string|null} - Package name or null
 */
function findPackageByEntryPoint(name, pipCmd) {
  const pipVersion = exec(`${pipCmd} --version 2>/dev/null`) || exec('pip --version 2>/dev/null');
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
