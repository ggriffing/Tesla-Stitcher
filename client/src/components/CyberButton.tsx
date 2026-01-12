import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface CyberButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  isLoading?: boolean;
}

export const CyberButton = forwardRef<HTMLButtonElement, CyberButtonProps>(
  ({ className, children, variant = "primary", isLoading, disabled, ...props }, ref) => {
    const variants = {
      primary: "bg-primary/10 hover:bg-primary/20 text-primary border-primary shadow-[0_0_15px_rgba(0,255,255,0.15)] hover:shadow-[0_0_25px_rgba(0,255,255,0.3)]",
      secondary: "bg-secondary/10 hover:bg-secondary/20 text-secondary border-secondary shadow-[0_0_15px_rgba(147,51,234,0.15)] hover:shadow-[0_0_25px_rgba(147,51,234,0.3)]",
      danger: "bg-destructive/10 hover:bg-destructive/20 text-red-500 border-red-500/50 hover:border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.15)] hover:shadow-[0_0_25px_rgba(239,68,68,0.3)]",
      ghost: "bg-transparent hover:bg-white/5 text-muted-foreground hover:text-white border-transparent hover:border-white/10",
    };

    return (
      <button
        ref={ref}
        disabled={isLoading || disabled}
        className={cn(
          "relative inline-flex items-center justify-center px-6 py-2.5 overflow-hidden",
          "font-mono text-sm font-semibold tracking-wider uppercase transition-all duration-300",
          "border border-opacity-50",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none",
          // Corner cuts
          "before:absolute before:top-0 before:left-0 before:w-2 before:h-2 before:border-t-2 before:border-l-2 before:border-current before:transition-all before:duration-300",
          "after:absolute after:bottom-0 after:right-0 after:w-2 after:h-2 after:border-b-2 after:border-r-2 after:border-current after:transition-all after:duration-300",
          "hover:before:w-full hover:before:h-full hover:after:w-full hover:after:h-full",
          variants[variant],
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        <span className="relative z-10 flex items-center gap-2">{children}</span>
      </button>
    );
  }
);
CyberButton.displayName = "CyberButton";
