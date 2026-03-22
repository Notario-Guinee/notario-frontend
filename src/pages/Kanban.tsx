// ═══════════════════════════════════════════════════════════════
// Page Kanban — Tableau de gestion des tâches en colonnes
// Inclut : drag & drop, CRUD tâches, tiroir de détail,
// déplacement entre colonnes (À faire / En cours / Terminée)
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import { Plus, Download, ListTodo, Clock, CheckCircle2, AlertTriangle, CalendarClock, X, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { mockKanbanTasks, type KanbanTask } from "@/data/mockData";
import { kanbanService } from "@/services/kanbanService";
import type { KanbanTask as ApiKanbanTask } from "@/types/api";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";

type ColumnId = "todo" | "in_progress" | "done";

interface Column {
  id: ColumnId;
  titleKey: string;
  color: string;
  bgColor: string;
}

const columns: Column[] = [
  { id: "todo", titleKey: "kanban.todo", color: "border-secondary", bgColor: "bg-secondary/5" },
  { id: "in_progress", titleKey: "kanban.inProgress", color: "border-primary", bgColor: "bg-primary/5" },
  { id: "done", titleKey: "kanban.done", color: "border-success", bgColor: "bg-success/5" },
];

const priorites: KanbanTask["priorite"][] = ["Basse", "Normale", "Haute", "Urgente"];

export default function Kanban() {
  const { t } = useLanguage();

  const [tasks, setTasks] = useState<Record<ColumnId, KanbanTask[]>>({
    todo: mockKanbanTasks.slice(0, 3),
    in_progress: mockKanbanTasks.slice(3, 6),
    done: mockKanbanTasks.slice(6, 8),
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<ColumnId>("todo");
  const [createForColumn, setCreateForColumn] = useState<ColumnId>("todo");

  const [form, setForm] = useState({
    titre: "", description: "", assignee: "", deadline: "",
    priorite: "Normale" as KanbanTask["priorite"], dossier: "", tags: "",
  });

  // Maps API colonneId to local ColumnId (by position in sorted boards)
  const [colonneMap, setColonneMap] = useState<Record<number, ColumnId>>({});

  const resetForm = () => setForm({ titre: "", description: "", assignee: "", deadline: "", priorite: "Normale", dossier: "", tags: "" });

  // Helper: map API KanbanTask to local KanbanTask shape
  const mapApiTask = (t: ApiKanbanTask, colMap: Record<number, ColumnId>): { task: KanbanTask; col: ColumnId } => {
    const colIds: ColumnId[] = ["todo", "in_progress", "done"];
    const col = colMap[t.colonneId] ?? colIds[0];
    const prioriteMap: Record<string, KanbanTask["priorite"]> = {
      BASSE: "Basse", NORMALE: "Normale", HAUTE: "Haute", URGENTE: "Urgente",
    };
    return {
      col,
      task: {
        id: String(t.id),
        titre: t.titre,
        description: t.description ?? "",
        assignee: String(t.assigneId ?? ""),
        deadline: t.dateEcheance ?? "",
        priorite: prioriteMap[t.priorite ?? ""] ?? "Normale",
        dossier: t.dossierId ? String(t.dossierId) : undefined,
        tags: [],
      },
    };
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [boardsData, tasksData] = await Promise.all([
          kanbanService.getBoards(),
          kanbanService.getTasks(),
        ]);
        if (!cancelled) {
          // Build colonneId → ColumnId map from first board's columns
          const colIds: ColumnId[] = ["todo", "in_progress", "done"];
          const newColMap: Record<number, ColumnId> = {};
          const firstBoard = boardsData[0];
          if (firstBoard?.colonnes) {
            const sorted = [...firstBoard.colonnes].sort((a, b) => a.ordre - b.ordre);
            sorted.forEach((col, idx) => {
              if (idx < colIds.length) newColMap[col.id] = colIds[idx];
            });
          }
          if (tasksData.length > 0) {
            const newTasks: Record<ColumnId, KanbanTask[]> = { todo: [], in_progress: [], done: [] };
            tasksData.forEach(t => {
              const { task, col } = mapApiTask(t, newColMap);
              newTasks[col].push(task);
            });
            setTasks(newTasks);
            setColonneMap(newColMap);
          }
        }
      } catch { /* silent fallback to mock */ }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const allTasks = [...tasks.todo, ...tasks.in_progress, ...tasks.done];
  const stats = {
    total: allTasks.length,
    todo: tasks.todo.length,
    inProgress: tasks.in_progress.length,
    done: tasks.done.length,
    urgentes: allTasks.filter(t => t.priorite === "Urgente").length,
    enRetard: allTasks.filter(t => {
      const parts = t.deadline.split("/");
      if (parts.length !== 3) return false;
      const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      return d < new Date();
    }).length,
  };

  const getColTitle = (id: ColumnId) => {
    const col = columns.find(c => c.id === id);
    return col ? t(col.titleKey) : id;
  };

  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const srcCol = source.droppableId as ColumnId;
    const destCol = destination.droppableId as ColumnId;
    const srcItems = [...tasks[srcCol]];
    const destItems = srcCol === destCol ? srcItems : [...tasks[destCol]];
    const [moved] = srcItems.splice(source.index, 1);
    destItems.splice(destination.index, 0, moved);

    setTasks(prev => ({
      ...prev,
      [srcCol]: srcItems,
      ...(srcCol !== destCol ? { [destCol]: destItems } : {}),
    }));

    if (srcCol !== destCol) {
      toast.success(`"${moved.titre}" ${t("kanban.movedTo")} ${getColTitle(destCol)}`);
    }
  };

  const moveTask = (task: KanbanTask, from: ColumnId, to: ColumnId) => {
    setTasks(prev => ({
      ...prev,
      [from]: prev[from].filter(t => t.id !== task.id),
      [to]: [...prev[to], task],
    }));
    toast.success(`"${task.titre}" → ${getColTitle(to)}`);
  };

  const handleCreate = () => {
    const newTask: KanbanTask = {
      id: String(Date.now()),
      titre: form.titre,
      description: form.description,
      assignee: form.assignee || t("kanban.unassigned"),
      deadline: form.deadline,
      priorite: form.priorite,
      dossier: form.dossier || undefined,
      tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
    };
    setTasks(prev => ({ ...prev, [createForColumn]: [...prev[createForColumn], newTask] }));
    setShowCreateModal(false);
    resetForm();
    toast.success(t("kanban.taskCreated"));
    // Persist to backend
    const colIds: ColumnId[] = ["todo", "in_progress", "done"];
    const colIdx = colIds.indexOf(createForColumn);
    const reverseMap = Object.entries(colonneMap).find(([, v]) => v === createForColumn);
    const colonneId = reverseMap ? Number(reverseMap[0]) : colIdx + 1;
    const prioriteApiMap: Record<KanbanTask["priorite"], string> = {
      Basse: "BASSE", Normale: "NORMALE", Haute: "HAUTE", Urgente: "URGENTE",
    };
    kanbanService.createTask({
      boardId: colonneId > 0 ? 1 : 1, // default board
      colonneId,
      titre: form.titre,
      description: form.description || undefined,
      priorite: prioriteApiMap[form.priorite] as "BASSE" | "NORMALE" | "HAUTE" | "URGENTE",
      dateEcheance: form.deadline || undefined,
    }).then(created => {
      // Replace optimistic entry with server id
      setTasks(prev => {
        const newState = { ...prev };
        for (const col of Object.keys(newState) as ColumnId[]) {
          newState[col] = newState[col].map(task =>
            task.id === newTask.id ? { ...task, id: String(created.id) } : task
          );
        }
        return newState;
      });
    }).catch(() => {});
  };

  const handleEdit = () => {
    if (!selectedTask) return;
    const updated: KanbanTask = {
      ...selectedTask,
      titre: form.titre || selectedTask.titre,
      description: form.description || selectedTask.description,
      assignee: form.assignee || selectedTask.assignee,
      deadline: form.deadline || selectedTask.deadline,
      priorite: form.priorite,
      dossier: form.dossier || selectedTask.dossier,
      tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : selectedTask.tags,
    };
    setTasks(prev => {
      const newState = { ...prev };
      for (const col of Object.keys(newState) as ColumnId[]) {
        newState[col] = newState[col].map(t => t.id === selectedTask.id ? updated : t);
      }
      return newState;
    });
    setShowEditModal(false);
    setShowDetailDrawer(false);
    toast.success(t("kanban.taskEdited"));
    // Persist to backend
    const taskId = Number(selectedTask.id);
    if (!isNaN(taskId)) {
      const prioriteApiMap: Record<KanbanTask["priorite"], string> = {
        Basse: "BASSE", Normale: "NORMALE", Haute: "HAUTE", Urgente: "URGENTE",
      };
      kanbanService.updateTask(taskId, {
        titre: updated.titre,
        description: updated.description || undefined,
        priorite: prioriteApiMap[updated.priorite] as "BASSE" | "NORMALE" | "HAUTE" | "URGENTE",
        dateEcheance: updated.deadline || undefined,
      }).catch(() => {});
    }
  };

  const handleDelete = () => {
    if (!selectedTask) return;
    setTasks(prev => {
      const newState = { ...prev };
      for (const col of Object.keys(newState) as ColumnId[]) {
        newState[col] = newState[col].filter(t => t.id !== selectedTask.id);
      }
      return newState;
    });
    setShowDeleteDialog(false);
    setShowDetailDrawer(false);
    setSelectedTask(null);
    toast.success(t("kanban.taskDeleted"));
    // Persist to backend
    const taskId = Number(selectedTask.id);
    if (!isNaN(taskId)) {
      kanbanService.deleteTask(taskId).catch(() => {});
    }
  };

  const openTaskDetail = (task: KanbanTask, colId: ColumnId) => {
    setSelectedTask(task);
    setSelectedColumn(colId);
    setShowDetailDrawer(true);
  };

  const openEditTask = (task: KanbanTask) => {
    setSelectedTask(task);
    setForm({
      titre: task.titre, description: task.description, assignee: task.assignee,
      deadline: task.deadline, priorite: task.priorite, dossier: task.dossier || "", tags: task.tags.join(", "),
    });
    setShowEditModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">{t("kanban.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("kanban.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2"><Download className="h-4 w-4" /> {t("kanban.export")}</Button>
          <Button size="sm" className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90 gap-2"
            onClick={() => { resetForm(); setCreateForColumn("todo"); setShowCreateModal(true); }}>
            <Plus className="h-4 w-4" /> {t("kanban.newTask")}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { icon: ListTodo, value: stats.total, label: t("kanban.totalTasks"), color: "text-foreground" },
          { icon: Clock, value: stats.todo, label: t("kanban.todo"), color: "text-secondary" },
          { icon: Clock, value: stats.inProgress, label: t("kanban.inProgress"), color: "text-primary" },
          { icon: CheckCircle2, value: stats.done, label: t("kanban.done"), color: "text-success" },
          { icon: AlertTriangle, value: stats.urgentes, label: t("kanban.urgent"), color: "text-destructive" },
          { icon: CalendarClock, value: stats.enRetard, label: t("kanban.overdue"), color: "text-destructive" },
        ].map((kpi, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className={`font-heading text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
            <p className="text-xs text-muted-foreground">{kpi.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {columns.map(col => (
            <div key={col.id} className={`rounded-xl border-t-2 ${col.color} border border-border ${col.bgColor} overflow-hidden`}>
              <div className="p-4 pb-2">
                <h2 className="font-heading text-sm font-semibold text-foreground">{t(col.titleKey)} ({tasks[col.id].length})</h2>
              </div>
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}
                    className={`p-3 pt-1 space-y-3 min-h-[200px] transition-colors ${snapshot.isDraggingOver ? "bg-primary/5" : ""}`}>
                    {tasks[col.id].map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                            className={`rounded-xl bg-card border border-border p-4 shadow-sm cursor-grab active:cursor-grabbing transition-shadow ${
                              snapshot.isDragging ? "shadow-lg ring-2 ring-primary/30 rotate-1" : "hover:shadow-md"
                            }`}
                            onClick={() => openTaskDetail(task, col.id)}>
                            {/* Card Header */}
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="text-sm font-semibold text-foreground leading-tight flex-1 mr-2">{task.titre}</h3>
                              <StatusBadge status={task.priorite} />
                            </div>

                            {/* Description */}
                            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{task.description}</p>

                            {/* Assignee + Deadline */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary/15 text-[10px] font-bold text-secondary">
                                  {task.assignee.split(" ").map(w => w[0]).join("").slice(0, 2)}
                                </div>
                                <span className="text-xs text-muted-foreground">{task.assignee}</span>
                              </div>
                              <span className="text-xs font-medium text-foreground">{task.deadline}</span>
                            </div>

                            {/* Dossier Link */}
                            {task.dossier && (
                              <div className="mb-3">
                                <span className="text-xs font-mono text-secondary bg-secondary/10 px-2 py-0.5 rounded">{task.dossier}</span>
                              </div>
                            )}

                            {/* Tags */}
                            {task.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-3">
                                {task.tags.map(tag => (
                                  <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{tag}</span>
                                ))}
                              </div>
                            )}

                            {/* Move Buttons */}
                            <div className="flex gap-1 pt-2 border-t border-border" onClick={e => e.stopPropagation()}>
                              {col.id !== "todo" && (
                                <Button variant="outline" size="sm" className="text-[11px] h-7 flex-1"
                                  onClick={() => moveTask(task, col.id, col.id === "done" ? "in_progress" : "todo")}>
                                  → {col.id === "done" ? t("kanban.inProgress") : t("kanban.todo")}
                                </Button>
                              )}
                              {col.id !== "done" && (
                                <Button variant="outline" size="sm" className="text-[11px] h-7 flex-1"
                                  onClick={() => moveTask(task, col.id, col.id === "todo" ? "in_progress" : "done")}>
                                  → {col.id === "todo" ? t("kanban.inProgress") : t("kanban.done")}
                                </Button>
                              )}
                              {col.id !== "done" && (
                                <Button variant="outline" size="sm" className="text-[11px] h-7 flex-1"
                                  onClick={() => moveTask(task, col.id, "done")}>
                                  → {t("kanban.done")}
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}

                    {/* Add task button */}
                    <button
                      onClick={() => { resetForm(); setCreateForColumn(col.id); setShowCreateModal(true); }}
                      className="flex w-full items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border py-3 text-xs text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors">
                      <Plus className="h-3.5 w-3.5" /> {t("kanban.addTask")}
                    </button>
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* Detail Drawer */}
      <AnimatePresence>
        {showDetailDrawer && selectedTask && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm" onClick={() => setShowDetailDrawer(false)} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="fixed right-0 top-0 z-50 h-full w-full max-w-lg border-l border-border bg-card shadow-2xl overflow-y-auto scrollbar-thin">
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="font-heading text-lg font-bold text-foreground mb-2">{selectedTask.titre}</h2>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={selectedTask.priorite} showIcon />
                      {selectedTask.dossier && <span className="text-xs font-mono text-secondary bg-secondary/10 px-2 py-0.5 rounded">{selectedTask.dossier}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" onClick={() => openEditTask(selectedTask)}><Edit className="mr-1 h-3.5 w-3.5" /> {t("kanban.edit")}</Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setShowDeleteDialog(true)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    <button onClick={() => setShowDetailDrawer(false)} className="rounded-lg p-2 hover:bg-muted"><X className="h-5 w-5 text-muted-foreground" /></button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-muted/30 border border-border">
                    <p className="text-sm text-foreground">{selectedTask.description}</p>
                  </div>
                  {[
                    { label: t("kanban.assignedTo"), value: selectedTask.assignee },
                    { label: t("kanban.deadline"), value: selectedTask.deadline },
                    { label: t("kanban.priority"), value: selectedTask.priorite },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between border-b border-border pb-3">
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                      <span className="text-sm font-medium text-foreground">{item.value}</span>
                    </div>
                  ))}
                  {selectedTask.tags.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">{t("kanban.tags")}</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedTask.tags.map(tag => (
                          <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground">{tag}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick move */}
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm font-medium text-foreground mb-2">{t("kanban.moveTo")}</p>
                    <div className="flex gap-2">
                      {columns.filter(c => c.id !== selectedColumn).map(c => (
                        <Button key={c.id} variant="outline" size="sm" className="flex-1"
                          onClick={() => { moveTask(selectedTask, selectedColumn, c.id); setShowDetailDrawer(false); }}>
                          → {t(c.titleKey)}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">{t("kanban.createModalTitle")}</DialogTitle>
            <DialogDescription>{t("kanban.createModalDesc")} "{columns.find(c => c.id === createForColumn) ? t(columns.find(c => c.id === createForColumn)!.titleKey) : ""}"</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t("kanban.titleLabel")} *</Label>
              <Input value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))} placeholder={t("kanban.titlePlaceholder")} />
            </div>
            <div className="space-y-2">
              <Label>{t("kanban.description")}</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder={t("kanban.descPlaceholder")} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("kanban.assigneeLabel")}</Label>
                <Input value={form.assignee} onChange={e => setForm(f => ({ ...f, assignee: e.target.value }))} placeholder={t("kanban.assigneePlaceholder")} />
              </div>
              <div className="space-y-2">
                <Label>{t("kanban.deadlineLabel")}</Label>
                <Input value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} placeholder={t("kanban.deadlinePlaceholder")} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("kanban.priorityLabel")}</Label>
                <Select value={form.priorite} onValueChange={v => setForm(f => ({ ...f, priorite: v as KanbanTask["priorite"] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{priorites.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("kanban.linkedCase")}</Label>
                <Input value={form.dossier} onChange={e => setForm(f => ({ ...f, dossier: e.target.value }))} placeholder="N-2025-XXX" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("kanban.tags")}</Label>
              <Input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder={t("kanban.tagsPlaceholder")} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>{t("kanban.cancel")}</Button>
            <Button className="bg-primary text-primary-foreground" onClick={handleCreate} disabled={!form.titre}>{t("kanban.create")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">{t("kanban.editModalTitle")}</DialogTitle>
            <DialogDescription>{t("kanban.editModalDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t("kanban.titleLabel")}</Label>
              <Input value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{t("kanban.description")}</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("kanban.assigneeLabel")}</Label>
                <Input value={form.assignee} onChange={e => setForm(f => ({ ...f, assignee: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{t("kanban.priorityLabel")}</Label>
                <Select value={form.priorite} onValueChange={v => setForm(f => ({ ...f, priorite: v as KanbanTask["priorite"] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{priorites.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("kanban.deadlineLabel")}</Label>
                <Input value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{t("kanban.tags")}</Label>
                <Input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>{t("kanban.cancel")}</Button>
            <Button className="bg-primary text-primary-foreground" onClick={handleEdit}>{t("kanban.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("kanban.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>"<strong>{selectedTask?.titre}</strong>" {t("kanban.deleteDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("kanban.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t("kanban.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
