import { Instagram, Youtube, Music2 } from "lucide-react";
import { Link } from "react-router-dom";
import BrandLogo from "./BrandLogo";
import { useLocale } from "@/contexts/LocaleContext";

const socials = [
  { Icon: Instagram, href: "https://www.instagram.com/booksuite.online", label: "Instagram" },
  { Icon: Youtube, href: "https://youtube.com/@booksuite.online", label: "YouTube" },
  { Icon: Music2, href: "https://www.tiktok.com/@booksuite", label: "TikTok" },
];

const Footer = () => {
  const { t } = useLocale();
  return (
    <footer className="border-t border-border px-6 md:px-12 py-10 mt-12">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <BrandLogo size="sm" />
        <nav className="flex flex-wrap items-center justify-center gap-5 text-sm text-muted-foreground">
          <Link to="/pricing" className="hover:text-primary transition-colors">Pricing</Link>
          <Link to="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
          <Link to="/terms" className="hover:text-primary transition-colors">Terms</Link>
          <Link to="/security" className="hover:text-primary transition-colors">Security</Link>
          <a href="mailto:help@booksuite.online" className="hover:text-primary transition-colors">Support</a>
        </nav>

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
        © {new Date().getFullYear()} BookSuite. {t("footer.rights")}
      </p>
    </footer>
  );
};

export default Footer;
