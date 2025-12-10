<a href="https://www.framelink.ai/?utm_source=github&utm_medium=readme&utm_campaign=readme" target="_blank" rel="noopener">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://www.framelink.ai/github/HeaderDark.png" />
    <img alt="Framelink" src="https://www.framelink.ai/github/HeaderLight.png" />
  </picture>
</a>

<div align="center">
  <h1>Framelink MCP for Figma サーバー</h1>
  <h2>THIS IS DEV FORK WITH CACHING FEATURE ADDED! USE IT UNTIL THE FEATURE WILL BE MERGED INTO UPSTREAM</h2>
  <p>
    🌐 利用可能な言語:
    <a href="README.md">English (英語)</a> |
    <a href="README.ko.md">한국어 (韓国語)</a> |
    <a href="README.zh-cn.md">简体中文 (簡体字中国語)</a> |
    <a href="README.zh-tw.md">繁體中文 (繁体字中国語)</a>
  </p>
  <h3>コーディングエージェントにFigmaデータへのアクセスを提供。<br/>ワンショットで任意のフレームワークにデザインを実装。</h3>
  <a href="https://npmcharts.com/compare/figma-developer-mcp-caching-dev-fork?interval=30">
    <img alt="週間ダウンロード" src="https://img.shields.io/npm/dm/figma-developer-mcp-caching-dev-fork.svg">
  </a>
  <a href="https://github.com/stone-w4tch3r/Figma-Context-MCP/blob/main/LICENSE">
    <img alt="MITライセンス" src="https://img.shields.io/github/license/stone-w4tch3r/Figma-Context-MCP" />
  </a>
</div>

<br/>

[Cursor](https://cursor.sh/)と他のAI搭載コーディングツールに、この[Model Context Protocol](https://modelcontextprotocol.io/introduction)サーバーを通じてFigmaファイルへのアクセスを提供します。

CursorがFigmaデザインデータにアクセスできる場合、スクリーンショットを貼り付けるなどの代替アプローチよりも**はるかに**正確にワンショットでデザインを実装できます。

<h3><a href="https://www.framelink.ai/docs/quickstart?utm_source=github&utm_medium=readme&utm_campaign=readme">クイックスタートガイドを見る →</a></h3>

## デモ

[FigmaデザインデータでCursorでUIを構築するデモを見る](https://youtu.be/6G9yb-LrEqg)

[![ビデオを見る](https://img.youtube.com/vi/6G9yb-LrEqg/maxresdefault.jpg)](https://youtu.be/6G9yb-LrEqg)

## 仕組み

1. IDEのチャットを開きます（例：Cursorのエージェントモード）。
2. Figmaファイル、フレーム、またはグループへのリンクを貼り付けます。
3. CursorにFigmaファイルで何かをするように依頼します（例：デザインの実装）。
4. CursorはFigmaから関連するメタデータを取得し、コードを書くために使用します。

このMCPサーバーは、Cursorで使用するために特別に設計されています。[Figma API](https://www.figma.com/developers/api)からコンテキストを応答する前に、応答を簡素化して翻訳し、モデルに最も関連性の高いレイアウトとスタイリング情報のみを提供します。

モデルに提供されるコンテキストの量を減らすことで、AIの精度を高め、応答をより関連性のあるものにするのに役立ちます。

## はじめに

多くのコードエディタやその他のAIクライアントは、MCPサーバーを管理するために設定ファイルを使用します。

このキャッシングフォーク（`figma-developer-mcp-caching-dev-fork`として公開）を設定するには、設定ファイルに以下を追加します。

> 注：このサーバーを使用するには、Figmaアクセストークンを作成する必要があります。Figma APIアクセストークンの作成方法については[こちら](https://help.figma.com/hc/en-us/articles/8085703771159-Manage-personal-access-tokens)をご覧ください。

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

環境変数で管理する場合の例（推奨）:

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

Framelink MCP for Figmaサーバーの設定方法の詳細については、[Framelinkドキュメント](https://www.framelink.ai/docs/quickstart?utm_source=github&utm_medium=readme&utm_campaign=readme)を参照してください。

### Support for free Figma accounts: Persistent caching (optional)

Figmaの厳しいレート制限を避けるため、JSON形式の`FIGMA_CACHING`環境変数でディスクキャッシュを有効にできます。

```bash
FIGMA_CACHING='{ "ttl": { "value": 30, "unit": "d" } }'
```

- `cacheDir` (任意) はキャッシュ書き込み先。相対パスはカレントディレクトリ基準、`~`はホームに展開。省略時のデフォルト: Linux `~/.cache/figma-mcp`, macOS `~/Library/Caches/FigmaMcp`, Windows `%LOCALAPPDATA%/FigmaMcpCache`。
- `ttl` はキャッシュ有効期限。`value` (数値) と `unit` (`ms`/`s`/`m`/`h`/`d`) を含めてください。

キャッシュを有効にすると最初の取得で完全なFigmaファイルを保存し、`get_figma_data` / `get_raw_node`の後続リクエストは有効期限までキャッシュを返します。強制更新したい場合は`cacheDir`内のファイルを削除してください。`FIGMA_CACHING`を設定しない場合は従来の非キャッシュ動作になります。

## 詳細情報

Framelink MCP for Figmaサーバーはシンプルですが強力です。[Framelink](https://framelink.ai?utm_source=github&utm_medium=readme&utm_campaign=readme)サイトで詳細情報をご覧ください。
