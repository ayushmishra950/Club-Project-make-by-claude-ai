import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, GripVertical } from "lucide-react";
import { tasks as initialTasks } from "@/lib/dummy-data";
import { toast } from "sonner";

type TaskStatus = "pending" | "in-progress" | "completed";
const columns: { status: TaskStatus; label: string; color: string }[] = [
  { status: "pending", label: "Pending", color: "bg-warning/10 border-warning/30" },
  { status: "in-progress", label: "In Progress", color: "bg-info/10 border-info/30" },
  { status: "completed", label: "Completed", color: "bg-success/10 border-success/30" },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState(initialTasks);
  const [dialogOpen, setDialogOpen] = useState(false);

  const moveTask = (id: string, newStatus: TaskStatus) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus } : t));
    toast.success("Task updated");
  };

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setTasks([...tasks, {
      id: String(Date.now()),
      title: fd.get("title") as string,
      assignee: fd.get("assignee") as string,
      status: "pending",
      dueDate: fd.get("dueDate") as string,
      priority: fd.get("priority") as string || "medium",
    }]);
    setDialogOpen(false);
    toast.success("Task created");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-display font-semibold text-lg">Task Board</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-gold text-secondary-foreground font-semibold"><Plus className="h-4 w-4 mr-1" /> Add Task</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Task</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-3">
              <Input name="title" placeholder="Task Title" required />
              <Input name="assignee" placeholder="Assignee" required />
              <Input name="dueDate" type="date" required />
              <select name="priority" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <Button type="submit" className="w-full gradient-gold text-secondary-foreground font-semibold">Create</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {columns.map((col) => (
          <div key={col.status}>
            <div className={`rounded-lg border p-3 ${col.color} mb-3`}>
              <h4 className="font-display font-semibold text-sm">{col.label} ({tasks.filter(t => t.status === col.status).length})</h4>
            </div>
            <div className="space-y-3">
              {tasks.filter(t => t.status === col.status).map((task) => (
                <Card key={task.id} className="shadow-card">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm mb-1">{task.title}</h4>
                        <p className="text-xs text-muted-foreground mb-2">{task.assignee} • Due {task.dueDate}</p>
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            task.priority === "high" ? "bg-destructive/10 text-destructive" :
                            task.priority === "medium" ? "bg-warning/10 text-warning" :
                            "bg-muted text-muted-foreground"
                          }`}>{task.priority}</span>
                          <div className="flex gap-1">
                            {columns.filter(c => c.status !== task.status).map((c) => (
                              <Button key={c.status} variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => moveTask(task.id, c.status)}>
                                → {c.label.split(" ")[0]}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
