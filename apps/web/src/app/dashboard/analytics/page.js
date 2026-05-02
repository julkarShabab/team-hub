'use client';
import { useEffect, useState } from 'react';
import { Download, TrendingUp, Target, CheckSquare, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import useWorkspaceStore from '../../../store/workspaceStore';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#94a3b8'];

export default function AnalyticsPage() {
  const { currentWorkspace } = useWorkspaceStore();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentWorkspace?.id) return;
    setLoading(true);
    api.get(`/analytics/workspace/${currentWorkspace.id}`)
      .then((r) => setStats(r.data))
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, [currentWorkspace?.id]);

  const handleExport = async () => {
    try {
      const res = await api.get(`/workspaces/${currentWorkspace.id}/export`, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'workspace-export.csv';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Export downloaded');
    } catch {
      toast.error('Export failed');
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) return null;

  const { stats: s, goalsByStatus, recentActivity } = stats;

  const statCards = [
    { label: 'Total Goals', value: s.totalGoals, icon: Target, color: 'text-brand-500' },
    { label: 'Completed Goals', value: s.completedGoals, icon: CheckSquare, color: 'text-green-500' },
    { label: 'Total Action Items', value: s.totalItems, icon: CheckSquare, color: 'text-blue-500' },
    { label: 'Done This Week', value: s.completedItemsThisWeek, icon: TrendingUp, color: 'text-purple-500' },
    { label: 'Overdue Goals', value: s.overdueGoals, icon: AlertTriangle, color: 'text-red-500' },
    { label: 'Overdue Items', value: s.overdueItems, icon: AlertTriangle, color: 'text-orange-500' },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
        <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {statCards.map((card) => (
          <div key={card.label} className="card p-5">
            <div className="flex items-center gap-3 mb-2">
              <card.icon size={18} className={card.color} />
              <span className="text-sm text-gray-500">{card.label}</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Goals by status */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Goals by Status</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={goalsByStatus} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="status" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {goalsByStatus.map((entry, i) => (
                  <Cell key={entry.status} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Goal Distribution</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={goalsByStatus}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                outerRadius={90}
                
              >
                {goalsByStatus.map((entry, i) => (
                  <Cell key={entry.status} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Completion rate */}
      {s.totalGoals > 0 && (
        <div className="card p-5 mt-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Goal Completion Rate</h2>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-sm text-gray-500 mb-1">
                <span>Progress</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {Math.round((s.completedGoals / s.totalGoals) * 100)}%
                </span>
              </div>
              <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-500 to-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.round((s.completedGoals / s.totalGoals) * 100)}%` }}
                />
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.completedGoals}/{s.totalGoals}</p>
              <p className="text-xs text-gray-400">goals completed</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
