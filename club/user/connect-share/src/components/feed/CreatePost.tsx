import { Image, Video, X } from 'lucide-react';
import { currentUser } from '@/data/mockData';
import { useRef, useState } from 'react';
import PostDialog from "../forms/PostDialog";
import { addNotes } from "@/service/post";
import { useToast } from '@/hooks/use-toast';

export function CreatePost({ setPostListRefresh }) {
  const { toast } = useToast();
  const user = JSON.parse(localStorage.getItem("member.user"));
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const [initialData, setInitialData] = useState(null);
  const [newMessage, setNewMessage] = useState("");

  const handleAddNotes = async () => {
    try {
      const obj = { userId: user?._id, notes: newMessage };
      const res = await addNotes(obj);
      
      if (res.status === 201) {
        toast({ title: "Notes Added Successfully.", description: res?.data?.message });
        setPostListRefresh(true);
        setNewMessage("");
      }
    }
    catch (err) {
      console.log(err);
      toast({ title: "Add Notes Failed.", description: err?.response?.data?.message || err?.message, variant: "destructive" })
    }
  }

  return (
    <>
      <PostDialog isOpen={isPostDialogOpen} onOpenChange={setIsPostDialogOpen} initialData={initialData} setPostListRefresh={setPostListRefresh} />
      <div className="bg-card rounded-xl shadow-card p-4 mb-4 relative">
        {/* Post input */}
        <div className="flex gap-3">
          <img
            src={user?.profileImage || "https://imgs.search.brave.com/xCedoimthG97d8n6Aqc-6LyqR2Oa5N-3B_5XNwx_Hqc/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly91cGxv/YWQud2lraW1lZGlh/Lm9yZy93aWtpcGVk/aWEvY29tbW9ucy9h/L2FjL0RlZmF1bHRf/cGZwLmpwZz9fPTIw/MjAwNDE4MDkyMTA2"}
            alt=""
            className="h-10 w-10 rounded-full object-cover shrink-0"
          />
          <div className="relative w-full">
            <input
              type="text"
              placeholder="What's on your mind?"
              value={newMessage}
              onChange={(e) => { setNewMessage(e.target.value) }}
              className="w-full rounded-full bg-muted px-4 pr-16 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all text-foreground placeholder:text-muted-foreground"
            />

            <button type='button' onClick={handleAddNotes} disabled={!newMessage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-white px-3 py-1 rounded-full text-xs hover:bg-primary/80 transition">
              Send
            </button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
          {/* Photo */}
          <button
            type='button'
            onClick={() => { setInitialData(null); setIsPostDialogOpen(true) }}
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors flex-1 justify-center"
          >
            <Image className="h-5 w-5 text-green-500" />
            <span className="hidden sm:inline">Photo</span>
          </button>
          {/* Video */}
          <button
            type='button'
            onClick={() => { setInitialData(null); setIsPostDialogOpen(true) }}
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors flex-1 justify-center"
          >
            <Video className="h-5 w-5 text-red-500" />
            <span className="hidden sm:inline">Video</span>
          </button>
        </div>

      </div>

    </>
  );
}