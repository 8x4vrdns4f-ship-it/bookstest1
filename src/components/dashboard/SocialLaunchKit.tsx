import { useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Copy, Check, ImageDown } from "lucide-react";

/** Reads an HSL design token (e.g. "--primary") and returns a canvas-usable colour. */
const token = (name: string, fallback: string) => {
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v ? `hsl(${v})` : fallback;
  } catch { return fallback; }
};

export default function SocialLaunchKit({ bookingUrl, name }: { bookingUrl: string; name: string }) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const captions = [
    { key: "ig", label: "Instagram", text: `📅 You can now book with ${name} online! Pick your service, choose your time and you're done — no DMs needed. Link in bio 👆` },
    { key: "tt", label: "TikTok", text: `POV: booking with ${name} takes 20 seconds now 💈 Link in bio — grab your slot before they go!` },
    { key: "wa", label: "WhatsApp", text: `Hi! You can now book your appointments with ${name} online, any time: ${bookingUrl}` },
  ];

  const copy = async (key: string, text: string) => {
    try { await navigator.clipboard.writeText(text); setCopiedKey(key); setTimeout(() => setCopiedKey(null), 1600); } catch { /* noop */ }
  };

  const makeStory = async () => {
    setBusy(true);
    try {
      const W = 1080, H = 1920;
      const c = document.createElement("canvas");
      c.width = W; c.height = H;
      const ctx = c.getContext("2d")!;
      const bg = token("--background", "#0F172A");
      const primary = token("--primary", "#60A5FA");
      const fg = token("--foreground", "#F8FAFC");
      const muted = token("--muted-foreground", "#94A3B8");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      const g = ctx.createRadialGradient(W / 2, 500, 50, W / 2, 500, 900);
      g.addColorStop(0, primary); g.addColorStop(1, bg);
      ctx.globalAlpha = 0.35; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;

      ctx.textAlign = "center";
      ctx.fillStyle = primary; ctx.font = "700 44px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText("NOW TAKING BOOKINGS ONLINE", W / 2, 360);
      ctx.fillStyle = fg; ctx.font = "800 96px 'Plus Jakarta Sans', sans-serif";
      // wrap business name
      const words = name.split(" "); const lines: string[] = []; let line = "";
      for (const w of words) { const t = line ? `${line} ${w}` : w; if (ctx.measureText(t).width > W - 160 && line) { lines.push(line); line = w; } else line = t; }
      lines.push(line);
      lines.slice(0, 3).forEach((l, i) => ctx.fillText(l, W / 2, 500 + i * 110));

      const qr = await QRCode.toDataURL(bookingUrl, { width: 640, margin: 2, color: { dark: "#0F172A", light: "#FFFFFF" } });
      const img = new Image();
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = qr; });
      const size = 600, x = (W - size) / 2, y = 860;
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath(); (ctx as any).roundRect?.(x - 30, y - 30, size + 60, size + 60, 40); ctx.fill();
      ctx.drawImage(img, x, y, size, size);

      ctx.fillStyle = fg; ctx.font = "700 56px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText("Scan or tap the link to book", W / 2, 1640);
      ctx.fillStyle = muted; ctx.font = "500 34px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText("Booked with BookSuite", W / 2, 1820);

      const a = document.createElement("a");
      a.href = c.toDataURL("image/png");
      a.download = "booking-story.png";
      a.click();
    } finally { setBusy(false); }
  };

  return (
    <div className="mt-6 pt-5 border-t border-border space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-foreground">Social launch kit</div>
          <p className="text-xs text-muted-foreground">A ready-made Instagram story image and captions to announce online booking.</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={makeStory} disabled={busy}>
          <ImageDown className="h-3.5 w-3.5" /> {busy ? "Making…" : "Download story image"}
        </Button>
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
