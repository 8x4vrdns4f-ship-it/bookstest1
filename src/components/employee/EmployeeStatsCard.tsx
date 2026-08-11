import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, TrendingUp } from "lucide-react";
import { EmployeeStats } from "./types";

const Item = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-[14px] border border-border bg-secondary/30 p-3 text-center">
    <p className="text-lg font-bold text-foreground leading-none">{value}</p>
    <p className="text-[11px] text-muted-foreground mt-1.5">{label}</p>
  </div>
);

export default function EmployeeStatsCard({ stats }: { stats: EmployeeStats }) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-foreground text-base flex items-center gap-2">
          <TrendingUp size={16} /> Your week
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2">
          <Item label="Completed" value={String(stats.completedThisWeek)} />
          <Item label="Hours worked" value={stats.hoursThisWeek ? stats.hoursThisWeek.toFixed(1) : "—"} />
          <Item
            label={stats.ratingCount ? `${stats.ratingCount} reviews` : "No reviews yet"}
            value={stats.averageRating != null ? `${stats.averageRating.toFixed(1)}★` : "—"}
          />
        </div>
        {stats.averageRating != null && (
          <p className="text-[11px] text-muted-foreground mt-3 flex items-center gap-1.5">
            <Star size={12} /> Average rating from clients you served.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
