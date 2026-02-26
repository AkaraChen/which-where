/**
 * System package analyzer
 */

const { exec } = require('../utils');

/**
 * Check if a command is a system command
 * @param {string} name - Command name
 * @param {string} cmdPath - Full path to the command
 * @returns {Object|null} - Analysis result or null
 */
function checkSystem(name, cmdPath) {
  const systemPaths = ['/usr/bin', '/bin', '/usr/sbin', '/sbin'];

  const isSystemPath = systemPaths.some(p => cmdPath.startsWith(p));
  if (!isSystemPath) return null;

  let packageManager = 'System';
  let packageName = 'unknown';
  let installCmd = `Manual installation`;
  let uninstallCmd = `sudo rm ${cmdPath}`;
  let updateCmd = 'System dependent';
  let infoCmd = `file ${cmdPath}`;

  // macOS: Check for pkgutil
  if (exec('which pkgutil')) {
    const pkgInfo = exec(`pkgutil -f ${cmdPath} 2>/dev/null`);
    if (pkgInfo) {
      packageName = pkgInfo.split('\n')[0];
      packageManager = 'pkgutil (macOS)';
      installCmd = 'System installation or reinstall via macOS installer';
      uninstallCmd = `pkgutil --only-package --forget ${packageName}`;
      updateCmd = 'macOS system update';
      infoCmd = `pkgutil --pkg-info ${packageName}`;
    }
  }

  // Linux: Check for apt/dpkg
  if (exec('which dpkg')) {
    const pkg = exec(`dpkg -S ${cmdPath} 2>/dev/null`);
    if (pkg && !pkg.includes('no path found')) {
      packageManager = 'apt/dpkg';
      packageName = pkg.split(':')[0];
      installCmd = `sudo apt install ${packageName}`;
      uninstallCmd = `sudo apt remove ${packageName}`;
      updateCmd = `sudo apt update && sudo apt install --only-upgrade ${packageName}`;
      infoCmd = `apt show ${packageName}`;
    }
  }

  // Linux: Check for pacman
  if (exec('which pacman')) {
    const pkg = exec(`pacman -Qo ${cmdPath} 2>/dev/null`);
    if (pkg) {
      packageManager = 'pacman';
      packageName = pkg.split(' ')[0];
      installCmd = `sudo pacman -S ${packageName}`;
      uninstallCmd = `sudo pacman -R ${packageName}`;
      updateCmd = `sudo pacman -Syu ${packageName}`;
      infoCmd = `pacman -Si ${packageName}`;
    }
  }

  // Linux: Check for dnf/rpm
  if (exec('which dnf')) {
    const pkg = exec(`dnf provides ${cmdPath} 2>/dev/null`);
    if (pkg) {
      const match = pkg.match(/^(.*?)\s+:/);
      if (match) {
        packageManager = 'dnf/rpm';
        packageName = match[1];
        installCmd = `sudo dnf install ${packageName}`;
        uninstallCmd = `sudo dnf remove ${packageName}`;
        updateCmd = `sudo dnf upgrade ${packageName}`;
        infoCmd = `dnf info ${packageName}`;
      }
    }
  }

  return {
    type: packageManager,
    name: packageName,
    path: cmdPath,
    install: installCmd,
    uninstall: uninstallCmd,
    update: updateCmd,
    info: infoCmd
  };
}

module.exports = { checkSystem };
