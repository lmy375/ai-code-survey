# shell-mcp

A powerful MCP Server that wraps shell commands and REPL tools as MCP tools, based on fastmcp (TypeScript). Supports single-command and REPL session tools, config file, CLI, security, logging, tests, and CI/CD for npm release.

## Features
- Wrap any shell command or script as an MCP tool
- Wrap REPL/console tools (bash, python, node, etc.) as MCP tools
- Configurable via CLI or config file
- Security: command injection, timeout, path traversal protection
- Modular, testable, and well-documented
- GitHub Actions for auto-release

## Quick Start

```sh
npm install -g shell-mcp # (after publish)
# or clone and build locally
npm install
npm run build
```

## Usage

See docs/ for full usage, CLI, and config file examples.

## License
MIT
