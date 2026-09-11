import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { getPublicAnnouncements } from "@/service/public";
import { useAppDispatch, useAppSelector } from "@/redux-toolkit/customHook/hook";
import { setAnnouncementList } from "@/redux-toolkit/slice/announcementSlice";
import { useEffect } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

export function AnnouncementsSection() {
  const dispatch = useAppDispatch();
  const announcementList = useAppSelector((state) => state?.announcement?.announcementList);


  const handleGetAllAnnouncements = async () => {
    try {
      const res = await getPublicAnnouncements();
      if (res.status === 200) {
        dispatch(setAnnouncementList(res?.data?.announcements));
      }
    }
    catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    if (announcementList?.length === 0) {
      handleGetAllAnnouncements();
    }
  }, [announcementList?.length]);

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-display font-bold mb-2">Latest Announcements</h2>
          <p className="text-muted-foreground">Stay updated with the latest news</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {announcementList?.length > 0 ? (
            announcementList.slice(0, 4).map((ann, i) => (
              <motion.div key={ann.id} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                <Card className="shadow-card hover:shadow-elevated transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-display font-semibold">{ann.title}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      ann.priority === "high" ? "bg-destructive/10 text-destructive" :
                      ann.priority === "medium" ? "bg-warning/10 text-warning" :
                      "bg-muted text-muted-foreground"
                    }`}>{ann.priority}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{ann.description}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{ann.author || "Admin"}</span>
                    <span>{new Date(ann.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",})}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))) : (
          announcementList?.length === 0 && (
            <p className="text-center text-muted-foreground col-span-2">No announcements available</p>
          ))}
        </div>
      </div>
    </section>
  );
} 
  