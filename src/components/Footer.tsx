import { Instagram, Twitter, Linkedin, Facebook } from "lucide-react";
import BrandLogo from "./BrandLogo";

const Footer = () => {
  return (
    <footer className="border-t border-border px-6 md:px-12 py-10 mt-12">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <BrandLogo size="sm" />
        <div className="flex items-center gap-5">
          {[
            { Icon: Instagram, href: "https://www.instagram.com/booksuite.online" },
            { Icon: Twitter, href: "#" },
            { Icon: Linkedin, href: "#" },
            { Icon: Facebook, href: "#" },
          ].map(({ Icon, href }, i) => (
            <a 
              key={i} 
              href={href} 
              target={href !== "#" ? "_blank" : undefined}
              rel={href !== "#" ? "noopener noreferrer" : undefined}
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
