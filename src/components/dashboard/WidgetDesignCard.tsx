import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Brush, Lock, Upload, X, Loader2, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import SectionCard from "@/components/app/SectionCard";
import { buildWidgetHtml, type WidgetTheme } from "@/lib/widgetTemplate";
import { getStripeEnvironment } from "@/lib/connectPayments";

const FONTS = ["Plus Jakarta Sans", "Inter", "Poppins", "Playfair Display", "Lora", "Montserrat", "DM Sans", "Space Grotesk"];
const DEFAULT: WidgetTheme = { accent: "#5BADE8", bg: "#0F1420", text: "#F3F4F6", font: "Plus Jakarta Sans", radius: "rounded", logo: null };
const PRESETS: { name: string; accent: string; bg: string; text: string }[] = [
  { name: "Dark", accent: "#5BADE8", bg: "#0F1420", text: "#F3F4F6" },
  { name: "Light", accent: "#2563EB", bg: "#FFFFFF", text: "#111827" },
  { name: "Warm", accent: "#C2410C", bg: "#FFF7ED", text: "#431407" },
  { name: "Forest", accent: "#4ADE80", bg: "#0F1F17", text: "#ECFDF5" },
  { name: "Mono", accent: "#111111", bg: "#F5F5F5", text: "#111111" },
];
const HEX = /^#[0-9a-fA-F]{6}$/;

/** Resize an uploaded logo to max 320px and return a compact data URL. */
async function resizeLogo(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url;
    });
    const scale = Math.min(1, 320 / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(img.width * scale));
    c.height = Math.max(1, Math.round(img.height * scale));
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
}

const ColorField = ({ label, value, onChange, disabled }: { label: string; value: string; onChange: (v: string) => void; disabled: boolean }) => (
  <div className="space-y-1.5">
    <Label className="text-sm">{label}</Label>
    <div className="flex items-center gap-2">
      <input type="color" aria-label={label} value={HEX.test(value) ? value : "#000000"} onChange={(e) => onChange(e.target.value.toUpperCase())}
        disabled={disabled} className="h-10 w-12 rounded cursor-pointer bg-secondary border border-border disabled:opacity-50 disabled:cursor-not-allowed" />
      <Input value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} maxLength={7} className="bg-secondary border-border font-mono" />
    </div>
  </div>
);

const WidgetDesignCard = ({ userId, canBrand }: { userId: string; canBrand: boolean }) => {
  const { toast } = useToast();
  const [theme, setTheme] = useState<WidgetTheme>(DEFAULT);
  const [saved, setSaved] = useState<WidgetTheme>(DEFAULT);
  const [previewTheme, setPreviewTheme] = useState<WidgetTheme>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.from("business_settings")
      .select("accent_color, widget_bg_color, widget_text_color, widget_font, widget_radius, widget_logo_url")
      .eq("user_id", userId).maybeSingle()
      .then(({ data }) => {
        if (data) {
          const t: WidgetTheme = {
            accent: HEX.test(data.accent_color) ? data.accent_color.toUpperCase() : DEFAULT.accent,
            bg: data.widget_bg_color, text: data.widget_text_color, font: data.widget_font,
            radius: data.widget_radius as WidgetTheme["radius"], logo: data.widget_logo_url,
          };
          setTheme(t); setSaved(t); setPreviewTheme(t);
        }
        setLoading(false);
      });
  }, [userId]);

  // Debounce preview so the iframe doesn't reload on every keystroke.
  useEffect(() => {
    if (!HEX.test(theme.accent) || !HEX.test(theme.bg) || !HEX.test(theme.text)) return;
    const t = setTimeout(() => setPreviewTheme(theme), 350);
    return () => clearTimeout(t);
  }, [theme]);

  const html = useMemo(() => buildWidgetHtml({
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    supabaseKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    userId,
    paymentEnvironment: getStripeEnvironment(),
    stripePublishableKey: String(import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN || ""),
    previewTheme,
  }), [userId, previewTheme]);

  const dirty = JSON.stringify(theme) !== JSON.stringify(saved);
  const set = (patch: Partial<WidgetTheme>) => setTheme((t) => ({ ...t, ...patch }));

  const onLogo = async (file?: File) => {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp", "image/svg+xml"].includes(file.type)) {
      toast({ title: "Use a PNG, JPG, WebP or SVG image", variant: "destructive" }); return;
    }
    if (file.size > 2 * 1024 * 1024) { toast({ title: "Logo must be under 2 MB", variant: "destructive" }); return; }
    try { set({ logo: await resizeLogo(file) }); }
    catch { toast({ title: "Couldn't read that image", variant: "destructive" }); }
  };

  const save = async () => {
    if (![theme.accent, theme.bg, theme.text].every((c) => HEX.test(c))) {
      toast({ title: "Colours must look like #1A2B3C", variant: "destructive" }); return;
    }
    setSaving(true);
    const { error } = await supabase.from("business_settings").update({
      accent_color: theme.accent.toUpperCase(), widget_bg_color: theme.bg.toUpperCase(), widget_text_color: theme.text.toUpperCase(),
      widget_font: theme.font, widget_radius: theme.radius, widget_logo_url: theme.logo,
    }).eq("user_id", userId);
    setSaving(false);
    if (error) { toast({ title: "Save failed", description: error.message, variant: "destructive" }); return; }
    setSaved(theme);
    toast({ title: "Widget design saved", description: "Your booking page and embedded widgets now use this look." });
  };

  const off = !canBrand;

  return (
    <SectionCard>
      <AccordionItem value="widget-design" className="border-0">
        <AccordionTrigger className="hover:no-underline py-2">
          <span className="flex items-center gap-3 min-w-0">
            <span className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary"><Brush size={20} /></span>
            <span className="text-base font-semibold text-foreground leading-tight">Widget design</span>
            {dirty && <span className="text-xs font-medium text-primary">Unsaved changes</span>}
          </span>
        </AccordionTrigger>
        <AccordionContent className="pb-5">
          {loading ? (
            <div className="py-8 text-center text-muted-foreground text-sm">Loading…</div>
          ) : (
            <div className="space-y-5">
              {off && (
                <div className="flex items-center justify-between gap-3 bg-secondary/60 border border-border rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Lock size={14} className="text-primary" /> Custom widget design is a Gold &amp; Platinum feature.
                  </div>
                  <Button asChild size="sm"><Link to="/pricing">Upgrade</Link></Button>
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                Make the booking widget look like your brand. After you save, your booking page and any widget already on your website update automatically.
              </p>

              <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,420px)]">
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-sm">Logo</Label>
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-28 rounded-lg border border-border bg-secondary flex items-center justify-center overflow-hidden">
                        {theme.logo ? <img src={theme.logo} alt="Your logo" className="max-h-12 max-w-24 object-contain" /> : <span className="text-xs text-muted-foreground">No logo</span>}
                      </div>
                      <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden"
                        onChange={(e) => { onLogo(e.target.files?.[0]); e.target.value = ""; }} />
                      <Button type="button" variant="outline" size="sm" disabled={off} onClick={() => fileRef.current?.click()}>
                        <Upload size={14} className="mr-1.5" /> Upload
                      </Button>
                      {theme.logo && (
                        <Button type="button" variant="ghost" size="sm" disabled={off} onClick={() => set({ logo: null })}>
                          <X size={14} className="mr-1" /> Remove
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">PNG, JPG, WebP or SVG, up to 2 MB.</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Starting theme</Label>
                    <div className="flex flex-wrap gap-2">
                      {PRESETS.map((p) => (
                        <button key={p.name} type="button" disabled={off} onClick={() => set({ accent: p.accent, bg: p.bg, text: p.text })}
                          className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-2 text-sm hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed">
                          <span className="flex -space-x-1">
                            {[p.bg, p.accent, p.text].map((c) => <span key={c} className="h-4 w-4 rounded-full border border-border" style={{ background: c }} />)}
                          </span>
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <ColorField label="Accent" value={theme.accent} onChange={(v) => set({ accent: v })} disabled={off} />
                    <ColorField label="Background" value={theme.bg} onChange={(v) => set({ bg: v })} disabled={off} />
                    <ColorField label="Text" value={theme.text} onChange={(v) => set({ text: v })} disabled={off} />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-sm">Font</Label>
                      <Select value={theme.font} onValueChange={(v) => set({ font: v })} disabled={off}>
                        <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                        <SelectContent>{FONTS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm">Corners</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {(["sharp", "rounded", "pill"] as const).map((r) => (
                          <Button key={r} type="button" size="sm" disabled={off} variant={theme.radius === r ? "default" : "outline"}
                            onClick={() => set({ radius: r })} className="capitalize">{r}</Button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button onClick={save} disabled={off || saving || !dirty}>
                      {saving && <Loader2 size={14} className="mr-1.5 animate-spin" />} Save widget design
                    </Button>
                    <Button type="button" variant="outline" disabled={off} onClick={() => setTheme(DEFAULT)}>
                      <RotateCcw size={14} className="mr-1.5" /> Reset to default
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Live preview</Label>
                  <div className="rounded-xl border border-border bg-secondary/40 p-2">
                    <iframe title="Widget preview" srcDoc={html} className="w-full rounded-lg" style={{ height: 640, border: "none", background: "transparent" }} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
    </SectionCard>
  );
};

export default WidgetDesignCard;
