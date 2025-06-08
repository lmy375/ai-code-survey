"""
repl module: manages interactive REPL sessions via pseudo-terminals.
"""

import shlex
import os
import pty
import subprocess
import select
import time
import logging
from typing import List, Optional, Union

logger = logging.getLogger(__name__)

class REPLManager:
    def __init__(self, repl_cmd: Union[str, List[str]]):
        if isinstance(repl_cmd, str):
            self.cmd = shlex.split(repl_cmd)
        else:
            self.cmd = repl_cmd
        self.master_fd: Optional[int] = None
        self.process: Optional[subprocess.Popen] = None

    def start_session(self, args: Optional[List[str]] = None) -> None:
        """
        Start the REPL session with optional additional arguments.
        """
        if self.process is not None:
            raise RuntimeError("REPL session already started")
        cmd = self.cmd + (args if args else [])
        logger.debug("Starting REPL session with command: %s", cmd)
        master_fd, slave_fd = pty.openpty()
        proc = subprocess.Popen(cmd, stdin=slave_fd, stdout=slave_fd, stderr=slave_fd, close_fds=True)
        os.close(slave_fd)
        self.master_fd = master_fd
        self.process = proc

    def send(self, command: str) -> None:
        """
        Send a command into the REPL session.
        """
        if self.master_fd is None:
            raise RuntimeError("REPL session is not started")
        logger.debug("Sending to REPL: %s", command)
        os.write(self.master_fd, command.encode() + b"\n")

    def recv(self, timeout: int = 10, end: Optional[str] = None) -> str:
        """
        Read output from the REPL session until timeout or end marker.
        """
        if self.master_fd is None:
            raise RuntimeError("REPL session is not started")
        buf = bytearray()
        start = time.time()
        while True:
            elapsed = time.time() - start
            if elapsed >= timeout:
                break
            rlist, _, _ = select.select([self.master_fd], [], [], timeout - elapsed)
            if self.master_fd in rlist:
                data = os.read(self.master_fd, 1024)
                if not data:
                    break
                buf.extend(data)
                text = buf.decode(errors="ignore")
                if end and text.endswith(end):
                    break
            else:
                break
        output = buf.decode(errors="ignore")
        logger.debug("Received from REPL: %s", output)
        return output

    def send_recv(self, command: str, timeout: int = 10, end: Optional[str] = None) -> str:
        """
        Send a command and then read output from the REPL session.
        """
        self.send(command)
        return self.recv(timeout, end)

    def close_session(self, args: Optional[List[str]] = None) -> None:
        """
        Close the REPL session, optionally sending arguments before closing.
        """
        if self.master_fd is None or self.process is None:
            return
        if args:
            logger.debug("Closing REPL session, sending args: %s", args)
            os.write(self.master_fd, b" ".join(a.encode() for a in args) + b"\n")
        logger.debug("Terminating REPL session")
        self.process.terminate()
        self.process.wait()
        os.close(self.master_fd)
        self.master_fd = None
        self.process = None