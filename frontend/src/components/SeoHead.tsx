import { useEffect } from "react";
import { absoluteUrl, SITE } from "../config/site";

type PageMeta = {
  title?: string;
  description?: string;
  path?: string;
  noindex?: boolean;
};

function setMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(href: string) {
  let el = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

/** Обновляет title и meta для SPA-страниц (краулеры без JS читают index.html). */
export function SeoHead({ title, description, path = "/", noindex }: PageMeta) {
  const pageTitle = title || SITE.title;
  const pageDesc = description || SITE.description;
  const url = absoluteUrl(path);
  const image = absoluteUrl(SITE.ogImagePath);

  useEffect(() => {
    document.title = pageTitle;
    document.documentElement.lang = "ru";

    setMeta("name", "description", pageDesc);
    setMeta("name", "keywords", SITE.keywords);
    setMeta("name", "robots", noindex ? "noindex, nofollow" : "index, follow");

    setMeta("property", "og:type", "website");
    setMeta("property", "og:site_name", SITE.name);
    setMeta("property", "og:title", pageTitle);
    setMeta("property", "og:description", pageDesc);
    setMeta("property", "og:locale", SITE.locale);
    if (url.startsWith("http")) {
      setMeta("property", "og:url", url);
    }
    if (image.startsWith("http")) {
      setMeta("property", "og:image", image);
      setMeta("property", "og:image:width", "1200");
      setMeta("property", "og:image:height", "630");
      setMeta("property", "og:image:alt", SITE.name);
    }

    setMeta("name", "twitter:card", SITE.twitterCard);
    setMeta("name", "twitter:title", pageTitle);
    setMeta("name", "twitter:description", pageDesc);
    if (image.startsWith("http")) {
      setMeta("name", "twitter:image", image);
    }

    if (url.startsWith("http")) {
      setCanonical(url);
    }
  }, [pageTitle, pageDesc, url, image, noindex]);

  return null;
}
