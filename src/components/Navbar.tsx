import BrandLogo from "./BrandLogo";

const Navbar = () => {
  return (
    <nav className="flex items-center justify-between px-8 md:px-16 py-6">
      <BrandLogo size="sm" />
      <a href="#" className="text-primary font-semibold text-sm hover:text-primary/80 transition-colors">
        Login
      </a>
    </nav>
  );
};

export default Navbar;
