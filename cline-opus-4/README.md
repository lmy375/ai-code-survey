# shell-mcp

A Model Context Protocol (MCP) server that converts shell commands and REPL programs into MCP tools. This allows LLMs to execute shell commands and interact with command-line programs in a safe and controlled manner.

## Features

### Level 1: Single Command Execution
- Convert any single-execution shell command into an MCP tool
- Support for parameterized commands with type-safe arguments
- Automatic timeout handling (30 seconds default)
- Comprehensive security validation to prevent command injection

### Level 2: REPL Session Management
- Wrap interactive REPL programs (Python, Node.js, MySQL, etc.) as MCP tools
- Maintain persistent sessions with full stdin/stdout/stderr handling
- Support for multi-round interactions with context preservation
- Configurable timeouts and end markers for output reading

### Level 3: Advanced Features
- Configuration file support for defining multiple tools
- Robust security measures including:
  - Command injection prevention
  - Path traversal protection
  - Environment variable sanitization
  - Shell argument escaping
- Comprehensive logging with configurable levels
- Full TypeScript support with type safety

## Installation

```bash
npm install -g shell-mcp
```

Or use directly with `npx`:

```bash
npx shell-mcp --cmd "echo hello"
```

## Usage

### Single Command Mode

Execute a single command as an MCP tool:

```bash
# Simple command
npx shell-mcp --cmd "date"

# Command with parameters
npx shell-mcp --cmd "echo \$MESSAGE" --name "echo_message" --description "Echo a message" --args "MESSAGE:string:The message to echo"

# Multiple parameters
npx shell-mcp --cmd "echo \$((\$NUM1 + \$NUM2))" --name "add" --description "Add two numbers" --args "NUM1:int:First number" "NUM2:int:Second number"
```

### REPL Mode

Wrap an interactive REPL program:

```bash
# Python REPL
npx shell-mcp --repl python

# Node.js REPL
npx shell-mcp --repl node

# MySQL client
npx shell-mcp --repl mysql
```

In REPL mode, the following tools are available:
- `start_session`: Start a new REPL session
- `send`: Send a command to the session
- `recv`: Read output from the session
- `send_recv`: Send command and receive output in one call
- `close_session`: Close the REPL session

### Configuration File Mode

Create a configuration file to define multiple tools:

```json
{
  "add": {
    "cmd": "echo $(($NUM1 + $NUM2))",
    "description": "Add two numbers",
    "args": {
      "NUM1": {
        "type": "int",
        "description": "First operand"
      },
      "NUM2": {
        "type": "int",
        "description": "Second operand"
      }
    }
  },
  "date": {
    "cmd": "date",
    "description": "Get current date and time"
  },
  "list_files": {
    "cmd": "ls -la $DIR",
    "description": "List files in a directory",
    "args": {
      "DIR": {
        "type": "string",
        "description": "Directory path",
        "default": "."
      }
    }
  }
}
```

Then use it:

```bash
npx shell-mcp --config config.json
```

## MCP Configuration

Add to your MCP settings:

### Single Command
```json
{
  "mcpServers": {
    "add": {
      "command": "npx",
      "args": [
        "-y",
        "shell-mcp",
        "--cmd",
        "echo $(($NUM1 + $NUM2))",
        "--name",
        "add",
        "--description",
        "Add two numbers",
        "--args",
        "NUM1:int:First number",
        "NUM2:int:Second number"
      ]
    }
  }
}
```

### REPL Session
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

### Configuration File
```json
{
  "mcpServers": {
    "shell-tools": {
      "command": "npx",
      "args": [
        "-y",
        "shell-mcp",
        "--config",
        "/path/to/config.json"
      ]
    }
  }
}
```

## Security

shell-mcp implements multiple security measures to prevent malicious command execution:

1. **Command Injection Prevention**: Blocks dangerous patterns like `&&`, `||`, `;`, `|`, backticks, and command substitution
2. **Path Traversal Protection**: Prevents `../` patterns in commands and arguments
3. **I/O Redirection Blocking**: Blocks `>`, `<` operators to prevent file manipulation
4. **Environment Sanitization**: Only allows specific environment variables (PATH, HOME, USER, etc.)
5. **Shell Argument Escaping**: Properly escapes all arguments to prevent injection

## Options

- `--cmd <command>`: Single command to execute
- `--name <name>`: Tool name (default: "execute")
- `--description <desc>`: Tool description
- `--args <args...>`: Tool arguments in format NAME:TYPE:DESCRIPTION
- `--repl <program>`: REPL program to wrap
- `--config <path>`: Path to configuration file
- `--log-level <level>`: Log level (debug, info, warn, error)

## Development

```bash
# Clone the repository
git clone https://github.com/yourusername/shell-mcp.git
cd shell-mcp

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Run in development mode
npm run dev -- --cmd "echo hello"
```

## Architecture

The project is structured as follows:

```
src/
├── index.ts              # Main entry point and CLI
├── handlers/
│   ├── single-command.ts # Single command execution handler
│   └── repl.ts          # REPL session management handler
├── utils/
│   ├── config.ts        # Configuration file loader
│   ├── logger.ts        # Winston logger setup
│   └── security.ts      # Security validation utilities
└── types/               # TypeScript type definitions
```

## Testing

The project includes comprehensive unit tests for all major components:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Acknowledgments

Built with [FastMCP](https://github.com/punkpeye/fastmcp) - A fast and type-safe MCP implementation.
