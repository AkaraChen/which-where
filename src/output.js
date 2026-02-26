/**
 * Output formatter for which-where
 */

import colors from 'ansi-colors';

/**
 * Print analysis report
 * @param {Object} result - Analysis result
 */
export function printReport(result) {
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
 * Print analysis report as JSON
 * @param {Object} result - Analysis result
 */
export function printReportJson(result) {
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Print command not found error
 * @param {string} cmd - Command name
 */
export function printNotFound(cmd) {
  console.log(`
${colors.red(`❌ Command '${cmd}' not found in PATH`)}
${colors.yellow('Hint: The command might not be installed or might not be in your PATH')}
`);
}

/**
 * Print command not found error as JSON
 * @param {string} cmd - Command name
 */
export function printNotFoundJson(cmd) {
  console.log(
    JSON.stringify(
      { error: 'not_found', command: cmd, message: `Command '${cmd}' not found in PATH` },
      null,
      2
    )
  );
}

/**
 * Print analyzing message
 * @param {string} cmd - Command name
 */
export function printAnalyzing(cmd) {
  console.log(colors.bold(`🔍 Analyzing command: ${cmd}`));
}
