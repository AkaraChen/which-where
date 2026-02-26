#!/usr/bin/env node

/**
 * which-where - Analyze where a command comes from and how to manage it
 */

import colors from 'ansi-colors';
import meow from 'meow';
import { analyzeCommand } from './src/analyzer.js';
import {
  printReport,
  printReportJson,
  printNotFound,
  printNotFoundJson,
  printAnalyzing
} from './src/output.js';

const cli = meow(
  `
${colors.bold('Which-Where')} - Analyze command origins and management

${colors.cyan('Usage:')}
  ${colors.green('node index.js [options] <command>')}        Analyze a command
  ${colors.green('node index.js [options] <cmd1> <cmd2>')}    Analyze multiple commands

${colors.cyan('Options:')}
  ${colors.green('--json')}     Output results in JSON format
  ${colors.green('--verbose')}  Show detailed analysis (shim info, file type, real path)
  ${colors.green('-v')}         Shorthand for --verbose

${colors.cyan('Examples:')}
  node index.js node          Analyze where 'node' comes from
  node index.js npm           Analyze where 'npm' comes from
  node index.js cargo         Analyze where 'cargo' comes from
  node index.js --json node   Output analysis as JSON
  node index.js -v node       Show detailed analysis including shim info

${colors.cyan('Supported package managers:')}
  • Homebrew (macOS)
  • npm (Node.js)
  • yarn (Node.js)
  • pnpm (Node.js)
  • Bun
  • Cargo (Rust)
  • Go modules
  • pip (Python)
  • nvm/fnm/volta (Node.js version managers)
  • System packages (apt, pacman, dnf, pkgutil)

${colors.cyan('Shim detection:')}
  • fnm shims (Fast Node Manager)
  • nvm wrappers
  • Volta shims
  • asdf shims
  • rbenv shims
  • pyenv shims
  • SDKMAN! shims
  • mise/rtx shims
`,
  {
    importMeta: import.meta,
    flags: {
      json: {
        type: 'boolean',
        shortFlag: 'j'
      },
      verbose: {
        type: 'boolean',
        shortFlag: 'v'
      }
    }
  }
);

/**
 * Main entry point
 */
function main() {
  const { input, flags } = cli;
  const { json, verbose } = flags;

  if (input.length === 0) {
    cli.showHelp();
  }

  let foundCount = 0;

  for (const cmd of input) {
    if (!json) {
      printAnalyzing(cmd);
    }

    const result = analyzeCommand(cmd, verbose);

    if (!result) {
      if (json) {
        printNotFoundJson(cmd);
      } else {
        printNotFound(cmd);
      }
      continue;
    }

    if (json) {
      printReportJson(result, verbose);
    } else {
      printReport(result, verbose);
    }

    foundCount++;
  }

  if (json && foundCount === 0) {
    process.exit(1);
  }
}

main();
