import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
}

export function LoadingSpinner({ size = "md", className, label }: LoadingSpinnerProps) {
  const sizeMap = { sm: "h-8 w-8", md: "h-14 w-14", lg: "h-20 w-20" };
  const ringWidth = { sm: "border-[2.5px]", md: "border-[3px]", lg: "border-4" };
  const dotSize = { sm: "h-1.5 w-1.5", md: "h-2.5 w-2.5", lg: "h-3.5 w-3.5" };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <div className="relative">
        {/* Outer glowing ring */}
        <motion.div
          className={cn(
            "rounded-full",
            sizeMap[size],
            ringWidth[size],
            "border-primary/15"
          )}
          style={{
            borderTopColor: "hsl(var(--primary))",
            borderRightColor: "hsl(var(--primary) / 0.5)",
            filter: "drop-shadow(0 0 6px hsl(var(--primary) / 0.4))",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
        />
        {/* Second ring (counter-rotate) */}
        <motion.div
          className={cn(
            "absolute inset-1 rounded-full border-2 border-transparent",
          )}
          style={{
            borderBottomColor: "hsl(var(--accent-foreground) / 0.3)",
            borderLeftColor: "hsl(var(--accent-foreground) / 0.15)",
          }}
          animate={{ rotate: -360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
        />
        {/* Center dots */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className={cn("rounded-full bg-primary", dotSize[size])}
                style={{ boxShadow: "0 0 8px hsl(var(--primary) / 0.5)" }}
                animate={{ scale: [0.8, 1.5, 0.8], opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
              />
            ))}
          </div>
        </div>
      </div>
      {label && (
        <motion.p
          className="text-sm text-foreground font-semibold tracking-wide"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        >
          {label}
        </motion.p>
      )}
    </div>
  );
}

/** Full-page loader */
export function PageLoader({ label }: { label?: string }) {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <LoadingSpinner size="lg" label={label || "Chargement..."} />
    </div>
  );
}
