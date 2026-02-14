interface BottomTabBarProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomTabBar({ tabs, activeTab, onTabChange }: BottomTabBarProps) {
  return (
    <div className="sticky bottom-0 z-20 flex h-[var(--bottombar-height)] items-center gap-1 border-t border-border bg-card px-4">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            activeTab === tab
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
