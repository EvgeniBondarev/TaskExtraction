import { Message, Task } from "../api";
import {
  getMessageIntegrationLink,
  getTaskIntegrationLink,
  integrationLinksByMessageId,
} from "./integrationLinks";

export function getTaskSlackLink(task: Task) {
  return getTaskIntegrationLink(task, "slack");
}

export function slackLinksByMessageId(tasks: Task[]) {
  return integrationLinksByMessageId(tasks, "slack");
}

export function getMessageSlackLink(
  message: Message,
  byMessageId: Map<string, import("../api").ExternalLink>
) {
  return getMessageIntegrationLink(message, "slack", byMessageId);
}
