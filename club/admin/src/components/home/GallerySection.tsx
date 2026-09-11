// import { motion } from "framer-motion";
// import heroBg from "@/assets/hero-bg.jpg";

// const fadeUp = {
//   hidden: { opacity: 0, y: 20 },
//   visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
// };

// const galleryItems = [
//   { title: "Annual Gala 2025", span: "md:col-span-2 md:row-span-2" },
//   { title: "Community Service Drive", span: "" },
//   { title: "Leadership Workshop", span: "" },
//   { title: "Charity Run", span: "md:col-span-2" },
//   { title: "Monthly Meeting", span: "" },
// ];

// export function GallerySection() {
//   return (
//     <section className="py-20 bg-background">
//       <div className="container mx-auto px-4">
//         <div className="text-center mb-12">
//           <h2 className="text-3xl font-display font-bold mb-2">Gallery</h2>
//           <p className="text-muted-foreground">Moments captured from our events and community work</p>
//         </div>
//         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
//           {galleryItems.map((item, i) => (
//             <motion.div
//               key={item.title}
//               custom={i}
//               initial="hidden"
//               whileInView="visible"
//               viewport={{ once: true }}
//               variants={fadeUp}
//               className={`relative rounded-xl overflow-hidden group cursor-pointer ${item.span}`}
//             >
//               <img
//                 src={heroBg}
//                 alt={item.title}
//                 className="w-full h-full min-h-[180px] object-cover group-hover:scale-105 transition-transform duration-500"
//                 loading="lazy"
//               />
//               <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/60 transition-colors duration-300 flex items-end">
//                 <span className="text-primary-foreground font-display font-semibold text-sm p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
//                   {item.title}
//                 </span>
//               </div>
//             </motion.div>
//           ))}
//         </div>
//       </div>
//     </section>
//   );
// }











import { motion } from "framer-motion";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/redux-toolkit/customHook/hook";
import { getPublicGallery } from "@/service/public";
import { setGalleryList } from "@/redux-toolkit/slice/gallerySlice";
import { isVideo } from "@/service/global";


const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

export function GallerySection() {
  const dispatch = useAppDispatch();
  const galleryList = useAppSelector((state) => state?.gallery?.galleryList);

  const handleGetGallery = async () => {
    try {
      const res = await getPublicGallery();
      if (res.status === 200) {
        dispatch(setGalleryList(res?.data?.data || []));
      }
    }
    catch (err) {
      console.log(err);
    }
  };


  useEffect(() => {
    if (galleryList?.length === 0) {
      handleGetGallery();
    }
  }, [galleryList?.length])

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-display font-bold mb-2">Gallery</h2>
          <p className="text-muted-foreground">Moments captured from our events and community work</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {galleryList?.slice(0, 4).map((item, i) => {
            const image = item?.image?.[0] || item?.image;

            return (
              <motion.div
                key={item?.event?.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className={`relative rounded-xl overflow-hidden group cursor-pointer ${item.span}`}
              >
                {isVideo(image) ? (
                  <video src={image} autoPlay loop muted className="w-full h-full object-cover" />
                ) : (
                  <img src={image} alt={item?.event?.title} loading="lazy" className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/60 transition-colors duration-300 flex items-end">
                  <span className="text-primary-foreground font-display font-semibold text-sm p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {item?.event?.title}
                  </span>
                </div>
              </motion.div>
            )
          }
          )
          }
        </div>
      </div>
    </section>
  );
}

