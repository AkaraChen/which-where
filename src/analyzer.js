/**
 * Command analyzer - main logic for analyzing commands
 */

const { exec } = require('./utils');
const analyzers = require('./analyzers');

/**
 * Analyze a command to find its source and management commands
 * @param {string} name - Command name
 * @returns {Object|null} - Analysis result or null
 */
function analyzeCommand(name) {
  const cmdPath = exec(`which ${name}`);

  if (!cmdPath) {
    return null;
  }

  // Run analyzers in order
  const analyzerOrder = [
    analyzers.checkBrew,
    analyzers.checkCargo,
    analyzers.checkGo,
    analyzers.checkPnpm,
    analyzers.checkYarn,
    analyzers.checkNpm,
    analyzers.checkSystem
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

module.exports = { analyzeCommand };
