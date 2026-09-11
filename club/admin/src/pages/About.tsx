
import { Card, CardContent } from "@/components/ui/card";
import { Target, Users, Heart, Award, Globe, Lightbulb } from "lucide-react";
import { motion, Variants } from "framer-motion";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30, },

  visible: (i: number = 1) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: "easeOut", },
  }),
};

export default function About() {
  return (
    <div className="bg-background overflow-hidden">

      {/* HERO SECTION */}
      <section className="relative py-24 overflow-hidden">

        {/* BACKGROUND IMAGE */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1600&auto=format&fit=crop"
            alt="Community"
            className="w-full h-full object-cover"
          />

          {/* DARK OVERLAY */}
          <div className="absolute inset-0 bg-black/70" />
        </div>

        {/* CONTENT */}
        <div className="relative z-10 container mx-auto px-4 text-center">

          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >

            <span className="inline-block px-4 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium backdrop-blur-sm mb-5">
              Welcome To JSG Glory
            </span>

            <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-6">
              Building Stronger
              <span className="text-primary"> Communities</span>
              <br />
              Through Unity & Values
            </h1>

            <p className="text-white/80 max-w-3xl mx-auto leading-relaxed text-base md:text-lg">
              JSG Glory is a vibrant Jain social community dedicated to
              friendship, leadership, cultural values, service initiatives,
              and meaningful relationships that inspire growth across
              generations.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section className="py-24 bg-background">

        <div className="container mx-auto px-4">

          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* LEFT CONTENT */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
            >

              <span className="inline-block px-4 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                About Us
              </span>

              <h2 className="text-4xl font-bold text-foreground leading-tight mb-6">
                A Community That
                <span className="text-primary"> Connects Hearts</span>
              </h2>

              <div className="space-y-5 text-muted-foreground leading-relaxed">

                <p>
                  At <span className="font-semibold text-foreground">JSG Glory</span>,
                  we believe true success is not only measured by achievements,
                  but also by the relationships we build and the positive
                  impact we create together.
                </p>

                <p>
                  We bring together families, entrepreneurs, professionals,
                  youth, and elders through cultural programs, networking
                  events, social activities, charity drives, spiritual
                  gatherings, and festive celebrations.
                </p>

                <p>
                  Our mission is to strengthen social bonds while preserving
                  Jain traditions and empowering future generations with
                  compassion, leadership, unity, and responsibility.
                </p>

                <p>
                  Together we celebrate values, inspire growth, and create
                  lasting memories that strengthen our community.
                </p>
              </div>

              {/* STATS */}
              <div className="grid grid-cols-3 gap-4 mt-10">

                {[
                  {
                    number: "500+",
                    label: "Members",
                  },
                  {
                    number: "50+",
                    label: "Events",
                  },
                  {
                    number: "10+",
                    label: "Years",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border bg-card p-5 text-center"
                  >
                    <h3 className="text-2xl font-bold text-primary">
                      {item.number}
                    </h3>

                    <p className="text-sm text-muted-foreground mt-1">
                      {item.label}
                    </p>
                  </div>
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

              <div className="relative rounded-3xl overflow-hidden shadow-2xl">

                <img
                  src="https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=1400&auto=format&fit=crop"
                  alt="JSG Glory"
                  className="w-full h-[550px] object-cover"
                />

                {/* OVERLAY */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                {/* FLOATING CARD */}
                <div className="absolute bottom-6 left-6 right-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5">

                  <h3 className="text-white text-xl font-semibold mb-2">
                    Together We Grow
                  </h3>

                  <p className="text-white/80 text-sm leading-relaxed">
                    Empowering members through friendship, culture,
                    leadership, service, and meaningful community engagement.
                  </p>
                </div>
              </div>

              {/* DECORATION */}
              <div className="absolute -bottom-10 -right-10 h-44 w-44 rounded-full bg-primary/20 blur-3xl -z-10" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* VALUES SECTION */}
      <section className="py-24 bg-muted/30">

        <div className="container mx-auto px-4">

          <div className="text-center max-w-2xl mx-auto mb-14">

            <span className="inline-block px-4 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              Our Values
            </span>

            <h2 className="text-4xl font-bold mb-4">
              What Makes Us Special
            </h2>

            <p className="text-muted-foreground">
              Our community is built on strong values that inspire
              togetherness, leadership, service, and growth.
            </p>
          </div>

          {/* CARDS */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">

            {[
              {
                icon: Target,
                title: "Service",
                desc: "Creating meaningful impact through community welfare and social initiatives.",
              },
              {
                icon: Users,
                title: "Fellowship",
                desc: "Building lifelong relationships through unity and togetherness.",
              },
              {
                icon: Award,
                title: "Leadership",
                desc: "Encouraging future leaders and empowering youth development.",
              },
              {
                icon: Heart,
                title: "Integrity",
                desc: "Promoting honesty, ethics, and transparency in every action.",
              },
              {
                icon: Globe,
                title: "Culture",
                desc: "Preserving Jain traditions and celebrating cultural values.",
              },
              {
                icon: Lightbulb,
                title: "Innovation",
                desc: "Encouraging creativity and modern ideas for community growth.",
              },
            ].map((val, i) => (
              <motion.div
                key={val.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
              >

                <Card className="h-full border-0 shadow-lg hover:shadow-2xl transition-all duration-300 rounded-3xl bg-card">

                  <CardContent className="p-8 text-center">

                    <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                      <val.icon className="h-8 w-8 text-primary" />
                    </div>

                    <h3 className="text-xl font-semibold mb-3">
                      {val.title}
                    </h3>

                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {val.desc}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}