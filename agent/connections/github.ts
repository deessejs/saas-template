import { defineMcpClientConnection } from "eve/connections";

export default defineMcpClientConnection({
  url: "https://api.githubcopilot.com/mcp/x/repos,issues,pull_requests",
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
      "list_issues",
      "create_issue",
      "update_issue",
      "list_pull_requests",
      "create_pull_request",
      "create_pull_request_review",
    ],
  },
});
