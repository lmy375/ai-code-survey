"""
log module: configures application-wide logging.
"""

import logging
import sys

def init_logger(level: str = "INFO") -> None:
    """
    Initialize root logger with a console handler.
    """
    root = logging.getLogger()
    if root.handlers:
        return
    handler = logging.StreamHandler(stream=sys.stdout)
    fmt = "[%(asctime)s] %(levelname)s %(name)s: %(message)s"
    handler.setFormatter(logging.Formatter(fmt))
    root.addHandler(handler)
    root.setLevel(getattr(logging, level.upper(), logging.INFO))