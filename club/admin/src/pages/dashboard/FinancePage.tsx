import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUpRight, ArrowDownRight, DollarSign, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { finances } from "@/lib/dummy-data";

const totalIncome = finances.filter(f => f.type === "income").reduce((s, f) => s + f.amount, 0);
const totalExpense = finances.filter(f => f.type === "expense").reduce((s, f) => s + f.amount, 0);

const categoryData = Object.entries(
  finances.reduce((acc, f) => {
    acc[f.category] = (acc[f.category] || 0) + f.amount;
    return acc;
  }, {} as Record<string, number>)
).map(([name, value]) => ({ name, value }));

const COLORS = ["hsl(207 78% 20%)", "hsl(44 89% 61%)", "hsl(152 60% 42%)", "hsl(38 92% 50%)", "hsl(207 78% 55%)"];

export default function FinancePage() {
  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="shadow-card"><CardContent className="p-5">
          <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center"><ArrowUpRight className="h-5 w-5 text-success" /></div>
          <div><p className="text-sm text-muted-foreground">Total Income</p><p className="text-xl font-display font-bold">₹{totalIncome.toLocaleString()}</p></div></div>
        </CardContent></Card>
        <Card className="shadow-card"><CardContent className="p-5">
          <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center"><ArrowDownRight className="h-5 w-5 text-destructive" /></div>
          <div><p className="text-sm text-muted-foreground">Total Expenses</p><p className="text-xl font-display font-bold">₹{totalExpense.toLocaleString()}</p></div></div>
        </CardContent></Card>
        <Card className="shadow-card"><CardContent className="p-5">
          <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center"><TrendingUp className="h-5 w-5 text-info" /></div>
          <div><p className="text-sm text-muted-foreground">Net Balance</p><p className="text-xl font-display font-bold">₹{(totalIncome - totalExpense).toLocaleString()}</p></div></div>
        </CardContent></Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader><CardTitle className="text-base font-display">Income vs Expenses</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={[{ name: "Income", value: totalIncome }, { name: "Expenses", value: totalExpense }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(210 20% 90%)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  <Cell fill="hsl(152 60% 42%)" />
                  <Cell fill="hsl(0 84% 60%)" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader><CardTitle className="text-base font-display">By Category</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value" label={({ name }) => name}>
                  {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card overflow-hidden">
        <CardHeader><CardTitle className="text-base font-display">Transactions</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {finances.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium text-sm">{f.description}</TableCell>
                  <TableCell className="text-sm">{f.category}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{f.date}</TableCell>
                  <TableCell className={`text-right font-medium text-sm ${f.type === "income" ? "text-success" : "text-destructive"}`}>
                    {f.type === "income" ? "+" : "-"}₹{f.amount.toLocaleString()}
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
