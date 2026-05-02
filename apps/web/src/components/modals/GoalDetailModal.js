"use client";
import { useEffect, useState } from "react";
import { CheckCircle, Circle, Plus, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import Modal from "../Modal";
import Avatar from "../Avatar";
import useGoalStore from "../../store/goalStore";
import useAuthStore from "../../store/authStore";
import { PERMISSIONS, ROLE_PERMISSIONS } from "../../lib/constants";

const STATUS_CONFIG = {
  ON_TRACK: { label: "On Track", class: "badge-success" },
  AT_RISK: { label: "At Risk", class: "badge-warning" },
  COMPLETED: { label: "Completed", class: "badge-info" },
  CANCELLED: { label: "Cancelled", class: "badge-neutral" },
};

export default function GoalDetailModal({ goalId, onClose, userRole = "MEMBER" }) {
  const {
    currentGoal,
    fetchGoal,
    updateMilestone,
    addProgressUpdate,
    addMilestone,
    updateGoal,
  } = useGoalStore();
  const { user } = useAuthStore();

  const [progressInput, setProgressInput] = useState("");
  const [newMilestone, setNewMilestone] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showMilestoneInput, setShowMilestoneInput] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const canEdit = ROLE_PERMISSIONS[userRole]?.includes(PERMISSIONS.EDIT_GOAL);
  const liveStatus = useGoalStore((s) => s.currentGoal?.status);

  useEffect(() => {
    fetchGoal(goalId).finally(() => setLoading(false));
  }, [goalId]);

  const handleStatusToggle = async () => {
    if (statusUpdating) return;
    setStatusUpdating(true);
    try {
      const newStatus = liveStatus !== "CANCELLED" ? "CANCELLED" : "ON_TRACK";
      await updateGoal(goalId, { status: newStatus });
    } catch {
      toast.error("Failed to update goal status");
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleMilestoneToggle = async (milestone) => {
    if (!canEdit) return;
    try {
      const newCompleted = !milestone.completed;
      const newProgress = newCompleted ? 100 : 0;

      await updateMilestone(goalId, milestone.id, {
        completed: newCompleted,
        progress: newProgress,
      });

      const updatedMilestones = useGoalStore
        .getState()
        .currentGoal?.milestones?.map((m) =>
          m.id === milestone.id
            ? { ...m, completed: newCompleted, progress: newProgress }
            : m,
        );

      const allDone = updatedMilestones?.every((m) => m.completed);
      const currentStatus = useGoalStore.getState().currentGoal?.status;

      if (allDone) {
        await updateGoal(goalId, { status: "COMPLETED" });
      } else if (!allDone && currentStatus === "COMPLETED") {
        await updateGoal(goalId, { status: "ON_TRACK" });
      }
    } catch {}
  };

  const handleMilestoneProgress = async (milestone, progress) => {
    if (!canEdit) return;
    await updateMilestone(goalId, milestone.id, { progress: Number(progress) });
  };

  const handleAddProgress = async () => {
    if (!progressInput.trim()) return;
    setSubmitting(true);
    try {
      await addProgressUpdate(goalId, progressInput);
      setProgressInput("");
      toast.success("Update posted");
    } catch {
      toast.error("Failed to post update");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddMilestone = async () => {
    if (!newMilestone.trim()) return;
    try {
      await addMilestone(goalId, { title: newMilestone });
      setNewMilestone("");
      setShowMilestoneInput(false);
      toast.success("Milestone added");
    } catch {
      toast.error("Failed to add milestone");
    }
  };

  const overallProgress = currentGoal?.milestones?.length
    ? Math.round(
        currentGoal.milestones.reduce((s, m) => s + m.progress, 0) /
          currentGoal.milestones.length,
      )
    : 0;

  if (loading) {
    return (
      <Modal title="Goal Details" onClose={onClose} size="lg">
        <div className="p-8 flex justify-center">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </Modal>
    );
  }

  if (!currentGoal) return null;

  const statusCfg = STATUS_CONFIG[currentGoal.status] || STATUS_CONFIG.ON_TRACK;

  return (
    <Modal title={currentGoal.title} onClose={onClose} size="lg">
      <div className="p-5 space-y-6">
        {/* Meta row */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className={statusCfg.class}>{statusCfg.label}</span>
            <div className="flex items-center gap-2">
              <Avatar user={currentGoal.owner} size="xs" />
              <span className="text-sm text-gray-500">{currentGoal.owner?.name}</span>
            </div>
            {currentGoal.dueDate && (
              <span className="text-sm text-gray-400">
                Due {format(new Date(currentGoal.dueDate), "MMM d, yyyy")}
              </span>
            )}
          </div>

          {/* Cancel / Reopen button */}
          {canEdit && (
            <div className="flex gap-2">
              {liveStatus !== "CANCELLED" ? (
                <button
                  onClick={handleStatusToggle}
                  disabled={statusUpdating}
                  className="text-xs px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors border border-red-200 dark:border-red-800 disabled:opacity-50"
                >
                  {statusUpdating ? "Cancelling..." : "Cancel Goal"}
                </button>
              ) : (
                <button
                  onClick={handleStatusToggle}
                  disabled={statusUpdating}
                  className="text-xs px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-500 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors border border-green-200 dark:border-green-800 disabled:opacity-50"
                >
                  {statusUpdating ? "Reopening..." : "Reopen Goal"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        {currentGoal.description && (
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            {currentGoal.description}
          </p>
        )}

        {/* Overall progress */}
        {currentGoal.milestones?.length > 0 && (
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                Overall Progress
              </span>
              <span className="font-bold text-brand-500">{overallProgress}%</span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-500 to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Milestones */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">Milestones</h3>
            {canEdit && (
              <button
                onClick={() => setShowMilestoneInput(!showMilestoneInput)}
                className="text-xs btn-secondary py-1 px-2 flex items-center gap-1"
              >
                <Plus size={12} /> Add
              </button>
            )}
          </div>

          {showMilestoneInput && (
            <div className="flex gap-2 mb-3">
              <input
                className="input flex-1 text-sm"
                placeholder="Milestone title"
                value={newMilestone}
                onChange={(e) => setNewMilestone(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddMilestone()}
                autoFocus
              />
              <button onClick={handleAddMilestone} className="btn-primary text-sm px-3">
                Add
              </button>
            </div>
          )}

          <div className="space-y-3">
            {currentGoal.milestones?.map((m) => (
              <div key={m.id} className="flex items-center gap-3">
                <button onClick={() => handleMilestoneToggle(m)} disabled={!canEdit}>
                  {m.completed ? (
                    <CheckCircle size={18} className="text-green-500" />
                  ) : (
                    <Circle size={18} className="text-gray-300 dark:text-gray-600" />
                  )}
                </button>
                <span
                  className={`flex-1 text-sm ${m.completed ? "line-through text-gray-400" : "text-gray-700 dark:text-gray-300"}`}
                >
                  {m.title}
                </span>
                {canEdit && !m.completed && (
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={m.progress}
                      onChange={(e) => handleMilestoneProgress(m, e.target.value)}
                      className="w-24 accent-brand-500"
                    />
                    <span className="text-xs text-gray-400 w-8">{m.progress}%</span>
                  </div>
                )}
                {m.completed && <span className="text-xs text-green-500">Done</span>}
              </div>
            ))}
            {!currentGoal.milestones?.length && (
              <p className="text-sm text-gray-400 text-center py-3">No milestones yet</p>
            )}
          </div>
        </div>

        {/* Progress updates */}
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <TrendingUp size={16} className="text-brand-500" />
            Progress Updates
          </h3>

          <div className="flex gap-2 mb-4">
            <Avatar user={user} size="xs" />
            <input
              className="input flex-1 text-sm"
              placeholder="Post a progress update..."
              value={progressInput}
              onChange={(e) => setProgressInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddProgress()}
            />
            <button
              onClick={handleAddProgress}
              disabled={submitting}
              className="btn-primary text-sm px-3"
            >
              Post
            </button>
          </div>

          <div className="space-y-3 max-h-48 overflow-y-auto">
            {currentGoal.progressUpdates?.map((u) => (
              <div key={u.id} className="flex gap-3">
                <Avatar user={u.user} size="xs" />
                <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {u.user?.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {format(new Date(u.createdAt), "MMM d")}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{u.content}</p>
                </div>
              </div>
            ))}
            {!currentGoal.progressUpdates?.length && (
              <p className="text-sm text-gray-400 text-center py-3">
                No updates yet. Be the first to post!
              </p>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}