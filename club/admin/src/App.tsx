import { lazy, Suspense, type JSX } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import ErrorBoundary from "@/components/system/ErrorBoundary";
import RouteFallback from "@/components/system/RouteFallback";

/**
 * Two structural changes here.
 *
 * Routing moved from HashRouter to BrowserRouter. Under the hash router every
 * public page lived at /#/public/... and search engines saw one page for the
 * whole site. The Express server already serves index.html for unmatched paths,
 * so deep links work.
 *
 * Every page is now a lazy chunk. All of them used to be static imports, which
 * produced a single 1.3 MB bundle that had to download before anything
 * rendered.
 */

const PublicLayout = lazy(() => import("@/components/PublicLayout").then((m) => ({ default: m.PublicLayout })));
const DashboardLayout = lazy(() => import("@/components/DashboardLayout").then((m) => ({ default: m.DashboardLayout })));

const Home = lazy(() => import("@/pages/Home"));
const About = lazy(() => import("@/pages/About"));
const PublicEvents = lazy(() => import("@/pages/PublicEvents"));
const PublicEventDetail = lazy(() => import("@/components/home/PublicEventDetail"));
const PublicAnnouncements = lazy(() => import("@/pages/PublicAnnouncements"));
const Contact = lazy(() => import("@/pages/Contact"));
const Register = lazy(() => import("@/pages/Register"));
const AdminLogin = lazy(() => import("@/pages/AdminLogin"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const DashboardHome = lazy(() => import("@/pages/dashboard/DashboardHome"));
const MembersPage = lazy(() => import("@/pages/dashboard/MembersPage"));
const EventsPage = lazy(() => import("@/pages/dashboard/EventsPage"));
const AnnouncementsPage = lazy(() => import("@/pages/dashboard/AnnouncementsPage"));
const SuggestionPage = lazy(() => import("@/pages/dashboard/SuggestionPage"));
const PostPage = lazy(() => import("@/pages/dashboard/PostPage"));
const GroupsPage = lazy(() => import("@/pages/dashboard/GroupsPage"));
const BusinessDirectoryPage = lazy(() => import("@/pages/dashboard/BusinessDirectoryPage"));
const GalleryPage = lazy(() => import("@/pages/dashboard/GalleryPage"));
const ReviewPage = lazy(() => import("@/pages/dashboard/ReviewPage"));
const NewsPage = lazy(() => import("@/pages/dashboard/NewsPage"));
const ReportPage = lazy(() => import("@/pages/dashboard/ReportPage"));
const SettingsPage = lazy(() => import("@/pages/dashboard/SettingsPage"));

/* The six pages below render from a local dummy-data file and never call the
   API, so nothing typed into them is saved. They are kept out of the router
   until they are built against real endpoints, rather than sitting in the
   sidebar looking like working features:

     ReferralsPage, TasksPage, FinancePage, PaymentsPage, AttendancePage,
     PollsPage

   Re-add a route here as each one gets a backend. */

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Server data is refetched on demand, not on every window focus.
      refetchOnWindowFocus: false,
      staleTime: 30_000,
      retry: 1
    }
  }
});

/** Waits for the session check before deciding, so a valid session is never bounced. */
const RequireAdmin = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <RouteFallback />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

const RedirectIfSignedIn = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <RouteFallback />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
};

const AppRoutes = () => (
  <Suspense fallback={<RouteFallback />}>
    <Routes>
      {/* Public */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/public/about" element={<About />} />
        <Route path="/public/events" element={<PublicEvents />} />
        <Route path="/public/events/:id" element={<PublicEventDetail />} />
        <Route path="/public/announcements" element={<PublicAnnouncements />} />
        <Route path="/public/contact" element={<Contact />} />
      </Route>

      <Route path="/register" element={<Register />} />
      <Route
        path="/login"
        element={
          <RedirectIfSignedIn>
            <AdminLogin />
          </RedirectIfSignedIn>
        }
      />

      {/* Dashboard */}
      <Route
        path="/dashboard"
        element={
          <RequireAdmin>
            <DashboardLayout />
          </RequireAdmin>
        }
      >
        <Route index element={<DashboardHome />} />
        <Route path="members" element={<MembersPage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="announcements" element={<AnnouncementsPage />} />
        <Route path="suggestions" element={<SuggestionPage />} />
        <Route path="admin-posts" element={<PostPage type="admin" />} />
        <Route path="user-posts" element={<PostPage type="user" />} />
        <Route path="groups" element={<GroupsPage />} />
        <Route path="businessDirectory" element={<BusinessDirectoryPage />} />
        <Route path="gallery" element={<GalleryPage />} />
        <Route path="reviews" element={<ReviewPage />} />
        <Route path="news" element={<NewsPage />} />
        <Route path="reports" element={<ReportPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  </Suspense>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {/* The dashboard is served under /admin, so every route path below is
            written relative to that. Do not prefix a path with "/admin" here:
            basename adds it, and writing it twice produces /admin/admin/... */}
        <BrowserRouter basename="/admin">
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
