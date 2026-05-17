import { ExternalLink, Message, Task } from "../api";

export function getTaskIntegrationLink(task: Task, provider: string): ExternalLink | null {
  return task.external_links.find((l) => l.provider === provider) ?? null;
}

export function integrationLinksByMessageId(
  tasks: Task[],
  provider: string
): Map<string, ExternalLink> {
  const map = new Map<string, ExternalLink>();
  for (const task of tasks) {
    const link = getTaskIntegrationLink(task, provider);
    if (link && task.source_message_id) {
      map.set(task.source_message_id, link);
    }
  }
  return map;
}

export function getMessageIntegrationLink(
  message: Message,
  provider: "jira" | "trello" | "github" | "slack",
  byMessageId: Map<string, ExternalLink>
): ExternalLink | null {
  if (provider === "jira" && message.jira_url) {
    return {
      id: "",
      provider: "jira",
      external_id: message.jira_issue_key || "",
      url: message.jira_url,
    };
  }
  if (provider === "trello" && message.trello_url) {
    return {
      id: "",
      provider: "trello",
      external_id: message.trello_card_id || "",
      url: message.trello_url,
    };
  }
  if (provider === "github" && message.github_url) {
    return {
      id: "",
      provider: "github",
      external_id: message.github_issue_number || "",
      url: message.github_url,
    };
  }
  if (provider === "slack" && message.slack_url) {
    return {
      id: "",
      provider: "slack",
      external_id: message.slack_message_id || "",
      url: message.slack_url,
    };
  }
  return byMessageId.get(message.id) ?? null;
}
