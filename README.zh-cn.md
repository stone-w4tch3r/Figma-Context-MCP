<a href="https://www.framelink.ai/?utm_source=github&utm_medium=readme&utm_campaign=readme" target="_blank" rel="noopener">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://www.framelink.ai/github/HeaderDark.png" />
    <img alt="Framelink" src="https://www.framelink.ai/github/HeaderLight.png" />
  </picture>
</a>

<div align="center">
  <h1>Framelink MCP for Figma 服务器</h1>
  <h2>THIS IS DEV FORK WITH CACHING FEATURE ADDED! USE IT UNTIL THE FEATURE WILL BE MERGED INTO UPSTREAM</h2>
  <p>
    🌐 可用语言:
    <a href="README.md">English (英语)</a> |
    <a href="README.ko.md">한국어 (韩语)</a> |
    <a href="README.ja.md">日本語 (日语)</a> |
    <a href="README.zh-tw.md">繁體中文 (繁体中文)</a>
  </p>
  <h3>为您的编码代理提供 Figma 数据访问权限。<br/>一次性在任何框架中实现设计。</h3>
  <a href="https://npmcharts.com/compare/figma-developer-mcp-caching-dev-fork?interval=30">
    <img alt="每周下载" src="https://img.shields.io/npm/dm/figma-developer-mcp-caching-dev-fork.svg">
  </a>
  <a href="https://github.com/stone-w4tch3r/Figma-Context-MCP/blob/main/LICENSE">
    <img alt="MIT 许可证" src="https://img.shields.io/github/license/stone-w4tch3r/Figma-Context-MCP" />
  </a>
</div>

<br/>

通过此 [Model Context Protocol](https://modelcontextprotocol.io/introduction) 服务器，为 [Cursor](https://cursor.sh/) 和其他 AI 驱动的编码工具提供 Figma 文件访问权限。

当 Cursor 可以访问 Figma 设计数据时，它比粘贴截图等替代方法**更**能一次性准确实现设计。

<h3><a href="https://www.framelink.ai/docs/quickstart?utm_source=github&utm_medium=readme&utm_campaign=readme">查看快速入门指南 →</a></h3>

## 演示

[观看使用 Figma 设计数据在 Cursor 中构建 UI 的演示](https://youtu.be/6G9yb-LrEqg)

[![观看视频](https://img.youtube.com/vi/6G9yb-LrEqg/maxresdefault.jpg)](https://youtu.be/6G9yb-LrEqg)

## 工作原理

1. 打开 IDE 的聊天（例如：Cursor 的代理模式）。
2. 粘贴 Figma 文件、框架或组的链接。
3. 要求 Cursor 对 Figma 文件执行某些操作（例如：实现设计）。
4. Cursor 将从 Figma 获取相关元数据并使用它来编写代码。

此 MCP 服务器专为与 Cursor 一起使用而设计。在从 [Figma API](https://www.figma.com/developers/api) 响应上下文之前，它会简化和翻译响应，以便只向模型提供最相关的布局和样式信息。

减少提供给模型的上下文数量有助于提高 AI 的准确性并使响应更具相关性。

## 开始使用

许多代码编辑器和其他 AI 客户端使用配置文件来管理 MCP 服务器。

此缓存分叉（以 `figma-developer-mcp-caching-dev-fork` 发布）可通过在配置文件中添加以下内容进行配置。

> 注意：您需要创建 Figma 访问令牌才能使用此服务器。有关如何创建 Figma API 访问令牌的说明，请参见[此处](https://help.figma.com/hc/en-us/articles/8085703771159-Manage-personal-access-tokens)。

### MacOS / Linux

```json
{
  "mcpServers": {
    "Framelink MCP for Figma": {
      "command": "npx",
      "args": ["-y", "figma-developer-mcp-caching-dev-fork", "--figma-api-key=YOUR-KEY", "--stdio"]
    }
  }
}
```

### Windows

```json
{
  "mcpServers": {
    "Framelink MCP for Figma": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "figma-developer-mcp-caching-dev-fork", "--figma-api-key=YOUR-KEY", "--stdio"]
    }
  }
}
```

如果您更喜欢通过环境变量管理凭据（推荐），请将其放在服务器定义旁的 `env` 对象中。例如 Cursor 配置：

```jsonc
{
  "mcpServers": {
    "Framelink MCP for Figma": {
      "command": "npx",
      "args": ["-y", "figma-developer-mcp-caching-dev-fork", "--stdio"],
      "env": {
        "FIGMA_API_KEY": "YOUR-KEY",
        "FIGMA_CACHING": "{\"ttl\":{\"value\":30,\"unit\":\"d\"}}",
        "PORT": "3333"
      }
    }
  }
}
```

有关如何配置 Framelink MCP for Figma 服务器的更多信息，请参阅 [Framelink 文档](https://www.framelink.ai/docs/quickstart?utm_source=github&utm_medium=readme&utm_campaign=readme)。

### Support for free Figma accounts: Persistent caching (optional)

为避免触发 Figma 严格的速率限制，可以通过 JSON `FIGMA_CACHING` 环境变量启用磁盘缓存。

```bash
FIGMA_CACHING='{ "ttl": { "value": 30, "unit": "d" } }'
```

- `cacheDir`（可选）控制缓存文件写入位置。相对路径相对当前工作目录，`~` 展开为主目录。省略时默认：Linux `~/.cache/figma-mcp`、macOS `~/Library/Caches/FigmaMcp`、Windows `%LOCALAPPDATA%/FigmaMcpCache`。
- `ttl` 控制缓存有效期，必须包含 `value`（数字）和 `unit`（`ms`/`s`/`m`/`h`/`d`）。

启用缓存后，服务器会先获取一次完整 Figma 文件并写入磁盘，在 `get_figma_data` / `get_raw_node` 的后续请求中于过期前直接返回缓存。要强制刷新，请删除 `cacheDir` 内的文件。不设置 `FIGMA_CACHING` 则保持默认非缓存行为。

## 了解更多

Framelink MCP for Figma 服务器简单但功能强大。在 [Framelink](https://framelink.ai?utm_source=github&utm_medium=readme&utm_campaign=readme) 网站上了解更多信息。
