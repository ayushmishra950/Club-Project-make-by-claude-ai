import { motion } from "framer-motion";
import { TreePine, Droplets, GraduationCap, HeartPulse } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const projects = [
  { icon: TreePine, title: "Green Earth Drive", stat: "5,000+", unit: "Trees Planted", description: "Annual plantation drives across 12 locations making our city greener." },
  { icon: Droplets, title: "Clean Water Initiative", stat: "3", unit: "Villages Served", description: "Installed water purification systems in underserved rural communities." },
  { icon: GraduationCap, title: "Education for All", stat: "200+", unit: "Students Supported", description: "Scholarship and mentorship programs for underprivileged students." },
  { icon: HeartPulse, title: "Health Camps", stat: "15", unit: "Camps Organized", description: "Free medical checkups and blood donation camps for the community." },
];

export function ImpactSection() {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-display font-bold mb-2">Our Impact & Projects</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">Meaningful initiatives that create lasting change in our communities</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {projects.map((project, i) => (
            <motion.div
              key={project.title}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="text-center p-6 rounded-xl bg-card border border-border shadow-card hover:shadow-elevated transition-shadow"
            >
              <div className="w-14 h-14 rounded-full gradient-primary mx-auto mb-4 flex items-center justify-center">
                <project.icon className="h-7 w-7 text-primary-foreground" />
              </div>
              <div className="text-2xl font-display font-bold text-secondary mb-0">{project.stat}</div>
              <div className="text-xs font-medium text-muted-foreground mb-3">{project.unit}</div>
              <h3 className="font-display font-semibold mb-2">{project.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{project.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
