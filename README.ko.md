<a href="https://www.framelink.ai/?utm_source=github&utm_medium=readme&utm_campaign=readme" target="_blank" rel="noopener">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://www.framelink.ai/github/HeaderDark.png" />
    <img alt="Framelink" src="https://www.framelink.ai/github/HeaderLight.png" />
  </picture>
</a>

<div align="center">
  <h1>Framelink MCP for Figma 서버</h1>
  <h2>THIS IS DEV FORK WITH CACHING FEATURE ADDED! USE IT UNTIL THE FEATURE WILL BE MERGED INTO UPSTREAM</h2>
  <p>
    🌐 다른 언어:
    <a href="README.md">English (영어)</a> |
    <a href="README.ja.md">日本語 (일본어)</a> |
    <a href="README.zh-cn.md">简体中文 (중국어 간체)</a> |
    <a href="README.zh-tw.md">繁體中文 (중국어 번체)</a>
  </p>
  <h3>코딩 에이전트에게 Figma 데이터에 대한 접근 권한을 부여하세요.<br/>한 번에 모든 프레임워크에서 디자인을 구현하세요.</h3>
  <a href="https://npmcharts.com/compare/figma-developer-mcp-caching-dev-fork?interval=30">
    <img alt="주간 다운로드" src="https://img.shields.io/npm/dm/figma-developer-mcp-caching-dev-fork.svg">
  </a>
  <a href="https://github.com/stone-w4tch3r/Figma-Context-MCP/blob/main/LICENSE">
    <img alt="MIT 라이선스" src="https://img.shields.io/github/license/stone-w4tch3r/Figma-Context-MCP" />
  </a>
</div>

<br/>

[Cursor](https://cursor.sh/) 및 기타 AI 기반 코딩 도구에 [Model Context Protocol](https://modelcontextprotocol.io/introduction) 서버를 통해 Figma 파일에 대한 접근 권한을 부여하세요.

Cursor가 Figma 디자인 데이터에 접근할 수 있을 때, 스크린샷을 붙여넣는 것과 같은 대안적인 접근 방식보다 **훨씬** 더 정확하게 디자인을 한 번에 구현할 수 있습니다.

<h3><a href="https://www.framelink.ai/docs/quickstart?utm_source=github&utm_medium=readme&utm_campaign=readme">빠른 시작 가이드 보기 →</a></h3>

## 데모

[Figma 디자인 데이터로 Cursor에서 UI를 구축하는 데모 시청](https://youtu.be/6G9yb-LrEqg)

[![비디오 시청](https://img.youtube.com/vi/6G9yb-LrEqg/maxresdefault.jpg)](https://youtu.be/6G9yb-LrEqg)

## 작동 방식

1. IDE의 채팅을 엽니다 (예: Cursor의 에이전트 모드).
2. Figma 파일, 프레임 또는 그룹에 대한 링크를 붙여넣습니다.
3. Cursor에게 Figma 파일로 무언가를 하도록 요청합니다 (예: 디자인 구현).
4. Cursor는 Figma에서 관련 메타데이터를 가져와 코드를 작성하는 데 사용합니다.

이 MCP 서버는 Cursor와 함께 사용하도록 특별히 설계되었습니다. [Figma API](https://www.figma.com/developers/api)에서 컨텍스트를 응답하기 전에, 응답을 단순화하고 번역하여 모델에 가장 관련성이 높은 레이아웃 및 스타일링 정보만 제공합니다.

모델에 제공되는 컨텍스트의 양을 줄이면 AI의 정확도를 높이고 응답을 더 관련성 있게 만드는 데 도움이 됩니다.

## 시작하기

많은 코드 편집기와 기타 AI 클라이언트는 MCP 서버를 관리하기 위해 구성 파일을 사용합니다.

이 캐싱 포크(`figma-developer-mcp-caching-dev-fork`로 게시됨)를 사용하려면 구성 파일에 다음을 추가하세요.

> 참고: 이 서버를 사용하려면 Figma 액세스 토큰을 생성해야 합니다. Figma API 액세스 토큰을 생성하는 방법에 대한 지침은 [여기](https://help.figma.com/hc/en-us/articles/8085703771159-Manage-personal-access-tokens)에서 찾을 수 있습니다.

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

환경 변수로 관리하는 예시(권장):

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

Framelink MCP for Figma 서버를 구성하는 방법에 대한 자세한 정보가 필요하면 [Framelink 문서](https://www.framelink.ai/docs/quickstart?utm_source=github&utm_medium=readme&utm_campaign=readme)를 참조하세요.

### Support for free Figma accounts: Persistent caching (optional)

Figma의 강한 레이트 리밋을 피하려면 JSON 형태의 `FIGMA_CACHING` 환경 변수를 설정해 디스크 캐시를 활성화하세요.

```bash
FIGMA_CACHING='{ "ttl": { "value": 30, "unit": "d" } }'
```

- `cacheDir` (선택) 캐시 저장 경로. 상대 경로는 현재 디렉토리 기준, `~`는 홈으로 확장. 기본값: Linux `~/.cache/figma-mcp`, macOS `~/Library/Caches/FigmaMcp`, Windows `%LOCALAPPDATA%/FigmaMcpCache`.
- `ttl` 캐시 유효 기간. `value`(숫자)와 `unit`(`ms`/`s`/`m`/`h`/`d`)을 포함해야 합니다.

캐시를 켜면 첫 호출 시 전체 Figma 파일을 저장하고, `get_figma_data` / `get_raw_node` 후속 요청은 만료 전까지 캐시를 반환합니다. 강제로 새로고침하려면 `cacheDir`의 파일을 삭제하세요. `FIGMA_CACHING`을 설정하지 않으면 기존 비캐시 동작을 유지합니다.

## 더 알아보기

Framelink MCP for Figma 서버는 단순하지만 강력합니다. [Framelink](https://framelink.ai?utm_source=github&utm_medium=readme&utm_campaign=readme) 사이트에서 더 많은 정보를 얻으세요.
