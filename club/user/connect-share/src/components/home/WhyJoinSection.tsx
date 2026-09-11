import { Users, TrendingUp, Handshake, Award, Smile, Globe } from "lucide-react";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

const benefits = [
  { icon: Users, title: "Community & Belonging", description: "Be part of a warm, welcoming group of like-minded individuals who share your passion." },
  { icon: TrendingUp, title: "Personal Growth", description: "Develop leadership, public speaking, and organizational skills through hands-on experience." },
  { icon: Handshake, title: "Networking", description: "Connect with professionals, entrepreneurs, and community leaders from diverse backgrounds." },
  { icon: Award, title: "Recognition", description: "Get recognized for your contributions through awards, certifications, and community honor." },
  { icon: Smile, title: "Fun & Fellowship", description: "Enjoy social events, outings, cultural programs, and lifelong friendships." },
  { icon: Globe, title: "Make an Impact", description: "Contribute to meaningful projects that improve lives and strengthen communities." },
];

export function WhyJoinSection() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-display font-bold mb-2">Why Join ClubConnect?</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">Discover the benefits of being part of a purpose-driven community</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {benefits.map((benefit, i) => (
            <motion.div
              key={benefit.title}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="bg-card rounded-xl p-6 shadow-card hover:shadow-elevated transition-shadow border border-border"
            >
              <div className="w-12 h-12 rounded-lg gradient-gold flex items-center justify-center mb-4">
                <benefit.icon className="h-6 w-6 text-secondary-foreground" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">{benefit.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
