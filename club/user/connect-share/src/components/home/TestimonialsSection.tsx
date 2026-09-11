import { useAppDispatch, useAppSelector } from "@/redux-toolkit/customHook/hook";
import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { useEffect } from "react";
import { getPublicReviews } from "@/service/public";
import { setReviewList, setRemoveReview, setNewReview } from "@/redux-toolkit/slice/reviewSlice";
import socket from "@/socket/socket";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};


export function TestimonialsSection() {

  const dispatch = useAppDispatch();
  const reviewList = useAppSelector((state) => state?.reviews?.reviewsList);

  useEffect(() => {
    socket.connect();
    socket.on("deleteReview", (id) => {
      dispatch(setRemoveReview(id));
    });
    socket.on("addReview", (data) => {
      dispatch(setNewReview(data));
    })

    return () => {
      socket.off("deleteReview");
      socket.off("addReview");
    }
  }, []);

  // ✅ GET REVIEWS
  const handleGetReview = async () => {
    try {
      const res = await getPublicReviews();
      if (res.status === 200) {
        dispatch(setReviewList(res?.data?.data));
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    if (reviewList?.length === 0) {
      handleGetReview();
    }
  }, [reviewList?.length]);


  return (
    reviewList?.length > 0 && <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-display font-bold mb-2">What Our Members Say</h2>
          <p className="text-muted-foreground">Real stories from real members</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {reviewList?.slice(0, 3)?.map((t, i) => (
            <motion.div
              key={t.name}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="bg-card rounded-xl p-6 shadow-card border border-border relative"
            >
              <Quote className="h-8 w-8 text-secondary/30 absolute top-4 right-4" />
              <p className="text-muted-foreground text-sm leading-relaxed mb-6 italic">"{t.description}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-display font-bold text-sm">
                    {t?.fullName?.split(" ")?.map(n => n[0])?.join("")}
                  </span>
                </div>
                <div>
                  <div className="font-display font-semibold text-sm">{t?.fullName}</div>
                  <div className="text-xs text-muted-foreground">{new Date(t?.createdAt)?.toLocaleString()}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
