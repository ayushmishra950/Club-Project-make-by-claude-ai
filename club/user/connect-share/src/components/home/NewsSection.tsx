
import { motion } from "framer-motion";
import { getPublicNews } from "@/service/public";
import { useAppDispatch, useAppSelector } from "@/redux-toolkit/customHook/hook";
import { setNewsList } from "@/redux-toolkit/slice/newsSlice";
import { useEffect } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const newsItems = [
  { title: "ClubConnect Wins Best Community Organization Award 2025", date: "Mar 15, 2026", category: "Achievement", excerpt: "Our club has been recognized for outstanding community service and leadership at the National Community Awards." },
  { title: "New Youth Mentorship Program Launches", date: "Mar 10, 2026", category: "Program", excerpt: "A new initiative to mentor young professionals through one-on-one guidance, workshops, and career development sessions." },
  { title: "Volunteer Spotlight: 100 Hours of Service", date: "Mar 5, 2026", category: "Volunteer", excerpt: "Celebrating members who have contributed over 100 hours of community service this quarter." },
];

export function NewsSection() {
  const dispatch = useAppDispatch();
  const newsList = useAppSelector((state) => state?.news?.newsList);

  const handleGetNews = async () => {
    try {
      const res = await getPublicNews();
      if (res.status === 200) {
        dispatch(setNewsList(res?.data?.data));
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    if (!newsList?.length) {
      handleGetNews();
    }
  }, [newsList?.length]);

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-display font-bold mb-2">News & Updates</h2>
          <p className="text-muted-foreground">Stay informed with the latest from ClubConnect</p>
        </div>
        <div className="max-w-5xl mx-auto">

          {newsList?.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6">
              {newsList?.slice(0,6)?.map((item, i) => (
                <motion.div
                  key={item._id}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  className="bg-card rounded-xl border border-border shadow-card hover:shadow-elevated transition-shadow overflow-hidden"
                >
                  <div className="h-2 gradient-primary" />
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-secondary/10 text-secondary">
                        {item.category}
                      </span>
                      <span className="text-xs text-muted-foreground"> {new Date(item.createdAt).toLocaleString()}</span>
                    </div>
                    <h3 className="font-display font-semibold mb-2 leading-snug"> {item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed"> {item.description} </p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex justify-center items-center h-[200px] text-muted-foreground text-sm"> No News Found</div>
          )}
        </div>
        {/* <div className="text-center mt-8">
          <Link to="/announcements">
            <Button variant="outline">
              <Newspaper className="mr-2 h-4 w-4" /> View All News <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div> */}
      </div>
    </section>
  );
}
