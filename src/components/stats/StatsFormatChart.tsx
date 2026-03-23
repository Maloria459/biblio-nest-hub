import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis } from "recharts";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FormatData {
  name: string;
  value: number;
}

interface Props {
  ownedData: FormatData[];
  readData: FormatData[];
}

const chartConfig = {
  value: { label: "Livres", color: "hsl(var(--foreground))" },
};

function FormatBars({ data }: { data: FormatData[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">Aucune donnée</p>;
  }

  return (
    <ChartContainer config={chartConfig} className="h-[200px] w-full">
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
        <XAxis type="number" tick={{ fontSize: 11 }} />
        <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="value" fill="hsl(var(--foreground))" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ChartContainer>
  );
}

export function StatsFormatChart({ ownedData, readData }: Props) {
  const [view, setView] = useState<string>("owned");

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">Répartition par format</CardTitle>
        <Tabs value={view} onValueChange={setView} className="h-auto">
          <TabsList className="h-7 p-0.5">
            <TabsTrigger value="owned" className="text-[11px] h-6 px-2">Détenus</TabsTrigger>
            <TabsTrigger value="read" className="text-[11px] h-6 px-2">Lus</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <FormatBars data={view === "owned" ? ownedData : readData} />
      </CardContent>
    </Card>
  );
}
