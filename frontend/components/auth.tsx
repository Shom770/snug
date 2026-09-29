'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';

export interface User { id: string; email: string; name: string | null; picture: string | null }
interface AuthConfig { google_client_id: string | null; dev_login: boolean }

declare global {
  interface Window { google?: { accounts: { oauth2: { initTokenClient(o: object): { requestAccessToken(o?: object): void } } } } }
}

export const WOOD = '#4a2e16', PLANK = '#a8743f', CREAM = '#fbf3e2', INK = '#27233a', LIGHT = '#fff1d2';
export const CP = 'polygon(0 4px,4px 4px,4px 0,calc(100% - 4px) 0,calc(100% - 4px) 4px,100% 4px,100% calc(100% - 4px),calc(100% - 4px) calc(100% - 4px),calc(100% - 4px) 100%,4px 100%,4px calc(100% - 4px),0 calc(100% - 4px))';

// every call gives up after 15s: a request stuck on a restarting backend must not leave the page waiting forever
export async function api<T>(path: string, body?: unknown, method = body === undefined ? 'GET' : 'POST'): Promise<T> {
  const res = await fetch('/backend' + path, { method, signal: AbortSignal.timeout(15000), headers: body === undefined ? undefined : { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
  if (!res.ok) throw Object.assign(new Error((await res.json().catch(() => null))?.detail || `${path} ${res.status}`), { status: res.status });
  return (res.status === 204 ? undefined : await res.json()) as T;
}

let cfgPromise: Promise<AuthConfig> | null = null;
const authConfig = () => (cfgPromise ??= api<AuthConfig>('/auth/config').catch(() => ({ google_client_id: null, dev_login: false })));

// the plank texture from the original design (same as the welcome sign and the snug board)
export const WOOD_TEX = `url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2232%22%20height%3D%2216%22%20shape-rendering%3D%22crispEdges%22%3E%3Crect%20width%3D%2232%22%20height%3D%2216%22%20fill%3D%22%23a8743f%22%2F%3E%3Crect%20y%3D%227%22%20width%3D%2232%22%20height%3D%221%22%20fill%3D%22%238a5c30%22%2F%3E%3Crect%20y%3D%2215%22%20width%3D%2232%22%20height%3D%221%22%20fill%3D%22%238a5c30%22%2F%3E%3Crect%20x%3D%223%22%20y%3D%222%22%20width%3D%227%22%20height%3D%221%22%20fill%3D%22%238a5c30%22%2F%3E%3Crect%20x%3D%2218%22%20y%3D%224%22%20width%3D%229%22%20height%3D%221%22%20fill%3D%22%238a5c30%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%2210%22%20width%3D%2211%22%20height%3D%221%22%20fill%3D%22%238a5c30%22%2F%3E%3Crect%20x%3D%2224%22%20y%3D%2212%22%20width%3D%225%22%20height%3D%221%22%20fill%3D%22%238a5c30%22%2F%3E%3Crect%20x%3D%2222%22%20y%3D%2210%22%20width%3D%222%22%20height%3D%222%22%20fill%3D%22%238a5c30%22%2F%3E%3Crect%20x%3D%221%22%20y%3D%220%22%20width%3D%2230%22%20height%3D%221%22%20fill%3D%22%23bf8a52%22%2F%3E%3Crect%20x%3D%2212%22%20y%3D%228%22%20width%3D%228%22%20height%3D%221%22%20fill%3D%22%23bf8a52%22%2F%3E%3C%2Fsvg%3E") 0 0/64px 32px`;
const G_LOGO = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.2l7.9 6.1C12.5 13.6 17.8 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.7 6c4.5-4.2 6.9-10.3 6.9-17.7z"/><path fill="#FBBC05" d="M10.6 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.8l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.7-6c-2.1 1.4-4.9 2.3-8.2 2.3-6.2 0-11.5-4.2-13.4-9.8l-7.9 6.1C6.6 42.6 14.6 48 24 48z"/></svg>');

const loadGsi = (() => {
  let p: Promise<void> | null = null;
  return () => (p ??= new Promise<void>((resolve, reject) => {
    if (window.google?.accounts?.oauth2) return resolve();
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => { p = null; reject(new Error('couldn’t reach google')); };
    document.head.appendChild(s);
  }));
})();

/**
 * The wooden "Continue with Google" button from the original design. Clicking opens Google's sign-in popup
 * (Google Identity Services token client); the backend checks the token with Google before starting a session.
 */
function GoogleButton({ clientId, onUser, onError }: { clientId: string; onUser: (u: User) => void; onError: (m: string) => void }) {
  const [hover, setHover] = useState(false), [down, setDown] = useState(false), [busy, setBusy] = useState(false);
  const cb = useRef({ onUser, onError });
  cb.current = { onUser, onError };
  useEffect(() => { loadGsi().catch(() => {}); }, []); // warm it up so the popup opens straight from the click
  const go = async () => {
    try {
      await loadGsi();
      window.google!.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'openid email profile',
        callback: (r: { access_token?: string; error?: string }) => {
          if (!r.access_token) { cb.current.onError(r.error === 'access_denied' ? 'sign-in was cancelled' : 'google sign-in failed'); return; }
          setBusy(true);
          api<User>('/auth/google', { access_token: r.access_token }).then(u => cb.current.onUser(u), e => cb.current.onError(e.message)).finally(() => setBusy(false));
        },
        error_callback: (e: { type?: string }) => cb.current.onError(e.type === 'popup_closed' ? 'sign-in was cancelled' : 'google sign-in failed'),
      }).requestAccessToken();
    } catch (e) { cb.current.onError((e as Error).message); }
  };
  const lift = down ? 'translateY(3px)' : hover ? 'translateY(-3px)' : 'none';
  const shadow = down ? '0 2px 0 #2e1a0c,0 6px 10px rgba(10,6,2,0.3)' : hover ? '0 9px 0 #2e1a0c,0 16px 22px rgba(10,6,2,0.4)' : '0 6px 0 #2e1a0c,0 12px 18px rgba(10,6,2,0.35)';
  return (
    <button onClick={go} disabled={busy} onMouseEnter={() => setHover(true)} onMouseLeave={() => { setHover(false); setDown(false); }} onMouseDown={() => setDown(true)} onMouseUp={() => setDown(false)}
      style={{ padding: 4, background: WOOD, clipPath: CP, transform: lift, boxShadow: shadow, filter: hover ? 'brightness(1.08)' : 'none', transition: 'transform .12s,box-shadow .12s,filter .12s' }}>
      <span style={{ height: 50, display: 'flex', alignItems: 'center', gap: 12, padding: '0 18px 0 7px', background: WOOD_TEX, clipPath: CP }}>
        <span style={{ padding: 2, background: WOOD, clipPath: CP }}>
          <span style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', clipPath: CP }}>
            <img src={G_LOGO} alt="" style={{ width: 20, height: 20, display: 'block' }} />
          </span>
        </span>
        <span style={{ color: LIGHT, fontSize: 19, fontWeight: 800, textShadow: `2px 2px 0 ${WOOD}`, whiteSpace: 'nowrap', letterSpacing: '0.2px' }}>{busy ? 'signing in…' : 'Continue with Google'}</span>
      </span>
    </button>
  );
}

const plankBtn = { padding: 4, background: WOOD, clipPath: CP, boxShadow: '0 6px 0 #2e1a0c' } as const;
const plankFace = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, height: 46, padding: '0 20px', background: PLANK, clipPath: CP, color: LIGHT, textShadow: `2px 2px 0 ${WOOD}`, fontSize: 17, fontWeight: 800, whiteSpace: 'nowrap' } as const;

/**
 * The welcome step's sign-in: Google once GOOGLE_CLIENT_ID is set, an email-only sign-in for local dev until then.
 * If someone is already signed in (they stepped back to the welcome screen), offer to carry on.
 */
export function SignIn({ user, onUser, onContinue, onSignOut }: { user: User | null; onUser: (u: User) => void; onContinue: () => void; onSignOut: () => void }) {
  const [cfg, setCfg] = useState<AuthConfig | null>(null);
  const [email, setEmail] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { authConfig().then(setCfg); }, []);

  if (user) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <button onClick={onContinue} style={plankBtn}><span style={plankFace}>continue as {(user.name || user.email).split(' ')[0].toLowerCase()} →</span></button>
        <button onClick={onSignOut} style={{ padding: '3px 10px', background: 'rgba(30,18,8,0.5)', color: LIGHT, fontSize: 12, fontWeight: 800 }}>not you? sign out</button>
      </div>
    );
  }
  if (!cfg) return <div style={{ height: 54 }} />;
  const dev = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try { onUser(await api<User>('/auth/dev', { email })); } catch (x) { setErr((x as Error).message); } finally { setBusy(false); }
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      {cfg.google_client_id && <GoogleButton clientId={cfg.google_client_id} onUser={onUser} onError={setErr} />}
      {!cfg.google_client_id && cfg.dev_login && (
        <form onSubmit={dev} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div style={{ padding: 3, background: WOOD, clipPath: CP }}>
            <input type="email" required placeholder="your email" value={email} onChange={e => setEmail(e.target.value)} aria-label="email"
              style={{ display: 'block', width: 260, height: 46, padding: '0 14px', border: 'none', outline: 'none', background: '#f6e8c6', color: '#2e1a0c', font: 'inherit', fontSize: 15, fontWeight: 700, clipPath: CP }} />
          </div>
          <button disabled={busy} style={plankBtn}><span style={plankFace}>{busy ? '…' : 'sign in →'}</span></button>
          <span style={{ padding: '3px 10px', background: 'rgba(30,18,8,0.5)', color: LIGHT, fontSize: 11, fontWeight: 700 }}>dev sign-in (no password) until Google is set up</span>
        </form>
      )}
      {!cfg.google_client_id && !cfg.dev_login && <span style={{ color: LIGHT, fontWeight: 800 }}>sign-in isn’t set up yet</span>}
      {err && <span style={{ padding: '3px 10px', background: 'rgba(120,20,10,0.75)', color: LIGHT, fontSize: 12, fontWeight: 800 }}>{err}</span>}
    </div>
  );
}
