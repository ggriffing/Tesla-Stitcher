import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface CyberCardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  active?: boolean;
}

export const CyberCard = forwardRef<HTMLDivElement, CyberCardProps>(
  ({ className, title, active, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative bg-card/50 border backdrop-blur-sm transition-all duration-300",
          active ? "border-primary shadow-[0_0_20px_rgba(0,255,255,0.1)]" : "border-white/10 hover:border-white/20",
          className
        )}
        {...props}
      >
        {/* Header strip */}
        <div className={cn(
          "h-1 w-full absolute top-0 left-0 transition-colors duration-300",
          active ? "bg-primary" : "bg-white/5 group-hover:bg-white/10"
        )} />
        
        <div className="p-6">
          {title && (
            <h3 className={cn(
              "text-lg font-display font-bold uppercase tracking-widest mb-4",
              active ? "text-primary text-glow" : "text-foreground"
            )}>
              {title}
            </h3>
          )}
          {children}
        </div>

        {/* Tech decorative elements */}
        <div className="absolute bottom-2 right-2 flex gap-1">
          <div className={cn("w-1 h-1 rounded-full", active ? "bg-primary animate-pulse" : "bg-muted-foreground/20")} />
          <div className={cn("w-1 h-1 rounded-full", active ? "bg-primary/50" : "bg-muted-foreground/20")} />
          <div className={cn("w-1 h-1 rounded-full", active ? "bg-primary/30" : "bg-muted-foreground/20")} />
        </div>
      </div>
    );
  }
);
CyberCard.displayName = "CyberCard";
