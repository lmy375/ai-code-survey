#!/bin/bash

# shell-mcp Demo Script
# This script demonstrates various ways to use shell-mcp

echo "=== shell-mcp Demo ==="
echo

# Build the project first
echo "Building shell-mcp..."
npm run build
echo

echo "1. Single Command Demo"
echo "Running: echo 'Hello from shell-mcp'"
echo "Command: node dist/index.js --cmd \"echo 'Hello from shell-mcp'\" --name \"demo_hello\""
echo

echo "2. Command with Parameters Demo"
echo "This would create a tool that echoes a custom message"
echo "Command: node dist/index.js --cmd \"echo \\\$message\" --name \"echo_message\" --args \"message:string:Message to echo\""
echo

echo "3. Configuration File Demo"
echo "Using examples/config.json to create multiple tools"
echo "Command: node dist/index.js --config examples/config.json"
echo

echo "4. REPL Session Demo"
echo "This would start a Python REPL session"
echo "Command: node dist/index.js --repl \"python3\""
echo

echo "5. Development Tools Demo"
echo "Using examples/development.json for development tools"
echo "Command: node dist/index.js --config examples/development.json"
echo

echo "6. System Tools Demo"
echo "Using examples/system.json for system monitoring tools"
echo "Command: node dist/index.js --config examples/system.json"
echo

echo "=== Available Example Configurations ==="
echo "- examples/config.json - Basic file operations"
echo "- examples/development.json - Development tools (git, npm, linting)"
echo "- examples/system.json - System monitoring tools"
echo

echo "=== Security Features ==="
echo "shell-mcp includes built-in security to prevent:"
echo "- Command injection"
echo "- Dangerous commands (rm, sudo, etc.)"
echo "- Directory traversal"
echo "- Command chaining"
echo

echo "=== Testing the CLI ==="
echo "You can test the CLI with:"
echo "node dist/index.js --help"
echo

echo "Demo complete! Check the README.md for detailed usage instructions."
