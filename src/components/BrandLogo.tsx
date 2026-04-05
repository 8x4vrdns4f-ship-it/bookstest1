interface BrandLogoProps {
  size?: "sm" | "lg";
}

const BrandLogo = ({ size = "lg" }: BrandLogoProps) => {
  const textClass = size === "lg" ? "text-5xl md:text-6xl" : "text-xl";

  return (
    <span className={`${textClass} font-extrabold tracking-tight`}>
      <span className="text-primary">B</span>
      <span className="text-foreground">ook</span>
      <span className="text-primary">S</span>
      <span className="text-foreground">uite</span>
    </span>
  );
};

export default BrandLogo;
