# Shell MCP Architecture

This document describes the architecture and design decisions of Shell MCP.

## Overview

Shell MCP is designed as a modular, secure, and extensible MCP server that transforms shell commands and REPL sessions into MCP tools that can be used by AI agents.

## Core Components

### 1. Core Module (`src/core/`)

#### ShellMcpServer
The main server class that orchestrates all components:
- Initializes FastMCP server
- Manages tool registration
- Handles server lifecycle
- Coordinates between different tool types

#### CommandExecutor
Handles execution of single commands:
- Spawns child processes securely
- Manages timeouts and resource limits
- Captures stdout/stderr
- Implements command interpolation with variables

### 2. Security Module (`src/security/`)

#### SecurityValidator
Comprehensive security validation system:
- **Command Validation**: Blocks dangerous command patterns
- **Argument Sanitization**: Validates input arguments
- **Environment Filtering**: Sanitizes environment variables
- **Timeout Validation**: Ensures reasonable execution limits

Security patterns blocked:
- Command injection: `;`, `&`, `|`, `` ` ``, `$()`
- Directory traversal: `../`, `..\\`
- System access: `/etc/`, `/proc/`, `/sys/`
- Privilege escalation: `sudo`, `su`
- Network abuse: `wget|curl.*[|&;]`, `nc`, `netcat`

### 3. Tools Module (`src/tools/`)

#### CommandTool
Wraps single commands as MCP tools:
- Generates MCP tool schemas from configuration
- Handles argument type conversion and validation
- Manages command interpolation
- Provides structured response format

#### ReplTools
Creates multiple tools for REPL interaction:
- `start_session`: Initialize REPL process
- `send`: Send commands to session
- `recv`: Read output from session
- `send_recv`: Combined send and receive
- `close_session`: Terminate session
- `list_sessions`: Show active sessions

### 4. REPL Module (`src/repl/`)

#### ReplSessionManager
Manages long-running REPL sessions:
- **Session Lifecycle**: Create, manage, and cleanup sessions
- **Process Management**: Handle stdin/stdout/stderr streams
- **Output Buffering**: Collect and manage output data
- **Timeout Handling**: Prevent hanging operations
- **Session Isolation**: Each session is independent

### 5. Utilities Module (`src/utils/`)

#### ConfigParser
Configuration management:
- **Command Line Parsing**: Handle CLI arguments
- **File Configuration**: Load and validate JSON configs
- **Schema Validation**: Ensure configuration correctness
- **Type Conversion**: Handle argument type definitions

#### Logger
Structured logging system:
- **Log Levels**: DEBUG, INFO, WARN, ERROR
- **Colored Output**: Visual distinction of log levels
- **Contextual Information**: Include timestamps and details
- **Performance**: Only log when appropriate level is set

## Data Flow

### Command Tool Flow
```
CLI Args/Config → CommandTool → SecurityValidator → CommandExecutor → Process → Result
```

### REPL Tool Flow
```
REPL Config → ReplTools → ReplSessionManager → Child Process ↔ Session Management
```

## Configuration System

### Command Configuration
```typescript
interface CommandConfig {
  cmd: string;                    // Command template with variables
  name?: string;                  // Tool name (auto-generated if not provided)
  description?: string;           // Tool description
  args?: Record<string, ArgumentConfig>; // Argument definitions
  timeout?: number;               // Execution timeout
}
```

### REPL Configuration
```typescript
interface ReplConfig {
  command: string;                // REPL command to execute
  name?: string;                  // Name prefix for generated tools
  description?: string;           // Description for the REPL
  args?: string[];               // Additional startup arguments
  timeout?: number;              // Default operation timeout
}
```

### Argument Configuration
```typescript
interface ArgumentConfig {
  type: 'string' | 'int' | 'float' | 'boolean' | 'string[]';
  description: string;
  optional?: boolean;
  default?: any;
}
```

## Security Design

### Defense in Depth
1. **Input Validation**: All inputs validated before processing
2. **Command Filtering**: Dangerous patterns blocked at multiple levels
3. **Process Isolation**: Each command runs in isolated process
4. **Resource Limits**: Timeouts prevent resource exhaustion
5. **Environment Sanitization**: Only safe environment variables passed

### Command Interpolation
- Uses simple `$VARIABLE` substitution
- No shell evaluation of interpolated values
- Variables are string-replaced before execution
- Prevents code injection through variable values

### Process Management
- All processes spawned with `stdio: 'pipe'`
- Proper cleanup on timeout or termination
- Signal handling for graceful shutdown
- Resource monitoring and limits

## Type System

### Argument Types
- **string**: Simple text values
- **int**: Integer numbers with validation
- **float**: Decimal numbers with validation  
- **boolean**: True/false values with parsing
- **string[]**: Arrays of strings

### Type Conversion
Automatic conversion with validation:
- String coercion for all types
- Number parsing with error handling
- Boolean parsing from various formats
- Array handling for multiple values

## Error Handling

### Graceful Degradation
- Invalid configurations logged but don't crash server
- Command failures return structured error responses
- REPL session failures are isolated
- Network issues don't affect other tools

### Error Response Format
```typescript
{
  success: false,
  output: string | null,
  error: string,
  timeout?: boolean,
  exitCode?: number
}
```

## Extension Points

### Custom Tool Types
The architecture supports adding new tool types by:
1. Creating new tool classes in `src/tools/`
2. Implementing the tool interface
3. Registering with ShellMcpServer

### Custom Security Validators
Add new security checks by:
1. Extending SecurityValidator
2. Adding new validation patterns
3. Integrating with existing validation flow

### Custom Argument Types
Support new argument types by:
1. Adding type definitions
2. Implementing conversion logic
3. Updating Zod schema generation

## Performance Considerations

### Process Management
- Reuse REPL sessions when possible
- Cleanup idle sessions automatically
- Limit concurrent processes
- Monitor resource usage

### Memory Management
- Stream large outputs instead of buffering
- Cleanup process handles promptly
- Limit output buffer sizes
- Garbage collect inactive sessions

### Optimization Strategies
- Command result caching for deterministic commands
- Connection pooling for REPL sessions
- Lazy loading of heavy modules
- Efficient string interpolation

## Testing Strategy

### Unit Tests
- Individual component testing
- Security validator testing
- Configuration parser testing
- Type conversion testing

### Integration Tests
- End-to-end command execution
- REPL session management
- Error handling scenarios
- Security breach attempts

### Security Tests
- Command injection attempts
- Directory traversal tests
- Resource exhaustion tests
- Privilege escalation attempts

## Deployment Considerations

### npm Package
- Single executable with all dependencies
- Cross-platform compatibility
- Minimal external dependencies
- Clear installation instructions

### Security Hardening
- Run with minimal privileges
- Sandbox when possible
- Monitor resource usage
- Log security events

### Monitoring
- Command execution metrics
- Security violation alerts
- Resource usage tracking
- Error rate monitoring