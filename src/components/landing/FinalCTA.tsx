import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const FinalCTA = () => (
  <section className="px-8 md:px-16 py-20 border-t border-border">
    <div className="max-w-5xl mx-auto rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-10 md:p-16 text-center">
      <h2 className="text-3xl md:text-5xl font-bold mb-4">
        Ready to take your first booking?
      </h2>
      <p className="text-muted-foreground text-base md:text-lg mb-8 max-w-2xl mx-auto">
        Join the service businesses running their whole operation on BookSuite. Free to start, no card required.
      </p>
      <div className="flex gap-3 justify-center flex-wrap">
        <Button
          className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-8 py-3 rounded-lg"
          asChild
        >
          <Link to="/auth?mode=signup">Try Now</Link>
        </Button>
        <Button
          variant="outline"
          className="border-primary/50 text-primary hover:bg-primary/10 font-semibold px-8 py-3 rounded-lg"
          asChild
        >
          <Link to="/auth?mode=login">Login</Link>
        </Button>
      </div>
    </div>
  </section>
);

export default FinalCTA;
