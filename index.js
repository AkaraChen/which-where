#!/usr/bin/env node

/**
 * which-where - Analyze where a command comes from and how to manage it
 */

const colors = require('ansi-colors');
const { analyzeCommand } = require('./src/analyzer');
const { printReport, printNotFound, printAnalyzing } = require('./src/output');

/**
 * Print usage information
 */
function printUsage() {
  console.log(`
${colors.bold('Which-Where')} - Analyze command origins and management

${colors.cyan('Usage:')}
  ${colors.green('node index.js <command>')}        Analyze a command
  ${colors.green('node index.js which node')}       Analyze multiple commands

${colors.cyan('Examples:')}
  node index.js node          Analyze where 'node' comes from
  node index.js npm           Analyze where 'npm' comes from
  node index.js cargo         Analyze where 'cargo' comes from

${colors.cyan('Supported package managers:')}
  • Homebrew (macOS)
  • npm (Node.js)
  • yarn (Node.js)
  • pnpm (Node.js)
  • Cargo (Rust)
  • Go modules
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

  for (const cmd of args) {
    printAnalyzing(cmd);

    const result = analyzeCommand(cmd);

    if (!result) {
      printNotFound(cmd);
      continue;
    }

    printReport(result);
  }
}

main();
