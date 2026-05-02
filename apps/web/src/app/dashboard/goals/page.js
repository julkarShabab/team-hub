"use client";
import { useEffect, useState } from "react";
import {
  Plus,
  Target,
  ChevronRight,
  Calendar,
  MoreHorizontal,
  Trash2,
  Edit3,
} from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import useWorkspaceStore from "../../../store/workspaceStore";
import useGoalStore from "../../../store/goalStore";
import useAuthStore from "../../../store/authStore";
import Avatar from "../../../components/Avatar";
import GoalModal from "../../../components/modals/GoalModal";
import GoalDetailModal from "../../../components/modals/GoalDetailModal";
import { PERMISSIONS, ROLE_PERMISSIONS } from "../../../lib/constants";

const STATUS_CONFIG = {
  ON_TRACK: { label: "On Track", class: "badge-success" },
  AT_RISK: { label: "At Risk", class: "badge-warning" },
  COMPLETED: { label: "Completed", class: "badge-info" },
  CANCELLED: { label: "Cancelled", class: "badge-neutral" },
};

export default function GoalsPage() {
  const { currentWorkspace } = useWorkspaceStore();
  const { goals, isLoading, fetchGoals, deleteGoal } = useGoalStore();
  const { user } = useAuthStore();
  const { members } = useWorkspaceStore();

  const [showCreate, setShowCreate] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [editGoal, setEditGoal] = useState(null);
  const [filterStatus, setFilterStatus] = useState("ALL");

  // Get user's role
  const myMembership = members?.find(
    (m) => m.userId === user?.id || m.user?.id === user?.id,
  );
  const myRole = myMembership?.role || "MEMBER";
  const canCreate = ROLE_PERMISSIONS[myRole]?.includes(PERMISSIONS.CREATE_GOAL);

  useEffect(() => {
    if (currentWorkspace?.id) {
      fetchGoals(currentWorkspace.id);
    }
  }, [currentWorkspace?.id]);

  const handleDelete = async (goal, e) => {
    e.stopPropagation();
    if (!confirm(`Delete "${goal.title}"?`)) return;
    try {
      await deleteGoal(goal.id);
      toast.success("Goal deleted");
    } catch {}
  };

  const filtered =
    filterStatus === "ALL"
      ? goals
      : goals.filter((g) => g.status === filterStatus);

  const getProgress = (goal) => {
    if (!goal.milestones?.length) return 0;
    const total = goal.milestones.reduce((sum, m) => sum + m.progress, 0);
    return Math.round(total / goal.milestones.length);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Goals
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {goals.length} goal{goals.length !== 1 ? "s" : ""} in this workspace
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} /> New Goal
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {["ALL", "ON_TRACK", "AT_RISK", "COMPLETED", "CANCELLED"].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filterStatus === s
                ? "bg-brand-500 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {s === "ALL" ? "All" : STATUS_CONFIG[s]?.label}
            {s !== "ALL" && (
              <span className="ml-1.5 text-xs opacity-70">
                ({goals.filter((g) => g.status === s).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Goals grid */}
      {isLoading ? (
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-3" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Target size={48} className="mx-auto mb-4 opacity-30" />
          <p className="font-medium">No goals yet</p>
          {canCreate && (
            <button
              onClick={() => setShowCreate(true)}
              className="mt-3 btn-primary text-sm"
            >
              Create your first goal
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((goal) => {
            const progress = getProgress(goal);
            const statusCfg =
              STATUS_CONFIG[goal.status] || STATUS_CONFIG.ON_TRACK;
            const isOverdue =
              goal.dueDate &&
              new Date(goal.dueDate) < new Date() &&
              goal.status !== "COMPLETED";

            return (
              <div
                key={goal.id}
                onClick={() => setSelectedGoal(goal)}
                className={`card p-5 cursor-pointer hover:shadow-md transition-all ${goal._optimistic ? "opacity-60" : ""}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0">
                      <Target size={16} className="text-brand-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {goal.title}
                      </h3>
                      {goal.description && (
                        <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                          {goal.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                    <span className={statusCfg.class}>{statusCfg.label}</span>
                    {myRole === "ADMIN" && (
                      <button
                        onClick={(e) => handleDelete(goal, e)}
                        className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                {goal.milestones?.length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                      <span>
                        {goal.milestones.length} milestone
                        {goal.milestones.length !== 1 ? "s" : ""}
                      </span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-500 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center gap-3">
                    <Avatar user={goal.owner} size="xs" />
                    <span>{goal.owner?.name}</span>
                    {goal._count?.actionItems > 0 && (
                      <span>{goal._count.actionItems} items</span>
                    )}
                  </div>
                  {goal.dueDate && (
                    <div
                      className={`flex items-center gap-1 ${isOverdue ? "text-red-500" : ""}`}
                    >
                      <Calendar size={12} />
                      <span>{format(new Date(goal.dueDate), "MMM d")}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <GoalModal
          workspaceId={currentWorkspace?.id}
          onClose={() => setShowCreate(false)}
        />
      )}

      {selectedGoal && (
        <GoalDetailModal
          goalId={selectedGoal.id}
          onClose={() => setSelectedGoal(null)}
          userRole={myRole}
        />
      )}
    </div>
  );
}
