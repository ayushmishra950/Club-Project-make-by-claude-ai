import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, DollarSign, TrendingUp, FileText, LayoutGrid, Briefcase, Megaphone, Lightbulb } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { getAllAnnouncement } from "@/service/announcement";
import { useAppDispatch, useAppSelector } from "@/redux-toolkit/customHook/hook";
import { setAnnouncementList } from "@/redux-toolkit/slice/announcementSlice";
import { useEffect, useState } from "react";
import { getDashboardStats, getYearlyAnalytics } from "@/service/dashboard";
import { setDashboardStats, setGraphStats } from "@/redux-toolkit/slice/dashboardSlice";
import socket from "@/socket/socket";



export default function DashboardHome() {
  const [dashboardStatsRefresh, setDashboardStatsRefresh] = useState(false);
  const [announcementListRefresh, setAnnouncementListRefresh] = useState(false);
  const dispatch = useAppDispatch();
  const announcementList = useAppSelector((state) => state?.announcement?.announcementList);
  const dashboardStats = useAppSelector((state) => state?.dashboard?.dashboardStats);
  const graphStats = useAppSelector((state) => state?.dashboard?.graphStats);


  const statCards = [
    { title: "Total Members", value: dashboardStats?.users?.total, change: dashboardStats?.users?.active + " active this month", icon: Users, color: "text-primary", bg: "bg-primary/10" },
    { title: "Total Events", value: dashboardStats?.events?.total, change: dashboardStats?.events?.currentMonth + " this month", icon: Calendar, color: "text-secondary", bg: "bg-secondary/10" },
    { title: "Total Posts", value: dashboardStats?.posts?.total, change: dashboardStats?.posts?.currentMonth + " this month", icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "Total Groups", value: dashboardStats?.groups?.total, change: dashboardStats?.groups?.currentMonth + " this month", icon: LayoutGrid, color: "text-indigo-500", bg: "bg-indigo-500/10" },
    { title: "Business Directory", value: dashboardStats?.business?.total, change: dashboardStats?.business?.currentMonth + " this month", icon: Briefcase, color: "text-amber-500", bg: "bg-amber-500/10" },
    { title: "Announcements", value: dashboardStats?.announcements?.total, change: dashboardStats?.announcements?.currentMonth + " this month", icon: Megaphone, color: "text-rose-500", bg: "bg-rose-500/10" },
    { title: "Suggestions", value: dashboardStats?.suggestions?.total, change: dashboardStats?.suggestions?.currentMonth + " this month", icon: Lightbulb, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { title: "Business Revenue", value: `₹ ${dashboardStats?.revenue?.total}`, change: `₹ ${dashboardStats?.revenue?.currentMonth}` + " this month", icon: Lightbulb, color: "text-emerald-500", bg: "bg-emerald-500/10" },

  ];


  useEffect(() => {
    socket.on("paymentSuccess", () => {
      setDashboardStatsRefresh(true);
    })
    return () => {
      socket.off("paymentSuccess");
    }
  }, [])

  const handleGetYearlyAnalytics = async () => {
    try {
      const res = await getYearlyAnalytics();
      if (res.status === 200) {
        setDashboardStatsRefresh(false);
        dispatch(setGraphStats(res?.data?.data));
      }
    }
    catch (err) {
      console.log(err);
    }
  }

  useEffect(() => {
    if (!graphStats || Object.keys(graphStats)?.length === 0 || dashboardStatsRefresh) {
      handleGetYearlyAnalytics();
    }
  }, [graphStats, dashboardStatsRefresh])

  const handleGetDashboardStats = async () => {
    try {
      const res = await getDashboardStats();
      if (res.status === 200) {
        setDashboardStatsRefresh(false);
        dispatch(setDashboardStats(res?.data?.data));
      }
    }
    catch (err) {
      console.log(err);
    }
  }


  useEffect(() => {
    if (!dashboardStats || Object.keys(dashboardStats)?.length === 0 || dashboardStatsRefresh) {
      handleGetDashboardStats();
    }
  }, [dashboardStats, dashboardStatsRefresh])

  const handleGetAllAnnouncements = async () => {
    try {
      const res = await getAllAnnouncement();
      if (res.status === 200) {
        dispatch(setAnnouncementList(res?.data?.announcements));
        setAnnouncementListRefresh(false);
      }
    }
    catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    if (announcementList?.length === 0 || announcementListRefresh) {
      handleGetAllAnnouncements();
    }
  }, [announcementList?.length, announcementListRefresh])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="shadow-card">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-display font-bold mt-1">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg ${stat.bg || "bg-muted"} flex items-center justify-center`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader><CardTitle className="text-base font-display">Monthly Activity</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={graphStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(210 20% 90%)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="members" fill="hsl(207 78% 20%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="events" fill="hsl(44 89% 61%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader><CardTitle className="text-base font-display">Revenue Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={graphStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(210 20% 90%)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="hsl(207 78% 20%)" strokeWidth={2} dot={{ fill: "hsl(44 89% 61%)" }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader><CardTitle className="text-base font-display">Recent Announcements</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {announcementList.slice(0, 3).map((ann) => (
              <div key={ann.id} className="flex items-start justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <h4 className="font-medium text-sm">{ann.title}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{ann.description}</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-medium shrink-0 ml-3 ${ann.priority === "high" ? "bg-destructive/10 text-destructive" :
                  ann.priority === "medium" ? "bg-warning/10 text-warning" :
                    "bg-muted text-muted-foreground"
                  }`}>{ann.priority}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
