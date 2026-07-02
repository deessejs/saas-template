import { defineTool } from "eve/tools";
import { z } from "zod";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

const MEMORY_ROOT = join(process.cwd(), "..", "..", ".claude", "agent-memory", "tech-lead");

export default defineTool({
  description:
    "Read a tech-lead memory entry or the memory index. Pass a memory name (without .md) to read that entry, or 'index' / nothing to read MEMORY.md.",
  inputSchema: z.object({
    name: z.string().optional().describe(
      "Memory name without .md (e.g. 'template-strategy'). Omit or pass 'index' to read MEMORY.md.",
    ),
  }),
  async execute({ name }) {
    try {
      if (!name || name === "index") {
        const index = await readFile(join(MEMORY_ROOT, "MEMORY.md"), "utf-8");
        return { type: "index", content: index };
      }

      const filePath = join(MEMORY_ROOT, `${name}.md`);
      const content = await readFile(filePath, "utf-8");
      return { type: "entry", name, content };
    } catch {
      // Try listing available entries
      const entries = await readdir(MEMORY_ROOT).catch(() => []);
      const memFiles = entries
        .filter((f) => f.endsWith(".md") && f !== "MEMORY.md")
        .map((f) => f.replace(/\.md$/, ""));
      return {
        type: "not_found",
        name: name ?? "index",
        available: memFiles,
        hint: "MEMORY.md not found or empty. The tech-lead memory directory may not be initialized yet.",
      };
    }
  },
});
