'use client';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { Avatar } from './CharacterPanel';
import type { Place } from './LocationSearch';
import { api } from './auth';
import { OnTop, type PageCtx } from './World';
import type { Outfit } from '../lib/types';
import { avOf, COLORS, HAIRC, HAIRS, itemSprite, nameOf, SKINS, sprite, STYLES } from '../lib/engine';

/** One day of a trip, as GET /trip sends it. */
interface TripDay { date: string; hi: number; lo: number; feelsHi: number; feelsLo: number; condition: string; rain: number; snow: number; pop: number; sun: number; outfit: Outfit; typical: boolean }
interface Trip { place: string; days: TripDay[] }
type Dest = Place & { cc?: string | null };

const icon = itemSprite as (kind: string, av: Avatar) => string;
const dressed = avOf as (av: Avatar) => { worn: Record<string, { id?: string; s?: string; c?: string } | undefined> };
const named = nameOf as (kind: string, av: unknown) => string;
const FONT = "'Rethink Sans', sans-serif", PIXEL = "'Pixelify Sans', 'Rethink Sans', sans-serif";
const BOARD = '#121212', TILE = '#232323', TILE_D = '#1a1a1a', YELLOW = '#f5d90a', FLAP_FG = '#f4f1e8';
const INK = '#1f1b2e', PAPER = '#fbf6ec', NAVY = '#23314f', MUTED = 'rgba(31,27,46,0.55)';
const CP = (n: number) => `polygon(0 ${n}px,${n}px ${n}px,${n}px 0,calc(100% - ${n}px) 0,calc(100% - ${n}px) ${n}px,100% ${n}px,100% calc(100% - ${n}px),calc(100% - ${n}px) calc(100% - ${n}px),calc(100% - ${n}px) 100%,${n}px 100%,${n}px calc(100% - ${n}px),0 calc(100% - ${n}px))`;
const N = 14; // letters across the board

// ---------- places ----------

// airport codes people know, for the boarding pass; anywhere else gets one made from its name
const IATA: Record<string, string> = {
  'new york': 'JFK', 'los angeles': 'LAX', chicago: 'ORD', 'san francisco': 'SFO', seattle: 'SEA', boston: 'BOS', philadelphia: 'PHL', washington: 'DCA',
  miami: 'MIA', atlanta: 'ATL', dallas: 'DFW', houston: 'IAH', denver: 'DEN', austin: 'AUS', nashville: 'BNA', 'new orleans': 'MSY', 'las vegas': 'LAS',
  phoenix: 'PHX', portland: 'PDX', 'san diego': 'SAN', honolulu: 'HNL', orlando: 'MCO', toronto: 'YYZ', vancouver: 'YVR', montreal: 'YUL',
  'mexico city': 'MEX', cancun: 'CUN', london: 'LHR', paris: 'CDG', rome: 'FCO', milan: 'MXP', madrid: 'MAD', barcelona: 'BCN', lisbon: 'LIS',
  amsterdam: 'AMS', berlin: 'BER', munich: 'MUC', vienna: 'VIE', zurich: 'ZRH', copenhagen: 'CPH', stockholm: 'ARN', oslo: 'OSL', reykjavik: 'KEF',
  dublin: 'DUB', edinburgh: 'EDI', athens: 'ATH', istanbul: 'IST', dubai: 'DXB', cairo: 'CAI', marrakesh: 'RAK', marrakech: 'RAK', 'cape town': 'CPT',
  nairobi: 'NBO', mumbai: 'BOM', delhi: 'DEL', 'new delhi': 'DEL', bangkok: 'BKK', singapore: 'SIN', 'hong kong': 'HKG', taipei: 'TPE', seoul: 'ICN',
  tokyo: 'HND', osaka: 'KIX', beijing: 'PEK', shanghai: 'PVG', bali: 'DPS', denpasar: 'DPS', sydney: 'SYD', melbourne: 'MEL', auckland: 'AKL',
  'rio de janeiro': 'GIG', 'sao paulo': 'GRU', 'buenos aires': 'EZE', lima: 'LIM', bogota: 'BOG', havana: 'HAV',
};
const plain = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
const cityOf = (p: { name: string }) => p.name.split(',')[0].trim();
function codeOf(p: { name: string }): string {
  const c = plain(cityOf(p)).toLowerCase();
  if (IATA[c]) return IATA[c];
  const L = c.toUpperCase().replace(/[^A-Z]/g, ''), rest = [...L.slice(1)].filter(ch => !'AEIOU'.includes(ch));
  return (L[0] + rest.join('') + L.slice(1)).slice(0, 3).padEnd(3, 'X');
}
/** "OR" for Portland, OR; the country code anywhere else. */
const regionOf = (p: Dest) => { const r = p.name.split(',')[1]?.trim() ?? ''; return /^[A-Z]{2}$/.test(r) ? r : (p.cc ?? '').toUpperCase(); };
const flagOf = (cc?: string | null) => (cc && /^[a-z]{2}$/i.test(cc) ? String.fromCodePoint(...[...cc.toUpperCase()].map(ch => 127397 + ch.charCodeAt(0))) : '');

// on the board before anyone types: places people go, flipping round every few seconds (tap one to go)
const AWAY: Dest[] = [
  ['Tokyo, Japan', 35.68, 139.69, 'JP'], ['Paris, France', 48.86, 2.35, 'FR'], ['Seoul, South Korea', 37.57, 126.98, 'KR'], ['Mexico City, Mexico', 19.43, -99.13, 'MX'],
  ['London, United Kingdom', 51.51, -0.13, 'GB'], ['Lisbon, Portugal', 38.72, -9.14, 'PT'], ['Reykjavik, Iceland', 64.15, -21.94, 'IS'], ['Bali, Indonesia', -8.65, 115.22, 'ID'],
  ['Rome, Italy', 41.9, 12.5, 'IT'], ['Sydney, Australia', -33.87, 151.21, 'AU'], ['Marrakech, Morocco', 31.63, -8.01, 'MA'], ['New York, NY', 40.71, -74.01, 'US'],
  ['Copenhagen, Denmark', 55.68, 12.57, 'DK'], ['Honolulu, HI', 21.31, -157.86, 'US'], ['Cape Town, South Africa', -33.92, 18.42, 'ZA'], ['Taipei, Taiwan', 25.03, 121.57, 'TW'],
].map(([name, lat, lon, cc]) => ({ name, lat, lon, cc }) as Dest);

// ---------- dates ----------

const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'], WD = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const dayNo = (d: string) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10)) / 86400000;
const dateOf = (n: number) => new Date(n * 86400000).toISOString().slice(0, 10);
const wdOf = (d: string) => new Date(dayNo(d) * 86400000).getUTCDay();
const monOf = (d: string) => MON[+d.slice(5, 7) - 1];
const localToday = () => { const t = new Date(); return dateOf(Math.floor((t.getTime() - t.getTimezoneOffset() * 60000) / 86400000)); };
const span = (a: string, b: string) => (a.slice(5, 7) === b.slice(5, 7) ? `${+a.slice(8)}-${+b.slice(8)} ${monOf(b)}` : `${+a.slice(8)} ${monOf(a)}-${+b.slice(8)} ${monOf(b)}`);
/** A torn paper edge as a clip-path: ragged along the top (the pass) or the bottom (the scrap left in the slot). */
const torn = (top: boolean) => { const n = 34, pts = Array.from({ length: n + 1 }, (_, i) => `${(i / n * 100).toFixed(2)}% ${top ? (i % 2 ? 5 : 1 + (i % 3)) : `calc(100% - ${i % 2 ? 5 : 1 + (i % 3)}px)`}${top ? 'px' : ''}`);
  return top ? `polygon(${pts.join(',')},100% 100%,0 100%)` : `polygon(0 0,100% 0,${pts.reverse().join(',')})`; };
/** A barcode's bars, [x, width] across 75: bars and gaps one to three wide. */
const bars = (seed: string) => { const out: [number, number][] = []; let x = 0, r = hash(seed) || 1, bar = true;
  while (x < 75) { r = (r * 1103515245 + 12345) >>> 0; const w = 1 + ((r >>> 16) % 3); if (bar) out.push([x, Math.min(w, 75 - x)]); x += w; bar = !bar; }
  return out; };
const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

// ---------- packing ----------

interface Packed { key: string; kind: string; name: string; src: string; n: number }
const BOTTOMS = new Set(['shorts', 'pants']), TOPS = new Set(['tank', 'tee', 'long', 'sweater']);
/** What goes in snug's suitcase: each day's outfit from their own closet (dressed the way it'd dress them that day),
 * a top a day, a pair of bottoms every two days, one of everything else; and whatever extras they've chosen to wear. */
function pack(days: TripDay[], avatar: Avatar): Packed[] {
  const out = new Map<string, Packed & { days: number }>();
  days.forEach(d => {
    const o = d.outfit, av = { ...avatar, day: dayNo(d.date), wet: !!o.boots, extras: {}, wearing: {} } as Avatar, A = dressed(av);
    [o.top, o.outer !== 'none' ? o.outer : null, o.bottom, 'shoe', ...o.acc].forEach(k => {
      if (!k) return;
      const p = A.worn[k], key = `${k}:${p?.id ?? p?.s ?? ''}:${p?.c ?? ''}`, had = out.get(key);
      if (had) { had.days++; return; }
      out.set(key, { key, kind: k, name: named(k, A), src: icon(k, { ...av, wardrobe: p ? { [k]: [p] } : {} } as Avatar), n: 1, days: 1 });
    });
  });
  Object.entries((avatar as { extras?: Record<string, string | null> }).extras ?? {}).forEach(([k, id]) => {
    if (!id) return;
    const av = { ...avatar, wardrobe: { [k]: [{ id }] } } as Avatar;
    out.set(`${k}:${id}`, { key: `${k}:${id}`, kind: k, name: named(k, dressed({ ...av, extras: { [k]: id } } as Avatar)), src: icon(k, av), n: 1, days: 1 });
  });
  return [...out.values()].map(p => ({ ...p, n: TOPS.has(p.kind) ? p.days : BOTTOMS.has(p.kind) ? Math.ceil(p.days / 2) : 1 }));
}

// the luggage tag says what kinds of things are in the bag, not every piece's whole name
const GROUPS: [string, string[]][] = [['tops', ['tank', 'tee', 'long', 'sweater']], ['layers', ['light', 'hoodie', 'coat', 'rain']], ['bottoms', ['shorts', 'pants']],
  ['shoes', ['shoe']], ['extras', ['sunglasses', 'umbrella', 'beanie', 'scarf', 'bag', 'hat', 'glasses', 'chain', 'headphones']]];
const KIND_WORD: Record<string, string> = { long: 'long sleeve', light: 'jacket', rain: 'rain jacket', shoe: 'shoes' };
const WORDS = new Set(('tank cami tee polo henley raglan flannel shirt turtleneck rugby crewneck knit quarter-zip cardigan sweater jacket bomber windbreaker blazer hoodie '
  + 'puffer parka coat peacoat overcoat raincoat shell trench cutoffs shorts skirt jeans chinos pants joggers cords trousers tights sneakers high-tops shoes '
  + 'loafers boots slip-ons beanie scarf stole umbrella bag tote backpack basket hat cap glasses chain necklace headphones earbuds').split(' '));
const SAME: Record<string, string> = { shades: 'sunglasses', janes: 'mary janes' };
/** A piece's plain type: the last word of its name when that's a kind of clothing (windbreaker, loafers), else its kind's. */
const typeOf = (p: Packed) => {
  const ws = p.name.toLowerCase().split(/\s+/), w = ws[ws.length - 1] ?? '';
  if (w === 'top' && ws.length > 1) return ws.slice(-2).join(' '); // a crop top, a tube top
  return SAME[w] ?? (WORDS.has(w) ? w : KIND_WORD[p.kind] ?? p.kind);
};
const plural = (w: string, n: number) => (n < 2 || /s$/.test(w) ? w : /(sh|ch|x)$/.test(w) ? w + 'es' : w + 's');
function grouped(packed: Packed[]) {
  return GROUPS.map(([label, kinds]) => {
    const mine = packed.filter(p => kinds.includes(p.kind)), n = new Map<string, number>();
    mine.forEach(p => n.set(typeOf(p), (n.get(typeOf(p)) ?? 0) + p.n));
    return { label, src: mine[0]?.src, text: [...n].map(([w, k]) => `${k}x ${plural(w, k)}`).join(', ') };
  }).filter(g => g.text);
}
// the order things lie in the bag: shoes, then bottoms, tops, layers, the little things
const PILE = ['shoes', 'bottoms', 'tops', 'layers', 'extras'];
const pileOf = (p: Packed) => PILE.indexOf(GROUPS.find(([, ks]) => ks.includes(p.kind))?.[0] ?? 'extras');

// ---------- the split-flap board ----------

/** Rethink Sans drawn a little under full resolution and scaled back up (its soft edges kept): the board's letters, slightly low-res. */
const LOW: Record<string, { src: string; w: number; h: number }> = {};
function lowText(text: string, size: number, color: string, spacing = 0, F = 1.5) {
  const key = [text, size, color, spacing, F].join('|');
  if (LOW[key]) return LOW[key];
  const cv = document.createElement('canvas'), g = cv.getContext('2d')!, fs = size / F, font = `800 ${fs}px 'Rethink Sans', sans-serif`;
  g.font = font;
  const chars = [...text], ws = chars.map(c => g.measureText(c).width), sp = spacing / F;
  const w = Math.ceil(ws.reduce((a, b) => a + b, 0) + sp * Math.max(0, chars.length - 1)) + 2, h = Math.ceil(fs * 1.25) + 2;
  cv.width = w; cv.height = h; g.font = font; g.fillStyle = color; g.textBaseline = 'middle';
  let x = 1;
  chars.forEach((c, i) => { g.fillText(c, x, h / 2 + fs * 0.05); x += ws[i] + sp; });
  return (LOW[key] = { src: cv.toDataURL(), w: w * F, h: h * F });
}
function useFontReady() {
  const [ok, setOk] = useState(false);
  useEffect(() => { let live = true; document.fonts.ready.then(() => live && setOk(true)); return () => { live = false; }; }, []);
  return ok;
}
function Low({ text, size, color, spacing, style }: { text: string; size: number; color: string; spacing?: number; style?: React.CSSProperties }) {
  const ok = useFontReady();
  if (!ok || !text.trim()) return null;
  const t = lowText(text, Math.round(size), color, spacing);
  return <img src={t.src} alt={text} width={t.w} height={t.h} style={{ display: 'block', imageRendering: 'pixelated', ...style }} />;
}

const CHARS = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-.'?/:";
/** One flap: when its letter changes it runs through the alphabet to it, a flap at a time, like the real boards. */
function Flap({ ch, w, h, color = FLAP_FG, delay = 0, bg }: { ch: string; w: number; h: number; color?: string; delay?: number; bg?: string }) {
  const [shown, setShown] = useState(' ');
  const [tick, setTick] = useState(0);
  const cur = useRef(' ');
  useEffect(() => {
    const goal = CHARS.includes(ch) ? ch : ch.length === 1 && /\S/.test(ch) ? ch : ' ';
    if (cur.current === goal) return;
    const L = CHARS.length, gi = CHARS.indexOf(goal);
    let i = CHARS.indexOf(cur.current), left = gi < 0 ? 4 : (gi - i + L) % L;
    // start a few letters short of it so a word lands in well under a second
    if (left > 7) { i = (i + left - 7) % L; left = 7; }
    let t = setTimeout(function step() {
      i = (i + 1) % L; left--;
      cur.current = left <= 0 ? goal : CHARS[i];
      setShown(cur.current); setTick(x => x + 1);
      if (left > 0) t = setTimeout(step, 38);
    }, delay);
    return () => clearTimeout(t);
  }, [ch, delay]);
  return (
    <span style={{ position: 'relative', flex: 'none', width: w, height: h, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
      background: bg ?? `linear-gradient(${TILE} 0 50%, ${TILE_D} 50% 100%)`, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.07), 0 1px 0 #000' }}>
      <span key={tick} style={{ animation: tick ? 'flap-in .07s ease-out' : undefined, transformOrigin: '50% 50%' }}><Low text={shown} size={h * 0.66} color={color} /></span>
      <span aria-hidden style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 1, background: 'rgba(0,0,0,0.85)' }} />
    </span>
  );
}

/** A row of flaps reading `text` (left-aligned, cut to fit); `accent` is a few letters at its right end in yellow. */
function FlapRow({ text, tw, th, accent = '', color, lead }: { text: string; tw: number; th: number; accent?: string; color?: string; lead?: ReactNode }) {
  const body = plain(text).toUpperCase().slice(0, N - (accent ? accent.length + 1 : 0)).padEnd(N - accent.length, ' ') + accent;
  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      <span style={{ width: th, height: th, flex: 'none', marginRight: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: th * 0.7, lineHeight: 1, background: `linear-gradient(${TILE} 0 50%, ${TILE_D} 50% 100%)` }}>{lead}</span>
      {[...body].map((ch, i) => <Flap key={i} ch={ch} w={tw} h={th} delay={i * 22} color={i >= N - accent.length && accent ? YELLOW : color} />)}
    </div>
  );
}

// ---------- pixel bits ----------

/** Little pixel pictures from rows of letters (each letter a colour in `pal`, space empty). */
function Pix({ rows, pal, size, style }: { rows: string[]; pal: Record<string, string>; size: number; style?: React.CSSProperties }) {
  const w = Math.max(...rows.map(r => r.length)), h = rows.length;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w * size} height={h * size} shapeRendering="crispEdges" aria-hidden style={{ display: 'block', ...style }}>
      {rows.flatMap((r, y) => [...r].map((c, x) => (pal[c] ? <rect key={`${x}-${y}`} x={x} y={y} width={1.02} height={1.02} fill={pal[c]} /> : null)))}
    </svg>
  );
}
const PLANE = ['    #     ', '    ##    ', '#   ###   ', '##########', '#   ###   ', '    ##    ', '    #     '];
const GLOBE = [' ### ', '#.#.#', '#####', '#.#.#', ' ### '];
const WX: Record<string, { rows: string[]; pal: Record<string, string> }> = {
  sun: { rows: ['  y  ', ' yyy ', 'yyyyy', ' yyy ', '  y  '], pal: { y: '#f2b632' } },
  partly: { rows: ['  y   ', ' yyy  ', 'yywww ', ' wwwww', '      '], pal: { y: '#f2b632', w: '#b9c0cc' } },
  cloud: { rows: ['      ', ' www  ', 'wwwww ', 'wwwwww', '      '], pal: { w: '#9aa3b2' } },
  rain: { rows: [' www  ', 'wwwww ', 'wwwwww', ' b  b ', 'b  b  '], pal: { w: '#9aa3b2', b: '#4c8fd6' } },
  storm: { rows: [' www  ', 'wwwww ', 'wwwwww', '  y   ', ' y    '], pal: { w: '#7d8696', y: '#f2b632' } },
  snow: { rows: [' www  ', 'wwwww ', 'wwwwww', ' s  s ', 's  s  '], pal: { w: '#9aa3b2', s: '#dfe9f5' } },
  fog: { rows: ['      ', 'wwwww ', '      ', ' wwwww', '      '], pal: { w: '#9aa3b2' } },
};
/** A day's picture: rain or a storm only when some actually falls, else the sky it'd be. */
const wxDay = (d: TripDay) => { const w = wxOf(d.condition); return (w === 'rain' || w === 'storm') && d.rain < 0.05 ? 'cloud' : w; };
const wxOf = (c: string) => (['clear', 'heat', 'humid'].includes(c) ? 'sun' : c === 'partly' ? 'partly' : ['drizzle', 'rain'].includes(c) ? 'rain' : ['storm', 'hail'].includes(c) ? 'storm'
  : ['snow', 'blizzard', 'sleet'].includes(c) ? 'snow' : c === 'fog' ? 'fog' : 'cloud');

// the x-ray machine, in its own pixels: a monitor up on a post, the machine's housing over the belt (the bag goes in
// under it), lead curtains at its mouth, the belt running out to where snug stands with its suitcase
const MW = 60, MH = 58;
const M = { screen: [5, 2, 33, 19], box: [6, 30, 30, 21], belt: 51, bag: { w: 14, h: 15, rest: 44, inside: 14 }, lamp: [31, 27] } as const;
function drawMachine(front: boolean): string {
  const cv = document.createElement('canvas');
  cv.width = MW; cv.height = MH;
  const g = cv.getContext('2d')!, r = (x: number, y: number, w: number, h: number, c: string) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  const [bx, by, bw, bh] = M.box;
  if (front) {
    // the housing: rounded at the top, a darker band, a vent grille, a sticker; lead curtains hang in its mouth
    r(bx, by + 1, bw, bh - 1, INK); r(bx + 1, by, bw - 2, 1, INK);
    r(bx + 1, by + 1, bw - 2, bh - 2, '#d9dde3'); r(bx + 1, by + 1, bw - 2, 1, '#eef1f4'); r(bx + 1, by + 12, bw - 2, 3, '#8f99a8'); r(bx + 1, by + 12, bw - 2, 1, '#a9b2bf');
    for (let x = bx + 4; x < bx + 12; x += 2) r(x, by + 4, 1, 5, '#aab2bd');
    r(bx + 16, by + 4, 9, 5, YELLOW); r(bx + 16, by + 4, 9, 1, '#fff07a'); r(bx + 17, by + 6, 7, 1, INK);
    r(bx + bw - 1, by + 15, 1, bh - 15, INK);
    for (let x = bx + bw; x < bx + bw + 3; x++) r(x, by + 15, 1, bh - 15, x % 2 ? '#3a3f4a' : '#555c69');
    r(bx - 1, by + 15, 1, bh - 15, INK);
    for (let x = bx - 3; x < bx; x++) r(x, by + 15, 1, bh - 15, x % 2 ? '#3a3f4a' : '#555c69');
    return cv.toDataURL();
  }
  // the monitor: a dark bezel on a post, a little foot
  const [sx, sy, sw, sh] = M.screen;
  r(sx - 2, sy - 2, sw + 4, sh + 4, INK); r(sx - 1, sy - 1, sw + 2, sh + 2, '#3a3f4a'); r(sx - 1, sy - 1, sw + 2, 1, '#555c69'); r(sx, sy, sw, sh, '#0b1626');
  r(sx + sw / 2 - 2, sy + sh + 2, 4, by - sy - sh - 2, INK); r(sx + sw / 2 - 1, sy + sh + 2, 2, by - sy - sh - 2, '#6b7482');
  // the belt: rollers under a dark rubber band, on legs
  r(0, M.belt - 1, MW, 4, INK); r(0, M.belt, MW, 2, '#3a3f4a'); for (let x = 1; x < MW; x += 3) r(x, M.belt + 1, 1, 1, '#6b7482');
  [[2, 0], [MW - 5, 0], [bx + 4, 0], [bx + bw - 7, 0]].forEach(([x]) => { r(x, M.belt + 3, 3, MH - M.belt - 3, INK); r(x + 1, M.belt + 3, 1, MH - M.belt - 4, '#8f99a8'); });
  return cv.toDataURL();
}
// a hard-shell roller case: a grip on two rails, ribbed shell with a highlight down one side, dark corner guards, a
// sticker, two wheels. `y` is its colour; the light and dark of it are worked out from that
const BAG = ['     hhhh     ', '     g  g     ', '     g  g     ', '  oooooooooo  ', ' ocyyryyryyco ', ' oLyyryyryydo ', ' oLyyryyryydo ', ' oLyyrpyryydo ',
  ' oLyyrppryydo ', ' oLyyryyryydo ', ' oLyyryyryydo ', ' oLyyryyryydo ', ' ocddrddrddco ', '  oooooooooo  ', '   kk    kk   '];
const shade = (hex: string, f: number) => '#' + [1, 3, 5].map(i => Math.round(Math.max(0, Math.min(255, f > 0 ? +('0x' + hex.slice(i, i + 2)) + (255 - +('0x' + hex.slice(i, i + 2))) * f : +('0x' + hex.slice(i, i + 2)) * (1 + f)))).toString(16).padStart(2, '0')).join('');
const bagPal = (y: string, sticker = '#f08aa5') => ({ h: INK, g: '#8f99a8', o: INK, y, L: shade(y, 0.35), r: shade(y, -0.18), d: shade(y, -0.3), c: '#3a3f4a', p: sticker, k: '#2a2e36' });
const BAG_PAL = bagPal('#e7a93b');

// ---------- the terminal ----------

/** Where things are in the hall, in its own pixels (`px` page pixels each): the ceiling's edge, the windows' top and
 * bottom, the apron's edge outside, the floor's edge. */
const hallGeo = (floorY: number, px: number) => { const ft = Math.round(floorY / px), wy0 = 14, wy1 = ft - 9; return { ceil: 9, wy0, wy1, tar: wy1 - 7, ft }; };
/** Inside the terminal, pixel by pixel: a dark ceiling with light panels, a cream wall of tall windows onto the apron
 * (sky, a plane at the gate, a jet bridge, the tarmac), and a polished tiled floor catching the windows' light. */
function drawHall(pw: number, ph: number, floorY: number, px: number, frames = false): string {
  const W = Math.ceil(pw / px), H = Math.ceil(ph / px), { ceil, wy0, wy1, tar, ft } = hallGeo(floorY, px);
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d')!, r = (x: number, y: number, w: number, h: number, c: string) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  if (frames) {
    // just the glass's frames and glare, to go over whatever's out there (so it's all on the far side of the windows)
    for (let x = 0; x < W; x += 22) { r(x, wy0, 2, wy1 - wy0, '#3a3f4a'); for (let k = 0; k < 4; k++) r(x + 6 + k, wy0 + 6 + k * 2, 1, 2, 'rgba(255,255,255,0.35)'); }
    r(0, wy0 - 1, W, 2, '#3a3f4a'); r(0, wy1, W, 2, '#3a3f4a'); r(0, wy0 + Math.round((wy1 - wy0) * 0.28), W, 1, '#3a3f4a');
    return cv.toDataURL();
  }
  // the ceiling, its light panels
  r(0, 0, W, ceil, '#2b2f3a'); r(0, ceil - 1, W, 1, '#1d2028');
  for (let x = 5; x < W; x += 26) { r(x - 1, 2, 14, 4, '#3c414e'); r(x, 3, 12, 2, '#fff3cf'); }
  // the wall
  r(0, ceil, W, ft - ceil, '#e6e0d4'); r(0, ceil, W, 1, '#f3eee4');
  // through the windows: the sky in bands, low hills, the apron with its markings
  const sky = ['#8ec5ea', '#9dcdee', '#acd5f1', '#bcdcf3', '#cbe4f5'];
  for (let y = wy0; y < tar; y++) r(0, y, W, 1, sky[Math.min(sky.length - 1, Math.floor((y - wy0) / Math.max(1, (tar - wy0) / sky.length)))]);
  for (let x = 0; x < W; x++) { const h = Math.round(3 + 2 * Math.sin(x / 9) + Math.sin(x / 4)); r(x, tar - h, 1, h, '#9fbf9a'); }
  r(0, tar, W, wy1 - tar, '#8b9099'); r(0, tar, W, 1, '#a3a8b0');
  for (let x = 2; x < W; x += 9) r(x, tar + 4, 4, 1, '#e8c547');
  // a plane at the gate, and the jet bridge out to it
  { const p0 = Math.round(W * 0.58), y = tar + 1;
    r(p0, y - 8, 44, 6, '#f4f4f2'); r(p0, y - 3, 44, 1, '#c9ccd1'); r(p0 - 2, y - 7, 2, 4, '#f4f4f2'); r(p0 - 3, y - 6, 1, 2, '#f4f4f2'); r(p0 - 2, y - 7, 2, 1, '#3a4a66');
    r(p0, y - 5, 44, 1, '#e7a93b'); for (let i = 0; i < 11; i++) r(p0 + 5 + i * 3, y - 7, 1, 1, '#3a4a66');
    for (let j = 0; j < 9; j++) r(p0 + 37 + Math.floor(j * 0.7), y - 9 - j, 6, 1, '#23314f');
    r(p0 + 15, y - 3, 13, 1, '#b9bcc2'); r(p0 + 17, y - 2, 6, 2, '#9aa0a8'); r(p0 + 4, y - 2, 1, 2, INK); r(p0 + 30, y - 2, 1, 2, INK);
    r(p0 - 20, y - 9, 18, 4, '#cfd3d8'); r(p0 - 20, y - 9, 18, 1, '#eef1f4'); r(p0 - 14, y - 5, 2, 5, '#8f99a8'); }
  // the window frames: mullions, a transom, glare
  for (let x = 0; x < W; x += 22) { r(x, wy0, 2, wy1 - wy0, '#3a3f4a'); for (let k = 0; k < 4; k++) r(x + 6 + k, wy0 + 6 + k * 2, 1, 2, 'rgba(255,255,255,0.35)'); }
  r(0, wy0 - 1, W, 2, '#3a3f4a'); r(0, wy1, W, 2, '#3a3f4a'); r(0, wy0 + Math.round((wy1 - wy0) * 0.28), W, 1, '#3a3f4a');
  r(0, ft - 2, W, 2, '#b9b2a5');
  // the floor: polished tiles, the windows' light on them
  for (let y = ft; y < H; y++) for (let x = 0; x < W; x++) {
    const tx = Math.floor(x / 10), ty = Math.floor((y - ft) / 5);
    r(x, y, 1, 1, x % 10 === 0 || (y - ft) % 5 === 0 ? '#c4beb3' : (tx + ty) % 2 ? '#dcd8cf' : '#d3cec5');
  }
  for (let x = 0; x < W; x += 22) for (let k = 0; k < 10; k++) r(x + 3, ft + k, 17, 1, `rgba(255,255,255,${0.16 - k * 0.015})`);
  return cv.toDataURL();
}

/** Somebody else flying today: a snug of their own (skin, hair, girl or boy, a style) in clothes of their own. */
const rr = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const pick = <T,>(a: T[], n: number) => a[Math.floor(rr(n) * a.length) % a.length];
const look = sprite as (o: Outfit, mood: string, pose: string, av: unknown) => string;
const standUp = sprite as (o: Outfit, mood: string, pose: string) => string;
const BAG_COLORS = ['#e7a93b', '#d9534f', '#5b8def', '#6cc28b', '#c98bdb', '#3a3f4a', '#f08aa5'];
function traveller(seed: number) {
  const body = rr(seed) < 0.5 ? 'girl' : 'boy', style = pick(Object.keys(STYLES), seed + 1), col = (k: number) => pick(Object.keys(COLORS), seed + k);
  const o: Outfit = { top: pick(['tank', 'tee', 'tee', 'long', 'sweater'] as const, seed + 2) as Outfit['top'], outer: pick(['none', 'none', 'light', 'hoodie', 'coat'] as const, seed + 3) as Outfit['outer'],
    bottom: rr(seed + 4) < 0.3 ? 'shorts' : 'pants', acc: [...(rr(seed + 5) < 0.25 ? ['sunglasses' as const] : []), ...(rr(seed + 6) < 0.15 ? ['beanie' as const] : []), ...(rr(seed + 7) < 0.12 ? ['scarf' as const] : [])] };
  const wardrobe = { [o.top]: [{ s: style, c: col(11) }], [o.bottom]: [{ s: style, c: col(12) }], ...(o.outer !== 'none' ? { [o.outer]: [{ s: style, c: col(13) }] } : {}) };
  const av = { skin: pick(Object.keys(SKINS), seed + 8), body, hair: pick(HAIRS as string[], seed + 9), hairColor: pick(Object.keys(HAIRC), seed + 10), style, skirt: body === 'girl' && rr(seed + 14) < 0.5, wardrobe };
  return { src: look(o, 'happy', 'stand', av), bag: bagPal(pick(BAG_COLORS, seed + 16), pick(['#f08aa5', '#7fc4d8', '#f4f1e8', '#f2b632'], seed + 17)) };
}
/** One of them for the x-ray, their case rolling beside them: once snug's in line they walk in from `startDx` away and
 * get in line behind it (`delay` seconds after), then wait, shifting from foot to foot. */
function Queuer({ x, feet, k, u, seed, toward, here, delay, startDx }: { x: number; feet: number; k: number; u: number; seed: number; toward: 'left' | 'right'; here: boolean; delay: number; startDx: number }) {
  const t = useMemo(() => traveller(seed), [seed]);
  const z = u * k, w = 46 * z, h = 58 * z, bz = z * 1.35, dur = Math.max(1.2, Math.abs(startDx) / 170), steps = Math.round(dur / 0.34);
  return (
    <div aria-hidden style={{ position: 'absolute', left: x, top: feet - h, width: w, height: h, pointerEvents: 'none', translate: here ? '0 0' : `${startDx}px 0`, transition: here ? `translate ${dur}s ${delay}s linear` : 'none' }}>
      {/* the case on the side they're heading, between the posts */}
      <div style={{ position: 'absolute', [toward === 'left' ? 'left' : 'right']: -9 * bz, bottom: 0.5 * z }}>
        <Pix rows={BAG} pal={t.bag} size={bz} style={{ transform: toward === 'left' ? 'scaleX(-1)' : undefined }} />
      </div>
      <img src={t.src} alt="" style={{ position: 'absolute', inset: 0, width: w, height: h, imageRendering: 'pixelated', transformOrigin: '50% 100%',
        animation: here ? `air-waddle .34s ${delay}s ease-in-out ${steps}, air-shift ${2.4 + (seed % 5) * 0.35}s ${delay + dur}s ease-in-out infinite` : undefined }} />
    </div>
  );
}

// ---------- things going on in the background ----------

const MARSHAL_UP = ['w   w', 'w s w', 'vvvvv', ' vvv ', ' p p ', ' p p '], MARSHAL_OUT = ['     ', ' wsw ', 'wvvvw', ' vvv ', ' p p ', ' p p '];
const CART = ['   rrrr     ', '  rrrrrr    ', 'yyyyyyyyy y ', 'yyyyyyyyyyyy', ' kk     kk  '];
// ---------- out the windows ----------

// an airliner side on, nose to the right: tail fin, windows, a stripe, the wing and an engine under it
const JET = ['tt', 'ttt', 'tttt', 'tbbbbbbbbbbbbbbbbbbbbbb', ' bbwbwbwbwbwbwbwbwbwbbbn', ' ssssssssssssssssssssbb', '  bbbbbbbbbbbbbbbbbbbb', '        gggggggg', '          eeee'];
const JET_PAL = { t: NAVY, b: '#f4f4f2', w: '#3a4a66', n: '#3a4a66', s: '#e7a93b', g: '#b9bcc2', e: '#8f99a8' };
const FIRE = [['  r  ', ' ror ', 'royor', ' ryr '], [' r   ', ' orr ', 'royor', ' ryr ']], FIRE_PAL = { r: '#e8442e', o: '#ff9a2e', y: '#ffe36a' };
const BIRD = [['b   b', ' b b ', '  b  '], ['     ', 'bbbbb', '  b  ']];
const UFO = ['    ggg    ', '   gcccg   ', ' ggggggggg ', 'gylgylgylgg', ' ggggggggg '], UFO_PAL = { g: '#9aa3b2', c: '#9ff2e0', y: '#f2d23a', l: '#ff6a9a' };
const PAPER_PLANE = ['ww        ', 'wwwww     ', 'wwwwwwwwww', ' ggggggg  '];
const CHUTE = ['  aabaa  ', ' abbabba ', 'aabaaabaa', 'l   l   l', ' l  l  l ', '  l l l  ', '   ccc   ', '   sss   ', '   vvv   ', '   p p   '];
const DRAGON = [['    w           ', '   ww           ', '  www       gg  ', ' gggggggggggggge', 'tggggggggggggg  ', 't  gg    gg     '],
  ['                ', '            gg  ', ' gggggggggggggge', 'tggggwwwgggggg  ', 't  gwww  gg     ', '   ww           ']];
const DRAGON_PAL = { g: '#4fae6a', w: '#2f7a46', t: '#2f7a46', e: '#ffe36a' };
type Egg = 'birdstrike' | 'ufo' | 'loop' | 'paper' | 'chutes' | 'roll' | 'dragon';
const EGG_SECS: Record<Egg, number> = { birdstrike: 12, ufo: 11, loop: 10, paper: 11, chutes: 14, roll: 9, dragon: 10 };

/** An airliner flying a path (left to right), its nose following the path; with anything riding along on it. */
function Jet({ path, dur, z, wobbleAt, roll, children }: { path: string; dur: number; z: number; wobbleAt?: number; roll?: boolean; children?: ReactNode }) {
  const jw = 24 * z, jh = 9 * z;
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: jw, height: jh, offsetPath: `path("${path}")`, offsetRotate: 'auto', animation: `egg-fly ${dur}s linear both` } as React.CSSProperties}>
      <div style={{ position: 'relative', width: jw, height: jh, transformOrigin: '50% 50%', animation: wobbleAt != null ? `egg-wobble .5s ${wobbleAt}s ease-in-out infinite` : roll ? `egg-roll ${dur}s linear both` : undefined }}>
        <Pix rows={JET.map(r => r.padEnd(24))} pal={JET_PAL} size={z} />
        {children}
      </div>
    </div>
  );
}
/** Two frames swapping, for flapping and flickering. */
const Flip = ({ a, b, pal, size, rate, style }: { a: string[]; b: string[]; pal: Record<string, string>; size: number; rate: number; style?: React.CSSProperties }) => (
  <span style={{ position: 'relative', display: 'block', ...style }}>
    <Pix rows={a} pal={pal} size={size} style={{ animation: `air-wave ${rate}s steps(1) infinite` }} />
    <Pix rows={b} pal={pal} size={size} style={{ position: 'absolute', left: 0, top: 0, animation: `air-wave2 ${rate}s steps(1) infinite` }} />
  </span>
);

/** Planes taking off past the windows, one after another, all day. */
function Takeoffs({ w, h, z }: { w: number; h: number; z: number }) {
  const [n, setN] = useState(0);
  useEffect(() => { const t = setTimeout(() => setN(x => x + 1), 9500); return () => clearTimeout(t); }, [n]);
  const jz = z * 0.75;
  return <div key={n} style={{ position: 'absolute', inset: 0 }}><Jet path={`M ${-24 * jz - 20} ${h * 0.97} L ${w + 24 * jz + 40} ${h * (n % 2 ? 0.1 : 0.35)}`} dur={8.5} z={jz} /></div>;
}

/** The odd thing that happens out there, one at a time, in a shuffled order: a plane takes a bird to the engine and
 * flies on burning, a UFO beams a suitcase off the apron, a plane loops the loop or does a barrel roll, a paper plane
 * drifts by, skydivers float down, a dragon goes past breathing fire. */
function Eggs({ w, h, z }: { w: number; h: number; z: number }) {
  const [order] = useState<Egg[]>(() => (Object.keys(EGG_SECS) as Egg[]).map(e => [Math.random(), e] as const).sort((a, b) => a[0] - b[0]).map(([, e]) => e));
  const [n, setN] = useState(0);
  const kind = order[n % order.length], secs = EGG_SECS[kind];
  // one at a time, with a breather between
  useEffect(() => { const t = setTimeout(() => setN(x => x + 1), (secs + 4) * 1000); return () => clearTimeout(t); }, [n, secs]);
  const jw = 24 * z;
  let body: ReactNode = null;
  if (kind === 'birdstrike') {
    // the plane climbs across; a bird flaps in and meets the engine about three quarters of the way over
    const x0 = -jw - 20, y0 = h * 0.95, x1 = w + jw + 60, y1 = h * 0.02, f = (w * 0.74 - x0) / (x1 - x0), at = f * secs;
    const mx = x0 + (x1 - x0) * f, my = y0 + (y1 - y0) * f + 3 * z, path = `M ${x0} ${y0} L ${x1} ${y1}`;
    body = (
      <>
        {/* the smoke it trails after */}
        {Array.from({ length: 30 }, (_, i) => { const g = f + 0.01 + (i / 30) * (1 - f); return (
          <span key={i} style={{ position: 'absolute', left: 0, top: 0, width: 4 * z, height: 4 * z, offsetPath: `path("${path}")`, offsetDistance: `${g * 100}%`, offsetRotate: '0deg', offsetAnchor: '80% 0%',
            background: i % 3 ? '#5d6677' : '#3a3f4a', opacity: 0, animation: `egg-smoke 3.4s ${g * secs - 0.1}s ease-out both` } as React.CSSProperties} />); })}
        <Jet path={path} dur={secs} z={z} wobbleAt={at}>
          <span style={{ position: 'absolute', left: 8 * z, top: 6.5 * z, opacity: 0, transform: 'scaleX(-1)', animation: `egg-on .01s ${at}s both` }}>
            <Flip a={FIRE[0]} b={FIRE[1]} pal={FIRE_PAL} size={z * 1.3} rate={0.24} />
          </span>
        </Jet>
        <div style={{ position: 'absolute', left: 0, top: 0, ['--bx' as string]: `${mx - 220}px`, ['--by' as string]: `${my + 40}px`, ['--mx' as string]: `${mx}px`, ['--my' as string]: `${my}px`, animation: `egg-bird 2.2s ${at - 2.2}s linear both` }}>
          <Flip a={BIRD[0]} b={BIRD[1]} pal={{ b: '#2b2f3a' }} size={z * 0.8} rate={0.3} />
        </div>
        {/* the bang: a flash, feathers everywhere */}
        <span style={{ position: 'absolute', left: mx - 6 * z, top: my - 6 * z, width: 12 * z, height: 12 * z, background: 'radial-gradient(closest-side, #fff6c8, #ff9a2e 55%, rgba(232,68,46,0))', opacity: 0, animation: `egg-flash .45s ${at}s ease-out both` }} />
        {Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * Math.PI * 2; return (
          <span key={'f' + i} style={{ position: 'absolute', left: mx, top: my, width: z, height: z, background: i % 3 ? '#f4f1e8' : '#9aa3b2', opacity: 0,
            ['--fx' as string]: `${Math.cos(a) * 9 * z}px`, ['--fy' as string]: `${Math.sin(a) * 9 * z + 14}px`, animation: `egg-feather 1.4s ${at}s ease-out both` }} />); })}
      </>
    );
  }
  if (kind === 'ufo') {
    const hx = w * 0.82, hy = h * 0.22, uw = 11 * z;
    body = (
      <>
        <div style={{ position: 'absolute', left: hx - uw / 2, top: hy + 4 * z, width: uw, height: h - hy, background: 'linear-gradient(rgba(159,242,224,0.55), rgba(159,242,224,0.15))', clipPath: 'polygon(35% 0,65% 0,100% 100%,0 100%)', opacity: 0, animation: `egg-beam ${secs}s linear both` }} />
        <div style={{ position: 'absolute', left: hx - 7 * z * 0.5, top: h - 15 * z * 0.5, ['--rise' as string]: `${-(h - hy - 8 * z)}px`, opacity: 0, animation: `egg-lift ${secs}s linear both` }}>
          <Pix rows={BAG} pal={bagPal('#d9534f')} size={z * 0.5} />
        </div>
        <div style={{ position: 'absolute', left: 0, top: 0, ['--hx' as string]: `${hx - uw / 2}px`, ['--hy' as string]: `${hy}px`, ['--ox' as string]: `${w + 80}px`, animation: `egg-ufo ${secs}s cubic-bezier(.5,0,.5,1) both` }}>
          <Pix rows={UFO} pal={UFO_PAL} size={z} style={{ animation: 'egg-hover 1.2s ease-in-out infinite' }} />
        </div>
      </>
    );
  }
  if (kind === 'loop') {
    const y = h * 0.6, xc = w * 0.76, R = Math.min(h * 0.28, 80);
    body = <Jet path={`M ${-jw - 20} ${y} L ${xc} ${y} A ${R} ${R} 0 0 0 ${xc} ${y - 2 * R} A ${R} ${R} 0 0 0 ${xc} ${y} L ${w + jw + 40} ${y - h * 0.3}`} dur={secs} z={z} />;
  }
  if (kind === 'roll') body = <Jet path={`M ${-jw - 20} ${h * 0.4} L ${w + jw + 40} ${h * 0.3}`} dur={secs} z={z} roll />;
  if (kind === 'paper') {
    // someone's paper plane, swooping and climbing on the breeze
    const y = h * 0.35, a = h * 0.18;
    const path = `M -60 ${y} C ${w * 0.15} ${y + a}, ${w * 0.3} ${y - a}, ${w * 0.45} ${y} S ${w * 0.75} ${y - a * 1.4}, ${w * 0.85} ${y + a * 0.6} S ${w + 60} ${y - a}, ${w + 80} ${y}`;
    body = (
      <div style={{ position: 'absolute', left: 0, top: 0, offsetPath: `path("${path}")`, offsetRotate: 'auto', animation: `egg-fly ${secs}s ease-in-out both` } as React.CSSProperties}>
        <Pix rows={PAPER_PLANE} pal={{ w: '#ffffff', g: '#cfd6e0' }} size={z * 0.9} style={{ filter: 'drop-shadow(0 1px 0 rgba(31,27,46,0.35))' }} />
      </div>
    );
  }
  if (kind === 'chutes') {
    // a little plane goes over high up; three skydivers drop out of it and float down
    const pz = z * 0.6, x0 = -24 * pz - 20, x1 = w + 24 * pz + 40, y = h * 0.08, dur = 7;
    body = (
      <>
        <Jet path={`M ${x0} ${y} L ${x1} ${y}`} dur={dur} z={pz} />
        {[0.5, 0.6, 0.7].map((f, i) => (
          <div key={i} style={{ position: 'absolute', left: x0 + (x1 - x0) * f, top: y + 6 * pz, opacity: 0, ['--drop' as string]: `${h * 0.95}px`, ['--drift' as string]: `${(i - 1) * 20 + 30}px`, animation: `egg-chute ${secs - f * dur}s ${f * dur}s linear both` }}>
            <span style={{ display: 'block', transformOrigin: '50% 0', animation: 'air-shift 2s ease-in-out infinite' }}>
              <Pix rows={CHUTE} pal={{ a: ['#d9534f', '#5b8def', '#6cc28b'][i], b: '#f4f1e8', l: '#3a3f4a', c: '#5a3c22', s: '#e9b48a', v: ['#f2b632', '#c98bdb', '#7fc4d8'][i], p: '#2b2f3a' }} size={z * 0.8} />
            </span>
          </div>
        ))}
      </>
    );
  }
  if (kind === 'dragon') {
    const path = `M -${20 * z} ${h * 0.3} C ${w * 0.3} ${h * 0.1}, ${w * 0.6} ${h * 0.5}, ${w + 20 * z} ${h * 0.25}`;
    body = (
      <div style={{ position: 'absolute', left: 0, top: 0, offsetPath: `path("${path}")`, offsetRotate: 'auto', animation: `egg-fly ${secs}s linear both` } as React.CSSProperties}>
        <Flip a={DRAGON[0]} b={DRAGON[1]} pal={DRAGON_PAL} size={z} rate={0.5} />
        {/* puffs of fire, now and then */}
        <span style={{ position: 'absolute', left: 16 * z, top: 1 * z, rotate: '90deg', transformOrigin: '0 50%', animation: 'egg-breath 1.8s .6s steps(1) infinite' }}>
          <Flip a={FIRE[0]} b={FIRE[1]} pal={FIRE_PAL} size={z * 1.4} rate={0.2} />
        </span>
      </div>
    );
  }
  return <div key={n} style={{ position: 'absolute', inset: 0 }}>{body}</div>;
}
const OutTheWindow = ({ w, h, z }: { w: number; h: number; z: number }) => <><Takeoffs w={w} h={h} z={z} /><Eggs w={w} h={h} z={z} /></>;

// ---------- layout ----------

const layout = (c: PageCtx) => {
  const phone = c.pw < 760, sw = 46 * c.u;
  const boardW = phone ? c.pw - 24 : 480, mw = phone ? Math.min(c.pw * 0.52, 220) : 300, s = mw / MW;
  const total = boardW + 40 + sw + 8 + mw, x0 = Math.max(24, (c.pw - total) / 2);
  const snugX = phone ? c.pw - sw - 4 : x0 + boardW + 40;
  return { phone, boardW, boardX: phone ? 12 : x0, boardY: phone ? 66 : 48, mw, s, mx: phone ? 6 : snugX + sw + 8, my: c.ground + 3 * c.u - MH * s, snugX, flip: !phone };
};
/** Where snug stands at the airport (its sprite's left edge): by its suitcase at the end of the belt. */
export const airportSnugAt = (c: PageCtx) => Math.round(layout(c).snugX);

/**
 * The airport, at the far end of snug's street: a split-flap departures board. Type where you're going (or tap one of
 * the places flipping round on it), pick the days you'll be there, and it prints your boarding pass; then snug's
 * suitcase goes through the x-ray, packed with what it'll wear there, day by day, from its own closet.
 */
/** A booked trip: where, when, and whether they're there now. */
interface Booked { place: string; lat: number; lon: number; start: string; end: string; away: boolean }

/** The trip as a calendar file, to drop into their own calendar (an all-day event over the days they're away). */
function saveToCalendar(t: Booked) {
  const d = (s: string) => s.replace(/-/g, ''), city = cityOf({ name: t.place });
  const body = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//snug//trips//EN', 'BEGIN:VEVENT', `UID:snug-trip-${d(t.start)}-${hash(t.place)}@snug`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`, `DTSTART;VALUE=DATE:${d(t.start)}`, `DTEND;VALUE=DATE:${d(dateOf(dayNo(t.end) + 1))}`,
    `SUMMARY:trip to ${city}`, `LOCATION:${t.place.replace(/[,;]/g, m => '\\' + m)}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([body], { type: 'text/calendar' })); a.download = `trip to ${city.toLowerCase()}.ics`; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/** The booked trip, as a page on the calendar: the month in red over the first day, where and when, and what's next. */
function TripCal({ t, onCancel }: { t: Booked; onCancel: () => void }) {
  return (
    <div style={{ padding: 3, background: INK, clipPath: CP(4), animation: 'air-cal .45s cubic-bezier(.3,1.4,.5,1) both' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 9px', background: PAPER, clipPath: CP(4), color: INK }}>
        <div style={{ position: 'relative', flex: 'none', width: 44, border: `2px solid ${INK}`, background: '#fff', textAlign: 'center' }}>
          {[9, 29].map(x => <span key={x} aria-hidden style={{ position: 'absolute', left: x, top: -5, width: 3, height: 7, background: INK }} />)}
          <div style={{ background: '#d9483b', color: '#fff', fontSize: 10, fontWeight: 800, letterSpacing: 1.2, padding: '3px 0 2px' }}>{monOf(t.start).toUpperCase()}</div>
          <div style={{ fontSize: 21, fontWeight: 800, lineHeight: '25px' }}>{+t.start.slice(8)}</div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.away ? 'away in' : 'booked:'} {cityOf({ name: t.place }).toLowerCase()}</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, marginTop: 1 }}>{span(t.start, t.end).toLowerCase()} · {t.away ? "you're there now" : 'on your calendar'}</div>
          <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 11.5, fontWeight: 800 }}>
            <button onClick={() => saveToCalendar(t)} style={{ color: NAVY, textDecoration: 'underline' }}>add to my calendar</button>
            {!t.away && <button onClick={onCancel} style={{ color: MUTED, textDecoration: 'underline' }}>cancel trip</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Airport({ ctx, avatar, home, units, outfit, onBooked }: { ctx: PageCtx; avatar: Avatar; home: Place; units?: '°F' | '°C'; outfit?: Outfit; onBooked?: () => void }) {
  const L = layout(ctx), { s, flip } = L;
  const pad = L.phone ? 10 : 14, tw = Math.floor((L.boardW - 2 * pad - 4 - (N - 1) * 2) / (N + 1.3)), th = Math.round(tw * 1.3);
  const [q, setQ] = useState('');
  const [typing, setTyping] = useState(false);
  const [hits, setHits] = useState<Dest[]>([]);
  const [rot, setRot] = useState(0);
  const [dest, setDest] = useState<Dest | null>(null);
  const [week, setWeek] = useState(0);
  const [range, setRange] = useState<[string, string] | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [err, setErr] = useState('');
  const [booked, setBooked] = useState<Booked | null>(null); // the trip on their calendar, if there is one
  const [booking, setBooking] = useState(false);
  const [passH, setPassH] = useState(0); // how tall the boarding pass came out
  const passRO = useRef<ResizeObserver | null>(null);
  const passRef = useCallback((el: HTMLDivElement | null) => {
    passRO.current?.disconnect(); passRO.current = null;
    if (!el) { setPassH(0); return; }
    passRO.current = new ResizeObserver(() => setPassH(el.offsetHeight)); passRO.current.observe(el);
  }, []);
  // pick: choosing where; dates; print: the pass coming out; scan: the bag in the x-ray; done
  const [phase, setPhase] = useState<'pick' | 'dates' | 'want' | 'print' | 'in' | 'scan' | 'out' | 'done'>('pick');
  const [shownTag, setShownTag] = useState(true);
  // in out of the rain: snug folds the umbrella down, a few flaps of the canopy, and carries it closed at its side
  useEffect(() => {
    if (!ctx.arrived || !outfit?.acc.includes('umbrella')) return;
    const frames = [...[0.62, 0.3, 0.08].map(fold => standUp({ ...outfit, fold }, 'happy', 'stand')), standUp({ ...outfit, furled: true }, 'happy', 'stand')];
    const ts = frames.map((src, k) => setTimeout(() => ctx.setSnug(src), 180 + k * 130));
    return () => { ts.forEach(clearTimeout); ctx.setSnug(null); };
  }, [ctx.arrived, outfit]); // eslint-disable-line react-hooks/exhaustive-deps
  // the floor carries on below the scene: a phone's screen can be taller than it once the browser's bar tucks away, and
  // the meadow down there would show under the terminal
  const [below, setBelow] = useState(0);
  useEffect(() => {
    if (!ctx.arrived) { setBelow(0); return; }
    const measure = () => { const hero = document.querySelector('[data-rv="av"]')?.parentElement; if (hero) setBelow(Math.max(0, Math.ceil(window.innerHeight - hero.getBoundingClientRect().bottom))); };
    measure();
    window.addEventListener('resize', measure); window.visualViewport?.addEventListener('resize', measure);
    return () => { window.removeEventListener('resize', measure); window.visualViewport?.removeEventListener('resize', measure); };
  }, [ctx.arrived]);
  // nothing to scroll down to from here: the page stays put while snug's at the airport
  useEffect(() => {
    if (!ctx.arrived) return;
    const h = document.documentElement, b = document.body, was = [h.style.overflow, b.style.overflow];
    // straight to the top before locking (a smooth scroll gets stopped partway by the lock, stranding the board off screen)
    window.scrollTo(0, 0);
    h.style.overflow = 'hidden'; b.style.overflow = 'hidden';
    const stay = (e: TouchEvent) => { if (!(e.target as Element)?.closest?.('input')) e.preventDefault(); };
    document.addEventListener('touchmove', stay, { passive: false });
    return () => { h.style.overflow = was[0]; b.style.overflow = was[1]; document.removeEventListener('touchmove', stay); };
  }, [ctx.arrived]);
  const inp = useRef<HTMLInputElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const front = useMemo(() => drawMachine(true), []), back = useMemo(() => drawMachine(false), []);
  // the hall: its floor starts a little way up behind snug, so the people crossing it are further back
  const px = L.phone ? 3 : 4, floorY = ctx.ground - 26 * ctx.u, geo = hallGeo(floorY, px);
  const hall = useMemo(() => drawHall(ctx.pw, ctx.ph, floorY, px), [ctx.pw, ctx.ph, floorY, px]);
  const glass = useMemo(() => drawHall(ctx.pw, ctx.ph, floorY, px, true), [ctx.pw, ctx.ph, floorY, px]);
  // the line for the x-ray, behind snug (away from the machine): new people each visit
  const [crowdSeed] = useState(() => Math.floor(Math.random() * 5000));
  const line = useMemo(() => {
    const sw = 46 * ctx.u;
    if (L.phone) return [0, 1].map(i => ({ key: i, k: 0.5, x: L.snugX + sw * (0.55 + i * 0.32), feet: ctx.ground - 5 * ctx.u, seed: crowdSeed + i * 37 }));
    const k = 0.56, gap = 46 * ctx.u * k + 22;
    return Array.from({ length: Math.max(0, Math.min(4, Math.floor((L.snugX - 20) / gap))) }, (_, i) => ({ key: i, k, x: L.snugX - (i + 1) * gap + 10, feet: ctx.ground - 2 * ctx.u, seed: crowdSeed + i * 37 }));
  }, [ctx.u, ctx.ground, L.phone, L.snugX, crowdSeed]);
  const today = localToday();

  // the places flip round every few seconds while nobody's typing
  useEffect(() => { const iv = setInterval(() => setRot(r => r + 1), 5200); return () => clearInterval(iv); }, []);
  // suggestions as they type
  useEffect(() => {
    const text = q.trim();
    if (text.length < 2) { setHits([]); return; }
    let live = true;
    const t = setTimeout(() => { api<Dest[]>('/places?q=' + encodeURIComponent(text)).then(r => live && setHits(r.slice(0, 4))).catch(() => live && setHits([])); }, 220);
    return () => { live = false; clearTimeout(t); };
  }, [q]);
  // the weather there for those days, as soon as they're picked (so the pass prints right away)
  useEffect(() => {
    setTrip(null); setErr('');
    if (!dest || !range) return;
    let live = true;
    const t = setTimeout(() => {
      api<Trip>(`/trip?lat=${dest.lat}&lon=${dest.lon}&name=${encodeURIComponent(dest.name)}&start=${range[0]}&end=${range[1]}`)
        .then(r => live && setTrip(r)).catch(() => live && setErr('no weather there right now'));
    }, 250);
    return () => { live = false; clearTimeout(t); };
  }, [dest, range]);
  // printing, then the x-ray: the pass comes out, the bag rides in, gets scanned piece by piece, rides back out
  const packed = useMemo(() => (trip ? pack(trip.days, avatar) : []), [trip, avatar]);
  const later = (ms: number, f: () => void) => { timers.current.push(setTimeout(f, ms)); };
  useEffect(() => {
    if (phase === 'want' && trip) setPhase('print');
    if (phase === 'want' && err) setPhase('dates');
    if (phase === 'print') later(1900, () => setPhase('in'));
    if (phase === 'in') later(1300, () => setPhase('scan'));
    if (phase === 'scan') later(400 + (1.4 + packed.length * 0.12) * 1000 + 900, () => setPhase('out'));
    if (phase === 'out') later(1300, () => { setPhase('done'); setShownTag(true); });
  }, [phase, trip, err]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => { api<Booked | null>('/me/trip').then(setBooked).catch(() => {}); }, []);
  // booking it (the pass alone is only a look): on its first day their place becomes this city (and goes back after),
  // unless they change it themselves
  const isBooked = !!(booked && dest && range && booked.place === dest.name && booked.start === range[0] && booked.end === range[1]);
  const book = () => {
    if (!dest || !range || booking) return;
    const t = { place: dest.name, lat: dest.lat, lon: dest.lon, start: range[0], end: range[1], away: false };
    setBooking(true);
    api('/me/trip', { place: { name: t.place, lat: t.lat, lon: t.lon }, start: t.start, end: t.end }, 'PUT')
      .then(() => { setBooked(t); onBooked?.(); }).catch(() => {}).finally(() => setBooking(false));
  };
  const cancel = () => { api('/me/trip', undefined, 'DELETE').then(() => setBooked(null)).catch(() => {}); };
  const restart = () => { timers.current.forEach(clearTimeout); timers.current = []; setPhase('pick'); setDest(null); setRange(null); setQ(''); setTrip(null); setWeek(0); };

  const choose = (p: Dest) => { setDest(p); setQ(''); setHits([]); setTyping(false); inp.current?.blur(); setPhase('dates'); setRange(null); setWeek(0); };
  const tap = (d: string) => setRange(r => {
    if (!r || r[0] !== r[1] || d < r[0] || dayNo(d) - dayNo(r[0]) > 13) return [d, d];
    return [r[0], d];
  });

  const printed = !['pick', 'dates', 'want'].includes(phase);
  const rowsN = printed ? 2 : 5, rowH = th + 4;
  const headH = Math.round(th * 0.95), footH = 24;
  const boardH = pad * 2 + headH + rowsN * rowH + footH;
  const boardBottom = L.boardY + boardH;
  const away = AWAY.slice((rot % 4) * 4, (rot % 4) * 4 + 4);
  const deg = (f: number) => `${Math.round(units === '°C' ? (f - 32) * 5 / 9 : f)}°`;

  // the calendar: three weeks from this one (Sunday first), a week further each tap
  const sunday = dayNo(today) - wdOf(today) + week * 7;
  const cal = Array.from({ length: 21 }, (_, i) => dateOf(sunday + i));
  const inner = L.boardW - 2 * pad;
  const calW = Math.floor((inner - 6 * 3) / 7), calH = Math.floor((4 * rowH - 22 - 14 - 3 * 3) / 3);

  // the machine and the bag, in page pixels (mirrored on a computer so the belt runs out toward snug)
  const mxOf = (x: number, w: number) => L.mx + (flip ? MW - x - w : x) * s;
  const bagAt = phase === 'in' || phase === 'scan' ? M.bag.inside : M.bag.rest;
  const [scx, scy, scw, sch] = M.screen;
  const scr = { left: mxOf(scx, scw), top: L.my + scy * s, width: scw * s, height: sch * s };
  const bagX = mxOf(bagAt, M.bag.w), bagY = L.my + (M.belt - M.bag.h) * s;
  // the x-ray picture: as big as the pieces can be and all fit, under the screen's label
  const label = Math.max(9, scr.height * 0.17) + 4;
  // the pieces in the bag as the x-ray sees them: spread over the case in rows, each turned a little, each showing up as
  // the scan line passes over it
  const sweep = 1.4 + packed.length * 0.12;
  const xray = (() => {
    // rows as even as they can be (the extra ones go in the top rows), each row spread right across the case
    const n = packed.length, cw = scr.width - 6, chh = scr.height - label - 4, rows = Math.max(1, Math.min(n, Math.round(Math.sqrt(n * chh / cw * 1.3))));
    const per = Array.from({ length: rows }, (_, r) => Math.floor(n / rows) + (r < n % rows ? 1 : 0)), most = Math.max(...per);
    const w = Math.min(cw * 0.78 / most, (chh * 0.68 / rows) * 28 / 24);
    const order = [...packed].sort((a, b) => pileOf(a) - pileOf(b));
    let i = 0;
    return per.flatMap((m, r) => Array.from({ length: m }, (_, c) => {
      const p = order[i++], hsh = hash(p.key);
      const x = 9 + 82 * (c + 0.5) / m + ((hsh % 5) - 2) * 0.8, y = 14 + 74 * (r + 0.5) / rows + (((hsh >> 3) % 5) - 2) * 0.6;
      return { p, x, y, w, rot: ((hsh >> 5) % 51) - 25, at: x / 100 };
    }));
  })();
  const showTag = phase === 'done' && shownTag && ctx.arrived && packed.length > 0;
  const tagW = Math.min(L.phone ? ctx.pw - 24 : 560, ctx.pw - 24);
  const tagX = L.phone ? 12 : Math.max(12, Math.min(ctx.pw - tagW - 12, mxOf(M.bag.rest, M.bag.w) + M.bag.w * s / 2 - tagW / 2));
  const tagY = ctx.ground + 14;
  const flight = dest && range ? `SN ${100 + (hash(dest.name + range[0]) % 900)}` : '';
  const gate = dest ? `${'ABCD'[hash(dest.name) % 4]}${1 + (hash(dest.name + 'g') % 24)}` : '';
  const seat = dest && range ? `${4 + (hash(range[0] + dest.name) % 28)}${'ACDF'[hash(range[1]) % 4]}` : '';

  return (
    <div data-airport style={{ position: 'absolute', left: -4, top: 0, right: 0, bottom: 0, fontFamily: FONT, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 4, top: 0, right: 0, bottom: 0 }}>
      <style>{`@keyframes flap-in{from{transform:scaleY(.15);filter:brightness(.6)}to{transform:none}}
        @keyframes air-blink{0%,55%{opacity:1}56%,100%{opacity:.15}}
        @keyframes air-print{from{translate:0 -100%}to{translate:0 0}}
        @keyframes air-cal{from{opacity:0;scale:.7;rotate:-5deg}to{opacity:1;scale:1;rotate:0deg}}
        @keyframes air-stamp{from{opacity:0;scale:2.2}60%{opacity:.9;scale:.92}to{opacity:.85;scale:1}}
        @keyframes air-sweep{from{left:0}to{left:100%}}
        @keyframes air-xray{0%{opacity:0;filter:brightness(3)}100%{opacity:.88}}
        @keyframes air-tear{0%{translate:0 0;rotate:0deg}30%{translate:0 4px;rotate:-.8deg}100%{translate:3px 12px;rotate:1.3deg}}
        @keyframes air-cart{0%{translate:var(--from) 0}40%,100%{translate:var(--to) 0}}
        @keyframes air-wave{0%,49%{opacity:1}50%,100%{opacity:0}}
        @keyframes air-wave2{0%,49%{opacity:0}50%,100%{opacity:1}}
        @keyframes air-waddle{0%,100%{rotate:0deg;margin-top:0}25%{rotate:-4deg;margin-top:-3px}50%{rotate:0deg;margin-top:0}75%{rotate:4deg;margin-top:-3px}}
        @keyframes air-shift{0%,100%{rotate:0deg}30%{rotate:-2.5deg}60%{rotate:1.5deg}}
        @keyframes air-drop{0%{translate:0 -30px;rotate:-8deg;opacity:0}60%{translate:0 4px;rotate:3deg;opacity:1}100%{translate:0 0;rotate:0deg}}
        @keyframes egg-fly{from{offset-distance:0%}to{offset-distance:100%}}
        @keyframes egg-roll{0%,40%{scale:1 1}45%{scale:1 .1}50%{scale:1 -1}55%{scale:1 .1}60%,100%{scale:1 1}}
        @keyframes egg-chute{0%{opacity:1;translate:0 0}90%{opacity:1}100%{opacity:0;translate:var(--drift) var(--drop)}}
        @keyframes egg-breath{0%{opacity:1}35%,100%{opacity:0}}
        @keyframes egg-wobble{0%,100%{rotate:0deg}50%{rotate:-7deg}}
        @keyframes egg-on{to{opacity:1}}
        @keyframes egg-smoke{0%{opacity:0;scale:.5}15%{opacity:.75}100%{opacity:0;scale:2.6;translate:0 -10px}}
        @keyframes egg-bird{from{translate:var(--bx) var(--by)}to{translate:var(--mx) var(--my)}}
        @keyframes egg-feather{0%{opacity:1;translate:0 0}100%{opacity:0;translate:var(--fx) var(--fy);rotate:200deg}}
        @keyframes egg-flash{0%{opacity:1;scale:.3}100%{opacity:0;scale:1.6}}
        @keyframes egg-ufo{0%{translate:-80px -40px}22%,74%{translate:var(--hx) var(--hy)}86%,100%{translate:var(--ox) -60px}}
        @keyframes egg-hover{0%,100%{translate:0 0}50%{translate:0 -3px}}
        @keyframes egg-beam{0%,26%{opacity:0}30%,68%{opacity:1}72%,100%{opacity:0}}
        @keyframes egg-lift{0%,32%{opacity:0;translate:0 0}36%{opacity:1;translate:0 0}66%{opacity:1;translate:0 var(--rise)}67%,100%{opacity:0;translate:0 var(--rise)}}
        @keyframes air-curtain{0%,100%{skew:0deg}30%{skew:-14deg}60%{skew:8deg}}`}</style>

      {/* inside the terminal: the hall, and whatever's going on out of its windows */}
      <img src={hall} alt="" style={{ position: 'absolute', left: 0, top: 0, width: Math.ceil(ctx.pw / px) * px, height: Math.ceil(ctx.ph / px) * px, imageRendering: 'pixelated' }} />
      <div aria-hidden style={{ position: 'absolute', left: 0, top: (geo.wy0 + 1) * px, width: ctx.pw, height: (geo.tar - geo.wy0 - 4) * px, overflow: 'hidden', pointerEvents: 'none' }}>
        <OutTheWindow w={ctx.pw} h={(geo.tar - geo.wy0 - 4) * px} z={L.phone ? 3 : 5} />
      </div>
      {/* out on the apron: ground crew waving, a baggage cart going by */}
      <div aria-hidden style={{ position: 'absolute', left: 0, top: (geo.tar - 8) * px, width: ctx.pw, height: 12 * px, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', left: 0, top: 7 * px - 5 * px * 0.8, ['--from' as string]: `${ctx.pw + 20}px`, ['--to' as string]: `${-14 * px}px`, animation: 'air-cart 24s 4s linear infinite both' }}>
          <Pix rows={CART} pal={{ r: '#d9534f', y: '#e8c547', k: INK }} size={px * 0.8} style={{ transform: 'scaleX(-1)' }} />
        </div>
        <div style={{ position: 'absolute', left: ctx.pw - (L.phone ? 22 : 40) * px * 0.5 - 30, top: 8 * px - 6 * px * 0.7 }}>
          <Pix rows={MARSHAL_UP} pal={{ w: '#ff6a2a', s: '#c98d6a', v: '#f2d23a', p: '#2b2f3a' }} size={px * 0.7} style={{ animation: 'air-wave 1s steps(1) infinite' }} />
          <Pix rows={MARSHAL_OUT} pal={{ w: '#ff6a2a', s: '#c98d6a', v: '#f2d23a', p: '#2b2f3a' }} size={px * 0.7} style={{ position: 'absolute', left: 0, top: 0, animation: 'air-wave2 1s steps(1) infinite' }} />
        </div>
      </div>
      {/* the windows' frames, over everything out there */}
      <img src={glass} alt="" style={{ position: 'absolute', left: 0, top: 0, width: Math.ceil(ctx.pw / px) * px, height: Math.ceil(ctx.ph / px) * px, imageRendering: 'pixelated', pointerEvents: 'none' }} />

      {/* the line for security, and the posts and belts that make it a line */}
      {line.map((q, i) => <Queuer key={q.key} x={q.x} feet={q.feet} k={q.k} u={ctx.u} seed={q.seed} toward={L.flip ? 'right' : 'left'} here={ctx.arrived} delay={0.5 + i * 1.3}
        startDx={L.flip ? -(q.x + 46 * ctx.u * q.k + 60) : ctx.pw - q.x + 60} />)}
      {!L.phone && line.length > 0 && (() => {
        const y = ctx.ground + 2 * ctx.u, x0 = line[line.length - 1].x - 14, x1 = L.snugX - 6, posts = line.length + 1;
        return Array.from({ length: posts }, (_, i) => {
          const x = x0 + (x1 - x0) * i / (posts - 1);
          return (
            <span key={i} aria-hidden style={{ position: 'absolute', left: x - 4, top: y - 13 * ctx.u * 0.75, width: 8, height: 13 * ctx.u * 0.75, background: '#8f99a8', boxShadow: `0 0 0 2px ${INK}, inset 2px 0 0 #c4cad3`, pointerEvents: 'none' }}>
              <span style={{ position: 'absolute', left: -6, bottom: -4, width: 20, height: 5, background: '#3a3f4a', boxShadow: `0 0 0 2px ${INK}` }} />
              {i < posts - 1 && (() => {
                // the belt between two posts, in 3px pixels, sagging a little in the middle
                const len = (x1 - x0) / (posts - 1) - 8, cells = Math.max(3, Math.round(len / 3));
                return (
                  <svg viewBox={`0 0 ${cells} 5`} width={cells * 3} height={15} shapeRendering="crispEdges" style={{ position: 'absolute', left: 6, top: 5 }}>
                    {Array.from({ length: cells }, (_, c) => { const y = Math.round(1.4 * Math.sin(Math.PI * c / (cells - 1))); return (
                      <g key={c}><rect x={c} y={y} width={1} height={3} fill={INK} /><rect x={c} y={y + 1} width={1} height={1} fill="#2d4a8a" /></g>); })}
                  </svg>
                );
              })()}
            </span>
          );
        });
      })()}

      {/* the board hangs from the ceiling */}
      {[0.12, 0.88].map(f => (
        <span key={f} aria-hidden style={{ position: 'absolute', left: L.boardX + L.boardW * f - 2, top: geo.ceil * px - 2, width: 4, height: L.boardY - geo.ceil * px + 4, background: '#3a3f4a', boxShadow: `0 0 0 1px ${INK}` }} />
      ))}

      {/* the departures board */}
      <div style={{ position: 'absolute', left: L.boardX, top: L.boardY, width: L.boardW, height: boardH, padding: pad, background: BOARD, boxShadow: `0 0 0 3px ${INK}, inset 0 0 0 2px #2b2b2b, 0 8px 0 rgba(20,16,30,0.35)`, transition: 'height .5s cubic-bezier(.4,0,.2,1)', overflow: 'hidden', zIndex: 2 }}>
        <div style={{ height: headH, display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 2 }}>
          <Pix rows={PLANE} pal={{ '#': YELLOW }} size={Math.max(2, Math.round(th / 12))} style={{ rotate: '-18deg' }} />
          <Low text="DEPARTURES" size={th * 0.72} color={YELLOW} spacing={2.5} />
          {printed && <span style={{ marginLeft: 'auto', animation: 'air-blink 1.1s steps(1) infinite' }}><Low text="BOARDING" size={th * 0.5} color={YELLOW} spacing={1.5} /></span>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 2 }}>
          {phase === 'pick' && (
            <>
              {/* where to: what they type flips up on the top row */}
              <div style={{ position: 'relative' }}>
                <FlapRow text={q || (typing ? '' : 'WHERE TO?')} color={q ? FLAP_FG : 'rgba(244,241,232,0.45)'} tw={tw} th={th} lead={<span style={{ color: YELLOW, fontSize: th * 0.5, fontWeight: 800 }}>›</span>} />
                {typing && <span aria-hidden style={{ position: 'absolute', left: th + 4 + Math.min(q.length, N - 1) * (tw + 2) + 2, top: th - 5, width: tw - 4, height: 3, background: YELLOW, animation: 'air-blink 1s steps(1) infinite' }} />}
                <input ref={inp} value={q} aria-label="where are you going?" autoComplete="off" spellCheck={false} maxLength={N}
                  onChange={e => setQ(e.target.value.slice(0, N))} onFocus={() => setTyping(true)} onBlur={() => setTyping(false)}
                  onKeyDown={e => { if (e.key === 'Enter' && hits[0]) choose(hits[0]); if (e.key === 'Escape') inp.current?.blur(); }}
                  style={{ position: 'absolute', inset: 0, width: '100%', opacity: 0, fontSize: 16, cursor: 'text' }} />
              </div>
              {(q.trim().length >= 2 ? hits : away).concat(Array(4).fill(null)).slice(0, 4).map((p, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <FlapRow text={p ? cityOf(p) : ''} accent={p && cityOf(p).length <= N - 3 ? regionOf(p).slice(0, 2) : ''} tw={tw} th={th} lead={p ? flagOf(p.cc) : null} />
                  {p && <button onClick={() => choose(p)} aria-label={`go to ${p.name}`} style={{ position: 'absolute', inset: 0 }} />}
                </div>
              ))}
            </>
          )}
          {phase !== 'pick' && dest && (
            <FlapRow text={cityOf(dest)} accent={printed ? gate : ''} tw={tw} th={th} lead={flagOf(dest.cc)} />
          )}
          {(phase === 'dates' || phase === 'want') && (
            // the days they'll be there: tap the first, then the last
            <div style={{ height: 4 * rowH - 4 }}>
              <div style={{ height: 22, display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: YELLOW, fontWeight: 800, fontSize: 13, letterSpacing: 2 }}>
                <button onClick={() => setWeek(w => Math.max(0, w - 1))} disabled={!week} aria-label="earlier" style={{ color: YELLOW, opacity: week ? 1 : 0.25, fontSize: 18, fontWeight: 800, padding: '0 8px' }}>‹</button>
                <span>{monOf(cal[0])}{monOf(cal[20]) !== monOf(cal[0]) ? ` ${monOf(cal[20])}` : ''}</span>
                <button onClick={() => setWeek(w => Math.min(50, w + 1))} aria-label="later" style={{ color: YELLOW, fontSize: 18, fontWeight: 800, padding: '0 8px' }}>›</button>
              </div>
              <div style={{ height: 14, display: 'grid', gridTemplateColumns: `repeat(7, ${calW}px)`, gap: 3, color: 'rgba(244,241,232,0.5)', fontSize: 9.5, fontWeight: 800, textAlign: 'center', letterSpacing: 1 }}>
                {WD.map(d => <span key={d}>{d.slice(0, 2)}</span>)}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(7, ${calW}px)`, gap: 3 }}>
                {cal.map(d => {
                  const past = d < today, on = !!range && d >= range[0] && d <= range[1], end = !!range && (d === range[0] || d === range[1]);
                  return (
                    <button key={d} disabled={past} onClick={() => tap(d)} aria-label={`${WD[wdOf(d)]} ${+d.slice(8)} ${monOf(d)}`} aria-pressed={on}
                      style={{ position: 'relative', height: calH, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: past ? 0.3 : 1,
                        background: end ? YELLOW : on ? 'rgba(245,217,10,0.32)' : `linear-gradient(${TILE} 0 50%, ${TILE_D} 50% 100%)`,
                        color: end ? '#111' : FLAP_FG, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.07), 0 1px 0 #000' }}>
                      <Low text={String(+d.slice(8))} size={calH * 0.6} color={end ? '#111111' : FLAP_FG} />
                      <span aria-hidden style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 1, background: 'rgba(0,0,0,0.6)' }} />
                      {d === today && <span aria-hidden style={{ position: 'absolute', left: '50%', bottom: 2, width: 4, height: 2, marginLeft: -2, background: end ? '#111' : YELLOW }} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {printed && range && <FlapRow text={span(range[0], range[1])} accent={seat.length <= 3 ? seat : ''} tw={tw} th={th} lead={<span style={{ color: YELLOW, fontSize: th * 0.42, fontWeight: 800 }}>{range[1] === range[0] ? '1' : dayNo(range[1]) - dayNo(range[0]) + 1}d</span>} />}
        </div>
        <div style={{ position: 'absolute', left: pad, right: pad, bottom: pad - 4, height: footH, display: 'flex', alignItems: 'center', gap: 7, color: 'rgba(244,241,232,0.8)', fontSize: 12.5, fontWeight: 700 }}>
          <Pix rows={GLOBE} pal={{ '#': 'rgba(244,241,232,0.8)', '.': BOARD }} size={2.6} />
          <span>snug air</span>
          {err && <span style={{ color: '#ff9b8a', fontSize: 11.5 }}>{err}</span>}
          {phase !== 'pick' && (phase === 'dates' || phase === 'done' || phase === 'want') && (
            <button onClick={restart} style={{ marginLeft: 'auto', color: YELLOW, fontSize: 12, fontWeight: 800, textDecoration: 'underline' }}>{phase === 'done' ? 'new trip' : 'change city'}</button>
          )}
        </div>
        {/* the slot the pass prints out of */}
        <span aria-hidden style={{ position: 'absolute', left: 14, right: 14, bottom: 0, height: 3, background: '#000', boxShadow: '0 -1px 0 #2b2b2b' }} />
      </div>

      {/* their booked trip, while they're picking where to next */}
      {phase === 'pick' && booked && (
        <div style={{ position: 'absolute', left: L.boardX, top: boardBottom + 12, width: L.boardW, zIndex: 2 }}><TripCal t={booked} onCancel={cancel} /></div>
      )}

      {/* print it */}
      {(phase === 'dates' || phase === 'want') && (
        <button onClick={() => setPhase('want')} disabled={!range || phase === 'want'}
          style={{ position: 'absolute', left: L.boardX, top: boardBottom + 12, width: L.boardW, padding: 4, background: INK, clipPath: CP(4), opacity: range ? 1 : 0.55, zIndex: 2 }}>
          <span style={{ display: 'block', padding: '9px 0', background: range ? YELLOW : '#bdb6a2', clipPath: CP(4), color: '#111', fontSize: 15, fontWeight: 800, letterSpacing: 0.3 }}>
            {phase === 'want' ? 'checking the weather there…' : range ? 'print boarding pass' : 'pick your days'}
          </span>
        </button>
      )}

      {/* the boarding pass, out of the slot */}
      {printed && dest && range && trip && (
        <>
        {/* torn off: a ragged scrap stays in the slot */}
        {phase !== 'print' && <span aria-hidden style={{ position: 'absolute', left: L.boardX + 10, top: boardBottom - 1, width: L.boardW - 20, height: 6, background: PAPER, borderLeft: `2px solid ${INK}`, borderRight: `2px solid ${INK}`, clipPath: torn(false), zIndex: 1 }} />}
        <div style={{ position: 'absolute', left: L.boardX + 8, top: boardBottom - 1, width: L.boardW - 16, overflow: phase === 'print' ? 'hidden' : 'visible', zIndex: 1, paddingBottom: 8, filter: 'drop-shadow(0 6px 0 rgba(20,16,30,0.3))' }}>
          <div ref={passRef} style={{ position: 'relative', animation: phase === 'print' ? 'air-print 1.8s steps(14) both' : 'air-tear .8s cubic-bezier(.3,.7,.4,1) both', transformOrigin: '20% 0', background: PAPER, color: INK, border: `2px solid ${INK}`, clipPath: phase === 'print' ? undefined : torn(true), margin: '0 2px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', background: NAVY, color: PAPER, fontSize: 10.5, fontWeight: 800, letterSpacing: 1.6 }}>
              <Pix rows={PLANE} pal={{ '#': YELLOW }} size={1.6} /> SNUG AIR <span style={{ marginLeft: 'auto', opacity: 0.85 }}>BOARDING PASS</span>
            </div>
            <div style={{ padding: L.phone ? '6px 12px 8px' : '8px 16px 10px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
                <div><div style={{ fontSize: L.phone ? 28 : 34, fontWeight: 800, lineHeight: 1, letterSpacing: 1 }}>{codeOf(home)}</div><div style={{ fontSize: 11, fontWeight: 700, color: MUTED, marginTop: 2 }}>{cityOf(home).toLowerCase()}</div></div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4, paddingBottom: 18 }}>
                  <span style={{ flex: 1, borderTop: `2px dashed ${MUTED}` }} /><Pix rows={PLANE} pal={{ '#': INK }} size={2} /><span style={{ flex: 1, borderTop: `2px dashed ${MUTED}` }} />
                </div>
                <div style={{ textAlign: 'right' }}><div style={{ fontSize: L.phone ? 28 : 34, fontWeight: 800, lineHeight: 1, letterSpacing: 1 }}>{codeOf(dest)}</div><div style={{ fontSize: 11, fontWeight: 700, color: MUTED, marginTop: 2 }}>{cityOf(dest).toLowerCase()}</div></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 7, gap: 6 }}>
                {[['PASSENGER', 'SNUG'], ['FLIGHT', flight], ['GATE', gate], ['SEAT', seat], ['DATES', span(range[0], range[1]).toLowerCase()]].map(([k, v]) => (
                  <div key={k} style={{ minWidth: 0 }}><div style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: 1.1, color: MUTED }}>{k}</div><div style={{ fontSize: 13, fontWeight: 800, whiteSpace: 'nowrap' }}>{v}</div></div>
                ))}
              </div>
            </div>
            {/* the tear line, then the weather there, day by day */}
            <div aria-hidden style={{ margin: '0 8px', borderTop: `2px dotted ${MUTED}` }} />
            <div style={{ display: 'flex', justifyContent: trip.days.length > 7 ? 'space-between' : 'flex-start', gap: trip.days.length > 7 ? 0 : 6, padding: '6px 10px 4px', overflow: 'hidden' }}>
              {trip.days.map(d => (
                <div key={d.date} style={{ flex: trip.days.length > 7 ? '1 1 0' : '0 0 auto', minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: trip.days.length > 7 ? 0 : '0 6px' }}>
                  <span style={{ fontSize: 9, fontWeight: 800, color: MUTED, letterSpacing: 0.6 }}>{WD[wdOf(d.date)].toLowerCase()}{d.typical ? '*' : ''}</span>
                  <Pix rows={WX[wxDay(d)].rows} pal={WX[wxDay(d)].pal} size={trip.days.length > 10 ? 2.4 : 3} />
                  <span style={{ fontSize: trip.days.length > 10 ? 10 : 12, fontWeight: 800, lineHeight: 1 }}>{deg(d.hi)}</span>
                  <span style={{ fontSize: trip.days.length > 10 ? 9 : 10, fontWeight: 700, color: MUTED, lineHeight: 1 }}>{deg(d.lo)}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 10px 7px' }}>
              <svg aria-hidden width={L.phone ? 150 : 200} height={14} viewBox="0 0 75 7" preserveAspectRatio="none" shapeRendering="crispEdges">
                {bars(flight).map(([x, w], i) => <rect key={i} x={x} y={0} width={w} height={7} fill={INK} />)}
              </svg>
              {trip.days.some(d => d.typical) && <span style={{ fontSize: 9.5, fontWeight: 700, color: MUTED, marginLeft: 'auto', textAlign: 'right' }}>* last year&apos;s weather</span>}
            </div>
            {isBooked && (
              <span aria-hidden style={{ position: 'absolute', left: '50%', top: L.phone ? 30 : 34, translate: '-50% 0', rotate: '-9deg', padding: '1px 8px', border: '3px solid #d9483b', color: '#d9483b', background: 'rgba(251,246,236,0.75)', fontSize: 17, fontWeight: 800, letterSpacing: 3, animation: 'air-stamp .35s cubic-bezier(.3,1.3,.5,1) both' }}>BOOKED</span>
            )}
          </div>
        </div>
        {/* only a look until they book it (up over snug, who'd stand in front of it on a phone) */}
        {phase !== 'print' && passH > 0 && (
          <OnTop>
            <div style={{ position: 'absolute', left: L.boardX + 10, top: boardBottom - 1 + passH + 10, width: L.boardW - 20, fontFamily: FONT }}>
              {isBooked && booked ? <TripCal t={booked} onCancel={cancel} /> : (
                <button onClick={book} disabled={booking} style={{ display: 'block', width: '100%', padding: 4, background: INK, clipPath: CP(4), animation: 'air-cal .45s cubic-bezier(.3,1.4,.5,1) both' }}>
                  <span style={{ display: 'block', padding: '9px 0', background: YELLOW, clipPath: CP(4), color: '#111', fontSize: 15, fontWeight: 800, letterSpacing: 0.3 }}>
                    {booking ? 'booking…' : booked ? `book this trip instead (of ${cityOf({ name: booked.place }).toLowerCase()})` : 'book this trip'}
                  </span>
                </button>
              )}
            </div>
          </OnTop>
        )}
        </>
      )}

      {/* the x-ray machine (its housing goes over the bag), the monitor's picture, the bag */}
      <img src={back} alt="" style={{ position: 'absolute', left: L.mx, top: L.my, width: MW * s, height: MH * s, imageRendering: 'pixelated', transform: flip ? 'scaleX(-1)' : undefined }} />
      <div aria-hidden style={{ position: 'absolute', ...scr, overflow: 'hidden', background: 'radial-gradient(ellipse at 50% 45%, #13294a, #08111e)', boxShadow: 'inset 0 0 8px rgba(0,0,0,0.8)' }}>
        <span style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 3px)' }} />
        {(phase === 'scan' || phase === 'out' || phase === 'done') && packed.length > 0 ? (
          <div style={{ position: 'absolute', left: 3, right: 3, top: label + 1, bottom: 3 }}>
            {/* the case itself, on the x-ray: its shell, handle and wheels in faint blue */}
            <span style={{ position: 'absolute', inset: '8% 4% 6%', border: '2px solid rgba(110,200,255,0.55)', boxShadow: '0 0 6px rgba(110,200,255,0.35), inset 0 0 10px rgba(110,200,255,0.15)', borderRadius: 3 }} />
            <span style={{ position: 'absolute', left: '42%', width: '16%', top: 0, height: '9%', border: '2px solid rgba(110,200,255,0.45)', borderBottom: 'none' }} />
            {xray.map(({ p, x, y, w, rot, at }, i) => {
              // organic stuff glows orange on an x-ray, the rest blue-green
              const tint = TOPS.has(p.kind) || BOTTOMS.has(p.kind) || ['light', 'hoodie', 'coat', 'rain', 'scarf', 'beanie'].includes(p.kind) ? 'sepia(1) saturate(5) hue-rotate(-12deg) brightness(1.15)' : 'sepia(1) saturate(4) hue-rotate(150deg) brightness(1.2)';
              return <img key={p.key} src={p.src} alt="" style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: w, height: w * 24 / 28, translate: '-50% -50%', rotate: `${rot}deg`, imageRendering: 'pixelated', zIndex: i, mixBlendMode: 'screen',
                filter: `grayscale(1) contrast(1.5) brightness(1.3) ${tint} drop-shadow(0 0 2px rgba(255,190,120,0.6))`, opacity: 0.88, animation: `air-xray .25s ${phase === 'scan' ? 0.4 + at * sweep : 0}s ease-out both` }} />;
            })}
          </div>
        ) : (
          <span style={{ position: 'absolute', left: 6, top: 3, color: '#5ef08a', fontFamily: PIXEL, fontSize: Math.max(9, scr.height * 0.17), lineHeight: 1, animation: 'air-blink 1.2s steps(1) infinite' }}>{phase === 'in' ? 'SCANNING' : 'READY'}</span>
        )}
        {phase === 'scan' && <span style={{ position: 'absolute', top: 0, bottom: 0, width: 2, background: '#7cf7ff', boxShadow: '0 0 8px #7cf7ff', animation: `air-sweep ${sweep}s .4s linear both` }} />}
        {(phase === 'out' || phase === 'done') && <span style={{ position: 'absolute', right: 5, top: 3, color: '#5ef08a', fontFamily: PIXEL, fontSize: Math.max(9, scr.height * 0.17), lineHeight: 1 }}>CLEAR</span>}
      </div>
      {/* the lamp on top: amber while it scans, green when the bag's through */}
      <span aria-hidden style={{ position: 'absolute', left: mxOf(M.lamp[0], 3), top: L.my + M.lamp[1] * s, width: 3 * s, height: 3 * s, background: phase === 'scan' || phase === 'in' ? '#ffb02e' : phase === 'out' || phase === 'done' ? '#3fe07a' : '#6b7482',
        boxShadow: `0 0 0 ${Math.max(1, s * 0.6)}px ${INK}${phase === 'scan' ? ', 0 0 10px #ffb02e' : phase === 'out' ? ', 0 0 10px #3fe07a' : ''}`, animation: phase === 'scan' ? 'air-blink .5s steps(1) infinite' : undefined }} />
      <button onClick={() => phase === 'done' && setShownTag(t => !t)} aria-label="snug's suitcase"
        style={{ position: 'absolute', left: bagX, top: bagY, transition: 'left 1.25s cubic-bezier(.45,0,.35,1)', cursor: phase === 'done' ? 'pointer' : 'default' }}>
        <Pix rows={BAG} pal={BAG_PAL} size={s} style={{ transform: flip ? 'scaleX(-1)' : undefined }} />
      </button>
      {/* the housing, over the bag while it's inside */}
      <img src={front} alt="" style={{ position: 'absolute', left: L.mx, top: L.my, width: MW * s, height: MH * s, imageRendering: 'pixelated', transform: flip ? 'scaleX(-1)' : undefined, pointerEvents: 'none' }} />
      {/* the curtains sway as the bag goes through */}
      {(phase === 'in' || phase === 'out') && <span aria-hidden key={phase} style={{ position: 'absolute', left: mxOf(flip ? M.box[0] - 3 : M.box[0] + M.box[2], 3), top: L.my + (M.box[1] + 15) * s, width: 3 * s, height: (M.box[3] - 15) * s, background: 'repeating-linear-gradient(90deg,#3a3f4a 0 50%,#555c69 50% 100%)', backgroundSize: `${2 * s}px 100%`, transformOrigin: '50% 0', animation: 'air-curtain .9s .5s ease-in-out' }} />}

      {/* what's in the bag: a luggage tag off its handle, over snug's feet */}
      {showTag && (
        <OnTop>
          <svg aria-hidden width={ctx.pw} height={ctx.ph} style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none', overflow: 'visible' }}>
            <line x1={bagX + M.bag.w * s / 2} y1={bagY + 2 * s} x2={tagX + tagW / 2} y2={tagY + 10} stroke="#c79a5b" strokeWidth={2} />
          </svg>
          <div style={{ position: 'absolute', left: tagX, top: tagY, width: tagW, transformOrigin: '50% 0', animation: 'air-drop .55s cubic-bezier(.3,.7,.4,1) both',
            padding: L.phone ? '17px 12px 9px' : '20px 16px 12px', background: '#f6e8c6', color: INK, clipPath: 'polygon(16px 0,calc(100% - 16px) 0,100% 16px,100% 100%,0 100%,0 16px)', filter: 'drop-shadow(0 4px 0 rgba(31,27,46,0.3))' }}>
            <span aria-hidden style={{ position: 'absolute', left: 'calc(50% - 6px)', top: 5, width: 12, height: 12, borderRadius: '50%', background: '#fbf6ec', boxShadow: '0 0 0 3px #c79a5b' }} />
            <button onClick={() => setShownTag(false)} aria-label="tuck it away" style={{ position: 'absolute', right: 10, top: 6, fontSize: 21, lineHeight: 1, fontWeight: 800, color: INK, opacity: 0.55 }}>×</button>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.4, opacity: 0.6 }}>PACKED FOR {plain(cityOf(dest!)).toUpperCase()}, {trip!.days.length} {trip!.days.length === 1 ? 'DAY' : 'DAYS'}</div>
            <div style={{ display: 'grid', gridTemplateColumns: L.phone ? '1fr' : '1fr 1fr', gap: L.phone ? '3px' : '6px 16px', marginTop: 6 }}>
              {grouped(packed).map(g => (
                <div key={g.label} style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <img src={g.src} alt="" style={{ flex: 'none', width: 26, height: 22, imageRendering: 'pixelated', filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.25))' }} />
                  <span style={{ flex: 'none', width: 58, fontSize: 9, fontWeight: 800, letterSpacing: 1.2, opacity: 0.55 }}>{g.label.toUpperCase()}</span>
                  <span style={{ minWidth: 0, fontSize: 12.5, fontWeight: 800, lineHeight: 1.2 }}>{g.text}</span>
                </div>
              ))}
            </div>
          </div>
        </OnTop>
      )}
      </div>
      {below > 0 && createPortal(
        <div aria-hidden style={{ position: 'fixed', left: 0, right: 0, bottom: 0, height: below, zIndex: 40, pointerEvents: 'none', imageRendering: 'pixelated',
          background: `repeating-linear-gradient(90deg, #c4beb3 0 ${px}px, transparent ${px}px ${10 * px}px), repeating-linear-gradient(0deg, #c4beb3 0 ${px}px, transparent ${px}px ${5 * px}px), #d6d2c9` }} />,
        document.body,
      )}
    </div>
  );
}
