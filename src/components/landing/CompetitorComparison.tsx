import { Check, X } from "lucide-react";

type Cell = boolean | string;
type Row = { feature: string; booksuite: Cell; calendly: Cell; fresha: Cell; setmore: Cell };

const ROWS: Row[] = [
  { feature: "Starts from",            booksuite: "£1.99/mo", calendly: "Free / $12", fresha: "Free (fees on top)", setmore: "Free / $12" },
  { feature: "Per-booking fee",        booksuite: "From 2.5%", calendly: "—",         fresha: "1.29% + £0.20",       setmore: "—" },
  { feature: "Take deposits",          booksuite: true,        calendly: false,       fresha: true,                   setmore: true },
  { feature: "Embed widget on your site", booksuite: true,     calendly: true,        fresha: false,                  setmore: true },
  { feature: "Bookable resources (tables/rooms)", booksuite: true, calendly: false,   fresha: false,                  setmore: false },
  { feature: "Staff & shifts",         booksuite: true,        calendly: false,       fresha: true,                   setmore: true },
  { feature: "Multi-language widget",  booksuite: "38 langs",  calendly: "16 langs",  fresha: "10+ langs",            setmore: "Limited" },
  { feature: "Custom domain",          booksuite: true,        calendly: true,        fresha: false,                  setmore: false },
  { feature: "Gift codes & referrals", booksuite: true,        calendly: false,       fresha: true,                   setmore: false },
];

const COLS = [
  { key: "booksuite" as const, label: "BookSuite", highlight: true },
  { key: "calendly" as const,  label: "Calendly" },
  { key: "fresha" as const,    label: "Fresha" },
  { key: "setmore" as const,   label: "Setmore" },
];

const renderCell = (v: Cell, highlight?: boolean) => {
  if (v === true) return <Check size={16} className={`mx-auto ${highlight ? "text-primary" : "text-foreground/70"}`} />;
  if (v === false) return <X size={16} className="text-muted-foreground/40 mx-auto" />;
  return <span className={`text-xs md:text-sm ${highlight ? "text-primary font-medium" : "text-foreground/80"}`}>{v}</span>;
};

const monthYear = new Date().toLocaleDateString(undefined, { month: "long", year: "numeric" });

const CompetitorComparison = () => (
  <section className="px-6 md:px-16 py-16 md:py-20">
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">How BookSuite compares</h2>
        <p className="text-muted-foreground text-sm md:text-base">
          A quick look at what you get versus the other names in booking software.
        </p>
      </div>

      <div className="w-full overflow-x-auto rounded-2xl border border-border">
        <table className="w-full border-collapse min-w-[640px]">
          <thead>
            <tr className="border-b border-border bg-card/40">
              <th className="text-left py-4 px-4 md:px-6 text-muted-foreground font-medium text-sm">Feature</th>
              {COLS.map(c => (
                <th
                  key={c.key}
                  className={`py-4 px-3 md:px-6 text-center min-w-[110px] ${c.highlight ? "bg-primary/5" : ""}`}
                >
                  <span className={`block font-bold text-sm md:text-base ${c.highlight ? "text-primary" : "text-foreground"}`}>
                    {c.label}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r, i) => (
              <tr key={r.feature} className={`border-b border-border/50 ${i % 2 === 0 ? "" : "bg-secondary/20"}`}>
                <td className="py-3 px-4 md:px-6 text-foreground text-sm font-medium">{r.feature}</td>
                {COLS.map(c => (
                  <td key={c.key} className={`py-3 px-3 md:px-6 text-center ${c.highlight ? "bg-primary/5" : ""}`}>
                    {renderCell(r[c.key], c.highlight)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-center text-xs text-muted-foreground/70 mt-4 max-w-2xl mx-auto">
        Comparison based on publicly available information as of {monthYear}. Competitor products belong to their respective owners.
      </p>
    </div>
  </section>
);

export default CompetitorComparison;
