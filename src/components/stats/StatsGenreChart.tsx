import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell } from "recharts";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface GenreData {
  name: string;
  value: number;
}

interface Props {
  ownedData: GenreData[];
  readData: GenreData[];
}

const COLORS = [
  "hsl(var(--foreground))",
  "hsl(var(--muted-foreground))",
  "hsl(var(--foreground) / 0.7)",
  "hsl(var(--muted-foreground) / 0.6)",
  "hsl(var(--foreground) / 0.4)",
  "hsl(var(--muted-foreground) / 0.4)",
  "hsl(var(--foreground) / 0.25)",
  "hsl(var(--muted-foreground) / 0.25)",
];

function GenreDonut({ data }: { data: GenreData[] }) {
  const config = Object.fromEntries(data.map((d, i) => [d.name, { label: d.name, color: COLORS[i % COLORS.length] }]));
  const total = data.reduce((s, d) => s + d.value, 0);

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">Aucune donnée</p>;
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <ChartContainer config={config} className="h-[200px] w-[200px] aspect-square">
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent />} />
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      <div className="flex flex-wrap gap-2 justify-center">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center gap-1.5 text-xs">
            <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
            <span className="text-muted-foreground">{d.name}</span>
            <span className="font-medium text-foreground">{total ? Math.round((d.value / total) * 100) : 0}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StatsGenreChart({ ownedData, readData }: Props) {
  const [view, setView] = useState<string>("owned");

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">Répartition par genre</CardTitle>
        <Tabs value={view} onValueChange={setView} className="h-auto">
          <TabsList className="h-7 p-0.5">
            <TabsTrigger value="owned" className="text-[11px] h-6 px-2">Détenus</TabsTrigger>
            <TabsTrigger value="read" className="text-[11px] h-6 px-2">Lus</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <GenreDonut data={view === "owned" ? ownedData : readData} />
      </CardContent>
    </Card>
  );
}
