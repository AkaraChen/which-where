#!/usr/bin/env node

/**
 * which-where - Analyze where a command comes from and how to manage it
 */

import colors from 'ansi-colors';
import { analyzeCommand } from './src/analyzer.js';
import {
  printReport,
  printReportJson,
  printNotFound,
  printNotFoundJson,
  printAnalyzing
} from './src/output.js';

/**
 * Print usage information
 */
function printUsage() {
  console.log(`
${colors.bold('Which-Where')} - Analyze command origins and management

${colors.cyan('Usage:')}
  ${colors.green('node index.js [options] <command>')}        Analyze a command
  ${colors.green('node index.js [options] <cmd1> <cmd2>')}    Analyze multiple commands

${colors.cyan('Options:')}
  ${colors.green('--json')}    Output results in JSON format

${colors.cyan('Examples:')}
  node index.js node          Analyze where 'node' comes from
  node index.js npm           Analyze where 'npm' comes from
  node index.js cargo         Analyze where 'cargo' comes from
  node index.js --json node   Output analysis as JSON

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
`);
}

/**
 * Main entry point
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    printUsage();
    process.exit(0);
  }

  // Parse options
  const jsonOutput = args.includes('--json');
  const commands = args.filter(arg => !arg.startsWith('--'));

  if (commands.length === 0) {
    printUsage();
    process.exit(0);
  }

  const results = [];

  for (const cmd of commands) {
    if (!jsonOutput) {
      printAnalyzing(cmd);
    }

    const result = analyzeCommand(cmd);

    if (!result) {
      if (jsonOutput) {
        printNotFoundJson(cmd);
      } else {
        printNotFound(cmd);
      }
      continue;
    }

    if (jsonOutput) {
      printReportJson(result);
    } else {
      printReport(result);
    }

    results.push(result);
  }

  // Exit with error code if no results in JSON mode
  if (jsonOutput && results.length === 0) {
    process.exit(1);
  }
}

main();
