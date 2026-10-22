import { useEffect } from "react";
import ogImage from "@/assets/og-image-booksuite.jpg.asset.json";

interface JsonLdProps {
  data: object | object[];
}

// Google requires an image for these rich-result types.
const NEEDS_IMAGE = ["Product", "SoftwareApplication", "WebApplication", "Article"];
const DEFAULT_IMAGES = [`https://booksuite.online${ogImage.url}`, "https://booksuite.online/icon-512.png"];

const JsonLd = ({ data }: JsonLdProps) => {
  useEffect(() => {
    const items = Array.isArray(data) ? data : [data];
    const scripts: HTMLScriptElement[] = [];
    items.forEach((item) => {
      const rec = item as Record<string, unknown>;
      const withImage =
        NEEDS_IMAGE.includes(String(rec["@type"])) && !rec.image ? { ...rec, image: DEFAULT_IMAGES } : rec;
      const el = document.createElement("script");
      el.type = "application/ld+json";
      el.textContent = JSON.stringify(withImage);
      document.head.appendChild(el);
      scripts.push(el);
    });

    return () => {
      scripts.forEach((el) => {
        if (el.parentNode) el.parentNode.removeChild(el);
      });
    };
  }, [data]);

  return null;
};

export default JsonLd;
