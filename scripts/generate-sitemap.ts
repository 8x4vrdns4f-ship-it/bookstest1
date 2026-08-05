// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.

import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://booksuite.online";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const today = new Date().toISOString().split("T")[0];

const entries: SitemapEntry[] = [
  { path: "/",         lastmod: today, changefreq: "weekly",  priority: "1.0" },
  { path: "/pricing",  lastmod: today, changefreq: "monthly", priority: "0.9" },
  { path: "/guides/online-booking-system-for-small-business", lastmod: today, changefreq: "monthly", priority: "0.8" },
  { path: "/guides/how-to-take-deposits-for-appointments",    lastmod: today, changefreq: "monthly", priority: "0.8" },
  { path: "/guides/reduce-no-shows-appointment-reminders",    lastmod: today, changefreq: "monthly", priority: "0.8" },
  { path: "/about",    lastmod: today, changefreq: "monthly", priority: "0.7" },
  { path: "/contact",  lastmod: today, changefreq: "monthly", priority: "0.6" },
  { path: "/cookies",  lastmod: today, changefreq: "yearly",  priority: "0.3" },
  { path: "/security", lastmod: today, changefreq: "yearly",  priority: "0.4" },
  { path: "/privacy",  lastmod: today, changefreq: "yearly",  priority: "0.3" },
  { path: "/terms",    lastmod: today, changefreq: "yearly",  priority: "0.3" },
];

function generateSitemap(entries: SitemapEntry[]) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

writeFileSync(resolve("public/sitemap.xml"), generateSitemap(entries));
console.log(`sitemap.xml written (${entries.length} entries)`);
