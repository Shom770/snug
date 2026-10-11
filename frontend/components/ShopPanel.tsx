'use client';
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { CP, CREAM, INK, LIGHT, PLANK, WOOD, WOOD_TEX } from './auth';
import type { Avatar, Outfit, Piece } from './CharacterPanel';
import { AV_DEFAULT, ITEM, ITEMS, KITS, itemSprite, kitWardrobe, sprite } from '../lib/engine';

interface Item { id: string; kind: string; name: string; base: string; acc: string | null; fx: string[]; tags: string[]; dept: 'all' | 'girls'; colors: string[] }
const CATALOG = ITEMS as Item[];
const BY_ID = Object.fromEntries(CATALOG.map(it => [it.id, it]));
const draw = sprite as (o: Outfit, mood: string, pose: string, av: Avatar) => string;
const icon = itemSprite as (kind: string, av: Avatar) => string;

const plain = { outer: 'none', acc: [] as string[] };
// each aisle is one kind of piece Jev can call for (Jev picks the kind for the weather; the closet picks which one),
// and what snug models while you're in it
const AISLES: { kind: string; label: string; show: Outfit }[] = [
  { kind: 'tee', label: 'tees', show: { top: 'tee', bottom: 'pants', ...plain } },
  { kind: 'tank', label: 'tanks', show: { top: 'tank', bottom: 'shorts', ...plain } },
  { kind: 'long', label: 'long sleeves', show: { top: 'long', bottom: 'pants', ...plain } },
  { kind: 'sweater', label: 'sweaters', show: { top: 'sweater', bottom: 'pants', ...plain } },
  { kind: 'light', label: 'jackets', show: { top: 'tee', outer: 'light', bottom: 'pants', acc: [] } },
  { kind: 'hoodie', label: 'hoodies', show: { top: 'tee', outer: 'hoodie', bottom: 'pants', acc: [] } },
  { kind: 'coat', label: 'coats', show: { top: 'sweater', outer: 'coat', bottom: 'pants', acc: [] } },
  { kind: 'rain', label: 'rain gear', show: { top: 'tee', outer: 'rain', bottom: 'pants', acc: [] } },
  { kind: 'pants', label: 'pants', show: { top: 'tee', bottom: 'pants', ...plain } },
  { kind: 'shorts', label: 'shorts', show: { top: 'tee', bottom: 'shorts', ...plain } },
  { kind: 'shoe', label: 'shoes', show: { top: 'tee', bottom: 'shorts', ...plain } },
  { kind: 'beanie', label: 'hats', show: { top: 'sweater', outer: 'coat', bottom: 'pants', acc: ['beanie'] } },
  { kind: 'scarf', label: 'scarves', show: { top: 'sweater', outer: 'coat', bottom: 'pants', acc: ['scarf'] } },
  { kind: 'sunglasses', label: 'sunglasses', show: { top: 'tee', bottom: 'shorts', outer: 'none', acc: ['sunglasses'] } },
  { kind: 'umbrella', label: 'umbrellas', show: { top: 'tee', outer: 'rain', bottom: 'pants', acc: ['umbrella'] } },
];
const LABEL = Object.fromEntries(AISLES.map(a => [a.kind, a.label]));
const KIT_LIST = KITS as { id: string; label: string }[];
const kitOf = kitWardrobe as (id: string, body: string) => Record<string, Piece[]>;
const STYLE_FIT: Outfit = { top: 'tee', outer: 'light', bottom: 'pants', acc: [] };

type Pick = Piece & { kind: string };
const same = (a: Piece, b: Piece) => a.id === b.id && (a.c ?? null) === (b.c ?? null);
const asList = (v: Piece | Piece[] | undefined): Piece[] => (!v ? [] : Array.isArray(v) ? v : [v]);
// thrift and boutique pieces aren't on these shelves, but the closet knows them by id too
const nameOf = (p: Piece) => (p.id && (BY_ID[p.id] ?? (ITEM as Record<string, Item | undefined>)[p.id])?.name) || 'piece';
// the closet shows everything snug owns: the aisles' kinds, and the extras from maison snugé
const EXTRA_KINDS = new Set(['bag', 'hat', 'glasses', 'chain', 'headphones']);
const CLOSET = [...AISLES, { kind: 'bag', label: 'bags' }, { kind: 'hat', label: 'hats' }, { kind: 'glasses', label: 'glasses' }, { kind: 'chain', label: 'chains' }, { kind: 'headphones', label: 'headphones' }];

const btn: CSSProperties = { padding: '6px 8px', background: 'rgba(30,18,8,0.55)', color: LIGHT, fontSize: 13, fontWeight: 800, whiteSpace: 'nowrap', flex: 'none' };
const Plank = ({ onClick, children, disabled, wide }: { onClick: () => void; children: ReactNode; disabled?: boolean; wide?: boolean }) => (
  <button onClick={onClick} disabled={disabled} style={{ padding: 4, background: WOOD, clipPath: CP, opacity: disabled ? 0.45 : 1, cursor: disabled ? 'not-allowed' : 'pointer', width: wide ? '100%' : undefined, flex: 'none' }}>
    <span style={{ display: 'block', padding: '9px 16px', background: PLANK, clipPath: CP, color: LIGHT, fontSize: 15, fontWeight: 800, textShadow: `2px 2px 0 ${WOOD}`, whiteSpace: 'nowrap' }}>{children}</span>
  </button>
);
/** A sheet that slides up over the shelves; tapping outside it closes it. */
const Sheet = ({ onClose, children }: { onClose: () => void; children: ReactNode }) => (
  <div onClick={onClose} style={{ position: 'absolute', left: 0, right: 0, top: 204, bottom: 0, display: 'flex', alignItems: 'flex-end', background: 'rgba(20,12,6,0.45)' }}>
    <div onClick={e => e.stopPropagation()} style={{ width: '100%', padding: 4, background: WOOD, clipPath: CP, animation: 'shop-pop .22s' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '12px 12px 14px', background: WOOD_TEX, clipPath: CP }}>{children}</div>
    </div>
  </div>
);
const rope: CSSProperties = { width: 3, height: 10, background: 'repeating-linear-gradient(180deg,#7a5634 0 3px,#5e3c20 3px 6px)' };

/** A pixel shopping cart with what's been picked up piled in it. */
function Cart({ items, bump }: { items: string[]; bump: number }) {
  return (
    <div key={bump} style={{ position: 'relative', width: 84, height: 66, animation: bump ? 'shop-cart .45s' : undefined }}>
      <svg viewBox="0 0 32 25" width={84} height={66} shapeRendering="crispEdges" style={{ position: 'absolute', left: 0, bottom: 0 }} aria-hidden>
        <rect x="0" y="5" width="5" height="1.4" fill="#4b4e58" /><rect x="4" y="5" width="1.4" height="5" fill="#4b4e58" />
        <path d="M5 9 H31 L28 19 H8 Z" fill="rgba(210,214,224,0.35)" stroke="#7d8290" strokeWidth="1.2" />
        {[10, 14, 18, 22, 26].map(x => <rect key={x} x={x} y="9.5" width="0.8" height="9" fill="#a3a8b6" />)}
        <rect x="6.5" y="13.6" width="23" height="0.8" fill="#a3a8b6" />
        <rect x="8" y="19" width="20" height="1.2" fill="#4b4e58" />
        <circle cx="10" cy="23" r="1.8" fill="#2b2b30" /><circle cx="26" cy="23" r="1.8" fill="#2b2b30" />
      </svg>
      {items.slice(-5).map((src, i, a) => (
        <img key={i} src={src} alt="" style={{ position: 'absolute', left: 16 + (i % 3) * 17 + (i >= 3 ? 8 : 0), bottom: 24 + (i >= 3 ? 12 : 0) + (i % 2) * 3, width: 30, height: 26, imageRendering: 'pixelated', transform: `rotate(${i % 2 ? 9 : -7}deg)`, animation: i === a.length - 1 && bump ? 'shop-drop .35s both' : undefined }} />
      ))}
    </div>
  );
}

/** The colour cards for one piece: swipe, or use the arrow keys, through the colours it comes in. */
function ColourCards({ item, av, index, onIndex }: { item: Item; av: (p: Piece) => Avatar; index: number; onIndex: (i: number) => void }) {
  const touch = useRef<number | null>(null);
  const n = item.colors.length, go = (d: number) => onIndex((index + d + n) % n);
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); } else if (e.key === 'ArrowRight') { e.preventDefault(); go(1); } };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  });
  const arrow = (d: number) => (
    <button onClick={() => go(d)} aria-label={d < 0 ? 'previous colour' : 'next colour'} style={{ width: 36, height: 48, flex: 'none', padding: 3, background: WOOD, clipPath: CP }}>
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: PLANK, clipPath: CP, color: LIGHT, fontSize: 20, fontWeight: 900 }}>{d < 0 ? '‹' : '›'}</span>
    </button>
  );
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {arrow(-1)}
      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}
        onTouchStart={e => { touch.current = e.touches[0].clientX; }}
        onTouchEnd={e => { if (touch.current == null) return; const dx = e.changedTouches[0].clientX - touch.current; touch.current = null; if (Math.abs(dx) > 30) go(dx < 0 ? 1 : -1); }}>
        <div style={{ display: 'flex', transform: `translateX(${-index * 100}%)`, transition: 'transform .28s cubic-bezier(.2,.8,.2,1)' }}>
          {item.colors.map((c, i) => (
            <div key={c} style={{ flex: '0 0 100%', display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: 'min(200px, 100%)', padding: 4, background: WOOD, clipPath: CP, transform: i === index ? 'none' : 'scale(0.92)', transition: 'transform .28s' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '12px 8px 8px', background: CREAM, clipPath: CP }}>
                  <img src={icon(item.kind, av(i === 0 ? { id: item.id } : { id: item.id, c }))} alt="" style={{ width: 120, height: 103, imageRendering: 'pixelated' }} />
                  <span style={{ fontSize: 13, fontWeight: 800, color: INK }}>{i === 0 ? `${c} (original)` : c}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {arrow(1)}
    </div>
  );
}

/**
 * snug & co., a general store: walk the aisles, pick pieces off the shelves, swipe through their colours, fill the
 * cart, check out. snug can own several of each kind and rotates through them day to day.
 */
export default function ShopPanel({ initial, onDone, onClose, closetFirst }: { initial?: Partial<Avatar> | null; onDone: (a: Avatar) => void; onClose: () => void; closetFirst?: boolean }) {
  const base: Avatar = { ...(AV_DEFAULT as Avatar), ...(initial || {}) };
  const start = useMemo(() => Object.fromEntries(Object.entries(initial?.wardrobe || {}).map(([k, v]) => [k, asList(v)])), [initial]);
  const [closet, setCloset] = useState<Record<string, Piece[]>>(start);
  // the extras they're wearing (one of each kind at most), picked in the closet
  const [extras, setExtras] = useState<Record<string, string | null>>(initial?.extras ?? {});
  const [kind, setKind] = useState('tee');
  // the department comes from who snug is: girls also see skirts and mary janes
  const dept = base.body === 'girl' ? 'girls' : 'guys';
  const [view, setView] = useState<'shelves' | 'cart' | 'closet' | 'styles'>(closetFirst ? 'closet' : Object.keys(start).length ? 'shelves' : 'styles');
  const [kit, setKit] = useState<string | null>(null);
  // a style's been picked: ask whether to wear it as is or keep shopping on top of it
  const [asking, setAsking] = useState(false);
  const [open, setOpen] = useState<Item | null>(null);
  const [ci, setCi] = useState(0);
  const [cart, setCart] = useState<Pick[]>([]);
  const [bump, setBump] = useState(0);
  useEffect(() => { const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(null); setAsking(false); } }; window.addEventListener('keydown', esc); return () => window.removeEventListener('keydown', esc); }, []);

  const aisleNo = AISLES.findIndex(a => a.kind === kind), aisle = AISLES[aisleNo];
  const shelf = CATALOG.filter(it => it.kind === kind && (dept !== 'guys' || it.dept !== 'girls'))
    .sort((a, b) => (dept === 'girls' ? (a.dept === 'girls' ? -1 : 0) - (b.dept === 'girls' ? -1 : 0) : 0));
  const look = (k: string, p: Piece): Avatar => ({ ...base, wardrobe: { [k]: [p] } });
  const trying: Pick | null = open ? { kind: open.kind, id: open.id, ...(ci ? { c: open.colors[ci] } : {}) } : null;
  const lastOf = (k: string) => [...cart].reverse().find(p => p.kind === k);
  // snug models what's being tried on, else the newest thing in the cart for this aisle, else what they own
  const model = trying ?? lastOf(kind);
  const preview: Avatar = view === 'styles' && kit ? { ...base, wardrobe: kitOf(kit, base.body) } : { ...base, extras, wardrobe: { ...closet, ...(model ? { [model.kind]: [model] } : {}) } };
  const owned = (k: string) => closet[k] ?? [];
  const changed = cart.length > 0 || JSON.stringify(closet) !== JSON.stringify(start) || JSON.stringify(extras) !== JSON.stringify(initial?.extras ?? {});

  const openItem = (it: Item) => { setOpen(it); setCi(0); };
  const add = () => { if (!trying) return; if (!cart.some(p => p.kind === trying.kind && same(p, trying))) setCart(c => [...c, trying]); setBump(n => n + 1); setOpen(null); };
  const checkout = (from = closet) => {
    const w: Record<string, Piece[]> = Object.fromEntries(Object.entries(from).map(([k, v]) => [k, [...v]]));
    cart.forEach(({ kind: k, ...p }) => { const l = (w[k] ||= []); if (!l.some(q => same(q, p)) && l.length < 12) l.push(p); });
    Object.keys(w).forEach(k => { if (!w[k].length) delete w[k]; });
    // an extra only stays on if it's still in the closet
    const on = Object.fromEntries(Object.entries(extras).filter(([k, id]) => id && (w[k] ?? []).some(p => p.id === id)));
    onDone({ ...base, wardrobe: w, extras: on });
  };
  const kitName = KIT_LIST.find(k => k.id === kit)?.label ?? '';
  const wearKit = () => { if (kit) checkout(kitOf(kit, base.body)); };
  // the style becomes the closet, then back to the aisles to add to it
  const shopMore = () => { if (kit) setCloset(kitOf(kit, base.body)); setKit(null); setAsking(false); setView('shelves'); };
  const ownedHere = trying ? owned(trying.kind).some(p => same(p, trying)) : false;
  const inCart = trying ? cart.some(p => p.kind === trying.kind && same(p, trying)) : false;

  return (
    <div role="dialog" aria-modal="true" aria-label="snug and co., the store"
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 10, background: 'rgba(20,14,10,0.55)', backdropFilter: 'blur(3px)', fontFamily: "'Rethink Sans',sans-serif" }}>
      <style>{`@keyframes shop-cart{0%,100%{transform:none}30%{transform:translateY(-6px) rotate(-3deg)}60%{transform:rotate(2deg)}}
        @keyframes shop-drop{from{transform:translateY(-36px);opacity:0}to{opacity:1}}
        @keyframes shop-hop{0%,100%{transform:none}40%{transform:translateY(-6px)}}
        @keyframes shop-pop{from{transform:translateY(16px);opacity:0}to{transform:none;opacity:1}}
        .shop-scroll::-webkit-scrollbar{display:none}.shop-scroll{scrollbar-width:none}`}</style>
      <div style={{ position: 'relative', width: 'min(600px, 100%)', height: 'min(100%, 880px)', padding: 5, background: WOOD, clipPath: CP, boxShadow: '0 20px 40px rgba(0,0,0,0.4)', display: 'flex' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', background: WOOD_TEX, clipPath: CP }}>

          {/* sign and counter */}
          <div style={{ flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '10px 12px 8px' }}>
            <div style={{ padding: 3, background: WOOD, clipPath: CP }}>
              <div style={{ padding: '5px 10px', background: PLANK, clipPath: CP, color: LIGHT, textShadow: `2px 2px 0 ${WOOD}`, lineHeight: 1.05, whiteSpace: 'nowrap' }}>
                <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: 2, opacity: 0.85 }}>GENERAL STORE</div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>snug &amp; co.</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => { setView(v => (v === 'styles' ? 'shelves' : 'styles')); setOpen(null); setAsking(false); }} style={{ ...btn, background: view === 'styles' ? '#f2c230' : btn.background, color: view === 'styles' ? INK : LIGHT }}>styles</button>
              <button onClick={() => { setView(v => (v === 'closet' ? 'shelves' : 'closet')); setOpen(null); setAsking(false); }} style={{ ...btn, background: view === 'closet' ? '#f2c230' : btn.background, color: view === 'closet' ? INK : LIGHT }}>closet</button>
              <button onClick={() => { setView(v => (v === 'cart' ? 'shelves' : 'cart')); setOpen(null); setAsking(false); }} style={{ ...btn, background: view === 'cart' ? '#f2c230' : btn.background, color: view === 'cart' ? INK : LIGHT }}>cart {cart.length}</button>
              <button onClick={onClose} aria-label="leave the store" style={btn}>leave</button>
            </div>
          </div>

          {/* the shop floor: the aisle sign overhead, snug pushing the cart */}
          <div style={{ position: 'relative', flex: 'none', height: 150, margin: '0 10px', overflow: 'hidden', clipPath: CP, background: 'linear-gradient(180deg, rgba(0,0,0,0) 72%, #c99a63 72%), repeating-linear-gradient(90deg, #7a4f2b 0 26px, #6a4324 26px 28px)' }}>
            <div aria-hidden style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '28%', background: 'repeating-linear-gradient(90deg, #c99a63 0 46px, #b6874f 46px 48px)' }} />
            <div aria-hidden style={{ position: 'absolute', left: 10, right: 10, top: 40, height: 5, background: '#4a2e16', boxShadow: '0 2px 0 rgba(0,0,0,0.25)' }} />
            <div aria-hidden style={{ position: 'absolute', left: 14, right: 14, top: 14, display: 'flex', justifyContent: 'space-between', opacity: 0.85 }}>
              {CATALOG.filter(it => it.kind === kind).slice(0, 7).map(it => <img key={it.id} src={icon(it.kind, look(it.kind, { id: it.id }))} alt="" style={{ width: 30, height: 26, imageRendering: 'pixelated' }} />)}
            </div>
            <div style={{ position: 'absolute', left: '50%', top: 48, transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 46 }}><span style={rope} /><span style={rope} /></div>
              <div style={{ padding: 2, background: WOOD, clipPath: CP }}>
                <div style={{ padding: '2px 10px', background: '#f2c230', clipPath: CP, color: INK, fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap' }}>{view === 'shelves' ? `aisle ${aisleNo + 1} · ${aisle.label}` : view === 'cart' ? 'checkout' : view === 'styles' ? 'quick styles' : 'your closet'}</div>
              </div>
            </div>
            <div style={{ position: 'absolute', left: '50%', bottom: 8, transform: 'translateX(-64%)', display: 'flex', alignItems: 'flex-end' }}>
              <img key={`${model?.id}${model?.c}${bump}`} src={draw(aisle.show, 'happy', 'stand', preview)} alt="snug trying it on" style={{ width: 80, height: 101, imageRendering: 'pixelated', display: 'block', animation: 'shop-hop .4s' }} />
              <div style={{ marginLeft: -10, marginBottom: -2 }}><Cart bump={bump} items={cart.map(p => icon(p.kind, look(p.kind, p)))} /></div>
            </div>
          </div>

          {view === 'shelves' ? (
            <>
              {/* aisle signs */}
              <div className="shop-scroll" style={{ flex: 'none', display: 'flex', gap: 8, overflowX: 'auto', padding: '10px 12px 2px' }}>
                {AISLES.map((a, i) => {
                  const on = a.kind === kind;
                  return (
                    <button key={a.kind} onClick={() => { setKind(a.kind); setOpen(null); }} aria-pressed={on} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 'none' }}>
                      <div style={{ display: 'flex', gap: 22 }}><span style={{ ...rope, height: 7 }} /><span style={{ ...rope, height: 7 }} /></div>
                      <span style={{ padding: 2, background: WOOD, clipPath: CP }}>
                        <span style={{ display: 'block', padding: '4px 10px', background: on ? '#f2c230' : PLANK, clipPath: CP, color: on ? INK : LIGHT, fontSize: 12, fontWeight: 800, textShadow: on ? 'none' : `1px 1px 0 ${WOOD}`, whiteSpace: 'nowrap' }}>
                          <span style={{ opacity: 0.7, marginRight: 4 }}>{i + 1}</span>{a.label}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
              {/* the shelves */}
              <div className="shop-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', margin: '4px 10px 0', padding: '6px 4px 10px', background: 'repeating-linear-gradient(90deg, #5e3b1e 0 30px, #55351b 30px 32px)', clipPath: CP }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
                  {shelf.map(it => {
                    const mine = owned(it.kind).filter(p => p.id === it.id).length, carted = cart.some(p => p.id === it.id);
                    return (
                      <button key={it.id} onClick={() => openItem(it)} aria-label={it.name} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 2px 0' }}>
                        <img src={icon(it.kind, look(it.kind, { id: it.id }))} alt="" style={{ width: 62, height: 53, imageRendering: 'pixelated', display: 'block', filter: 'drop-shadow(0 3px 2px rgba(0,0,0,0.3))' }} />
                        {/* the shelf board under each row of things */}
                        <span aria-hidden style={{ alignSelf: 'stretch', height: 7, marginTop: 2, background: PLANK, boxShadow: `0 3px 0 ${WOOD}` }} />
                        <span style={{ marginTop: 7, marginBottom: 8, padding: '3px 7px', maxWidth: '96%', background: CREAM, clipPath: CP, color: INK, fontSize: 11, fontWeight: 800, lineHeight: 1.15, textAlign: 'center' }}>{it.name}</span>
                        {(mine > 0 || carted) && <span style={{ position: 'absolute', top: 4, right: 6, padding: '1px 5px', background: carted ? '#f2c230' : CREAM, color: INK, fontSize: 9.5, fontWeight: 800, clipPath: CP }}>{carted ? 'in cart' : mine > 1 ? `own ${mine}` : 'owned'}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : view === 'styles' ? (
            // a whole look in one tap
            <div className="shop-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '10px 10px 4px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(104px, 1fr))', gap: 8, alignContent: 'start' }}>
              {KIT_LIST.map(k => {
                const on = kit === k.id;
                return (
                  <button key={k.id} onClick={() => { setKit(k.id); setAsking(true); }} aria-pressed={on} style={{ padding: 3, background: WOOD, clipPath: CP }}>
                    <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '8px 4px 6px', background: on ? '#f2c230' : CREAM, clipPath: CP }}>
                      <img src={draw(STYLE_FIT, 'happy', 'stand', { ...base, wardrobe: kitOf(k.id, base.body) })} alt="" style={{ width: 64, height: 81, imageRendering: 'pixelated' }} />
                      <span style={{ fontSize: 13, fontWeight: 800, color: INK }}>{k.label}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="shop-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', margin: '10px 10px 0', padding: 3, background: WOOD, clipPath: CP }}>
              <div style={{ minHeight: '100%', padding: '10px 12px', background: CREAM, clipPath: CP, color: INK }}>
                {view === 'cart' ? (
                  <>
                    {cart.length === 0 && <div style={{ fontWeight: 700, opacity: 0.7, padding: '8px 0' }}>the cart is empty.</div>}
                    {cart.map((p, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderTop: i ? '2px dashed rgba(74,46,22,0.2)' : 'none' }}>
                        <img src={icon(p.kind, look(p.kind, p))} alt="" style={{ width: 46, height: 40, imageRendering: 'pixelated' }} />
                        <div style={{ flex: 1 }}><div style={{ fontWeight: 800 }}>{nameOf(p)}</div><div style={{ fontSize: 12, fontWeight: 700, opacity: 0.65 }}>{LABEL[p.kind]} · {p.c ?? BY_ID[p.id!]?.base}</div></div>
                        <button aria-label={`put back the ${nameOf(p)}`} onClick={() => setCart(c => c.filter((_, j) => j !== i))} style={{ ...btn, padding: '4px 10px' }}>×</button>
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    {CLOSET.filter(a => owned(a.kind).some(p => p.id)).length === 0 && <div style={{ fontWeight: 700, opacity: 0.7, padding: '8px 0' }}>nothing from the store yet.</div>}
                    {CLOSET.filter(a => owned(a.kind).some(p => p.id)).map(a => (
                      <div key={a.kind} style={{ padding: '6px 0', borderTop: '2px dashed rgba(74,46,22,0.2)' }}>
                        <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 4 }}>{a.label}</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {owned(a.kind).map((p, i) => p.id ? (
                            <div key={i} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', width: 76 }}>
                              <img src={icon(a.kind, look(a.kind, p))} alt="" style={{ width: 52, height: 45, imageRendering: 'pixelated' }} />
                              <span style={{ fontSize: 10.5, fontWeight: 800, textAlign: 'center', lineHeight: 1.1 }}>{nameOf(p)}</span>
                              {EXTRA_KINDS.has(a.kind) && (() => { const on = extras[a.kind] === p.id; return (
                                <button onClick={() => setExtras(x => ({ ...x, [a.kind]: on ? null : p.id! }))} aria-pressed={on}
                                  style={{ marginTop: 3, padding: '2px 8px', background: on ? '#f2c230' : 'rgba(30,18,8,0.12)', color: INK, fontSize: 10.5, fontWeight: 800, clipPath: CP }}>{on ? 'wearing ✓' : 'wear'}</button>
                              ); })()}
                              <button aria-label={`take the ${nameOf(p)} out of the closet`} onClick={() => setCloset(c => ({ ...c, [a.kind]: owned(a.kind).filter((_, j) => j !== i) }))}
                                style={{ position: 'absolute', top: -2, right: 6, width: 20, height: 20, background: 'rgba(30,18,8,0.7)', color: LIGHT, fontSize: 12, fontWeight: 800, clipPath: CP }}>×</button>
                            </div>
                          ) : null)}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}

          {/* the counter: check out */}
          <div style={{ flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, padding: '10px 12px 12px' }}>
            {view === 'styles'
              ? <Plank onClick={() => setAsking(true)} disabled={!kit}>{kit ? `pick ${kitName}` : 'pick a style'}</Plank>
              : <Plank onClick={() => checkout()} disabled={!changed}>{cart.length ? `check out (${cart.length})` : 'done'}</Plank>}
          </div>

          {/* looking at one piece: its colour cards */}
          {open && (
            <Sheet onClose={() => setOpen(null)}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, color: LIGHT, textShadow: `2px 2px 0 ${WOOD}` }}>
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 1.5, opacity: 0.85 }}>{LABEL[open.kind].toUpperCase()} · {open.tags.join(' · ').toUpperCase()}</div>
                  <div style={{ fontSize: 20, fontWeight: 800 }}>{open.name}</div>
                </div>
                <button onClick={() => setOpen(null)} aria-label="put it back" style={{ ...btn, padding: '4px 10px' }}>×</button>
              </div>
              <ColourCards item={open} index={ci} onIndex={setCi} av={p => look(open.kind, p)} />
              <div style={{ display: 'flex', justifyContent: 'center', gap: 5 }} aria-hidden>
                {open.colors.map((c, i) => <span key={c} style={{ width: i === ci ? 16 : 7, height: 7, background: i === ci ? '#f2c230' : 'rgba(255,241,210,0.35)', transition: 'width .2s' }} />)}
              </div>
              <Plank onClick={add} disabled={inCart || ownedHere} wide>{ownedHere ? 'already in the closet' : inCart ? 'in the cart ✓' : 'put it in the cart'}</Plank>
            </Sheet>
          )}

          {/* a style's picked: wear it now, or go add more pieces to it */}
          {asking && kit && (
            <Sheet onClose={() => setAsking(false)}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, color: LIGHT, textShadow: `2px 2px 0 ${WOOD}` }}>
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 1.5, opacity: 0.85 }}>QUICK STYLE</div>
                  <div style={{ fontSize: 20, fontWeight: 800 }}>want any more clothes?</div>
                </div>
                <button onClick={() => setAsking(false)} aria-label="pick a different style" style={{ ...btn, padding: '4px 10px' }}>×</button>
              </div>
              <Plank onClick={shopMore} wide>yes, keep shopping</Plank>
              <Plank onClick={wearKit} wide>no, wear it{cart.length ? ` (+${cart.length} in cart)` : ''}</Plank>
            </Sheet>
          )}
        </div>
      </div>
    </div>
  );
}
