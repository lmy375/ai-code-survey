 import pytest

 from shell_mcp.validator import validate_cmd


 @pytest.mark.parametrize("cmd", [
     "ls -la",
     "echo hello",
 ])
 def test_validate_cmd_ok(cmd):
     validate_cmd(cmd)


 @pytest.mark.parametrize("cmd", [
     "rm -rf / && echo bad",
     "ls ../",
     "cmd > out.txt",
 ])
 def test_validate_cmd_forbidden(cmd):
     with pytest.raises(ValueError):
         validate_cmd(cmd)