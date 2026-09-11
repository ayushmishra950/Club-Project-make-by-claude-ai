
import { useEffect, useRef, useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Megaphone,
  FileText,
  Settings,
  Menu,
  X,
  Bell,
  LogOut,
  ChevronLeft,
  ChevronDown,
  Lightbulb,
  Images,
  Star,
  Newspaper,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { getAllNotifications } from "@/service/notification";
import {
  useAppDispatch,
  useAppSelector,
} from "@/redux-toolkit/customHook/hook";

import {
  setNotificationList,
  setNewNotifications,
} from "@/redux-toolkit/slice/notificationSlice";

import DeleteCard from "./cards/DeleteCard";
import socket from "@/socket/socket";
import appLogo from "@/assets/logo.jpg";
import { useAuth } from "@/hooks/useAuth";

// ======================================================
// ================= MENU ITEMS =========================
// ======================================================

const menuItems = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },

  {
    label: "Members",
    path: "/dashboard/members",
    icon: Users,
  },

  {
    label: "Events",
    path: "/dashboard/events",
    icon: Calendar,
  },

  // ================= POSTS DROPDOWN =================

  {
    label: "Posts",
    icon: FileText,
    children: [
      {
        label: "Admin Posts",
        path: "/dashboard/admin-posts",
      },
      {
        label: "User Posts",
        path: "/dashboard/user-posts",
      },
    ],
  },

  {
    label: "Groups",
    path: "/dashboard/groups",
    icon: FileText,
  },

  {
    label: "Business Directory",
    path: "/dashboard/businessDirectory",
    icon: FileText,
  },

  {
    label: "Announcements",
    path: "/dashboard/announcements",
    icon: Megaphone,
  },

  {
    label: "Suggestions",
    path: "/dashboard/suggestions",
    icon: Lightbulb,
  },

  {
    label: "Gallery",
    path: "/dashboard/gallery",
    icon: Images,
  },

  {
    label: "Reviews",
    path: "/dashboard/reviews",
    icon: Star,
  },

  {
    label: "News & Updates",
    path: "/dashboard/news",
    icon: Newspaper,
  },
  {
    label: "Reports",
    path: "/dashboard/reports",
    icon: Newspaper,
  },

  {
    label: "Settings",
    path: "/dashboard/settings",
    icon: Settings,
  },
];

export function DashboardLayout() {

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [collapsed, setCollapsed] = useState(false);

  const [notifOpen, setNotifOpen] = useState(false);

  const { signOut } = useAuth();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const [logoutLoading, setLogoutLoading] = useState(false);

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const location = useLocation();

  const navigate = useNavigate();

  const dispatch = useAppDispatch();

  const notificationList = useAppSelector(
    (state) => state?.notification?.notificationList
  );

  // ======================================================
  // ================= UNREAD COUNT =======================
  // ======================================================

  const unreadSuggestionCount = notificationList?.filter(
    (item) =>
      (item?.type === "suggestion" ||
        item?.type === "new_user") &&
      item?.isRead === false
  )?.length;

  // ======================================================
  // ================= ACTIVE CHECK =======================
  // ======================================================

  const isActive = (path: string) =>
    path === "/dashboard"
      ? location.pathname === path
      : location.pathname.startsWith(path);


  useEffect(() => {
    if (
      location.pathname.startsWith("/dashboard/admin-posts") ||
      location.pathname.startsWith("/dashboard/user-posts")
    ) {
      setOpenDropdown("Posts");
    }
  }, [location.pathname]);

  // ======================================================
  // ================= SOCKETS ============================
  // ======================================================

  useEffect(() => {

    socket.on("adminNotification", (data) => {
      dispatch(setNewNotifications(data));
    });

    socket.on("notificationSeen", (data) => {
      dispatch(setNotificationList(data));
    });

    return () => {
      socket.off("adminNotification");
      socket.off("notificationSeen");
    };

  }, []);

  // ======================================================
  // ================= LOGOUT =============================
  // ======================================================

  const handleLogout = async () => {
    try {
      setLogoutLoading(true);
      /* This used to remove only "user" and leave the access token in place,
         so signing out hid the interface without ending the session. signOut
         also tells the server to drop the refresh token, which is what
         actually ends it. */
      await signOut();
      navigate("/login", { replace: true });
    } catch (err) {
      console.log(err);
    } finally {
      setLogoutLoading(false);
      setLogoutDialogOpen(false);
    }
  };

  // ======================================================
  // ================= GET NOTIFICATIONS ==================
  // ======================================================

  const handleGetAllNotifications = async () => {

    try {

      const res = await getAllNotifications();

      if (res.status === 200) {

        dispatch(setNotificationList(res?.data?.data));
      }

    } catch (err) {

      console.log(err);
    }
  };

  useEffect(() => {
    handleGetAllNotifications();
  }, []);

  // ======================================================
  // ================= SIDEBAR ============================
  // ======================================================

  const SidebarContent = () => (

    <>

      {/* LOGOUT DIALOG */}

      <DeleteCard
        isOpen={logoutDialogOpen}
        onOpenChange={setLogoutDialogOpen}
        isLoading={logoutLoading}
        buttonName="Logout"
        title="Admin Logout"
        description="Are you sure you want to Logout."
        onConfirm={handleLogout}
      />

      <div className="flex flex-col h-full">

        {/* HEADER */}

        <div className="p-4 flex items-center justify-between border-b border-sidebar-border">

          {!collapsed && (

            <Link to="/" className="flex items-center gap-2">

              <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center overflow-hidden">

                <img
                  src={appLogo}
                  alt="logo"
                  className="w-full h-full object-cover"
                />

              </div>

              <span className="font-display font-bold text-sidebar-foreground">
                ClubConnect
              </span>

            </Link>
          )}

          {/* COLLAPSE BUTTON */}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:block p-1 rounded hover:bg-sidebar-accent text-sidebar-foreground"
          >

            <ChevronLeft
              className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""
                }`}
            />

          </button>

          {/* MOBILE CLOSE */}

          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 text-sidebar-foreground"
          >

            <X className="h-5 w-5" />

          </button>

        </div>

        {/* NAVIGATION */}

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">

          {menuItems.map((item, index) => {

            const Icon = item.icon;

            // ======================================================
            // ================= DROPDOWN MENU ======================
            // ======================================================

            if (item.children) {

              const isDropdownActive = item.children.some(
                (child) => isActive(child.path)
              );

              return (

                <div key={index}>

                  {/* PARENT BUTTON */}

                  <button
                    onClick={() => {
                      if (openDropdown === item.label) {
                        setOpenDropdown(null);
                      } else {
                        setOpenDropdown(item.label);
                      }
                    }}
                    className={`
                      w-full flex items-center justify-between
                      px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                      ${isDropdownActive
                        ? "bg-sidebar-accent text-sidebar-primary"
                        : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                      }
                    `}
                  >

                    <div className="flex items-center gap-3">

                      <Icon className="h-4.5 w-4.5 shrink-0" />

                      {!collapsed && <span>{item.label}</span>}

                    </div>

                    {!collapsed && (
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${openDropdown === item.label
                          ? "rotate-180"
                          : ""
                          }`}
                      />
                    )}

                  </button>

                  {/* CHILDREN */}

                  <AnimatePresence>

                    {openDropdown === item.label && !collapsed && (

                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden ml-6 mt-1 space-y-1"
                      >

                        {item.children.map((child) => (

                          <Link
                            key={child.path}
                            to={child.path}
                            onClick={(e) => { e.stopPropagation(); setSidebarOpen(false) }}
                            className={`
                              flex items-center px-3 py-2 rounded-lg text-sm transition-colors
                              ${isActive(child.path)
                                ? "bg-sidebar-accent text-sidebar-primary"
                                : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                              }
                            `}
                          >

                            {child.label}

                          </Link>
                        ))}

                      </motion.div>
                    )}

                  </AnimatePresence>

                </div>
              );
            }

            // ======================================================
            // ================= NORMAL MENU ========================
            // ======================================================

            return (

              <Link
                key={item.path}
                to={item.path!}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${isActive(item.path!)
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                  }
                `}
              >

                <Icon className="h-4.5 w-4.5 shrink-0" />

                {!collapsed && <span>{item.label}</span>}

              </Link>
            );
          })}
        </nav>

        {/* LOGOUT */}

        <div className="p-3 border-t border-sidebar-border">

          <button
            onClick={() => {
              setLogoutDialogOpen(true);
            }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 w-full"
          >

            <LogOut className="h-4.5 w-4.5 shrink-0" />

            {!collapsed && <span>Log Out</span>}

          </button>

        </div>

      </div>
    </>
  );

  // ======================================================
  // ================= MAIN RETURN ========================
  // ======================================================

  return (

    <div className="min-h-screen flex bg-background">

      {/* DESKTOP SIDEBAR */}

      <aside
        className={`
          hidden lg:flex flex-col shrink-0 gradient-primary transition-all duration-300
          ${collapsed ? "w-16" : "w-64"}
        `}
      >

        <SidebarContent />

      </aside>

      {/* MOBILE SIDEBAR */}

      <AnimatePresence>

        {sidebarOpen && (

          <>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-foreground/50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />

            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "tween" }}
              className="fixed left-0 top-0 bottom-0 w-64 z-50 gradient-primary lg:hidden"
            >

              <SidebarContent />

            </motion.aside>

          </>
        )}

      </AnimatePresence>

      {/* MAIN CONTENT */}

      <div className="flex-1 flex flex-col min-w-0">

        {/* HEADER */}

        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 shrink-0">

          <div className="flex items-center gap-3">

            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-muted"
            >

              <Menu className="h-5 w-5" />

            </button>

            <h2 className="font-display font-semibold text-lg">

              {menuItems.find((i) => {
                if (i.children) {
                  return i.children.some((c) =>
                    isActive(c.path)
                  );
                }
                return isActive(i.path);
              })?.label || "Dashboard"}

            </h2>

          </div>

          {/* RIGHT SIDE */}

          <div className="flex items-center gap-2">

            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => setNotifOpen(!notifOpen)}
            >

              <Bell className="h-5 w-5" />

              {unreadSuggestionCount > 0 && (

                <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 text-[10px] flex items-center justify-center rounded-full bg-destructive text-white">

                  {unreadSuggestionCount}

                </span>
              )}

            </Button>

            {notifOpen && (
              <div ref={dropdownRef}>
                <NotificationDropdown
                  notifOpen={notifOpen}
                  notifications={notificationList}
                  onClose={() => setNotifOpen(false)}
                />
              </div>
            )}

            {/* PROFILE */}

            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center">

              <span className="text-primary-foreground text-xs font-bold">
                RS
              </span>

            </div>

          </div>

        </header>

        {/* PAGE CONTENT */}

        <main className="flex-1 p-4 md:p-6 overflow-y-auto">

          <Outlet />

        </main>

      </div>
    </div>
  );
}
