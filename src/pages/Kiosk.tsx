import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import CameraScanner from "@/components/CameraScanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, XCircle, ScanLine } from "lucide-react";

const GENERIC_FAILURE = "We couldn't check you in — please see reception.";

type Result =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "ok"; name: string; service: string; time: string; already: boolean }
  | { kind: "error" };

const Kiosk = () => {
  const { companyCode = "" } = useParams();
  const [searchParams] = useSearchParams();
  const [businessName, setBusinessName] = useState<string>("");
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [result, setResult] = useState<Result>({ kind: "idle" });
  const [manual, setManual] = useState(() =>
    (searchParams.get("code") || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(-6),
  );

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.functions.invoke("kiosk-check-in", {
        body: { action: "status", companyCode },
      });
      if (error || !data?.enabled) { setEnabled(false); return; }
      setBusinessName(data.businessName || "");
      setEnabled(true);
    })();
  }, [companyCode]);

  const tryCheckIn = async (raw: string) => {
    const code = raw.trim().toUpperCase().slice(-6);
    if (code.length !== 6) {
      setResult({ kind: "error" });
      setTimeout(() => setResult({ kind: "idle" }), 6000);
      return;
    }
    setResult({ kind: "checking" });
    const { data, error } = await supabase.functions.invoke("kiosk-check-in", {
      body: { action: "check_in", companyCode, code: raw },
    });
    if (error || !data?.ok) {
      setResult({ kind: "error" });
    } else {
      setResult({ kind: "ok", name: data.firstName, service: data.service, time: data.time, already: !!data.alreadyCheckedIn });
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
              <CheckCircle2 className="mx-auto text-primary" size={64} />
              <p className="text-xl font-semibold text-foreground">Welcome, {result.name}!</p>
              <p className="text-muted-foreground">{result.service} · {result.time}</p>
              {result.already && <p className="text-sm text-muted-foreground">You're already checked in.</p>}
              <p className="text-sm text-muted-foreground">Please take a seat — a staff member will be with you shortly.</p>
            </div>
          ) : result.kind === "error" ? (
            <div className="text-center py-8 space-y-3">
              <XCircle className="mx-auto text-destructive" size={64} />
              <p className="text-foreground">{GENERIC_FAILURE}</p>
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
