/**
 * Output formatter for which-where
 */

import colors from 'ansi-colors';

/**
 * Print analysis report
 * @param {Object} result - Analysis result
 * @param {boolean} verbose - Enable verbose output
 * @param {boolean} porcelain - Enable porcelain mode (machine-readable)
 */
export function printReport(result, verbose = false, porcelain = false) {
  if (porcelain) {
    printReportPorcelain(result, verbose);
    return;
  }

  let output = `
${colors.bold('📊 Analysis Report')}
  ${colors.cyan('Source:')} ${result.type}
  ${colors.cyan('Package:')} ${result.name}
  ${colors.cyan('Path:')} ${result.realPath || result.path}
`;

  // Show symlink info if this is a symbolic link
  if (result.realPath && result.realPath !== result.path) {
    output += `  ${colors.gray(`Symlink: ${result.path}`)}\n`;
  }

  // Show reason if present (explains confidence/uncertainty)
  if (result.reason) {
    output += `  ${colors.gray(`Reason: ${result.reason}`)}\n`;
  }

  output += `
${colors.bold('📦 Management Commands:')}
`;

  // Only show commands that have values (not null/undefined)
  if (result.install) {
    output += `  ${colors.green('Install:')}    ${result.install}\n`;
  }
  if (result.uninstall) {
    output += `  ${colors.red('Uninstall:')}  ${result.uninstall}\n`;
  }
  if (result.update) {
    output += `  ${colors.yellow('Update:')}     ${result.update}\n`;
  }
  if (result.info) {
    output += `  ${colors.magenta('Info:')}       ${result.info}\n`;
  }

  if (verbose) {
    output += printVerboseDetails(result);
  }

  console.log(output);
}

/**
 * Print verbose details
 * @param {Object} result - Analysis result
 */
function printVerboseDetails(result) {
  const lines = [`${colors.bold('🔬 Verbose Details:')}`];

  if (result.shimDetails) {
    lines.push(`  ${colors.cyan('Shim Manager:')} ${result.shimDetails.manager}`);
    lines.push(`  ${colors.cyan('Actual Manager:')} ${result.shimDetails.actualManager}`);
    if (result.shimDetails.formula) {
      lines.push(`  ${colors.cyan('Formula:')} ${result.shimDetails.formula}`);
    }
    if (result.shimDetails.version) {
      lines.push(`  ${colors.cyan('Version:')} ${result.shimDetails.version}`);
    }
  }

  if (result.realPath && result.realPath !== result.path) {
    lines.push(`  ${colors.cyan('Real Path:')} ${result.realPath}`);
  }

  if (result.fileType) {
    lines.push(`  ${colors.cyan('File Type:')} ${result.fileType}`);
  }

  if (result.target) {
    lines.push(`  ${colors.cyan('Interpreter:')} ${result.target}`);
  }

  if (result.fileSize) {
    lines.push(`  ${colors.cyan('File Size:')} ${formatFileSize(result.fileSize)}`);
  }

  return lines.join('\n') + '\n';
}

/**
 * Format file size in human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
function formatFileSize(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}

/**
 * Print analysis report in porcelain mode (machine-readable key=value format)
 * @param {Object} result - Analysis result
 * @param {boolean} verbose - Include verbose details
 */
export function printReportPorcelain(result, verbose = false) {
  const lines = [
    `type=${result.type}`,
    `name=${result.name}`,
    `path=${result.path}`,
    `install=${result.install || ''}`,
    `uninstall=${result.uninstall || ''}`,
    `update=${result.update || ''}`,
    `info=${result.info || ''}`,
  ];

  if (result.reason) {
    lines.push(`reason=${result.reason}`);
  }

  if (verbose) {
    if (result.shimDetails) {
      lines.push(`shim_manager=${result.shimDetails.manager}`);
      lines.push(`actual_manager=${result.shimDetails.actualManager}`);
      if (result.shimDetails.formula) {
        lines.push(`formula=${result.shimDetails.formula}`);
      }
      if (result.shimDetails.version) {
        lines.push(`version=${result.shimDetails.version}`);
      }
    }
    if (result.realPath && result.realPath !== result.path) {
      lines.push(`real_path=${result.realPath}`);
    }
    if (result.fileType) {
      lines.push(`file_type=${result.fileType}`);
    }
    if (result.target) {
      lines.push(`target=${result.target}`);
    }
    if (result.fileSize) {
      lines.push(`file_size=${result.fileSize}`);
    }
  }

  console.log(lines.join('\n'));
}

/**
 * Print analysis report as JSON
 * @param {Object} result - Analysis result
 * @param {boolean} verbose - Include verbose details
 */
export function printReportJson(result, verbose = false) {
  if (verbose) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const verboseKeys = new Set(['shimDetails', 'realPath', 'fileType', 'target', 'fileSize']);
  const basic = Object.fromEntries(Object.entries(result).filter(([key]) => !verboseKeys.has(key)));
  console.log(JSON.stringify(basic, null, 2));
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
 * Print command not found error in porcelain mode
 * @param {string} cmd - Command name
 */
export function printNotFoundPorcelain(cmd) {
  console.log(`error=not_found`);
  console.log(`command=${cmd}`);
  console.log(`message=Command '${cmd}' not found in PATH`);
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
