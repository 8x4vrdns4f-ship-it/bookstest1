import BrandLogo from "./BrandLogo";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  return (
    <nav className="flex items-center justify-between px-6 md:px-12 py-5">
      <BrandLogo size="sm" />
      <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground font-semibold px-6">
        Login
      </Button>
    </nav>
  );
};

export default Navbar;
