import pytest

from shell_mcp.repl import REPLManager


@pytest.fixture
def repl():
    manager = REPLManager("bash")
    yield manager
    manager.close_session()


def test_repl_echo(repl):
    repl.start_session()
    repl.send("echo hello")
    output = repl.recv(timeout=1)
    assert "hello" in output


def test_repl_send_recv(repl):
    repl.start_session()
    output = repl.send_recv("echo world", timeout=1)
    assert "world" in output