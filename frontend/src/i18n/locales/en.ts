import type { Messages } from "../types";
import { landingEn } from "./landing.en";
import { panelEn } from "./panel.en";
import { settingsEn } from "./settings.en";

const messages: Messages = {
  meta: {
    title: "TaskExtraction: tasks from Telegram on one board",
    description:
      "A bot reads your Telegram work groups, finds requests without tags or commands and tracks them on a kanban board. Export to Jira, Trello, GitHub Issues and Slack.",
    shareTitle: "TaskExtraction: tasks from Telegram on one board",
    shareDescription:
      "A bot finds requests in Telegram work chats and creates cards on a board. Status replies in the chat, export to Jira, Trello, GitHub and Slack.",
    keywords:
      "telegram tasks, task extraction, kanban, jira, trello, slack, github issues, llm, support, taskextraction, ai task manager",
    ogImageAlt: "TaskExtraction: tasks from Telegram on one board",
    locale: "en_US",
  },
  lang: { label: "Language", ru: "RU", en: "EN" },
  nav: {
    home: "Home",
    homeTitle: "Home",
    features: "Features",
    how: "How it works",
    guide: "Guide",
    faq: "FAQ",
    contact: "Contact",
    toApp: "Open app",
    try: "Try it",
    mainNav: "Navigation",
    tasks: "Tasks",
    feed: "Feed",
    settings: "Settings",
    about: "About",
    aboutProduct: "About product",
    logout: "Log out",
    logoutTitle: "Log out of account",
    logoutPanel: "Log out of panel",
    logoutPanelTitle: "Reset panel session (data is kept)",
    tasksUnread: "Tasks — unread",
    feedUnread: "Feed — unread",
    tasksNew: "new",
    feedNew: "new",
  },
  landing: landingEn,
  panel: panelEn,
  faq: {
    items: [
      {
        question: "What is TaskExtraction?",
        answer:
          "A web panel for teams that receive requests in Telegram. A bot reads your work groups, a model finds tasks in the messages, and the panel tracks them on a kanban board and sends them to Jira, Trello, GitHub Issues or Slack.",
      },
      {
        question: "Do people need hashtags or bot commands?",
        answer:
          "No. People write as usual: “check the delivery”, “the cart won't open”. The model decides whether it is a task, a question or off-topic chat.",
      },
      {
        question: "Does the service need access to my Telegram account?",
        answer:
          "No. You sign in to the panel with Google. Messages come through the bot: from groups you add it to and from direct chats you allow in Telegram Business. No phone number or QR code.",
      },
      {
        question: "How does the bot report task status?",
        answer:
          "When a card moves to In progress or Done, the bot replies to the original message in the chat. You can turn these replies off in settings. You can also write a reply from the card and it goes to the chat with a link to the task.",
      },
      {
        question: "Which integrations are supported?",
        answer:
          "Jira, Trello, GitHub Issues and Slack. For each one you can send new tasks automatically or with a button on the card.",
      },
      {
        question: "Where is the data stored?",
        answer:
          "Every user has a separate database, media and settings. Integration tokens are encrypted. You can self-host the service with Docker so the data stays in your own volume.",
      },
    ],
  },
  app: {
    chatsTitle: "Chats to monitor",
    chatsLead: "Select chats TaskExtraction will receive messages from in real time.",
    chatsSubmit: "Start monitoring",
    chatLoadTitle: "Loading chats from Telegram",
    chatLoadTitleSync: "Refreshing chat list",
    chatLoadHint:
      "If you have many groups and channels, this can take up to a minute — that's normal.",
    chatLoadFootnote: "Don't close this page — syncing with Telegram",
    chatLoadPreviewSub: "Loading…",
    chatLoadSteps: [
      "Connecting to Telegram…",
      "Fetching groups and channels…",
      "Loading titles and avatars…",
      "Processing remaining chats…",
      "Almost done…",
    ],
    intEyebrow: "Telegram connected",
    intTitle: "Where should tasks go?",
    intLead:
      "Connect integrations: new tasks from chats can be created in trackers automatically or duplicated to Slack.",
    intSteps: [
      "Jira — issues and projects…",
      "Trello — boards and cards…",
      "GitHub — issues in your repo…",
      "Slack — notifications to a channel…",
      "Connect all or only what you need…",
    ],
    intFootnote: "Integrations are always available in Settings",
    intSetup: "Set up integrations",
    intSkip: "Later",
  },
  kanban: {
    inbox: "New",
    inProgress: "In progress",
    done: "Done",
    archive: "Archive",
  },
  feed: {
    pageTitle: "Feed",
    pageLead: "Every message from connected chats in real time. The model marks the ones that are requests.",
    statsAria: "Feed statistics",
    statMessages: "messages",
    statCandidates: "can become tasks",
    connectedChats: "Connected chats",
    connectedChatsHint: "Messages from these chats will appear here automatically.",
    searchPlaceholder: "Search text, author, chat…",
    searchAria: "Search feed",
    searchClear: "Clear search",
    searchMeta: "Showing {shown} of {total}",
    emptyNoMessages: "No messages yet",
    emptyNoMessagesHint:
      "Add the bot to a work group in settings and send a message there. It shows up here within seconds.",
    emptyNoResults: "No results",
    emptyNoResultsHint: "No matches for “{query}”",
    newPill: "new",
    unknownUser: "User",
    mediaNoText: "Media without text",
    openTelegram: "Open in Telegram",
    creatingTask: "Creating…",
    createTask: "Create task",
    loadingSkeleton: "Loading feed",
  },
  auth: {
    title: "Sign in with Telegram",
    lead: "Scan the QR code in Telegram — we only process messages in chats you select.",
    consentLabel:
      "I connect my Telegram account and agree to processing messages in selected support chats according to the",
    consentRequired: "Please confirm consent to continue",
    saveCredentialsFirst:
      "Save API credentials first (my.telegram.org/apps), or set TELEGRAM_API_ID and TELEGRAM_API_HASH in the backend .env",
    privacyLink: "Privacy Policy",
    qrHint: "Telegram → Settings → Devices → Link Desktop Device",
    qrScanNote:
      "Scan the QR code with the Telegram app camera. Do not open the link — some app versions do not support it.",
    qrExpired: "QR code expired",
    showQr: "Show QR code",
    refreshQr: "Refresh QR",
    consentHint: "Check the consent box above to get the QR code",
    phoneTab: "Phone",
    phoneHint:
      "The code is delivered in the Telegram app (chat «Telegram»), not SMS. Telegram must be installed and logged in with this number.",
    phoneCodeHint: "Code from the «Telegram» chat in the app",
    phone2faHint: "Enter your two-factor authentication password",
    phoneSendCode: "Get code",
    phoneResendCode: "Resend code",
    phoneInvalid: "Enter a complete international number (e.g. +375299785592)",
    phoneOtherNumber: "← Different number",
    qrTab: "QR code",
  },
  privacy: {
    metaTitle: "Privacy Policy — TaskExtraction",
    metaDescription:
      "How TaskExtraction processes Telegram support chat messages: purposes, retention, and your rights.",
    title: "Privacy Policy",
    back: "Home",
    updated: "Effective May 26, 2026",
    sections: [
      {
        title: "1. Operator and service",
        paragraphs: [
          "TaskExtraction (task-extraction.ru) extracts tasks from Telegram support chats using automated classification (LLM) and a management panel.",
          "The operator processes data to provide the service to users who connect their Telegram account.",
        ],
      },
      {
        title: "2. Data we process",
        paragraphs: [
          "After sign-in via Telegram (QR or phone), the service accesses messages only in chats and groups you explicitly enable for monitoring.",
          "This may include: message text, metadata (time, author, chat id), attachments, Telegram profile data (name, username, id), integration settings (Jira, Trello, GitHub, Slack), technical logs, and panel session cookies.",
        ],
      },
      {
        title: "3. Purposes",
        paragraphs: [
          "Message classification and task cards; feed and kanban; sync to connected trackers; replies to source chats from the panel; security and reliability of the service.",
        ],
      },
      {
        title: "4. Legal basis and consent",
        paragraphs: [
          "By connecting Telegram you confirm you may grant access to selected chats (e.g. as a support team member) and agree to processing messages in those chats for the service.",
          "Do not connect personal chats if you do not want their content processed on the operator's servers.",
        ],
      },
      {
        title: "5. Storage and security",
        paragraphs: [
          "Data is stored on the operator's servers with encryption for API keys, integration tokens, and Telegram sessions. Retention lasts while you use the service or until deletion on request.",
          "You can stop processing by disabling chats, signing out of Telegram in settings, or ending the panel session.",
        ],
      },
      {
        title: "6. Third parties",
        paragraphs: [
          "Messages and tasks may be sent to integrations you enable (Jira, Trello, GitHub, Slack) and to the LLM provider for classification — only as needed for those features.",
          "Data is not sold or shared with ad networks.",
        ],
      },
      {
        title: "7. Your rights and contact",
        paragraphs: [
          "You may request access, correction, or deletion, or withdraw consent by contacting the operator on Telegram: @Burn1ngSnow.",
          "Material policy changes will be reflected by the date on this page.",
        ],
      },
    ],
  },
  settings: settingsEn,
};

export default messages;
