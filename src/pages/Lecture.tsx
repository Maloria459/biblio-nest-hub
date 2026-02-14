import { TabbedPage } from "@/components/TabbedPage";
import { BookOpen, Layers, FolderOpen, Handshake } from "lucide-react";
import type { TabItem } from "@/components/BottomTabBar";

const tabs: TabItem[] = [
  { label: "Ma bibliothèque", icon: BookOpen },
  { label: "Ma pile à lire", icon: Layers },
  { label: "Mes collections", icon: FolderOpen },
  { label: "Registre des prêts", icon: Handshake },
];

const Lecture = () => (
  <TabbedPage tabs={tabs} defaultTab={tabs[0].label} />
);

export default Lecture;
