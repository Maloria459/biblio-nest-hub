import { useState } from "react";
import { TopBar } from "@/components/TopBar";
import { BottomTabBar } from "@/components/BottomTabBar";

interface TabbedPageProps {
  title: string;
  tabs: string[];
  defaultTab: string;
}

export function TabbedPage({ title, tabs, defaultTab }: TabbedPageProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <div className="flex flex-col flex-1">
      <TopBar title={title} subtitle={activeTab} />
      <div className="flex-1" />
      <BottomTabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
