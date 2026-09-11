import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Vote } from "lucide-react";
import { polls as initialPolls } from "@/lib/dummy-data";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

export default function PollsPage() {
  const [polls, setPolls] = useState(initialPolls);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleVote = (pollId: string, optionIdx: number) => {
    setPolls(polls.map(p =>
      p.id === pollId ? {
        ...p,
        options: p.options.map((o, i) => i === optionIdx ? { ...o, votes: o.votes + 1 } : o),
      } : p
    ));
    toast.success("Vote recorded!");
  };

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const opts = (fd.get("options") as string).split(",").map(t => ({ text: t.trim(), votes: 0 }));
    setPolls([{
      id: String(Date.now()),
      question: fd.get("question") as string,
      options: opts,
      status: "active",
      endDate: fd.get("endDate") as string,
    }, ...polls]);
    setDialogOpen(false);
    toast.success("Poll created");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-display font-semibold text-lg">Polls</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-gold text-secondary-foreground font-semibold"><Plus className="h-4 w-4 mr-1" /> Create Poll</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Poll</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-3">
              <Input name="question" placeholder="Question" required />
              <Input name="options" placeholder="Options (comma-separated)" required />
              <Input name="endDate" type="date" required />
              <Button type="submit" className="w-full gradient-gold text-secondary-foreground font-semibold">Create</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {polls.map((poll) => {
          const totalVotes = poll.options.reduce((s, o) => s + o.votes, 0);
          return (
            <Card key={poll.id} className="shadow-card">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base font-display">{poll.question}</CardTitle>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    poll.status === "active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                  }`}>{poll.status}</span>
                </div>
                <p className="text-xs text-muted-foreground">Ends: {poll.endDate} • {totalVotes} votes</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {poll.options.map((opt, idx) => {
                  const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                  return (
                    <div key={idx}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>{opt.text}</span>
                        <span className="text-muted-foreground">{pct}% ({opt.votes})</span>
                      </div>
                      <Progress value={pct} className="h-2" />
                      {poll.status === "active" && (
                        <Button variant="ghost" size="sm" className="mt-1 h-6 text-xs" onClick={() => handleVote(poll.id, idx)}>
                          <Vote className="h-3 w-3 mr-1" /> Vote
                        </Button>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
