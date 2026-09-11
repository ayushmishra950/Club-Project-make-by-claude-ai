// import { motion } from "framer-motion";
// import { Award, Crown } from "lucide-react";
// import { members } from "@/lib/dummy-data";

// const fadeUp = {
//   hidden: { opacity: 0, y: 20 },
//   visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
// };

// export function LeadershipSection() {
//   const leaders = members.filter(m => m.role !== "Member");

//   return (
//     <section className="py-20 bg-muted/30">
//       <div className="container mx-auto px-4">
//         <div className="text-center mb-12">
//           <h2 className="text-3xl font-display font-bold mb-2">Leadership & Recognition</h2>
//           <p className="text-muted-foreground">Meet our dedicated leadership team and celebrated members</p>
//         </div>

//         {/* Leadership Team */}
//         <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-12">
//           {leaders.map((member, i) => (
//             <motion.div key={member.id} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center">
//               <div className="w-20 h-20 rounded-full gradient-primary mx-auto mb-3 flex items-center justify-center">
//                 <span className="text-primary-foreground font-display font-bold text-xl">
//                   {member.name.split(" ").map(n => n[0]).join("")}
//                 </span>
//               </div>
//               <h4 className="font-display font-semibold text-sm">{member.name}</h4>
//               <p className="text-xs text-muted-foreground">{member.role}</p>
//             </motion.div>
//           ))}
//         </div>

//         {/* Member of the Month */}
//         <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="max-w-2xl mx-auto">
//           <div className="bg-card rounded-xl p-6 shadow-card border border-secondary/30 text-center relative overflow-hidden">
//             <div className="absolute top-0 left-0 right-0 h-1 gradient-gold" />
//             <Crown className="h-8 w-8 text-secondary mx-auto mb-3" />
//             <h3 className="font-display font-bold text-lg mb-1">Member of the Month</h3>
//             <div className="w-16 h-16 rounded-full gradient-gold mx-auto my-4 flex items-center justify-center">
//               <span className="text-secondary-foreground font-display font-bold text-lg">SG</span>
//             </div>
//             <h4 className="font-display font-semibold">Sneha Gupta</h4>
//             <p className="text-sm text-muted-foreground mt-1 mb-3">Outstanding contribution to the Education for All initiative</p>
//             <div className="flex items-center justify-center gap-1 text-secondary">
//               <Award className="h-4 w-4" />
//               <span className="text-xs font-medium">March 2026</span>
//             </div>
//           </div>
//         </motion.div>
//       </div>
//     </section>
//   );
// }









import { motion } from "framer-motion";
import { Award, Crown } from "lucide-react";
import { members } from "@/lib/dummy-data";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

export function LeadershipSection() {
  const leaders = members.filter(m => m.role !== "Member");
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">

        <div className="text-center mb-12">
          <h2 className="text-3xl font-display font-bold text-foreground mb-2">
            Team Glory Leadership
          </h2>
          <p className="text-muted-foreground">
            The Visioneries Behind Our Premium Experience
          </p>
        </div>

        {/* ===== TOP LEADERS ===== */}
        <div className="flex justify-center items-center gap-6 max-w-5xl mx-auto mb-12 relative">

          {/* Secretary */}
          <div className="bg-white rounded-3xl shadow-lg p-6 w-72 text-center border border-secondary/30 hover:border-secondary transition-all duration-300 hover:scale-105">

            <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden border-4 border-secondary shadow-md">
              <img
                src="https://jsg-glory-pool-party.onrender.com/coord6.jpeg"
                alt="Hemant Sweta Barjatya"
                className="w-full h-full object-cover"
              />
            </div>

            <h3 className="font-display font-semibold text-lg text-foreground">
              Hemant Sweta Barjatya
            </h3>

            <p className="text-secondary font-medium text-sm tracking-widest">
              SECRETARY
            </p>
          </div>

          {/* President */}
          <div className="bg-gradient-to-b from-white to-secondary/10 rounded-3xl shadow-xl p-8 w-80 text-center border-4 border-secondary relative -mt-4 z-10 scale-110 hover:scale-115 transition-all duration-300 group">

            <div className="relative w-40 h-40 mx-auto mb-5">
              <div className="w-full h-full rounded-full overflow-hidden border-4 border-secondary shadow-lg">
                <img
                  src="https://jsg-glory-pool-party.onrender.com/WhatsApp%20Image%202026-05-10%20at%2014.50.09.jpeg"
                  alt="Piyush Monali Jain"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>

              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-2 shadow-xl border-4 border-secondary z-20 text-sm hover:scale-110 transition-transform duration-300">
                👑
              </div>
            </div>

            <h3 className="font-display font-bold text-2xl text-foreground">
              Piyush Monali Jain
            </h3>

            <p className="text-secondary font-semibold tracking-widest">
              PRESIDENT
            </p>
          </div>

          {/* Treasurer */}
          <div className="bg-white rounded-3xl shadow-lg p-6 w-72 text-center border border-secondary/30 hover:border-secondary transition-all duration-300 hover:scale-105">

            <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden border-4 border-secondary shadow-md">
              <img
                src="https://jsg-glory-pool-party.onrender.com/treasurer.jpeg"
                alt="Saurab Ruby Jain"
                className="w-full h-full object-cover"
              />
            </div>

            <h3 className="font-display font-semibold text-lg text-foreground">
              Saurab Ruby Jain
            </h3>

            <p className="text-secondary font-medium text-sm tracking-widest">
              TREASURER
            </p>
          </div>
        </div>

        {/* ===== CORE COMMITTEE ===== */}
        <div className="max-w-5xl mx-auto mt-6">

          <h1 className="text-center font-bold text-foreground text-3xl p-8">
            Core Committee
          </h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">

            {[
              ["Nayan Monika Jain", "Vice President"],
              ["Shweta Neeraj Ajmera", "Jt Secretary"],
              ["Suchi Ashish Jain", "Coordinator"],
              ["Ajay Lalita Todia", "Advisor"]
            ].map((item, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 text-center hover:shadow-lg hover:-translate-y-2 transition-all duration-300 ease-in-out">

                <h1 className="text-foreground font-bold text-base mb-1">
                  {item[0]}
                </h1>

                <p className="text-secondary text-sm font-medium">
                  {item[1]}
                </p>

              </div>
            ))}

          </div>
        </div>

        {/* ===== EXECUTIVE MEMBERS ===== */}
        <div className="max-w-5xl mx-auto mt-6">

          <h1 className="text-center font-bold text-foreground text-xl p-8">
            Executive Members
          </h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">

            {[
              "Akhil Anita Patni",
              "Amit Ruchika Kala",
              "Arpit Surbhi Godha",
              "Avdesh Meenu Patani",
              "Chandraprakash Aprana Patni",
              "Pankaj Deepika Ajmera",
              "Rahul Poornima Jain",
              "Ramesh Deepali Patodi",
              "Ramesh Pushpa Jain",
              "Rohit Pratibha Jain",
              "Shikha Sunil Bakliwal",
              "Shubham Akansha Nigotia"
            ].map((name, i) => (
              <div
                key={i}
                className="group bg-white border border-gray-200 rounded-xl shadow-sm p-4 text-center hover:bg-secondary hover:border-secondary hover:shadow-md transition-all duration-300"
              >
                <h1 className="text-foreground font-bold text-base mb-1 transition-colors duration-300 group-hover:text-white">
                  {name}
                </h1>
              </div>
            ))}

          </div>
        </div>

      </div>
    </section>
  );
}
