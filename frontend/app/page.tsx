'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import AccountMenu from '../components/AccountMenu';
import SignOutTag from '../components/SignOutTag';
import AdjustPanel from '../components/AdjustPanel';
import CharacterPanel, { type Avatar } from '../components/CharacterPanel';
import LocationSearch, { type Place } from '../components/LocationSearch';
import { api, SignIn, type User } from '../components/auth';
import type { Outfit, WeatherInput } from '../lib/types';

const Snug = dynamic(() => import('../components/Snug'), { ssr: false });

// the forecast comes back in well under a second; keep the loading world up long enough to enjoy.
// A forecast we've already seen this hour skips it: snug just poofs in (Snug's `quick`).
const MIN_LOADING_MS = 3600;
const hourKey = () => { const d = new Date(); return `${d.toDateString()} ${d.getHours()}`; };
// used when someone skips the "where are you" step
const FALLBACK_PLACE: Place = { name: 'Philadelphia, PA', lat: 39.9526, lon: -75.1652 };

interface Tuning { ideal: number; windAvoid: number; cloudAvoid: number }
interface Prefs { place: Place | null; units: '°F' | '°C'; onboarded: boolean; tuning: Tuning | null; avatar: Avatar | null }
interface Me { user: User | null; prefs: Prefs | null }
interface Checkin { felt: number; fit: string | null }
interface Forecast { forecastId: number | null; score: number; curve: number[]; label: string; outfit: Outfit; checkin: Checkin | null; cached: boolean }

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// The forecast last shown in this browser, so opening snug again in the same hour (same person and place) shows it
// straight away instead of replaying the loading world. The server is still asked in the background.
const SEEN_KEY = 'snug-seen';
interface Seen { key: string; weather: WeatherInput; forecastId: number | null; checkin: Checkin | null }
const seenKey = (uid: string, p: Place) => `${uid}|${p.lat}|${p.lon}|${hourKey()}`;
const readSeen = (uid: string | undefined, p: Place): Seen | null => {
  try {
    const s = JSON.parse(localStorage.getItem(SEEN_KEY) || 'null') as Seen | null;
    return uid && s && s.key === seenKey(uid, p) ? s : null;
  } catch { return null; }
};
const writeSeen = (s: Seen | null) => { try { if (s) localStorage.setItem(SEEN_KEY, JSON.stringify(s)); else localStorage.removeItem(SEEN_KEY); } catch { /* private mode */ } };

/** The element Snug's template exposes for us to render into (it mounts and unmounts as onboarding steps change). */
function useSlot(selector: string) {
  const [el, setEl] = useState<Element | null>(null);
  useEffect(() => {
    const find = () => setEl(prev => { const next = document.querySelector(selector); return next === prev ? prev : next; });
    find();
    const mo = new MutationObserver(find);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, [selector]);
  return el;
}

export default function Home() {
  const [me, setMe] = useState<Me | null>(null);
  const [goto, setGoto] = useState<{ step: number; seq: number }>({ step: 0, seq: 0 });
  const [weather, setWeather] = useState<WeatherInput | undefined>();
  const [forecastId, setForecastId] = useState<number | null>(null);
  const [checkin, setCheckin] = useState<Checkin | null>(null);
  const [done, setDone] = useState(false);
  const [quick, setQuick] = useState(false); // the forecast showing was one we already had: reveal it with just a poof
  const [adjusting, setAdjusting] = useState(false);
  // 'onboard': the character step between picking a place and tuning; 'edit': opened from the 📍 menu
  const [character, setCharacter] = useState<'onboard' | 'edit' | 'shop' | null>(null);
  const [refresh, setRefresh] = useState(0); // bump to re-run the forecast (after tuning)
  const loadedHour = useRef(''); // the hour the showing forecast was made in
  const lastRefresh = useRef(0);
  const authSlot = useSlot('[data-authslot]');
  const locSlot = useSlot('[data-locslot]');

  const user = me?.user ?? null;
  const prefs = me?.prefs ?? null;
  const showApp = !!(user && prefs?.onboarded);
  const place = prefs?.place ?? FALLBACK_PLACE;
  const step = (n: number) => setGoto(g => ({ step: n, seq: g.seq + 1 }));

  // show a forecast already seen this hour in the same render that the person arrives in, so the loading world never flashes
  const arrive = (m: Me) => {
    const hit = m.user && m.prefs?.onboarded ? readSeen(m.user.id, m.prefs.place ?? FALLBACK_PLACE) : null;
    if (hit) { setWeather(hit.weather); setForecastId(hit.forecastId); setCheckin(hit.checkin); setQuick(true); setDone(true); }
    setMe(m);
  };
  useEffect(() => { api<Me>('/me').then(arrive, () => setMe({ user: null, prefs: null })); }, []);

  const savePrefs = (body: Partial<Prefs>) => api<Prefs>('/me/prefs', body, 'PUT').then(p => { setMe(m => (m ? { ...m, prefs: p } : m)); return p; });

  // welcome -> signed in: returning people go straight to their forecast, new ones pick a place
  const signedIn = (u: User) => api<Me>('/me').then(m => { arrive(m); if (!m.prefs?.onboarded) step(1); }, () => setMe({ user: u, prefs: null }));
  const signOut = async () => {
    await api('/auth/logout', {}).catch(() => {});
    setMe({ user: null, prefs: null });
    setDone(false);
    setQuick(false);
    setWeather(undefined);
    step(0);
  };

  // weather -> forecast (personalized) -> reveal, whenever the app is showing for a person and place
  useEffect(() => {
    if (!showApp) return;
    let dead = false;
    const t0 = Date.now();
    // already seen this hour in this browser (and not asked to forecast again): show it now, check with the server quietly
    const forced = refresh !== lastRefresh.current;
    lastRefresh.current = refresh;
    const seen = forced ? null : readSeen(user?.id, place);
    if (seen) {
      setWeather(seen.weather); setForecastId(seen.forecastId); setCheckin(seen.checkin); setQuick(true); setDone(true);
      loadedHour.current = hourKey();
    } else {
      setDone(false);
      setQuick(false);
      setWeather(w => w ?? { condition: 'partly', hour: new Date().getHours() }); // a neutral sky until the real one lands
    }
    (async () => {
      let w: WeatherInput | null = null;
      for (let attempt = 0; !dead; attempt++) {
        try {
          if (!w) {
            w = await api<WeatherInput>(`/weather?lat=${place.lat}&lon=${place.lon}&name=${encodeURIComponent(place.name)}`);
            if (dead) return;
            if (!seen) setWeather(w);
          }
          const f = await api<Forecast>('/forecast', w);
          // the server's copy of this hour's forecast skips the loading world too (no minimum time, just the poof)
          if (!seen && !f.cached) await sleep(MIN_LOADING_MS - (Date.now() - t0));
          if (dead) return;
          const fc = { score: f.score, curve: f.curve, label: f.label, outfit: f.outfit };
          const sw = seen?.weather;
          // showing a seen forecast and the server agrees: leave the page exactly as it is
          const same = !!sw && JSON.stringify(fc) === JSON.stringify({ score: sw.score, curve: sw.curve, label: sw.label, outfit: sw.outfit });
          const shown = same ? sw : { ...w, ...fc };
          if (!same) setWeather(shown);
          setForecastId(f.forecastId);
          setCheckin(f.checkin);
          if (!seen) setQuick(f.cached);
          setDone(true);
          loadedHour.current = hourKey();
          if (user) writeSeen({ key: seenKey(user.id, place), weather: shown, forecastId: f.forecastId, checkin: f.checkin });
          return;
        } catch (e) {
          console.error(e);
          if (dead || (seen && attempt >= 2)) return; // what's showing is fine; stop asking
          await sleep(Math.min(6000, 1000 * 2 ** attempt)); // 1s, 2s, 4s, then every 6s
        }
      }
    })();
    return () => { dead = true; };
  }, [showApp, place.lat, place.lon, place.name, user?.id, refresh]);

  // Phones resume a backgrounded tab instead of reloading it, so coming back in a later hour would keep showing the
  // old hour's 12-hour curve. When the page comes back into view in a new hour, forecast again.
  useEffect(() => {
    if (!showApp) return;
    const check = () => {
      if (document.visibilityState === 'visible' && loadedHour.current && loadedHour.current !== hourKey()) {
        loadedHour.current = '';
        setRefresh(r => r + 1);
      }
    };
    document.addEventListener('visibilitychange', check);
    window.addEventListener('pageshow', check);
    window.addEventListener('focus', check);
    return () => {
      document.removeEventListener('visibilitychange', check);
      window.removeEventListener('pageshow', check);
      window.removeEventListener('focus', check);
    };
  }, [showApp]);

  // the evening check-in: how today actually felt, fed into future forecasts
  const onCheckin = useCallback(async ({ felt, fit }: { felt: number; fit: string | null }) => {
    if (forecastId == null) throw new Error('no forecast yet');
    await api('/checkins', { forecast_id: forecastId, felt, fit }).catch(() => { throw new Error('couldn’t save'); });
    setCheckin({ felt, fit });
    writeSeen(null); // a check-in changes the next forecast, so let it load fresh
  }, [forecastId]);

  const onFinishLogin = (tuning: Tuning | null) => {
    savePrefs({ onboarded: true, tuning, ...(prefs?.place ? {} : { place: FALLBACK_PLACE }) }).catch(console.error);
  };

  if (!me) return <div style={{ minHeight: '100vh', background: '#f3ede1' }} />;
  return (
    <div style={{ position: 'relative' }}>
      <Snug weather={showApp ? weather : undefined} units={prefs?.units} city={place.name.split(',')[0].toLowerCase()} loading={!done} quick={quick} checkin={checkin} avatar={prefs?.avatar} onChangeStyle={() => setCharacter('shop')}
        showApp={showApp} loginGoto={goto} placeSet={!!prefs?.place} onFinishLogin={onFinishLogin} onCheckin={onCheckin} />
      {!showApp && authSlot && createPortal(<SignIn user={user} onUser={signedIn} onContinue={() => step(prefs?.place ? 2 : 1)} onSignOut={signOut} />, authSlot)}
      {!showApp && locSlot && createPortal(<LocationSearch onPick={p => savePrefs({ place: p }).then(() => setCharacter('onboard'), console.error)} />, locSlot)}
      {showApp && user && (
        <div style={{ position: 'absolute', left: 16, top: 0, zIndex: 6 }}>
          <AccountMenu place={place} onPlace={p => savePrefs({ place: p }).catch(console.error)} onEditSnug={() => setCharacter('edit')} />
        </div>
      )}
      {showApp && user && done && <SignOutTag user={user} onSignOut={signOut} onAdjust={() => setAdjusting(true)} />}
      {character && (
        <CharacterPanel initial={prefs?.avatar} shopOnly={character === 'shop'} skipLabel={character === 'onboard' ? 'skip · keep the default' : 'cancel'}
          onDone={a => { savePrefs({ avatar: a }).catch(console.error); if (character === 'onboard') step(2); setCharacter(null); }}
          onSkip={() => { if (character === 'onboard') step(2); setCharacter(null); }} />
      )}
      {adjusting && <AdjustPanel onClose={changed => { setAdjusting(false); if (changed) setRefresh(r => r + 1); }} />}
    </div>
  );
}
