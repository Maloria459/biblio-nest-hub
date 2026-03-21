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
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        {tabContent?.[activeTab] ?? null}
      </div>
      <BottomTabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
