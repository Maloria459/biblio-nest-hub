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
    <div className="fixed bottom-0 right-0 left-0 md:left-[var(--sidebar-width)] z-40 flex h-[var(--bottombar-height)] items-center justify-center border-t border-border bg-card/95 px-2 md:px-4 backdrop-blur-sm">
      <div className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-muted p-1 shadow-sm overflow-x-auto max-w-full">
        {tabs.map((tab) => (
          <button
            key={tab.label}
            onClick={() => onTabChange(tab.label)}
            className={`inline-flex items-center gap-1 md:gap-1.5 rounded-md px-2 md:px-3 py-1.5 text-[11px] md:text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.label
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
