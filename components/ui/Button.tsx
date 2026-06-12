import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "outline";
  loading?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        // 💥 Changed from violet to your primary brand colors 💥
        variant === "primary" &&
          "bg-primary text-white hover:bg-primary/90 active:bg-primary/80",
        variant === "ghost" &&
          "text-zinc-400 hover:text-white hover:bg-zinc-800",
        variant === "outline" &&
          "border border-zinc-700 text-white hover:border-zinc-500 hover:bg-zinc-900",
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}