import { TabbedPage } from "@/components/TabbedPage";
import { BookOpen, Layers, FolderOpen, Handshake } from "lucide-react";
import type { TabItem } from "@/components/BottomTabBar";
import { BibliothequeContent } from "@/components/BibliothequeContent";
import { PileALireContent } from "@/components/PileALireContent";
import { CollectionsContent } from "@/components/CollectionsContent";
import { LoanRegistryContent } from "@/components/LoanRegistryContent";

const tabs: TabItem[] = [
  { label: "Ma bibliothèque", icon: BookOpen },
  { label: "Ma pile à lire", icon: Layers },
  { label: "Mes collections", icon: FolderOpen },
  { label: "Registre des prêts", icon: Handshake },
];

const Lecture = () => (
  <TabbedPage
    tabs={tabs}
    defaultTab={tabs[0].label}
    tabContent={{
      "Ma bibliothèque": <BibliothequeContent />,
      "Ma pile à lire": <PileALireContent />,
      "Registre des prêts": <LoanRegistryContent />,
    }}
  />
);

export default Lecture;
