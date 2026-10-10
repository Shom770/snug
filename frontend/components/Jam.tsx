'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

// pixel notes: a single eighth note and a beamed pair, as rows of a little grid (# = filled)
const ONE = ['  ##', '  # #', '  #', '  #', '###', '###'], TWO = [' #####', ' #   #', ' #   #', ' #   #', '##  ##', '##  ##'];
const NOTES = [ONE, TWO, ONE, TWO];

/**
 * snug, headphones on, on a nice day: bobbing to the beat, little notes drifting up from its headphones. Follows snug
 * wherever it is (across the street too), and rests while it walks.
 */
export default function Jam() {
  const [hero, setHero] = useState<HTMLElement | null>(null);
  const [at, setAt] = useState<{ x: number; y: number; u: number } | null>(null);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const av = document.querySelector<HTMLElement>('[data-rv="av"]'), h = av?.parentElement ?? null;
      setHero(prev => (prev === h ? prev : h));
      if (av && h && av.offsetWidth) {
        // the bob: what snug does standing still while this is on (the walk takes over while it walks, then hands back)
        const bob = 'snug-jam .52s ease-in-out infinite';
        if (av.dataset.rest !== bob) av.dataset.rest = bob;
        if (!av.style.animation) av.style.animation = bob;
        const a = av.getBoundingClientRect(), b = h.getBoundingClientRect(), u = av.offsetWidth / 46;
        const x = a.left - b.left + 30 * u, y = a.top - b.top + 8 * u;
        setAt(p => (p && Math.abs(p.x - x) < 0.5 && Math.abs(p.y - y) < 0.5 && p.u === u ? p : { x, y, u }));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      const av = document.querySelector<HTMLElement>('[data-rv="av"]');
      if (av) { if (av.style.animation.includes('snug-jam')) av.style.animation = ''; delete av.dataset.rest; }
    };
  }, []);
  if (!hero || !at) return null;
  return createPortal(
    <div aria-hidden style={{ position: 'absolute', left: at.x, top: at.y, zIndex: 5, pointerEvents: 'none' }}>
      <style>{`@keyframes snug-jam{0%,100%{rotate:-3deg;margin-top:0}25%{margin-top:-3px}50%{rotate:3deg;margin-top:0}75%{margin-top:-3px}}
        @keyframes snug-note{0%{opacity:0;translate:0 0;rotate:-10deg}15%{opacity:1}100%{opacity:0;translate:var(--dx) -46px;rotate:12deg}}`}</style>
      {NOTES.map((rows, i) => (
        <svg key={i} viewBox="-1 -1 8 8" width={8 * Math.max(2, at.u * 0.8)} height={8 * Math.max(2, at.u * 0.8)} shapeRendering="crispEdges"
          style={{ position: 'absolute', left: 0, top: 0, ['--dx' as string]: `${(i % 2 ? 1 : -0.4) * (12 + i * 4)}px`, animation: `snug-note 2.1s ${i * 0.52}s ease-out infinite`, filter: 'drop-shadow(1px 1px 0 #3a1f0c)' }}>
          {rows.flatMap((row, y) => [...row].map((ch, x) => (ch === '#' ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="#fff6e2" /> : null)))}
        </svg>
      ))}
    </div>,
    hero,
  );
}
