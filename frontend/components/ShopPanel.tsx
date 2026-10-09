'use client';
import { useMemo, useState, type CSSProperties } from 'react';
import { CP, CREAM, INK, LIGHT, PLANK, WOOD, WOOD_TEX } from './auth';
import { Chip, Swatch, type Avatar, type Outfit, type Piece } from './CharacterPanel';
import { AV_DEFAULT, COLORS, STYLES, itemSprite, nameOf, palOf, sprite } from '../lib/engine';

const ST = STYLES as Record<string, { label: string; pal?: Record<string, string[]>; det?: Record<string, string> }>;
const COL = COLORS as Record<string, string[]>;
const draw = sprite as (o: Outfit, mood: string, pose: string, av: Avatar) => string;
const icon = itemSprite as (kind: string, av: Avatar) => string;
const named = nameOf as (kind: string, av: Avatar) => string;
const colourOf = palOf as (av: Avatar, kind: string) => string[];

// the style filters (the brands they're like show up as hints)
const TAG: Record<string, string> = { casual: 'everyday', surf: 'beachy', minimal: 'minimal', sporty: 'athletic', street: 'graphic & street', preppy: 'preppy', cozy: 'cozy' };

// aisles: one kind of piece each (Jev decides which kind the weather calls for; this decides which one snug owns),
// and what snug models while you browse it
const nothing = { outer: 'none', acc: [] as string[] };
const SECTIONS: { label: string; aisles: { kind: string; label: string; show: Outfit }[] }[] = [
  { label: 'tops', aisles: [
    { kind: 'tee', label: 'tees', show: { top: 'tee', bottom: 'pants', ...nothing } },
    { kind: 'tank', label: 'tanks', show: { top: 'tank', bottom: 'shorts', ...nothing } },
    { kind: 'long', label: 'long sleeves', show: { top: 'long', bottom: 'pants', ...nothing } },
    { kind: 'sweater', label: 'sweaters', show: { top: 'sweater', bottom: 'pants', ...nothing } },
  ] },
  { label: 'outerwear', aisles: [
    { kind: 'light', label: 'jackets', show: { top: 'tee', outer: 'light', bottom: 'pants', acc: [] } },
    { kind: 'hoodie', label: 'hoodies', show: { top: 'tee', outer: 'hoodie', bottom: 'pants', acc: [] } },
    { kind: 'coat', label: 'winter coats', show: { top: 'sweater', outer: 'coat', bottom: 'pants', acc: [] } },
    { kind: 'rain', label: 'rain jackets', show: { top: 'tee', outer: 'rain', bottom: 'pants', acc: [] } },
  ] },
  { label: 'bottoms', aisles: [
    { kind: 'pants', label: 'pants', show: { top: 'tee', bottom: 'pants', ...nothing } },
    { kind: 'shorts', label: 'shorts', show: { top: 'tee', bottom: 'shorts', ...nothing } },
  ] },
  { label: 'shoes', aisles: [{ kind: 'shoe', label: 'shoes', show: { top: 'tee', bottom: 'shorts', ...nothing } }] },
  { label: 'extras', aisles: [
    { kind: 'beanie', label: 'beanies', show: { top: 'sweater', outer: 'coat', bottom: 'pants', acc: ['beanie'] } },
    { kind: 'scarf', label: 'scarves', show: { top: 'sweater', outer: 'coat', bottom: 'pants', acc: ['scarf'] } },
  ] },
];
const AISLE_LABEL: Record<string, string> = Object.fromEntries(SECTIONS.flatMap(s => s.aisles.map(a => [a.kind, a.label])));

interface Item { kind: string; s: string; name: string }
/** Every distinct version of a kind across the styles (a puffer, a teddy coat, a trench...). */
function catalog(kind: string): Item[] {
  const seen = new Set<string>(), out: Item[] = [];
  for (const s of Object.keys(ST)) {
    const name = named(kind, { ...(AV_DEFAULT as Avatar), style: s, skirt: false, wardrobe: {} });
    const sig = name + JSON.stringify(ST[s].pal?.[kind] ?? null) + (ST[s].det?.[kind] ?? '');
    if (!seen.has(sig)) { seen.add(sig); out.push({ kind, s, name }); }
  }
  return out;
}

const btn: CSSProperties = { padding: '6px 12px', background: 'rgba(30,18,8,0.55)', color: LIGHT, fontSize: 13, fontWeight: 800 };
const Plank = ({ onClick, children, disabled }: { onClick: () => void; children: React.ReactNode; disabled?: boolean }) => (
  <button onClick={onClick} disabled={disabled} style={{ padding: 4, background: WOOD, clipPath: CP, opacity: disabled ? 0.45 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}>
    <span style={{ display: 'block', padding: '8px 16px', background: PLANK, clipPath: CP, color: LIGHT, fontSize: 15, fontWeight: 800, textShadow: `2px 2px 0 ${WOOD}`, whiteSpace: 'nowrap' }}>{children}</span>
  </button>
);

/** A pixel shopping cart with what's been picked up piled in the basket. */
function Cart({ items, bump }: { items: string[]; bump: number }) {
  return (
    <div key={bump} style={{ position: 'relative', width: 96, height: 76, animation: bump ? 'snug-cart .45s' : undefined }}>
      <svg viewBox="0 0 32 25" width={96} height={75} shapeRendering="crispEdges" style={{ position: 'absolute', left: 0, bottom: 0 }} aria-hidden>
        <rect x="0" y="5" width="5" height="1.4" fill="#5b5e6b" /><rect x="4" y="5" width="1.4" height="5" fill="#5b5e6b" />
        <path d="M5 9 H31 L28 19 H8 Z" fill="rgba(200,206,220,0.35)" stroke="#7d8290" strokeWidth="1.2" />
        {[10, 14, 18, 22, 26].map(x => <rect key={x} x={x} y="9.5" width="0.8" height="9" fill="#a3a8b6" />)}
        <rect x="6.5" y="13.6" width="23" height="0.8" fill="#a3a8b6" />
        <rect x="8" y="19" width="20" height="1.2" fill="#5b5e6b" /><rect x="8" y="20" width="1.2" height="2" fill="#5b5e6b" /><rect x="26.8" y="20" width="1.2" height="2" fill="#5b5e6b" />
        <circle cx="10" cy="23" r="1.8" fill="#2b2b30" /><circle cx="26" cy="23" r="1.8" fill="#2b2b30" />
      </svg>
      {items.slice(-5).map((src, i) => (
        <img key={i} src={src} alt="" style={{ position: 'absolute', left: 20 + (i % 3) * 20 - (i >= 3 ? -10 : 0), bottom: 26 + (i >= 3 ? 14 : 0) + (i % 2) * 4, width: 34, height: 29, imageRendering: 'pixelated', transform: `rotate(${(i % 2 ? 8 : -6)}deg)`, animation: i === items.slice(-5).length - 1 && bump ? 'snug-drop .35s both' : undefined }} />
      ))}
    </div>
  );
}

/**
 * snug's shop: walk the aisles, try things on, pick colours, fill the cart, check out to wear it.
 * Each pick is one kind of piece (its style's version, in a colour); anything not bought keeps the overall style.
 */
export default function ShopPanel({ initial, onDone, onClose }: { initial?: Partial<Avatar> | null; onDone: (a: Avatar) => void; onClose: () => void }) {
  const base: Avatar = { ...(AV_DEFAULT as Avatar), ...(initial || {}), wardrobe: { ...(initial?.wardrobe || {}) } };
  const [section, setSection] = useState(0);
  const [kind, setKind] = useState('tee');
  const [filter, setFilter] = useState<string | null>(null);
  const [sel, setSel] = useState<(Piece & { kind: string }) | null>(null);
  const [cart, setCart] = useState<Record<string, Piece>>({});
  const [skirt, setSkirt] = useState(base.skirt);
  const [viewCart, setViewCart] = useState(false);
  const [bump, setBump] = useState(0);

  const aisle = SECTIONS[section].aisles.find(a => a.kind === kind) || SECTIONS[section].aisles[0];
  const items = useMemo(() => catalog(aisle.kind), [aisle.kind]);
  const styles = [...new Set(items.map(i => i.s))];
  const shown = filter && styles.includes(filter) ? items.filter(i => i.s === filter) : items;
  const owned = (k: string): Piece => base.wardrobe?.[k] ?? { s: base.style };
  const wearing: Record<string, Piece> = { ...base.wardrobe, ...cart, ...(sel ? { [sel.kind]: { s: sel.s, ...(sel.c ? { c: sel.c } : {}) } } : {}) };
  const preview: Avatar = { ...base, skirt, wardrobe: wearing };
  const look = (k: string, p: Piece): Avatar => ({ ...base, skirt, wardrobe: { [k]: p } });
  const cartList = Object.entries(cart);
  const changed = cartList.length > 0 || skirt !== base.skirt;

  const goSection = (i: number) => { setSection(i); setKind(SECTIONS[i].aisles[0].kind); setFilter(null); setSel(null); setViewCart(false); };
  const goAisle = (k: string) => { setKind(k); setFilter(null); setSel(null); };
  const addToCart = () => { if (!sel) return; setCart(c => ({ ...c, [sel.kind]: { s: sel.s, ...(sel.c ? { c: sel.c } : {}) } })); setBump(b => b + 1); setSel(null); };
  const checkout = () => onDone({ ...base, skirt, wardrobe: { ...base.wardrobe, ...cart } });

  return (
    <div role="dialog" aria-modal="true" aria-label="snug's shop"
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 10, background: 'rgba(20,14,30,0.55)', backdropFilter: 'blur(3px)', fontFamily: "'Rethink Sans',sans-serif" }}>
      <style>{`@keyframes snug-cart{0%{transform:none}30%{transform:translateY(-6px) rotate(-3deg)}60%{transform:translateY(0) rotate(2deg)}100%{transform:none}}
        @keyframes snug-drop{from{transform:translateY(-40px);opacity:0}to{opacity:1}}
        @keyframes snug-hop{0%,100%{transform:none}40%{transform:translateY(-8px)}}`}</style>
      <div style={{ width: 'min(680px, 100%)', height: 'min(100%, 880px)', padding: 5, background: WOOD, clipPath: CP, boxShadow: '0 20px 40px rgba(0,0,0,0.35)', display: 'flex' }}>
        <div style={{ flex: 1, minHeight: 0, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10, padding: '12px 14px', background: WOOD_TEX, clipPath: CP }}>

          {/* sign, cart, leave */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, color: LIGHT, textShadow: `2px 2px 0 ${WOOD}` }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, opacity: 0.85 }}>SNUG&apos;S SHOP</div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{viewCart ? 'your cart' : AISLE_LABEL[aisle.kind]}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={() => setViewCart(v => !v)} aria-label={`cart, ${cartList.length} items`} style={{ ...btn, background: viewCart ? '#f2c230' : btn.background, color: viewCart ? INK : LIGHT }}>🛒 {cartList.length}</button>
              <button onClick={onClose} style={btn}>leave</button>
            </div>
          </div>

          {/* the shop floor: snug modelling this aisle, pushing the cart */}
          <div style={{ position: 'relative', flex: 'none', height: 150, overflow: 'hidden', clipPath: CP, background: 'linear-gradient(180deg, #ecdfc6 0 78%, #c9a77a 78%)' }}>
            <div aria-hidden style={{ position: 'absolute', inset: '0 0 22% 0', background: 'repeating-linear-gradient(180deg, transparent 0 42px, #a8743f 42px 47px, #7a5634 47px 49px)', opacity: 0.55 }} />
            <div aria-hidden style={{ position: 'absolute', left: 10, right: 10, top: 6, display: 'flex', gap: 10, justifyContent: 'space-between', opacity: 0.5 }}>
              {items.slice(0, 6).map(it => <img key={it.s} src={icon(it.kind, look(it.kind, { s: it.s }))} alt="" style={{ width: 36, height: 31, imageRendering: 'pixelated' }} />)}
            </div>
            <div style={{ position: 'absolute', left: '50%', bottom: 8, transform: 'translateX(-62%)', display: 'flex', alignItems: 'flex-end', gap: 0 }}>
              <img key={bump} src={draw(aisle.show, 'happy', 'stand', preview)} alt="snug trying it on" style={{ width: 92, height: 116, imageRendering: 'pixelated', display: 'block', animation: bump ? 'snug-hop .45s' : undefined }} />
              <div style={{ marginLeft: -14, marginBottom: -2 }}><Cart bump={bump} items={cartList.map(([k, p]) => icon(k, look(k, p)))} /></div>
            </div>
          </div>

          {viewCart ? (
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {cartList.length === 0 && <div style={{ color: LIGHT, fontWeight: 700, textShadow: `1px 1px 0 ${WOOD}`, padding: '8px 2px' }}>nothing in the cart yet.</div>}
              {cartList.map(([k, p]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 10px', background: CREAM, clipPath: CP }}>
                  <img src={icon(k, look(k, p))} alt="" style={{ width: 56, height: 48, imageRendering: 'pixelated' }} />
                  <div style={{ flex: 1, color: INK }}>
                    <div style={{ fontWeight: 800 }}>{named(k, look(k, p))}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.7 }}>{AISLE_LABEL[k]} · {TAG[p.s] || p.s}{p.c ? ` · ${p.c}` : ''}</div>
                  </div>
                  <button aria-label={`take ${named(k, look(k, p))} out of the cart`} onClick={() => setCart(c => { const n = { ...c }; delete n[k]; return n; })} style={{ ...btn, background: 'rgba(30,18,8,0.75)' }}>×</button>
                </div>
              ))}
              {skirt !== base.skirt && <div style={{ color: LIGHT, fontSize: 13, fontWeight: 700, textShadow: `1px 1px 0 ${WOOD}` }}>{skirt ? '+ wearing skirts' : '+ back to shorts and pants'}</div>}
            </div>
          ) : (
            <>
              {/* sections, then aisles, then style filters */}
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', flex: 'none', paddingBottom: 2 }}>
                {SECTIONS.map((s, i) => <Chip key={s.label} on={i === section} onClick={() => goSection(i)}>{s.label}</Chip>)}
              </div>
              {SECTIONS[section].aisles.length > 1 && (
                <div style={{ display: 'flex', gap: 6, overflowX: 'auto', flex: 'none' }}>
                  {SECTIONS[section].aisles.map(a => (
                    <button key={a.kind} onClick={() => goAisle(a.kind)} aria-pressed={a.kind === aisle.kind}
                      style={{ ...btn, background: a.kind === aisle.kind ? 'rgba(242,194,48,0.9)' : btn.background, color: a.kind === aisle.kind ? INK : LIGHT, whiteSpace: 'nowrap' }}>{a.label}</button>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', flex: 'none', alignItems: 'center' }}>
                <span style={{ color: LIGHT, fontSize: 12, fontWeight: 800, textShadow: `1px 1px 0 ${WOOD}`, flex: 'none' }}>style</span>
                <button onClick={() => setFilter(null)} style={{ ...btn, padding: '4px 10px', fontSize: 12, background: !filter ? CREAM : btn.background, color: !filter ? INK : LIGHT }}>all</button>
                {styles.map(s => <button key={s} onClick={() => setFilter(f => (f === s ? null : s))} title={ST[s].label} style={{ ...btn, padding: '4px 10px', fontSize: 12, whiteSpace: 'nowrap', background: filter === s ? CREAM : btn.background, color: filter === s ? INK : LIGHT }}>{TAG[s] || s}</button>)}
                {(aisle.kind === 'shorts' || aisle.kind === 'pants') && base.body === 'girl' && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 6, color: LIGHT, fontSize: 12, fontWeight: 800, textShadow: `1px 1px 0 ${WOOD}`, whiteSpace: 'nowrap' }}>
                    <input type="checkbox" checked={skirt} onChange={e => setSkirt(e.target.checked)} /> wear skirts
                  </label>
                )}
              </div>

              {/* the rack */}
              <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(104px, 1fr))', gap: 8, alignContent: 'start', paddingRight: 2 }}>
                {shown.map(it => {
                  const on = sel?.kind === it.kind && sel.s === it.s, mine = owned(it.kind), inCart = cart[it.kind]?.s === it.s;
                  const p: Piece = on && sel?.c ? { s: it.s, c: sel.c } : { s: it.s };
                  return (
                    <button key={it.s} onClick={() => setSel(on ? null : { kind: it.kind, s: it.s })} aria-pressed={on}
                      style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '10px 6px 8px', background: on ? '#f2c230' : CREAM, clipPath: CP, color: INK, boxShadow: on ? `inset 0 0 0 3px ${WOOD}` : 'none' }}>
                      <img src={icon(it.kind, look(it.kind, p))} alt="" style={{ width: 56, height: 48, imageRendering: 'pixelated' }} />
                      <span style={{ fontSize: 13, fontWeight: 800, lineHeight: 1.15, textAlign: 'center' }}>{it.name}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.65 }}>{TAG[it.s] || it.s}</span>
                      {(inCart || mine.s === it.s) && <span style={{ position: 'absolute', top: 4, right: 6, fontSize: 10, fontWeight: 800, color: inCart ? '#2f6b2f' : '#6b4a33' }}>{inCart ? 'in cart' : 'yours'}</span>}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* the picked piece: colour, and into the cart; or check out */}
          <div style={{ flex: 'none', display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 2 }}>
            {!viewCart && sel && (
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', alignItems: 'center', paddingBottom: 2 }}>
                <span style={{ color: LIGHT, fontSize: 12, fontWeight: 800, textShadow: `1px 1px 0 ${WOOD}`, flex: 'none' }}>colour</span>
                <Swatch c={colourOf(look(sel.kind, { s: sel.s }), sel.kind)[0]} on={!sel.c} onClick={() => setSel({ ...sel, c: undefined })} title="its own colour" />
                {Object.entries(COL).map(([name, c]) => <Swatch key={name} c={c[0]} on={sel.c === name} onClick={() => setSel({ ...sel, c: name })} title={name} />)}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <span style={{ color: LIGHT, fontSize: 12, fontWeight: 700, textShadow: `1px 1px 0 ${WOOD}`, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {viewCart ? (changed ? 'check out to put it all on' : '') : sel ? `${named(sel.kind, look(sel.kind, sel))}${sel.c ? ' · ' + sel.c : ''}` : 'tap something to try it on'}
              </span>
              {viewCart || !sel
                ? <Plank onClick={checkout} disabled={!changed}>check out ✓</Plank>
                : <Plank onClick={addToCart}>add to cart 🛒</Plank>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
