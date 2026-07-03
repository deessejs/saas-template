import { defineTool } from "eve/tools";
import { z } from "zod";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export default defineTool({
  description:
    "Search the web or fetch a URL using the `fresh` CLI. 'search' queries web results; 'fetch' extracts content from a URL.",
  inputSchema: z.object({
    action: z.enum(["search", "fetch"]).describe("'search' for web results, 'fetch' for page content."),
    query: z.string().optional().describe("Search query (required when action is 'search')."),
    url: z.string().optional().describe("URL to fetch (required when action is 'fetch')."),
    limit: z.number().optional().default(5).describe("Max results for 'search'. Default 5."),
    prompt: z.string().optional().describe("Extraction prompt for 'fetch'. Describes what to extract."),
    maxDuration: z.number().optional().default(60).describe("Max seconds. Default 60."),
  }),
  async execute({ action, query, url, limit = 5, prompt, maxDuration = 60 }) {
    const args: string[] = [];

    if (action === "search") {
      if (!query) return { status: "error", message: "'query' is required for 'search' action." };
      args.push("search", "-q", query, "-l", String(limit));
    } else {
      if (!url) return { status: "error", message: "'url' is required for 'fetch' action." };
      args.push("fetch", url);
      if (prompt) args.push("-p", prompt);
    }

    const cmd = `fresh ${args.join(" ")}`;

    try {
      const { stdout, stderr } = await execAsync(cmd, {
        cwd: join(process.cwd(), "..", ".."),
        timeout: maxDuration * 1000,
        signal: AbortSignal.timeout(maxDuration * 1000),
      });
      return {
        status: "success",
        action,
        cmd,
        output: stdout || stderr,
      };
    } catch (err: unknown) {
      const error = err as { stdout?: string; stderr?: string; code?: number };
      return {
        status: "error",
        action,
        cmd,
        stdout: error.stdout ?? "",
        stderr: error.stderr ?? String(err),
        code: error.code,
      };
    }
  },
});

function join(...parts: string[]): string {
  return parts.join("/").replace(/\/+/g, "/");
}
