import { TabbedPage } from "@/components/TabbedPage";

const tabs = ["Ma bibliothèque", "Ma pile à lire", "Mes collections", "Registre des prêts"];

const Lecture = () => (
  <TabbedPage title="Mon coin lecture" tabs={tabs} defaultTab={tabs[0]} />
);

export default Lecture;
