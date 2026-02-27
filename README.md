# Which-Where

> Analyze where a command comes from and how to manage it.

A CLI tool that tells you which package manager installed a command and provides the appropriate management commands (install, uninstall, update, info).

## Features

- 🔍 **Detect Package Source** - Identifies if a command was installed via Homebrew, npm, yarn, pnpm, Cargo, Go, pip, nvm, bun, or system packages
- 🔁 **Shim Detection** - Detects shims from fnm, nvm, volta, asdf, pyenv, rbenv, SDKMAN!, and mise/rtx
- 📦 **Management Commands** - Provides ready-to-use commands for installing, uninstalling, updating, and getting info about packages
- 🎨 **Clean Output** - Color-coded, easy-to-read reports with JSON support
- 🧪 **Well Tested** - Unit tests covering all analyzers
- 🚀 **CI/CD Ready** - GitHub Actions configured for automated testing

## Supported Package Managers

| Package Manager                          | Detection |
| ---------------------------------------- | --------- |
| Homebrew (macOS)                         | ✅        |
| npm (Node.js)                            | ✅        |
| yarn (Node.js)                           | ✅        |
| pnpm (Node.js)                           | ✅        |
| Cargo (Rust)                             | ✅        |
| Go modules                               | ✅        |
| pip (Python)                             | ✅        |
| nvm/fnm/volta (Node.js version managers) | ✅        |
| Bun                                      | ✅        |
| System (apt, pacman, dnf, pkgutil)       | ✅        |

### Shim Detection

| Shim Manager   | Detection |
| -------------- | --------- |
| fnm shims      | ✅        |
| nvm wrappers   | ✅        |
| volta shims    | ✅        |
| asdf shims     | ✅        |
| pyenv shims    | ✅        |
| rbenv shims    | ✅        |
| SDKMAN! shims  | ✅        |
| mise/rtx shims | ✅        |

## Installation

### Install globally from GitHub

```bash
npm install -g https://github.com/AkaraChen/which-where.git
```

### Install from source

```bash
# Clone the repository
git clone https://github.com/AkaraChen/which-where.git
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

# Output as JSON (for script integration)
node index.js --json node

# Show verbose details (shim info, file type, real path)
node index.js --verbose node
node index.js -v node

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

### JSON Output

```bash
$ node index.js --json node

{
  "type": "Homebrew",
  "name": "node",
  "path": "/opt/homebrew/bin/node",
  "install": "brew install node",
  "uninstall": "brew uninstall node",
  "update": "brew upgrade node",
  "info": "brew info node"
}
```

## Running Tests

```bash
npm test
```

## Development

```bash
# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
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
│       ├── index.js         # Analyzer exports
│       ├── shim.js          # Shim detection (fnm, nvm, volta, asdf, etc.)
│       ├── brew.js          # Homebrew
│       ├── npm.js           # npm (includes checkBrewNpm)
│       ├── yarn.js          # Yarn
│       ├── pnpm.js          # pnpm
│       ├── bun.js           # Bun
│       ├── cargo.js         # Cargo/Rust
│       ├── go.js            # Go
│       ├── pip.js           # Python pip
│       ├── nvm.js           # nvm/fnm/volta
│       └── system.js        # System packages
└── src/**/*.test.js         # Unit tests
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

## Analyzer Return Format

Each analyzer returns an object with the following structure:

```typescript
{
  type: string; // Package manager name
  name: string; // Package name
  path: string; // Full path to the command
  install: string; // Command to install
  reinstall: string; // Command to reinstall
  uninstall: string; // Command to uninstall
  update: string; // Command to update
  info: string; // Command to get info
}
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT
