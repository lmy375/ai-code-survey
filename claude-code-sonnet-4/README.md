# Shell MCP

A versatile Model Context Protocol (MCP) server that wraps shell commands and REPL sessions as MCP tools for AI agents.

[![npm version](https://badge.fury.io/js/shell-mcp.svg)](https://badge.fury.io/js/shell-mcp)
[![CI](https://github.com/your-username/shell-mcp/workflows/CI/badge.svg)](https://github.com/your-username/shell-mcp/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **Command Wrapping**: Transform any shell command into an MCP tool
- **REPL Support**: Wrap interactive console sessions (Python, Node.js, bash, etc.)
- **Security First**: Built-in protection against command injection and malicious input
- **Flexible Configuration**: Support for both command-line and file-based configuration
- **Type Safety**: Full TypeScript implementation with comprehensive type definitions
- **Easy Integration**: Works with any MCP-compatible AI agent or client

## Installation

Install globally via npm:

```bash
npm install -g shell-mcp
```

Or use with npx (recommended):

```bash
npx shell-mcp --help
```

## Quick Start

### Single Command Tool

Wrap a simple command as an MCP tool:

```bash
npx shell-mcp --cmd "date" --name "current_time" --description "Get current date and time"
```

### Command with Arguments

Create a calculator tool:

```bash
npx shell-mcp \\
  --cmd "echo \$((\$NUM1 + \$NUM2))" \\
  --name "add" \\
  --description "Add two numbers" \\
  --args "NUM1:int:First number" \\
  --args "NUM2:int:Second number"
```

### REPL Session

Start a Python REPL session:

```bash
npx shell-mcp --repl python
```

### Configuration File

Create a `commands.json` file:

```json
{
  "add": {
    "cmd": "echo \$((\$OPND1 + \$OPND2))",
    "args": {
      "OPND1": {
        "type": "int",
        "description": "The first operand to add"
      },
      "OPND2": {
        "type": "int", 
        "description": "The second operand to add"
      }
    },
    "description": "Add two numbers"
  },
  "date": {
    "cmd": "date",
    "description": "Get current date and time"
  }
}
```

Then run:

```bash
npx shell-mcp --config commands.json
```

## MCP Client Configuration

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "shell-tools": {
      "command": "npx",
      "args": [
        "-y",
        "shell-mcp",
        "--config",
        "/path/to/your/commands.json"
      ]
    }
  }
}
```

### Single Command Configuration

```json
{
  "mcpServers": {
    "add": {
      "command": "npx",
      "args": [
        "-y",
        "shell-mcp",
        "--cmd",
        "echo \$((\$OPND1 + \$OPND2))",
        "--name",
        "add",
        "--description", 
        "Add two numbers",
        "--args",
        "OPND1:int:'The first operand to add'",
        "OPND2:int:'The second operand to add'"
      ]
    }
  }
}
```

### REPL Configuration

```json
{
  "mcpServers": {
    "python": {
      "command": "npx",
      "args": [
        "-y",
        "shell-mcp", 
        "--repl",
        "python"
      ]
    }
  }
}
```

## Command Line Options

```
Usage: shell-mcp [options]

Options:
  --cmd <command>            Single command to wrap as MCP tool
  --name <name>              Name for the tool (defaults to command name)
  --description <description> Description for the tool
  --args <args...>           Arguments definition in format NAME:type:description
  --config <path>            Path to configuration file
  --repl <command>           REPL command to wrap as MCP tools
  --timeout <seconds>        Command timeout in seconds
  --verbose                  Enable verbose logging
  --debug                    Enable debug logging
  --info                     Show server information and exit
  -h, --help                 Display help for command
```

## Argument Types

Supported argument types:

- `string`: Text input
- `int`: Integer number
- `float`: Decimal number
- `boolean`: True/false value
- `string[]`: Array of strings

### Argument Format

When using `--args`, use the format: `NAME:type:description`

Examples:
- `"MESSAGE:string:The message to display"`
- `"COUNT:int:Number of items"`
- `"ENABLED:boolean:Enable the feature"`

## REPL Tools

When using REPL mode, the following tools are automatically created:

- `<name>_start_session`: Start a new REPL session
- `<name>_send`: Send a command to the session
- `<name>_recv`: Read output from the session
- `<name>_send_recv`: Send command and receive output in one call
- `<name>_close_session`: Close the REPL session
- `<name>_list_sessions`: List all active sessions

## Security Features

Shell MCP includes comprehensive security measures:

- **Command Validation**: Blocks dangerous command patterns
- **Argument Sanitization**: Validates and sanitizes all input arguments
- **Environment Variable Filtering**: Only allows safe environment variables
- **Timeout Protection**: Prevents long-running or hanging commands
- **Directory Traversal Prevention**: Blocks path traversal attempts

### Blocked Patterns

The following patterns are blocked for security:
- Command injection characters: `;`, `&`, `|`, `` ` ``, `$()`, `{}`
- Directory traversal: `../`, `..\\`
- System directory access: `/etc/`, `/proc/`, `/sys/`
- Dangerous commands: `rm -rf`, `sudo`, `su`
- Network utilities with pipes: `wget`, `curl`, `nc`, `netcat`

## Configuration Examples

### Basic Commands

```json
{
  "commands": {
    "echo": {
      "cmd": "echo $MESSAGE",
      "args": {
        "MESSAGE": {
          "type": "string",
          "description": "Message to echo"
        }
      },
      "description": "Echo a message"
    },
    "list_files": {
      "cmd": "ls -la $PATH",
      "args": {
        "PATH": {
          "type": "string", 
          "description": "Directory path to list",
          "optional": true,
          "default": "."
        }
      },
      "description": "List files in directory"
    }
  }
}
```

### REPL Configuration

```json
{
  "repl": {
    "command": "python3",
    "description": "Python 3 REPL session",
    "timeout": 30000
  }
}
```

## Development

### Building from Source

```bash
git clone https://github.com/your-username/shell-mcp.git
cd shell-mcp
npm install
npm run build
```

### Running Tests

```bash
npm test
```

### Linting and Type Checking

```bash
npm run lint
npm run typecheck
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- GitHub Issues: [Report bugs or request features](https://github.com/your-username/shell-mcp/issues)
- Discussions: [Community discussions](https://github.com/your-username/shell-mcp/discussions)

## Examples

See the `examples/` directory for more configuration examples and use cases.