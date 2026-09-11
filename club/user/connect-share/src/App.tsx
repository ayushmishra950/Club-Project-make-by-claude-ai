import { lazy, Suspense, useEffect, type JSX } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ConnectionProvider } from "@/hooks/useConnections";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import ErrorBoundary from "@/components/system/ErrorBoundary";
import RouteFallback from "@/components/system/RouteFallback";
import socket from "./socket/socket";
import { useAppDispatch } from "@/redux-toolkit/customHook/hook";
import { setUpdateSuggestion, incrementUnreadCount } from "@/redux-toolkit/slice/suggestionSlice";

/**
 * Routing moved from HashRouter to BrowserRouter so the public pages have real
 * URLs that search engines and link previews can read, and every page is a
 * lazy chunk instead of one 954 KB bundle.
 *
 * Route guards now wait on the session check in `useAuth` rather than testing
 * whether a string exists in local storage.
 */

const PublicLayout = lazy(() => import("@/components/PublicLayout").then((m) => ({ default: m.PublicLayout })));

const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const PublicEvents = lazy(() => import("./pages/PublicEvents"));
const PublicEventDetail = lazy(() => import("@/components/home/PublicEventDetail"));
const PublicAnnouncements = lazy(() => import("./pages/PublicAnnouncements"));
const Contact = lazy(() => import("./pages/Contact"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const DeleteAccount = lazy(() => import("./pages/DeleteAccount"));
const ChildSafety = lazy(() => import("./pages/ChildSafety"));

const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const ForgetPassword = lazy(() => import("@/pages/ForgetPassword"));
const NewPassword = lazy(() => import("@/pages/NewPassword"));
const AuthSuccess = lazy(() => import("@/pages/AuthSuccess"));

const Index = lazy(() => import("./pages/Index"));
const Profile = lazy(() => import("./pages/Profile"));
const Events = lazy(() => import("./pages/Events"));
const EventDetail = lazy(() => import("@/pages/EventDetail"));
const Groups = lazy(() => import("./pages/Groups"));
const GroupDetails = lazy(() => import("./pages/GroupDetails"));
const Directory = lazy(() => import("./pages/Directory"));
const FriendRequests = lazy(() => import("./pages/FriendRequests"));
const AnnouncementPage = lazy(() => import("@/pages/Announcement"));
const SuggestionPage = lazy(() => import("@/pages/SuggestionPage"));
const ReviewPage = lazy(() => import("@/pages/ReviewPage"));
const BlockedUsers = lazy(() => import("@/pages/BlockedUser"));
const UserDialog = lazy(() => import("@/components/forms/UserDialog"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, staleTime: 30_000, retry: 1 }
  }
});

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <RouteFallback />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

const PublicRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <RouteFallback />;
  if (isAuthenticated) return <Navigate to="/home" replace />;
  return children;
};

/** Signed-in members land on the feed; visitors get the marketing site. */
const RootRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <RouteFallback />;
  if (isAuthenticated) return <Navigate to="/home" replace />;
  return <PublicLayout />;
};

/** Realtime subscriptions that belong to the whole app rather than one page. */
const SuggestionSocketBridge = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const handleUpdate = (data: { _id?: string }) => {
      if (!data?._id) return;
      dispatch(setUpdateSuggestion(data));
      dispatch(incrementUnreadCount());
    };

    socket.on("updateSuggestionStatus", handleUpdate);
    socket.on("suggestionReply", handleUpdate);

    return () => {
      socket.off("updateSuggestionStatus", handleUpdate);
      socket.off("suggestionReply", handleUpdate);
    };
  }, [dispatch]);

  return null;
};

const AppRoutes = () => (
  <Suspense fallback={<RouteFallback />}>
    <Routes>
      <Route path="/" element={<RootRoute />}>
        <Route index element={<Home />} />
        <Route path="public/about" element={<About />} />
        <Route path="public/events" element={<PublicEvents />} />
        <Route path="public/events/:id" element={<PublicEventDetail />} />
        <Route path="public/announcements" element={<PublicAnnouncements />} />
        <Route path="public/contact" element={<Contact />} />
        <Route path="privacy-policy" element={<PrivacyPolicy />} />
        <Route path="delete-account" element={<DeleteAccount />} />
        <Route path="child-safety" element={<ChildSafety />} />
      </Route>

      <Route path="/auth-success" element={<AuthSuccess />} />

      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/forget-password" element={<PublicRoute><ForgetPassword /></PublicRoute>} />
      {/* Reached from an emailed link, so it must open even without a session. */}
      <Route path="/new-password" element={<NewPassword />} />

      <Route path="/home" element={<ProtectedRoute><Index /></ProtectedRoute>} />
      <Route path="/profile/:userId" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
      <Route path="/event/detail/:id" element={<ProtectedRoute><EventDetail /></ProtectedRoute>} />
      <Route path="/blocked" element={<ProtectedRoute><BlockedUsers /></ProtectedRoute>} />
      <Route path="/suggestions" element={<ProtectedRoute><SuggestionPage /></ProtectedRoute>} />
      <Route path="/reviews" element={<ProtectedRoute><ReviewPage /></ProtectedRoute>} />
      <Route path="/groups" element={<ProtectedRoute><Groups /></ProtectedRoute>} />
      <Route path="/groups/:groupId" element={<ProtectedRoute><GroupDetails /></ProtectedRoute>} />
      <Route path="/directory" element={<ProtectedRoute><Directory /></ProtectedRoute>} />
      <Route path="/friends" element={<ProtectedRoute><FriendRequests /></ProtectedRoute>} />
      <Route path="/announcements" element={<ProtectedRoute><AnnouncementPage /></ProtectedRoute>} />
      <Route path="/userDialog/:id" element={<ProtectedRoute><UserDialog /></ProtectedRoute>} />

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
        <BrowserRouter>
          <AuthProvider>
            <ConnectionProvider>
              <SuggestionSocketBridge />
              <AppRoutes />
            </ConnectionProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
