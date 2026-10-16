import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Copy, Check, ImageDown } from "lucide-react";

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

async function drawStory(c: HTMLCanvasElement, o: { theme: Theme; hook: string; name: string; services: string[]; url: string }) {
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
  ctx.fillText("Book your next appointment in seconds", W / 2, y); y += 70;

  // service pills
  ctx.font = `700 38px ${t.font}`;
  const svc = o.services.slice(0, 4);
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

  ctx.fillStyle = t.fg; ctx.font = `800 54px ${t.font}`; ctx.fillText("Scan or tap the link to book", W / 2, y);
  ctx.fillStyle = t.accent; ctx.font = `600 34px ${t.font}`;
  ctx.fillText(o.url.replace(/^https?:\/\//, "").slice(0, 48), W / 2, y + 60);
  ctx.fillStyle = t.muted; ctx.font = `500 30px ${t.font}`; ctx.fillText("Booked with BookSuite", W / 2, 1850);
}

export default function SocialLaunchKit({ bookingUrl, name }: { bookingUrl: string; name: string }) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [theme, setTheme] = useState(THEMES[0]);
  const [hook, setHook] = useState(HOOKS[0]);
  const [services, setServices] = useState<string[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase.from("services").select("name").eq("user_id", u.user.id).limit(4);
      setServices((data ?? []).map((s: any) => s.name).filter(Boolean));
    })();
  }, []);

  useEffect(() => {
    if (canvasRef.current) drawStory(canvasRef.current, { theme, hook, name, services, url: bookingUrl }).catch(() => {});
  }, [theme, hook, name, services, bookingUrl]);

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
          </div>
          {services.length === 0 && <p className="text-xs text-muted-foreground">Add services and they'll appear on your story automatically.</p>}
          <Button size="sm" className="gap-1.5" onClick={download}><ImageDown className="h-3.5 w-3.5" /> Download story image</Button>
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
