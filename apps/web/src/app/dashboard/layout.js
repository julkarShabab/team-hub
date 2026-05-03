"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  LayoutDashboard,
  Target,
  Megaphone,
  CheckSquare,
  Users,
  BarChart3,
  LogOut,
  Settings,
  Plus,
  ChevronDown,
  Moon,
  Sun,
  Bell,
  Search,
} from "lucide-react";
import useAuthStore from "../../store/authStore";
import useWorkspaceStore from "../../store/workspaceStore";
import { useSocket } from "../../hooks/useSocket";
import Avatar from "../../components/Avatar";
import CreateWorkspaceModal from "../../components/modals/CreateWorkspaceModal";
import CommandPalette from "../../components/CommandPalette";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const { user, isLoading, refreshUser, logout, isAuthenticated } =
    useAuthStore();
  const { workspaces, currentWorkspace, fetchWorkspaces, setCurrentWorkspace } =
    useWorkspaceStore();
  const [darkMode, setDarkMode] = useState(false);
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Setup socket for current workspace
  useSocket(currentWorkspace?.id);

  useEffect(() => {
    const init = async () => {
      await refreshUser();
    };
    init();
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated]);

  useEffect(() => {
    const saved = localStorage.getItem("darkMode");
    if (saved === "true") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchWorkspaces().then((ws) => {
        if (ws?.length > 0) {
          const savedId = localStorage.getItem("current_workspace_id");
          const saved = ws.find((w) => w.id === savedId);
          setCurrentWorkspace(saved || ws[0]);
        }
      });
    }
  }, [isAuthenticated]);

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem("darkMode", next);
    document.documentElement.classList.toggle("dark", next);
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
    toast.success("Logged out");
  };

  const navItems = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/goals", label: "Goals", icon: Target },
    {
      href: "/dashboard/announcements",
      label: "Announcements",
      icon: Megaphone,
    },
    {
      href: "/dashboard/action-items",
      label: "Action Items",
      icon: CheckSquare,
    },
    { href: "/dashboard/members", label: "Members", icon: Users },
    { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isLoading && !isAuthenticated) {
    router.push("/login");
    return null;
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen overflow-hidden app-bg">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? "w-64" : "w-16"} flex-shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-all duration-200`}
      >
        {/* Workspace Switcher */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
            className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{
                backgroundColor: currentWorkspace?.accentColor || "#6366f1",
              }}
            >
              {currentWorkspace?.name?.[0] || "T"}
            </div>
            {sidebarOpen && (
              <>
                <span className="flex-1 text-left text-sm font-medium truncate text-gray-900 dark:text-white">
                  {currentWorkspace?.name || "Select workspace"}
                </span>
                <ChevronDown size={14} className="text-gray-400" />
              </>
            )}
          </button>

          {/* Workspace dropdown */}
          {showWorkspaceMenu && sidebarOpen && (
            <div className="mt-1 card overflow-hidden shadow-lg z-50 absolute w-56">
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => {
                    setCurrentWorkspace(ws);
                    setShowWorkspaceMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm text-left"
                >
                  <div
                    className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: ws.accentColor || "#6366f1" }}
                  >
                    {ws.name[0]}
                  </div>
                  <span className="truncate text-gray-700 dark:text-gray-300">
                    {ws.name}
                  </span>
                  {ws.id === currentWorkspace?.id && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-brand-500" />
                  )}
                </button>
              ))}
              <button
                onClick={() => {
                  setShowCreateWorkspace(true);
                  setShowWorkspaceMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm text-brand-500 border-t border-gray-100 dark:border-gray-800"
              >
                <Plus size={14} /> New workspace
              </button>
            </div>
          )}
        </div>

        
        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {/* Search / Command Palette trigger */}
          {sidebarOpen && (
            <button
              onClick={() => {
                const e = new KeyboardEvent("keydown", {
                  key: "k",
                  ctrlKey: true,
                  bubbles: true,
                });
                window.dispatchEvent(e);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 mb-2 rounded-lg text-sm text-gray-400 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
            >
              <Search size={14} />
              <span className="flex-1 text-left">Search...</span>
              <kbd className="text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-1.5 py-0.5 font-mono">
                ⌘K
              </kbd>
            </button>
          )}
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <Icon size={18} className="flex-shrink-0" />
                {sidebarOpen && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-800 space-y-0.5">
          <button
            onClick={toggleDark}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            {sidebarOpen && (
              <span>{darkMode ? "Light mode" : "Dark mode"}</span>
            )}
          </button>
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Settings size={18} />
            {sidebarOpen && <span>Settings</span>}
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut size={18} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>

        {/* User */}
        {sidebarOpen && user && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <Avatar user={user} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user.name}
                </p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">{children}</main>

      {showCreateWorkspace && (
        <CreateWorkspaceModal onClose={() => setShowCreateWorkspace(false)} />
      )}
      <CommandPalette />
    </div>
  );
}
