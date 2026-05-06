import { Link } from "react-router-dom";

interface BrandLogoProps {
  size?: "sm" | "lg";
}

const BrandLogo = ({ size = "lg" }: BrandLogoProps) => {
  const textClass = size === "lg" ? "text-5xl md:text-6xl" : "text-xl";

  return (
    <Link to="/" className={`${textClass} font-extrabold tracking-tight hover:opacity-80 transition-opacity`}>
      <span className="text-primary">B</span>
      <span className="text-foreground">ook</span>
      <span className="text-primary">S</span>
      <span className="text-foreground">uite</span>
    </Link>
  );
};

export default BrandLogo;
