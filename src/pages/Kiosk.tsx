import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import CameraScanner from "@/components/CameraScanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, XCircle, ScanLine } from "lucide-react";

type Result =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "ok"; name: string; service: string; time: string }
  | { kind: "error"; message: string };

const Kiosk = () => {
  const { companyCode = "" } = useParams();
  const [businessName, setBusinessName] = useState<string>("");
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [result, setResult] = useState<Result>({ kind: "idle" });
  const [manual, setManual] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.rpc("lookup_business_by_code", { p_code: companyCode });
      const biz = data?.[0];
      if (!biz) { setEnabled(false); return; }
      setBusinessName(biz.business_name);
      const { data: bs } = await supabase
        .from("business_settings")
        .select("self_checkin_enabled")
        .eq("user_id", biz.user_id)
        .maybeSingle();
      setEnabled(!!bs?.self_checkin_enabled);
    })();
  }, [companyCode]);

  const tryCheckIn = async (raw: string) => {
    const code = raw.trim().toUpperCase().slice(-6);
    if (code.length !== 6) {
      setResult({ kind: "error", message: "Invalid code" });
      return;
    }
    setResult({ kind: "checking" });
    const { data, error } = await supabase.rpc("check_in_by_code", {
      p_company_code: companyCode,
      p_confirmation_code: code,
    });
    if (error || !data?.[0]) {
      setResult({ kind: "error", message: error?.message ?? "Booking not found" });
    } else {
      const r = data[0];
      setResult({ kind: "ok", name: r.client_name, service: r.service, time: r.booking_time.slice(0, 5) });
    }
    setTimeout(() => setResult({ kind: "idle" }), 6000);
  };

  if (enabled === null) {
    return <div className="min-h-screen grid place-items-center bg-background text-foreground">Loading…</div>;
  }
  if (!enabled) {
    return (
      <div className="min-h-screen grid place-items-center bg-background text-foreground p-6">
        <Card className="bg-card border-border max-w-md w-full">
          <CardContent className="p-6 text-center">
            <p className="text-foreground">Self check-in is not available here. Please see the receptionist.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6 grid place-items-center">
      <Card className="bg-card border-border w-full max-w-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <ScanLine className="text-primary" /> {businessName} — Check-In
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {result.kind === "ok" ? (
            <div className="text-center py-8 space-y-3">
              <CheckCircle2 className="mx-auto text-green-400" size={64} />
              <p className="text-xl font-semibold text-foreground">Welcome, {result.name}!</p>
              <p className="text-muted-foreground">{result.service} · {result.time}</p>
              <p className="text-sm text-muted-foreground">Please take a seat — a staff member will be with you shortly.</p>
            </div>
          ) : result.kind === "error" ? (
            <div className="text-center py-8 space-y-3">
              <XCircle className="mx-auto text-destructive" size={64} />
              <p className="text-foreground">{result.message}</p>
              <p className="text-sm text-muted-foreground">Please try again or see the receptionist.</p>
            </div>
          ) : (
            <>
              <CameraScanner onScan={tryCheckIn} />
              <div className="text-center text-sm text-muted-foreground">or enter your 6-character code</div>
              <div className="flex gap-2">
                <Input
                  value={manual}
                  onChange={(e) => setManual(e.target.value.toUpperCase())}
                  maxLength={6}
                  placeholder="ABC123"
                  className="bg-secondary border-border font-mono tracking-widest text-center text-lg uppercase"
                />
                <Button
                  onClick={() => tryCheckIn(manual)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={result.kind === "checking"}
                >
                  Check In
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Kiosk;
