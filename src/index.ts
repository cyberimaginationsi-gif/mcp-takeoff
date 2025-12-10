import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// Optional: Define configuration schema to require configuration at connection time
export const configSchema = z.object({
  debug: z.boolean().default(false).describe("Enable debug logging"),
});

export default function createStatelessServer({
  config,
}: {
  config: z.infer<typeof configSchema>;
}) {
  const server = new McpServer({
    name: "mcp-takeoff",
    version: "1.0.0",
  });

  // Add a tool
  server.tool(
    "get_latest_posts",
    "Get the latest AI issue posts from the Takeoff API",
    {},
    async () => {
      try {
        const result = await makeTakeoffRequest("posts");
        return {
          content: [
            {
              type: "text",
              text: result
                ? JSON.stringify(result, null, 2)
                : "Failed to fetch posts",
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching posts: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "get_latest_weekly_news",
    "Get the latest weekly news from the Takeoff API",
    {},
    async () => {
      try {
        const result = await makeTakeoffRequest("weeklynews");
        return {
          content: [
            {
              type: "text",
              text: result
                ? JSON.stringify(result, null, 2)
                : "Failed to fetch posts",
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching weekly news: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  return server.server;
}

async function makeTakeoffRequest(endpoint: string) {
  const response = await fetch(`https://ai-takeoff.dev/api/${endpoint}`, {
    headers: {
      "User-Agent": "mcp-takeoff/1.0",
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${endpoint}: ${response.statusText}`);
  }
  return response.json();
}
