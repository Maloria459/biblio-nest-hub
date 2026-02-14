import { useState } from "react";
import { TopBar } from "@/components/TopBar";
import { BottomTabBar, type TabItem } from "@/components/BottomTabBar";

interface TabbedPageProps {
  tabs: TabItem[];
  defaultTab: string;
}

export function TabbedPage({ tabs, defaultTab }: TabbedPageProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <div className="flex flex-col flex-1">
      <TopBar />
      <div className="flex-1" />
      <BottomTabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
