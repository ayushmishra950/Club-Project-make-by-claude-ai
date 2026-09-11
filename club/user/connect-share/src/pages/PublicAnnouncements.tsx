import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { announcements } from "@/lib/dummy-data";
import { getPublicAnnouncements } from "@/service/public";
import { useAppDispatch, useAppSelector } from "@/redux-toolkit/customHook/hook";
import { setAnnouncementList } from "@/redux-toolkit/slice/announcementSlice";
import { useEffect } from "react";

export default function PublicAnnouncements() {
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
    <div>
     <section className="py-20 gradient-hero">
  <div className="container mx-auto px-4 text-center">
    <h1 className="text-4xl font-display font-bold text-foreground mb-4">
      Announcements
    </h1>
    <p className="text-muted-foreground">
      Latest news and updates from ClubConnect
    </p>
  </div>
</section>

      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="space-y-4">
            {announcementList?.length > 0 ? (
              announcementList.map((ann, i) => (
                <motion.div key={ann._id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                  <Card className="shadow-card hover:shadow-elevated transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-display font-semibold text-lg">{ann.title}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium shrink-0 ml-3 ${
                        ann.priority === "high" ? "bg-destructive/10 text-destructive" :
                        ann.priority === "medium" ? "bg-warning/10 text-warning" :
                        "bg-muted text-muted-foreground"
                      }`}>{ann.priority}</span>
                    </div>
                    <p className="text-muted-foreground mb-4">{ann.description}</p>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>By {ann.author || "Admin"}</span>
                      <span>{new Date(ann.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", })}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))) : (
              <p className="text-center text-muted-foreground col-span-2">No announcements available</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
