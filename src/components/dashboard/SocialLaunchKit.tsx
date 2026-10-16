import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Copy, Check, ImageDown, Plus, X, RotateCcw } from "lucide-react";

type Theme = { key: string; label: string; bg: [string, string]; accent: string; fg: string; muted: string; pill: string; font: string };

// Story templates are self-contained palettes: the image is a standalone graphic posted to Instagram, not app UI.
const THEMES: Theme[] = [
  { key: "luxe", label: "Dark luxe", bg: ["#0B0B0F", "#1C1A17"], accent: "#D4AF6A", fg: "#F7F3EA", muted: "#A79F8E", pill: "rgba(212,175,106,0.14)", font: "'Plus Jakarta Sans', sans-serif" },
  { key: "clean", label: "Clean minimal", bg: ["#F6F1EA", "#EADFD2"], accent: "#8A5A44", fg: "#2B211B", muted: "#7A6A5E", pill: "rgba(138,90,68,0.12)", font: "Georgia, 'Times New Roman', serif" },
  { key: "bold", label: "Vibrant bold", bg: ["#2563EB", "#DB2777"], accent: "#FDE047", fg: "#FFFFFF", muted: "#F1E7FF", pill: "rgba(255,255,255,0.18)", font: "'Plus Jakarta Sans', sans-serif" },
];

const HOOKS = ["ONLINE BOOKING NOW LIVE", "GRAB YOUR SLOT THIS WEEK", "NO MORE DMs — TAP TO BOOK"];

function wrap(ctx: CanvasRenderingContext2D, text: string, max: number) {
  const words = text.split(" "); const lines: string[] = []; let line = "";
  for (const w of words) { const t = line ? `${line} ${w}` : w; if (ctx.measureText(t).width > max && line) { lines.push(line); line = w; } else line = t; }
  lines.push(line); return lines;
}

async function drawStory(c: HTMLCanvasElement, o: { theme: Theme; hook: string; name: string; subtitle: string; cta: string; services: string[]; url: string }) {
  const W = 1080, H = 1920; c.width = W; c.height = H;
  const ctx = c.getContext("2d")!; const t = o.theme;
  const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, t.bg[0]); g.addColorStop(1, t.bg[1]);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // decorative rings
  ctx.strokeStyle = t.accent; ctx.globalAlpha = 0.18; ctx.lineWidth = 3;
  [260, 380, 500].forEach((r) => { ctx.beginPath(); ctx.arc(W + 40, 120, r, 0, Math.PI * 2); ctx.stroke(); });
  ctx.globalAlpha = 1; ctx.textAlign = "center";

  // hook badge
  ctx.font = `800 40px ${t.font}`;
  const hw = ctx.measureText(o.hook).width + 80;
  ctx.fillStyle = t.accent; ctx.beginPath(); ctx.roundRect((W - hw) / 2, 200, hw, 90, 45); ctx.fill();
  ctx.fillStyle = t.key === "bold" ? "#1E1B4B" : t.bg[0]; ctx.fillText(o.hook, W / 2, 260);

  // name
  ctx.fillStyle = t.fg; ctx.font = `800 104px ${t.font}`;
  const lines = wrap(ctx, o.name, W - 160).slice(0, 2);
  lines.forEach((l, i) => ctx.fillText(l, W / 2, 440 + i * 115));
  let y = 440 + lines.length * 115;
  ctx.fillStyle = t.muted; ctx.font = `500 40px ${t.font}`;
  if (o.subtitle) { ctx.fillText(o.subtitle, W / 2, y); y += 70; }

  // service pills
  ctx.font = `700 38px ${t.font}`;
  const svc = o.services.filter((s) => s.trim()).slice(0, 4);
  svc.forEach((s, i) => {
    const label = s.length > 28 ? s.slice(0, 27) + "…" : s;
    const pw = Math.min(W - 200, ctx.measureText(label).width + 90);
    const py = y + i * 96;
    ctx.fillStyle = t.pill; ctx.beginPath(); ctx.roundRect((W - pw) / 2, py, pw, 76, 38); ctx.fill();
    ctx.strokeStyle = t.accent; ctx.globalAlpha = 0.5; ctx.lineWidth = 2; ctx.stroke(); ctx.globalAlpha = 1;
    ctx.fillStyle = t.fg; ctx.fillText(label, W / 2, py + 51);
  });
  y += svc.length * 96 + 40;

  // QR
  const size = Math.min(480, 1560 - y);
  const qr = await QRCode.toDataURL(o.url, { width: 600, margin: 1, color: { dark: "#111111", light: "#FFFFFF" } });
  const img = new Image(); await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = qr; });
  const x = (W - size) / 2;
  ctx.fillStyle = "#FFFFFF"; ctx.beginPath(); ctx.roundRect(x - 28, y - 28, size + 56, size + 56, 36); ctx.fill();
  ctx.drawImage(img, x, y, size, size);
  y += size + 110;

  ctx.fillStyle = t.fg; ctx.font = `800 54px ${t.font}`; ctx.fillText(o.cta, W / 2, y);
  ctx.fillStyle = t.accent; ctx.font = `600 34px ${t.font}`;
  ctx.fillText(o.url.replace(/^https?:\/\//, "").slice(0, 48), W / 2, y + 60);
  ctx.fillStyle = t.muted; ctx.font = `500 30px ${t.font}`; ctx.fillText("Booked with BookSuite", W / 2, 1850);
}

const DEFAULT_SUB = "Book your next appointment in seconds";
const DEFAULT_CTA = "Scan or tap the link to book";

export default function SocialLaunchKit({ bookingUrl, name }: { bookingUrl: string; name: string }) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [theme, setTheme] = useState(THEMES[0]);
  const [hook, setHook] = useState(HOOKS[0]);
  const [title, setTitle] = useState(name);
  const [subtitle, setSubtitle] = useState(DEFAULT_SUB);
  const [cta, setCta] = useState(DEFAULT_CTA);
  const [dbServices, setDbServices] = useState<string[]>([]);
  const [services, setServices] = useState<string[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => { setTitle(name); }, [name]);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase.from("services").select("name").eq("user_id", u.user.id).limit(4);
      const list = (data ?? []).map((s: any) => s.name).filter(Boolean);
      setDbServices(list); setServices(list);
    })();
  }, []);

  useEffect(() => {
    if (canvasRef.current) drawStory(canvasRef.current, { theme, hook, name: title, subtitle, cta, services, url: bookingUrl }).catch(() => {});
  }, [theme, hook, title, subtitle, cta, services, bookingUrl]);

  const reset = () => { setHook(HOOKS[0]); setTitle(name); setSubtitle(DEFAULT_SUB); setCta(DEFAULT_CTA); setServices(dbServices); };
  const field = "w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs text-foreground";

  const download = () => {
    const a = document.createElement("a");
    a.href = canvasRef.current!.toDataURL("image/png"); a.download = "booking-story.png"; a.click();
  };

  const captions = [
    { key: "ig", label: "Instagram", text: `📅 You can now book with ${name} online! Pick your service, choose your time and you're done — no DMs needed. Link in bio 👆` },
    { key: "tt", label: "TikTok", text: `POV: booking with ${name} takes 20 seconds now ✨ Link in bio — grab your slot before they go!` },
    { key: "wa", label: "WhatsApp", text: `Hi! You can now book your appointments with ${name} online, any time: ${bookingUrl}` },
  ];
  const copy = async (key: string, text: string) => {
    try { await navigator.clipboard.writeText(text); setCopiedKey(key); setTimeout(() => setCopiedKey(null), 1600); } catch { /* noop */ }
  };

  return (
    <div className="mt-6 pt-5 border-t border-border space-y-4">
      <div>
        <div className="text-sm font-semibold text-foreground">Social launch kit</div>
        <p className="text-xs text-muted-foreground">A ready-made Instagram story showing your services, plus captions to announce online booking.</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-5">
        <canvas ref={canvasRef} aria-label="Story preview" className="w-[180px] h-[320px] rounded-xl border border-border shadow-md shrink-0 self-center sm:self-start" />
        <div className="space-y-4 flex-1">
          <div>
            <div className="text-xs font-semibold text-foreground mb-2">Style</div>
            <div className="flex flex-wrap gap-2">
              {THEMES.map((t) => (
                <Button key={t.key} size="sm" variant={theme.key === t.key ? "default" : "outline"} onClick={() => setTheme(t)}>{t.label}</Button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-foreground mb-2">Headline</div>
            <div className="flex flex-wrap gap-2">
              {HOOKS.map((h) => (
                <Button key={h} size="sm" variant={hook === h ? "default" : "outline"} onClick={() => setHook(h)}>{h}</Button>
              ))}
            </div>
            <input className={`${field} mt-2`} maxLength={34} value={hook} onChange={(e) => setHook(e.target.value)} placeholder="Write your own headline" aria-label="Headline text" />
          </div>
          <div className="grid gap-2">
            <div className="text-xs font-semibold text-foreground">Text on your story</div>
            <input className={field} maxLength={40} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Business name" aria-label="Business name text" />
            <input className={field} maxLength={50} value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Subtitle (leave empty to hide)" aria-label="Subtitle text" />
            <input className={field} maxLength={36} value={cta} onChange={(e) => setCta(e.target.value)} placeholder="Bottom message" aria-label="Bottom message text" />
          </div>
          <div className="grid gap-2">
            <div className="text-xs font-semibold text-foreground">Services shown (up to 4)</div>
            {services.map((s, i) => (
              <div key={i} className="flex gap-2">
                <input className={field} maxLength={30} value={s} onChange={(e) => setServices(services.map((x, j) => (j === i ? e.target.value : x)))} placeholder="e.g. Skin fade • £25" aria-label={`Service ${i + 1}`} />
                <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => setServices(services.filter((_, j) => j !== i))} aria-label="Remove service"><X className="h-3.5 w-3.5" /></Button>
              </div>
            ))}
            {services.length < 4 && <Button size="sm" variant="outline" className="gap-1.5 self-start" onClick={() => setServices([...services, ""])}><Plus className="h-3.5 w-3.5" /> Add a line</Button>}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" className="gap-1.5" onClick={download}><ImageDown className="h-3.5 w-3.5" /> Download story image</Button>
            <Button size="sm" variant="ghost" className="gap-1.5" onClick={reset}><RotateCcw className="h-3.5 w-3.5" /> Reset</Button>
          </div>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {captions.map((c) => (
          <div key={c.key} className="rounded-xl border border-border bg-secondary/30 p-3 flex flex-col gap-2">
            <div className="text-xs font-semibold text-foreground">{c.label}</div>
            <p className="text-xs text-muted-foreground flex-1">{c.text}</p>
            <Button variant="outline" size="sm" className="gap-1.5 self-start" onClick={() => copy(c.key, c.text)}>
              {copiedKey === c.key ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copiedKey === c.key ? "Copied" : "Copy"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
