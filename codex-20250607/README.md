# shell-mcp

A small utility to wrap shell commands as MCP server tools using [fastmcp](https://github.com/punkpeye/fastmcp).

## Installation

```bash
npm install -g shell-mcp
```

## Usage

### Single command

```bash
npx shell-mcp --cmd "date" --name date
```

### Config file

```json
{
  "add": {
    "cmd": "echo $(($OPND1 + $OPND2))",
    "args": {
      "OPND1": {"type": "int", "description": "first"},
      "OPND2": {"type": "int", "description": "second"}
    },
    "description": "Add two numbers"
  }
}
```

```bash
npx shell-mcp --config config.json
```

## History tool

`shell-mcp` records executed commands and exposes a `history` tool. You can query recent commands by calling `history` with an optional `limit` argument.
