import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { attendance, members } from "@/lib/dummy-data";

export default function AttendancePage() {
  const chartData = attendance.map(a => ({
    event: a.eventTitle.slice(0, 15) + "...",
    present: a.present.length,
    absent: a.absent.length,
  }));

  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader><CardTitle className="text-base font-display">Attendance Overview</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(210 20% 90%)" />
              <XAxis dataKey="event" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="present" fill="hsl(152 60% 42%)" name="Present" radius={[4, 4, 0, 0]} />
              <Bar dataKey="absent" fill="hsl(0 84% 60%)" name="Absent" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {attendance.map((record) => (
        <Card key={record.eventId} className="shadow-card overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base font-display">{record.eventTitle} — {record.date}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium text-sm">{m.name}</TableCell>
                    <TableCell className="text-center">
                      {record.present.includes(m.id) ? (
                        <CheckCircle className="h-4 w-4 text-success inline" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive inline" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
