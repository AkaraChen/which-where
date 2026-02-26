# Which-Where

> Analyze where a command comes from and how to manage it.

A CLI tool that tells you which package manager installed a command and provides the appropriate management commands (install, uninstall, update, info).

## Features

- 🔍 **Detect Package Source** - Identifies if a command was installed via Homebrew, npm, yarn, pnpm, Cargo, Go, or system packages
- 📦 **Management Commands** - Provides ready-to-use commands for installing, uninstalling, updating, and getting info about packages
- 🎨 **Clean Output** - Color-coded, easy-to-read reports
- 🧪 **Well Tested** - 38 unit tests covering all analyzers

## Supported Package Managers

| Package Manager | Detection |
|----------------|-----------|
| Homebrew (macOS) | ✅ |
| npm (Node.js) | ✅ |
| yarn (Node.js) | ✅ |
| pnpm (Node.js) | ✅ |
| Cargo (Rust) | ✅ |
| Go modules | ✅ |
| System (apt, pacman, dnf, pkgutil) | ✅ |

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/which-where.git
cd which-where

# Install dependencies
npm install
```

## Usage

```bash
# Analyze a single command
node index.js node

# Analyze multiple commands
node index.js node npm git

# Show help
node index.js
```

### Example Output

```bash
$ node index.js node

🔍 Analyzing command: node

📊 Analysis Report
  Source: Homebrew
  Package: node
  Path: /opt/homebrew/bin/node

📦 Management Commands:
  Install:    brew install node
  Uninstall:  brew uninstall node
  Update:     brew upgrade node
  Info:       brew info node
```

## Running Tests

```bash
npm test
```

## Project Structure

```
which-where/
├── index.js                 # Main entry point
├── src/
│   ├── analyzer.js          # Core analysis logic
│   ├── output.js            # Output formatter
│   ├── utils.js             # Utility functions
│   └── analyzers/           # Package manager analyzers
│       ├── brew.js          # Homebrew
│       ├── npm.js           # npm
│       ├── yarn.js          # Yarn
│       ├── pnpm.js          # pnpm
│       ├── cargo.js         # Cargo/Rust
│       ├── go.js            # Go
│       └── system.js        # System packages
└── test/                    # Unit tests (*.test.js files alongside source)
```

## API

### `analyzeCommand(name)`

Analyzes a command and returns information about its source.

```javascript
const { analyzeCommand } = require('./src/analyzer');

const result = analyzeCommand('node');
console.log(result);
// {
//   type: 'Homebrew',
//   name: 'node',
//   path: '/opt/homebrew/bin/node',
//   install: 'brew install node',
//   uninstall: 'brew uninstall node',
//   update: 'brew upgrade node',
//   info: 'brew info node'
// }
```

## License

MIT
