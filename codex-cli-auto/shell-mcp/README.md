 # shell-mcp

 `shell-mcp` is a tool to easily wrap shell commands and REPL sessions as fastmcp tools.

 ## Installation

 ```
 pip install shell-mcp
 ```

 ## Usage

 - Run a single command tool:
   ```
   shell-mcp --cmd "echo hello" --name hello --description "Print hello"
   ```
 - Load multiple commands from config:
   ```
   shell-mcp --config commands.json
   ```
 - Start a REPL session:
   ```
   shell-mcp --repl bash
   ```

 For full documentation, see `docs/architecture.md`.