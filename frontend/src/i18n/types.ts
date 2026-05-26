export type Locale = "ru" | "en";

export type GuideStep = {
  step: number;
  title: string;
  time: string;
  body: string;
  tip: string;
  link?: string;
  linkLabel?: string;
};

export type FlowStep = {
  title: string;
  sub: string;
};

export type CaseStep = {
  num: string;
  title: string;
  body: string;
  quote?: string;
  outcome?: string;
  bullets?: string[];
};

export type FaqItem = {
  question: string;
  answer: string;
};

export type HeroDiagramMessage = {
  text: string;
  time: string;
};

export type HeroDiagramIntegration = {
  name: string;
  sub: string;
};

import type { settingsEn } from "./locales/settings.en";

type DeepString<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? readonly DeepString<U>[]
    : T extends object
      ? { [K in keyof T]: DeepString<T[K]> }
      : T;

export type SettingsMessages = DeepString<typeof settingsEn>;

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
  landing: {
    heroSlogan: string;
    heroTitle: string;
    heroTitleAccent: string;
    heroLead: string;
    try: string;
    guideLink: string;
    howBadge: string;
    howTitle: string;
    howLead: string;
    demoAria: string;
    demoBadge: string;
    demoTitle: string;
    demoLead: string;
    demoVideoAria: string;
    statsAiSub: string;
    statsChats: string;
    statsIntegrations: string;
    statsStartSub: string;
    caseBadge: string;
    caseTitle: string;
    caseLead: string;
    caseQuoteLabel: string;
    guideBadge: string;
    guideTitle: string;
    guideLead: string;
    guideCtaText: string;
    guideCtaButton: string;
    faqBadge: string;
    faqTitle: string;
    faqLead: string;
    contactTitle: string;
    contactLead: string;
    contactTelegramSmall: string;
    footerTitle: string;
    footerLead: string;
    footerNote: string;
    footerNav: string;
  };
  heroDiagram: {
    aria: string;
    telegram: {
      title: string;
      user: string;
      messages: HeroDiagramMessage[];
    };
    service: {
      title: string;
      sub: string;
      step1Title: string;
      step2Title: string;
      step3Title: string;
      step3Text: string;
      tags: string[];
      kanbanCols: string[];
    };
    integrations: {
      jira: HeroDiagramIntegration;
      trello: HeroDiagramIntegration;
      github: HeroDiagramIntegration;
      slack: HeroDiagramIntegration;
    };
  };
  guide: { steps: GuideStep[] };
  flow: { steps: FlowStep[]; aria: string; stepLabel: string; integrations: string };
  case: {
    steps: CaseStep[];
    flow: { aria: string; panelCaption: string; aiLabel: string; taskBadge: string; steps: string[] };
  };
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
