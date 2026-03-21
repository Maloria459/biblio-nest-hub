import { useState, type ReactNode } from "react";
import { BottomTabBar, type TabItem } from "@/components/BottomTabBar";

interface TabbedPageProps {
  tabs: TabItem[];
  defaultTab: string;
  tabContent?: Record<string, ReactNode>;
}

export function TabbedPage({ tabs, defaultTab, tabContent }: TabbedPageProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <div className="flex h-full min-h-screen flex-col overflow-hidden">
      <div className="flex flex-1 flex-col overflow-hidden pb-[calc(var(--bottombar-height)+1rem)]">
        {tabContent?.[activeTab] ?? null}
      </div>
      <BottomTabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
