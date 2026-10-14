'use client';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { api } from './auth';
import { OnTop, type HomeCtx, type PageCtx } from './World';
import type { Outfit } from '../lib/types';
import { sprite } from '../lib/engine';

/** A friend out on the street today, as GET /friends/street sends them. */
interface Friend { id: string; name: string; avatar: Record<string, unknown> | null; outfit: Outfit | null; city: string | null; mood: string | null; score: number | null; condition: string | null; night: boolean; sent: string[] }
interface Post { name: string; mine: boolean; feeling: string; text: string; at: string; city: string | null; condition: string | null; night: boolean; avatar: Record<string, unknown> | null; outfit: Outfit | null }
interface Letter { id: number; seen: boolean; name: string; kind: 'heart' | 'fit'; at: string; city: string | null; condition: string | null; night: boolean }

const draw = sprite as (o: Outfit, mood: string, pose: string, av?: unknown) => string;
const FONT = "'Rethink Sans', sans-serif", INK = '#1c1a28', TAG = '#f6e8c6', WOOD = '#a8743f', WOOD_D = '#7c5129', WOOD_L = '#c99a63';
const CP = 'polygon(0 4px,4px 4px,4px 0,calc(100% - 4px) 0,calc(100% - 4px) 4px,100% 4px,100% calc(100% - 4px),calc(100% - 4px) calc(100% - 4px),calc(100% - 4px) 100%,4px 100%,4px calc(100% - 4px),0 calc(100% - 4px))';
const WET = ['drizzle', 'rain', 'storm', 'hail', 'sleet'], SNOWY = ['snow', 'blizzard'], SUNNY = ['clear', 'partly', 'heat', 'humid'];
const BAND = (s: number) => (s >= 85 ? '#3a9e74' : s >= 70 ? '#7fb556' : s >= 55 ? '#d9b23a' : s >= 40 ? '#e8954f' : '#dd6a58');

/** Little pixel pictures from rows of letters. */
function Pix({ rows, pal, size, style }: { rows: string[]; pal: Record<string, string>; size: number; style?: React.CSSProperties }) {
  const w = Math.max(...rows.map(r => r.length));
  return (
    <svg viewBox={`0 0 ${w} ${rows.length}`} width={w * size} height={rows.length * size} shapeRendering="crispEdges" aria-hidden style={{ display: 'block', ...style }}>
      {rows.flatMap((r, y) => [...r].map((c, x) => (pal[c] ? <rect key={`${x}-${y}`} x={x} y={y} width={1.02} height={1.02} fill={pal[c]} /> : null)))}
    </svg>
  );
}
const CLOUD = ['  oooo   ', ' oLLLLo  ', 'oLLLLLLoo', 'oLLLLLLLo', ' ooooooo '];
const MAILBOX = ['  oooooooo  ', ' oBBBBBBBBo ', 'oBLLLLLLLLBo', 'oBLBBBBBBLBo', 'oBBBBBBBBBBo', 'oBBBBBBBBBBo', 'oDDDDDDDDDDo', ' oooooooooo ', '     oPo    ', '     oPo    ', '     oPo    ', '     oPo    ', '     oPo    ', '    ooPoo   ', '   oPPPPPo  '];
const FLAG = ['oo', 'oRo', 'oRRo', 'oRo', 'o', 'o', 'o'], FLAG_DOWN = ['oooo', 'oRRRo', 'oooo'];

const KEYFRAMES = `@keyframes st-idle{0%,100%{rotate:-1.2deg}50%{rotate:1.2deg}}
  @keyframes st-tick{0%,49%{translate:0 0}50%,100%{translate:0 calc(var(--px) * -1)}}
  @keyframes st-drip{from{translate:0 0;opacity:1}to{translate:0 var(--fall);opacity:0}}
  @keyframes st-a{0%,49%{opacity:1}50%,100%{opacity:0}}
  @keyframes st-b{0%,49%{opacity:0}50%,100%{opacity:1}}
  @keyframes st-drop{from{translate:0 0;opacity:1}to{translate:0 14px;opacity:0}}
  @keyframes st-pop{0%{scale:.4;opacity:0}60%{scale:1.08;opacity:1}100%{scale:1}}
  @keyframes st-flag{0%{rotate:-60deg}60%{rotate:8deg}100%{rotate:0deg}}`;

/**
 * On snug's own street: the mailbox, where hearts and fits from friends arrive as postcards from their cities (its flag
 * goes up when one's waiting), and the friends sign beside it with your link and code. The friends themselves are
 * out at the park (FriendsPark), not wandering about here.
 */
export default function Street({ c, card }: { c: HomeCtx; card?: () => Promise<string | null> }) {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [unread, setUnread] = useState(0); // the flag's up while there's any
  const [panel, setPanel] = useState<'mail' | 'friends' | null>(null);
  const load = () => { api<{ letters: Letter[] }>('/mailbox').then(m => { setLetters(m.letters); setUnread(m.letters.filter(l => !l.seen).length); }).catch(() => {}); };
  useEffect(() => { load(); const iv = setInterval(load, 3 * 60 * 1000); return () => clearInterval(iv); }, []);
  // leaving home: whatever's open closes
  useEffect(() => { if (!c.here) setPanel(null); }, [c.here]);
  const phone = c.pw < 760, setOpen = (_: null) => {};
  const mz = Math.max(3, c.u * (phone ? 0.85 : 0.95)), mx = phone ? 14 : Math.max(24, c.pw * 0.05), my = phone ? c.ground + 72 : c.ground + 2 * c.u;

  return (
    <div style={{ position: 'absolute', inset: 0, fontFamily: FONT }}>
      <style>{KEYFRAMES}</style>

      {/* the mailbox, its flag up when something's waiting; the friends sign beside it */}
      <button onClick={() => { setPanel(p => (p === 'mail' ? null : 'mail')); setOpen(null); if (unread) { setUnread(0); api('/mailbox/seen', {}).catch(() => {}); } }} aria-label={unread ? `mailbox: ${unread} waiting` : 'mailbox'}
        style={{ position: 'absolute', left: mx, top: my - 15 * mz, pointerEvents: 'auto' }}>
        <Pix rows={MAILBOX} pal={{ o: INK, B: '#4f7fbf', L: '#7fa6d8', D: '#3a5f94', P: WOOD_D }} size={mz} />
        <span style={{ position: 'absolute', left: 11 * mz, top: (unread ? -5 : 2) * mz, transformOrigin: '0 100%', animation: unread ? 'st-flag .6s cubic-bezier(.3,1.4,.5,1) both' : undefined }}>
          <Pix rows={unread ? FLAG : FLAG_DOWN} pal={{ o: INK, R: '#d9483b' }} size={mz} />
        </span>
      </button>
      <button onClick={() => { setPanel(p => (p === 'friends' ? null : 'friends')); setOpen(null); }} aria-label="friends"
        style={{ position: 'absolute', left: mx + 19 * mz, top: my - 13 * mz, pointerEvents: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span style={{ padding: mz * 0.8, background: INK, clipPath: CP }}>
          <span style={{ display: 'block', padding: `${mz * 0.6}px ${mz * 1.6}px`, background: WOOD, clipPath: CP, color: '#fff1d2', fontSize: Math.max(11, mz * 3.4), fontWeight: 800, textShadow: `0 2px 0 ${WOOD_D}`, boxShadow: `inset 0 ${mz * 0.5}px 0 ${WOOD_L}` }}>friends</span>
        </span>
        <span style={{ width: mz * 1.4, height: mz * 6, background: WOOD_D, boxShadow: `inset ${mz * 0.4}px 0 0 ${WOOD}` }} />
      </button>

      {/* the mailbox's postcards, the friends sign's board: pinned up over them */}
      {panel && c.here && (
        <OnTop>
          <div style={{ position: 'absolute', left: phone ? 10 : mx + 40, top: my - 15 * mz - 10, translate: '0 -100%', width: phone ? c.pw - 20 : 316, fontFamily: FONT, animation: 'st-pop .3s cubic-bezier(.3,1.4,.5,1) both', transformOrigin: '15% 100%' }}>
            <Board title={panel === 'mail' ? 'mailbox' : 'friends on your street'} onClose={() => setPanel(null)}>
              {panel === 'mail' ? <Mail letters={letters} onToss={id => { setLetters(ls => ls.filter(l => l.id !== id)); api('/mailbox/discard', { id }).catch(() => {}); }} /> : <Friends card={card} />}
            </Board>
          </div>
        </OnTop>
      )}
    </div>
  );
}

/** The portal, in pixels: a thick steel ring round a dark screen, on a stand. */
function Portal({ size }: { size: number }) {
  const cells = useMemo(() => {
    const out: [number, number, string][] = [];
    for (let y = 0; y < 52; y++) for (let x = 0; x < 52; x++) {
      const d = Math.hypot(x + 0.5 - 26, y + 0.5 - 26);
      if (d > 25.5) continue;
      out.push([x, y, d > 24.5 ? INK : d > 22 ? (y < 22 && x < 26 ? '#9aa3b0' : '#6b7482') : d > 21 ? INK : '']);
    }
    return out.filter(c => c[2]);
  }, []);
  return (
    <svg viewBox="0 0 52 60" width={52 * size} height={60 * size} shapeRendering="crispEdges" aria-hidden style={{ display: 'block' }}>
      <circle cx="26" cy="26" r="23" fill="#0f1b2e" />
      <circle cx="26" cy="26" r="23" fill="url(#portal-glow)" />
      <defs><radialGradient id="portal-glow"><stop offset="0%" stopColor="rgba(120,220,255,0.35)" /><stop offset="100%" stopColor="rgba(120,220,255,0)" /></radialGradient></defs>
      {cells.map(([x, y, c], i) => <rect key={i} x={x} y={y} width={1} height={1} fill={c} />)}
      <rect x="22" y="50" width="8" height="7" fill={INK} /><rect x="23" y="50" width="6" height="7" fill="#6b7482" />
      <rect x="14" y="56" width="24" height="4" fill={INK} /><rect x="15" y="56" width="22" height="3" fill="#8f99a8" />
    </svg>
  );
}

/** Words curving round the inside of the portal's ring like a badge: one over the top, one under the bottom (reading the
 * right way up), drawn in Rethink Sans a touch under full resolution so they're a little low-res. */
function ArcText({ top, bottom, size }: { top: string; bottom: string; size: number }) {
  const cv = useRef<HTMLCanvasElement>(null), F = 1.5, n = Math.round(size / F);
  useEffect(() => {
    const g = cv.current?.getContext('2d');
    if (!g) return;
    let live = true;
    document.fonts.ready.then(() => {
      if (!live) return;
      g.clearRect(0, 0, n, n);
      const arc = (text: string, px: number, color: string, under: boolean) => {
        g.font = `800 ${px}px ${FONT}`; g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle';
        const r = n * (under ? 0.36 : 0.37), ws = [...text].map(ch => g.measureText(ch).width), total = ws.reduce((a, b) => a + b, 0) + (text.length - 1) * px * 0.06;
        let a = (under ? Math.PI / 2 : -Math.PI / 2) + (under ? 1 : -1) * (total / 2) / r;
        [...text].forEach((ch, k) => {
          const half = ws[k] / 2 / r; a += (under ? -1 : 1) * half;
          g.save(); g.translate(n / 2 + Math.cos(a) * r, n / 2 + Math.sin(a) * r); g.rotate(a + (under ? -Math.PI / 2 : Math.PI / 2)); g.fillText(ch, 0, 0); g.restore();
          a += (under ? -1 : 1) * (half + (px * 0.06) / r);
        });
      };
      arc(top, n * 0.12, '#9ff2e0', false);
      arc(bottom, n * 0.095, '#fff6e2', true);
    });
    return () => { live = false; };
  }, [top, bottom, n]);
  return <canvas ref={cv} width={n} height={n} style={{ position: 'absolute', inset: 0, width: size, height: size, imageRendering: 'pixelated', pointerEvents: 'none' }} />;
}

/** A friend's face, cropped from their snug: their head and shoulders in today's fit. */
function Face({ p, size }: { p: { outfit: Outfit | null; avatar: Record<string, unknown> | null }, size: number }) {
  const src = useMemo(() => draw({ ...(p.outfit ?? { top: 'tee', outer: 'none', bottom: 'pants', acc: [] }), acc: (p.outfit?.acc ?? []).filter(a => a !== 'umbrella') }, 'happy', 'stand', p.avatar ?? undefined), [p]);
  return (
    <span style={{ display: 'block', width: size, height: size, overflow: 'hidden', position: 'relative', flex: 'none' }}>
      <img src={src} alt="" style={{ position: 'absolute', left: -size * (1.64 * 20 / 46 - 0.5), top: -size * 0.02, width: size * 1.64, height: size * 2.07, imageRendering: 'pixelated' }} />
    </span>
  );
}

const ago = (iso: string) => { const m = Math.max(0, Math.round((Date.now() - Date.parse(iso + 'Z')) / 60000)); return m < 1 ? 'now' : m < 60 ? `${m}m` : m < 1440 ? `${Math.round(m / 60)}h` : `${Math.round(m / 1440)}d`; };
const CP6 = 'polygon(0 12px,6px 12px,6px 6px,12px 6px,12px 0,calc(100% - 12px) 0,calc(100% - 12px) 6px,calc(100% - 6px) 6px,calc(100% - 6px) 12px,100% 12px,100% calc(100% - 12px),calc(100% - 6px) calc(100% - 12px),calc(100% - 6px) calc(100% - 6px),calc(100% - 12px) calc(100% - 6px),calc(100% - 12px) 100%,12px 100%,12px calc(100% - 6px),6px calc(100% - 6px),6px calc(100% - 12px),0 calc(100% - 12px))';

const PLANE = ['oo     ', 'oWoo   ', 'oWWWoo ', 'oWWWWWo', 'oWWwoo ', 'oWwo   ', 'oo     '];
/** The feed, on a pixel phone, like a group chat of how everyone's feeling: your card up top (your face, today's
 * feeling from your forecast, a line to send), then everyone's latest as speech bubbles from their faces (yours on the
 * right). */
function Feed({ posts, onPosted, onClose, pw, ph, feeling, me }: { posts: Post[]; onPosted: () => void; onClose: () => void; pw: number; ph: number; feeling: string; me?: { outfit?: Outfit; condition?: string; night?: boolean } }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const W = Math.min(330, pw - 28), H = Math.min(610, ph - 60);
  const post = () => {
    if (busy || !feeling || !text.trim()) return;
    setBusy(true);
    api('/friends/status', { feeling, text: text.trim() }).then(() => { setText(''); onPosted(); }).catch(() => {}).finally(() => setBusy(false));
  };
  const SCREEN = '#efe7d4';
  return (
    <div style={{ position: 'absolute', left: (pw - W) / 2, top: Math.max(16, (ph - H) / 2), width: W, height: H, fontFamily: FONT, animation: 'st-pop .35s cubic-bezier(.3,1.4,.5,1) both', filter: 'drop-shadow(0 6px 0 rgba(20,10,4,0.3))' }}>
      {/* close: a chunky pixel button on the phone's corner, easy to hit with a thumb */}
      <button onClick={onClose} aria-label="close" style={{ position: 'absolute', right: -12, top: -12, zIndex: 1, width: 40, height: 40, padding: 3, background: INK, clipPath: CP2 }}>
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: TAG, clipPath: CP2, boxShadow: 'inset 0 -3px 0 #e2d2ad', color: INK, fontSize: 24, fontWeight: 800, lineHeight: 1 }}>×</span>
      </button>
      <div style={{ position: 'absolute', inset: 0, padding: 4, background: INK, clipPath: CP6 }}>
        <div style={{ position: 'relative', height: '100%', padding: '22px 9px 30px', background: '#3a3f4a', clipPath: CP6, boxShadow: 'inset 3px 3px 0 #555c69' }}>
          <span aria-hidden style={{ position: 'absolute', left: '50%', top: 9, width: 44, height: 5, marginLeft: -22, background: INK }} />
          <span aria-hidden style={{ position: 'absolute', left: '50%', bottom: 7, width: 16, height: 16, marginLeft: -8, background: '#2b2f3a', boxShadow: `0 0 0 3px ${INK}` }} />
          <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', background: SCREEN, clipPath: CP2, boxShadow: `inset 0 0 0 3px ${INK}` }}>
            {/* you: face, today's feeling, what's up */}
            <div style={{ padding: '12px 12px 11px', background: '#fffaf0', boxShadow: `inset 0 -3px 0 ${INK}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ padding: 2, background: '#fffaf0', boxShadow: `0 0 0 2px ${INK}` }}><Face p={{ outfit: me?.outfit ?? null, avatar: null }} size={38} /></span>
                <div style={{ lineHeight: 1.15 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, opacity: 0.5, color: INK }}>TODAY YOU&apos;RE</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 19, fontWeight: 800, color: INK }}>{feeling || '…'} <Sky cond={me?.condition ?? null} night={!!me?.night} size={3} /></div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 7, marginTop: 10, alignItems: 'stretch' }}>
                <div style={{ flex: 1, minWidth: 0, padding: 2, background: INK, clipPath: CP2 }}>
                  <input value={text} onChange={e => setText(e.target.value.slice(0, 140))} onKeyDown={e => e.key === 'Enter' && post()} placeholder="what's up?" aria-label="what's up"
                    style={{ display: 'block', width: '100%', padding: '7px 10px', background: '#ffffff', clipPath: CP2, border: 0, fontSize: 16, fontWeight: 700, fontFamily: FONT, color: INK, outline: 'none' }} />
                </div>
                <button onClick={post} disabled={busy || !text.trim()} aria-label="send" style={{ flex: 'none', width: 42, padding: 2, background: INK, clipPath: CP2, opacity: text.trim() ? 1 : 0.45 }}>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#5b8def', clipPath: CP2, boxShadow: 'inset 0 3px 0 #8fb3f5' }}>
                    <Pix rows={PLANE} pal={{ o: INK, W: '#ffffff', w: '#c9d8f5' }} size={3} />
                  </span>
                </button>
              </div>
            </div>
            {/* everyone's latest, like texts */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 10px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {!posts.length && <div style={{ padding: 18, textAlign: 'center', fontSize: 14, fontWeight: 700, color: INK, opacity: 0.6 }}>quiet in here. say what&apos;s up!</div>}
              {posts.slice(0, 12).map((p, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexDirection: p.mine ? 'row-reverse' : 'row' }}>
                  <span style={{ flex: 'none', padding: 2, background: '#fffaf0', boxShadow: `0 0 0 2px ${INK}` }}><Face p={p} size={26} /></span>
                  <div style={{ maxWidth: '78%', display: 'flex', flexDirection: 'column', alignItems: p.mine ? 'flex-end' : 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 800, color: INK, opacity: 0.6, marginBottom: 3 }}>
                      <span>{p.mine ? 'you' : p.name}</span><span style={{ fontWeight: 700 }}>feeling {p.feeling}</span><Sky cond={p.condition} night={p.night} size={1.6} /><span style={{ fontWeight: 700 }}>{ago(p.at)}</span>
                    </div>
                    <div style={{ padding: 2, background: INK, clipPath: CP2 }}>
                      <div style={{ padding: '7px 10px', clipPath: CP2, background: p.mine ? '#5b8def' : '#ffffff', color: p.mine ? '#ffffff' : INK, fontSize: 14, fontWeight: 700, lineHeight: 1.3, overflowWrap: 'anywhere' }}>
                        {p.text || <i style={{ opacity: 0.7 }}>feeling {p.feeling}</i>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** One friend at the park: their snug in today's outfit, their weather over or on them, swaying a little. */
function Friendly({ f, z, w, h, x, feet, i, onTap, setEl }: {
  f: Friend; z: number; w: number; h: number; x: number; feet: number; i: number; onTap: () => void; setEl: (el: HTMLDivElement | null) => void;
}) {
  const src = useMemo(() => {
    const o: Outfit = f.outfit ?? { top: 'tee', outer: 'none', bottom: 'pants', acc: [] };
    // out in the sun: sunglasses on; out in the rain or snow, its own little cloud overhead instead of an umbrella
    const acc = [...o.acc.filter(a => a !== 'umbrella' && (a !== 'sunglasses' || !f.night))];
    if (SUNNY.includes(f.condition ?? '') && !f.night && !acc.includes('sunglasses')) acc.push('sunglasses');
    const s = f.score ?? 60, mood = s >= 75 ? 'happy' : s >= 55 ? 'content' : s >= 40 ? 'meh' : 'grumpy';
    return draw({ ...o, acc }, mood, 'stand', f.avatar ?? {});
  }, [f]);
  const world = worldOf(f), look = useWorld(src, world);
  return (
    <div ref={setEl} style={{ position: 'absolute', left: x, top: feet - h, width: w, height: h }}>
      {world === 'wet' && <Pix rows={PUDDLE} pal={{ b: '#5b8def', l: '#9cc1ff' }} size={z} style={{ position: 'absolute', left: (20 - 7) * z, top: h - 2.5 * z, opacity: 0.85 }} />}
      <button onClick={onTap} aria-label={`${f.name}${f.city ? ` in ${f.city}` : ''}`} style={{ position: 'absolute', inset: 0, cursor: 'pointer' }}>
        {world === 'glow' && <span aria-hidden style={{ position: 'absolute', left: -w * 0.25, top: -h * 0.1, width: w * 1.5, height: h * 1.2, background: 'radial-gradient(closest-side, rgba(255,214,90,0.55), rgba(255,214,90,0.18) 60%, rgba(255,214,90,0))', animation: 'st-a 1.4s steps(1) infinite alternate', pointerEvents: 'none' }} />}
        <img src={look} alt="" style={{ position: 'relative', display: 'block', width: w, height: h, imageRendering: 'pixelated', filter: world === 'grey' ? 'saturate(.7) brightness(.94)' : world === 'night' ? 'brightness(.82) saturate(.85) hue-rotate(-8deg)' : world === 'glow' ? 'drop-shadow(0 0 6px rgba(255,200,60,0.85))' : undefined, transformOrigin: '50% 100%', animation: `st-idle ${3.2 + (i % 3) * 0.6}s ${-i * 0.7}s ease-in-out infinite` }} />
      </button>
      <Bits world={world} z={z} i={i} />
      <Headspace f={f} z={z} w={w} />
    </div>
  );
}

type World = 'glow' | 'snow' | 'wet' | 'sweat' | 'grey' | 'night' | null;
/** How their day is landing on them: glowing in the sun, snowed on, soaked, sweating, washed out, moonlit. */
const worldOf = (f: Friend): World => {
  const c = f.condition ?? '';
  if (SNOWY.includes(c)) return 'snow';
  if (WET.includes(c)) return 'wet';
  if (f.night) return 'night';
  if (['heat', 'humid'].includes(c) && (f.score ?? 60) < 60) return 'sweat';
  if (SUNNY.includes(c) && (f.score ?? 0) >= 72) return 'glow';
  if (GREY.includes(c)) return 'grey';
  return null;
};
const PUDDLE = ['   bbbbbbbb   ', ' bbllbbbbbbbb ', 'bbbbbbbbbbllbb', ' bbbbbbbbbbbb '];
const WORLDS: Record<string, string> = {};
/** Their snug with the day on it, drawn into its own pixels: a warm glowing edge round them in the sun; snow lying on
 * the top of their head and shoulders; in the rain, darker and cooler, soaked, a few wet highlights. */
function useWorld(src: string, world: World): string {
  const key = `${world}|${src}`, [out, setOut] = useState(() => WORLDS[key] ?? src);
  useEffect(() => {
    if (!world || !['glow', 'snow', 'wet'].includes(world)) { setOut(src); return; }
    if (WORLDS[key]) { setOut(WORLDS[key]); return; }
    let live = true;
    const img = new Image();
    img.onload = () => {
      // back down to snug's own pixels (the sprite comes drawn up large), so the weather's drawn pixel for pixel with it
      const W = 46, H = 58, cv = document.createElement('canvas');
      cv.width = W; cv.height = H;
      const g = cv.getContext('2d')!;
      g.imageSmoothingEnabled = false;
      g.drawImage(img, 0, 0, W, H);
      const d = g.getImageData(0, 0, W, H), a = (x: number, y: number) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : d.data[(y * W + x) * 4 + 3]);
      const put = (x: number, y: number, [r, gg, b]: number[], al = 255) => { if (x < 0 || y < 0 || x >= W || y >= H) return; const k = (y * W + x) * 4; d.data[k] = r; d.data[k + 1] = gg; d.data[k + 2] = b; d.data[k + 3] = al; };
      const solid = Array.from({ length: W * H }, (_, k) => d.data[k * 4 + 3] > 40);
      const isSolid = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H && solid[y * W + x];
      const dark = (x: number, y: number) => { const k = (y * W + x) * 4; return d.data[k] + d.data[k + 1] + d.data[k + 2] < 150; }; // the ink outline
      const mix = (k: number, [r, gg, b]: number[], t: number) => { d.data[k] = d.data[k] * (1 - t) + r * t; d.data[k + 1] = d.data[k + 1] * (1 - t) + gg * t; d.data[k + 2] = d.data[k + 2] * (1 - t) + b * t; };
      if (world === 'glow') {
        // three rings of warm light round their outline, strongest next to them, and warmer colours all over
        const ring = (x: number, y: number, r: number) => { for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (Math.abs(dx) + Math.abs(dy) <= r && isSolid(x + dx, y + dy)) return true; return false; };
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
          if (isSolid(x, y)) { mix((y * W + x) * 4, [255, 214, 120], 0.12); continue; }
          if (ring(x, y, 1)) put(x, y, [255, 200, 60], 255); else if (ring(x, y, 2)) put(x, y, [255, 222, 110], 190); else if (ring(x, y, 3)) put(x, y, [255, 238, 170], 90);
        }
      } else if (world === 'snow') {
        // frozen: icy blue all over (the ink outline stays ink), a thick cap of snow on the head, snow on the shoulders,
        // icicles hanging off the arms and the hem
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (isSolid(x, y) && !dark(x, y)) mix((y * W + x) * 4, [150, 205, 240], 0.42);
        // where each column's top is; the head is the run of columns topping out high up
        const tops = Array.from({ length: W }, (_, x) => { for (let y = 0; y < H * 0.7; y++) if (isSolid(x, y)) return y; return -1; });
        const head = tops.map((t, x) => (t >= 0 && t < 10 ? x : -1)).filter(x => x >= 0), x0 = Math.min(...head), x1 = Math.max(...head);
        tops.forEach((t, x) => {
          if (t < 0) return;
          const onHead = x >= x0 && x <= x1;
          // a rounded mound over the top of the head (deepest in the middle), a thinner layer on the shoulders and
          // arms; laid over their top edge, inside the outline (there's no room above the head in the sprite)
          const deep = onHead ? 2 + Math.round(2 * Math.sin((Math.PI * (x - x0 + 0.5)) / (x1 - x0 + 1))) : 1;
          for (let k = 1; k <= deep; k++) if (isSolid(x, t + k)) put(x, t + k, k === deep ? [196, 220, 244] : [255, 255, 255]);
          if (isSolid(x, t + deep + 1)) put(x, t + deep + 1, [150, 190, 228]);
        });
        for (let x = 0; x < W; x++) for (let y = 16; y < H - 4; y++) {
          if (!isSolid(x, y) || isSolid(x, y + 1) || (x + y) % 3) continue;
          const len = 2 + ((x * 5 + y) % 3);
          for (let k = 1; k <= len; k++) { put(x, y + k, k === len ? [120, 190, 235] : [230, 247, 255]); if (k < len) { put(x - 1, y + k, [28, 26, 40]); put(x + 1, y + k, [28, 26, 40]); } }
          put(x, y + len + 1, [28, 26, 40]);
        }
      } else if (world === 'wet') {
        // soaked through: darker and cooler (the ink outline stays ink), hair slicked with a sheen, water beading on them
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (isSolid(x, y) && !dark(x, y)) mix((y * W + x) * 4, [40, 80, 150], 0.32);
        for (let x = 0; x < W; x++) for (let y = 1; y < 12; y++) if (isSolid(x, y) && !isSolid(x, y - 1)) { if (x % 2) put(x, y + 1, [200, 228, 255]); break; }
        [[13, 8], [27, 6], [11, 24], [30, 27], [17, 33], [25, 36], [14, 43], [28, 45]].forEach(([x, y]) => {
          if (!isSolid(x, y) || !isSolid(x, y + 2)) return;
          put(x, y - 1, [28, 26, 40]); put(x - 1, y, [28, 26, 40]); put(x + 1, y, [28, 26, 40]); put(x - 1, y + 1, [28, 26, 40]); put(x + 1, y + 1, [28, 26, 40]); put(x, y + 2, [28, 26, 40]);
          put(x, y, [255, 255, 255]); put(x, y + 1, [111, 168, 232]);
        });
      }
      g.putImageData(d, 0, 0);
      WORLDS[key] = cv.toDataURL();
      if (live) setOut(WORLDS[key]);
    };
    img.src = src;
    return () => { live = false; };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return out;
}

/** What's going on around them, in ticks: sparkles in the sun, snow falling, drips off them in the rain, sweat. */
function Bits({ world, z, i }: { world: World; z: number; i: number }) {
  if (!world || world === 'grey' || world === 'night') return null;
  const P = Math.max(2, Math.round(z));
  const at: [number, number][] = world === 'glow' ? [[6, 4], [34, 9], [3, 26], [37, 30], [20, -3]] : world === 'snow' ? [[6, 4], [34, 10], [10, 22], [36, 30], [4, 40]] : world === 'wet' ? [[9, 12], [31, 12], [10, 38], [31, 38], [15, 50], [25, 50]] : [[13, 9], [29, 11]];
  return (
    <>
      {at.map(([x, y], k) => {
        const delay = `${-((k * 0.37 + i * 0.21) % 1.2).toFixed(2)}s`;
        if (world === 'glow') return (
          <span key={k} aria-hidden style={{ position: 'absolute', left: x * z, top: y * z, width: P * 3, height: P * 3, pointerEvents: 'none', animation: `st-a 1.2s ${delay} steps(1) infinite` }}>
            <span style={{ position: 'absolute', left: P, top: 0, width: P, height: P * 3, background: '#fff3b0' }} /><span style={{ position: 'absolute', left: 0, top: P, width: P * 3, height: P, background: '#fff3b0' }} />
          </span>
        );
        if (world === 'snow') return <span key={k} aria-hidden style={{ position: 'absolute', left: x * z, top: y * z, width: P, height: P, background: '#ffffff', boxShadow: '0 0 0 1px rgba(28,26,40,0.25)', pointerEvents: 'none', ['--fall' as string]: `${P * 6}px`, animation: `st-drip 1.6s ${delay} steps(6) infinite` }} />;
        if (world === 'wet') return <span key={k} aria-hidden style={{ position: 'absolute', left: x * z, top: y * z, width: P, height: P * 2, background: '#6fa8e8', pointerEvents: 'none', ['--fall' as string]: `${P * 5}px`, animation: `st-drip .9s ${delay} steps(4) infinite` }} />;
        return <span key={k} aria-hidden style={{ position: 'absolute', left: x * z, top: y * z, width: P, height: P * 2, background: '#bfe3ff', pointerEvents: 'none', ['--fall' as string]: `${P * 3}px`, animation: `st-drip 1.3s ${delay} steps(3) infinite` }} />;
      })}
    </>
  );
}

const GREY = ['cloudy', 'overcast', 'fog', 'smoke'];
const SUN = [['    y    ', '    y    ', '   ooo   ', '  oYYYo  ', 'yyoYYYoyy', '  oYYYo  ', '   ooo   ', '    y    ', '    y    '],
  [' y     y ', '  y   y  ', '   ooo   ', '  oYYYo  ', '  oYYYo  ', '  oYYYo  ', '   ooo   ', '  y   y  ', ' y     y ']];
const MOON = ['  ooo ', ' oMMo ', 'oMMo  ', 'oMMo  ', 'oMMo  ', ' oMMo ', '  ooo '];
/** A glimpse of someone's headspace, over their head (snug's head is centred at x 20 of its 46): a rain cloud, a snow
 * cloud, a grey cloud, or (on an amazing day) the sun, or the moon at night. All of it moving in ticks, like pixels do. */
function Headspace({ f, z, w }: { f: Friend; z: number; w: number }) {
  const c = f.condition ?? '', wet = WET.includes(c), snowy = SNOWY.includes(c), grey = GREY.includes(c), great = (f.score ?? 0) >= 78 && !wet && !snowy;
  const S = Math.max(2, Math.round(z * 2.2)), mid = (w * 20) / 46, top = -z * 21;
  const tick: React.CSSProperties = { ['--px' as string]: `${S}px`, animation: 'st-tick 1.2s steps(1) infinite' };
  if (wet || snowy || grey) return (
    <div aria-hidden style={{ position: 'absolute', left: mid - 4.5 * S, top, pointerEvents: 'none', ...tick }}>
      <Pix rows={CLOUD} pal={{ o: '#2b2f3a', L: snowy ? '#f4f8ff' : grey ? '#c4cad3' : '#a9b2c0' }} size={S} />
      {(wet || snowy) && [0, 1, 2].map(k => (
        <span key={k} style={{ position: 'absolute', left: (1.5 + k * 2.5) * S, top: 5 * S, width: S, height: snowy ? S : 2 * S, background: snowy ? '#ffffff' : '#4f8fe0', boxShadow: `0 0 0 1px #2b2f3a`,
          ['--fall' as string]: `${S * 4}px`, animation: `st-drip ${snowy ? 1.5 : 0.75}s ${k * (snowy ? 0.5 : 0.25)}s steps(4) infinite` }} />
      ))}
    </div>
  );
  if (!great) return null;
  if (f.night) return <div aria-hidden style={{ position: 'absolute', left: mid - 3 * S, top, pointerEvents: 'none', ...tick }}><Pix rows={MOON} pal={{ o: '#2b2f3a', M: '#f6efc8' }} size={S} /></div>;
  return (
    <div aria-hidden style={{ position: 'absolute', left: mid - 4.5 * S, top, pointerEvents: 'none' }}>
      {SUN.map((rows, k) => <Pix key={k} rows={rows} pal={{ o: '#b9741c', Y: '#ffd24a', y: '#f2b632' }} size={S} style={{ position: k ? 'absolute' : 'relative', left: 0, top: 0, animation: `${k ? 'st-b' : 'st-a'} 1s steps(1) infinite` }} />)}
    </div>
  );
}

const BENCH = ['oooooooooooooooooo', 'olllllllllllllllll'.slice(0, 17) + 'o', 'oddddddddddddddddo', 'oooooooooooooooooo', 'owwwwwwwwwwwwwwwwo', 'oooooooooooooooooo', ' om            mo ', ' om            mo ', ' om            mo '];
const LAMP = [' ooooo ', 'ogggggo', 'ogggggo', ' ooooo ', '   o   ', '  omo  ', '  omo  ', '  omo  ', '  omo  ', '  omo  ', '  omo  ', '  omo  ', '  omo  ', '  omo  ', '  omo  ', '  omo  ', '  omo  ', '  omo  ', '  omo  ', '  omo  ', '  omo  ', '  omo  ', '  omo  ', '  omo  ', '  omo  ', '  omo  ', ' ooooo ', 'ommmmmo', 'ooooooo', '       '];

/**
 * The park, a calm spot in town where friends who opened snug today hang out, each in their real outfit for the day and
 * their own weather (a rain cloud over the one where it's raining, sunglasses on the one in the sun), swaying a little.
 * Tap one: who, where, how their day feels, and a heart or a fit to send them. In the middle, the portal: a round
 * screen with what everyone's feeling going round on it; tap it for the feed, and say how you're feeling.
 */
export const parkSnugAt = (c: PageCtx) => Math.round(c.pw < 760 ? 2 : c.pw * 0.04);
export function FriendsPark({ ctx, feeling, me }: { ctx: PageCtx; feeling?: string; me?: { outfit?: Outfit; condition?: string; night?: boolean } }) {
  const [friends, setFriends] = useState<Friend[] | null>(null);
  const [open, setOpen] = useState<{ id: string; x: number; y: number } | null>(null);
  const refs = useRef<Record<string, HTMLDivElement | null>>({});
  useEffect(() => { if (ctx.arrived) api<Friend[]>('/friends/street').then(setFriends).catch(() => setFriends([])); else setOpen(null); }, [ctx.arrived]);
  useEffect(() => { api<Friend[]>('/friends/street').then(setFriends).catch(() => setFriends([])); }, []);
  const c = { pw: ctx.pw, here: ctx.arrived };
  const phone = ctx.pw < 760, k = phone ? 0.46 : 0.66, z = ctx.u * k, w = 46 * z, h = 58 * z;
  const list = friends ?? [], n = Math.max(1, list.length);
  const sel = list.find(f => f.id === open?.id);
  const react = (f: Friend, kind: 'heart' | 'fit') => {
    if (f.sent.includes(kind)) return;
    setFriends(fs => (fs ?? []).map(x => (x.id === f.id ? { ...x, sent: [...x.sent, kind] } : x)));
    api('/friends/react', { to: f.id, kind }).catch(() => setFriends(fs => (fs ?? []).map(x => (x.id === f.id ? { ...x, sent: x.sent.filter(s => s !== kind) } : x))));
  };
  const tap = (f: Friend, x: number, y: number) => setOpen(o => (o?.id === f.id ? null : { id: f.id, x, y }));
  const bench = Math.max(3, ctx.u * 0.9);
  // the portal: how each friend's day is going, cycling on its screen; tap it for the feed (and to post your own)
  const [posts, setPosts] = useState<Post[]>([]);
  const [feedOpen, setFeedOpen] = useState(false);
  const [shown, setShown] = useState(0);
  const loadFeed = () => api<Post[]>('/friends/feed').then(setPosts).catch(() => {});
  useEffect(() => { if (ctx.arrived) loadFeed(); else setFeedOpen(false); }, [ctx.arrived]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const iv = setInterval(() => setShown(x => x + 1), 3600); return () => clearInterval(iv); }, []);
  const D = phone ? Math.min(ctx.pw * 0.44, 180) : Math.min(300, ctx.ph * 0.4), ps = D / 52, pcx = phone ? ctx.pw * 0.7 : ctx.pw * 0.52, pTop = ctx.ground - 2 * ctx.u - 60 * ps;
  const now = list.length ? list[shown % list.length] : null; // the portal goes round today's friends, each with their day's title
  // where friends stand: either side of the portal on a computer; a row further back on a phone
  const slots = phone ? list.map((_, i) => ctx.pw * (0.22 + (0.74 * (i + 0.5)) / n))
    : list.map((_, i) => { const L = Math.max(1, Math.ceil(n / 2)), left = i < L, j = left ? i : i - L, m = left ? L : n - L;
      return left ? ctx.pw * 0.2 + ((pcx - D / 2 - 20 - ctx.pw * 0.2) * (j + 0.5)) / m : pcx + D / 2 + 20 + ((ctx.pw * 0.96 - pcx - D / 2 - 20) * (j + 0.5)) / m; });
  return (
    <div style={{ position: 'absolute', inset: 0, fontFamily: FONT }}>
      <style>{KEYFRAMES}</style>
      {/* the park itself: a bench and a lamp */}
      <div aria-hidden style={{ position: 'absolute', left: phone ? ctx.pw * 0.62 : ctx.pw * 0.12, top: ctx.ground - 8 * bench - 6 * ctx.u }}>
        <Pix rows={BENCH} pal={{ o: INK, w: WOOD, d: WOOD_D, l: WOOD_L, m: '#3a3f4a' }} size={bench} />
      </div>
      <div aria-hidden style={{ position: 'absolute', left: phone ? ctx.pw * 0.08 : ctx.pw * 0.24, top: ctx.ground - 30 * bench - 6 * ctx.u }}>
        <Pix rows={LAMP} pal={{ o: INK, m: '#3a3f4a', g: '#fff2c8' }} size={bench} />
      </div>
      {list.map((f, i) => {
        // on a phone they stand along the front, below snug and the portal, so nobody's hidden
        const x = slots[i] - w / 2, feet = phone ? Math.min(ctx.ground + 150, ctx.ph - 24) - (i % 2) * 8 : ctx.ground - (2 + (i % 2) * 3) * ctx.u;
        return (
          <Friendly key={f.id} f={f} z={z} w={w} h={h} x={x} feet={feet} i={i} setEl={el => { refs.current[f.id] = el; }} onTap={() => tap(f, x + w / 2, feet - h)} />
        );
      })}
      {/* the portal: a round screen on a stand, what everyone's feeling going round on it */}
      <button onClick={() => { setFeedOpen(true); setOpen(null); }} aria-label="the portal: see what friends are up to" style={{ position: 'absolute', left: pcx - 26 * ps, top: pTop, width: 52 * ps, height: 60 * ps, cursor: 'pointer' }}>
        <Portal size={ps} />
        <span style={{ position: 'absolute', left: 5 * ps, top: 5 * ps, width: 42 * ps, height: 42 * ps, borderRadius: '50%', overflow: 'hidden' }}>
          <span key={list.length > 1 ? shown : 0} style={{ position: 'absolute', inset: 0, animation: 'st-pop .4s cubic-bezier(.3,1.4,.5,1) both' }}>
            {now && (
              <span style={{ position: 'absolute', left: '50%', top: '50%', translate: '-50% -50%', padding: Math.max(3, ps * 1.4), borderRadius: '50%', background: 'rgba(159,242,224,0.14)', boxShadow: `0 0 0 ${Math.max(2, ps * 0.5)}px rgba(159,242,224,0.35)` }}>
                <span style={{ display: 'block', borderRadius: '50%', overflow: 'hidden' }}><Face p={now} size={Math.round(ps * 12)} /></span>
              </span>
            )}
            {/* (and when nobody's been by, it says so) */}
            <ArcText top={now ? now.name : friends ? 'no friends out' : "what's everyone"} bottom={now ? `feeling ${(now.mood ?? 'okay').toLowerCase()}` : friends ? 'today yet' : 'feeling?'} size={42 * ps} />
          </span>
        </span>
      </button>
      {/* a friend's speech bubble: who, where, how their day feels; a heart or a fit to send */}
      {sel && open && c.here && (
        <OnTop>
          <div style={{ position: 'absolute', left: Math.max(8, Math.min(c.pw - 204, open.x - 98)), top: open.y - 128, width: 196, animation: 'st-pop .35s cubic-bezier(.3,1.4,.5,1) both', transformOrigin: '50% 100%', fontFamily: FONT, filter: 'drop-shadow(0 4px 0 rgba(20,10,4,0.28))' }}>
            <div style={{ padding: 3, background: INK, clipPath: CP }}>
              <div style={{ position: 'relative', padding: '8px 10px 9px', background: '#fffaf0', clipPath: CP, color: INK }}>
                <button onClick={() => setOpen(null)} aria-label="close" style={{ position: 'absolute', right: 7, top: 3, fontSize: 17, fontWeight: 800, color: INK, opacity: 0.45 }}>×</button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sky cond={sel.condition} night={sel.night} size={2} />
                  <span style={{ fontSize: 15, fontWeight: 800 }}>{sel.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.55 }}>{sel.city ?? 'somewhere'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 6 }}>
                  <span style={{ padding: '1px 7px', background: BAND(sel.score ?? 50), color: '#fff', fontSize: 13, fontWeight: 800, clipPath: CP2, textShadow: '0 1px 0 rgba(0,0,0,0.25)' }}>{sel.score}</span>
                  <span style={{ fontSize: 13.5, fontWeight: 700 }}>{sel.mood}</span>
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  {(['heart', 'fit'] as const).map(kind => {
                    const sent = sel.sent.includes(kind);
                    return (
                      <button key={kind} onClick={() => react(sel, kind)} disabled={sent} aria-label={kind === 'heart' ? 'send a heart' : 'love their fit'}
                        style={{ flex: 1, padding: 2, background: INK, clipPath: CP2 }}>
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '4px 0', background: sent ? '#3f6b58' : TAG, clipPath: CP2, color: sent ? '#fff6e2' : INK, fontSize: 12.5, fontWeight: 800 }}>
                          <Pix rows={kind === 'heart' ? HEART : SHIRT} pal={{ o: INK, r: '#e0524a', R: '#f08a80', s: '#5b8def', S: '#8fb3f5' }} size={2} />
                          {kind === 'heart' ? (sent ? 'sent' : 'heart') : sent ? 'sent' : 'fit'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <Pix rows={TAIL} pal={{ o: INK, w: '#fffaf0' }} size={3} style={{ margin: '-3px auto 0' }} />
          </div>
        </OnTop>
      )}
      {feedOpen && ctx.arrived && (
        <OnTop>
          <Feed posts={posts} onPosted={loadFeed} onClose={() => setFeedOpen(false)} pw={ctx.pw} ph={ctx.ph} feeling={(feeling ?? '').toLowerCase()} me={me} />
        </OnTop>
      )}
    </div>
  );
}

const HEART = [' oo oo ', 'orRorro', 'oRrrrro', 'orrrrro', ' orrro ', '  oro  ', '   o   '];
const SHIRT = [' oo oo ', 'osSoSso', 'osssssso'.slice(0, 7), ' osssso', ' osssso', ' osssso', ' oooooo'];
const TAIL = ['owwwwo', ' owwo ', '  oo  '];
const CP2 = 'polygon(0 2px,2px 2px,2px 0,calc(100% - 2px) 0,calc(100% - 2px) 2px,100% 2px,100% calc(100% - 2px),calc(100% - 2px) calc(100% - 2px),calc(100% - 2px) 100%,2px 100%,2px calc(100% - 2px),0 calc(100% - 2px))';

/** A tiny picture of someone's sky: the sun, a cloud, rain, snow, or the moon. */
function Sky({ cond, night, size }: { cond: string | null; night: boolean; size: number }) {
  const c = cond ?? '';
  const [rows, pal] = night ? [['  mm ', ' mm  ', ' mm  ', '  mm '], { m: '#f2d23a' }]
    : WET.includes(c) ? [[' ccc ', 'ccccc', ' d d ', 'd d  '], { c: '#9aa3b2', d: '#5b8def' }]
      : SNOWY.includes(c) ? [[' ccc ', 'ccccc', ' s s ', 's s  '], { c: '#9aa3b2', s: '#a9c4e8' }]
        : SUNNY.includes(c) ? [['  y  ', ' yyy ', 'yyyyy', ' yyy ', '  y  '], { y: '#f2b632' }]
          : [['     ', ' ccc ', 'ccccc', '     '], { c: '#9aa3b2' }];
  return <Pix rows={rows as string[]} pal={pal as Record<string, string>} size={size} />;
}

/** A wooden board with a paper card pinned to it, a title burnt into the wood: the street's own kind of sign. */
function Board({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ padding: 4, background: '#4a2e16', clipPath: CP, filter: 'drop-shadow(0 5px 0 rgba(20,10,4,0.3))' }}>
      <div style={{ position: 'relative', padding: '6px 9px 10px', clipPath: CP, background: `repeating-linear-gradient(0deg, ${WOOD} 0 11px, #9a6a3a 11px 12px)` }}>
        {[[5, 5], [5, null], [null, 5], [null, null]].map(([l, t], k) => (
          <span key={k} aria-hidden style={{ position: 'absolute', width: 4, height: 4, background: '#2b211a', boxShadow: 'inset 1px 1px 0 #8a7a6a', ...(l == null ? { right: 5 } : { left: l }), ...(t == null ? { bottom: 5 } : { top: t }) }} />
        ))}
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 4px 6px' }}>
          <span style={{ color: '#fff1d2', fontSize: 13, fontWeight: 800, letterSpacing: 1.6, textShadow: '2px 2px 0 #4a2e16', textTransform: 'uppercase' }}>{title}</span>
          <button onClick={onClose} aria-label="close" style={{ marginLeft: 'auto', color: '#fff1d2', fontSize: 18, fontWeight: 800, lineHeight: 1, textShadow: '2px 2px 0 #4a2e16' }}>×</button>
        </div>
        <div style={{ padding: '10px 11px 11px', background: TAG, color: INK, boxShadow: 'inset 0 0 0 2px #4a2e16, inset 0 -3px 0 #e2d2ad' }}>{children}</div>
      </div>
    </div>
  );
}

// the front of a postcard: the city's landmark if it has one everyone knows, else a quiet row of houses (# the shape,
// + its lit windows at night, r and w a red-and-white tower)
const LANDMARKS: Record<string, string[]> = {
  paris: ['      #      ', '      #      ', '     ###     ', '     # #     ', '     ###     ', '    #   #    ', '    #####    ', '    ## ##    ', '   #  #  #   ', '   ##   ##   ', '  ##     ##  ', '  #########  ', '  ##     ##  ', ' ##       ## ', ' #         # ', '##         ##'],
  tokyo: ['      r      ', '      r      ', '     rwr     ', '     r r     ', '     rrr     ', '    rw wr    ', '    wwwww    ', '    r   r    ', '   rr   rr   ', '   r     r   ', '  rrrrrrrrr  ', '  r       r  ', ' rr       rr ', ' r         r ', 'rr         rr'],
  seattle: ['    #    ', '    #    ', '    #    ', '  #####  ', ' ##+#+## ', '  #####  ', '   ###   ', '   # #   ', '   # #   ', '   # #   ', '   # #   ', '   # #   ', '   # #   ', '  ## ##  ', ' ##   ## '],
  london: ['   #   ', '  ###  ', '  ###  ', ' ##### ', ' #+++# ', ' #+#+# ', ' #+++# ', ' ##### ', ' #+#+# ', ' ##### ', ' #+#+# ', ' ##### ', ' #+#+# ', ' ##### ', '#######'],
  dubai: ['    #    ', '    #    ', '    #    ', '    ##   ', '   ###   ', '   ###   ', '   ####  ', '  ##+##  ', '  #####  ', '  ##+### ', ' ####### ', ' ###+### ', '######## ', '#########'],
  'new york': ['    #    ', '    #    ', '   ###   ', '   #+#   ', '  #####  ', '  #+#+#  ', ' ####### ', ' #+#+#+# ', ' ####### ', '#########', '#+#+#+#+#', '#########'],
};
const HOUSES = ['     #           #    ', '    ###   ##    ###   ', '   #####  ##   ##### ', '  ####### ##  #######', '   #+#+#  ##   #+#+# ', '   #####  ##   ##### ', '   ##+##  ##   ##+## '];

/** A postcard from a friend's city: the city's landmark (or a quiet street) under their sky, the city, a stamp (a
 * heart, or a shirt for loving your fit) with its postmark, and who sent it. */
function Postcard({ l, i, last, onToss }: { l: Letter; i: number; last: boolean; onToss: () => void }) {
  const [gone, setGone] = useState(false); // tossed: off the pile it flies...
  const [shut, setShut] = useState<number | null>(null); // ...then the gap it left closes up (its height, then 0)
  const slot = useRef<HTMLDivElement>(null);
  // the last one: the pile goes straight to "nothing yet", closing down to it as the card flies
  const end = last ? EMPTY : 0;
  const toss = () => { setGone(true); if (last) setShut(slot.current?.offsetHeight ?? 0); };
  useEffect(() => { if (shut !== null && shut !== end) { const r = requestAnimationFrame(() => setShut(end)); return () => cancelAnimationFrame(r); } }, [shut, end]);
  const c = l.condition ?? '', wet = WET.includes(c), snowy = SNOWY.includes(c), clear = SUNNY.includes(c);
  const city = (l.city ?? '').toLowerCase(), shape = LANDMARKS[city] ?? HOUSES;
  const sky = l.night ? ['#1c2452', '#2b3566', '#3b4577'] : wet || snowy ? ['#8a93a1', '#9aa2ae', '#aab1bb'] : ['#8ec5ea', '#a9d3ef', '#c8e3f4'];
  const ink = l.night ? '#141a36' : wet || snowy ? '#5c6672' : '#5d7088', lit = l.night ? '#f2cf7a' : ink;
  const W = 36, H = 30, ground = 24, sw = Math.max(...shape.map(r => r.length)), x0 = Math.round((W - sw) / 2), y0 = ground - shape.length;
  return (
    // its place in the pile: closes up once it's been tossed, and settles when a card above it goes
    <div ref={slot} style={{ position: 'relative', zIndex: i, height: shut ?? undefined, marginTop: shut === 0 ? 0 : i ? -26 : 0, transition: 'height .32s cubic-bezier(.4,0,.2,1), margin-top .32s cubic-bezier(.4,0,.2,1)' }}
      onTransitionEnd={e => { if (e.target === slot.current && e.propertyName === 'height' && shut === end) onToss(); }}>
    {last && <div style={{ ...NOTHING, position: 'absolute', left: 0, right: 0, top: 0, opacity: gone ? 0.7 : 0, transition: 'opacity .25s .1s' }}>nothing yet</div>}
    <div style={{ position: 'relative', rotate: gone ? '24deg' : `${[-2.5, 2, -1, 3][i % 4]}deg`, translate: gone ? '130% -20px' : '0 0', opacity: gone ? 0 : 1,
      transition: 'translate .35s cubic-bezier(.5,0,.8,.6), rotate .35s, opacity .3s .05s', filter: 'drop-shadow(0 3px 0 rgba(20,10,4,0.25))' }}
      onTransitionEnd={e => { if (gone && !last && e.target === e.currentTarget && e.propertyName === 'translate') setShut(slot.current?.offsetHeight ?? 0); }}>
      {/* toss it */}
      <button onClick={toss} aria-label={`toss ${l.name}'s postcard`} style={{ position: 'absolute', left: -6, top: -6, zIndex: 2, width: 20, height: 20, padding: 2, background: INK, clipPath: CP2 }}>
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: TAG, clipPath: CP2, color: INK, fontSize: 13, fontWeight: 800, lineHeight: 1 }}>×</span>
      </button>
      <div style={{ padding: 2, background: INK, clipPath: CP2 }}>
      <div style={{ display: 'flex', background: '#fffaf0', clipPath: CP2, height: 90 }}>
        <svg viewBox={`0 0 ${W} ${H}`} width={108} height={90} shapeRendering="crispEdges" aria-hidden style={{ flex: 'none', display: 'block' }}>
          {sky.map((col, k) => <rect key={k} y={(k * ground) / 3} width={W} height={ground / 3 + 0.5} fill={col} />)}
          {l.night && [[4, 3], [11, 6], [27, 2], [32, 7], [19, 4]].map(([x, y], k) => <rect key={k} x={x} y={y} width={1} height={1} fill="#f4f1e8" />)}
          {l.night ? <><rect x={28} y={3} width={3} height={3} fill="#f4f1e8" /><rect x={29} y={3} width={2} height={2} fill="#1c2452" /></>
            : clear ? <><rect x={27} y={3} width={4} height={4} fill="#fff3c4" /><rect x={28} y={2} width={2} height={6} fill="#fff3c4" /><rect x={26} y={4} width={6} height={2} fill="#fff3c4" /></>
              : <><rect x={4} y={5} width={9} height={2} fill="#e4e8ee" /><rect x={6} y={3} width={5} height={2} fill="#e4e8ee" /></>}
          {shape.flatMap((row, y) => [...row].map((ch, x) => (ch === ' ' ? null : (
            <rect key={`${x}-${y}`} x={x0 + x} y={y0 + y} width={1} height={1} fill={ch === '+' ? lit : ch === 'r' ? '#c94b3b' : ch === 'w' ? '#f4f1e8' : ink} />))))}
          <rect y={ground} width={W} height={H - ground} fill={snowy ? '#e8eef5' : l.night ? '#1d2b24' : wet ? '#6d8a6f' : '#7fae63'} />
          <rect y={ground} width={W} height={1} fill="rgba(0,0,0,0.12)" />
          {(wet || snowy) && [[5, 9], [12, 14], [20, 8], [26, 15], [31, 10], [16, 19]].map(([x, y], k) => <rect key={k} x={x} y={y} width={1} height={snowy ? 1 : 2} fill={snowy ? '#ffffff' : '#5b8def'} opacity={0.85} />)}
        </svg>
        <div style={{ position: 'relative', flex: 1, minWidth: 0, padding: '7px 9px', borderLeft: '2px dashed rgba(28,26,40,0.2)' }}>
          {/* the stamp, with its postmark across it */}
          <div style={{ position: 'absolute', right: 7, top: 6, padding: 3, background: '#fffaf0', boxShadow: '0 0 0 2px #d9483b' }}>
            <Pix rows={l.kind === 'heart' ? HEART : SHIRT} pal={{ o: INK, r: '#e0524a', R: '#f08a80', s: '#5b8def', S: '#8fb3f5' }} size={2.5} />
          </div>
          <span aria-hidden style={{ position: 'absolute', right: 2, top: 26, width: 30, height: 14, border: '2px solid rgba(28,26,40,0.25)', borderRadius: '50%', rotate: '-12deg' }} />
          <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: 1.2, opacity: 0.5 }}>GREETINGS FROM</div>
          <div style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.05, marginTop: 1, paddingRight: 34, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(l.city ?? 'somewhere').toLowerCase()}</div>
          <div style={{ position: 'absolute', left: 9, right: 8, bottom: 8, fontSize: 12.5, fontWeight: 700, borderTop: '1px solid rgba(28,26,40,0.18)', paddingTop: 4 }}>
            {l.kind === 'heart' ? <>a heart from <b>{l.name}</b></> : <><b>{l.name}</b> loves your fit</>}
          </div>
        </div>
      </div>
      </div>
    </div>
    </div>
  );
}

const EMPTY = 26; // how tall "nothing yet" is
const NOTHING: CSSProperties = { height: EMPTY, lineHeight: `${EMPTY}px`, fontSize: 15, fontWeight: 800, textAlign: 'center', opacity: 0.7 };

function Mail({ letters, onToss }: { letters: Letter[]; onToss: (id: number) => void }) {
  return (
    <div style={{ padding: '2px 2px 4px' }}>
      {letters.length ? letters.map((l, i) => <Postcard key={l.id} l={l} i={i} last={letters.length === 1} onToss={() => onToss(l.id)} />) : <div style={NOTHING}>nothing yet</div>}
    </div>
  );
}

/** The picture a shared link shows: snug in today's fit on a sunny hill, and a wooden sign: "add me as a friend on
 * snug!" (1200 by 630, the size link previews use). */
export async function makeCard(outfit: Outfit | undefined, name: string | null | undefined): Promise<string | null> {
  if (!outfit) return null;
  const W = 1200, H = 630, P = 6, cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d')!, r = (x: number, y: number, w: number, h: number, c: string) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  ['#8ec5ea', '#9dcdee', '#acd5f1', '#bcdcf3', '#cbe4f5'].forEach((c, i) => r(0, i * 84, W, 84, c));
  r(1010, 70, 60, 60, '#fff3c4'); r(1000, 80, 80, 40, '#fff3c4'); r(1020, 60, 40, 80, '#fff3c4');
  [[120, 110], [520, 70], [760, 150]].forEach(([x, y]) => { r(x, y, 150, 24, '#ffffff'); r(x + 30, y - 18, 84, 22, '#ffffff'); r(x + 18, y + 22, 120, 6, '#e3ebf3'); });
  for (let x = 0; x < W; x += P) { const h = 150 + Math.round((22 * Math.sin(x / 140) + 12 * Math.sin(x / 61)) / P) * P; r(x, H - h, P, h, '#7fae63'); r(x, H - h, P, P, '#93c070'); }
  r(0, H - 70, W, 70, '#6a9e52');
  for (let i = 0; i < 60; i++) r((i * 197) % W, H - 60 + ((i * 53) % 50), P, P * 2, i % 3 ? '#86b867' : '#e8b33c');
  const img = new Image();
  img.src = draw(outfit, 'happy', 'stand', undefined);
  await new Promise(res => { if (img.complete) res(null); else { img.onload = () => res(null); img.onerror = () => res(null); } });
  g.imageSmoothingEnabled = false;
  g.fillStyle = 'rgba(20,18,40,0.22)'; g.beginPath(); g.ellipse(320, 586, 130, 18, 0, 0, Math.PI * 2); g.fill();
  if (img.naturalWidth) g.drawImage(img, 320 - 46 * 4.5, 586 - 58 * 9, 46 * 9, 58 * 9);
  // the sign
  const sx = 610, sy = 150, sw = 520, sh = 290;
  r(sx + sw / 2 - 12, sy + sh, 24, H - sy - sh - 40, '#7c5129'); r(sx + sw / 2 - 12, sy + sh, 8, H - sy - sh - 40, '#9a6a3a');
  r(sx - 8, sy - 8, sw + 16, sh + 16, '#4a2e16');
  for (let y = 0; y < sh; y += 24) { r(sx, sy + y, sw, 22, '#a8743f'); r(sx, sy + y + 22, sw, 2, '#8a5c30'); }
  [[sx + 14, sy + 14], [sx + sw - 24, sy + 14], [sx + 14, sy + sh - 24], [sx + sw - 24, sy + sh - 24]].forEach(([x, y]) => { r(x, y, 10, 10, '#2b211a'); r(x, y, 4, 4, '#8a7a6a'); });
  g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  const say = (text: string, y: number, size: number) => { g.font = `800 ${size}px 'Rethink Sans', sans-serif`; g.fillStyle = '#4a2e16'; g.fillText(text, sx + sw / 2 + 4, y + 4); g.fillStyle = '#fff1d2'; g.fillText(text, sx + sw / 2, y); };
  say('add me as a friend', sy + 118, 54); say('on snug!', sy + 174, 54);
  if (name) say(`${name.split(' ')[0].toLowerCase()} wants you on their street`, sy + 218, 26);
  return cv.toDataURL('image/png');
}

/** Your code (in little tiles) and link to share, a friend's code to add, and whether friends see your city. */
function Friends({ card }: { card?: () => Promise<string | null> }) {
  const [me, setMe] = useState<{ code: string; hideCity: boolean } | null>(null);
  const [code, setCode] = useState('');
  const [note, setNote] = useState('');
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    api<{ code: string; hideCity: boolean }>('/friends/me').then(setMe).catch(() => setNote("couldn't load your code"));
    // the picture your link shows when it's shared: today's fit, drawn now and sent up ahead of any sharing
    card?.().then(png => { if (png) api('/friends/card', { png: png.split(',')[1] }, 'PUT').catch(() => {}); }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const link = me ? `${location.origin}/f/${me.code}` : '';
  const share = async () => {
    if (!me) return;
    try {
      if (navigator.share) await navigator.share({ title: 'add me as a friend on snug!', url: link });
      else { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1600); }
    } catch { /* closed the share sheet */ }
  };
  const add = () => {
    const c = code.trim().toLowerCase();
    if (!c) return;
    setNote('');
    api<{ name: string }>('/friends/add', { code: c }).then(r => { setNote(`${r.name} is your friend now, see them at the park`); setCode(''); })
      .catch(e => setNote(String(e?.message ?? '').includes('own') ? "that's your own code" : 'no one has that code'));
  };
  const hide = (v: boolean) => { if (!me) return; setMe({ ...me, hideCity: v }); api('/friends/me', { hideCity: v }, 'PUT').catch(() => setMe({ ...me })); };
  const plank = (label: string, onClick: () => void, disabled?: boolean) => (
    <button onClick={onClick} disabled={disabled} style={{ padding: 3, background: '#4a2e16', clipPath: CP2, flex: 'none' }}>
      <span style={{ display: 'block', padding: '5px 12px', background: WOOD, clipPath: CP2, color: '#fff1d2', fontSize: 13, fontWeight: 800, textShadow: '1px 1px 0 #4a2e16', boxShadow: `inset 0 2px 0 ${WOOD_L}` }}>{label}</span>
    </button>
  );
  return (
    <>
      <div style={{ fontSize: 12.5, fontWeight: 700, opacity: 0.7 }}>your code</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
        <div style={{ display: 'flex', gap: 3 }}>
          {[...(me?.code ?? '      ')].map((ch, i) => (
            <span key={i} style={{ width: 22, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fffaf0', boxShadow: `0 0 0 2px ${INK}, inset 0 -3px 0 #e4dcc6`, fontSize: 16, fontWeight: 800 }}>{ch}</span>
          ))}
        </div>
        <span style={{ marginLeft: 'auto' }}>{plank(copied ? 'copied' : 'share', share, !me)}</span>
      </div>
      <div style={{ fontSize: 12.5, fontWeight: 700, opacity: 0.7, marginTop: 11 }}>add a friend</div>
      <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
        <input value={code} onChange={e => setCode(e.target.value.slice(0, 12))} onKeyDown={e => e.key === 'Enter' && add()} placeholder="their code" aria-label="a friend's code"
          style={{ flex: 1, minWidth: 0, padding: '6px 9px', background: '#fffaf0', boxShadow: `0 0 0 2px ${INK}, inset 0 -3px 0 #e4dcc6`, border: 0, fontSize: 16, fontWeight: 700, fontFamily: FONT, color: INK, outline: 'none' }} />
        {plank('add', add)}
      </div>
      {note && <div style={{ marginTop: 6, fontSize: 12.5, fontWeight: 700, opacity: 0.75 }}>{note}</div>}
      <button onClick={() => hide(!me?.hideCity)} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 11, fontSize: 13, fontWeight: 700, color: INK }}>
        <span style={{ width: 16, height: 16, flex: 'none', background: me?.hideCity ? INK : '#fffaf0', boxShadow: `0 0 0 2px ${INK}`, color: TAG, fontSize: 12, lineHeight: '16px', textAlign: 'center' }}>{me?.hideCity ? '✓' : ''}</span>
        hide my city from friends
      </button>
    </>
  );
}
