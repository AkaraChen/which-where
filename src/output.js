/**
 * Output formatter for which-where
 */

const colors = require('ansi-colors');

/**
 * Print analysis report
 * @param {Object} result - Analysis result
 */
function printReport(result) {
  console.log(`
${colors.bold('📊 Analysis Report')}
  ${colors.cyan('Source:')} ${result.type}
  ${colors.cyan('Package:')} ${result.name}
  ${colors.cyan('Path:')} ${result.path}

${colors.bold('📦 Management Commands:')}
  ${colors.green('Install:')}    ${result.install}
  ${colors.red('Uninstall:')}  ${result.uninstall}
  ${colors.yellow('Update:')}     ${result.update}
  ${colors.magenta('Info:')}       ${result.info}
`);
}

/**
 * Print command not found error
 * @param {string} cmd - Command name
 */
function printNotFound(cmd) {
  console.log(`
${colors.red(`❌ Command '${cmd}' not found in PATH`)}
${colors.yellow('Hint: The command might not be installed or might not be in your PATH')}
`);
}

/**
 * Print analyzing message
 * @param {string} cmd - Command name
 */
function printAnalyzing(cmd) {
  console.log(colors.bold(`🔍 Analyzing command: ${cmd}`));
}

module.exports = {
  printReport,
  printNotFound,
  printAnalyzing
};
