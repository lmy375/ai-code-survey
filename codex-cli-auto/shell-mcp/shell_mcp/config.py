"""
config module: load tool definitions from CLI options or JSON configuration.
"""

import json
import shlex
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union


@dataclass
class ArgumentSpec:
    type: str
    description: str
    optional: bool = False
    default: Any = None


@dataclass
class CommandSpec:
    name: str
    cmd: str
    description: str
    args: Dict[str, ArgumentSpec] = field(default_factory=dict)


def parse_args_list(args_list: List[str]) -> Dict[str, ArgumentSpec]:
    """
    Parse a list of argument specification strings of the form 'NAME:TYPE:DESCRIPTION'.
    """
    result: Dict[str, ArgumentSpec] = {}
    for item in args_list:
        parts = item.split(":", 2)
        if len(parts) != 3:
            raise ValueError(
                f"Invalid argument spec '{item}', expected 'NAME:TYPE:DESCRIPTION'"
            )
        name, arg_type, desc = parts
        result[name] = ArgumentSpec(type=arg_type, description=desc)
    return result


def load_config_file(config_path: Union[str, Path]) -> List[CommandSpec]:
    """
    Load a JSON config file defining multiple command tools.
    """
    path = Path(config_path)
    data = json.loads(path.read_text())
    specs: List[CommandSpec] = []
    for name, info in data.items():
        cmd_str = info.get("cmd")
        if not cmd_str:
            raise ValueError(f"Missing 'cmd' for tool '{name}' in config")
        descr = info.get("description", f"Run '{cmd_str}' command")
        args_meta = info.get("args", {})
        args: Dict[str, ArgumentSpec] = {}
        for arg_name, meta in args_meta.items():
            args[arg_name] = ArgumentSpec(
                type=meta["type"],
                description=meta.get("description", ""),
                optional=meta.get("optional", False),
                default=meta.get("default"),
            )
        specs.append(CommandSpec(name=name, cmd=cmd_str, description=descr, args=args))
    return specs


def load_tools(
    cmd: Optional[str],
    name: Optional[str],
    description: Optional[str],
    args_list: Optional[List[str]],
    config_path: Optional[Path],
    repl: Optional[str],
) -> Tuple[List[CommandSpec], Optional[str]]:
    """
    Determine tool definitions based on provided CLI options or JSON config.
    Returns a list of CommandSpec and an optional repl command string.
    """
    if repl:
        return [], repl
    if config_path:
        specs = load_config_file(config_path)
        return specs, None
    if cmd:
        cmd_str = cmd
        tokens = shlex.split(cmd_str)
        tool_name = name or (tokens[0] if tokens else cmd_str)
        descr = description or f"Run '{cmd_str}' command"
        args = parse_args_list(args_list) if args_list else {}
        return [CommandSpec(name=tool_name, cmd=cmd_str, description=descr, args=args)], None
    raise ValueError("Must specify one of --cmd, --config, or --repl")