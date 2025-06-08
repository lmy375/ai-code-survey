"""
CLI entrypoint: parse arguments and register tools with fastmcp server.
"""

import shlex
from pathlib import Path
from typing import List, Optional

import typer

from shell_mcp.config import load_tools
from shell_mcp.log import init_logger
from shell_mcp.runner import run_cmd
from shell_mcp.repl import REPLManager

app = typer.Typer(help="shell-mcp: wrap shell commands and REPL sessions as fastmcp tools.")


@app.callback(invoke_without_command=True)
def main(
    cmd: Optional[str] = typer.Option(None, "--cmd", help="Single shell command to wrap"),
    name: Optional[str] = typer.Option(None, "--name", help="Tool name"),
    description: Optional[str] = typer.Option(None, "--description", help="Tool description"),
    args: List[str] = typer.Option(None, "--args", help="Argument specs NAME:TYPE:DESCRIPTION"),
    config: Optional[Path] = typer.Option(None, "--config", help="Path to JSON config file"),
    repl: Optional[str] = typer.Option(None, "--repl", help="REPL command to wrap"),
) -> None:
    """
    Convert a shell command or REPL session into fastmcp tools.
    """
    init_logger()
    cmd_specs, repl_cmd = load_tools(cmd, name, description, args, config, repl)

    import fastmcp

    server = fastmcp.FastMCPServer()

    for spec in cmd_specs:
        def make_handler(spec):
            def handler(**kwargs):
                cmd_str = spec.cmd
                for k, v in kwargs.items():
                    cmd_str = cmd_str.replace(f"${k}", str(v))
                stdout, stderr = run_cmd(cmd_str)
                return {"stdout": stdout, "stderr": stderr}

            return handler

        handler = make_handler(spec)
        server.tool(
            name=spec.name,
            description=spec.description,
            arguments={
                k: {
                    "type": spec.args[k].type,
                    "description": spec.args[k].description,
                    **({"optional": spec.args[k].optional} if spec.args[k].optional else {}),
                    **({"default": spec.args[k].default} if spec.args[k].default is not None else {}),
                }
                for k in spec.args
            },
        )(handler)

    if repl_cmd:
        repl_mgr = REPLManager(repl_cmd)

        @server.tool(
            name="start-session",
            description="Start a REPL session",
            arguments={
                "args": {"type": "string[]", "optional": True, "description": "Additional arguments to start the session"}
            },
        )
        def start_session(args: List[str] = []):
            repl_mgr.start_session(args)
            return repl_mgr.recv(timeout=0, end=None)

        @server.tool(
            name="send",
            description="Send command into the session",
            arguments={"command": {"type": "string", "description": "Command to evaluate and execute."}},
        )
        def send(command: str):
            repl_mgr.send(command)
            return ""

        @server.tool(
            name="recv",
            description="Read output from the session",
            arguments={
                "timeout": {"type": "int", "default": 10, "description": "Timeout in seconds"},
                "end": {"type": "string", "optional": True, "description": "Read until we found the end marker"},
            },
        )
        def recv(timeout: int = 10, end: Optional[str] = None):
            return repl_mgr.recv(timeout, end)

        @server.tool(
            name="send-recv",
            description="Send and receive output in one call",
            arguments={
                "command": {"type": "string", "description": "Command to evaluate and execute."},
                "timeout": {"type": "int", "default": 10, "description": "Timeout in seconds"},
                "end": {"type": "string", "optional": True, "description": "Read until we found the end marker"},
            },
        )
        def send_recv(command: str, timeout: int = 10, end: Optional[str] = None):
            return repl_mgr.send_recv(command, timeout, end)

        @server.tool(
            name="close-session",
            description="Stop the REPL session",
            arguments={"args": {"type": "string[]", "optional": True, "description": "Additional arguments to end the session"}},
        )
        def close_session(args: List[str] = []):
            repl_mgr.close_session(args)
            return ""

    server.run()