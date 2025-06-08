# shell-mcp

Convert shell commands and console applications into MCP (Model Context Protocol) servers.

## Features

- **Level 1**: Single command execution - Convert one-time shell commands into MCP tools
- **Level 2**: Console/REPL sessions - Convert interactive console applications into MCP servers with session management
- **Security**: Built-in command injection prevention and validation
- **Configuration**: Support for JSON configuration files
- **Timeout handling**: Configurable timeouts for command execution
- **Parameter substitution**: Safe parameter substitution in commands

## Installation

### Using npx (recommended)
```bash
npx shell-mcp --cmd "echo hello" --name "say_hello"
```

### Using uvx (Python)
```bash
# Install via npm first, then use with uvx
npm install -g shell-mcp
uvx shell-mcp --cmd "echo hello" --name "say_hello"
```

### Local installation
```bash
npm install -g shell-mcp
```

## Usage

### Single Command Mode

Convert a single shell command into an MCP tool:

```bash
# Simple command
shell-mcp --cmd "echo hello world" --name "say_hello"

# Command with parameters
shell-mcp --cmd "echo \$message" --name "echo_message" --args "message:string:Message to echo"

# Command with multiple parameters
shell-mcp --cmd "ping -c \$count \$host" --name "ping_host" \
  --args "host:string:Host to ping" "count:int:Number of pings"

# Command with timeout
shell-mcp --cmd "sleep 5" --name "wait" --timeout 10000
```

### REPL Session Mode

Convert an interactive console application into an MCP server:

```bash
# Python REPL
shell-mcp --repl "python3"

# Node.js REPL
shell-mcp --repl "node"

# Database CLI
shell-mcp --repl "sqlite3 database.db"

# Custom REPL with arguments
shell-mcp --repl "mysql -u user -p database"
```

### Configuration File Mode

Use a JSON configuration file to define multiple commands:

```bash
shell-mcp --config examples/config.json
```

Example configuration file:
```json
{
  "list_files": {
    "cmd": "ls -la $path",
    "description": "List files in a directory",
    "args": {
      "path": {
        "type": "string",
        "description": "Directory path to list",
        "optional": false,
        "default": "."
      }
    },
    "timeout": 10000
  },
  "echo_message": {
    "cmd": "echo $message",
    "description": "Echo a message",
    "args": {
      "message": {
        "type": "string",
        "description": "Message to echo",
        "optional": false
      }
    },
    "timeout": 5000
  }
}
```

## Parameter Types

Supported parameter types:
- `string`: Text values
- `int`: Integer numbers
- `float`: Floating-point numbers
- `boolean`: True/false values

Parameter format: `name:type:description`

Examples:
- `message:string:Message to display`
- `count:int:Number of items`
- `enabled:boolean:Enable feature`
- `ratio:float:Ratio value`

## REPL Session Tools

When using `--repl` mode, the following tools are automatically created:

- `start_session`: Start a new REPL session
- `send`: Send a command to the active session
- `recv`: Receive output from the session
- `send_recv`: Send command and receive output in one call
- `close_session`: Close the REPL session

## Security

shell-mcp includes built-in security features:

- **Command validation**: Prevents dangerous commands and patterns
- **Parameter sanitization**: Escapes shell metacharacters
- **Timeout protection**: Prevents long-running commands from hanging
- **Injection prevention**: Blocks command injection attempts

Blocked patterns include:
- Command chaining (`;`, `&&`, `||`)
- Piping (`|`)
- Redirection (`>`, `<`)
- Command substitution (`` ` ``, `$()`)
- Directory traversal (`../`)

## Examples

### File Operations
```bash
# List directory contents
shell-mcp --cmd "ls -la \$path" --name "list_files" \
  --args "path:string:Directory path"

# Count lines in file
shell-mcp --cmd "wc -l \$file" --name "count_lines" \
  --args "file:string:File to count"
```

### Network Operations
```bash
# Ping host
shell-mcp --cmd "ping -c \$count \$host" --name "ping" \
  --args "host:string:Host to ping" "count:int:Number of pings"

# Check port
shell-mcp --cmd "nc -z \$host \$port" --name "check_port" \
  --args "host:string:Host to check" "port:int:Port number"
```

### Development Tools
```bash
# Git status
shell-mcp --cmd "git status" --name "git_status"

# Run tests
shell-mcp --cmd "npm test" --name "run_tests" --timeout 60000

# Python REPL for interactive development
shell-mcp --repl "python3"
```

## Development

### Building from source
```bash
git clone <repository>
cd shell-mcp
npm install
npm run build
```

### Running tests
```bash
npm test
```

### Linting
```bash
npm run lint
```

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run tests and linting
6. Submit a pull request

## Troubleshooting

### Common Issues

**Command not found**: Make sure the command exists and is in your PATH.

**Permission denied**: Check file permissions and user access rights.

**Timeout errors**: Increase timeout value with `--timeout` option.

**Security errors**: Review command for dangerous patterns or use configuration file for complex commands.

### Debug Mode

Enable verbose logging:
```bash
shell-mcp --cmd "echo test" --verbose
```

Enable debug logging:
```bash
shell-mcp --cmd "echo test" --debug
```
