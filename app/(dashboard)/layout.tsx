"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Music2,
  Video,
  Upload,
  LogOut,
  Clapperboard,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/songs",     icon: Music2,          label: "Songs"     },
  { href: "/videos",    icon: Video,           label: "Videos"    },
  { href: "/upload",    icon: Upload,          label: "Upload"    },
  { href: "/studio",    icon: Clapperboard,    label: "Studio"    },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router   = useRouter();
  const supabase = createClient();
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single()
        .then(({ data }: { data: { username: string } | null }) => {
          setUsername(data?.username || null);
        });
    });
  }, [supabase]);

  return (
    // 💥 REMOVED bg-gray-50 and replaced it with bg-black
    <div className="flex h-screen w-full bg-black">
      
      <aside className="w-64 bg-black text-white flex flex-col border-r border-zinc-800">
        
        <div className="p-6 flex flex-col items-center border-b border-zinc-900">
          
          <div className="relative w-32 h-32 mb-2">
            <Image 
              src="/logo.jpg" 
              alt="OG BEATZ Logo" 
              fill
              sizes="128px" 
              className="object-contain rounded-full shadow-[0_0_15px_rgba(249,115,22,0.3)]" 
            />
          </div>
          
          {username && (
            // Updated to text-primary
            <p className="text-sm font-semibold text-primary tracking-wider mt-2">
              @{username}
            </p>
          )}
        </div>
        
        <nav className="flex-1 px-4 space-y-1 mt-6">
          {NAV.map((item) => {
            const Icon = item.icon;
            const isActive = pathname?.startsWith(item.href); 
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors font-medium text-sm",
                  isActive 
                    // Updated to bg-primary
                    ? "bg-primary text-white shadow-lg"
                    : "text-gray-300 hover:text-white hover:bg-zinc-900"
                )}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-900">
          {/* Updated to hover:text-primary */}
          <button className="flex items-center gap-3 text-gray-400 hover:text-primary w-full px-3 py-2 transition-colors text-sm font-medium">
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* 💥 REMOVED bg-zinc-50 and replaced it with a dark bg-zinc-950 */}
      <main className="flex-1 overflow-y-auto bg-zinc-950">
        {children}
      </main>
      
    </div>
  );
}