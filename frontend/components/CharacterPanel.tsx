'use client';
import { useState, type ReactNode } from 'react';
import { CP, CREAM, INK, LIGHT, PLANK, WOOD, WOOD_TEX } from './auth';
import { AV_DEFAULT, HAIRC, HAIRS, SKINS, sprite } from '../lib/engine';

/** One piece snug owns: which style's version of a kind of clothing, in an optional shop colour. */
export interface Piece { s: string; c?: string }
export interface Avatar { skin: string; body: 'boy' | 'girl'; hair: string; hairColor: string; style: string; skirt: boolean; wardrobe?: Record<string, Piece> }
export type Outfit = { top: string; outer: string; bottom: string; acc: string[] };

const SK = SKINS as Record<string, string[]>, HC = HAIRC as Record<string, string[]>;
const draw = sprite as (o: Outfit, mood: string, pose: string, av: Avatar) => string;
const HAIR_LABEL: Record<string, string> = { short: 'short', buzz: 'buzz', curly: 'curly', bob: 'bob', long: 'long', ponytail: 'ponytail', bun: 'bun', afro: 'afro', braids: 'braids' };
// what snug wears in the preview here; the clothes themselves are picked at the shop
const BASICS: Outfit = { top: 'tee', outer: 'none', bottom: 'pants', acc: [] };

export const Chip = ({ on, onClick, children, title }: { on: boolean; onClick: () => void; children: ReactNode; title?: string }) => (
  <button onClick={onClick} title={title} aria-pressed={on}
    style={{ padding: '6px 11px', background: on ? '#f2c230' : CREAM, color: INK, fontSize: 13, fontWeight: 800, clipPath: CP, boxShadow: on ? `inset 0 0 0 2px ${WOOD}` : 'none', whiteSpace: 'nowrap' }}>{children}</button>
);
export const Swatch = ({ c, on, onClick, title }: { c: string; on: boolean; onClick: () => void; title: string }) => (
  <button onClick={onClick} title={title} aria-label={title} aria-pressed={on}
    style={{ width: 32, height: 32, flex: 'none', padding: 3, background: on ? '#f2c230' : WOOD, clipPath: CP }}>
    <span style={{ display: 'block', width: '100%', height: '100%', background: c, clipPath: CP }} />
  </button>
);

/**
 * Who snug is. Signing up only asks girl or boy ('onboard'); "edit my snug" also has skin and hair ('edit').
 * Clothes aren't here: those are bought at the shop in the app.
 */
export default function CharacterPanel({ initial, mode, onDone, onSkip }: {
  initial?: Partial<Avatar> | null; mode: 'onboard' | 'edit'; onDone: (a: Avatar) => void; onSkip: () => void;
}) {
  const [av, setAv] = useState<Avatar>({ ...(AV_DEFAULT as Avatar), ...(initial || {}) });
  const set = (p: Partial<Avatar>) => setAv(a => ({ ...a, ...p }));
  const [step, setStep] = useState(0);

  const body = (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
      <Chip on={av.body === 'girl'} onClick={() => set({ body: 'girl', hair: av.hair === 'short' ? 'long' : av.hair })}>girl</Chip>
      <Chip on={av.body === 'boy'} onClick={() => set({ body: 'boy', skirt: false, hair: av.hair === 'long' ? 'short' : av.hair })}>boy</Chip>
    </div>
  );
  const STEPS: { title: string; body: ReactNode }[] = mode === 'onboard' ? [{ title: 'girl or boy?', body }] : [
    { title: 'skin', body: <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>{Object.entries(SK).map(([k, c]) => <Swatch key={k} c={c[0]} on={av.skin === k} onClick={() => set({ skin: k })} title={k} />)}</div> },
    { title: 'girl or boy', body },
    { title: 'hair', body: (
      <>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>{(HAIRS as string[]).map(h => <Chip key={h} on={av.hair === h} onClick={() => set({ hair: h })}>{HAIR_LABEL[h] || h}</Chip>)}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>{Object.entries(HC).map(([k, c]) => <Swatch key={k} c={c[0]} on={av.hairColor === k} onClick={() => set({ hairColor: k })} title={k} />)}</div>
      </>
    ) },
  ];
  const last = step === STEPS.length - 1;

  return (
    <div role="dialog" aria-modal="true" aria-label={mode === 'onboard' ? 'make your snug' : 'edit your snug'}
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12, background: 'rgba(20,14,30,0.55)', backdropFilter: 'blur(3px)', fontFamily: "'Rethink Sans',sans-serif" }}>
      <div style={{ width: 'min(440px, 100%)', maxHeight: '100%', overflowY: 'auto', padding: 5, background: WOOD, clipPath: CP, boxShadow: '0 20px 40px rgba(0,0,0,0.35)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '16px 18px 16px', background: WOOD_TEX, clipPath: CP }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, color: LIGHT, textShadow: `2px 2px 0 ${WOOD}` }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, opacity: 0.85 }}>{mode === 'onboard' ? 'MAKE YOUR SNUG' : `EDIT YOUR SNUG · ${step + 1} OF ${STEPS.length}`}</div>
              <div style={{ fontSize: 22, fontWeight: 800, marginTop: 2 }}>{STEPS[step].title}</div>
            </div>
            {STEPS.length > 1 && <div style={{ display: 'flex', gap: 5 }} aria-hidden>
              {STEPS.map((_, i) => <span key={i} style={{ width: i === step ? 18 : 8, height: 8, background: i <= step ? '#f2c230' : 'rgba(255,241,210,0.35)', transition: 'width .2s' }} />)}
            </div>}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: 150, height: 186, padding: 3, background: WOOD, clipPath: CP }}>
              <div style={{ height: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'linear-gradient(#9fd0f2, #d9eef8 70%, #86c162 70%)', clipPath: CP }}>
                <img src={draw(BASICS, 'happy', 'stand', av)} alt="your snug" style={{ width: 138, height: 174, imageRendering: 'pixelated', display: 'block' }} />
              </div>
            </div>
          </div>

          <div key={step} style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 50, animation: 'snug-step .25s both' }}>
            <style>{'@keyframes snug-step{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:none}}'}</style>
            {STEPS[step].body}
          </div>
          {mode === 'onboard' && <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: LIGHT, textShadow: `1px 1px 0 ${WOOD}` }}>you'll pick their clothes at the shop 🛍</div>}

          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
            <button onClick={onSkip} style={{ padding: '6px 12px', background: 'rgba(30,18,8,0.55)', color: LIGHT, fontSize: 13, fontWeight: 800 }}>{mode === 'onboard' ? 'skip' : 'cancel'}</button>
            <div style={{ display: 'flex', gap: 8 }}>
              {step > 0 && <button onClick={() => setStep(step - 1)} style={{ padding: '6px 12px', background: 'rgba(30,18,8,0.55)', color: LIGHT, fontSize: 13, fontWeight: 800 }}>← back</button>}
              <button onClick={() => (last ? onDone(av) : setStep(step + 1))} style={{ padding: 4, background: WOOD, clipPath: CP }}>
                <span style={{ display: 'block', padding: '8px 18px', background: PLANK, clipPath: CP, color: LIGHT, fontSize: 15, fontWeight: 800, textShadow: `2px 2px 0 ${WOOD}` }}>{last ? (mode === 'onboard' ? 'this is me →' : 'save ✓') : 'next →'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
