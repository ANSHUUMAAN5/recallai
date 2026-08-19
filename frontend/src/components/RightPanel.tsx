"use client";

import { TABS, type TabKey } from "@/lib/constants";

interface Props {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  children: React.ReactNode;
}

export default function RightPanel({ activeTab, onTabChange, children }: Props) {
  return (
    <aside data-ws-right className="flex w-96 shrink-0 flex-col border-l border-border bg-surface">
      <div className="flex border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`flex-1 px-2 py-3 text-xs font-medium uppercase tracking-wide transition-colors ${
              activeTab === tab.key
                ? "border-b-2 border-accent text-accent"
                : "text-muted hover:text-ink-soft"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div key={activeTab} className="min-h-0 flex-1 overflow-y-auto animate-tab-in">
        {children}
      </div>
    </aside>
  );
}
