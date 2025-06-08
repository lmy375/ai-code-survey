# shell-mcp

将 shell 命令/REPL 工具转化为 MCP Server 的工具集，支持通过 fastmcp 框架快速注册 shell 命令为大模型可用的 tool。

## 安装

```bash
npm install -g shell-mcp # 或 npx/uvx 直接运行
```

## 用法示例

### 注册单次命令为 MCP Tool

```bash
npx shell-mcp --cmd "date" --name date --description "获取当前时间"
```

### 批量注册（通过 config 文件）

config.json:
```json
{
  "add": {
    "cmd": "echo $(($OPND1 + $OPND2))",
    "args": {
      "OPND1": { "type": "int", "description": "加数1" },
      "OPND2": { "type": "int", "description": "加数2" }
    },
    "description": "加法"
  },
  "date": {
    "cmd": "date",
    "description": "获取当前时间"
  }
}
```

```bash
npx shell-mcp --config config.json
```

### 注册 REPL/console 工具为 MCP Tool

```bash
npx shell-mcp --repl bash
npx shell-mcp --repl python
```

注册后会自动提供 start-session、send、recv、send-recv、close-session 等多轮交互接口。

### 查询与导出命令/会话历史

注册任意工具后，自动提供 `history-query` 和 `history-export` 工具：

- `history-query`：可按 type/tool/sessionId 查询历史
- `history-export`：导出全部历史

例如：
```json
{
  "name": "history-query",
  "arguments": { "type": "single" }
}
```

## 进度
- [x] 单次命令工具注册
- [ ] REPL/console 工具注册
- [ ] 命令历史与复用
- [ ] 安全增强、测试、文档 

## 自动发布与贡献

- 推送 tag（如 v1.0.0）自动发布 npm 包（需配置 NPM_TOKEN）。
- 欢迎贡献新工具、REPL 支持、安全策略、Web UI 等。 