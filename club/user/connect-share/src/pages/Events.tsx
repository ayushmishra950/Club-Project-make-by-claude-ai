import { useEffect, useRef, useState } from 'react';
import { Calendar, MapPin, Users, Lock } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { mockEvents, mockChats } from '@/data/mockData';
import { getEvent, interestedOrNotInterestedFromEvent } from "@/service/event";
import { formatBackendDateTime, getEventStatus } from "@/service/global";
import { setInterestedOrNotInterestedCandidate, setEventList, setNewEvent } from "@/redux-toolkit/slice/eventSlice";
import { useToast } from '@/hooks/use-toast';
import { useAppDispatch, useAppSelector } from '@/redux-toolkit/customHook/hook';
import socket from "@/socket/socket";
import { useLocation, useNavigate } from 'react-router-dom';

const Events = () => {
  const user = JSON.parse(localStorage.getItem("member.user"));
  const { toast } = useToast();
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);
  const [events, setEvents] = useState(mockEvents);
  const [eventListRefresh, setEventListRefresh] = useState(false);
  const dispatch = useAppDispatch();
  const eventList = useAppSelector((state) => state?.event?.eventList);
  const location = useLocation();
  const eventRef = useRef({});
  const queryParams = new URLSearchParams(location.search);
  const selectedEventId = queryParams.get("eventId");

  const totalUnread = mockChats.reduce((acc, c) => acc + c.unread, 0);

  useEffect(() => {
    socket.on("event", (data) => {
      dispatch(setNewEvent(data));
    })
    return () => {
      socket.off("event")
    }
  }, []);

  useEffect(() => {
    if (selectedEventId && eventRef.current[selectedEventId]) {
      eventRef.current[selectedEventId].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [selectedEventId, eventList]);

  const handleGetEvent = async () => {
    try {
      const res = await getEvent();
      if (res.status === 200) {
        dispatch(setEventList(res?.data?.event));
        setEventListRefresh(false);
      }
    }
    catch (err) {
      console.log(err);
    }
  };

  const interestedCandidate = async (eventId) => {
    const obj = { eventId: eventId, userId: user?._id };
    try {
      const res = await interestedOrNotInterestedFromEvent(obj);
      if (res.status === 200) {
        dispatch(setInterestedOrNotInterestedCandidate(obj));
        socket.emit("interestedcandidateFromEvent", obj);

      }
    }
    catch (err) {
      console.log(err);
      toast({ title: "Event Candidate add Failed.", description: err?.response?.data?.message, variant: "destructive" })
    }
  }


  useEffect(() => {
    if (eventList?.length === 0 || eventListRefresh) {
      handleGetEvent();
    }
  }, [eventList?.length, eventListRefresh])

  return (
    <div className="min-h-screen bg-background">
      <Navbar onChatToggle={() => setChatOpen(!chatOpen)} chatUnread={totalUnread} />
      <div className="mx-auto max-w-4xl px-4 py-6">
        <h1 className="font-heading text-2xl font-bold text-foreground mb-6">Events</h1>
        <div className="space-y-4">
          {
            eventList?.length > 0 ? (
              eventList.map(event => {
                const status = getEventStatus(event.date);

                return (
                  <div key={event._id} ref={(el) => (eventRef.current[event?._id] = el)} className="bg-card rounded-xl shadow-card overflow-hidden relative cursor-pointer" onClick={() => navigate(`/event/detail/${event?._id}`)}>

                    {/* STATUS BADGE */}
                    <div className="absolute top-3 right-3">
                      {status === "upcoming" && (
                        <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                          Upcoming
                        </span>
                      )}

                      {status === "live" && (
                        <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                          Ongoing
                        </span>
                      )}

                      {status === "past" && (
                        <span className="bg-gray-500 text-white text-xs px-2 py-1 rounded-full">
                          Completed
                        </span>
                      )}
                    </div>

                    <img src={event?.coverImage?.[0]} alt="" className="w-full h-48 object-cover" />

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h2 className="font-heading text-lg font-bold text-foreground">
                              {event.title}
                            </h2>
                            {event.isPrivate && (
                              <Lock className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>

                          <p className="text-sm text-muted-foreground mb-3">
                            {event.description}
                          </p>

                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="h-4 w-4" />
                              {formatBackendDateTime(event.date)}
                            </span>

                            <span className="flex items-center gap-1.5">
                              <MapPin className="h-4 w-4" />
                              {event.location}
                            </span>

                            <span className="flex items-center gap-1.5">
                              <Users className="h-4 w-4" />
                              {event?.interestedCandidate?.length} attending
                            </span>
                          </div>
                        </div>

                        {/* JOIN BUTTON */}
                        <button
                          onClick={() => interestedCandidate(event._id)}
                          disabled={status === "past"}
                          className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-all
                  ${status === "past"
                              ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                              : event?.interestedCandidate?.includes(user?._id)
                                ? "bg-primary/10 text-primary"
                                : "gradient-primary text-primary-foreground hover:opacity-90"
                            }`}
                        >
                          {status === "past"
                            ? "Ended"
                            : event?.interestedCandidate?.includes(user?._id)
                              ? "Joined ✓"
                              : "Join"
                          }
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex justify-center items-center mt-20">
                <span className="text-muted-foreground text-sm">
                  No Event Found.
                </span>
              </div>
            )
          }
        </div>
      </div>
      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
};

export default Events;
