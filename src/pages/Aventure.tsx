import { TabbedPage } from "@/components/TabbedPage";

const tabs = ["Ma progression", "Défis livresques", "Bibliotik"];

const Aventure = () => (
  <TabbedPage title="Mon aventure littéraire" tabs={tabs} defaultTab={tabs[0]} />
);

export default Aventure;
