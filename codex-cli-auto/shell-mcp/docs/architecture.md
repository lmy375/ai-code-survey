 # Architecture

 `shell-mcp` is designed to wrap single shell commands and interactive shell sessions as fastmcp tools.

 ## Modules

 - **cli.py**: CLI entrypoint using Typer; parses arguments and loads tools.
 - **config.py**: Loads tools definitions from CLI options or JSON config.
 - **validator.py**: Validates the safety of shell commands.
 - **runner.py**: Executes single commands with timeout and captures output.
 - **repl.py**: Manages interactive REPL sessions via pseudo-terminals.
 - **log.py**: Configures logging.

 ## Command Flow

 1. User calls `shell-mcp` CLI.
 2. Arguments parsed; `load_tools` determines mode (single command, config, or REPL).
 3. Commands validated; executed or REPL session started.