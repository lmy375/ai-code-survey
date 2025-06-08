# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2025-06-08

### Added
- **Level 1**: Single command execution with parameter substitution
- **Level 2**: REPL session management for interactive console applications
- **Security**: Built-in command injection prevention and validation
- **Configuration**: JSON configuration file support for multiple commands
- **Parameter Types**: Support for string, int, float, and boolean parameters
- **Timeout Handling**: Configurable timeouts for command execution
- **CLI Interface**: Command-line interface with multiple operation modes
- **Testing**: Comprehensive test suite with 36 passing tests
- **Documentation**: Complete README with examples and usage instructions

### Security Features
- Command validation to prevent dangerous operations
- Parameter sanitization to escape shell metacharacters
- Timeout protection against long-running commands
- Injection prevention for command chaining and substitution
- Blocked dangerous commands (rm, sudo, curl, etc.)
- Directory traversal protection

### Supported Modes
- `--cmd`: Single command mode with parameter substitution
- `--repl`: Interactive REPL session mode
- `--config`: Configuration file mode for multiple commands

### Example Configurations
- `examples/config.json`: Basic file operations
- `examples/development.json`: Development tools (git, npm, linting)
- `examples/system.json`: System monitoring tools

### Requirements
- Node.js 18.0.0 or higher (for FastMCP compatibility)
- TypeScript compilation target: ES2022
- ES Module support

### Testing
- 36 test cases covering all major functionality
- Security validation tests
- Parameter substitution tests
- Configuration parsing tests
- Command execution tests
- Tool definition generation tests
