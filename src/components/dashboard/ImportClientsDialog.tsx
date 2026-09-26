import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileSpreadsheet, Loader2 } from "lucide-react";

type Row = { name: string; email: string | null; phone: string | null; notes: string | null };

/** Parse a simple CSV (name,email,phone,notes) with optional header row and quoted fields. */
function parseCsv(text: string): Row[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];
  const splitLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        out.push(cur.trim()); cur = "";
      } else cur += ch;
    }
    out.push(cur.trim());
    return out;
  };
  let rows = lines.map(splitLine);
  // Drop a header row if the first cell looks like "name"
  if (rows[0]?.[0]?.toLowerCase().replace(/[^a-z]/g, "") === "name") rows = rows.slice(1);
  return rows
    .map((cols) => ({
      name: cols[0] || "",
      email: cols[1] || null,
      phone: cols[2] || null,
      notes: cols.slice(3).join(", ") || null,
    }))
    .filter((r) => r.name.length > 0);
}

/**
 * Lets owners switching from another booking tool (or a spreadsheet) bring their
 * client list with them — upload a CSV export and everyone lands in BookSuite.
 */
export default function ImportClientsDialog({ userId, onImported }: { userId: string; onImported: () => void }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const onFile = async (file: File) => {
    const text = await file.text();
    const parsed = parseCsv(text);
    if (parsed.length === 0) {
      toast({ title: "No clients found", description: "The file should have one client per line: name, email, phone, notes.", variant: "destructive" });
      return;
    }
    setRows(parsed);
    setFileName(file.name);
  };

  const doImport = async () => {
    setImporting(true);
    const payload = rows.map((r) => ({ ...r, user_id: userId }));
    // Insert in chunks to stay well within request limits
    let inserted = 0;
    for (let i = 0; i < payload.length; i += 200) {
      const { error } = await supabase.from("clients").insert(payload.slice(i, i + 200));
      if (error) {
        toast({ title: "Import failed", description: error.message, variant: "destructive" });
        setImporting(false);
        return;
      }
      inserted += Math.min(200, payload.length - i);
    }
    toast({ title: `Imported ${inserted} client${inserted === 1 ? "" : "s"}`, description: "Your client list is ready — you're all set to take bookings." });
    setImporting(false);
    setOpen(false);
    setRows([]);
    setFileName(null);
    onImported();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Upload className="h-3.5 w-3.5" /> Import clients
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Import your client list</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Switching from another booking tool or a spreadsheet? Export your clients as a CSV file
            (<span className="font-mono text-xs">name, email, phone, notes</span>) and upload it here —
            your whole list moves over in one go.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv,text/plain"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
              e.target.value = "";
            }}
          />
          <Button variant="secondary" className="gap-2 w-full" onClick={() => fileRef.current?.click()}>
            <FileSpreadsheet className="h-4 w-4" />
            {fileName ? `Replace file (${fileName})` : "Choose CSV file"}
          </Button>

          {rows.length > 0 && (
            <>
              <div className="rounded-lg border border-border max-h-56 overflow-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="text-left p-2 font-medium">Name</th>
                      <th className="text-left p-2 font-medium">Email</th>
                      <th className="text-left p-2 font-medium">Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 50).map((r, i) => (
                      <tr key={i} className="border-t border-border/50">
                        <td className="p-2">{r.name}</td>
                        <td className="p-2 text-muted-foreground">{r.email || "—"}</td>
                        <td className="p-2 text-muted-foreground">{r.phone || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length > 50 && (
                  <p className="p-2 text-xs text-muted-foreground border-t border-border/50">
                    …and {rows.length - 50} more
                  </p>
                )}
              </div>
              <Button className="w-full gap-2" onClick={doImport} disabled={importing}>
                {importing && <Loader2 className="h-4 w-4 animate-spin" />}
                Import {rows.length} client{rows.length === 1 ? "" : "s"}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
