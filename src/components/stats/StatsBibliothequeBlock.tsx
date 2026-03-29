import { StatsGenreChart } from "./StatsGenreChart";
import { StatsFormatChart } from "./StatsFormatChart";

interface ChartData {
  name: string;
  value: number;
}

interface Props {
  genreOwned: ChartData[];
  genreRead: ChartData[];
  formatOwned: ChartData[];
  formatRead: ChartData[];
  booksAcquired: number;
  totalSpent: number;
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}

export function StatsBibliothequeBlock(props: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-foreground">📚 Bibliothèque</h2>

      <div className="grid grid-cols-2 gap-3">
        <StatItem label="Livres achetés" value={String(props.booksAcquired)} />
        <StatItem label="Argent dépensé" value={`${props.totalSpent.toFixed(2)} €`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StatsGenreChart ownedData={props.genreOwned} readData={props.genreRead} />
        <StatsFormatChart ownedData={props.formatOwned} readData={props.formatRead} />
      </div>
    </div>
  );
}
