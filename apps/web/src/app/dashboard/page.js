"use client";
import { useEffect, useState } from "react";
import {
  Target,
  CheckSquare,
  AlertTriangle,
  TrendingUp,
  Users,
  Activity,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import useWorkspaceStore from "../../store/workspaceStore";
import api from "../../lib/api";
import Avatar from "../../components/Avatar";
import { format } from "date-fns";

const STATUS_COLORS = {
  ON_TRACK: "#22c55e",
  AT_RISK: "#f59e0b",
  COMPLETED: "#6366f1",
  CANCELLED: "#94a3b8",
};

export default function DashboardPage() {
  const { currentWorkspace, members } = useWorkspaceStore();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentWorkspace?.id) return;
    setLoading(true);
    api
      .get(`/analytics/workspace/${currentWorkspace.id}`)
      .then((r) => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [currentWorkspace?.id]);

  if (!currentWorkspace) {
    return (
      <div className="p-8 text-center text-gray-500">
        <Target size={48} className="mx-auto mb-4 opacity-30" />
        <p className="font-medium">No workspace selected</p>
        <p className="text-sm mt-1">
          Create or join a workspace to get started
        </p>
      </div>
    );
  }

  const statCards = stats
    ? [
        {
          label: "Total Goals",
          value: stats.stats.totalGoals,
          icon: Target,
          color: "text-brand-500",
          bg: "bg-brand-50 dark:bg-brand-900/20",
          borderColor: '#6366f1' 
        },
        {
          label: "Completed Goals",
          value: stats.stats.completedGoals,
          icon: CheckSquare,
          color: "text-green-500",
          bg: "bg-green-50 dark:bg-green-900/20",
          borderColor: '#22c55e'
        },
        {
          label: "Overdue",
          value: stats.stats.overdueGoals + stats.stats.overdueItems,
          icon: AlertTriangle,
          color: "text-red-500",
          bg: "bg-red-50 dark:bg-red-900/20",
          borderColor: '#ef4444'
        },
        {
          label: "Completed This Week",
          value: stats.stats.completedItemsThisWeek,
          icon: TrendingUp,
          color: "text-purple-500",
          bg: "bg-purple-50 dark:bg-purple-900/20",
          borderColor: '#a855f7'
        },
      ]
    : [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {currentWorkspace.name}
        </h1>
        {currentWorkspace.description && (
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {currentWorkspace.description}
          </p>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-3" />
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-12" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statCards.map((card) => (
              <div
                key={card.label}
                className="card p-5 border-l-4"
                style={{ borderLeftColor: card.borderColor }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {card.label}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}
                  >
                    <card.icon size={16} className={card.color} />
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {card.value}
                </p>
              </div>
            ))}
          </div>

          {/* Charts */}
          {stats?.goalsByStatus?.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Bar chart */}
              <div className="card p-5">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
                  Goals by Status
                </h2>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={stats.goalsByStatus}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {stats.goalsByStatus.map((entry) => (
                        <Cell
                          key={entry.status}
                          fill={STATUS_COLORS[entry.status] || "#6366f1"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Pie chart */}
              <div className="card p-5">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
                  Goal Distribution
                </h2>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={stats.goalsByStatus}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ status, count }) => `${status}: ${count}`}
                    >
                      {stats.goalsByStatus.map((entry) => (
                        <Cell
                          key={entry.status}
                          fill={STATUS_COLORS[entry.status] || "#6366f1"}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Recent activity */}
          {stats?.recentActivity?.length > 0 && (
            <div className="card p-5">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Activity size={18} className="text-brand-500" />
                Recent Activity
              </h2>
              <div className="space-y-4">
                {stats.recentActivity.map((update) => (
                  <div key={update.id} className="flex gap-3">
                    <Avatar user={update.user} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-medium">{update.user.name}</span>
                        {" posted an update on "}
                        <span className="font-medium text-brand-500">
                          {update.goal.title}
                        </span>
                      </p>
                      <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                        {update.content}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {format(new Date(update.createdAt), "MMM d, h:mm a")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
