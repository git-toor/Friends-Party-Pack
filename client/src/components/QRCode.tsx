import { useEffect, useRef } from 'react';

interface QRCodeProps {
  url: string;
  size?: number;
}

export function QRCode({ url, size = 128 }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const QRCode = (await import('qrcode')).default;
      if (!cancelled && canvasRef.current) {
        QRCode.toCanvas(canvasRef.current, url, { width: size, margin: 1, color: { dark: '#eee', light: '#1a1a2e' } });
      }
    })();
    return () => { cancelled = true; };
  }, [url, size]);

  return <canvas ref={canvasRef} style={{ borderRadius: 8 }} />;
}
