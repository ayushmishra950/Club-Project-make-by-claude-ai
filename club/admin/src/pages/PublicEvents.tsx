
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MapPin, Users } from "lucide-react";
import { motion } from "framer-motion";
import { getPublicEvents } from "@/service/public";
import { setEventList } from "@/redux-toolkit/slice/eventSlice";
import { useAppDispatch, useAppSelector } from '@/redux-toolkit/customHook/hook';
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function PublicEvents() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const eventList = useAppSelector((state) => state?.event?.eventList);
  const filteredEvents = eventList?.filter(event => event?.type === "public");

  const handleGetEvent = async () => {
    try {
      const res = await getPublicEvents();
      if (res.status === 200) {
        dispatch(setEventList(res?.data?.event));
      };
    }
    catch (err) {
      console.log(err);
    }
  };
  useEffect(() => {
    if (eventList?.length === 0) {
      handleGetEvent();
    }
  }, [eventList?.length]);

  return (
    <div>
      <section className="py-20  bg-white">
        <div className="container mx-auto px-4 text-center bg-white">
          <h1 className="text-4xl font-display font-bold text-foreground mb-4">
            Events
          </h1>
          <p className="text-muted-foreground">
            Discover our upcoming events and activities
          </p>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {filteredEvents?.map((event, i) => (
              <motion.div
                key={event._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="shadow-card hover:shadow-elevated transition-all h-full overflow-hidden cursor-pointer" onClick={() => { navigate(`/public/events/${event?._id}`) }}>

                  {/* Image Section */}
                  {event?.coverImage && (
                    <div className="w-full h-44 overflow-hidden">
                      <img
                        src={event.coverImage?.[0] || event?.coverImage}
                        alt={event.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}

                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary">
                        {event.category}
                      </span>
                    </div>

                    <h3 className="font-display font-semibold text-lg mb-2">
                      {event.title}
                    </h3>

                    <p className="text-sm text-muted-foreground mb-4">
                      {event.description}
                    </p>

                    <div className="space-y-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-secondary" />
                        {new Date(event.date).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}{" "}
                        at{" "}
                        {new Date(event.date).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>

                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-secondary" />
                        {event.location}
                      </div>

                      <div className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5 text-secondary" />
                        {event.interestedCandidate?.length || 0} attendees
                      </div>
                    </div>
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
