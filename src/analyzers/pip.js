/**
 * Pip/Python package analyzer
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Check if a command is installed via pip
 * @param {string} name - Command name
 * @param {string} cmdPath - Full path to the command
 * @returns {Object|null} - Analysis result or null
 */
export function checkPip(name, cmdPath) {
  // Check if pip is available
  const pipPath = exec('which pip3 2>/dev/null') || exec('which pip 2>/dev/null');
  if (!pipPath) return null;

  // Check if the command path is under a Python site-packages or bin directory
  const isPythonPath =
    cmdPath.includes('site-packages') ||
    cmdPath.includes('.venv') ||
    cmdPath.includes('virtualenv') ||
    cmdPath.includes('.pyenv') ||
    (cmdPath.includes('bin') && cmdPath.includes('python'));

  if (!isPythonPath) return null;

  // Try to find the package name using pip show
  // First try with the command name itself
  let packageName = name;
  let pipShowOutput = exec(`pip3 show ${name} 2>/dev/null`) || exec(`pip show ${name} 2>/dev/null`);

  if (!pipShowOutput) {
    // Try to find by entry point - read pip's record files
    const pipPrefix = exec('pip3 --version 2>/dev/null') || exec('pip --version 2>/dev/null');
    if (pipPrefix) {
      // Extract site-packages path from pip version output
      const match = pipPrefix.match(/from (.+?) \(/);
      if (match) {
        const sitePackages = match[1];
        // Check for dist-info directories
        try {
          const distInfoDir = path.dirname(sitePackages);
          if (fs.existsSync(distInfoDir)) {
            const entries = fs.readdirSync(distInfoDir);
            for (const entry of entries) {
              if (entry.endsWith('.dist-info')) {
                const pkgName = entry.split('-')[0];
                const recordPath = path.join(distInfoDir, entry, 'RECORD');
                if (fs.existsSync(recordPath)) {
                  const record = fs.readFileSync(recordPath, 'utf-8');
                  const binPath = name.includes('/') ? name : `bin/${name}`;
                  if (record.includes(binPath) || record.includes(name)) {
                    packageName = pkgName;
                    break;
                  }
                }
              }
            }
          }
        } catch {
          // Fallback to command name
        }
      }
    }
  }

  // Verify package exists
  const verifyShow =
    exec(`pip3 show ${packageName} 2>/dev/null`) || exec(`pip show ${packageName} 2>/dev/null`);
  if (verifyShow) {
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

  // Don't return a result if we can't verify the package
  // This prevents false positives for Python path commands that aren't pip-installed
  return null;
}

function exec(command) {
  try {
    return execSync(command, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    return null;
  }
}
