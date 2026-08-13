import { useEffect } from "react";

interface JsonLdProps {
  data: object | object[];
}

const JsonLd = ({ data }: JsonLdProps) => {
  useEffect(() => {
    const items = Array.isArray(data) ? data : [data];
    const scripts: HTMLScriptElement[] = [];
    items.forEach((item) => {
      const el = document.createElement("script");
      el.type = "application/ld+json";
      el.textContent = JSON.stringify(item);
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
