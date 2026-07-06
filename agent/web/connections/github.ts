import { defineMcpClientConnection } from "eve/connections";

export default defineMcpClientConnection({
  url: "https://api.githubcopilot.com/mcp/",
  description:
    "GitHub API for managing repositories, issues, pull requests, code search, and file contents. Provides tools to search repositories, read files, list and create issues, list and create pull requests, and browse repository metadata.",
  auth: {
    getToken: async () => ({
      token: process.env.GH_TOKEN!,
    }),
  },
});
