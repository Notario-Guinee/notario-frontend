// ═══════════════════════════════════════════════════════════════
// Composant WorkflowProcedural — Visualisation des étapes d'un
// dossier notarial sous forme de pipeline interactif animé
// Supporte les dispositions horizontale (≥900px) et verticale
// Actions disponibles : Démarrer, Terminer, Revenir en arrière
// ═══════════════════════════════════════════════════════════════

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Search, FolderOpen, PenLine, FileSignature, CreditCard, Send, Archive,
  Stamp, Newspaper, CheckCircle2, Clock, Play, RotateCcw, Timer, MessageSquare, Send as SendIcon, X as XIcon,
  Scale, BarChart2, Calculator, FileText, BookOpen, ClipboardList, Users, MapPin, Map, Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkflowConfig, WorkflowStep } from "./workflow-types";
import { WORKFLOW_PALETTE, formatElapsed, getElapsedDays } from "./workflow-types";
import { motion } from "framer-motion";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Search, FolderOpen, PenLine, FileSignature, CreditCard, Send, Archive,
  Stamp, Newspaper, CheckCircle2, Clock, Play,
  Scale, BarChart2, Calculator, FileText, BookOpen, ClipboardList, Users, MapPin, Map,
};

interface StepComment {
  user: string;
  text: string;
  date: string;
}

interface WorkflowProceduralProps {
  config: WorkflowConfig;
  onStart?: (actionId: string, stepKey: string) => void;
  onRevert?: (stepKey: string) => void;
  onComplete?: (stepKey: string) => void;
  stepComments?: Record<string, StepComment[]>;
  onAddComment?: (stepKey: string, text: string) => void;
  onEditDescription?: (stepKey: string, newDescription: string) => void;
  className?: string;
}

export default function WorkflowProcedural({ config, onStart, onRevert, onComplete, stepComments = {}, onAddComment, onEditDescription, className }: WorkflowProceduralProps) {
  const { steps } = config;
  const palette = config.palette?.length ? config.palette : WORKFLOW_PALETTE;
  const [now, setNow] = useState(Date.now());
  const [editingDescKey, setEditingDescKey] = useState<string | null>(null);
  const [editingDescText, setEditingDescText] = useState("");
  const [openCommentKey, setOpenCommentKey] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const toggleComment = (stepKey: string) => {
    setOpenCommentKey(prev => {
      const next = prev === stepKey ? null : stepKey;
      if (next) setTimeout(() => commentInputRef.current?.focus(), 50);
      return next;
    });
    setCommentText("");
  };

  const submitComment = (stepKey: string) => {
    if (!commentText.trim()) return;
    onAddComment?.(stepKey, commentText);
    setCommentText("");
    setOpenCommentKey(null);
  };

  const getColor = useCallback((index: number) => palette[index % palette.length], [palette]);

  const activeIndex = steps.findIndex(s => s.status === "active");
  const completedCount = steps.filter(s => s.status === "completed").length;
  const progressPercent = steps.length > 0
    ? Math.round((completedCount / steps.length) * 100)
    : 0;

  // Sequential: only the immediate next pending step (after all completed) can start, and only if no active step
  const nextStartableIndex = (() => {
    if (activeIndex >= 0) return -1;
    const firstPending = steps.findIndex(s => s.status === "pending");
    if (firstPending === 0) return 0;
    if (firstPending > 0 && steps[firstPending - 1].status === "completed") return firstPending;
    return -1;
  })();

  const isLastStep = (i: number) => i === steps.length - 1;

  return (
    <div className={cn("w-full", className)} role="group" aria-label="Workflow procédural">
      {/* Progress bar - GREEN */}
      <div className="mb-5 flex items-center gap-3">
        <div className="flex-1 h-2 rounded-full bg-muted/50 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-emerald-500"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
        <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">{progressPercent}%</span>
      </div>

      {/* Horizontal layout for >= 900px */}
      <div className="hidden min-[900px]:flex items-start justify-between gap-0 relative">
        {steps.map((step, i) => {
          const color = getColor(i);
          const Icon = iconMap[step.icon] || FolderOpen;
          const isLast = isLastStep(i);
          const isActive = step.status === "active";
          const isCompleted = step.status === "completed";
          const isPending = step.status === "pending";
          const canStart = i === nextStartableIndex && isPending && step.button;
          const elapsed = step.startedAt ? formatElapsed(step.startedAt) : null;
          const elapsedDays = step.startedAt ? getElapsedDays(step.startedAt) : 0;

          return (
            <div
              key={step.key}
              className="flex flex-col items-center flex-1 relative"
              role="listitem"
              aria-label={`${step.label}: ${isCompleted ? "terminé" : isActive ? "en cours" : "en attente"}`}
              aria-current={isActive ? "step" : undefined}
            >
              {/* Action button above circle */}
              <div className="mb-2 h-8 flex items-center gap-1.5">
                {isActive && !isLast && (
                  <motion.button
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => onComplete?.(step.key)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-lg transition-all hover:scale-105 bg-emerald-500 hover:bg-emerald-600"
                    aria-label={`Terminer ${step.label}`}
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    TERMINER
                  </motion.button>
                )}
                {isActive && isLast && (
                  <motion.button
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => onComplete?.(step.key)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-lg transition-all hover:scale-105 bg-emerald-500 hover:bg-emerald-600"
                    aria-label={`Terminer ${step.label}`}
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    TERMINER
                  </motion.button>
                )}
                {canStart && (
                  <button
                    onClick={() => onStart?.(step.button!.actionId, step.key)}
                    className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white transition-all hover:scale-105 hover:shadow-lg opacity-70 hover:opacity-100"
                    style={{ backgroundColor: color }}
                    aria-label={`Démarrer ${step.label}`}
                  >
                    <Play className="h-3 w-3 inline mr-1" />
                    DÉMARRER
                  </button>
                )}
                {isCompleted && onRevert && (
                  <button
                    onClick={() => onRevert(step.key)}
                    className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all hover:scale-105 flex items-center gap-1 border-2 hover:shadow-md"
                    style={{ borderColor: color, color }}
                    aria-label={`Revenir à ${step.label}`}
                  >
                    <RotateCcw className="h-3 w-3" />
                    REVENIR
                  </button>
                )}
              </div>

              {/* Circle */}
              <div className="relative">
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{ border: `3px solid ${color}` }}
                    animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}
                <motion.div
                  className={cn(
                    "flex items-center justify-center rounded-full transition-all duration-300 relative z-10",
                    isActive && "ring-4 ring-offset-2 ring-offset-card cursor-pointer hover:shadow-xl"
                  )}
                  style={{
                    width: 80,
                    height: 80,
                    border: `3px solid ${color}`,
                    backgroundColor: isCompleted ? color : isActive ? `${color}15` : "transparent",
                    "--tw-ring-color": isActive ? `${color}40` : undefined,
                    opacity: isPending ? 0.5 : 1,
                  } as React.CSSProperties}
                  whileHover={{ scale: 1.05 }}
                  onClick={isActive ? () => onComplete?.(step.key) : undefined}
                  title={isActive ? "Cliquer pour marquer comme terminé" : undefined}
                >
                  <Icon
                    className={cn("h-7 w-7 transition-colors")}
                    style={{ color: isCompleted ? "white" : color }}
                  />
                </motion.div>
                {/* Status indicator */}
                <div className="absolute -bottom-1 -right-1 z-20">
                  {isCompleted && <CheckCircle2 className="h-5 w-5" style={{ color }} />}
                  {isActive && (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}>
                      <Clock className="h-5 w-5" style={{ color }} />
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Elapsed time + EN COURS badge */}
              <div className="mt-2 min-h-[24px] flex flex-col items-center gap-1">
                {isActive && (
                  <motion.span
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white"
                    style={{ backgroundColor: color }}
                  >
                    EN COURS
                  </motion.span>
                )}
                {(isActive || isCompleted) && elapsed && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={cn(
                      "px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1",
                      isActive && elapsedDays > 3 ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : ""
                    )}
                    style={
                      !(isActive && elapsedDays > 3)
                        ? { backgroundColor: `${color}15`, color }
                        : undefined
                    }
                  >
                    <Clock className="h-3 w-3" />
                    {elapsed}
                  </motion.div>
                )}
              </div>

              {/* Label */}
              <p
                className={cn("mt-2 text-[11px] font-bold tracking-wide text-center leading-tight", isPending && "opacity-50")}
                style={{ color }}
              >
                {step.label}
              </p>

              {/* Description */}
              <p className={cn("mt-1 text-[10px] text-center leading-tight max-w-[120px] text-muted-foreground", isPending && "opacity-40")}>
                {step.description}
              </p>

              {/* Comment toggle button */}
              <button
                onClick={() => toggleComment(step.key)}
                className={cn(
                  "mt-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors",
                  openCommentKey === step.key
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                title="Commenter cette étape"
              >
                <MessageSquare className="h-3 w-3" />
                {(stepComments[step.key]?.length ?? 0) > 0
                  ? `${stepComments[step.key].length} commentaire${stepComments[step.key].length > 1 ? "s" : ""}`
                  : "Commenter"}
              </button>

              {/* Arrow connector */}
              {!isLast && (
                <div className="absolute top-[68px] left-[calc(50%+40px)] right-0 flex items-center" style={{ width: "calc(100% - 80px)", left: "calc(50% + 40px)" }}>
                  <div
                    className="flex-1 h-[3px] rounded-full transition-all duration-500"
                    style={{
                      backgroundColor: isCompleted ? color : `${color}30`,
                    }}
                  />
                  <div
                    className="w-0 h-0 shrink-0"
                    style={{
                      borderTop: "6px solid transparent",
                      borderBottom: "6px solid transparent",
                      borderLeft: `10px solid ${isCompleted ? color : `${color}30`}`,
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Comment panel — horizontal layout */}
      {openCommentKey && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="hidden min-[900px]:block mt-4 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50/60 dark:bg-amber-900/10 p-4"
        >
          {(() => {
            const step = steps.find(s => s.key === openCommentKey);
            const comments = stepComments[openCommentKey] ?? [];
            const color = step ? getColor(steps.indexOf(step)) : "#1B6B93";
            return (
              <>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-sm font-semibold text-foreground">
                      Commentaires — <span style={{ color }}>{step?.label}</span>
                    </span>
                  </div>
                  <button onClick={() => { setOpenCommentKey(null); setCommentText(""); }} className="text-muted-foreground hover:text-foreground">
                    <XIcon className="h-4 w-4" />
                  </button>
                </div>

                {comments.length > 0 && (
                  <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                    {comments.map((c, ci) => (
                      <div key={ci} className="rounded-lg bg-white dark:bg-muted/30 border border-border px-3 py-2">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[11px] font-semibold text-foreground">{c.user}</span>
                          <span className="text-[10px] text-muted-foreground">{c.date}</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{c.text}</p>
                      </div>
                    ))}
                  </div>
                )}
                {comments.length === 0 && (
                  <p className="text-xs text-muted-foreground mb-3 italic">Aucun commentaire pour cette étape.</p>
                )}

                <div className="flex gap-2">
                  <textarea
                    ref={commentInputRef}
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitComment(openCommentKey); } }}
                    placeholder="Expliquer pourquoi cette étape est bloquée, en attente… (Entrée pour envoyer)"
                    className="flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-400/50 min-h-[60px]"
                    rows={2}
                  />
                  <button
                    onClick={() => submitComment(openCommentKey)}
                    disabled={!commentText.trim()}
                    className="self-end px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                  >
                    <SendIcon className="h-3.5 w-3.5" />
                    Envoyer
                  </button>
                </div>
              </>
            );
          })()}
        </motion.div>
      )}

      {/* Vertical layout for < 900px */}
      <div className="min-[900px]:hidden flex flex-col gap-0 relative">
        {steps.map((step, i) => {
          const color = getColor(i);
          const Icon = iconMap[step.icon] || FolderOpen;
          const isLast = isLastStep(i);
          const isActive = step.status === "active";
          const isCompleted = step.status === "completed";
          const isPending = step.status === "pending";
          const canStart = i === nextStartableIndex && isPending && step.button;
          const elapsed = step.startedAt ? formatElapsed(step.startedAt) : null;
          const elapsedDays = step.startedAt ? getElapsedDays(step.startedAt) : 0;

          return (
            <div key={step.key} className={cn("relative flex gap-4", isPending && "opacity-50")} role="listitem"
              aria-label={`${step.label}: ${isCompleted ? "terminé" : isActive ? "en cours" : "en attente"}`}
              aria-current={isActive ? "step" : undefined}>
              {/* Vertical line + circle */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{ border: `2px solid ${color}` }}
                      animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                  <div
                    className={cn("flex items-center justify-center rounded-full shrink-0 relative z-10",
                      isActive && "ring-4 ring-offset-2 ring-offset-card",
                      isActive && isLast && "cursor-pointer"
                    )}
                    style={{
                      width: 56,
                      height: 56,
                      border: `3px solid ${color}`,
                      backgroundColor: isCompleted ? color : isActive ? `${color}15` : "transparent",
                      "--tw-ring-color": isActive ? `${color}40` : undefined,
                    } as React.CSSProperties}
                    onClick={isActive && isLast ? () => onComplete?.(step.key) : undefined}
                    title={isActive && isLast ? "Cliquer pour marquer comme terminé (100%)" : undefined}
                  >
                    <Icon className="h-5 w-5" style={{ color: isCompleted ? "white" : color }} />
                  </div>
                </div>
                {!isLast && (
                  <div className="w-[3px] flex-1 min-h-[24px] rounded-full transition-all" style={{ backgroundColor: isCompleted ? color : `${color}30` }} />
                )}
              </div>

              {/* Content */}
              <div className="pb-6 pt-1 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold tracking-wide" style={{ color }}>{step.label}</span>
                  {(isActive || isCompleted) && elapsed && (
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1",
                        isActive && elapsedDays > 3 ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : ""
                      )}
                      style={!(isActive && elapsedDays > 3) ? { backgroundColor: `${color}15`, color } : undefined}
                    >
                      <Clock className="h-3 w-3" />
                      {elapsed}
                    </span>
                  )}
                  {isActive && (
                    <motion.span
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                      style={{ backgroundColor: color }}
                    >
                      EN COURS
                    </motion.span>
                  )}
                  {isCompleted && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground">TERMINÉ</span>
                  )}
                </div>
                {editingDescKey === step.key ? (
                  <div className="mt-1 flex items-center gap-1">
                    <input
                      autoFocus
                      className="text-xs flex-1 border border-border rounded px-2 py-0.5 bg-background text-foreground outline-none focus:ring-1 focus:ring-primary"
                      value={editingDescText}
                      onChange={e => setEditingDescText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter") {
                          onEditDescription?.(step.key, editingDescText);
                          setEditingDescKey(null);
                        } else if (e.key === "Escape") {
                          setEditingDescKey(null);
                        }
                      }}
                      onBlur={() => {
                        if (editingDescText !== step.description) {
                          onEditDescription?.(step.key, editingDescText);
                        }
                        setEditingDescKey(null);
                      }}
                    />
                  </div>
                ) : (
                  <p
                    className="text-xs mt-1 text-muted-foreground cursor-pointer hover:text-foreground group flex items-center gap-1"
                    onClick={() => { if (onEditDescription) { setEditingDescKey(step.key); setEditingDescText(step.description ?? ""); } }}
                    title={onEditDescription ? "Cliquer pour modifier" : undefined}
                  >
                    {step.description || <span className="italic opacity-50">Ajouter une description…</span>}
                    {onEditDescription && <Pencil className="h-2.5 w-2.5 opacity-0 group-hover:opacity-50 shrink-0" />}
                  </p>
                )}
                <div className="flex gap-2 mt-2 flex-wrap">
                  {canStart && (
                    <button
                      onClick={() => onStart?.(step.button!.actionId, step.key)}
                      className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white transition-all hover:scale-105 flex items-center gap-1"
                      style={{ backgroundColor: color }}
                    >
                      <Play className="h-3 w-3" /> DÉMARRER
                    </button>
                  )}
                  {isActive && (
                    <button
                      onClick={() => onComplete?.(step.key)}
                      className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white transition-all hover:scale-105 flex items-center gap-1 bg-emerald-500"
                    >
                      <CheckCircle2 className="h-3 w-3" /> TERMINER
                    </button>
                  )}
                  {isCompleted && onRevert && (
                    <button
                      onClick={() => onRevert(step.key)}
                      className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all hover:scale-105 flex items-center gap-1 border-2"
                      style={{ borderColor: color, color }}
                    >
                      <RotateCcw className="h-3 w-3" /> REVENIR
                    </button>
                  )}
                  <button
                    onClick={() => toggleComment(step.key)}
                    className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all hover:scale-105 flex items-center gap-1",
                      openCommentKey === step.key
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        : "border border-muted-foreground/30 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <MessageSquare className="h-3 w-3" />
                    {(stepComments[step.key]?.length ?? 0) > 0
                      ? `${stepComments[step.key].length} COMM.`
                      : "COMMENTER"}
                  </button>
                </div>

                {/* Inline comment panel — vertical layout */}
                {openCommentKey === step.key && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-3 rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50/60 dark:bg-amber-900/10 p-3 overflow-hidden"
                  >
                    {(stepComments[step.key] ?? []).length > 0 && (
                      <div className="space-y-2 mb-3 max-h-32 overflow-y-auto">
                        {(stepComments[step.key] ?? []).map((c, ci) => (
                          <div key={ci} className="rounded bg-white dark:bg-muted/30 border border-border px-2.5 py-1.5">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-[11px] font-semibold text-foreground">{c.user}</span>
                              <span className="text-[10px] text-muted-foreground">{c.date}</span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">{c.text}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <textarea
                        ref={openCommentKey === step.key ? commentInputRef : undefined}
                        value={commentText}
                        onChange={e => setCommentText(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitComment(step.key); } }}
                        placeholder="Expliquer le blocage ou l'attente… (Entrée pour envoyer)"
                        className="flex-1 resize-none rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-400/50 min-h-[48px]"
                        rows={2}
                      />
                      <button
                        onClick={() => submitComment(step.key)}
                        disabled={!commentText.trim()}
                        className="self-end px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <SendIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
