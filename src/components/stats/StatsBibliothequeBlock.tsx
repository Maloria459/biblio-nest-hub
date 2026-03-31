import { ShoppingCart, Wallet, Library } from "lucide-react";
import { StatsGenreChart } from "./StatsGenreChart";
import { StatsFormatChart } from "./StatsFormatChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  totalBooks: number;
}

function StatItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}

export function StatsBibliothequeBlock(props: Props) {
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">📚 Bibliothèque</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <StatItem icon={Library} label="Total livres" value={String(props.totalBooks)} />
          <StatItem icon={ShoppingCart} label="Livres acquis" value={String(props.booksAcquired)} />
          <StatItem icon={Wallet} label="Argent dépensé" value={`${props.totalSpent.toFixed(2)} €`} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <StatsGenreChart ownedData={props.genreOwned} readData={props.genreRead} />
          <StatsFormatChart ownedData={props.formatOwned} readData={props.formatRead} />
        </div>
      </CardContent>
    </Card>
  );
}
