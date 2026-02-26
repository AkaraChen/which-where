/**
 * macOS App Bundle analyzer
 */

import { exec } from '../utils.js';

/**
 * Check if a command comes from a macOS app bundle (.app)
 * @param {string} name - Command name
 * @param {string} cmdPath - Full path to the command
 * @returns {Object|null} - Analysis result or null
 */
export function checkApp(name, cmdPath) {
  // Detect macOS app bundle paths like:
  // /Applications/Docker.app/Contents/Resources/bin/docker
  const appMatch = cmdPath.match(/\/([^/]+)\.app\//);
  if (!appMatch) {
    return null;
  }

  const appBundleName = appMatch[1];

  // Try to get the app's display name using macOS native mdls command
  const appPathEnd = cmdPath.indexOf('.app/') + 5;
  const appPath = cmdPath.substring(0, appPathEnd);
  let displayName = appBundleName;

  try {
    const mdlsResult = exec(`mdls -name kMDItemDisplayName "${appPath}" 2>/dev/null | cut -d'=' -f2 | tr -d '"'`);
    // Only use result if it's not an error message and not empty
    if (mdlsResult && mdlsResult.trim() && !mdlsResult.includes('could not find')) {
      displayName = mdlsResult.trim();
    }
  } catch {
    // Fallback to bundle name if mdls fails
  }

  return {
    type: 'macOS App Bundle',
    name: name,
    path: cmdPath,
    appBundle: displayName,
    install: `Copy .app to /Applications/`,
    reinstall: 'Reinstall the application',
    uninstall: `rm -rf /Applications/${appBundleName}.app`,
    update: 'Check for updates in the app or via App Store',
    info: `mdls "${appPath}"`,
    reason: `Found in ${appBundleName}.app bundle`
  };
}
