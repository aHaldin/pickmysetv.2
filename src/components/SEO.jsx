import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const CANONICAL_BASE = "https://pickmyset.com";
const DEFAULT_TITLE = "PickMySet – Setlists & client requests";
const DEFAULT_DESCRIPTION =
  "PickMySet helps performers manage their song library, build setlists, and collect client requests before the gig.";
const DEFAULT_ROBOTS = "index, follow";
const DEFAULT_OG_TYPE = "website";
const DEFAULT_OG_IMAGE = "https://pickmyset.com/og-image.png";
const DEFAULT_TWITTER_CARD = "summary_large_image";

function upsertMetaTag({ name, property, content }) {
  if (!content) return;
  const selector = name ? `meta[name="${name}"]` : `meta[property="${property}"]`;
  let meta = document.head.querySelector(selector);
  if (!meta) {
    meta = document.createElement("meta");
    if (name) meta.setAttribute("name", name);
    if (property) meta.setAttribute("property", property);
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", content);
}

function upsertCanonicalLink(href) {
  if (!href) return;
  let link = document.head.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", href);
}

function toCanonicalUrl(path) {
  const normalized = path && path.startsWith("/") ? path : `/${path || ""}`;
  return new URL(normalized, CANONICAL_BASE).toString();
}

export default function SEO({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  robots = DEFAULT_ROBOTS,
  canonicalPath,
  ogType = DEFAULT_OG_TYPE,
  ogImage = DEFAULT_OG_IMAGE,
  twitterCard = DEFAULT_TWITTER_CARD,
}) {
  const location = useLocation();
  const canonical = toCanonicalUrl(
    canonicalPath ?? `${location.pathname}${location.search || ""}`
  );

  useEffect(() => {
    if (title) document.title = title;
    upsertMetaTag({ name: "description", content: description });
    upsertMetaTag({ name: "robots", content: robots });
    upsertCanonicalLink(canonical);
    upsertMetaTag({ property: "og:title", content: title });
    upsertMetaTag({ property: "og:description", content: description });
    upsertMetaTag({ property: "og:type", content: ogType });
    upsertMetaTag({ property: "og:url", content: canonical });
    upsertMetaTag({ property: "og:image", content: ogImage });
    upsertMetaTag({ name: "twitter:card", content: twitterCard });
    upsertMetaTag({ name: "twitter:title", content: title });
    upsertMetaTag({ name: "twitter:description", content: description });
    upsertMetaTag({ name: "twitter:image", content: ogImage });
  }, [title, description, robots, canonical, ogType, ogImage, twitterCard]);

  return null;
}
