import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-20 gradient-hero">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-display font-bold text-secondary-foreground mb-4">
          Ready to Make a Difference?
        </h2>
        <p className="text-secondary-foreground/70 mb-8 max-w-lg mx-auto">
          Join ClubConnect today and be part of a community that cares.
        </p>
        <Link to="/login">
          <Button size="lg" className="gradient-gold text-secondary-foreground font-semibold shadow-gold text-base px-10">
            Join Now <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </section>
  );
}
