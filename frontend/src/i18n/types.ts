export type Locale = "ru" | "en";

export type FaqItem = {
  question: string;
  answer: string;
};

import type { landingRu } from "./locales/landing.ru";
import type { panelRu } from "./locales/panel.ru";
import type { settingsEn } from "./locales/settings.en";

type DeepString<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? readonly DeepString<U>[]
    : T extends object
      ? { [K in keyof T]: DeepString<T[K]> }
      : T;

export type SettingsMessages = DeepString<typeof settingsEn>;

export type PlaygroundVerdict = "task" | "question" | "noise";

export type PlaygroundMessage = {
  author: string;
  time: string;
  text: string;
  verdict: PlaygroundVerdict;
  title?: string;
  type?: string;
  priority?: string;
  due?: string;
};

export type PanelMessages = DeepString<typeof panelRu>;

type LandingCopy = DeepString<typeof landingRu>;

export type LandingMessages = Omit<LandingCopy, "playground"> & {
  playground: Omit<LandingCopy["playground"], "messages"> & {
    messages: readonly PlaygroundMessage[];
  };
};

export type Messages = {
  meta: {
    title: string;
    description: string;
    shareTitle: string;
    shareDescription: string;
    keywords: string;
    ogImageAlt: string;
    locale: string;
  };
  lang: {
    label: string;
    ru: string;
    en: string;
  };
  nav: {
    home: string;
    homeTitle: string;
    features: string;
    how: string;
    guide: string;
    faq: string;
    contact: string;
    toApp: string;
    try: string;
    mainNav: string;
    tasks: string;
    feed: string;
    settings: string;
    about: string;
    aboutProduct: string;
    logout: string;
    logoutTitle: string;
    logoutPanel: string;
    logoutPanelTitle: string;
    tasksUnread: string;
    feedUnread: string;
    tasksNew: string;
    feedNew: string;
  };
  landing: LandingMessages;
  panel: PanelMessages;
  faq: { items: FaqItem[] };
  app: {
    chatsTitle: string;
    chatsLead: string;
    chatsSubmit: string;
    chatLoadTitle: string;
    chatLoadTitleSync: string;
    chatLoadHint: string;
    chatLoadFootnote: string;
    chatLoadPreviewSub: string;
    chatLoadSteps: string[];
    intEyebrow: string;
    intTitle: string;
    intLead: string;
    intSteps: string[];
    intFootnote: string;
    intSetup: string;
    intSkip: string;
  };
  kanban: {
    inbox: string;
    inProgress: string;
    done: string;
    archive: string;
  };
  feed: {
    pageTitle: string;
    pageLead: string;
    statsAria: string;
    statMessages: string;
    statCandidates: string;
    connectedChats: string;
    connectedChatsHint: string;
    searchPlaceholder: string;
    searchAria: string;
    searchClear: string;
    searchMeta: string;
    emptyNoMessages: string;
    emptyNoMessagesHint: string;
    emptyNoResults: string;
    emptyNoResultsHint: string;
    newPill: string;
    unknownUser: string;
    mediaNoText: string;
    openTelegram: string;
    creatingTask: string;
    createTask: string;
    loadingSkeleton: string;
  };
  auth: {
    title: string;
    lead: string;
    consentLabel: string;
    consentRequired: string;
    saveCredentialsFirst: string;
    privacyLink: string;
    qrHint: string;
    qrScanNote: string;
    qrExpired: string;
    showQr: string;
    refreshQr: string;
    consentHint: string;
    phoneTab: string;
    phoneHint: string;
    phoneCodeHint: string;
    phone2faHint: string;
    phoneSendCode: string;
    phoneResendCode: string;
    phoneInvalid: string;
    phoneOtherNumber: string;
    qrTab: string;
  };
  privacy: {
    metaTitle: string;
    metaDescription: string;
    title: string;
    back: string;
    updated: string;
    sections: Array<{ title: string; paragraphs: string[] }>;
  };
  settings: SettingsMessages;
};
