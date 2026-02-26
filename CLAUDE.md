# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Run program
node index.js <command>
node index.js --json <command>   # JSON output

# Run tests
npm test

# Run single test file
npx ava src/analyzer.test.js

# Linting and formatting
npm run lint          # Run ESLint
npm run lint:fix      # Fix ESLint issues
npm run format        # Format with Prettier
npm run format:check  # Check formatting
```

## Architecture

**Entry point:** `index.js` - CLI handler that parses args and orchestrates analysis

**Core modules:**

- `src/analyzer.js` - Main analysis logic; runs package manager checkers in priority order
- `src/output.js` - Colorized console output formatter (supports both text and JSON)
- `src/utils.js` - Shell command execution wrapper (`execSync` with error handling)

**Analyzer modules** (`src/analyzers/`): Each exports a `checkX(name, path)` function that returns analysis result or null:

- `nvm.js` - Node.js version managers (nvm, fnm, volta) - checked first
- `brew.js` - Homebrew (macOS)
- `cargo.js` - Rust/Cargo
- `go.js` - Go modules
- `pnpm.js`, `yarn.js`, `npm.js` - Node.js package managers
- `pip.js` - Python pip
- `system.js` - System packages (apt, pacman, dnf, pkgutil)

**Analysis flow:** `which <cmd>` → path → analyzers in order → first match returns `{type, name, path, install, reinstall, uninstall, update, info}`

**Analyzer order:** nvm → brew → cargo → go → pnpm → yarn → npm → pip → system

**Test structure:** Co-located `*.test.js` files using AVA framework next to source files.

## Module System

This project uses **ES modules (ESM)**. All files use `import`/`export` syntax instead of CommonJS `require`/`module.exports`.

## Output Format

Each analyzer returns an object with:

```javascript
{
  type: string,        // Package manager name
  name: string,        // Package name
  path: string,        // Full path to command
  install: string,     // Install command
  reinstall: string,   // Reinstall command
  uninstall: string,   // Uninstall command
  update: string,      // Update command
  info: string         // Info command
}
```
