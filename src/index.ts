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
  "# API Spec #2",
  "",
  "이 문서는 두 번째 API 스펙 문서입니다.",
  "두 번째 문서 내용에 맞게 이 텍스트를 수정해 주세요.",
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

  // 2) spec-2.docx (원본 Word)
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

  // 4) spec-2.md (LLM용 텍스트, 나중에 채워도 됨)
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
    "API Spec 문서 #2 (요약 + docx 위치)를 제공합니다.",
    {},
    async () => {
      return {
        content: [
          {
            type: "text",
            text:
              "### API Spec #2 (요약)\n\n" +
              SPEC2_MD +
              "\n\n---\n\n" +
              "원본 Word 파일(docx)은 다음 리소스로 접근할 수 있습니다:\n" +
              `- ${DOC2_URI}\n`,
          },
        ],
      };
    }
  );

  return server.server;
}
