import { Calendar, Users, Heart, Star } from "lucide-react";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const stats = [
  { label: "Active Members", value: "65+", icon: Users },
  { label: "Events Hosted", value: "120+", icon: Calendar },
  { label: "Community Projects", value: "45+", icon: Heart },
  { label: "Years of Service", value: "6+", icon: Star },
];

export function StatsSection() {
  return (
    <section className="py-12 bg-card border-b border-border">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="text-center"
            >
              <stat.icon className="h-8 w-8 mx-auto mb-2 text-secondary" />
              <div className="text-3xl font-display font-bold text-foreground">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
