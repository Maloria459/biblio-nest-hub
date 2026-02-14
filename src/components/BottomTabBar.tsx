import { type LucideIcon } from "lucide-react";

export interface TabItem {
  label: string;
  icon: LucideIcon;
}

interface BottomTabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomTabBar({ tabs, activeTab, onTabChange }: BottomTabBarProps) {
  return (
    <div className="sticky bottom-0 z-20 flex h-[var(--bottombar-height)] items-center justify-center border-t border-border bg-card px-4">
      <div className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-muted p-1">
        {tabs.map((tab) => (
          <button
            key={tab.label}
            onClick={() => onTabChange(tab.label)}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === tab.label
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="h-3.5 w-3.5 shrink-0" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
