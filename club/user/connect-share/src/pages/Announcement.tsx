import { useEffect, useState } from "react";
import { Search, Megaphone } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { mockChats } from "@/data/mockData";
import { getAllAnnouncement } from "@/service/announcement";
import { useAppDispatch, useAppSelector } from "@/redux-toolkit/customHook/hook";
import { setAnnouncementList, setNewAnnouncement } from "@/redux-toolkit/slice/announcementSlice";
import socket from "@/socket/socket";

const AnnouncementPage = () => {
  const [chatOpen, setChatOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState("all");
  const dispatch = useAppDispatch();
  const announcementList = useAppSelector((state)=> state?.announcement?.announcementList);

  
  useEffect(()=>{
    socket.on("announcement", (data) => {
      dispatch(setNewAnnouncement(data));
    });
    return () => {
        socket.off("announcement");
    }
  },[])
  const totalUnread = mockChats.reduce((acc, c) => acc + c.unread, 0);

  const filtered = announcementList.filter((ann) => {
    const query = search.toLowerCase();

    const matchesSearch =
      ann.title?.toLowerCase().includes(query) ||
      ann.description?.toLowerCase().includes(query);

    const matchesPriority =
      priority === "all" || ann.priority === priority;

    return matchesSearch && matchesPriority;
  });


  const handleGetAnnouncements = async () => {
    try {
      const res = await getAllAnnouncement();
      if (res.status === 200) {
        dispatch(setAnnouncementList(res?.data?.announcements));
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    if(announcementList?.length === 0){
    handleGetAnnouncements(); 
    }
  }, [announcementList?.length]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        onChatToggle={() => setChatOpen(!chatOpen)}
        chatUnread={totalUnread}
      />

      <div className="mx-auto max-w-4xl px-4 py-6">
        <h1 className="font-heading text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-primary" />
          Announcements
        </h1>

        {/* 🔍 SEARCH + FILTER */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search announcements..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg bg-card border border-border pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
            />
          </div>

          {/* PRIORITY FILTER */}
          <div className="flex gap-2">
            {["all", "high", "medium", "low"].map((p) => (
              <button
                key={p}
                onClick={() => setPriority(p)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  priority === p
                    ? "gradient-primary text-primary-foreground"
                    : "bg-card border border-border text-muted-foreground"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* 📢 ANNOUNCEMENT LIST */}
        {filtered.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {filtered.map((ann) => (
              <div
                key={ann._id}
                className="bg-card rounded-xl shadow-card p-4 hover:shadow-elevated transition"
              >
                {/* HEADER */}
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-foreground">
                    {ann.title}
                  </h3>

                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      ann.priority === "high"
                        ? "bg-destructive/10 text-destructive"
                        : ann.priority === "medium"
                        ? "bg-warning/10 text-warning"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {ann.priority}
                  </span>
                </div>

                {/* DESCRIPTION */}
                <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                  {ann.description}
                </p>

                {/* FOOTER */}
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>By Admin</span>
                  <span>
                    {new Date(ann.createdAt).toLocaleString([], {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex justify-center items-center h-[300px]">
            <p className="text-muted-foreground">
              📢 No Announcements Found
            </p>
          </div>
        )}
      </div>

      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
};

export default AnnouncementPage;