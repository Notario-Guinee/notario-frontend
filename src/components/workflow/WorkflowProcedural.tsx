// ═══════════════════════════════════════════════════════════════
// Composant WorkflowProcedural — Visualisation des étapes d'un
// dossier notarial sous forme de pipeline interactif animé
// Supporte les dispositions horizontale (≥900px) et verticale
// Actions disponibles : Démarrer, Terminer, Revenir en arrière
// ═══════════════════════════════════════════════════════════════

import { useCallback, useEffect, useState } from "react";
import {
  Search, FolderOpen, PenLine, FileSignature, CreditCard, Send, Archive,
  Stamp, Newspaper, CheckCircle2, Clock, Play, RotateCcw, Timer
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkflowConfig, WorkflowStep } from "./workflow-types";
import { WORKFLOW_PALETTE, formatElapsed, getElapsedDays } from "./workflow-types";
import { motion } from "framer-motion";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Search, FolderOpen, PenLine, FileSignature, CreditCard, Send, Archive,
  Stamp, Newspaper, CheckCircle2, Clock, Play,
};

interface WorkflowProceduralProps {
  config: WorkflowConfig;
  onStart?: (actionId: string, stepKey: string) => void;
  onRevert?: (stepKey: string) => void;
  onComplete?: (stepKey: string) => void;
  className?: string;
}

export default function WorkflowProcedural({ config, onStart, onRevert, onComplete, className }: WorkflowProceduralProps) {
  const { steps } = config;
  const palette = config.palette?.length ? config.palette : WORKFLOW_PALETTE;
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

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
              <p className={cn("mt-1 text-[10px] text-center leading-tight max-w-[120px]", isPending && "opacity-40")} style={{ color: "#6B7280" }}>
                {step.description}
              </p>

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
                <p className="text-xs mt-1" style={{ color: "#6B7280" }}>{step.description}</p>
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
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
