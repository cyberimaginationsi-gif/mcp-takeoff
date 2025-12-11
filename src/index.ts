import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import fs from "node:fs/promises";
import path from "node:path";

export const configSchema = z.object({
  debug: z.boolean().default(false).describe("Enable debug logging"),
});

type Ctx = { config: z.infer<typeof configSchema> };

function mimeForDocx() {
  return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
}

async function readDocxAsBase64(filePath: string) {
  const buf = await fs.readFile(filePath);
  return buf.toString("base64");
}

// ================================
// ✅ SPEC1_MD: docx에서 뽑은 내용을 LLM용 Markdown으로 정리
// ================================
const SPEC1_MD = [
  "# Cyber MCP API Spec (from spec-1.docx)",
  "",
  "## 1. MCP테스트 – APIPATH 조회",
  "",
  "### Description",
  "등록된 API 메뉴/경로 정보를 조회합니다.",
  "",
  "### Endpoint",
  "- **GET** `/svc/mcp/apipath`",
  "",
  "### Example Response",
  "{",
  '  "OutBlock_1": [',
  "    {",
  '      "menuId": "__",',
  '      "upMenuId": "__",',
  '      "menuNm": "__",',
  '      "menuOrd": "__",',
  '      "menuTp": "__"',
  "    }",
  "  ]",
  "}",
  "",
  "---",
  "",
  "## 2. MCP테스트 – Client 조회",
  "",
  "### Description",
  "등록된 클라이언트 목록을 조회합니다.",
  "",
  "### Endpoint",
  "- **GET** `/svc/mcp/getClient`",
  "",
  "### Example Response",
  "{",
  '  "OutBlock_1": [',
  "    {",
  '      "clientId": "__",',
  '      "clientNm": "__",',
  '      "clientEmail": "__",',
  '      "clientIp": "__",',
  '      "regDd": "__",',
  '      "authKey": "__",',
  '      "lstWrtrId": "__",',
  '      "lstWrtrNm": "__",',
  '      "lstWrtrDdtm": "__",',
  '      "sumYn": "__",',
  '      "keyStrtDd": "__",',
  '      "keyEndDd": "__",',
  '      "nextAuthKey": "__",',
  '      "pw": "__",',
  '      "useYn": "__"',
  "    }",
  "  ]",
  "}",
  "",
  "---",
  "",
  "## 3. MCP테스트 – 회원 조회",
  "",
  "### Description",
  "특정 Client ID에 대한 회원 정보를 조회합니다.",
  "",
  "### Endpoint",
  "- **GET** `/svc/mcp/getUserInfo`",
  "",
  "### Query Parameters",
  "| Name     | Type   | Required | Description           |",
  "|----------|--------|----------|-----------------------|",
  "| clientId | string | Yes      | 조회할 클라이언트 ID |",
  "",
  "### Example Response",
  "{",
  '  "OutBlock_1": [',
  "    {",
  '      "clientId": "__",',
  '      "clientNm": "__",',
  '      "regDd": "__",',
  '      "useYn": "__"',
  "    }",
  "  ]",
  "}",
  "",
  "---",
  "",
  "## Summary Table",
  "",
  "| API          | Method | Path                     | Description              |",
  "|--------------|--------|--------------------------|--------------------------|",
  "| APIPATH 조회 | GET    | `/svc/mcp/apipath`       | API Path 목록 조회       |",
  "| Client 조회  | GET    | `/svc/mcp/getClient`     | 클라이언트 리스트 조회   |",
  "| 회원 조회    | GET    | `/svc/mcp/getUserInfo`   | clientId 기반 회원 조회 |",
  "",
  "---",
  "",
  "## Notes",
  "- 모든 API는 `OutBlock_1` 배열을 포함하는 JSON 응답 구조를 사용합니다.",
  "- `__` 표시는 문서 예시에서 빈 값 또는 예시용 placeholder 입니다.",
  "- 실제 서비스에서는 authKey, 암호화된 값 등이 포함될 수 있습니다.",
].join("\n");

// ================================
// SPEC2_MD: 두 번째 스펙 문서용 (나중에 docx 기준으로 채워도 됨)
// ================================
const SPEC2_MD = [
  "# Cyber MCP API Spec (OAuth2 + MCP APIs)",
  "",
  "## 공통 사항",
  "",
  "- 모든 API 호출의 기본 Base URL은 `https://demo-api.cyber-i.com` 입니다.",
  "- 먼저 `/svc/mcp/token` 엔드포인트를 통해 OAuth 2.0 `access_token`을 발급받아야 합니다.",
  "- **토큰 발급 API(`/svc/mcp/token`)를 제외한 모든 API**는 요청 헤더에 이 토큰을 포함해야 합니다.",
  "- 일반적으로 다음과 같이 헤더를 구성합니다:",
  "  - `Authorization: Bearer {access_token}`",
  "",
  "---",
  "",
  "## 1. OAuth 토큰 발급 (Token)",
  "",
  "### Endpoint",
  "- **POST** `/svc/mcp/token`",
  "- 서버 URL: `https://demo-api.cyber-i.com/svc/mcp/token`",
  "",
  "### Request Parameters",
  "- `code`: string – 코드",
  "- `client_id`: string – 클라이언트 아이디",
  "- `client_secret`: string – 클라이언트 시크릿",
  "- `scope`: string – 권한 범위 (옵션)",
  "- `grant_type`: string – grant 타입 (`authorization_code`, `client_credentials` 만 허용)",
  "- `redirect_uri`: string – redirect URI",
  "- `refresh_token`: string – refresh 토큰",
  "",
  "### Response Fields",
  "- `token_type`: string – 토큰 타입",
  "- `access_token`: string – 액세스 토큰",
  "- `expires_in`: int – 토큰 만료 시간(초)",
  "- `refresh_token`: string – 리프레시 토큰",
  "",
  "---",
  "",
  "## 2. MCP테스트 – 회원조회 (`getUserInfo`)",
  "",
  "### 설명",
  "- 회원을 조회하는 API입니다.",
  "- 입력으로 `clientId`를 받아서 검색할 수 있으며, 결과는 여러 건이 조회될 수 있습니다.",
  "- **이 API를 호출하기 전에 `/svc/mcp/token`으로 OAuth2.0 토큰을 발급받고, 헤더에 토큰을 넣어서 호출해야 정상 동작합니다.**",
  "- 토큰 발급은 `client_credentials` grant 타입으로 `/svc/mcp/token`을 호출합니다.",
  "",
  "### Endpoint",
  "- **POST 또는 GET (문서 기준)** `/svc/mcp/getUserInfo`",
  "- 서버 URL: `https://demo-api.cyber-i.com/svc/mcp/getUserInfo`",
  "",
  "### Request (InBlock_1)",
  "- `clientId`: string – 조회할 clientId",
  "",
  "### Response (OutBlock_1)",
  "- `clientId`: string – 클라이언트 ID",
  "- `clientNm`: string – 클라이언트 이름",
  "- `regDd`: string – 등록일(YYYYMMDD)",
  "- `useYn`: string – 사용 여부 (Y/N)",
  "",
  "---",
  "",
  "## 3. MCP테스트 – Client 조회 (`getClient`)",
  "",
  "### 설명",
  "- 등록된 클라이언트 목록을 조회하는 API입니다.",
  "- **이 API 역시 `/svc/mcp/token`에서 받은 토큰을 헤더에 포함하여 호출해야 합니다.**",
  "",
  "### Endpoint",
  "- **POST 또는 GET (문서 기준)** `/svc/mcp/getClient`",
  "- 서버 URL: `https://demo-api.cyber-i.com/svc/mcp/getClient`",
  "",
  "### Request (InBlock_1)",
  "- 별도 입력 필드 없음 (`{}`)",
  "",
  "### Response (OutBlock_1)",
  "- `clientId`: string – 클라이언트 ID",
  "- `clientNm`: string – 클라이언트 이름",
  "- `clientEmail`: string – 이메일",
  "- `clientIp`: string – IP",
  "- `regDd`: string – 등록일",
  "- `authKey`: string – 인증키",
  "- `lstWrtrId`: string – 최종 수정자 ID",
  "- `lstWrtrNm`: string – 최종 수정자명",
  "- `lstWrtrDdtm`: string – 최종 수정일시",
  "- `sumYn`: string – 합계 여부",
  "- `keyStrtDd`: string – 키 시작일",
  "- `keyEndDd`: string – 키 종료일",
  "- `nextAuthKey`: string – 다음 인증키",
  "- `pw`: string – 패스워드(또는 암호화된 값)",
  "- `useYn`: string – 사용 여부 (Y/N)",
  "",
  "---",
  "",
  "## 4. MCP테스트 – APIPATH 조회 (`apipath`)",
  "",
  "### 설명",
  "- MCP에서 사용되는 API Path(메뉴/경로) 목록을 조회하는 API입니다.",
  "- **이 API 역시 `/svc/mcp/token`에서 받은 토큰을 헤더에 포함하여 호출해야 합니다.**",
  "",
  "### Endpoint",
  "- **POST 또는 GET (문서 기준)** `/svc/mcp/apipath`",
  "- 서버 URL: `https://demo-api.cyber-i.com/svc/mcp/apipath`",
  "",
  "### Request (InBlock_1)",
  "- 별도 입력 필드 없음 (`{}`)",
  "",
  "### Response (OutBlock_1)",
  "- `menuId`: string – 메뉴 ID",
  "- `upMenuId`: string – 상위 메뉴 ID",
  "- `menuNm`: string – 메뉴명",
  "- `menuOrd`: int – 메뉴 순서",
  "- `menuTp`: string – 메뉴 타입",
  "",
  "---",
  "",
  "## 요약",
  "",
  "- **Base URL**: `https://demo-api.cyber-i.com`",
  "- **토큰 발급**: `/svc/mcp/token` (OAuth2.0, `authorization_code` 또는 `client_credentials`)",
  "- **토큰 사용**: Token API를 제외한 모든 API는 발급받은 `access_token`을 헤더에 포함해야 함.",
  "- 주요 조회 API:",
  "  - `/svc/mcp/getUserInfo` – 회원 조회 (clientId 기반, 다건 가능)",
  "  - `/svc/mcp/getClient` – 클라이언트 전체 목록 조회",
  "  - `/svc/mcp/apipath` – API Path(메뉴/경로) 목록 조회",
].join("\n");

export default function createStatelessServer({ config }: Ctx) {
  const server = new McpServer({
    name: "cyber-mcp-docs",
    version: "1.0.0",
  });

  // ---------- 파일 경로 ----------
  const doc1Path = path.resolve(process.cwd(), "spec", "spec-1.docx");
  const doc2Path = path.resolve(process.cwd(), "spec", "spec-2.docx");

  // ---------- 리소스 URI ----------
  const DOC1_URI = "resource://cyber/spec-1.docx";
  const DOC2_URI = "resource://cyber/spec-2.docx";
  const MD1_URI = "resource://cyber/spec-1.md";
  const MD2_URI = "resource://cyber/spec-2.md";

  // ================================
  // Resources: docx 원본 + MD 텍스트
  // ================================

  // 1) spec-1.docx (원본 Word)
  server.resource(
    "spec-1-docx",
    DOC1_URI,
    { mimeType: mimeForDocx() },
    async () => {
      const base64 = await readDocxAsBase64(doc1Path);
      return {
        contents: [
          {
            uri: DOC1_URI,
            mimeType: mimeForDocx(),
            blob: base64,
          },
        ],
      };
    }
  );

  // 1) spec-2.docx (원본 Word)
  server.resource(
    "spec-2-docx",
    DOC2_URI,
    { mimeType: mimeForDocx() },
    async () => {
      const base64 = await readDocxAsBase64(doc2Path);
      return {
        contents: [
          {
            uri: DOC2_URI,
            mimeType: mimeForDocx(),
            blob: base64,
          },
        ],
      };
    }
  );

  // 3) spec-1.md (LLM용 텍스트)
  server.resource(
    "spec-1-md",
    MD1_URI,
    { mimeType: "text/markdown" },
    async () => {
      return {
        contents: [
          {
            uri: MD1_URI,
            mimeType: "text/markdown",
            text: SPEC1_MD,
          },
        ],
      };
    }
  );

  // 2) spec-2.md (LLM이 바로 읽을 수 있는 텍스트 요약)
  server.resource(
    "spec-2-md",
    MD2_URI,
    { mimeType: "text/markdown" },
    async () => {
      return {
        contents: [
          {
            uri: MD2_URI,
            mimeType: "text/markdown",
            text: SPEC2_MD,
          },
        ],
      };
    }
  );

  // ================================
  // Tools: 첫 번째 / 두 번째 스펙을 “사용”하게 하는 툴
  // ================================

  // 1) 첫 번째 tool: spec-1 (MD + docx 위치 안내)
  server.tool(
    "docs.getSpec1",
    "API Spec 문서 #1 (요약 + docx 위치)를 제공합니다.",
    {},
    async () => {
      return {
        content: [
          {
            type: "text",
            text:
              "### API Spec #1 (요약)\n\n" +
              SPEC1_MD +
              "\n\n---\n\n" +
              "원본 Word 파일(docx)은 다음 리소스로 접근할 수 있습니다:\n" +
              `- ${DOC1_URI}\n`,
          },
        ],
      };
    }
  );

  // 2) 두 번째 tool: spec-2 (MD + docx 위치 안내)
  server.tool(
    "docs.getSpec2",
    "OAuth2 토큰 발급 및 MCP API 전체 스펙(Spec-2)을 요약해서 보여줍니다.",
    {},
    async () => {
      return {
        content: [
          {
            type: "text",
            text:
              "### API Spec #2 (OAuth2 + MCP APIs 요약)\n\n" +
              SPEC2_MD +
              "\n\n---\n\n" +
              "원본 Word 파일(docx)은 다음 리소스로 접근할 수 있습니다:\n" +
              `- ${DOC2_URI}\n` +
              "요약 텍스트 리소스는 다음 URI로 접근할 수 있습니다:\n" +
              `- ${MD2_URI}\n`,
          },
        ],
      };
    }
  );

  return server.server;
}
