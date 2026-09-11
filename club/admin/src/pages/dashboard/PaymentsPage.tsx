import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { payments } from "@/lib/dummy-data";

export default function PaymentsPage() {
  const totalPaid = payments.filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const totalUnpaid = payments.filter(p => p.status === "unpaid").reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="shadow-card"><CardContent className="p-5 text-center">
          <p className="text-sm text-muted-foreground">Total Collected</p>
          <p className="text-2xl font-display font-bold text-success">₹{totalPaid.toLocaleString()}</p>
        </CardContent></Card>
        <Card className="shadow-card"><CardContent className="p-5 text-center">
          <p className="text-sm text-muted-foreground">Pending</p>
          <p className="text-2xl font-display font-bold text-destructive">₹{totalUnpaid.toLocaleString()}</p>
        </CardContent></Card>
        <Card className="shadow-card"><CardContent className="p-5 text-center">
          <p className="text-sm text-muted-foreground">Collection Rate</p>
          <p className="text-2xl font-display font-bold">{Math.round((totalPaid / (totalPaid + totalUnpaid)) * 100)}%</p>
        </CardContent></Card>
      </div>

      <Card className="shadow-card overflow-hidden">
        <CardHeader><CardTitle className="text-base font-display">Payment History</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium text-sm">{p.member}</TableCell>
                  <TableCell className="text-sm">{p.type}</TableCell>
                  <TableCell className="text-sm">₹{p.amount.toLocaleString()}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.date || "—"}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      p.status === "paid" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                    }`}>{p.status}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
