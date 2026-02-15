import { useParams } from "react-router-dom";
import { TopBar } from "@/components/TopBar";

const BookDetail = () => {
  const { id } = useParams();
  return (
    <div className="flex flex-col flex-1">
      <TopBar />
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        Détail du livre #{id} — à venir
      </div>
    </div>
  );
};

export default BookDetail;
