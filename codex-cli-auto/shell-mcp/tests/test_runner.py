import sys
import subprocess
import pytest

from shell_mcp.runner import run_cmd


def test_run_cmd_ok():
    stdout, stderr = run_cmd("echo hello", timeout=5)
    assert "hello" in stdout
    assert stderr == ""


def test_run_cmd_timeout():
    # Use a short timeout to trigger TimeoutExpired
    cmd = f"{sys.executable} -c \"import time; time.sleep(1)\""
    with pytest.raises(subprocess.TimeoutExpired):
        run_cmd(cmd, timeout=0.1)