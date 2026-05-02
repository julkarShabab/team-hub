"use client";
import { useEffect, useState } from "react";
import { Plus, List, Columns, Calendar, Flag, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import useWorkspaceStore from "../../../store/workspaceStore";
import useActionItemStore from "../../../store/actionItemStore";
import useAuthStore from "../../../store/authStore";
import Avatar from "../../../components/Avatar";
import ActionItemModal from "../../../components/modals/ActionItemModal";

const STATUSES = ["TODO", "IN_PROGRESS", "DONE"];
const STATUS_LABELS = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};
const STATUS_COLORS = {
  TODO: "bg-gray-100 dark:bg-gray-800",
  IN_PROGRESS: "bg-blue-50 dark:bg-blue-900/20",
  DONE: "bg-green-50 dark:bg-green-900/20",
};
const PRIORITY_CONFIG = {
  LOW: { label: "Low", class: "badge-neutral", color: "text-gray-400" },
  MEDIUM: { label: "Medium", class: "badge-warning", color: "text-yellow-500" },
  HIGH: { label: "High", class: "badge-danger", color: "text-red-500" },
};

export default function ActionItemsPage() {
  const { currentWorkspace, members } = useWorkspaceStore();
  const { items, isLoading, fetchItems, updateItemStatus, deleteItem } =
    useActionItemStore();
  const { user } = useAuthStore();

  const [view, setView] = useState("kanban");
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  useEffect(() => {
    if (currentWorkspace?.id && items.length === 0) {
      fetchItems(currentWorkspace.id);
    }
  }, [currentWorkspace?.id]);

  // ── Kanban drag handlers (optimistic) ─────────────────────────────────────
  const handleDragStart = (e, item) => {
    setDragging(item);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, status) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(status);
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    setDragOver(null);
    if (!dragging || dragging.status === newStatus) {
      setDragging(null);
      return;
    }
    await updateItemStatus(dragging.id, newStatus);
    setDragging(null);
    toast.success(`Moved to ${STATUS_LABELS[newStatus]}`);
  };

  const handleDelete = async (itemId) => {
    if (!confirm("Delete this action item?")) return;
    await deleteItem(itemId);
    toast.success("Deleted");
  };

  const getByStatus = (status) => items.filter((i) => i.status === status);

  const ItemCard = ({ item, compact = false }) => (
    <div
      draggable={view === "kanban"}
      onDragStart={(e) => handleDragStart(e, item)}
      className={`card p-3 cursor-pointer hover:shadow-md transition-all border-l-4 ${item._optimistic ? "opacity-60" : ""} ${
        dragging?.id === item.id ? "opacity-40 ring-2 ring-brand-500" : ""
      }`}
      style={{
        borderLeftColor:
          item.priority === "HIGH"
            ? "#ef4444"
            : item.priority === "MEDIUM"
              ? "#f59e0b"
              : "#94a3b8",
      }}
      onClick={() => setEditItem(item)}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p
            className={`font-medium text-gray-900 dark:text-white ${compact ? "text-sm" : ""}`}
          >
            {item.title}
          </p>
          {item.goal && (
            <p className="text-xs text-brand-500 mt-0.5">↳ {item.goal.title}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span
            className={PRIORITY_CONFIG[item.priority]?.class || "badge-neutral"}
          >
            {PRIORITY_CONFIG[item.priority]?.label}
          </span>
        </div>
      </div>

      {!compact && item.description && (
        <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">
          {item.description}
        </p>
      )}

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          {item.assignee && <Avatar user={item.assignee} size="xs" />}
          {item.assignee && (
            <span className="text-xs text-gray-400">{item.assignee.name}</span>
          )}
        </div>
        {item.dueDate && (
          <div
            className={`flex items-center gap-1 text-xs ${
              new Date(item.dueDate) < new Date() && item.status !== "DONE"
                ? "text-red-500"
                : "text-gray-400"
            }`}
          >
            <Calendar size={10} />
            <span>{format(new Date(item.dueDate), "MMM d")}</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Action Items
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {items.length} total items
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setView("kanban")}
              className={`p-1.5 rounded ${view === "kanban" ? "bg-white dark:bg-gray-700 shadow-sm" : ""}`}
            >
              <Columns
                size={16}
                className={
                  view === "kanban" ? "text-brand-500" : "text-gray-400"
                }
              />
            </button>
            <button
              onClick={() => setView("list")}
              className={`p-1.5 rounded ${view === "list" ? "bg-white dark:bg-gray-700 shadow-sm" : ""}`}
            >
              <List
                size={16}
                className={view === "list" ? "text-brand-500" : "text-gray-400"}
              />
            </button>
          </div>

          <button
            onClick={() => setShowCreate(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} /> New Item
          </button>
        </div>
      </div>

      {/* Kanban board */}
      {view === "kanban" ? (
        <div className="flex gap-4 flex-1 overflow-x-auto pb-4">
          {STATUSES.map((status) => {
            const colItems = getByStatus(status);
            return (
              <div
                key={status}
                className={`flex-shrink-0 w-72 flex flex-col rounded-xl ${
                  dragOver === status ? "ring-2 ring-brand-400" : ""
                }`}
                onDragOver={(e) => handleDragOver(e, status)}
                onDrop={(e) => handleDrop(e, status)}
                onDragLeave={() => setDragOver(null)}
              >
                {/* Column header */}
                <div
                  className={`flex items-center justify-between p-3 rounded-t-xl ${STATUS_COLORS[status]}`}
                >
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                      {STATUS_LABELS[status]}
                    </h3>
                    <span className="badge-neutral">{colItems.length}</span>
                  </div>
                  <button
                    onClick={() => setShowCreate(true)}
                    className="text-gray-400 hover:text-brand-500 transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Cards */}
                <div
                  className={`flex-1 min-h-40 p-2 space-y-2 rounded-b-xl bg-gray-50 dark:bg-gray-900/50 overflow-y-auto`}
                >
                  {colItems.map((item) => (
                    <ItemCard key={item.id} item={item} />
                  ))}
                  {colItems.length === 0 && (
                    <div className="h-20 flex items-center justify-center text-xs text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                      Drop here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List view */
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                  Title
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                  Status
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                  Priority
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                  Assignee
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                  Due Date
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => setEditItem(item)}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {item.title}
                    </p>
                    {item.goal && (
                      <p className="text-xs text-brand-500">
                        ↳ {item.goal.title}
                      </p>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={
                        item.status === "DONE"
                          ? "badge-success"
                          : item.status === "IN_PROGRESS"
                            ? "badge-info"
                            : "badge-neutral"
                      }
                    >
                      {STATUS_LABELS[item.status]}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={
                        PRIORITY_CONFIG[item.priority]?.class || "badge-neutral"
                      }
                    >
                      {PRIORITY_CONFIG[item.priority]?.label}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {item.assignee ? (
                      <div className="flex items-center gap-2">
                        <Avatar user={item.assignee} size="xs" />
                        <span className="text-gray-700 dark:text-gray-300">
                          {item.assignee.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-gray-500">
                    {item.dueDate
                      ? format(new Date(item.dueDate), "MMM d, yyyy")
                      : "—"}
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    No action items yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <ActionItemModal
          workspaceId={currentWorkspace?.id}
          onClose={() => setShowCreate(false)}
        />
      )}

      {editItem && (
        <ActionItemModal
          workspaceId={currentWorkspace?.id}
          item={editItem}
          onClose={() => setEditItem(null)}
        />
      )}
    </div>
  );
}
