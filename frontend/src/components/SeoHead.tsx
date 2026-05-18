import { useEffect } from "react";
import { absoluteUrl, hasPublicSiteUrl, SITE } from "../config/site";
import { useI18n } from "../i18n";

type PageMeta = {
  /** Заголовок вкладки; для OG по умолчанию — shareTitle */
  title?: string;
  /** Meta description; для OG по умолчанию — shareDescription */
  description?: string;
  path?: string;
  noindex?: boolean;
  /** false — og:title/description как у вкладки, не карточки мессенджера */
  useSharePreview?: boolean;
  /** false — не подставлять meta из i18n (внутренние страницы) */
  useLocaleMeta?: boolean;
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
  useLocaleMeta = true,
}: PageMeta) {
  const { locale, messages } = useI18n();
  const meta = useLocaleMeta ? messages.meta : null;
  const tabTitle = title || meta?.title || SITE.title;
  const tabDesc = description || meta?.description || SITE.description;
  const ogTitle = useSharePreview ? meta?.shareTitle || SITE.shareTitle : tabTitle;
  const ogDesc = useSharePreview ? meta?.shareDescription || SITE.shareDescription : tabDesc;
  const keywords = meta?.keywords || SITE.keywords;
  const ogImageAlt = meta?.ogImageAlt || SITE.ogImageAlt;
  const ogLocale = meta?.locale || SITE.locale;
  const url = absoluteUrl(path);
  const image = absoluteUrl(SITE.ogImagePath);
  const publicUrl = hasPublicSiteUrl();

  useEffect(() => {
    document.title = tabTitle;
    document.documentElement.lang = locale === "en" ? "en" : "ru";

    setMeta("name", "description", tabDesc);
    setMeta("name", "keywords", keywords);
    setMeta("name", "robots", noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large");

    setMeta("property", "og:type", "website");
    setMeta("property", "og:site_name", SITE.siteName);
    setMeta("property", "og:title", ogTitle);
    setMeta("property", "og:description", ogDesc);
    setMeta("property", "og:locale", ogLocale);

    if (publicUrl) {
      setMeta("property", "og:url", url);
      setMeta("property", "og:image", image);
      setMeta("property", "og:image:secure_url", image);
      setMeta("property", "og:image:type", "image/png");
      setMeta("property", "og:image:width", String(SITE.ogImageWidth));
      setMeta("property", "og:image:height", String(SITE.ogImageHeight));
      setMeta("property", "og:image:alt", ogImageAlt);
      setCanonical(url);
      setLinkRel("image_src", image);
    }

    setMeta("name", "twitter:card", SITE.twitterCard);
    setMeta("name", "twitter:title", ogTitle);
    setMeta("name", "twitter:description", ogDesc);
    if (publicUrl) {
      setMeta("name", "twitter:image", image);
      setMeta("name", "twitter:image:alt", ogImageAlt);
    }

    setMeta("itemprop", "name", ogTitle);
    setMeta("itemprop", "description", ogDesc);
    if (publicUrl) {
      setMeta("itemprop", "image", image);
    }
  }, [
    tabTitle,
    tabDesc,
    ogTitle,
    ogDesc,
    keywords,
    ogImageAlt,
    ogLocale,
    url,
    image,
    noindex,
    publicUrl,
    locale,
  ]);

  return null;
}
