import { Message, Task } from "../api";
import {
  getMessageIntegrationLink,
  getTaskIntegrationLink,
  integrationLinksByMessageId,
} from "./integrationLinks";

export function getTaskJiraLink(task: Task) {
  return getTaskIntegrationLink(task, "jira");
}

export function jiraLinksByMessageId(tasks: Task[]) {
  return integrationLinksByMessageId(tasks, "jira");
}

export function getMessageJiraLink(message: Message, byMessageId: Map<string, import("../api").ExternalLink>) {
  return getMessageIntegrationLink(message, "jira", byMessageId);
}
