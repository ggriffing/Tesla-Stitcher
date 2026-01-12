import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface CyberInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const CyberInput = forwardRef<HTMLInputElement, CyberInputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full space-y-2">
        {label && (
          <label className="text-xs font-mono font-medium text-primary uppercase tracking-widest ml-1">
            {label}
          </label>
        )}
        <div className="relative group">
          <input
            ref={ref}
            className={cn(
              "w-full bg-background/50 border border-white/10 px-4 py-3",
              "text-foreground font-mono placeholder:text-muted-foreground/50",
              "focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50",
              "transition-all duration-200",
              // Diagonal corner cut visual trick using clip-path could go here, but keeping simple for inputs
              "hover:border-white/20",
              error && "border-red-500/50 focus:border-red-500 focus:ring-red-500/50",
              className
            )}
            {...props}
          />
          {/* Decorative corner accents */}
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-primary/50 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-primary/50 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        {error && <p className="text-xs text-red-400 font-mono ml-1">{error}</p>}
      </div>
    );
  }
);
CyberInput.displayName = "CyberInput";
