# shell-mcp Demo

This document demonstrates how to use shell-mcp in different modes.

## 1. Single Command Mode

### Basic Command
```bash
npx shell-mcp --cmd "date"
```

### Command with Parameters
```bash
npx shell-mcp --cmd "echo \$MESSAGE" --name "echo_message" --args "MESSAGE:string:The message to echo"
```

### Math Operation
```bash
npx shell-mcp --cmd "echo \$((\$NUM1 + \$NUM2))" --name "add" --args "NUM1:int:First number" "NUM2:int:Second number"
```

## 2. REPL Mode

### Python REPL
```bash
npx shell-mcp --repl python
```

This creates tools:
- `start_session`: Start a Python session
- `send`: Send Python code
- `recv`: Read output
- `send_recv`: Send and receive in one call
- `close_session`: Close the session

### Node.js REPL
```bash
npx shell-mcp --repl node
```

## 3. Configuration File Mode

Create a config file (see examples/config.json) and run:
```bash
npx shell-mcp --config examples/config.json
```

## MCP Client Configuration

### For Cline/Claude Dev

Add to your MCP settings:

```json
{
  "mcpServers": {
    "shell-date": {
      "command": "node",
      "args": [
        "/path/to/shell-mcp/dist/index.js",
        "--cmd",
        "date"
      ]
    },
    "shell-math": {
      "command": "node",
      "args": [
        "/path/to/shell-mcp/dist/index.js",
        "--cmd",
        "echo $(($NUM1 + $NUM2))",
        "--name",
        "add",
        "--args",
        "NUM1:int:First number",
        "NUM2:int:Second number"
      ]
    },
    "python-repl": {
      "command": "node",
      "args": [
        "/path/to/shell-mcp/dist/index.js",
        "--repl",
        "python"
      ]
    }
  }
}
```

## Security Features

The tool includes several security measures:

1. **Command Injection Prevention**: Blocks dangerous patterns like `&&`, `||`, `;`, `|`
2. **Path Traversal Protection**: Prevents `../` patterns
3. **I/O Redirection Blocking**: Blocks `>`, `<` operators
4. **Environment Sanitization**: Only exposes safe environment variables
5. **Argument Escaping**: All arguments are properly escaped

## Example Usage in LLM

Once configured, the LLM can use the tools like:

1. **Get current date**: Use the `execute` tool (or custom name)
2. **Add numbers**: Use the `add` tool with NUM1 and NUM2 parameters
3. **Python REPL**:
   - First use `start_session`
   - Then use `send` to send Python code
   - Use `recv` to get output
   - Finally use `close_session`

## Logging

Control log level with `--log-level`:
```bash
npx shell-mcp --cmd "date" --log-level debug
```

Levels: debug, info, warn, error
