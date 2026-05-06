import { Link } from "react-router-dom";
import brandIcon from "@/assets/booksuite-icon.png";

interface BrandLogoProps {
  size?: "sm" | "lg";
}

const BrandLogo = ({ size = "lg" }: BrandLogoProps) => {
  const textClass = size === "lg" ? "text-5xl md:text-6xl" : "text-xl";
  const iconClass = size === "lg" ? "h-12 md:h-14 w-auto" : "h-7 w-auto";

  return (
    <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
      <img src={brandIcon} alt="BookSuite logo" className={iconClass} />
      <span className={`${textClass} font-extrabold tracking-tight`}>
        <span className="text-primary">B</span>
        <span className="text-foreground">ook</span>
        <span className="text-primary">S</span>
        <span className="text-foreground">uite</span>
      </span>
    </Link>
  );
};

export default BrandLogo;
