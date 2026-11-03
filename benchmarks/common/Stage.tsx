import { useEffect, useState } from 'react';

const NativeDate = Date;
const frozen = NativeDate.parse("2026-11-02T12:00:00Z");
class BenchmarkDate extends NativeDate {
  constructor(...args: any[]) { super(...(args.length ? args : [frozen]) as [any]); }
  static now() { return frozen; }
}
window.Date = BenchmarkDate as DateConstructor;

export const inStage = new URLSearchParams(location.search).has('frame');
export function environmentErrors() {
  return [
    innerWidth !== 1280 || innerHeight !== 900 ? `Unexpected viewport ${innerWidth}×${innerHeight}` : null,
    document.visibilityState !== 'visible' ? 'Browser is not visible' : null,
    !navigator.serviceWorker.controller ? 'Local asset worker is not ready' : null,
  ].filter(Boolean);
}

export function Stage() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const resize = () => setScale(Math.min(1, innerWidth / 1280, Math.max(200, innerHeight - 110) / 900));
    resize();
    addEventListener('resize', resize);
    void (async () => {
      await navigator.serviceWorker.register('/benchmark-sw.js');
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller) await new Promise<void>(resolve => navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true }));
      const image = new Image(); image.src = '/image.svg'; await image.decode();
      setReady(true);
    })().catch(e => setError(String(e)));
    return () => removeEventListener('resize', resize);
  }, []);
  return <>
    {error && <p role="alert">{error}</p>}
    {!ready && !error && <p>Preparing fixed viewport and local assets…</p>}
    {ready && <div style={{ width: 1280 * scale, height: 900 * scale, margin: 'auto' }}>
      <iframe title="Measured app · 1280 by 900" src="/?frame=1" style={{ width: 1280, height: 900, border: 0, transform: `scale(${scale})`, transformOrigin: 'top left' }} />
    </div>}
  </>;
}
