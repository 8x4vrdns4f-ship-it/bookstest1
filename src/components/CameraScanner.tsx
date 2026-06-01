import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

type Props = {
  onScan: (text: string) => void;
  onError?: (err: string) => void;
};

const CameraScanner = ({ onScan, onError }: Props) => {
  const elId = useRef(`scanner-${Math.random().toString(36).slice(2, 9)}`);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    let stopped = false;
    const start = async () => {
      try {
        const scanner = new Html5Qrcode(elId.current);
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (text) => {
            if (stopped) return;
            stopped = true;
            scanner.stop().catch(() => {});
            onScan(text);
          },
          () => {}
        );
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        onError?.(msg);
      }
    };
    start();
    return () => {
      stopped = true;
      const s = scannerRef.current;
      if (s && s.isScanning) s.stop().catch(() => {});
    };
  }, [onScan, onError]);

  return <div id={elId.current} className="w-full max-w-sm mx-auto rounded-lg overflow-hidden bg-black" />;
};

export default CameraScanner;
