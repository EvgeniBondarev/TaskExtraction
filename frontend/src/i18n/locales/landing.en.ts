import type { LandingMessages } from "../types";

export const landingEn: LandingMessages = {
  nav: {
    aria: "Page sections",
    example: "Example",
    setup: "Setup",
    faq: "Questions",
    homeTitle: "Home",
  },
  cta: {
    open: "Open the panel",
    example: "See an example",
  },
  hero: {
    title: "Tasks from Telegram on one board",
    lead: "A bot reads your work groups, tells requests apart from chatter and creates cards. No tags, no commands.",
    videoLabel: "Screen recording: the TaskExtraction task board",
  },
  strip: {
    label: "Source and export",
  },
  playground: {
    title: "Click a message and see what happens to it",
    lead: "A walkthrough with prepared answers. In the panel your model does the same with real messages.",
    chatTitle: "Store support",
    chatMeta: "work group",
    pick: "Pick a message in the chat",
    pickHint: "It gets the same treatment as in the panel: task or not, and a filled-in card.",
    verdict: {
      task: "Task",
      question: "Question",
      noise: "Off-topic",
    },
    verdictNote: {
      task: "Card created in Inbox",
      question: "No task created, the message stays in the feed",
      noise: "Skipped, marked as noise in the feed",
    },
    fields: {
      title: "Title",
      type: "Type",
      priority: "Priority",
      due: "Due",
    },
    columns: {
      inbox: "Inbox",
      progress: "In progress",
      done: "Done",
    },
    actions: {
      start: "Start work",
      finish: "Close task",
      reopen: "Reopen",
    },
    bot: "TaskExtraction Bot",
    replies: {
      progress: "In progress",
      done: "Done",
      reopened: "Back in progress",
    },
    replyNote: "This is how the bot replies to the original message when the card changes column.",
    pushed: "Sent to",
    empty: "Empty",
    resultAria: "Analysis result",
    messages: [
      {
        author: "Megan Doyle",
        time: "09:41",
        text: "Order 4821 still hasn't arrived, the customer has been waiting since Monday. Can someone check the delivery?",
        verdict: "task",
        title: "Check delivery of order 4821",
        type: "Delivery",
        priority: "High",
        due: "Today",
      },
      {
        author: "Tom Brennan",
        time: "09:44",
        text: "Anyone know when the warehouse closes today?",
        verdict: "question",
      },
      {
        author: "Priya Nair",
        time: "09:52",
        text: "Since the update the cart won't open on iOS, screenshot below",
        verdict: "task",
        title: "Cart does not open on iOS after update",
        type: "Bug",
        priority: "High",
        due: "Not set",
      },
      {
        author: "Lukas Weber",
        time: "10:03",
        text: "Thanks for the week everyone, have a good weekend!",
        verdict: "noise",
      },
      {
        author: "Megan Doyle",
        time: "10:15",
        text: "We need Apple Pay at checkout by the end of the month, finance is ready",
        verdict: "task",
        title: "Add Apple Pay at checkout",
        type: "Feature",
        priority: "Medium",
        due: "October 31",
      },
    ],
  },
  setup: {
    title: "Setup without access to your account",
    lead: "Sign in with Google. The service never asks for your Telegram number, a QR code or a password.",
    steps: [
      {
        title: "Sign in with Google",
        body: "Every user gets a separate workspace. Tasks, chats and settings are not visible to others.",
      },
      {
        title: "Add the bot to a work group",
        body: "Your personal link is in settings. The bot reads only the groups you add it to.",
      },
      {
        title: "Connect direct chats if you need them",
        body: "With Telegram Business the bot only receives the chats you allow.",
      },
      {
        title: "Connect a tracker",
        body: "Jira, Trello, GitHub Issues or Slack. New tasks go there automatically or with one click.",
      },
    ],
  },
  features: {
    title: "What happens after a task is found",
    card: {
      title: "A card with the full context",
      body: "Author, original text, attachments and links to tickets in external trackers.",
      alt: "Task window in the panel: author, description, attachment and links to Jira, Trello, GitHub and Slack",
    },
    replies: {
      title: "The bot posts status updates to the chat",
      body: "Start or close a task and the author sees it right in Telegram.",
    },
    answer: {
      title: "Reply to the customer from the card",
      body: "Write a reply in the task and it goes to the original chat with a link to the card.",
    },
    board: {
      title: "Board: Inbox, In progress, Done, Archive",
      body: "Drag cards between columns. The model sets priority and type for you.",
      alt: "In progress and Done columns with task cards",
    },
    prompt: {
      title: "Your own rules",
      body: "Use the built-in model key or your own. Edit the prompt and confidence threshold in settings.",
    },
  },
  privacy: {
    title: "What the bot sees and what it doesn't",
    seesTitle: "Sees",
    sees: [
      "Messages in groups you added it to",
      "Direct chats allowed in Telegram Business",
      "Attachments from those messages",
    ],
    hiddenTitle: "Doesn't see",
    hidden: [
      "Your other chats and channels",
      "Your phone number and Telegram password",
      "Tasks and settings of other users",
    ],
    note: "Integration tokens are stored encrypted. You can also self-host the service with Docker.",
  },
  faq: {
    title: "Questions",
  },
  closing: {
    title: "Connect your first group today",
    lead: "You need a Google account and a work group in Telegram.",
    contact: "Questions about setup:",
  },
  footer: {
    privacy: "Privacy policy",
    rights: "TaskExtraction",
  },
};
