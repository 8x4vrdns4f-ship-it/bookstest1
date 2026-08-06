import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const axisProps = {
  stroke: "hsl(var(--muted-foreground))",
  tickLine: false,
  axisLine: false,
  fontSize: 11,
} as const;

function tooltipStyles() {
  return {
    contentStyle: {
      background: "hsl(var(--popover))",
      border: "1px solid hsl(var(--border))",
      borderRadius: 12,
      fontSize: 12,
      color: "hsl(var(--popover-foreground))",
    },
    labelStyle: { color: "hsl(var(--muted-foreground))" },
    cursor: { fill: "hsl(var(--muted) / 0.35)" },
  };
}

export function TrendChart({
  data,
  moneyFormatter,
}: {
  data: { label: string; bookings: number; revenue: number }[];
  moneyFormatter: (n: number) => string;
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="insightsFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis allowDecimals={false} {...axisProps} />
        <Tooltip
          {...tooltipStyles()}
          formatter={(value: number, name: string) =>
            name === "revenue" ? [moneyFormatter(value), "Revenue"] : [value, "Bookings"]
          }
        />
        <Area
          type="monotone"
          dataKey="bookings"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          fill="url(#insightsFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function CountBarChart({
  data,
  height = 220,
}: {
  data: { label: string; value: number }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="label" {...axisProps} interval={0} />
        <YAxis allowDecimals={false} {...axisProps} />
        <Tooltip {...tooltipStyles()} formatter={(v: number) => [v, "Bookings"]} />
        <Bar dataKey="value" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
