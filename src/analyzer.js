/**
 * Command analyzer - main logic for analyzing commands
 */

import { exec } from './utils.js';
import * as analyzers from './analyzers/index.js';

/**
 * Analyze a command to find its source and management commands
 * @param {string} name - Command name
 * @returns {Object|null} - Analysis result or null
 */
export function analyzeCommand(name) {
  const cmdPath = exec(`which ${name}`);

  if (!cmdPath) {
    return null;
  }

  // Run analyzers in order - version managers first, then package managers
  const analyzerOrder = [
    analyzers.checkNvm, // Node.js version managers (nvm, fnm, volta)
    analyzers.checkBrew, // Homebrew (checked early for macOS)
    analyzers.checkCargo, // Rust/Cargo
    analyzers.checkGo, // Go modules
    analyzers.checkPnpm, // pnpm
    analyzers.checkYarn, // yarn
    analyzers.checkNpm, // npm
    analyzers.checkPip, // Python pip
    analyzers.checkSystem // System packages (apt, pacman, dnf, pkgutil)
  ];

  for (const analyzer of analyzerOrder) {
    const result = analyzer(name, cmdPath);
    if (result) {
      return result;
    }
  }

  // Fallback if no analyzer matched
  return {
    type: 'Unknown',
    name: name,
    path: cmdPath,
    install: 'Manual installation or unknown source',
    uninstall: `rm ${cmdPath}`,
    update: 'N/A',
    info: `file ${cmdPath}`
  };
}
