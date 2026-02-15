import { useState, type ReactNode } from "react";
import { TopBar } from "@/components/TopBar";
import { BottomTabBar, type TabItem } from "@/components/BottomTabBar";

interface TabbedPageProps {
  tabs: TabItem[];
  defaultTab: string;
  tabContent?: Record<string, ReactNode>;
}

export function TabbedPage({ tabs, defaultTab, tabContent }: TabbedPageProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <div className="flex flex-col flex-1">
      <TopBar />
      <div className="flex-1 flex flex-col">
        {tabContent?.[activeTab] ?? null}
      </div>
      <BottomTabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
