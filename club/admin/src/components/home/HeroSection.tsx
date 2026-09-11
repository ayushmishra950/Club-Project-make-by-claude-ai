// import { Link } from "react-router-dom";
// import { Button } from "@/components/ui/button";
// import { ArrowRight } from "lucide-react";
// import { motion } from "framer-motion";
// // Same photo at the same 1600px width, re-encoded: 321 KB -> 215 KB.
import heroBg from "@/assets/hero.jpg";

// export function HeroSection() {
//   return (
//     <section className="relative min-h-[85vh] flex items-center overflow-hidden">
//       <div className="absolute inset-0">
//         <img src={heroBg} alt="Community" className="w-full h-full object-cover" width={1920} height={1080} />
//         <div className="absolute inset-0 gradient-hero opacity-85" />
//       </div>
//       <div className="relative container mx-auto px-4 py-20">
//         <motion.div
//           initial={{ opacity: 0, y: 30 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.7 }}
//           className="max-w-2xl"
//         >
//           <span className="inline-block px-4 py-1.5 rounded-full text-sm font-medium gradient-gold text-secondary-foreground mb-6">
//             Empowering Communities Since 2020
//           </span>
//           <h1 className="text-4xl md:text-6xl font-display font-bold text-primary-foreground leading-tight mb-6">
//             Together We Build <br />
//             <span className="text-secondary">Stronger Communities</span>
//           </h1>
//           <p className="text-lg text-primary-foreground/80 mb-8 max-w-lg">
//             Join a network of passionate individuals committed to making a difference through service, leadership, and fellowship.
//           </p>
//           <div className="flex flex-wrap gap-3">
//             <Link to="/login">
//               <Button size="lg" className="gradient-gold text-secondary-foreground font-semibold shadow-gold text-base px-8">
//                 Join Now <ArrowRight className="ml-2 h-4 w-4" />
//               </Button>
//             </Link>
//             <Link to="/about">
//               <Button
//                 size="lg"
//                 variant="outline"
//                 className="border-primary-foreground/30 text-black hover:bg-primary-foreground/10 text-base px-8"
//               >
//                 Learn More
//               </Button>
//             </Link>
//           </div>
//         </motion.div>
//       </div>
//     </section>
//   );
// }




import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
// Same photo at the same 1600px width, re-encoded: 321 KB -> 215 KB.


export function HeroSection() {
  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden">

      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroBg}
          alt="Community"
          className="w-full h-full object-cover scale-105 brightness-110"
        />

        {/* SINGLE LIGHT GRADIENT OVERLAY (FIXED) */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/55 to-black/70" />  </div>

      {/* Content */}
      <div className="relative container mx-auto px-4 py-20">

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-2xl"
        >

          <span className="inline-block px-4 py-1.5 rounded-full text-sm font-medium bg-white/10 text-white border border-white/20 backdrop-blur mb-6">
            Empowering Communities Since 2020
          </span>

          <h1 className="text-4xl md:text-6xl font-display font-bold text-white leading-tight mb-6">
            Together We Build <br />
            <span className="text-secondary">Stronger Communities</span>
          </h1>

          <p className="text-lg text-white/85 mb-8 max-w-lg">
            Join a network of passionate individuals committed to making a difference through service, leadership, and fellowship.
          </p>

          <div className="flex flex-wrap gap-3">

            <Link to="/register">
              <Button
                size="lg"
                className="gradient-gold text-secondary-foreground font-semibold shadow-gold text-base px-8"
              >
                Join Now <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>

            {/* <Link to="/about">
          <Button
            size="lg"
            variant="outline"
            className="border-white/30 hover:bg-white/10 text-base px-8 hover:text-white"
          >
            Learn More
          </Button>
        </Link> */}

          </div>

        </motion.div>

      </div>
    </section>
  );
}

