import { useEffect } from "react";
import { absoluteUrl, hasPublicSiteUrl, SITE } from "../config/site";

type PageMeta = {
  /** Заголовок вкладки; для OG по умолчанию — shareTitle */
  title?: string;
  /** Meta description; для OG по умолчанию — shareDescription */
  description?: string;
  path?: string;
  noindex?: boolean;
  /** false — og:title/description как у вкладки, не карточки мессенджера */
  useSharePreview?: boolean;
};

function setMeta(attr: "name" | "property" | "itemprop", key: string, content: string) {
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
  el.href = href;
}

function setLinkRel(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

/**
 * Обновляет title и meta для SPA.
 * Краулеры мессенджеров (Telegram) читают статический index.html при сборке —
 * задайте VITE_SITE_URL=https://ваш-домен.
 */
export function SeoHead({
  title,
  description,
  path = SITE.welcomePath,
  noindex,
  useSharePreview = true,
}: PageMeta) {
  const tabTitle = title || SITE.title;
  const tabDesc = description || SITE.description;
  const ogTitle = useSharePreview ? SITE.shareTitle : tabTitle;
  const ogDesc = useSharePreview ? SITE.shareDescription : tabDesc;
  const url = absoluteUrl(path);
  const image = absoluteUrl(SITE.ogImagePath);
  const publicUrl = hasPublicSiteUrl();

  useEffect(() => {
    document.title = tabTitle;
    document.documentElement.lang = "ru";

    setMeta("name", "description", tabDesc);
    setMeta("name", "keywords", SITE.keywords);
    setMeta("name", "robots", noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large");

    setMeta("property", "og:type", "website");
    setMeta("property", "og:site_name", SITE.siteName);
    setMeta("property", "og:title", ogTitle);
    setMeta("property", "og:description", ogDesc);
    setMeta("property", "og:locale", SITE.locale);

    if (publicUrl) {
      setMeta("property", "og:url", url);
      setMeta("property", "og:image", image);
      setMeta("property", "og:image:secure_url", image);
      setMeta("property", "og:image:type", "image/png");
      setMeta("property", "og:image:width", String(SITE.ogImageWidth));
      setMeta("property", "og:image:height", String(SITE.ogImageHeight));
      setMeta("property", "og:image:alt", SITE.ogImageAlt);
      setCanonical(url);
      setLinkRel("image_src", image);
    }

    setMeta("name", "twitter:card", SITE.twitterCard);
    setMeta("name", "twitter:title", ogTitle);
    setMeta("name", "twitter:description", ogDesc);
    if (publicUrl) {
      setMeta("name", "twitter:image", image);
      setMeta("name", "twitter:image:alt", SITE.ogImageAlt);
    }

    setMeta("itemprop", "name", ogTitle);
    setMeta("itemprop", "description", ogDesc);
    if (publicUrl) {
      setMeta("itemprop", "image", image);
    }
  }, [tabTitle, tabDesc, ogTitle, ogDesc, url, image, noindex, publicUrl]);

  return null;
}
