import { cn } from "@/lib/utils";

interface AuthCardProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  className?: string;
}

export function AuthCard({ title, subtitle, children, className }: AuthCardProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4">
      <div
        className={cn(
          "w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-8 shadow-2xl",
          className
        )}
      >
        {/* Logo */}
        <div className="mb-8 text-center">
          <span className="text-2xl font-bold tracking-tight text-white">
            Beatz<span className="text-violet-400">Vid</span>
          </span>
          <h1 className="mt-4 text-xl font-semibold text-white">{title}</h1>
          <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
        </div>

        {children}
      </div>
    </div>
  );
}
