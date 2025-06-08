"""
runner module: executes single shell commands with timeout and captures stdout and stderr.
"""

import shlex
import subprocess
import logging
from typing import Tuple

from shell_mcp.validator import validate_cmd

logger = logging.getLogger(__name__)

def run_cmd(cmd: str, timeout: int = 10) -> Tuple[str, str]:
    """
    Execute a shell command safely (no shell=True) with a timeout, capturing stdout and stderr.
    Raises subprocess.TimeoutExpired on timeout.
    """
    validate_cmd(cmd)
    args = shlex.split(cmd)
    logger.debug("Running command: %s with timeout %s", args, timeout)
    completed = subprocess.run(args, capture_output=True, text=True, timeout=timeout)
    logger.debug("Command stdout: %s", completed.stdout)
    logger.debug("Command stderr: %s", completed.stderr)
    return completed.stdout, completed.stderr