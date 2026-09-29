'use client';
import { useCallback, useState, type ReactNode } from 'react';
import { CP, CREAM, INK, LIGHT, PLANK, WOOD, WOOD_TEX } from './auth';
import ShopStreet, { type ShopPhase } from './ShopStreet';
import { itemSprite } from '../lib/engine';
import { AV_DEFAULT, HAIRC, HAIRS, SKINS, STYLES, nameOf, sprite } from '../lib/engine';

export interface Avatar { skin: string; body: 'boy' | 'girl'; hair: string; hairColor: string; style: string; skirt: boolean }
type Outfit = { top: string; outer: string; bottom: string; acc: string[] };

const S = STYLES as Record<string, { label: string; hint: string; pal?: Record<string, string[]> }>;
const SK = SKINS as Record<string, string[]>, HC = HAIRC as Record<string, string[]>;
const draw = sprite as (o: Outfit, mood: string, pose: string, av: Avatar) => string;
const name = nameOf as (k: string, av: Avatar) => string;

// the preview can be tried on in a few kinds of weather, so you see how your style dresses for each
const TRY: { label: string; o: Outfit }[] = [
  { label: 'mild', o: { top: 'long', outer: 'light', bottom: 'pants', acc: [] } },
  { label: 'hot', o: { top: 'tee', outer: 'none', bottom: 'shorts', acc: ['sunglasses'] } },
  { label: 'cold', o: { top: 'sweater', outer: 'coat', bottom: 'pants', acc: ['beanie', 'scarf'] } },
  { label: 'rainy', o: { top: 'tee', outer: 'rain', bottom: 'pants', acc: [] } },
];
// original shop names (the brand names only appear as hints of the vibe)
const SHOP_NAMES: Record<string, string> = {
  casual: 'denim & co.', surf: 'surf shack', minimal: 'atelier', sporty: 'the locker', street: 'drop', preppy: 'the outfitter', cozy: 'nest',
};
const SHOPS = Object.entries(S).map(([id, st]) => ({ id, name: SHOP_NAMES[id] || st.label, label: st.label, hint: st.hint }));
const HAIR_LABEL: Record<string, string> = { short: 'short', buzz: 'buzz', curly: 'curly', bob: 'bob', long: 'long', ponytail: 'ponytail', bun: 'bun', afro: 'afro', braids: 'braids' };


const Chip = ({ on, onClick, children, title }: { on: boolean; onClick: () => void; children: ReactNode; title?: string }) => (
  <button onClick={onClick} title={title} aria-pressed={on}
    style={{ padding: '6px 11px', background: on ? '#f2c230' : CREAM, color: INK, fontSize: 13, fontWeight: 800, clipPath: CP, boxShadow: on ? `inset 0 0 0 2px ${WOOD}` : 'none' }}>{children}</button>
);
const Swatch = ({ c, on, onClick, title }: { c: string; on: boolean; onClick: () => void; title: string }) => (
  <button onClick={onClick} title={title} aria-label={title} aria-pressed={on}
    style={{ width: 32, height: 32, padding: 3, background: on ? '#f2c230' : WOOD, clipPath: CP }}>
    <span style={{ display: 'block', width: '100%', height: '100%', background: c, clipPath: CP }} />
  </button>
);

/**
 * "Make your snug": skin, girl/boy, hair, hair colour and a clothing style. Frontend only; Jev still picks the kind of
 * clothes, the style decides what they look like and are called. Skipping keeps the default look.
 */
export default function CharacterPanel({ initial, onDone, onSkip, skipLabel = 'skip · keep the default', shopOnly = false }: {
  initial?: Partial<Avatar> | null; onDone: (a: Avatar) => void; onSkip: () => void; skipLabel?: string;
  /** just the shopping street, for a quick outfit change (no skin/hair steps) */
  shopOnly?: boolean;
}) {
  const [av, setAv] = useState<Avatar>({ ...(AV_DEFAULT as Avatar), ...(initial || {}) });
  const set = (p: Partial<Avatar>) => setAv(a => ({ ...a, ...p }));
  const [step, setStep] = useState(shopOnly ? 3 : 0);
  const [tried, setTried] = useState(false); // you have to try a shop on before you can keep a style
  const [shopStatus, setShopStatus] = useState<{ phase: ShopPhase; name: string; label: string; hint: string }>({ phase: 'idle', name: '', label: '', hint: '' });
  const onShopStatus = useCallback((phase: ShopPhase, shop: { name: string; label: string; hint: string }) => setShopStatus({ phase, name: shop.name, label: shop.label, hint: shop.hint }), []);
  // until the shopping step snug wears plain basics, whatever style is set, so the base look is all you see
  const BASICS: Outfit = { top: 'tee', outer: 'none', bottom: 'pants', acc: [] };
  const basic = (a: Avatar) => ({ ...a, style: 'casual', skirt: false });
  const shopping = step === 3;
  const preview = draw(BASICS, 'happy', 'stand', basic(av));

  // one thing at a time, so it never feels like a wall of options
  const STEPS: { title: string; body: ReactNode }[] = [
    { title: 'skin', body: <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>{Object.entries(SK).map(([k, c]) => <Swatch key={k} c={c[0]} on={av.skin === k} onClick={() => set({ skin: k })} title={k} />)}</div> },
    { title: 'girl or boy', body: (
      <>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <Chip on={av.body === 'girl'} onClick={() => set({ body: 'girl', hair: av.hair === 'short' ? 'long' : av.hair })}>girl</Chip>
          <Chip on={av.body === 'boy'} onClick={() => set({ body: 'boy', skirt: false, hair: av.hair === 'long' ? 'short' : av.hair })}>boy</Chip>
        </div>
        {av.body === 'girl' && (
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: LIGHT, fontSize: 13, fontWeight: 800, textShadow: `1px 1px 0 ${WOOD}` }}>
            <input type="checkbox" checked={av.skirt} onChange={e => set({ skirt: e.target.checked })} /> skirts instead of shorts
          </label>
        )}
      </>
    ) },
    { title: 'hair', body: (
      <>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>{(HAIRS as string[]).map(h => <Chip key={h} on={av.hair === h} onClick={() => set({ hair: h })}>{HAIR_LABEL[h] || h}</Chip>)}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>{Object.entries(HC).map(([k, c]) => <Swatch key={k} c={c[0]} on={av.hairColor === k} onClick={() => set({ hairColor: k })} title={k} />)}</div>
      </>
    ) },
    { title: 'go shopping', body: (
      <>
        <ShopStreet shops={SHOPS} current={av.style} onBuy={st => { set({ style: st }); setTried(true); }}
          dress={(st, pose) => draw(TRY[0].o, 'happy', pose, { ...av, style: st })}
          item={(st, k) => (itemSprite as (k: string, a: Avatar) => string)(k, { ...av, style: st })}
          onStatus={onShopStatus} />
        <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: LIGHT, textShadow: `1px 1px 0 ${WOOD}` }}>{shopStatus.phase === 'ride' ? `riding to ${shopStatus.name}…` : shopStatus.phase === 'park' || shopStatus.phase === 'inside' ? `trying things on at ${shopStatus.name}…` : `${shopStatus.name} · ${shopStatus.label} · ${shopStatus.hint}`}</div>
      </>
    ) },
  ];
  const last = step === STEPS.length - 1;

  return (
    <div role="dialog" aria-modal="true" aria-label="make your snug"
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12, background: 'rgba(20,14,30,0.55)', backdropFilter: 'blur(3px)', fontFamily: "'Rethink Sans',sans-serif" }}>
      <div style={{ width: 'min(520px, 100%)', maxHeight: '100%', overflowY: 'auto', padding: 5, background: WOOD, clipPath: CP, boxShadow: '0 20px 40px rgba(0,0,0,0.35)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '16px 18px 16px', background: WOOD_TEX, clipPath: CP }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, color: LIGHT, textShadow: `2px 2px 0 ${WOOD}` }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, opacity: 0.85 }}>{shopOnly ? 'CHANGE YOUR STYLE' : `MAKE YOUR SNUG · ${step + 1} OF ${STEPS.length}`}</div>
              <div style={{ fontSize: 22, fontWeight: 800, marginTop: 2 }}>{STEPS[step].title}</div>
            </div>
            <div style={{ display: 'flex', gap: 5 }} aria-hidden>
              {!shopOnly && STEPS.map((_, i) => <span key={i} style={{ width: i === step ? 18 : 8, height: 8, background: i <= step ? '#f2c230' : 'rgba(255,241,210,0.35)', transition: 'width .2s' }} />)}
            </div>
          </div>

          {/* live preview in plain basics (the street is the preview while shopping) */}
          {!shopping && <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 150, height: 186, padding: 3, background: WOOD, clipPath: CP }}>
              <div style={{ height: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'linear-gradient(#9fd0f2, #d9eef8 70%, #86c162 70%)', clipPath: CP }}>
                <img src={preview} alt="your snug" style={{ width: 138, height: 174, imageRendering: 'pixelated', display: 'block' }} />
              </div>
            </div>
          </div>}

          <div key={step} style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 90, animation: 'snug-step .25s both' }}>
            <style>{'@keyframes snug-step{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:none}}'}</style>
            {STEPS[step].body}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
            <button onClick={onSkip} style={{ padding: '6px 12px', background: 'rgba(30,18,8,0.55)', color: LIGHT, fontSize: 13, fontWeight: 800 }}>{skipLabel}</button>
            <div style={{ display: 'flex', gap: 8 }}>
              {step > 0 && !shopOnly && <button onClick={() => setStep(step - 1)} style={{ padding: '6px 12px', background: 'rgba(30,18,8,0.55)', color: LIGHT, fontSize: 13, fontWeight: 800 }}>← back</button>}
              <button onClick={() => (last ? onDone(av) : setStep(step + 1))} disabled={last && !tried} title={last && !tried ? 'try something on first' : undefined}
                style={{ padding: 4, background: WOOD, clipPath: CP, opacity: last && !tried ? 0.45 : 1, cursor: last && !tried ? 'not-allowed' : 'pointer', transition: 'opacity .2s' }}>
                <span style={{ display: 'block', padding: '8px 18px', background: PLANK, clipPath: CP, color: LIGHT, fontSize: 15, fontWeight: 800, textShadow: `2px 2px 0 ${WOOD}` }}>{shopOnly ? 'wear this ✓' : last ? 'this is me →' : 'next →'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
