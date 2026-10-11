'use client';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { WOOD_TEX } from './auth';
import type { Avatar } from './CharacterPanel';
import type { Outfit } from '../lib/types';
import { accOf, itemOf, nameOf, palOf } from '../lib/engine';
import type { PageCtx } from './World';

type Pal = [string, string, string];
const pal = palOf as (a: Avatar, k: string) => Pal;
const accent = accOf as (a: Avatar, k: string) => Pal | null;
const piece = itemOf as (a: Avatar, k: string) => { fx: string[] } | null;
const named = nameOf as (k: string, a: Avatar) => string;

/** What tapping the chair shows: the day's word, its high and low, and comfort through the day. */
export interface ChairDay { when: string; label: string; curve: number[]; startHour: number; hi: number; lo: number }

// The chair, drawn in snug's own pixels (snug is 46 wide, feet on row 56 of 58), seen from a little above and turned
// 30 degrees towards snug. P(a, b, h): a across the chair, b from its front to its back, h up from the ground.
const YAW = Math.PI / 6, CY = Math.cos(YAW), SY = Math.sin(YAW), SC = 1.15;
const W = 26, H = 40, OX = 7, OY = 37, A = 11, B = 10, HS = 13, BACK = 14;
const INK = '#1c1a28', WOODS = { light: '#c99a63', mid: '#a8743f', dark: '#7c5129' };
const SOLE = '#8f877a';
const P = (a: number, b: number, h: number): [number, number] => [OX + (a * CY - b * SY) * SC, OY - (a * SY + b * CY) * SC * 0.5 - h];

/** A little pixel grid: boxes in isometric, then an outline round everything, out to a data URL. */
class Grid {
  p: (string | null)[] = new Array(W * H).fill(null);
  px(x: number, y: number, c: string) { x = Math.floor(x); y = Math.floor(y); if (x >= 0 && y >= 0 && x < W && y < H) this.p[y * W + x] = c; }
  poly(pts: [number, number][], c: string) {
    const xs = pts.map(q => q[0]), ys = pts.map(q => q[1]);
    for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) for (let x = Math.floor(Math.min(...xs)); x <= Math.ceil(Math.max(...xs)); x++) {
      const cx = x + 0.5, cy = y + 0.5;
      let inside = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [xi, yi] = pts[i], [xj, yj] = pts[j];
        if ((yi > cy) !== (yj > cy) && cx < ((xj - xi) * (cy - yi)) / (yj - yi) + xi) inside = !inside;
      }
      if (inside) this.px(x, y, c);
    }
  }
  line([x0, y0]: [number, number], [x1, y1]: [number, number], c: string) {
    const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2) || 1;
    for (let i = 0; i <= n; i++) this.px(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, c);
  }
  /** A box from a0..a1, b0..b1, h0..h1: its top, its front (facing snug) and its side, with a dark edge along the bottom. */
  box(a0: number, a1: number, b0: number, b1: number, h0: number, h1: number, top: string, front: string, side: string, edge = false) {
    this.poly([P(a0, b0, h0), P(a0, b1, h0), P(a0, b1, h1), P(a0, b0, h1)], side);
    this.poly([P(a0, b0, h0), P(a1, b0, h0), P(a1, b0, h1), P(a0, b0, h1)], front);
    this.poly([P(a0, b0, h1), P(a1, b0, h1), P(a1, b1, h1), P(a0, b1, h1)], top);
    if (edge) { this.line(P(a0, b1, h0), P(a0, b0, h0), INK); this.line(P(a0, b0, h0), P(a1, b0, h0), INK); }
  }
  outline(c: string) {
    const n = [...this.p];
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      if (this.p[j * W + i]) continue;
      if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => { const x = i + a, y = j + b; return x >= 0 && y >= 0 && x < W && y < H && this.p[y * W + x]; })) n[j * W + i] = c;
    }
    this.p = n;
  }
  url() {
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d')!;
    this.p.forEach((c, i) => { if (c) { ctx.fillStyle = c; ctx.fillRect(i % W, Math.floor(i / W), 1, 1); } });
    return cv.toDataURL();
  }
}

/** The kinds on the chair, in the order the tags list them. */
const kindsOf = (o: Outfit) => [o.top, ...(o.outer !== 'none' ? [o.outer] : []), o.bottom, 'shoe', ...o.acc];

/** The chair, back to front so nearer things cover farther ones, with the outfit on it (or empty, once snug has taken
 * it): folded clothes stacked on the seat (bottoms first), shoes under it, beanie and shades on top, the scarf over the
 * back, the umbrella leaning on the front leg. Every piece in its own colours. */
function drawChair(o: Outfit | null, av: Avatar): string {
  const g = new Grid(), has = (a: string) => !!o && o.acc.includes(a as Outfit['acc'][number]);
  const wood = (a0: number, a1: number, b0: number, b1: number, h0: number, h1: number) => g.box(a0, a1, b0, b1, h0, h1, WOODS.light, WOODS.mid, WOODS.dark);
  const T = HS + BACK;

  wood(A - 1.5, A, B - 1.5, B, 0, T); // the far back post, down into its leg
  wood(1.5, A - 1.5, B - 1.2, B, T - 2.5, T); // top rail
  wood(1.5, A - 1.5, B - 1, B, T - 7, T - 5.8); // slats
  wood(1.5, A - 1.5, B - 1, B, HS + 3, HS + 4.2);
  if (has('scarf')) { // over the top rail, one end hanging down the back
    const [b, s, l] = pal(av, 'scarf');
    g.box(1, A - 1, B - 1.8, B + 0.3, T - 2.8, T + 0.6, l, b, s);
    g.box(6, 7.6, B - 1.8, B - 0.9, HS + 5, T - 2.8, b, b, s);
  }
  wood(0, 1.5, B - 1.5, B, 0, T); // the near back post
  wood(A - 1.5, A, 0, 1.5, 0, HS); // front legs: the far one
  if (o) { // shoes side by side under the seat (boots stand taller)
    const [b, s, l] = pal(av, 'shoe'), boot = (piece(av, 'shoe')?.fx ?? []).includes('boot');
    [[6, 8.6], [2.6, 5.2]].forEach(([a0, a1]) => {
      g.box(a0, a1, 2.5, 7, 0, 0.8, SOLE, SOLE, SOLE);
      g.box(a0, a1, 2.5, 7, 0.8, 2.2, l, b, s);
      if (boot) g.box(a0 + 0.3, a1 - 0.3, 4.5, 7, 2.2, 5, l, b, s);
    });
  }
  wood(0, A, 0, B, HS - 1.6, HS); // the seat
  wood(0, 1.5, 0, 1.5, 0, HS - 1.6); // and the near front leg

  if (o) {
    // folded clothes, each a flat stack with its own fold details
    let h = HS;
    [o.bottom, o.top, ...(o.outer !== 'none' ? [o.outer] : [])].forEach((k, i) => {
      const [b, s, l] = pal(av, k), a = accent(av, k), fx = piece(av, k)?.fx ?? [];
      const bottom = k === 'pants' || k === 'shorts', outer = i === 2, sh = i % 2 ? 0.6 : 0;
      const a0 = 1.6 + sh, a1 = (k === 'shorts' ? 8.4 : 9.4) + sh, b0 = 1.4, b1 = 8.6, th = outer ? 2.6 : 2.2;
      g.box(a0, a1, b0, b1, h, h + th, l, b, s, true);
      const mid = (a0 + a1) / 2;
      if (bottom) {
        g.line(P(mid, b0, h + th), P(mid, b1 - 1, h + th), s); // the crease between the legs
        g.line(P(a0, b0, h + th - 0.6), P(a1, b0, h + th - 0.6), s); // waistband
      } else {
        g.px(...P(mid, b0 + 1, h + th), s); g.px(...P(mid, b0 + 2, h + th), s); // the collar
        if (a && fx.some(f => ['stripes', 'rugby', 'ringer', 'block', 'raglan', 'armstripe', 'sidestripe', 'plaid'].includes(f))) g.line(P(a0, b0, h + th / 2), P(a1, b0, h + th / 2), a[0]);
        if (a && fx.some(f => f.startsWith('motif:') || f === 'letter')) { const [x, y] = P(mid, b0 + 4, h + th); g.px(x, y, a[0]); g.px(x + 1, y, a[0]); g.px(x, y + 1, a[0]); }
        if (outer && (k === 'hoodie' || k === 'rain')) g.box(mid - 2, mid + 2, b1 - 3, b1, h + th, h + th + 1.2, l, b, s, true); // a hood, folded back
      }
      h += th;
    });
    if (has('beanie')) {
      const [b, s, l] = pal(av, 'beanie'), fx = piece(av, 'beanie')?.fx ?? [];
      g.box(3.6, 7.6, 3, 7, h, h + 1.4, l, s, s, true);
      g.box(4.1, 7.1, 3.5, 6.5, h + 1.4, h + 3, l, b, s);
      if (fx.includes('pom')) g.px(...P(5.6, 5, h + 4), (accent(av, 'beanie') ?? [l])[0]);
      h += 3;
    }
    if (has('sunglasses')) {
      const [b] = pal(av, 'sunglasses'), [x, y] = P(5.4, 4, h + 0.5);
      [-3, -2, 1, 2].forEach(dx => g.px(x + dx, y, b)); g.px(x - 1, y - 1, b); g.px(x, y - 1, b);
    }
    if (has('umbrella')) { // closed, leaning on the far front leg
      const [b, s] = pal(av, 'umbrella'), tip = P(A + 2.2, -1.6, 0), top = P(A - 0.4, 0.6, HS + 4);
      const at = (t: number): [number, number] => [tip[0] + (top[0] - tip[0]) * t, tip[1] + (top[1] - tip[1]) * t];
      g.line(at(0), at(0.08), INK);
      for (let t = 0.08; t < 0.7; t += 0.02) { const [x, y] = at(t), w = t < 0.45 ? 1.5 : 1; g.px(x - w, y, b); g.px(x, y, s); g.px(x + w, y, b); }
      g.line(at(0.7), at(1), INK);
      const [hx, hy] = at(1); g.px(hx - 1, hy - 1, INK); g.px(hx - 2, hy, INK); // the crook
    }
  }
  g.outline(INK);
  return g.url();
}

const hh = (h: number) => `${h % 12 || 12}${h < 12 ? 'a' : 'p'}`;
// the comfort colours the app uses everywhere (miserable -> perfect)
const BAND = ['#dd6a58', '#e8954f', '#d9b23a', '#7fb556', '#3a9e74'];
const bandOf = (s: number) => (s >= 85 ? 4 : s >= 70 ? 3 : s >= 55 ? 2 : s >= 40 ? 1 : 0);
const FONT = "'Rethink Sans', sans-serif", SIGN_FG = '#fff6e2', SIGN_SH = '#3a1f0c', TAG = '#f6e8c6', TAG_INK = '#3b2a2a';
// a paper clothing tag: a notched end with a punched hole
const TAG_CP = 'polygon(7px 0,100% 0,100% 100%,7px 100%,0 50%)';
/** The tags laid out in rows that fit the sign, each remembering its place in the order (for its swing-in delay). */
const tagRows = (tags: string[], width: number) => {
  const rows: { t: string; n: number }[][] = [[]];
  let used = 0;
  tags.forEach((t, n) => {
    const w = t.length * 4.6 + 17 + 6; // text, the notch and padding, the gap
    if (used + w > width && rows[rows.length - 1].length) { rows.push([]); used = 0; }
    rows[rows.length - 1].push({ t, n }); used += w;
  });
  return rows;
};

/** The chair and its sign, drawn in whatever frame it's given: `left`/`top` place the chair; `head` is the top of snug's
 * head and `snugMid` the middle of snug, which the sign sits over; `pw` is how wide the frame is. */
function ChairBits({ left: chairLeft, top: chairTop, u, pw, head, snugMid, outfit, avatar, day, units, wind, open, setOpen, here, grab, grabbed, night }: {
  left: number; top: number; u: number; pw: number; head: number; snugMid: number; outfit: Outfit; avatar: Avatar; day?: ChairDay | null;
  units?: string; wind?: number; open: boolean; setOpen: (o: boolean) => void; here: boolean; grab?: boolean; grabbed: boolean; night?: boolean;
}) {
  const full = useMemo(() => drawChair(outfit, avatar), [outfit, avatar]);
  const empty = useMemo(() => drawChair(null, avatar), [avatar]);
  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => { if (!(e.target as Element)?.closest?.('[data-chair]')) setOpen(false); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open, setOpen]);
  const cw = W * u, ch = H * u;
  const T = (f: number) => `${Math.round(units === '°C' ? (f - 32) * 5 / 9 : f)}°`;
  // the sign: up over snug's head, centred between the chair and snug but kept on screen; its post comes down behind the chair
  const postX = chairLeft + P(A / 2, B, 0)[0] * u, SW = Math.min(272, pw - 16), sx = Math.max(8, Math.min(pw - SW - 8, (postX + snugMid) / 2 - SW / 2));
  const signBottom = Math.min(head, chairTop - 6), ground = chairTop + P(A / 2, B, 0)[1] * u;
  const rail = P(A / 2, B - 0.6, HS + BACK);
  const marks = day ? [0, 3, 6, 9, 11].filter(i => i < day.curve.length) : [];
  const tags = [...new Set(kindsOf(outfit))].map(k => named(k, avatar));
  return (
    // its own layer over the hours on the hill (which are drawn after it), so the chair takes taps where it is
    <div data-chair style={{ position: 'absolute', left: 0, top: 0, zIndex: 2 }}>
      <style>{`@keyframes snug-sign-up{0%{translate:0 40px;scale:1 .3;opacity:0}60%{translate:0 -6px;scale:1 1.04;opacity:1}100%{translate:0 0;scale:1 1}}
        @keyframes snug-bar{from{transform:scaleY(0)}to{transform:scaleY(1)}}
        @keyframes snug-fade{from{opacity:0;translate:0 4px}to{opacity:1;translate:0 0}}
        @keyframes snug-chair-in{from{opacity:0}to{opacity:1}}
        @keyframes snug-tag-sway{0%,100%{rotate:-5deg}50%{rotate:5deg}}
        @keyframes snug-tag-up{0%{rotate:80deg;opacity:0}12%{opacity:1}45%{rotate:-16deg}66%{rotate:8deg}84%{rotate:-3deg}100%{rotate:var(--r)}}
        @keyframes snug-sign-sway{0%,100%{rotate:calc(var(--sw) * -1)}50%{rotate:var(--sw)}}
        @keyframes snug-dirt{0%{translate:0 0;opacity:1}100%{translate:var(--dx) var(--dy);opacity:0}}
        @keyframes snug-bird{0%{translate:70px -60px;opacity:0}15%{opacity:1}70%{translate:0 -8px}85%{translate:0 1px}100%{translate:0 0}}
        @keyframes snug-peck{0%,80%,100%{rotate:0deg}86%{rotate:14deg}92%{rotate:0deg}}
        @keyframes snug-pop{0%{scale:.3;opacity:0}55%{scale:1.12;opacity:1}75%{scale:.95}100%{scale:1}}
        @keyframes snug-puff{0%{translate:0 0;scale:.4;opacity:.95}100%{translate:var(--dx) var(--dy);scale:1.5;opacity:0}}`}</style>
      {open && day && (
        <div style={{ position: 'absolute', left: 0, top: 0, zIndex: 1, pointerEvents: 'none' }}>
          {/* where the post goes into the ground: a little mound, tufts of grass, the sign's shadow, dirt kicked up */}
          <span aria-hidden style={{ position: 'absolute', left: postX - 26, top: ground - 5, width: 52, height: 10, borderRadius: '50%', background: 'rgba(20,18,40,0.18)' }} />
          {[-1, 1].map(d => (
            <svg key={d} viewBox="0 0 6 5" width={12} height={10} shapeRendering="crispEdges" aria-hidden style={{ position: 'absolute', left: postX + (d < 0 ? -15 : 4), top: ground - 9, zIndex: 1, transform: d < 0 ? 'scaleX(-1)' : undefined }}>
              <rect x="0" y="2" width="1" height="3" fill="#5f9a4a" /><rect x="2" y="0" width="1" height="5" fill="#7fb556" /><rect x="4" y="1" width="1" height="4" fill="#5f9a4a" /><rect x="1" y="4" width="5" height="1" fill="#4a7d3a" />
            </svg>
          ))}
          {[[-18, -22], [-10, -30], [-3, -26], [6, -28], [12, -20], [17, -25]].map(([dx, dy], n) => (
            <span key={n} aria-hidden style={{ position: 'absolute', left: postX, top: ground - 2, width: 3, height: 3, background: n % 2 ? '#8a5c30' : '#a8743f', ['--dx' as string]: `${dx}px`, ['--dy' as string]: `${dy}px`, animation: `snug-dirt .55s ${n * 0.02}s cubic-bezier(.2,.7,.4,1) both` }} />
          ))}
          {/* the post */}
          <div aria-hidden style={{ position: 'absolute', left: postX - 4, top: signBottom - 12, width: 8, height: ground - signBottom + 10, zIndex: -1, background: '#7c5129', boxShadow: 'inset 2px 0 0 #9a6a3a, inset -2px 0 0 #5e3c20', transformOrigin: 'bottom', animation: 'snug-sign-up .45s cubic-bezier(.2,.8,.2,1) both' }} />
          <div style={{ position: 'absolute', left: sx, top: signBottom, transform: 'translateY(-100%)', width: SW, pointerEvents: 'auto', transformOrigin: `${postX - sx}px 100%`, animation: 'snug-sign-up .45s cubic-bezier(.2,.8,.2,1) both' }}>
            {/* it sways a little in the wind */}
            <div style={{ transformOrigin: `${postX - sx}px 100%`, ['--sw' as string]: `${Math.max(0.4, Math.min(2.5, (wind ?? 5) / 10))}deg`, animation: 'snug-sign-sway 3.4s .5s ease-in-out infinite' }}>
            <div style={{ position: 'relative', padding: 4, background: '#4a2e16', transform: 'rotate(-1.5deg)', boxShadow: '0 8px 16px rgba(20,10,4,0.3)' }}>
              {/* a little bird drops in and sits on the top edge */}
              <svg viewBox="0 0 9 7" width={30} height={23} shapeRendering="crispEdges" aria-hidden style={{ position: 'absolute', right: 22, top: -21, animation: 'snug-bird 1.1s .9s cubic-bezier(.3,.6,.4,1) both, snug-peck 2.8s 2.2s ease-in-out infinite' }}>
                <rect x="1" y="2" width="6" height="4" fill={INK} /><rect x="2" y="1" width="3" height="1" fill={INK} /><rect x="7" y="2" width="2" height="1" fill="#e8954f" />
                <rect x="2" y="2" width="4" height="3" fill="#8a5c3a" /><rect x="3" y="4" width="3" height="1" fill="#f2dcb4" /><rect x="5" y="2" width="1" height="1" fill={INK} /><rect x="0" y="3" width="2" height="1" fill="#6b4423" />
                <rect x="3" y="6" width="1" height="1" fill="#e8954f" /><rect x="5" y="6" width="1" height="1" fill="#e8954f" />
              </svg>
              {/* nails in the corners */}
              {[[3, 3], [null, 3], [3, null], [null, null]].map(([l, t], n) => (
                <span key={n} aria-hidden style={{ position: 'absolute', zIndex: 1, width: 4, height: 4, background: '#2b211a', boxShadow: 'inset 1px 1px 0 #8a7a6a', ...(l == null ? { right: 9 } : { left: 9 }), ...(t == null ? { bottom: 9 } : { top: 9 }) }} />
              ))}
              <div style={{ padding: '6px 12px 8px', background: WOOD_TEX, color: SIGN_FG, fontFamily: FONT, textAlign: 'center', textShadow: `0 2px 0 ${SIGN_SH}` }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, lineHeight: 1 }}>{day.when.toUpperCase()}</div>
                <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.15 }}>{day.label.toLowerCase()}</div>
                {/* a little thermometer: the day's high and low */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 2, fontSize: 14, fontWeight: 800 }}>
                  <svg viewBox="0 0 7 16" width={10} height={22} shapeRendering="crispEdges" aria-hidden style={{ filter: `drop-shadow(0 2px 0 ${SIGN_SH})` }}>
                    <rect x="2" y="0" width="3" height="11" fill={INK} /><rect x="3" y="1" width="1" height="10" fill={TAG} />
                    <rect x="1" y="10" width="5" height="5" fill={INK} /><rect x="2" y="11" width="3" height="3" fill="#dd6a58" /><rect x="3" y="4" width="1" height="7" fill="#dd6a58" />
                  </svg>
                  <span style={{ color: '#ffd2a8' }}>{T(day.hi)}</span><span style={{ opacity: 0.6 }}>/</span><span style={{ color: '#cfe4ff' }}>{T(day.lo)}</span>
                </div>
                {/* comfort through the day, on a cream card held on with two clothespins; the bars grow in one by one */}
                <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 4, marginTop: 9, padding: '7px 6px 2px', background: TAG, boxShadow: `0 2px 0 ${SIGN_SH}`, textShadow: 'none', color: TAG_INK, rotate: '0.8deg' }}>
                  {['18%', '82%'].map(x => (
                    <svg key={x} viewBox="0 0 4 9" width={8} height={18} shapeRendering="crispEdges" aria-hidden style={{ position: 'absolute', left: x, top: -9, translate: '-50% 0', filter: `drop-shadow(0 1px 0 ${SIGN_SH})` }}>
                      <rect x="0" y="0" width="4" height="9" fill={INK} /><rect x="1" y="1" width="1" height="7" fill="#d9b483" /><rect x="2" y="1" width="1" height="7" fill="#b88f5c" /><rect x="0" y="4" width="4" height="1" fill="#9aa0a8" />
                    </svg>
                  ))}
                  {marks.map((i, n) => {
                    const v = day.curve[i], delay = `${0.35 + n * 0.12}s`;
                    return (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, lineHeight: 1.1, animation: `snug-fade .3s ${delay} both` }}>{v}</span>
                        <span style={{ width: 12, height: 3 + Math.round(v / 100 * 18), background: BAND[bandOf(v)], boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.18)', transformOrigin: 'bottom', animation: `snug-bar .4s cubic-bezier(.2,.8,.2,1.2) ${delay} both` }} />
                        <span style={{ fontSize: 10.5, fontWeight: 700, lineHeight: 1.3, opacity: 0.7 }}>{hh((day.startHour + i) % 24)}</span>
                      </div>
                    );
                  })}
                </div>
                {/* a tag for each piece, hung on a line of twine: each drops in hanging and swings up level */}
                {tagRows(tags, SW - 24).map((row, r) => (
                  <div key={r} style={{ position: 'relative', display: 'flex', justifyContent: 'center', gap: 6, marginTop: r ? 4 : 8, paddingTop: 5, textShadow: 'none' }}>
                    <span aria-hidden style={{ position: 'absolute', left: 4, right: 4, top: 1, height: 1, background: '#d8c29a', boxShadow: '0 1px 0 rgba(58,31,12,0.5)' }} />
                    {row.map(({ t, n }) => (
                      <span key={t} style={{ position: 'relative', ['--r' as string]: `${n % 2 ? 3 : -4}deg`, transformOrigin: '5px 50%', animation: `snug-tag-up .9s ${1 + n * 0.08}s cubic-bezier(.3,.7,.4,1) both` }}>
                        <span aria-hidden style={{ position: 'absolute', left: 5, top: -5, width: 1, height: 9, background: '#d8c29a' }} />
                        <span style={{ position: 'relative', display: 'block', padding: '2px 6px 2px 11px', background: TAG, color: TAG_INK, fontSize: 10.5, fontWeight: 800, lineHeight: 1.3, clipPath: TAG_CP, whiteSpace: 'nowrap' }}>
                          <span aria-hidden style={{ position: 'absolute', left: 4, top: 'calc(50% - 1.5px)', width: 3, height: 3, borderRadius: '50%', background: '#a8743f' }} />
                          {t}
                        </span>
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            </div>
          </div>
        </div>
      )}
      <button onClick={() => day && setOpen(!open)} aria-label={day ? `${day.when}'s outfit: ${tags.join(', ')}` : 'the outfit on the chair'}
        style={{ position: 'absolute', left: chairLeft, top: chairTop, width: cw, height: ch, zIndex: 2, padding: 0, background: 'none', cursor: day ? 'pointer' : 'default',
          transformOrigin: '50% 100%', animation: grab ? 'snug-chair-in .5s both' : here ? 'snug-pop .45s cubic-bezier(.3,1.4,.5,1) both' : undefined,
          visibility: grab || here ? 'visible' : 'hidden', transition: 'opacity .6s .7s', opacity: grabbed ? 0 : 1 }}>
        {/* the puff it arrives in: little clouds bursting out from the seat, and a few sparkles */}
        {here && !grab && [[-26, -18], [-18, -34], [0, -40], [18, -34], [26, -16], [-30, 2], [30, 4], [0, 10]].map(([dx, dy], n) => (
          <span key={n} aria-hidden style={{ position: 'absolute', left: '50%', top: '55%', width: n % 3 ? 14 : 18, height: n % 3 ? 12 : 15, marginLeft: -8, marginTop: -7, background: n > 5 ? '#fff6c8' : '#ffffff', boxShadow: n > 5 ? 'none' : 'inset -2px -2px 0 #dfe3ee', clipPath: 'polygon(25% 0,75% 0,75% 15%,100% 15%,100% 85%,75% 85%,75% 100%,25% 100%,25% 85%,0 85%,0 15%,25% 15%)', ['--dx' as string]: `${dx * u / 3.4}px`, ['--dy' as string]: `${dy * u / 3.4}px`, animation: `snug-puff .6s ${n * 0.015}s cubic-bezier(.2,.7,.4,1) both`, pointerEvents: 'none', zIndex: 1 }} />
        ))}
        <span aria-hidden style={{ position: 'absolute', left: (P(A / 2, B / 2, 0)[0] - 10) * u, top: (P(A / 2, B / 2, 0)[1] - 4) * u, width: 20 * u, height: 8 * u, borderRadius: '50%', background: 'rgba(20,18,40,0.18)' }} />
        {/* after dark a little lantern on the grass beside it lights tomorrow's things, so they glow warm in the night instead of sitting there in daylight colours */}
        {night && (
          <>
            <span aria-hidden style={{ position: 'absolute', left: -cw * 0.45, top: ch * 0.05, width: cw * 1.9, height: ch * 1.15, background: 'radial-gradient(closest-side at 62% 72%, rgba(255,210,130,0.42), rgba(255,190,110,0.16) 55%, rgba(255,190,110,0) 100%)', pointerEvents: 'none' }} />
            <svg viewBox="0 0 5 8" width={5 * u * 0.8} height={8 * u * 0.8} shapeRendering="crispEdges" aria-hidden style={{ position: 'absolute', left: cw + u * 0.5, bottom: u * 1.5, zIndex: 1, filter: 'drop-shadow(0 0 4px rgba(255,214,140,0.9))', pointerEvents: 'none' }}>
              {['  h  ', ' hhh ', 'hglgh', 'hglgh', 'hgggh', 'hhhhh', ' h h ', '     '].flatMap((row, y) => [...row].map((c, x) => (c === ' ' ? null : <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={c === 'h' ? '#3a2a1a' : c === 'l' ? '#fff6c8' : '#ffc85a'} />)))}
            </svg>
          </>
        )}
        <img src={grabbed ? empty : full} alt="" style={{ position: 'absolute', inset: 0, width: cw, height: ch, imageRendering: 'pixelated', filter: night ? 'brightness(.86) saturate(.9) sepia(.12)' : undefined }} />
        {/* a paper tag hanging off the top rail: whose day these clothes are for */}
        {day && !grabbed && (
          <span style={{ position: 'absolute', left: rail[0] * u, top: rail[1] * u, translate: '-50% 0', transformOrigin: '50% 0', animation: 'snug-tag-sway 3.2s ease-in-out infinite', display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none' }}>
            <span aria-hidden style={{ width: 1, height: 1.5 * u, background: '#5e3c20' }} />
            <span style={{ position: 'relative', padding: '1px 5px 1px 9px', background: TAG, color: TAG_INK, fontFamily: FONT, fontSize: 9.5, fontWeight: 800, lineHeight: 1.3, clipPath: TAG_CP, boxShadow: '0 1px 0 rgba(0,0,0,0.2)', whiteSpace: 'nowrap' }}>
              <span aria-hidden style={{ position: 'absolute', left: 4, top: 'calc(50% - 1.5px)', width: 3, height: 3, borderRadius: '50%', background: '#a8743f' }} />
              {day.when}
            </span>
          </span>
        )}
      </button>
    </div>
  );
}

/** Snug's pixel size and where its head, middle and feet are, read off its sprite in the scene. */
function useSnug() {
  const [av, setAv] = useState<HTMLElement | null>(null);
  const [box, setBox] = useState<{ u: number; pw: number; head: number; mid: number; avLeft: number; feet: number } | null>(null);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const el = document.querySelector<HTMLElement>('[data-rv="av"]');
      setAv(prev => (prev === el ? prev : el));
      if (!el || !el.offsetParent || !el.offsetWidth) return;
      // where the scene put snug (its style), not where it is this instant (its walking bounce would jiggle the chair)
      const top = parseFloat(el.style.top) || el.offsetTop, avLeft = parseFloat(el.style.left) || el.offsetLeft;
      const u = el.offsetWidth / 46, pw = el.parentElement?.clientWidth ?? 0, head = Math.round(top + 2 * u), mid = Math.round(avLeft + 23 * u), feet = Math.round(top + 56.5 * u);
      setBox(b => (b && b.u === u && b.pw === pw && b.head === head && b.mid === mid && b.avLeft === avLeft && b.feet === feet ? b : { u, pw, head, mid, avLeft, feet }));
    };
    tick();
    const loop = () => { tick(); if (!document.querySelector('[data-rv="av"]')) raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    const iv = setInterval(tick, 400);
    return () => { cancelAnimationFrame(raf); clearInterval(iv); };
  }, []);
  return { av, box };
}

/** Whether snug has poofed into the scene yet (and true from then on). */
export function usePoofed() {
  const [here, setHere] = useState(() => typeof document !== 'undefined' && !!document.querySelector('[data-poofed]'));
  useEffect(() => {
    if (here) return;
    const poof = () => setHere(true);
    document.addEventListener('snug-poof', poof);
    const late = setTimeout(poof, 9000); // never left waiting on a reveal that already happened
    return () => { document.removeEventListener('snug-poof', poof); clearTimeout(late); };
  }, [here]);
  return here;
}

// a little back from snug's feet, so the chair sits a touch higher (further away)
const chairTopAt = (feet: number, u: number) => Math.round(feet + 5.5 * u - (OY + 0.5) * u);

/**
 * A little wooden chair standing just left of snug (computers, and the morning on phones), turned towards it, with the
 * next day's outfit folded on it and a paper tag saying whose day it's for. It poofs in with snug. Tap it and a sign
 * comes up out of the ground beside it: the day's word, its high and low, how comfortable it'll be through the day, and
 * a tag for each piece on the chair.
 * With `grab`, snug takes the pile when it poofs into the day's outfit, and the chair goes away.
 */
export default function Chair({ outfit, avatar, day, units, wind, grab, onGrabbed, night }: { outfit: Outfit; avatar: Avatar; day?: ChairDay | null; units?: string; wind?: number; grab?: boolean; onGrabbed?: () => void; night?: boolean }) {
  const { av, box } = useSnug();
  const here = usePoofed();
  const [open, setOpen] = useState(false);
  const [grabbed, setGrabbed] = useState(false);
  const [gone, setGone] = useState(false);
  // the morning: snug grabs the pile as it poofs into the day's clothes; then the empty chair goes
  useEffect(() => {
    if (!grab) return;
    const take = () => setGrabbed(true);
    document.addEventListener('snug-poof', take);
    return () => document.removeEventListener('snug-poof', take);
  }, [grab]);
  useEffect(() => {
    if (!grabbed) return;
    const t = setTimeout(() => { setGone(true); onGrabbed?.(); }, 1400);
    return () => clearTimeout(t);
  }, [grabbed, onGrabbed]);
  if (!av?.parentElement || !box || gone) return null;
  const { u } = box;
  return createPortal(
    <ChairBits left={Math.max(2, Math.round(box.avLeft - 6 * u - W * u))} top={chairTopAt(box.feet, u)} u={u} pw={box.pw} head={box.head} snugMid={box.mid}
      outfit={outfit} avatar={avatar} day={day} units={units} wind={wind} open={open} setOpen={setOpen} here={here} grab={grab} grabbed={grabbed} night={night} />,
    av.parentElement,
  );
}

// on its own page (phones): the chair a little in from the left, snug standing just right of it
const pageChairAt = (c: PageCtx) => Math.round(c.pw * 0.1);
/** Where snug stands on the chair's page (its sprite's left edge). */
export const chairSnugAt = (c: PageCtx) => pageChairAt(c) + Math.round((W + 1 - 11) * c.u);

/** The chair on its own page in snug's world: when snug walks over, the sign comes up. */
export function ChairPage({ ctx, outfit, avatar, day, units, wind, night }: { ctx: PageCtx; outfit: Outfit; avatar: Avatar; day: ChairDay; units?: string; wind?: number; night?: boolean }) {
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(ctx.arrived); }, [ctx.arrived]);
  const { u } = ctx;
  return (
    <ChairBits left={pageChairAt(ctx)} top={chairTopAt(ctx.ground, u)} u={u} pw={ctx.pw} head={ctx.head} snugMid={chairSnugAt(ctx) + 23 * u}
      outfit={outfit} avatar={avatar} day={day} units={units} wind={wind} open={open} setOpen={setOpen} here grabbed={false} night={night} />
  );
}
