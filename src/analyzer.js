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

  const result = detectShim(name, cmdPath) || runAnalyzers(name, cmdPath);

  if (!result) {
    return null;
  }

  return verbose ? enrichWithVerboseData(result, cmdPath) : result;
}

/**
 * Run analyzers in priority order, returning fallback if none match
 * @param {string} name - Command name
 * @param {string} cmdPath - Full path to the command
 * @returns {Object} - Analysis result (always returns, uses fallback)
 */
function runAnalyzers(name, cmdPath) {
  const analyzerOrder = [
    analyzers.checkNvm,
    analyzers.checkBun,
    analyzers.checkBrew,
    analyzers.checkCargo,
    analyzers.checkGo,
    analyzers.checkPnpm,
    analyzers.checkYarn,
    analyzers.checkBrewNpm,
    analyzers.checkNpm,
    analyzers.checkPip,
    analyzers.checkSystem
  ];

  for (const analyzer of analyzerOrder) {
    const result = analyzer(name, cmdPath);
    if (result) {
      return result;
    }
  }

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

/**
 * Enrich result with verbose data (file type, real path, etc.)
 * @param {Object} result - Analysis result
 * @param {string} cmdPath - Command path
 * @returns {Object} - Enriched result
 */
function enrichWithVerboseData(result, cmdPath) {
  addSymlinkInfo(result, cmdPath);
  addFileSize(result, cmdPath);
  addShebangInfo(result, cmdPath);
  return result;
}

/**
 * Add symlink and Homebrew Cellar details to the result
 */
function addSymlinkInfo(result, cmdPath) {
  try {
    if (!fs.lstatSync(cmdPath).isSymbolicLink()) {
      result.fileType = 'file';
      return;
    }

    result.realPath = fs.realpathSync(cmdPath);
    result.fileType = 'symbolic link';

    const cellarMatch = result.realPath.match(/\/Cellar\/([^/]+)\/([^/]+)/);
    if (cellarMatch) {
      result.shimDetails = {
        manager: 'Homebrew',
        formula: cellarMatch[1],
        version: cellarMatch[2],
        actualManager: 'Homebrew'
      };
      if (!result.type.includes('shim')) {
        result.type = `Homebrew shim -> ${cellarMatch[1]}`;
      }
    }
  } catch {
    result.fileType = 'unknown';
  }
}

/**
 * Add file size to the result
 */
function addFileSize(result, cmdPath) {
  try {
    result.fileSize = fs.statSync(cmdPath).size;
  } catch {
    // Cannot stat file
  }
}

/**
 * Add shebang/interpreter info to the result
 */
function addShebangInfo(result, cmdPath) {
  try {
    const content = fs.readFileSync(cmdPath, 'utf-8');
    if (content.startsWith('#!')) {
      result.target = content.split('\n')[0];
    }
  } catch {
    // Binary or unreadable
  }
}
