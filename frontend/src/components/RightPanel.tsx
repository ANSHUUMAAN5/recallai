"use client";

import { TABS, type TabKey } from "@/lib/constants";

interface Props {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  children: React.ReactNode;
}

export default function RightPanel({ activeTab, onTabChange, children }: Props) {
  return (
    <aside className="flex w-96 shrink-0 flex-col border-l border-neutral-800 bg-neutral-950">
      <div className="flex border-b border-neutral-800">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`flex-1 px-2 py-3 text-xs font-medium uppercase tracking-wide transition-colors ${
              activeTab === tab.key
                ? "border-b-2 border-cyan-400 text-cyan-400"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </aside>
  );
}
