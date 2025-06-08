# shell-mcp Architecture

## Overview

shell-mcp is a Model Context Protocol (MCP) server that bridges the gap between Large Language Models (LLMs) and shell commands/REPL programs. It provides a secure, type-safe interface for executing commands and managing interactive sessions.

## Core Components

### 1. Entry Point (`src/index.ts`)

The main entry point handles:
- CLI argument parsing using Commander.js
- MCP server initialization with FastMCP
- Tool registration based on operation mode
- Server lifecycle management

### 2. Handlers

#### Single Command Handler (`src/handlers/single-command.ts`)

Responsible for executing one-off shell commands:
- **Parameter Schema Generation**: Converts configuration into Zod schemas
- **Command Building**: Safely constructs commands with escaped parameters
- **Execution**: Spawns child processes with timeout protection
- **Output Handling**: Captures both stdout and stderr

Key features:
- 30-second default timeout
- Automatic process cleanup
- Error code handling
- Output formatting

#### REPL Handler (`src/handlers/repl.ts`)

Manages persistent interactive sessions:
- **Session Lifecycle**: Start, interact, and close REPL processes
- **Buffer Management**: Maintains output buffer for async reading
- **Stream Handling**: Manages stdin/stdout/stderr streams
- **Graceful Shutdown**: Attempts clean exit before force killing

Key features:
- Session state tracking
- Configurable read timeouts
- End marker support for output parsing
- Multi-command exit strategies

### 3. Utilities

#### Security (`src/utils/security.ts`)

Implements multiple layers of protection:
- **Pattern Validation**: Blocks dangerous shell patterns
- **Argument Escaping**: Prevents injection via parameters
- **Environment Sanitization**: Limits exposed environment variables
- **Command Building**: Safe parameter substitution

Security measures:
- Command injection prevention (&&, ||, ;, |)
- Path traversal protection (../)
- I/O redirection blocking (<, >)
- Command substitution blocking ($(), ``)

#### Configuration (`src/utils/config.ts`)

Handles JSON configuration files:
- **Schema Validation**: Ensures valid tool definitions
- **Type Checking**: Validates parameter types
- **Error Handling**: Clear error messages for misconfigurations

#### Logger (`src/utils/logger.ts`)

Winston-based logging system:
- **Level Control**: Configurable log levels
- **Formatting**: JSON and colorized console output
- **Context**: Structured logging with metadata

## Data Flow

### Single Command Mode

```
User Input → CLI Parser → SingleCommandHandler
                              ↓
                         Validate Command
                              ↓
                         Build Safe Command
                              ↓
                         Spawn Process
                              ↓
                         Capture Output
                              ↓
                         Return Result
```

### REPL Mode

```
User Input → CLI Parser → ReplHandler
                              ↓
                         Start Session
                              ↓
                    ┌─── Send Command ←─┐
                    │         ↓         │
                    │    Process Input  │
                    │         ↓         │
                    │    Buffer Output  │
                    │         ↓         │
                    └─── Read Output ───┘
                              ↓
                         Close Session
```

## MCP Integration

### Tool Registration

Tools are registered with FastMCP using:
- **Name**: Unique identifier
- **Description**: Human-readable purpose
- **Parameters**: Zod schema for type validation
- **Execute**: Async handler function

### Parameter Types

Supported parameter types:
- `string`: Text input
- `number`/`int`/`integer`: Numeric values
- `boolean`: True/false flags
- `array`: Lists of values
- `object`: Complex structures

### Response Format

All tools return strings containing:
- Command output (stdout)
- Error messages (stderr) when applicable
- Formatted error information for failures

## Security Model

### Defense in Depth

1. **Input Validation**: Reject dangerous patterns early
2. **Parameter Escaping**: Prevent injection via arguments
3. **Environment Isolation**: Limit available env vars
4. **Process Isolation**: Each command runs in separate process
5. **Resource Limits**: Timeouts prevent resource exhaustion

### Threat Mitigation

- **Command Injection**: Blocked via pattern matching and escaping
- **Path Traversal**: Prevented by rejecting ../ patterns
- **Information Disclosure**: Limited environment variable exposure
- **Resource Exhaustion**: Timeout and process limits
- **Privilege Escalation**: Commands run with user privileges only

## Extension Points

### Adding New Parameter Types

1. Update `createParameterSchema` in `index.ts`
2. Add type mapping to Zod schema
3. Update documentation

### Custom Security Rules

1. Add patterns to `DANGEROUS_PATTERNS` in `security.ts`
2. Implement additional validation in `validateCommandSafety`
3. Update tests

### New Handler Types

1. Create handler class in `src/handlers/`
2. Implement required methods
3. Register in main based on CLI options

## Performance Considerations

- **Process Spawning**: Each command creates new process
- **Buffer Management**: REPL output buffered in memory
- **Timeout Handling**: Uses Node.js timers
- **Stream Processing**: Async event-based I/O

## Testing Strategy

- **Unit Tests**: Core logic validation
- **Integration Tests**: Handler behavior
- **Security Tests**: Pattern matching and escaping
- **Mock Testing**: Process spawning simulation

## Future Enhancements

1. **Streaming Output**: Real-time output for long-running commands
2. **Session Persistence**: Save/restore REPL sessions
3. **Custom Shells**: Support for different shell interpreters
4. **Rate Limiting**: Prevent command flooding
5. **Audit Logging**: Track all executed commands
6. **Sandboxing**: Additional isolation mechanisms
