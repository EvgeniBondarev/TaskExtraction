import { Message, Task } from "../api";
import {
  getMessageIntegrationLink,
  getTaskIntegrationLink,
  integrationLinksByMessageId,
} from "./integrationLinks";

export function getTaskGitHubLink(task: Task) {
  return getTaskIntegrationLink(task, "github");
}

export function githubLinksByMessageId(tasks: Task[]) {
  return integrationLinksByMessageId(tasks, "github");
}

export function getMessageGitHubLink(
  message: Message,
  byMessageId: Map<string, import("../api").ExternalLink>
) {
  return getMessageIntegrationLink(message, "github", byMessageId);
}
