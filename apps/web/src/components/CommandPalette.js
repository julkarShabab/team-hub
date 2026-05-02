'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard, Target, Megaphone, CheckSquare,
  Users, BarChart3, Settings, LogOut, Moon, Sun,
  Plus, Search, ArrowRight
} from 'lucide-react';
import useAuthStore from '../store/authStore';

const COMMANDS = [
  // Navigation
  { id: 'nav-overview', label: 'Go to Overview', icon: LayoutDashboard, category: 'Navigation', action: 'navigate', path: '/dashboard' },
  { id: 'nav-goals', label: 'Go to Goals', icon: Target, category: 'Navigation', action: 'navigate', path: '/dashboard/goals' },
  { id: 'nav-announcements', label: 'Go to Announcements', icon: Megaphone, category: 'Navigation', action: 'navigate', path: '/dashboard/announcements' },
  { id: 'nav-action-items', label: 'Go to Action Items', icon: CheckSquare, category: 'Navigation', action: 'navigate', path: '/dashboard/action-items' },
  { id: 'nav-members', label: 'Go to Members', icon: Users, category: 'Navigation', action: 'navigate', path: '/dashboard/members' },
  { id: 'nav-analytics', label: 'Go to Analytics', icon: BarChart3, category: 'Navigation', action: 'navigate', path: '/dashboard/analytics' },
  { id: 'nav-settings', label: 'Go to Settings', icon: Settings, category: 'Navigation', action: 'navigate', path: '/dashboard/settings' },
  // Actions
  { id: 'action-logout', label: 'Logout', icon: LogOut, category: 'Actions', action: 'logout' },
  { id: 'action-dark', label: 'Toggle Dark Mode', icon: Moon, category: 'Actions', action: 'darkmode' },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef(null);
  const router = useRouter();
  const { logout } = useAuthStore();

  // Open on Ctrl+K or Cmd+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
        setQuery('');
        setSelected(0);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const filtered = COMMANDS.filter((cmd) =>
    cmd.label.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (!open) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelected((prev) => Math.min(prev + 1, filtered.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelected((prev) => Math.max(prev - 1, 0));
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selected]) executeCommand(filtered[selected]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, selected, filtered]);

  const executeCommand = async (cmd) => {
    setOpen(false);
    if (cmd.action === 'navigate') {
      router.push(cmd.path);
    } else if (cmd.action === 'logout') {
      await logout();
      router.push('/login');
    } else if (cmd.action === 'darkmode') {
      const isDark = document.documentElement.classList.contains('dark');
      document.documentElement.classList.toggle('dark', !isDark);
      localStorage.setItem('darkMode', !isDark);
    }
  };

  // Group by category
  const grouped = filtered.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {});

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/50 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-slide-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <Search size={18} className="text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-400 text-sm"
          />
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-gray-100 dark:bg-gray-800 text-gray-500">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">No commands found</p>
          ) : (
            Object.entries(grouped).map(([category, commands]) => (
              <div key={category}>
                <p className="px-4 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {category}
                </p>
                {commands.map((cmd) => {
                  const globalIndex = filtered.indexOf(cmd);
                  const isSelected = globalIndex === selected;
                  return (
                    <button
                      key={cmd.id}
                      onClick={() => executeCommand(cmd)}
                      onMouseEnter={() => setSelected(globalIndex)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                        isSelected
                          ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <cmd.icon size={16} className="flex-shrink-0" />
                      <span className="flex-1 text-left">{cmd.label}</span>
                      {isSelected && <ArrowRight size={14} className="text-gray-400" />}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 flex items-center gap-4 text-xs text-gray-400">
          <span><kbd className="font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">↑↓</kbd> navigate</span>
          <span><kbd className="font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">↵</kbd> select</span>
          <span><kbd className="font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">ESC</kbd> close</span>
          <span className="ml-auto"><kbd className="font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">Ctrl+K</kbd> toggle</span>
        </div>
      </div>
    </div>
  );
}