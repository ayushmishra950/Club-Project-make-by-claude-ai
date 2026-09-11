
import { useEffect, useRef, useState } from "react";
import { Users, Loader2, ArrowLeft, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { getAllSuggestion, updateSuggestionStatus, replyToSuggestion, markSuggestionAsRead } from "@/service/suggestion";
import { useAppDispatch, useAppSelector } from "@/redux-toolkit/customHook/hook";
import { setSuggestionList, setUpdateSuggestionStatus, setNewSuggestion } from "@/redux-toolkit/slice/suggestionSlice";
import { useNavigate } from "react-router-dom";
import ConfirmCard from "@/components/cards/ConfirmCard";
import socket from "@/socket/socket";

export default function SuggestionPage() {
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const user = JSON.parse(localStorage.getItem("admin.user") || "{}");

  const suggestionList = useAppSelector(
    (state) => state?.suggestion?.suggestionList
  );

  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  const [reply, setReply] = useState("");

  // 🔥 CONFIRM CONTROL
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    id: string;
    status?: "accepted" | "rejected";
    message?: string;
    type: "status" | "reply";
  } | null>(null);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  };

  useEffect(() => {
    if (selected) {
      scrollToBottom();
    }
  }, [selected, selected?.adminReplies]);

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await markSuggestionAsRead(id);
      if (res.status === 200) {
        dispatch(setUpdateSuggestionStatus(res.data.data));
        setSelected((prev: any) => prev?._id === id ? res.data.data : prev);
      }
    } catch (err) {
      console.error("Failed to mark suggestion as read", err);
    }
  };

  useEffect(() => {
    if (selected?._id && selected?.adminUnreadCount > 0) {
      handleMarkAsRead(selected._id);
    }
  }, [selected?._id, selected?.adminUnreadCount]);

  useEffect(() => {
    socket.on("addSuggestion", (data) => {
      dispatch(setNewSuggestion(data));
    });

    socket.on("updateSuggestionStatus", (data) => {
      dispatch(setUpdateSuggestionStatus(data));
      setSelected((prev: any) => prev?._id === data._id ? data : prev);
    });

    socket.on("suggestionReply", (data) => {
      dispatch(setUpdateSuggestionStatus(data));
      setSelected((prev: any) => prev?._id === data._id ? data : prev);
    });

    socket.on("suggestionRead", (data) => {
      dispatch(setUpdateSuggestionStatus(data));
      setSelected((prev: any) => prev?._id === data._id ? data : prev);
    });

    return () => {
      socket.off("addSuggestion");
      socket.off("updateSuggestionStatus");
      socket.off("suggestionReply");
      socket.off("suggestionRead");
    };
  }, [dispatch]);

  // ================= FETCH =================
  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const res = await getAllSuggestion();
      console.log(res, "suggestion")
      if (res.status === 200) {
        dispatch(setSuggestionList(res?.data?.data));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  // ================= STATUS CLICK =================
  const askStatusConfirm = (id: string, status: "accepted" | "rejected") => {
    setPendingAction({
      id,
      status,
      type: "status",
    });
    setConfirmOpen(true);
  };

  // ================= REPLY CLICK =================
  const askReplyConfirm = () => {
    if (!selected?._id || !reply.trim()) return;

    setPendingAction({
      id: selected._id,
      message: reply,
      type: "reply",
    });
    setConfirmOpen(true);
  };

  // ================= CONFIRM ACTION =================
  const handleConfirm = async () => {
    if (!pendingAction) return;

    try {
      setConfirmLoading(true);

      // ===== STATUS =====
      if (pendingAction.type === "status") {
        const res = await updateSuggestionStatus({
          id: pendingAction.id,
          status: pendingAction.status,
        });

        if (res.status === 200) {
          dispatch(setUpdateSuggestionStatus(res?.data?.data));
          toast({
            title: `Suggestion ${pendingAction.status}`,
            description: res?.data?.message,
          });
        }
      }

      // ===== REPLY =====
      if (pendingAction.type === "reply") {
        const res = await replyToSuggestion({
          id: pendingAction.id,
          userId: user?._id,
          adminReply: pendingAction.message,
        });

        if (res.status === 200) {
          dispatch(setUpdateSuggestionStatus(res?.data?.data));
          setSelected(res?.data?.data);
          setReply("");
          toast({
            title: "Reply sent",
            description: res?.data?.message,
          });
        }
      }

      setConfirmOpen(false);
      setPendingAction(null);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message,
        variant: "destructive",
      });
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <>
      {/* ================= CONFIRM CARD ================= */}
      <ConfirmCard
        isOpen={confirmOpen}
        onOpenChange={setConfirmOpen}
        isLoading={confirmLoading}
        onConfirm={handleConfirm}
        title={
          pendingAction?.type === "status"
            ? pendingAction?.status === "accepted"
              ? "Accept Suggestion"
              : "Reject Suggestion"
            : "Send Reply"
        }
        description={
          pendingAction?.type === "status"
            ? "Are you sure you want to update status?"
            : "Are you sure you want to send this reply?"
        }
        buttonName="Confirm"
      />

      {/* ================= PAGE ================= */}
      <div className="min-h-screen flex flex-col bg-background">

        {/* HEADER */}
        <div className="flex items-center gap-3 border-b p-4">
          <button onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Users className="w-5 h-5 text-primary" />
          <h1 className="font-bold text-lg">Suggestions</h1>
        </div>

        {/* LIST */}
        <ScrollArea className="flex-1 p-4">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">

              {suggestionList?.map((item: any) => (
                <div
                  key={item._id}
                  onClick={() => setSelected(item)}
                  className="border rounded-lg p-4 flex justify-between items-center cursor-pointer hover:bg-muted"
                >
                  <div className="flex-1">
                    <p className="font-medium">
                      {item?.createdBy?.fullName}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {item?.suggestion}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {item?.adminUnreadCount > 0 && (
                      <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-primary text-primary-foreground animate-pulse shadow-sm">
                        {item.adminUnreadCount} New
                      </span>
                    )}

                    <span className={`text-xs px-2 py-1 rounded-full capitalize
                      ${item.status === "pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : item.status === "accepted"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                      {item.status}
                    </span>

                    {/* ACCEPT / REJECT */}
                    {item.status === "pending" && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            askStatusConfirm(item._id, "accepted");
                          }}
                          className="text-xs px-2 py-1 bg-green-100 rounded"
                        >
                          Accept
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            askStatusConfirm(item._id, "rejected");
                          }}
                          className="text-xs px-2 py-1 bg-red-100 rounded"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}

            </div>
          )}
        </ScrollArea>

        {/* ================= MODAL ================= */}
        {selected && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="w-full max-w-lg bg-card border shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">

              {/* Header */}
              <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                    {selected?.createdBy?.fullName?.[0]}
                  </div>
                  <div>
                    <h2 className="font-bold text-base leading-none mb-1">
                      {selected?.createdBy?.fullName}
                    </h2>
                    <p className="text-xs text-muted-foreground">Suggestion Details</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="p-2 hover:bg-muted rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Chat Area */}
              {/* <ScrollArea className="flex-1 p-4"> */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-6">
                  {/* Original Suggestion */}
                  <div className="flex flex-col gap-1.5 max-w-[85%]">
                    <div className="p-3 rounded-2xl rounded-tl-none bg-muted text-sm shadow-sm border">
                      <p className="font-semibold text-xs text-muted-foreground mb-1">User Suggestion</p>
                      {selected?.suggestion}
                    </div>
                    <span className="text-[10px] text-muted-foreground ml-1">
                      {new Date(selected?.createdAt).toLocaleString()}
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
                    {selected?.adminReplies?.length > 0 ? (
                      selected.adminReplies.map((r: any, i: number) => {
                        const isMe = r.userId === user?._id;
                        return (
                          <div key={i} className={`flex flex-col gap-1.5 ${isMe ? 'items-end' : 'items-start'}`}>
                            <div className={`p-3 rounded-2xl text-sm shadow-sm max-w-[85%] border ${isMe
                              ? 'bg-primary text-primary-foreground rounded-tr-none'
                              : 'bg-card text-foreground rounded-tl-none'
                              }`}>
                              <p className="font-semibold text-[10px] opacity-70 mb-1">
                                {isMe ? 'Admin (You)' : 'User Reply'}
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
                        <p className="text-sm text-muted-foreground italic">No replies yet. Start the conversation!</p>
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
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    className="flex-1 min-h-[44px] max-h-32 bg-background border rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                    placeholder="Type your reply..."
                    rows={1}
                  />
                  <button
                    onClick={askReplyConfirm}
                    disabled={!reply.trim()}
                    className="h-11 px-5 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}