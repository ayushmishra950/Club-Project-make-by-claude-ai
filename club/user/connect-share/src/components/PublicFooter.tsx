import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

export function PublicFooter() {
  return (
    <footer className="gradient-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg gradient-gold flex items-center justify-center">
                <span className="text-secondary-foreground font-display font-bold text-sm">CC</span>
              </div>
              <span className="font-display font-bold text-lg">ClubConnect</span>
            </div>
            <p className="text-primary-foreground/70 text-sm leading-relaxed">
              Building stronger communities through service, fellowship, and leadership since 2020.
            </p>
          </div>

          <div>
            <h4 className="font-display font-semibold mb-4">Quick Links</h4>
            <div className="space-y-2">
              {["About", "Events", "Announcements", "Contact"].map((link) => (
                <Link key={link} to={`/${link.toLowerCase()}`} className="block text-sm text-primary-foreground/70 hover:text-secondary transition-colors">
                  {link}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-display font-semibold mb-4">Contact</h4>
            <div className="space-y-3 text-sm text-primary-foreground/70">
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-secondary" /> Jaipur Rajasthan India</div>
              <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-secondary" /> +91 9876543210     +91 9351880001</div>
              <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-secondary" /> infonicsolutions@gmail.com</div>
            </div>
          </div>

          <div>
            <h4 className="font-display font-semibold mb-4">Follow Us</h4>
            <div className="flex gap-3">
              {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 rounded-lg bg-primary-foreground/10 flex items-center justify-center hover:bg-secondary hover:text-secondary-foreground transition-all">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 mt-8 pt-6 text-center text-sm text-primary-foreground/50">
          © 2026 ClubConnect. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
