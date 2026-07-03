import { defineMcpClientConnection } from "eve/connections";

export default defineMcpClientConnection({
  url: "https://api.githubcopilot.com/mcp/",
  description:
    "GitHub: browse repositories, search code, manage issues and pull requests.",
  auth: {
    getToken: async () => ({
      token: process.env.GH_TOKEN!,
    }),
  },
  tools: {
    allow: [
      "search_repositories",
      "get_file_contents",
      "list_commits",
      "list_issues",
      "issue_read",
      "issue_write",
      "search_issues",
      "list_pull_requests",
      "pull_request_read",
      "create_pull_request",
    ],
  },
});
