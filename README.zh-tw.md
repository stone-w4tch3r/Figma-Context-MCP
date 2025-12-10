<a href="https://www.framelink.ai/?utm_source=github&utm_medium=referral&utm_campaign=readme" target="_blank" rel="noopener">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://www.framelink.ai/github/HeaderDark.png" />
    <img alt="Framelink" src="https://www.framelink.ai/github/HeaderLight.png" />
  </picture>
</a>

<div align="center">
  <h1>Framelink MCP for Figma 伺服器</h1>
  <h2>THIS IS DEV FORK WITH CACHING FEATURE ADDED! USE IT UNTIL THE FEATURE WILL BE MERGED INTO UPSTREAM</h2>
  <p>
    🌐 可用語言:
    <a href="README.md">English (英文)</a> |
    <a href="README.ko.md">한국어 (韓文)</a> |
    <a href="README.ja.md">日本語 (日文)</a> |
    <a href="README.zh-cn.md">简体中文 (簡體中文)</a>
  </p>
  <h3>讓您的程式碼代理存取您的 Figma 資料。<br/>在任何框架中一次性完成設計。</h3>
  <a href="https://npmcharts.com/compare/figma-developer-mcp-caching-dev-fork?interval=30">
    <img alt="每週下載次數" src="https://img.shields.io/npm/dm/figma-developer-mcp-caching-dev-fork.svg">
  </a>
  <a href="https://github.com/stone-w4tch3r/Figma-Context-MCP/blob/main/LICENSE">
    <img alt="MIT 授權條款" src="https://img.shields.io/github/license/stone-w4tch3r/Figma-Context-MCP" />
  </a>
</div>

<br/>

使用此 [Model Context Protocol](https://modelcontextprotocol.io/introduction) 伺服器，讓 [Cursor](https://cursor.sh/) 和其他由 AI 驅動的程式碼工具存取您的 Figma 檔案。

當 Cursor 可以存取 Figma 設計資料時，它在一次性精準實現設計方面，比貼上螢幕截圖等替代方案**好得多**。

<h3><a href="https://www.framelink.ai/docs/quickstart?utm_source=github&utm_medium=referral&utm_campaign=readme">查看快速入門指南 →</a></h3>

## 示範

[觀看在 Cursor 中使用 Figma 設計資料建構 UI 的示範](https://youtu.be/6G9yb-LrEqg)

[ ![觀看影片](https://img.youtube.com/vi/6G9yb-LrEqg/maxresdefault.jpg) ](https://youtu.be/6G9yb-LrEqg)

## 運作方式

1. 開啟您 IDE 的聊天功能（例如 Cursor 中的代理模式）。
2. 貼上 Figma 檔案、框架或群組的連結。
3. 要求 Cursor 對 Figma 檔案執行操作 — 例如，實現設計。
4. Cursor 將從 Figma 取得相關元數據，並用它來編寫您的程式碼。

此 MCP 伺服器專為與 Cursor 搭配使用而設計。在從 [Figma API](https://www.figma.com/developers/api) 回應內容之前，它會簡化和轉譯回應，以便只向模型提供最相關的版面配置和樣式資訊。

減少提供給模型的內容有助於提高 AI 的準確性並使回應更具關聯性。

## 入門指南

許多程式碼編輯器和其他 AI 客戶端都使用設定檔來管理 MCP 伺服器。

此快取分叉（以 `figma-developer-mcp-caching-dev-fork` 發布）可透過在設定檔加入以下內容來設定。

> 注意：您需要建立一個 Figma 存取權杖才能使用此伺服器。有關如何建立 Figma API 存取權杖的說明，請參閱[此處](https://help.figma.com/hc/en-us/articles/8085703771159-Manage-personal-access-tokens)。

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

如果您希望依照 MCP 客戶端規範以環境變數管理憑證（建議），請將其放在伺服器定義旁的 `env` 物件中。以下為 Cursor 設定範例：

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

如果您需要有關如何設定 Framelink MCP for Figma 伺服器的更多資訊，請參閱 [Framelink 文件](https://www.framelink.ai/docs/quickstart?utm_source=github&utm_medium=referral&utm_campaign=readme)。

### Support for free Figma accounts: Persistent caching (optional)

為避免觸發 Figma 嚴格的速率限制，可以透過 JSON `FIGMA_CACHING` 環境變數啟用磁碟快取。

```bash
FIGMA_CACHING='{ "ttl": { "value": 30, "unit": "d" } }'
```

- `cacheDir`（可選）控制快取檔案的寫入位置。相對路徑以當前工作目錄為基準，`~` 會展開到家目錄。預設：Linux `~/.cache/figma-mcp`、macOS `~/Library/Caches/FigmaMcp`、Windows `%LOCALAPPDATA%/FigmaMcpCache`。
- `ttl` 控制快取有效期，必須包含 `value`（數字）與 `unit`（`ms`/`s`/`m`/`h`/`d`）。

啟用快取後，伺服器會先抓取完整 Figma 檔案並寫入磁碟，後續 `get_figma_data` / `get_raw_node` 請求會在到期前直接返回快取。若需強制重新整理，刪除 `cacheDir` 內的檔案即可。不設定 `FIGMA_CACHING` 則維持預設的非快取行為。

## 了解更多

Framelink MCP for Figma 伺服器既簡單又強大。請前往 [Framelink](https://framelink.ai?utm_source=github&utm_medium=referral&utm_campaign=readme) 網站了解更多資訊，以充分利用它。
