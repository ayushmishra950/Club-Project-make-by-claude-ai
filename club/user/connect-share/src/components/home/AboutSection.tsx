
import { Target, Users, Star } from "lucide-react";
import { motion, Variants } from "framer-motion";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.15,
      duration: 0.6,
      ease: "easeOut",
    },
  }),
};

export function AboutSection() {
  return (
    <section className="py-20 bg-background overflow-hidden">
      <div className="container mx-auto px-4">

        <div className="grid lg:grid-cols-2 gap-14 items-center">

          {/* LEFT CONTENT */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >

            {/* SMALL HEADING */}
            <span className="inline-block px-4 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              About JSG Glory
            </span>

            {/* MAIN TITLE */}
            <h2 className="text-4xl md:text-5xl font-bold text-foreground leading-tight mb-6">
              Connecting Hearts,
              <span className="text-primary"> Strengthening Community</span>
            </h2>

            {/* DESCRIPTION */}
            <div className="space-y-4 text-muted-foreground leading-relaxed text-[15px]">

              <p>
                Welcome to <span className="font-semibold text-foreground">JSG Glory</span> —
                a vibrant Jain social community built on unity, values,
                friendship, and meaningful connections.
              </p>

              <p>
                We bring together families, professionals, entrepreneurs,
                youth, and elders through cultural programs, networking
                events, social initiatives, spiritual gatherings, and festive
                celebrations.
              </p>

              <p>
                Our mission is to preserve Jain traditions while creating
                opportunities for growth, leadership, service, and lifelong
                relationships across generations.
              </p>

              <p>
                At JSG Glory, every member matters, every event becomes a
                memory, and every connection helps strengthen the community.
              </p>
            </div>

            {/* FEATURE CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">

              {[
                {
                  icon: Target,
                  title: "Service",
                  desc: "Helping society with compassion & unity",
                },
                {
                  icon: Users,
                  title: "Community",
                  desc: "Building meaningful social connections",
                },
                {
                  icon: Star,
                  title: "Growth",
                  desc: "Empowering youth & future leadership",
                },
              ].map((item, index) => (
                <motion.div
                  key={item.title}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={index + 1}
                  className="rounded-2xl border bg-card p-5 hover:shadow-lg transition-all duration-300"
                >
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>

                  <h3 className="font-semibold text-foreground mb-1">
                    {item.title}
                  </h3>

                  <p className="text-sm text-muted-foreground">
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* RIGHT IMAGE */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={2}
            className="relative"
          >

            {/* IMAGE CONTAINER */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">

              <img
                src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1400&auto=format&fit=crop"
                alt="JSG Glory Community"
                className="w-full h-[500px] object-cover"
                loading="lazy"
              />

              {/* DARK OVERLAY */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

              {/* FLOATING INFO CARD */}
              <div className="absolute bottom-6 left-6 right-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5">

                <h3 className="text-white text-xl font-semibold mb-2">
                  Together We Grow
                </h3>

                <p className="text-white/80 text-sm leading-relaxed">
                  Celebrating culture, friendship, service, and togetherness
                  through every generation.
                </p>
              </div>
            </div>

            {/* DECORATIVE SHAPE */}
            <div className="absolute -z-10 -bottom-8 -right-8 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}