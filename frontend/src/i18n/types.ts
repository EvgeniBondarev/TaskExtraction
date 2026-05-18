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
  guide: { steps: GuideStep[] };
  flow: { steps: FlowStep[]; aria: string; stepLabel: string; integrations: string };
  case: { steps: CaseStep[] };
  faq: { items: FaqItem[] };
  app: {
    chatsTitle: string;
    chatsLead: string;
    chatsSubmit: string;
    intEyebrow: string;
    intTitle: string;
    intLead: string;
    intSetup: string;
    intSkip: string;
  };
  kanban: {
    inbox: string;
    inProgress: string;
    done: string;
    archive: string;
  };
};
