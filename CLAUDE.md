# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Run program
node index.js <command>

# Run tests
npm test

# Run single test file
npx ava src/analyzer.test.js
```

## Architecture

**Entry point:** `index.js` - CLI handler that parses args and orchestrates analysis

**Core modules:**
- `src/analyzer.js` - Main analysis logic; runs package manager checkers in priority order
- `src/output.js` - Colorized console output formatter
- `src/utils.js` - Shell command execution wrapper (`execSync` with error handling)

**Analyzer modules** (`src/analyzers/`): Each exports a `checkX(name, path)` function that returns analysis result or null:
- `brew.js` - Homebrew (checked first)
- `cargo.js` - Rust/Cargo
- `go.js` - Go modules
- `pnpm.js`, `yarn.js`, `npm.js` - Node.js package managers
- `system.js` - System packages (apt, pacman, dnf, pkgutil)

**Analysis flow:** `which <cmd>` → path → analyzers in order → first match returns `{type, name, path, install, uninstall, update, info}`

**Test structure:** Co-located `*.test.js` files using AVA framework next to source files.
