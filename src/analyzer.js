/**
 * Command analyzer - main logic for analyzing commands
 */

import fs from 'fs';
import { exec } from './utils.js';
import * as analyzers from './analyzers/index.js';
import { detectShim } from './analyzers/shim.js';

/**
 * Analyze a command to find its source and management commands
 * @param {string} name - Command name
 * @param {boolean} verbose - Enable verbose output (adds extra details)
 * @returns {Object|null} - Analysis result or null
 */
export function analyzeCommand(name, verbose = false) {
  const cmdPath = exec(`which ${name}`);

  if (!cmdPath) {
    return null;
  }

  // First check for shims - version managers create shims that wrap actual package managers
  const shimResult = detectShim(name, cmdPath);
  if (shimResult) {
    return verbose ? enrichWithVerboseData(shimResult, cmdPath) : shimResult;
  }

  // Run analyzers in order - version managers first, then package managers
  const analyzerOrder = [
    analyzers.checkNvm, // Node.js version managers (nvm, fnm, volta)
    analyzers.checkBun, // Bun package manager
    analyzers.checkBrew, // Homebrew (checked early for macOS)
    analyzers.checkCargo, // Rust/Cargo
    analyzers.checkGo, // Go modules
    analyzers.checkPnpm, // pnpm
    analyzers.checkYarn, // yarn
    analyzers.checkBrewNpm, // npm via Homebrew Node.js
    analyzers.checkNpm, // npm
    analyzers.checkPip, // Python pip
    analyzers.checkSystem // System packages (apt, pacman, dnf, pkgutil)
  ];

  for (const analyzer of analyzerOrder) {
    const result = analyzer(name, cmdPath);

    if (result) {
      // Got a valid result
      return verbose ? enrichWithVerboseData(result, cmdPath) : result;
    }
  }

  // If we got a pass-through but no final result, return the original fallback
  const fallback = {
    type: 'Unknown',
    name: name,
    path: cmdPath,
    install: 'Manual installation or unknown source',
    uninstall: `rm ${cmdPath}`,
    update: 'N/A',
    info: `file ${cmdPath}`
  };

  return verbose ? enrichWithVerboseData(fallback, cmdPath) : fallback;
}

/**
 * Enrich result with verbose data (file type, real path, etc.)
 * @param {Object} result - Analysis result
 * @param {string} cmdPath - Command path
 * @returns {Object} - Enriched result
 */
function enrichWithVerboseData(result, cmdPath) {
  // Check if it's a symlink and get real path
  try {
    if (fs.lstatSync(cmdPath).isSymbolicLink()) {
      result.realPath = fs.realpathSync(cmdPath);
      result.fileType = 'symbolic link';

      // Extract shim info from real path
      if (result.realPath.includes('/Cellar/')) {
        const cellarMatch = result.realPath.match(/\/Cellar\/([^/]+)\/([^/]+)/);
        if (cellarMatch) {
          result.shimDetails = {
            manager: 'Homebrew',
            formula: cellarMatch[1],
            version: cellarMatch[2],
            actualManager: 'Homebrew'
          };
          // Update type to show it's a homebrew shim
          if (!result.type.includes('shim')) {
            result.type = `Homebrew shim -> ${cellarMatch[1]}`;
          }
        }
      }
    } else {
      result.fileType = 'file';
    }
  } catch {
    result.fileType = 'unknown';
  }

  // Get file size
  try {
    const stats = fs.statSync(cmdPath);
    result.fileSize = stats.size;
  } catch {
    // Can't stat
  }

  // Check if it's a script (shebang)
  try {
    const content = fs.readFileSync(cmdPath, 'utf-8');
    if (content.startsWith('#!')) {
      const shebangLine = content.split('\n')[0];
      result.target = shebangLine;
    }
  } catch {
    // Binary or can't read
  }

  return result;
}
