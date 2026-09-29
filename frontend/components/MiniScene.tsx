'use client';
import { useEffect, useRef } from 'react';
import { drawScene } from '../lib/engine';

/** A small live copy of snug's world (same renderer as the main scene), for the adjust-my-preferences cards. */
export default function MiniScene({ cond, precip, int, wind, clouds, seed, height = 140 }: { cond: string; precip: string; int: number; wind: number; clouds: number; seed: number; height?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const px = 3;
    const draw = () => {
      const W = cv.parentElement?.clientWidth || 240, H = height;
      const bw = Math.ceil(W / px), bh = Math.ceil(H / px);
      if (cv.width !== bw || cv.height !== bh) { cv.width = bw; cv.height = bh; cv.style.width = bw * px + 'px'; cv.style.height = bh * px + 'px'; }
      const ctx = cv.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(1 / px, 0, 0, 1 / px, 0, 0);
      try {
        (drawScene as (...a: unknown[]) => void)(ctx, W, H, cond, performance.now() / 1000, Math.round(H * 0.62), seed, wind, false, px,
          { precip, int: String(int), clouds: String(clouds), storm: '0' });
      } catch (e) { console.error(e); }
    };
    draw();
    const iv = setInterval(draw, 66);
    return () => clearInterval(iv);
  }, [cond, precip, int, wind, clouds, seed, height]);
  return <div style={{ position: 'relative', height, overflow: 'hidden' }}><canvas ref={ref} style={{ display: 'block', imageRendering: 'pixelated' }} /></div>;
}
