import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

interface Props {
  distribution: number[]; // index 0 = 1 star, index 4 = 5 stars
  average: number | null;
}

const chartConfig = {
  count: { label: "Livres", color: "hsl(var(--foreground))" },
};

export function StatsRatingChart({ distribution, average }: Props) {
  const data = distribution.map((count, i) => {
    const value = (i + 1) * 0.5;
    return { name: Number.isInteger(value) ? `${value} ★` : `${value}`, count };
  });

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium text-muted-foreground">Distribution des notes</CardTitle>
        {average !== null && (
          <span className="text-sm font-semibold text-foreground">{average.toFixed(1)} ★ en moyenne</span>
        )}
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} label={{ value: "Livres", angle: -90, position: "insideLeft", style: { fontSize: 10, fill: "hsl(var(--muted-foreground))" } }} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="count" fill="hsl(var(--foreground))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
