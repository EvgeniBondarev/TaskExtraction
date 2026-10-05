import type { PrivacyMessages } from "../types";

export const privacyEn: PrivacyMessages = {
  metaTitle: "Privacy policy · TaskExtraction",
  metaDescription:
    "What data TaskExtraction processes: your Google account, messages from connected Telegram groups, tasks and integration settings. Who receives it and how to delete it.",
  title: "Privacy policy",
  back: "Home",
  updated: "Version of October 5, 2026",
  summaryTitle: "In short",
  summary: [
    "Sign-in with Google: the service receives your name, email and profile photo. Gmail, Drive and contacts are not accessible.",
    "The bot only reads groups you add it to and direct chats you allow in Telegram Business.",
    "Message text is sent to an AI model via OpenRouter to find tasks in it.",
    "Data is never sold or used for advertising.",
    "You can have everything deleted on request in Telegram: @Burn1ngSnow.",
  ],
  tocTitle: "Contents",
  contactLabel: "Questions about data",
  sections: [
    {
      id: "operator",
      title: "Who processes the data",
      paragraphs: [
        "TaskExtraction (task-extraction.ru) is a web service that finds requests in Telegram work chats and tracks them on a kanban board. The data controller is the service administrator. For any questions about your data, write in Telegram: @Burn1ngSnow.",
        "If you self-host TaskExtraction with Docker, you are the data controller for your installation. In that case this policy describes how the software works.",
      ],
    },
    {
      id: "data",
      title: "What data we receive",
      items: [
        "Google account: name, email, profile photo and Google's internal ID. The service has no access to Gmail, Drive or contacts.",
        "Telegram messages: text, time, author name and ID, group title and avatar, attachments (photos, videos, documents, voice). Only from groups you added the bot to and direct chats allowed in Telegram Business.",
        "Data created by you and the model: tasks, statuses, descriptions, assignees, chat replies, message analysis results.",
        "Integration settings: URLs, logins and tokens for Jira, Trello, GitHub and Slack. Tokens are stored encrypted.",
        "Technical visit data: a random browser ID, landing page, referrer and UTM tags, IP address and browser type.",
      ],
    },
    {
      id: "purposes",
      title: "Why we need it",
      items: [
        "Signing in and a separate workspace for every user.",
        "Analyzing messages and creating task cards.",
        "Sending tasks to connected trackers and bot replies to the original chat.",
        "Website visit statistics, to understand where users come from.",
        "Security and troubleshooting.",
      ],
    },
    {
      id: "basis",
      title: "Legal basis and your consent",
      paragraphs: [
        "We process data based on the consent you give when signing in and to provide the service you use.",
        "In groups the bot sees messages from all members. By adding the bot you confirm that you are allowed to do so and that group members know about it. Do not connect chats whose content you are not ready to have processed on the service's server.",
      ],
    },
    {
      id: "sharing",
      title: "Who receives the data",
      items: [
        "Google: for signing in.",
        "Telegram: delivering messages to the bot and sending bot replies.",
        "OpenRouter (openrouter.ai) and the model provider chosen there: message text and a short context for analysis. Their servers may be outside Russia, which is a cross-border transfer.",
        "Jira, Trello, GitHub, Slack: only if you connected them yourself. Task content, links and, if enabled, attachments are sent.",
        "The hosting provider whose servers run the service.",
      ],
      paragraphs: ["We do not sell data or share it with advertising networks."],
    },
    {
      id: "storage",
      title: "Where and how long it is stored",
      paragraphs: [
        "Each workspace's data is kept in a separate database on the service's server for as long as you use it.",
        "Disconnecting a group stops collecting its messages, removing an integration erases its token. Tasks and messages collected earlier stay in your workspace.",
        "You can request full deletion of your workspace and visit statistics. We complete it within 30 days.",
      ],
    },
    {
      id: "cookies",
      title: "Cookies and browser storage",
      items: [
        "te_session: sign-in session cookie, kept for 30 days. The panel does not work without it.",
        "localStorage: chosen theme and language, flags for hints you have seen and a random browser ID for visit statistics.",
        "sessionStorage: the current visit ID and UTM tags.",
      ],
      paragraphs: ["There are no advertising or third-party trackers on the site."],
    },
    {
      id: "security",
      title: "How we protect data",
      paragraphs: [
        "The connection is protected with HTTPS, integration tokens are encrypted, every workspace has its own database, and users cannot see each other's data.",
        "The service administrator technically has access to the server and uses it only to keep the service running and on your request.",
      ],
    },
    {
      id: "rights",
      title: "Your rights",
      paragraphs: [
        "You can find out what data about you the service holds, correct it, delete it or withdraw consent. Write to @Burn1ngSnow in Telegram and include the email of your Google account.",
        "Some actions are available right in the panel: sign out, pause or disconnect a group, remove an integration, turn off bot replies in chats.",
      ],
    },
    {
      id: "changes",
      title: "Changes to this policy",
      paragraphs: ["If we change how data is processed, the new version will appear on this page with a new date."],
    },
  ],
};
