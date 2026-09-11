
import { Send } from 'lucide-react';
import { useState } from 'react';
import { addSuggestion } from "@/service/suggestion";
import { useToast } from '@/hooks/use-toast';

export function MessageSection() {
  const { toast } = useToast();
  const user = JSON.parse(localStorage.getItem("member.user"));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSend = async () => {
    if (!message.trim() || !user?._id) return;

    const obj = { description: message.trim(), userId: user?._id };
    try {
      setLoading(true);
      const res = await addSuggestion(obj);

      if (res.status === 201) {
        toast({ title: "Message Send Successfully.", description: res?.data?.message });
        setMessage("");
      }
    }
    catch (err) {
      console.log(err);
      toast({ title: "Message Send Failed.", description: err?.response?.data?.message || err?.message, variant: "destructive" })
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="bg-card rounded-xl shadow-card p-4 mt-4">
      <h3 className="font-heading font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
        <Send className="h-4 w-4 text-primary" />
        Message Admin
      </h3>

      <div className="space-y-3">
        {/* Input */}
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write your message to admin..."
          className="w-full text-sm rounded-lg border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          rows={3}
        />

        {/* Button */}
        <button
          onClick={handleSend}
          disabled={loading}
          className={`w-full text-sm font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2 ${loading
              ? "bg-primary/70 cursor-not-allowed"
              : "bg-primary hover:opacity-90"
            } text-primary-foreground`}
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          ) : (
            "Send to Admin"
          )}
        </button>
      </div>
    </div>
  );
}