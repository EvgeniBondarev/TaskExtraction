import type { Messages } from "../types";
import { settingsEn } from "./settings.en";

const messages: Messages = {
  meta: {
    title: "TaskExtraction — AI task manager for Telegram",
    description:
      "AI system to extract tasks from Telegram chats without tags or keywords: Kanban board, message feed, integrations with Jira, Trello, GitHub Issues, and Slack.",
    shareTitle: "TaskExtraction — Telegram tasks in one panel",
    shareDescription:
      "Write in Telegram — execute everywhere. AI finds action items in chat without hashtags. Kanban, feed, and export to Jira, Trello, GitHub, and Slack. Get started in 5 minutes.",
    keywords:
      "telegram tasks, task extraction, kanban, jira, trello, slack, github issues, llm, support, taskextraction, ai task manager",
    ogImageAlt: "TaskExtraction — Write in Telegram, execute everywhere",
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
  landing: {
    heroSlogan: "Write in Telegram — execute everywhere",
    heroTitle: "Tasks from Telegram —",
    heroTitleAccent: "in one panel",
    heroLead:
      "TaskExtraction connects to work chats, extracts action items from plain messages via LLM — no tags or keywords — and tracks them on a Kanban board. Export to Jira, Trello, GitHub Issues, and Slack.",
    try: "Try it",
    guideLink: "Beginner's guide",
    howBadge: "Flow",
    howTitle: "How the process works",
    howLead:
      "From an incoming message to a record in an external system — four steps with no manual copy-paste between services.",
    demoAria: "Product demo",
    demoBadge: "Demo",
    demoTitle: "See the panel in action",
    demoLead:
      "Screen recording: from a Telegram message to a board task — no manual copy-paste.",
    demoVideoAria: "TaskExtraction demonstration",
    statsAiSub: "automatic task detection without tags or keywords",
    statsChats: "Telegram chats",
    statsIntegrations: "Integrations with external tools",
    statsStartSub: "min to get started",
    caseBadge: "Scenario",
    caseTitle: "How it works — online store example",
    caseLead:
      "From a customer message to a board task or assignee ticket — four steps with no manual transfer.",
    caseQuoteLabel: "Message in chat",
    guideBadge: "Beginner's guide",
    guideTitle: "From zero to your first task in 5 minutes",
    guideLead:
      "Step-by-step — same as the setup wizard in the app. Follow the order and the panel will work from the first chat message.",
    guideCtaText: "Ready? The setup wizard will walk you through steps 1–3 automatically.",
    guideCtaButton: "Start setup",
    faqBadge: "FAQ",
    faqTitle: "Frequently asked questions",
    faqLead: "Answers about the product, integrations, and launch — for support and engineering teams.",
    contactTitle: "Questions about setup and usage",
    contactLead: "Message on Telegram — help with chats, LLM, and integrations.",
    contactTelegramSmall: "Open in Telegram",
    footerTitle: "Launch the panel",
    footerLead: "Run the setup wizard: API keys, Telegram login, chat selection.",
    footerNote: "Deploy with Docker · data stays on your server",
    footerNav: "Page sections",
  },
  heroDiagram: {
    aria: "Flow: Telegram messages are processed by the service and sent to integrations",
    telegram: {
      title: "Telegram",
      user: "User",
      messages: [
        { text: "Sales report due Friday", time: "09:41" },
        { text: "Client call tomorrow 2 PM", time: "09:42" },
        { text: "Check payment status", time: "09:43" },
      ],
    },
    service: {
      title: "TaskExtraction",
      sub: "AI & Kanban",
      step1Title: "Processing",
      step2Title: "Kanban",
      step3Title: "Integrations",
      step3Text: "→ Jira, Trello, GitHub, Slack",
      tags: ["Tasks", "Meetings", "Reminders", "Projects"],
      kanbanCols: ["Backlog", "In progress", "Done"],
    },
    integrations: {
      jira: { name: "Jira", sub: "Projects" },
      trello: { name: "Trello", sub: "Boards" },
      github: { name: "GitHub", sub: "Issues" },
      slack: { name: "Slack", sub: "Alerts" },
    },
  },
  guide: {
    steps: [
      {
        step: 1,
        title: "Telegram API keys",
        time: "3 min",
        body: "Go to my.telegram.org → API development tools. Copy api_id and api_hash into app settings.",
        tip: "Keys are stored encrypted on the server.",
        link: "https://my.telegram.org/apps",
        linkLabel: "Open my.telegram.org",
      },
      {
        step: 2,
        title: "Account login",
        time: "2 min",
        body: "Scan the QR code in Telegram — like linking a device in the regular client.",
        tip: "Session is saved: no need to log in again.",
      },
      {
        step: 3,
        title: "Choose chats",
        time: "1 min",
        body: "Select support groups and channels to extract tasks from. You can add several at once.",
        tip: "Already active chats are shown first.",
      },
      {
        step: 4,
        title: "LLM setup",
        time: "5 min",
        body: "Set API key and model (OpenAI-compatible endpoint). Optionally edit the task extraction prompt.",
        tip: "Without LLM, classification and task creation do not work.",
      },
      {
        step: 5,
        title: "Integrations (optional)",
        time: "10 min",
        body: "Connect Jira, Trello, GitHub Issues, or Slack — new tasks can go to your tools automatically.",
        tip: "Enable auto-push on the integration card.",
      },
      {
        step: 6,
        title: "Working in the panel",
        time: "∞",
        body: "Feed — all messages with real-time classification. Tasks — Kanban Inbox → In progress → Done → Archive.",
        tip: "Click a card for details and links to external tickets.",
      },
    ],
  },
  flow: {
    aria: "How the product works",
    stepLabel: "Step",
    integrations: "Supported integrations",
    steps: [
      { title: "Incoming message", sub: "Group or channel you monitor" },
      { title: "LLM classification", sub: "No tags — task, question, or noise" },
      { title: "Panel and Kanban", sub: "Task card and contextual feed" },
      { title: "Sync", sub: "Automatic push to external systems" },
    ],
  },
  case: {
    flow: {
      aria: "Scenario animation: message, AI processing, task, integrations",
      panelCaption: "What happens as you scroll",
      aiLabel: "AI classification",
      taskBadge: "Inbox",
      steps: [
        "Message in chat",
        "Sent to service",
        "LLM processing",
        "Task on board",
        "Push to services",
      ],
    },
    steps: [
      {
        num: "1",
        title: "Customer writes in chat",
        body: "A support group for an online store gets a normal message — no #task, no bot commands.",
        quote: "Order #4821 never arrived — please check delivery status",
      },
      {
        num: "2",
        title: "Service recognizes the request",
        body: "TaskExtraction sends the text to an LLM. The model understands this is a team task, not just a question.",
        outcome: "A card appears in Inbox with text, author, and a link to the message",
      },
      {
        num: "3",
        title: "Manager works the task on the board",
        body: "Support opens Tasks, moves the card across columns, and opens details in a modal when needed.",
        bullets: [
          "Inbox → In progress → Done",
          "Full thread is saved — no copy-paste from Telegram",
        ],
      },
      {
        num: "4",
        title: "Hand off to owner or tracker",
        body: "With auto-push, a ticket is created in Jira / Trello and Slack is notified. Or tap Send manually from the card.",
      },
    ],
  },
  faq: {
    items: [
      {
        question: "What is TaskExtraction?",
        answer:
          "A web panel that connects to Telegram work chats, finds action items in plain messages with an LLM, and tracks them on a Kanban board. Tasks can be exported to Jira, Trello, GitHub Issues, and Slack.",
      },
      {
        question: "Do I need hashtags or special commands in chat?",
        answer:
          "No. The system reads normal text: “due by Friday”, “payment broken”, “add a button” — without #task and without bots in the chat.",
      },
      {
        question: "Which integrations are supported?",
        answer:
          "Jira, Trello, GitHub Issues, and Slack. After a task is created in the panel, you can send it externally or enable automatic export.",
      },
      {
        question: "Where is data stored?",
        answer:
          "With Docker deployment, data (DB, media, Telegram session) stays on your server in the attached volume. API keys and tokens are encrypted.",
      },
      {
        question: "How long does setup take?",
        answer:
          "About 5–15 minutes: my.telegram.org keys, Telegram login, chat selection, and LLM setup. See the beginner's guide on this page.",
      },
      {
        question: "Is it suitable for a support team?",
        answer:
          "Yes. Multiple operators can use one panel; each user signs in with their own Telegram API keys. Messages from selected chats go to the feed and Inbox.",
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
    intEyebrow: "Done — Telegram connected",
    intTitle: "Where should tasks go?",
    intLead:
      "Connect integrations: new tasks from chats can be created in trackers automatically or duplicated to Slack.",
    intSetup: "Set up integrations",
    intSkip: "Later",
  },
  kanban: {
    inbox: "Inbox",
    inProgress: "In progress",
    done: "Done",
    archive: "Archive",
  },
  auth: {
    title: "Sign in with Telegram",
    lead: "Scan the QR code in Telegram — we only process messages in chats you select.",
    consentLabel:
      "I connect my Telegram account and agree to processing messages in selected support chats according to the",
    consentRequired: "Please confirm consent to continue",
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
