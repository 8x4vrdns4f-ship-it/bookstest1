import { Instagram, Youtube, Music2 } from "lucide-react";
import BrandLogo from "./BrandLogo";

const socials = [
  { Icon: Instagram, href: "https://www.instagram.com/booksuite.online", label: "Instagram" },
  { Icon: Youtube, href: "https://youtube.com/@booksuite.online", label: "YouTube" },
  { Icon: Music2, href: "https://www.tiktok.com/@booksuite", label: "TikTok" },
];

const Footer = () => {
  return (
    <footer className="border-t border-border px-6 md:px-12 py-10 mt-12">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <BrandLogo size="sm" />
        <div className="flex items-center gap-5">
          {socials.map(({ Icon, href, label }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <Icon size={20} />
            </a>
          ))}
        </div>
      </div>
      <p className="text-center text-muted-foreground text-xs mt-8">
        © {new Date().getFullYear()} BookSuite. All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;
