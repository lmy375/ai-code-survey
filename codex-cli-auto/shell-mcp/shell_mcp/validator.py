"""
validator module: ensures safety of shell commands by prohibiting dangerous patterns.
"""

from typing import List

FORBIDDEN_SUBSTRINGS: List[str] = ["&&", "||", ";", "|", "../", ">", "<"]

def validate_cmd(cmd: str) -> None:
    """
    Validate that the provided shell command does not contain dangerous patterns.
    Raise ValueError if a forbidden pattern is found.
    """
    for substr in FORBIDDEN_SUBSTRINGS:
        if substr in cmd:
            raise ValueError(f"Command contains forbidden substring: '{substr}'")