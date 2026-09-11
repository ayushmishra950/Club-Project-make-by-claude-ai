
import { useEffect, useRef, useState } from "react";
import { Users, Loader2, ArrowLeft, X, Lightbulb } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { getAllSuggestion, addSuggestion, replyToSuggestion, markSuggestionAsRead } from "@/service/suggestion";
import { useAppDispatch, useAppSelector } from "@/redux-toolkit/customHook/hook";
import { setSuggestionList, setNewSuggestion, setUpdateSuggestion, clearUnreadCount, incrementUnreadCount } from "@/redux-toolkit/slice/suggestionSlice";
import { useNavigate } from "react-router-dom";
import socket from "@/socket/socket";

export default function SuggestionPage() {
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const user = JSON.parse(localStorage.getItem("member.user") || "{}");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  const [selectedSuggestion, setSelectedSuggestion] = useState<any>(null);

  const suggestionList = useAppSelector((state) => state?.suggestion?.suggestionList);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  };

  useEffect(() => {
    if (selectedSuggestion) {
      scrollToBottom();
    }
  }, [selectedSuggestion, selectedSuggestion?.adminReplies?.length]);

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await markSuggestionAsRead(id);
      if (res.status === 200) {
        dispatch(setUpdateSuggestion(res.data.data));
        setSelectedSuggestion((prev) => prev?._id === id ? res.data.data : prev);
      }
    } catch (err) {
      console.error("Failed to mark suggestion as read", err);
    }
  };

  useEffect(() => {
    if (selectedSuggestion?._id && selectedSuggestion?.userUnreadCount > 0) {
      handleMarkAsRead(selectedSuggestion._id);
    }
  }, [selectedSuggestion?._id, selectedSuggestion?.userUnreadCount]);

  useEffect(() => {
    socket.on("updateSuggestionStatus", (data) => {
      dispatch(setUpdateSuggestion(data));
      setSelectedSuggestion((prev) => prev?._id === data._id ? data : prev);
    });

    socket.on("suggestionReply", (data) => {
      dispatch(setUpdateSuggestion(data));
      setSelectedSuggestion((prev) => prev?._id === data._id ? data : prev);
    });

    socket.on("suggestionRead", (data) => {
      dispatch(setUpdateSuggestion(data));
      setSelectedSuggestion((prev) => prev?._id === data._id ? data : prev);
    });

    return () => {
      socket.off("updateSuggestionStatus");
      socket.off("suggestionReply");
      socket.off("suggestionRead");
    };
  }, [dispatch]);

  // ================= FETCH =================
  const fetchSuggestions = async () => {
    try {
      setLoading(true);

      const res = await getAllSuggestion(
        user?._id
      );

      if (res.status === 200) {
        dispatch(
          setSuggestionList(res?.data?.data)
        );
      }
    } catch (err) {
      toast({
        title: "Error",
        description:
          err?.message ||
          "Failed to fetch data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
    dispatch(clearUnreadCount());
  }, [user?._id]);

  // ================= SEND MESSAGE =================
  const handleSendMessage = async () => {
    if (!message.trim()) return;

    try {
      setSending(true);

      const res = await addSuggestion({
        userId: user?._id,
        suggestion: message,
      });

      if (res.status === 201) {
        toast({
          title: "Success",
          description:
            "Suggestion sent successfully",
        });

        setMessage("");

        dispatch(
          setNewSuggestion(res?.data?.data)
        );
      }
    } catch (err) {
      toast({
        title: "Error",
        description:
          "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  // ================= SEND REPLY =================
  const handleSendReply = async () => {
    if (!message.trim() || !selectedSuggestion?._id) return;

    try {
      setSending(true);

      const res = await replyToSuggestion({
        id: selectedSuggestion._id,
        userId: user?._id,
        adminReply: message,
      });

      if (res.status === 200) {
        toast({
          title: "Success",
          description: "Reply sent successfully",
        });
        setMessage("");
        dispatch(setUpdateSuggestion(res.data.data));
        setSelectedSuggestion(res.data.data);
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to send reply",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col">

      {/* ================= HEADER ================= */}
      <div className="sticky top-0 z-10 bg-background border-b px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </button>

        <Users className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold">
          Suggestions
        </h1>
      </div>

      {/* INPUT AREA (MOVED TO TOP) */}
      <div className="border-t px-4 py-3 flex gap-2">
        <input
          value={message}
          onChange={(e) =>
            setMessage(e.target.value)
          }
          placeholder="Write suggestion..."
          className="flex-1 h-10 px-3 border rounded-md text-sm"
        />

        <button
          onClick={handleSendMessage}
          disabled={
            sending || !message.trim()
          }
          className="px-4 h-10 bg-primary text-white rounded-md text-sm"
        >
          {sending ? "Sending..." : "Send"}
        </button>
      </div>

      {/* ================= LIST ================= */}
      <ScrollArea className="flex-1 px-6 py-4">
        <div className="space-y-4">

          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Loading...
              </p>
            </div>
          ) : suggestionList?.length > 0 ? (
            suggestionList.map((item) => (
              <div
                key={item._id}
                onClick={() =>
                  setSelectedSuggestion(item)
                }
                className="p-4 border rounded-lg bg-card cursor-pointer hover:bg-muted transition"
              >
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium truncate">
                    {item?.suggestion}
                  </p>

                  <div className="flex items-center gap-2">
                    {item?.userUnreadCount > 0 && (
                      <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-primary text-primary-foreground animate-pulse shadow-sm">
                        {item.userUnreadCount} New
                      </span>
                    )}

                    <span className={`text-xs px-3 py-1 rounded-full font-medium capitalize ${item?.status === 'accepted' ? 'bg-green-100 text-green-700' :
                      item?.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                      {item?.status}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              No suggestions found
            </p>
          )}

        </div>
      </ScrollArea>
      {/* ================= CENTER MODAL ================= */}
      {selectedSuggestion && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-card border shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">

            {/* Header */}
            <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-lg">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-base leading-none mb-1">Suggestion Details</h2>
                  <p className={`text-xs font-medium px-2 py-0.5 rounded-full inline-block mt-1 ${selectedSuggestion?.status === 'accepted' ? 'bg-green-100 text-green-700' :
                    selectedSuggestion?.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                    {selectedSuggestion?.status}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSuggestion(null)}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Area */}
            {/* <ScrollArea className="flex-1 p-4"> */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-6">
                {/* User's Original Suggestion */}
                <div className="flex flex-col gap-1.5 items-end max-w-[85%] ml-auto">
                  <div className="p-3 rounded-2xl rounded-tr-none bg-primary text-primary-foreground text-sm shadow-sm">
                    <p className="font-semibold text-[10px] opacity-70 mb-1">Your Suggestion</p>
                    {selectedSuggestion?.suggestion}
                  </div>
                  <span className="text-[10px] text-muted-foreground mr-1">
                    {new Date(selectedSuggestion?.createdAt).toLocaleString()}
                  </span>
                </div>

                {/* Divider */}
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-muted-foreground/20"></span>
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
                    <span className="bg-card px-2 text-muted-foreground font-semibold">Replies</span>
                  </div>
                </div>

                {/* Replies */}
                <div className="space-y-4">
                  {selectedSuggestion?.adminReplies?.length > 0 ? (
                    selectedSuggestion.adminReplies.map((r, i: number) => {
                      const replyUserId = typeof r.userId === "object" ? r.userId?._id : r.userId;
                      const isMe = replyUserId === user?._id;

                      return (
                        <div key={i} className={`flex flex-col gap-1.5 ${isMe ? 'items-end' : 'items-start'}`}>
                          <div className={`p-3 rounded-2xl text-sm shadow-sm max-w-[85%] border ${isMe
                            ? 'bg-primary text-primary-foreground rounded-tr-none'
                            : 'bg-muted text-foreground rounded-tl-none'
                            }`}>
                            <p className="font-semibold text-[10px] opacity-70 mb-1">
                              {isMe ? 'You' : 'Admin'}
                            </p>
                            {r.message}
                          </div>
                          <span className="text-[10px] text-muted-foreground mx-1">
                            {new Date(r.createdAt).toLocaleString()}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-sm text-muted-foreground italic">No replies yet. Admin will review your suggestion soon.</p>
                    </div>
                  )}
                </div>
                <div ref={messagesEndRef} />
              </div>
              {/* </ScrollArea> */}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t bg-muted/10">
              <div className="flex gap-2 items-end">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="flex-1 min-h-[44px] max-h-32 bg-background border rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                  placeholder="Type a message..."
                  rows={1}
                />
                <button
                  onClick={handleSendReply}
                  disabled={sending || !message.trim()}
                  className="h-11 px-5 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}