'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { Outfit } from '../lib/types';
import { sprite } from '../lib/engine';

const standing = sprite as (o: Outfit, mood: string, pose: string) => string;
const FONT = "'Rethink Sans', sans-serif", SIGN_FG = '#fff6e2', SIGN_SH = '#3a1f0c';

/** Where things are on a page, in that page's own coordinates (its left edge is 0). */
export interface PageCtx {
  u: number; // one of snug's sprite pixels, in px
  pw: number; ph: number; // the page
  head: number; // the top of snug's head
  ground: number; // where snug's feet meet the ground
  arrived: boolean; // snug has walked over and is standing here
  /** Draw snug as something else while it's here (trying a piece on, say); null for its usual standing self. */
  setSnug: (src: string | null) => void;
}
/** A place further along the world: what its arrow says, where snug stands there (its sprite's left edge), and what's there. */
export interface WorldPage { key: string; label: string; snugAt: (c: PageCtx) => number; render: (c: PageCtx) => ReactNode }

const WALK = 1.1;

/** Things a page shows on top of everything, snug included (a tag someone's reading), in the page's own coordinates.
 * Only for while snug is standing on that page, when the page fills the screen. */
export function OnTop({ children }: { children: ReactNode }) {
  const [hero, setHero] = useState<Element | null>(null);
  useEffect(() => { setHero(document.querySelector('[data-rv="av"]')?.parentElement ?? null); }, []);
  return hero ? createPortal(<div style={{ position: 'absolute', left: 0, top: 0, zIndex: 10 }}>{children}</div>, hero) : null;
}
// a copy of the first page's scene for page k: mirrored every other page so each seam meets its twin edge; no picnic,
// no big tree, and the sun is the first page's, seen from over there
const sceneFor = (k: number) => ({ act: '', tree: '', sunpage: String(k), sunmirror: k % 2 ? '1' : '' }); // no big tree: mirrored at the seam it read as two halves

/** A little pixel-art wooden arrow sign (chunky 3px pixels, stepped point) with a word on it. */
export function ArrowSign({ text, dir }: { text: string; dir: 'left' | 'right' }) {
  const PX = 3, bw = Math.ceil((text.length * 7.4 + 14) / PX), tip = 4, h = 9, w = bw + tip;
  const rows = Array.from({ length: h }, (_, y) => tip - Math.abs(y - (h - 1) / 2) * (tip / ((h - 1) / 2)));
  return (
    <span style={{ position: 'relative', display: 'block', width: w * PX, height: h * PX, filter: `drop-shadow(0 ${PX}px 0 rgba(58,31,12,0.45))` }}>
      <svg viewBox={`-1 -1 ${w + 2} ${h + 2}`} width={(w + 2) * PX} height={(h + 2) * PX} shapeRendering="crispEdges" aria-hidden
        style={{ position: 'absolute', left: -PX, top: -PX, transform: dir === 'left' ? 'scaleX(-1)' : undefined }}>
        {/* the dark edge first, one pixel out all round, then the plank and its stepped point over it */}
        <rect x={-1} y={-1} width={bw + 1} height={h + 2} fill={SIGN_SH} />
        {rows.map((k, y) => <rect key={'o' + y} x={bw} y={y - 1} width={Math.round(k) + 1} height={3} fill={SIGN_SH} />)}
        <rect x={0} y={0} width={bw} height={h} fill="#a8743f" />
        {rows.map((k, y) => <rect key={'t' + y} x={bw} y={y} width={Math.round(k)} height={1} fill={y < h / 2 ? '#b07a44' : '#9a6a3a'} />)}
        <rect x={0} y={0} width={bw} height={1} fill="#c99a63" /><rect x={0} y={h - 1} width={bw} height={1} fill="#8a5c30" />
        <rect x={3} y={3} width={Math.max(2, bw - 9)} height={1} fill="#9a6a3a" /><rect x={6} y={6} width={Math.max(2, bw - 12)} height={1} fill="#9a6a3a" />
        <rect x={1} y={1} width={1} height={1} fill="#5e3c20" /><rect x={1} y={h - 2} width={1} height={1} fill="#5e3c20" />
      </svg>
      <span style={{ position: 'absolute', top: 0, bottom: 0, left: dir === 'left' ? tip * PX : 0, width: bw * PX, display: 'flex', alignItems: 'center', justifyContent: 'center', color: SIGN_FG, fontFamily: FONT, fontSize: 13, fontWeight: 800, textShadow: `0 2px 0 ${SIGN_SH}`, whiteSpace: 'nowrap' }}>{text}</span>
    </span>
  );
}

/**
 * snug's world past the first screen: more places off to the right, each one screen wide. Swipe (or tap the arrow
 * signs, or use the arrow keys) and the whole scene pans across while snug gets up and walks over with it; it stands
 * there until you come back, when it walks home and goes back to what it was doing.
 * The places' skies and hills are copies of the first screen's, joined so the seams don't show.
 */
export default function World({ pages, today, ready, driveFrom, onDrive, jump, onHome }: {
  pages: WorldPage[]; today?: Outfit; ready: boolean;
  /** from this page on, the way further is by car: its sign says "head out" and calls onDrive(page) instead of walking on */
  driveFrom?: number; onDrive?: (from: number) => void;
  /** be on this page now, no walk (the car dropping snug off, while the screen's black); a new key each time */
  jump?: { page: number; key: number } | null;
  /** back from a place snug drove to: straight home (the page fades it), not a walk back along the street */
  onHome?: () => void;
}) {
  const [av, setAv] = useState<HTMLElement | null>(null);
  const [box, setBox] = useState<{ u: number; pw: number; ph: number; head: number; ground: number; avLeft: number } | null>(null);
  const [page, setPage] = useState(0);
  const [arrived, setArrived] = useState(0); // the page snug has walked to and is standing on
  const [override, setOverride] = useState<string | null>(null);
  const scenes = useRef<(HTMLCanvasElement | null)[]>([]);
  const shown = useRef(0), sitting = useRef<string | null>(null); // the page last walked to; snug's own sprite while it's away
  const walk = useRef<ReturnType<typeof setTimeout> | undefined>(undefined); // arriving: outlives layout updates mid-walk
  const keep = useRef<MutationObserver | null>(null); // what keeps snug standing while it's away
  const n = pages.length, go = (p: number) => setPage(Math.max(0, Math.min(n, p)));
  const instant = useRef(false); // the next page change is a jump, not a walk
  const [snap, setSnap] = useState(false); // ...so nothing slides across either
  useEffect(() => { if (!jump) return; instant.current = true; setSnap(true); setPage(Math.max(0, Math.min(n, jump.page))); }, [jump?.key]); // eslint-disable-line react-hooks/exhaustive-deps
  const drives = (k: number) => !!onDrive && driveFrom != null && k >= driveFrom;

  // measure the scene and snug, and keep the extra pages' skies matching the first's weather
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const el = document.querySelector<HTMLElement>('[data-rv="av"]');
      setAv(prev => (prev === el ? prev : el));
      const hero = el?.parentElement;
      if (!el || !hero || !el.offsetWidth) return;
      // where the scene put snug (its style), not where it is this instant: its walking bounce would jiggle everything measured off it
      const top = parseFloat(el.style.top) || el.offsetTop, avLeft = parseFloat(el.style.left) || el.offsetLeft;
      const u = el.offsetWidth / 46, pw = hero.clientWidth, ph = hero.clientHeight, head = Math.round(top + 2 * u), ground = Math.round(top + 56.5 * u);
      setBox(b => (b && b.u === u && b.pw === pw && b.ph === ph && b.head === head && b.ground === ground && b.avLeft === avLeft ? b : { u, pw, ph, head, ground, avLeft }));
      const main = hero.querySelector<HTMLCanvasElement>('canvas[data-scene]:not([data-page])');
      if (main) scenes.current.forEach((cv, i) => { if (cv) Object.assign(cv.dataset, main.dataset, sceneFor(i + 1)); });
    };
    tick();
    const loop = () => { tick(); if (!document.querySelector('[data-rv="av"]')) raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    const iv = setInterval(tick, 400);
    return () => { cancelAnimationFrame(raf); clearInterval(iv); clearTimeout(walk.current); };
  }, []);

  const ctxFor = (k: number): PageCtx | null => box && { u: box.u, pw: box.pw, ph: box.ph, head: box.head, ground: box.ground, arrived: arrived === k && page === k, setSnug: setOverride };
  const target = page && box ? pages[page - 1]?.snugAt(ctxFor(page)!) : 0;

  // pan the world to the page while snug walks with it, standing up for the walk; back home the same way
  useEffect(() => {
    const hero = av?.parentElement;
    if (!hero || !av || !box) return;
    const sh = hero.querySelector<HTMLElement>('[data-rv="sh"]');
    const tr = instant.current ? 'none' : `translate ${WALK}s cubic-bezier(.45,0,.3,1)`;
    [...hero.children].forEach(el => {
      const e = el as HTMLElement;
      e.style.transition = tr;
      if (e === av || e === sh) { e.style.zIndex = '3'; e.style.translate = page ? `${target - box.avLeft}px 0` : '0 0'; }
      else e.style.translate = `${-page * box.pw}px 0`;
    });
    if (page === shown.current) { instant.current = false; return; } // just keeping up with the layout, no walk
    shown.current = page;
    if (instant.current) {
      // dropped off: already there, standing (or, home, back to what it was doing); the walking transition back next frame
      instant.current = false;
      clearTimeout(walk.current); setOverride(null);
      av.style.animation = av.dataset.rest || '';
      if (page) { if (today) { sitting.current ??= av.getAttribute('src'); av.setAttribute('src', standing(today, 'happy', 'stand')); } }
      else { keep.current?.disconnect(); keep.current = null; if (sitting.current) { av.setAttribute('src', sitting.current); sitting.current = null; } }
      setArrived(page);
      requestAnimationFrame(() => requestAnimationFrame(() => setSnap(false)));
      return;
    }
    setArrived(-1); setOverride(null);
    if (today) { sitting.current ??= av.getAttribute('src'); av.setAttribute('src', standing(today, 'happy', 'stand')); }
    av.style.animation = `snug-waddle .32s ease-in-out ${Math.round(WALK / 0.32)}`;
    clearTimeout(walk.current);
    walk.current = setTimeout(() => {
      av.style.animation = av.dataset.rest || ''; // back to whatever snug does standing still (jamming, say)
      setArrived(page);
      // home: back to what it was doing (stop keeping it standing first, or that would undo this)
      if (!page) { keep.current?.disconnect(); keep.current = null; if (sitting.current) { av.setAttribute('src', sitting.current); sitting.current = null; } }
    }, WALK * 1000);
  }, [page, av, box, target, today]);

  // while it's away (and on the walk home), snug stays as the page wants it (standing, or trying something on) even if
  // the scene redraws it; whatever it was redrawn as meanwhile (with anything it walked out of a shop in) is what it
  // goes back to at home
  const away = page !== 0 || arrived === -1;
  useEffect(() => {
    if (!away || !av || !today) return;
    const want = page ? override ?? standing(today, 'happy', 'stand') : standing(today, 'happy', 'stand');
    if (av.getAttribute('src') !== want) av.setAttribute('src', want);
    const mo = new MutationObserver(() => { const cur = av.getAttribute('src'); if (cur && cur !== want) { sitting.current = cur; av.setAttribute('src', want); } });
    mo.observe(av, { attributes: true, attributeFilter: ['src'] });
    keep.current = mo;
    return () => { mo.disconnect(); if (keep.current === mo) keep.current = null; };
  }, [away, page, av, today, override]);

  // leaving: put the world (and snug) back where they were
  useEffect(() => () => {
    const hero = av?.parentElement;
    if (hero) [...hero.children].forEach(el => { const e = el as HTMLElement; e.style.translate = ''; e.style.transition = ''; e.style.zIndex = ''; });
    if (av) { av.style.animation = av.dataset.rest || ''; if (sitting.current) av.setAttribute('src', sitting.current); }
  }, [av]);

  // swipe left to go further, right to come back; the arrow keys too
  useEffect(() => {
    const hero = av?.parentElement;
    if (!ready || !hero || !n) return;
    let x0 = 0, y0 = 0;
    const start = (e: TouchEvent) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; };
    const end = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) setPage(p => Math.max(0, Math.min(n, p + (dx < 0 ? 1 : -1))));
    };
    const key = (e: KeyboardEvent) => {
      if ((e.target as Element)?.closest?.('input,textarea,[role="dialog"]')) return;
      if (e.key === 'ArrowRight') setPage(p => Math.min(n, p + 1));
      else if (e.key === 'ArrowLeft') setPage(p => Math.max(0, p - 1));
    };
    hero.addEventListener('touchstart', start, { passive: true });
    hero.addEventListener('touchend', end, { passive: true });
    window.addEventListener('keydown', key);
    return () => { hero.removeEventListener('touchstart', start); hero.removeEventListener('touchend', end); window.removeEventListener('keydown', key); };
  }, [ready, av, n]);

  if (!av?.parentElement || !box || !n) return null;
  const { pw, ph } = box, arrowTop = box.head - 56;
  const back = (k: number) => (k <= 1 ? 'today' : pages[k - 2].label);

  return createPortal(
    <>
    {/* the first arrow lives in its own layer above everything in the scene (the hours on the hill take taps there too),
        panning with the world */}
    {ready && (
      <button onClick={() => (drives(0) ? onDrive!(0) : go(1))} aria-label={drives(0) ? 'head out' : pages[0].label} style={{ position: 'absolute', right: 10, top: arrowTop, zIndex: 20, translate: `${-page * pw}px 0`, transition: snap ? 'none' : `translate ${WALK}s cubic-bezier(.45,0,.3,1)` }}>
        <span style={{ display: 'block', animation: 'snug-pop .45s cubic-bezier(.3,1.4,.5,1) both, snug-nudge-x 1.8s .5s ease-in-out infinite' }}><ArrowSign text={drives(0) ? 'head out' : pages[0].label} dir="right" /></span>
      </button>
    )}
    <div data-world>
      <style>{`@keyframes snug-waddle{0%,100%{rotate:0deg;margin-top:0}25%{rotate:-4deg;margin-top:-4px}50%{rotate:0deg;margin-top:0}75%{rotate:4deg;margin-top:-4px}}
        @keyframes snug-nudge-x{0%,100%{translate:0 0}50%{translate:4px 0}}
        @keyframes snug-pop{0%{scale:.3;opacity:0}55%{scale:1.12;opacity:1}75%{scale:.95}100%{scale:1}}`}</style>
      {pages.map((pg, i) => {
        const k = i + 1, c = ctxFor(k)!;
        return (
          // each page tucks a few pixels over the one before, so the scene's ragged last column never shows at a seam
          <div key={pg.key} style={{ position: 'absolute', left: k * pw - 4, top: 0, width: pw + 4, height: ph, zIndex: 0 }}>
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
              <div style={{ position: 'absolute', left: k % 2 ? -8 : 0, top: 0, width: 'calc(100% + 8px)', height: '100%' }}>
                <canvas ref={el => { scenes.current[i] = el; }} data-scene="1" data-page={k} style={{ position: 'absolute', left: 0, top: 0, display: 'block', imageRendering: 'pixelated', transform: k % 2 ? 'scaleX(-1)' : undefined }} />
              </div>
            </div>
            <div style={{ position: 'absolute', left: 4, top: 0, width: pw, height: ph }}>
              {pg.render(c)}
              {(drives(k) || k < n) && (
                <button onClick={() => (drives(k) ? onDrive!(k) : go(k + 1))} aria-label={drives(k) ? 'head out' : pages[k].label} style={{ position: 'absolute', right: 10, top: arrowTop, zIndex: 3, animation: 'snug-nudge-x 1.8s ease-in-out infinite' }}>
                  <ArrowSign text={drives(k) ? 'head out' : pages[k].label} dir="right" />
                </button>
              )}
              {onHome && driveFrom != null && k > driveFrom ? (
                <button onClick={onHome} aria-label="back home" style={{ position: 'absolute', left: 10, top: box.ground + 30, zIndex: 3 }}>
                  <ArrowSign text="home" dir="left" />
                </button>
              ) : (
                <button onClick={() => go(k - 1)} aria-label={`back to ${back(k)}`} style={{ position: 'absolute', left: 10, top: box.ground + 30, zIndex: 3 }}>
                  <ArrowSign text={back(k)} dir="left" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
    </>,
    av.parentElement,
  );
}
