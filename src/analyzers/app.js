/**
 * macOS App Bundle analyzer
 */

import fs from 'fs';
import { exec } from '../utils.js';

/**
 * Check if a command comes from a macOS app bundle (.app)
 * @param {string} name - Command name
 * @param {string} cmdPath - Full path to the command
 * @returns {Object|null} - Analysis result or null
 */
export function checkApp(name, cmdPath) {
  // Resolve symlinks to get the real path
  let realPath = cmdPath;
  try {
    if (fs.lstatSync(cmdPath).isSymbolicLink()) {
      realPath = fs.realpathSync(cmdPath);
    }
  } catch {
    // Cannot stat file, continue with original path
  }

  // Detect macOS app bundle paths like:
  // /Applications/Docker.app/Contents/Resources/bin/docker
  const appMatch = realPath.match(/\/([^/]+)\.app\//);
  if (!appMatch) {
    return null;
  }

  const appBundleName = appMatch[1];

  // Try to get the app's display name using macOS native mdls command
  const appPathEnd = realPath.indexOf('.app/') + 5;
  const appPath = realPath.substring(0, appPathEnd);
  let displayName = appBundleName;

  try {
    const mdlsResult = exec('mdls', ['-name', 'kMDItemDisplayName', appPath]);
    // Only use result if it's not an error message and not empty
    if (mdlsResult && mdlsResult.trim() && !mdlsResult.includes('could not find')) {
      // Parse the output: "kMDItemDisplayName = "Docker"" -> "Docker"
      const match = mdlsResult.match(/=\s*"?(.+?)"?\s*$/);
      displayName = match ? match[1].replace(/"$/, '') : mdlsResult.trim();
    }
  } catch {
    // Fallback to bundle name if mdls fails
  }

  return {
    type: 'macOS App Bundle',
    name: name,
    path: cmdPath,
    realPath: realPath,
    appBundle: displayName,
    install: 'Copy .app to /Applications/',
    reinstall: 'Reinstall the application',
    uninstall: `rm -rf /Applications/${appBundleName}.app`,
    update: 'Check for updates in the app or via App Store',
    info: `mdls "${appPath}"`,
    reason: `Found in ${appBundleName}.app bundle`
  };
}
