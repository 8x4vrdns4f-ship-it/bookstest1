import { useEffect } from "react";

const SITE_URL = "https://booksuite.online";

interface SEOProps {
  title: string;
  description: string;
  path: string;
  noIndex?: boolean;
}

function setMeta(selector: string, attribute: string, value: string) {
  let el = document.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    const key = attribute === "name" ? "name" : "property";
    el.setAttribute(key, selector.match(/\[([a-z:]+)="([^"]+)"\]/)?.[2] || "");
    document.head.appendChild(el);
  }
  el.setAttribute("content", value);
}

function setLinkRel(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

const SEO = ({ title, description, path, noIndex }: SEOProps) => {
  useEffect(() => {
    const url = `${SITE_URL}${path}`;
    document.title = title;

    setMeta('meta[name="description"]', "name", description);
    setMeta('meta[property="og:title"]', "property", title);
    setMeta('meta[property="og:description"]', "property", description);
    setMeta('meta[property="og:url"]', "property", url);
    setMeta('meta[property="og:type"]', "property", "website");
    setMeta('meta[name="twitter:title"]', "name", title);
    setMeta('meta[name="twitter:description"]', "name", description);
    setMeta('meta[name="twitter:card"]', "name", "summary_large_image");
    setLinkRel("canonical", url);

    let robots = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (noIndex) {
      if (!robots) {
        robots = document.createElement("meta");
        robots.setAttribute("name", "robots");
        document.head.appendChild(robots);
      }
      robots.setAttribute("content", "noindex,nofollow");
    } else if (robots) {
      robots.setAttribute("content", "index,follow");
    }
  }, [title, description, path, noIndex]);

  return null;
};

export default SEO;
