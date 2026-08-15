"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Search,
  MessageSquare,
  Box,
  Settings as SettingsIcon,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/search", label: "Search", icon: Search },
  { href: "/ask", label: "Ask AI", icon: MessageSquare },
  { href: "/vector-lab", label: "Vector Lab", icon: Box },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-neutral-800 bg-neutral-950">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="h-2 w-2 rounded-full bg-cyan-400" />
        <span className="text-sm font-semibold tracking-widest text-neutral-100">
          RECALLAI
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-3">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-neutral-900 text-cyan-400"
                  : "text-neutral-400 hover:bg-neutral-900/60 hover:text-neutral-200"
              }`}
            >
              <Icon size={16} strokeWidth={1.75} />
              <span className="tracking-wide uppercase text-xs">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
