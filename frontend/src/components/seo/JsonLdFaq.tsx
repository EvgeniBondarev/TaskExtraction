import { useEffect } from "react";
import { FAQ_ITEMS } from "../../../seo.config";
import { absoluteUrl, SITE } from "../../config/site";

const SCRIPT_ID = "te-jsonld-faq";

export function JsonLdFaq() {
  useEffect(() => {
    const pageUrl = absoluteUrl(SITE.welcomePath);
    const payload = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ_ITEMS.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
      url: pageUrl,
    };

    let el = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (!el) {
      el = document.createElement("script");
      el.id = SCRIPT_ID;
      el.type = "application/ld+json";
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(payload);

    return () => {
      el?.remove();
    };
  }, []);

  return null;
}
