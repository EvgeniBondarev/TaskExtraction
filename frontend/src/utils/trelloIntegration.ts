import { Message, Task } from "../api";
import {
  getMessageIntegrationLink,
  getTaskIntegrationLink,
  integrationLinksByMessageId,
} from "./integrationLinks";

export function getTaskTrelloLink(task: Task) {
  return getTaskIntegrationLink(task, "trello");
}

export function trelloLinksByMessageId(tasks: Task[]) {
  return integrationLinksByMessageId(tasks, "trello");
}

export function getMessageTrelloLink(message: Message, byMessageId: Map<string, import("../api").ExternalLink>) {
  return getMessageIntegrationLink(message, "trello", byMessageId);
}
