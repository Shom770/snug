'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CREAM, INK, WOOD } from './auth';

/**
 * A speech bubble over snug, "take me shopping?", until they've been to the shop (or closed it). It sits next to
 * snug's sprite in the scene and follows it around as the layout changes.
 */
export default function ShopNudge({ onShop, onDismiss }: { onShop: () => void; onDismiss: () => void }) {
  const [av, setAv] = useState<HTMLElement | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  useEffect(() => {
    const tick = () => {
      const el = document.querySelector<HTMLElement>('[data-rv="av"]');
      setAv(el);
      if (el && el.offsetParent) setPos({ left: el.offsetLeft + el.offsetWidth * 0.62, top: el.offsetTop - 8 });
    };
    tick();
    const iv = setInterval(tick, 400);
    return () => clearInterval(iv);
  }, []);
  if (!av?.parentElement || !pos) return null;
  return createPortal(
    <div style={{ position: 'absolute', left: pos.left, top: pos.top, transform: 'translateY(-100%)', zIndex: 3, fontFamily: "'Rethink Sans',sans-serif", animation: 'snug-nudge 2.6s ease-in-out infinite' }}>
      <style>{'@keyframes snug-nudge{0%,100%{transform:translateY(-100%)}50%{transform:translateY(calc(-100% - 4px))}}'}</style>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 6, padding: '7px 8px 7px 12px', background: CREAM, color: INK, borderRadius: 12, boxShadow: `0 3px 0 ${WOOD}, 0 6px 14px rgba(20,10,4,0.25)`, whiteSpace: 'nowrap' }}>
        <button onClick={onShop} style={{ fontSize: 13, fontWeight: 800, color: INK }}>take me shopping?</button>
        <button onClick={onDismiss} aria-label="not now" style={{ fontSize: 13, fontWeight: 800, color: INK, opacity: 0.5, padding: '0 4px' }}>×</button>
        <span aria-hidden style={{ position: 'absolute', left: 14, bottom: -7, width: 12, height: 12, background: CREAM, transform: 'rotate(45deg)', boxShadow: `3px 3px 0 ${WOOD}` }} />
      </div>
    </div>,
    av.parentElement,
  );
}
