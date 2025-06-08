# Architecture

The server is built on top of `fastmcp`. Tools are registered based on a command
line string or a configuration file. A small history module persists executed
commands to `~/.shell-mcp-history.json`.

Session tools are implemented with Node's `child_process.spawn` allowing
interactive commands. Each session stores its output buffer until fetched with
`recv` or `send-recv`.
