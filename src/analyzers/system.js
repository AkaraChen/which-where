/**
 * System package analyzer
 */

import { exec } from '../utils.js';

/**
 * Check if a command is a system command
 * @param {string} name - Command name
 * @param {string} cmdPath - Full path to the command
 * @returns {Object|null} - Analysis result or null
 */
export function checkSystem(name, cmdPath) {
  const systemPaths = ['/usr/bin', '/bin', '/usr/sbin', '/sbin'];

  const isSystemPath = systemPaths.some(p => cmdPath.startsWith(p));
  if (!isSystemPath) return null;

  // macOS: pkgutil
  if (exec('which pkgutil')) {
    const pkgInfo = exec(`pkgutil -f ${cmdPath} 2>/dev/null`);
    if (pkgInfo) {
      const packageName = pkgInfo.split('\n')[0];
      return {
        type: 'pkgutil (macOS)',
        name: packageName,
        path: cmdPath,
        install: 'System installation or reinstall via macOS installer',
        uninstall: `pkgutil --only-package --forget ${packageName}`,
        update: 'macOS system update',
        info: `pkgutil --pkg-info ${packageName}`,
        reason: 'Found via macOS pkgutil'
      };
    }
  }

  // Linux: apt/dpkg
  if (exec('which dpkg')) {
    const pkg = exec(`dpkg -S ${cmdPath} 2>/dev/null`);
    if (pkg && !pkg.includes('no path found')) {
      const packageName = pkg.split(':')[0];
      return {
        type: 'apt/dpkg',
        name: packageName,
        path: cmdPath,
        install: `sudo apt install ${packageName}`,
        uninstall: `sudo apt remove ${packageName}`,
        update: `sudo apt update && sudo apt install --only-upgrade ${packageName}`,
        info: `apt show ${packageName}`,
        reason: 'Found via apt/dpkg package manager'
      };
    }
  }

  // Linux: pacman
  if (exec('which pacman')) {
    const pkg = exec(`pacman -Qo ${cmdPath} 2>/dev/null`);
    if (pkg) {
      const packageName = pkg.split(' ')[0];
      return {
        type: 'pacman',
        name: packageName,
        path: cmdPath,
        install: `sudo pacman -S ${packageName}`,
        uninstall: `sudo pacman -R ${packageName}`,
        update: `sudo pacman -Syu ${packageName}`,
        info: `pacman -Si ${packageName}`,
        reason: 'Found via pacman package manager'
      };
    }
  }

  // Linux: dnf/rpm
  if (exec('which dnf')) {
    const pkg = exec(`dnf provide ${cmdPath} 2>/dev/null`);
    if (pkg) {
      const match = pkg.match(/^(.*?)\s+:/);
      if (match) {
        const packageName = match[1];
        return {
          type: 'dnf/rpm',
          name: packageName,
          path: cmdPath,
          install: `sudo dnf install ${packageName}`,
          uninstall: `sudo dnf remove ${packageName}`,
          update: `sudo dnf upgrade ${packageName}`,
          info: `dnf info ${packageName}`,
          reason: 'Found via dnf/rpm package manager'
        };
      }
    }
  }

  // Fallback when no package manager claims the command
  return {
    type: 'System (unknown package)',
    name: name,
    path: cmdPath,
    install: 'System package manager or manual installation',
    reinstall: 'Reinstall via system package manager',
    uninstall: 'Unknown (check system documentation)',
    update: 'System update or manual reinstallation',
    info: `file ${cmdPath}`,
    reason: 'Command found in system path but package manager could not be determined'
  };
}
