'use client';
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CP, LIGHT, PLANK, WOOD, type User } from './auth';

const rope: CSSProperties = { width: 3, height: '100%', background: 'repeating-linear-gradient(180deg,#7a5634 0 3px,#5e3c20 3px 6px)' };

/**
 * Little planks hanging under the "snug" board (top-right of the scene): "sign out", and hanging from that,
 * "adjust" (scores feel off? pick between weathers to tune them).
 */
export default function SignOutTag({ user, onSignOut, onAdjust }: { user: User; onSignOut: () => void; onAdjust: () => void }) {
  const [board, setBoard] = useState<HTMLElement | null>(null);
  const [pos, setPos] = useState<{ right: number; top: number } | null>(null);
  const [landed, setLanded] = useState(false);
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 759px)'); // same breakpoint as the scene's phone layout
    const on = () => setNarrow(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  // the board is part of Snug's template; find it, then follow its size and place
  useEffect(() => {
    const find = () => setBoard(document.querySelector<HTMLElement>('[data-rv="board"]'));
    find();
    const mo = new MutationObserver(find);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, []);
  // wait for the board to finish dropping in: the reveal drives its inline opacity and clears it once it has landed
  // (its transform can't be the signal; the board keeps swaying in the wind after that)
  useEffect(() => {
    if (!board) return;
    const check = () => { if (board.style.opacity === '') setLanded(true); };
    const t = setTimeout(check, 50);
    const mo = new MutationObserver(check);
    mo.observe(board, { attributes: true, attributeFilter: ['style'] });
    return () => { clearTimeout(t); mo.disconnect(); };
  }, [board]);
  useEffect(() => {
    if (!board?.parentElement) return;
    const parent = board.parentElement;
    const place = () => setPos({ right: parent.clientWidth - (board.offsetLeft + board.offsetWidth) + board.offsetWidth / 2, top: board.offsetTop + board.offsetHeight - 2 });
    place();
    const ro = new ResizeObserver(place);
    ro.observe(board);
    ro.observe(parent);
    return () => ro.disconnect();
  }, [board]);

  if (!board?.parentElement || !pos || !landed) return null;
  const signOut = <Hang label="sign out" title={`signed in as ${user.email}`} onClick={onSignOut} ropeW={54} />;
  return createPortal(
    <div style={{ position: 'absolute', right: pos.right, top: pos.top, transform: 'translateX(50%)', zIndex: 2, perspective: 500, pointerEvents: 'none', fontFamily: "'Rethink Sans',sans-serif" }}>
      {/* folded up behind the board, it flips down over the bottom edge, overshoots, and swings to rest */}
      <style>{`@keyframes snug-flip{
        0%{transform:rotateX(-180deg);opacity:0} 8%{opacity:1}
        55%{transform:rotateX(24deg)} 72%{transform:rotateX(-12deg) rotateZ(3deg)}
        86%{transform:rotateX(5deg) rotateZ(-2deg)} 100%{transform:rotateX(0) rotateZ(0)}}`}</style>
      {narrow ? (
        // phones: both hang straight from the board side by side, one row tall, so the score below stays clear
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <Flip>{signOut}</Flip>
          <Flip delay={0.35}><Hang label="adjust" title="scores feel off? tune them by picking between weathers" onClick={onAdjust} ropeW={46} /></Flip>
        </div>
      ) : (
        <Flip>
          {signOut}
          {/* "adjust" hangs from the sign-out plank and flips down after it (its ropes tuck behind that plank) */}
          <div style={{ position: 'relative', zIndex: -1, marginTop: -14 }}>
            <Flip delay={0.75}><Hang label="adjust preferences" title="scores feel off? tune them by picking between weathers" onClick={onAdjust} ropeW={64} ropeH={26} tuck={0} /></Flip>
          </div>
        </Flip>
      )}
    </div>,
    board.parentElement,
  );
}

function Flip({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', transformOrigin: '50% 0', animation: `snug-flip 1.1s ${delay}s cubic-bezier(.3,.7,.4,1) both`, backfaceVisibility: 'hidden' }}>{children}</div>;
}

/** a plank on two ropes; the ropes' tops tuck up behind whatever it hangs from, so a swing never shows their ends */
function Hang({ label, title, onClick, ropeW, ropeH = 36, tuck = 24 }: { label: string; title: string; onClick: () => void; ropeW: number; ropeH?: number; tuck?: number }) {
  return (
    <div className="snug-hang" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: -tuck, pointerEvents: 'none' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: ropeW, height: ropeH }}><span style={rope} /><span style={rope} /></div>
      <button className="snug-plank" onClick={onClick} title={title} style={{ padding: 3, background: WOOD, clipPath: CP, pointerEvents: 'auto' }}>
        <span style={{ display: 'block', padding: '4px 12px', background: PLANK, clipPath: CP, color: LIGHT, fontSize: 13, fontWeight: 800, textShadow: `2px 2px 0 ${WOOD}`, whiteSpace: 'nowrap' }}>{label}</span>
      </button>
    </div>
  );
}
