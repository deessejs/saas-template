import { defineTool } from "eve/tools";
import { z } from "zod";
import { writeFile, readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

const MEMORY_ROOT = join(process.cwd(), "..", "..", ".claude", "agent-memory", "tech-lead");

const MemoryType = z.enum(["feedback", "project", "reference"]);

export default defineTool({
  description:
    "Write or update a tech-lead memory entry. Creates the file with frontmatter and adds a link to MEMORY.md index.",
  inputSchema: z.object({
    name: z.string().describe(
      "Short slug for the memory (kebab-case, no spaces, no .md). E.g. 'pnpm-catalog-rule'.",
    ),
    description: z.string().describe("One-line summary for the MEMORY.md index."),
    type: z.enum(["feedback", "project", "reference"]).describe("Memory type."),
    body: z.string().describe(
      "Full memory content. Use **Why:** and **How to apply:** sections for feedback/project types. Link to related memories with [[name]] syntax.",
    ),
  }),
  async execute({ name, description, type, body }) {
    const fileName = `${name}.md`;
    const filePath = join(MEMORY_ROOT, fileName);

    const frontmatter = [
      "---",
      `name: ${name}`,
      `description: ${description}`,
      "metadata:",
      `  type: ${type}`,
      "---",
      "",
    ].join("\n");

    const content = frontmatter + body + "\n";

    await writeFile(filePath, content, "utf-8");

    // Update MEMORY.md index
    const indexPath = join(MEMORY_ROOT, "MEMORY.md");
    const indexLine = `- [${description}](${fileName}) — ${description}`;

    try {
      const existing = await readFile(indexPath, "utf-8");
      if (!existing.includes(`[${description}](${fileName})`)) {
        await writeFile(indexPath, existing.trimEnd() + "\n" + indexLine + "\n", "utf-8");
      }
    } catch {
      // Index doesn't exist yet — create it
      await writeFile(indexPath, indexLine + "\n", "utf-8");
    }

    return {
      status: "written",
      file: fileName,
      path: filePath,
    };
  },
});
