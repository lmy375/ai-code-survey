import json
from pathlib import Path

import pytest

from shell_mcp.config import load_tools, parse_args_list


def test_parse_args_list_ok():
    specs = parse_args_list(["X:int:arg x", "Y:str:arg y"])
    assert "X" in specs and specs["X"].type == "int"
    assert "Y" in specs and specs["Y"].description == "arg y"


def test_parse_args_list_invalid():
    with pytest.raises(ValueError):
        parse_args_list(["BAD_FORMAT"])


def test_load_tools_single():
    cmd_specs, repl = load_tools(
        cmd="echo hi",
        name="greet",
        description="desc",
        args_list=["VAR1:int:var1"],
        config_path=None,
        repl=None,
    )
    assert repl is None
    assert len(cmd_specs) == 1
    spec = cmd_specs[0]
    assert spec.name == "greet"
    assert spec.description == "desc"
    assert spec.args["VAR1"].type == "int"


def test_load_tools_config(tmp_path):
    cfg = tmp_path / "cfg.json"
    data = {"add": {"cmd": "echo 1", "description": "desc1"}}
    cfg.write_text(json.dumps(data))
    cmd_specs, repl = load_tools(
        cmd=None, name=None, description=None, args_list=None, config_path=cfg, repl=None
    )
    assert repl is None
    assert len(cmd_specs) == 1
    spec = cmd_specs[0]
    assert spec.name == "add"
    assert spec.cmd == "echo 1"


def test_load_tools_repl():
    cmd_specs, repl = load_tools(
        cmd=None, name=None, description=None, args_list=None, config_path=None, repl="bash"
    )
    assert cmd_specs == []
    assert repl == "bash"


def test_load_tools_error():
    with pytest.raises(ValueError):
        load_tools(cmd=None, name=None, description=None, args_list=None, config_path=None, repl=None)