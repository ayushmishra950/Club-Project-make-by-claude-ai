import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link2, Copy, UserPlus } from "lucide-react";
import { referrals } from "@/lib/dummy-data";
import { toast } from "sonner";

export default function ReferralsPage() {
  const copyLink = () => {
    navigator.clipboard.writeText("https://clubconnect.org/join?ref=RS2026");
    toast.success("Referral link copied!");
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-card gradient-hero">
        <CardContent className="p-6">
          <h3 className="font-display font-semibold text-lg text-primary-foreground mb-2">Invite Members</h3>
          <p className="text-primary-foreground/70 text-sm mb-4">Share your referral link to invite new members</p>
          <div className="flex gap-2">
            <Input value="https://clubconnect.org/join?ref=RS2026" readOnly className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground" />
            <Button onClick={copyLink} variant="outline" className="border-primary-foreground/30 text-primary-foreground shrink-0">
              <Copy className="h-4 w-4 mr-1" /> Copy
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="shadow-card"><CardContent className="p-5 text-center">
          <UserPlus className="h-8 w-8 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-display font-bold">{referrals.length}</p>
          <p className="text-sm text-muted-foreground">Total Referrals</p>
        </CardContent></Card>
        <Card className="shadow-card"><CardContent className="p-5 text-center">
          <Link2 className="h-8 w-8 mx-auto mb-2 text-success" />
          <p className="text-2xl font-display font-bold">{referrals.filter(r => r.status === "accepted").length}</p>
          <p className="text-sm text-muted-foreground">Accepted</p>
        </CardContent></Card>
        <Card className="shadow-card"><CardContent className="p-5 text-center">
          <Link2 className="h-8 w-8 mx-auto mb-2 text-warning" />
          <p className="text-2xl font-display font-bold">{referrals.filter(r => r.status === "pending").length}</p>
          <p className="text-sm text-muted-foreground">Pending</p>
        </CardContent></Card>
      </div>

      <Card className="shadow-card">
        <CardHeader><CardTitle className="text-base font-display">Referral History</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {referrals.map((ref) => (
              <div key={ref.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium text-sm">{ref.referred}</p>
                  <p className="text-xs text-muted-foreground">Referred by {ref.referrer} • {ref.date}</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  ref.status === "accepted" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                }`}>{ref.status}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
