import { useMemo } from "react";
import { absoluteUrl, SITE } from "../../config/site";
import { useI18n } from "../../i18n";

export function JsonLdFaq() {
  const { messages } = useI18n();

  const json = useMemo(
    () =>
      JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: messages.faq.items.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      }),
    [messages.faq.items],
  );

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
      // canonical for FAQ block on welcome page
      data-page={absoluteUrl(SITE.welcomePath)}
    />
  );
}
