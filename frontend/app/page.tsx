'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import AccountMenu from '../components/AccountMenu';
import SignOutTag from '../components/SignOutTag';
import AdjustPanel from '../components/AdjustPanel';
import CharacterPanel, { type Avatar } from '../components/CharacterPanel';
import ShopPanel from '../components/ShopPanel';
import ShopNudge from '../components/ShopNudge';
import Chair, { ChairPage, chairSnugAt, usePoofed, type ChairDay } from '../components/Chair';
import Jam from '../components/Jam';
import { wearing as isWearing } from '../lib/engine';
import World, { type WorldPage } from '../components/World';
import Thrift, { thriftSnugAt, type ThriftTop } from '../components/Thrift';
import Boutique, { boutiqueSnugAt, type MaisonPiece } from '../components/Boutique';
import Airport, { airportSnugAt } from '../components/Airport';
import Drive, { Fade, type Dest } from '../components/Drive';
import { maisonDrop, seasonAt, thriftRack, thriftTheme, thriftWeek } from '../lib/closet';
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
interface Forecast { forecastId: number | null; score: number; curve: number[]; startHour: number; label: string; outfit: Outfit; checkin: Checkin | null; cached: boolean }
// the next day's outfit, folded on a chair next to snug in the evening
interface Tomorrow { date: string; outfit: Outfit; label: string; curve: number[]; startHour: number; hi: number; lo: number }

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
// the windshield on these days: wipers going, or snow coming at it
const WET_SKY = ['drizzle', 'rain', 'storm', 'hail', 'sleet'], SNOW_SKY = ['snow', 'blizzard'];

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
// the chair snug saw last night ({date, outfit}), so the next morning it grabs the pile as it poofs into the day
const CHAIR_KEY = 'snug-chair';
const readChair = (): { date: string; outfit: Outfit } | null => { try { return JSON.parse(localStorage.getItem(CHAIR_KEY) || 'null'); } catch { return null; } };
const writeChair = (c: { date: string; outfit: Outfit } | null) => { try { if (c) localStorage.setItem(CHAIR_KEY, JSON.stringify(c)); else localStorage.removeItem(CHAIR_KEY); } catch { /* private mode */ } };
// a local date's day number (days since 1970), which is how the closet rotates snug's pieces day to day
const dayNo = (d: string) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10)) / 86400000;
const nextDate = (d: string) => new Date((dayNo(d) + 1) * 86400000).toISOString().slice(0, 10);

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
  // 'onboard': girl or boy, between picking a place and tuning; 'edit': skin, girl/boy, hair, from the 📍 menu
  const [character, setCharacter] = useState<'onboard' | 'edit' | null>(null);
  const [shopping, setShopping] = useState<false | 'shop' | 'closet'>(false);
  // the "take me shopping?" bubble shows until they've been to the shop or closed it
  const [nudged, setNudged] = useState(() => { try { return localStorage.getItem('snug-shop-nudge') === 'done'; } catch { return false; } });
  const settleNudge = () => { setNudged(true); try { localStorage.setItem('snug-shop-nudge', 'done'); } catch { /* private mode */ } };
  const openShop = () => { settleNudge(); setShopping('shop'); };
  const openCloset = () => setShopping('closet');
  const [tomorrow, setTomorrow] = useState<Tomorrow | null>(null);
  const [morning, setMorning] = useState<{ date: string; outfit: Outfit } | null>(null);
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
          const same = !!sw && w.night === sw.night && w.golden === sw.golden // the sun may have set since
            && JSON.stringify(fc) === JSON.stringify({ score: sw.score, curve: sw.curve, label: sw.label, outfit: sw.outfit });
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
  // old hour's 12-hour curve. When the page comes back into view in a new hour, forecast again; and a tab left open in
  // view (a computer) checks each minute, so it moves on with the hour too.
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
    const iv = setInterval(check, 60000);
    return () => {
      clearInterval(iv);
      document.removeEventListener('visibilitychange', check);
      window.removeEventListener('pageshow', check);
      window.removeEventListener('focus', check);
    };
  }, [showApp]);

  // The chair: once the sun is down (or they've checked in for the day), the next day's outfit, folded beside snug.
  // Before sunrise "the next day" is today. Asked again every hour, so a changed forecast changes the pile.
  const placeDate = weather?.time?.slice(0, 10) ?? null;
  const placeHour = weather?.time ? +weather.time.slice(11, 13) : 0;
  // ?chair shows it any time of day, for trying it out
  const forceChair = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('chair');
  // asked as soon as the place's time is known, alongside today's forecast, so the chair can poof in with snug
  const evening = !!(showApp && placeDate && (weather?.dark || checkin || forceChair));
  const chairDate = !placeDate ? null : weather?.dark && placeHour < 12 ? placeDate : nextDate(placeDate);
  useEffect(() => {
    if (!evening || !chairDate) { setTomorrow(null); return; }
    let dead = false;
    (async () => {
      try {
        const w = await api<WeatherInput>(`/weather?lat=${place.lat}&lon=${place.lon}&name=${encodeURIComponent(place.name)}&day=${chairDate}`);
        const f = await api<Forecast>('/forecast', w);
        if (dead) return;
        setTomorrow({ date: chairDate, outfit: f.outfit, label: f.label, curve: f.curve, startHour: f.startHour, hi: w.hi ?? 0, lo: w.lo ?? 0 });
        writeChair({ date: chairDate, outfit: f.outfit });
      } catch (e) { console.error('tomorrow', e); }
    })();
    return () => { dead = true; };
  }, [evening, chairDate, place.lat, place.lon, place.name, refresh]);
  // the morning after: the chair from last night is still there, and snug takes the pile as it poofs
  useEffect(() => {
    if (!showApp || !placeDate || weather?.dark) return;
    const c = readChair();
    if (c && c.date === placeDate) setMorning(c);
    else if (c && c.date < placeDate) writeChair(null);
  }, [showApp, placeDate, weather?.dark]);
  const grabbed = useCallback(() => { writeChair(null); setMorning(null); }, []);

  // phones walk to the chair on its own page; computers have it right beside snug
  const [phone, setPhone] = useState(false);
  // driving somewhere: from which page of the world; and where the car dropped snug off (the world jumps there)
  const [driving, setDriving] = useState<{ from: number } | null>(null);
  const [jump, setJump] = useState<{ page: number; key: number } | null>(null);
  const [homeward, setHomeward] = useState(false); // fading straight home from a place snug drove to
  useEffect(() => { const m = () => setPhone(window.innerWidth < 760); m(); window.addEventListener('resize', m); return () => window.removeEventListener('resize', m); }, []);
  const poofed = usePoofed();

  // headphones on and a nice day out: snug jams
  const nice = !!weather?.score && weather.score >= 60 && !['rain', 'drizzle', 'storm', 'snow', 'sleet', 'blizzard', 'hail'].includes(weather.condition ?? '');
  const jamming = showApp && done && poofed && nice && !!prefs?.avatar && isWearing(prefs.avatar, 'headphones');

  // the thrift store's rack: this week's, for the season where they are
  const thrift = (() => {
    if (!placeDate) return null;
    const { week, next } = thriftWeek(placeDate), season = seasonAt(placeDate, place.lat);
    return { rack: thriftRack(week, season) as ThriftTop[], theme: thriftTheme(week, season).label as string, next: next as number, season: season as string,
      maison: maisonDrop(week, season) as { extras: MaisonPiece[]; pieces: MaisonPiece[] } };
  })();
  const closet = prefs?.avatar?.wardrobe ?? {};
  const owned = new Set(Object.values(closet).flatMap(v => (Array.isArray(v) ? v : [v])).map(p => p?.id).filter(Boolean) as string[]);
  const takeHome = (it: { id: string; kind: string }) => {
    if (!prefs) return;
    const mine = closet[it.kind], list = !mine ? [] : Array.isArray(mine) ? mine : [mine];
    if (list.some(p => p.id === it.id) || list.length >= 12) return;
    savePrefs({ avatar: { ...(prefs.avatar ?? {}), wardrobe: { ...closet, [it.kind]: [...list, { id: it.id }] } } as Avatar }).catch(console.error);
  };

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

  const tomorrowWord = (t: Tomorrow) => (t.date === placeDate ? 'today' : 'tomorrow');
  const chairProps = (t: Tomorrow) => ({
    outfit: t.outfit, avatar: { ...prefs?.avatar, day: dayNo(t.date), wet: !!t.outfit.boots } as Avatar, units: prefs?.units, wind: weather?.wind,
    night: !!(weather?.dark || weather?.night),
    day: { when: tomorrowWord(t), label: t.label, curve: t.curve, startHour: t.startHour, hi: t.hi, lo: t.lo } as ChairDay,
  });

  // where the car's GPS can take snug: home, tomorrow's chair (phones), the shops, the airport (the world's pages)
  const hasChair = phone && !!tomorrow && !morning, shop0 = hasChair ? 2 : 1;
  const dests: Dest[] = [
    { page: 0, label: 'home', icon: 'home' },
    ...(hasChair && tomorrow ? [{ page: 1, label: `${tomorrowWord(tomorrow)}'s outfit`, icon: 'chair' } as Dest] : []),
    { page: shop0, label: 'hand-me-snugs', icon: 'thrift' }, { page: shop0 + 1, label: 'maison snugé', icon: 'boutique' }, { page: shop0 + 2, label: 'the airport', icon: 'plane' },
  ];

  if (!me) return <div style={{ minHeight: '100vh', background: '#f3ede1' }} />;
  return (
    <div style={{ position: 'relative' }}>
      <Snug weather={showApp ? weather : undefined} units={prefs?.units} city={place.name.split(',')[0].toLowerCase()} loading={!done} quick={quick} checkin={checkin} avatar={prefs?.avatar} onShop={openShop} onCloset={openCloset}
        showApp={showApp} loginGoto={goto} placeSet={!!prefs?.place} onFinishLogin={onFinishLogin} onCheckin={onCheckin} />
      {!showApp && authSlot && createPortal(<SignIn user={user} onUser={signedIn} onContinue={() => step(prefs?.place ? 2 : 1)} onSignOut={signOut} />, authSlot)}
      {!showApp && locSlot && createPortal(<LocationSearch onPick={p => savePrefs({ place: p }).then(() => setCharacter('onboard'), console.error)} />, locSlot)}
      {showApp && user && (
        <div style={{ position: 'absolute', left: 16, top: 0, zIndex: 6 }}>
          <AccountMenu place={place} onPlace={p => savePrefs({ place: p }).catch(console.error)} onEditSnug={() => setCharacter('edit')} onShop={openShop} />
        </div>
      )}
      {showApp && user && done && <SignOutTag user={user} onSignOut={signOut} onAdjust={() => setAdjusting(true)} />}
      {showApp && user && done && !nudged && !shopping && !Object.keys(prefs?.avatar?.wardrobe ?? {}).length && <ShopNudge onShop={openShop} onDismiss={settleNudge} />}
      {showApp && (morning
        ? <Chair key={'m' + morning.date} grab outfit={morning.outfit} onGrabbed={grabbed}
            avatar={{ ...prefs?.avatar, day: dayNo(morning.date), wet: !!morning.outfit.boots } as Avatar} />
        : tomorrow && !phone && <Chair key={'t' + tomorrow.date} {...chairProps(tomorrow)} />)}
      {jamming && <Jam />}
      {/* further along snug's world: tomorrow's chair (phones), then the thrift store; past the first stop, by car */}
      {showApp && done && thrift && (
        <World ready={poofed} today={weather?.outfit} driveFrom={phone && tomorrow && !morning ? 1 : 0} onDrive={from => setDriving({ from })} jump={jump} onHome={() => setHomeward(true)} pages={[
          ...(phone && tomorrow && !morning ? [{ key: 'chair', label: tomorrowWord(tomorrow), snugAt: chairSnugAt, render: c => <ChairPage ctx={c} {...chairProps(tomorrow)} /> } as WorldPage] : []),
          { key: 'thrift', label: 'thrift', snugAt: thriftSnugAt, render: c => (
            <Thrift ctx={c} rack={thrift.rack} theme={thrift.theme} nextDays={thrift.next} avatar={(prefs?.avatar ?? {}) as Avatar} today={weather?.outfit} owned={owned} wind={weather?.wind} onTake={takeHome} />
          ) },
          { key: 'boutique', label: 'boutique', snugAt: boutiqueSnugAt, render: c => (
            <Boutique ctx={c} pieces={thrift.maison.pieces} extras={thrift.maison.extras} season={thrift.season} avatar={(prefs?.avatar ?? {}) as Avatar} today={weather?.outfit} owned={owned} onTake={takeHome} />
          ) },
          { key: 'airport', label: 'airport', snugAt: airportSnugAt, render: c => <Airport ctx={c} avatar={(prefs?.avatar ?? {}) as Avatar} home={place} units={prefs?.units} outfit={weather?.outfit} /> },
        ]} />
      )}
      {homeward && <Fade onMid={() => setJump({ page: 0, key: Date.now() })} onDone={() => setHomeward(false)} />}
      {driving && (
        <Drive from={driving.from} dests={dests} avatar={(prefs?.avatar ?? {}) as Avatar} outfit={weather?.outfit}
          sky={{ night: !!(weather?.night || weather?.dark), rain: WET_SKY.includes(weather?.condition ?? ''), snow: SNOW_SKY.includes(weather?.condition ?? '') }}
          onArrive={page => setJump({ page, key: Date.now() })} onClose={() => setDriving(null)} />
      )}
      {character && (
        <CharacterPanel initial={prefs?.avatar} mode={character}
          onDone={a => { savePrefs({ avatar: a }).catch(console.error); if (character === 'onboard') step(2); setCharacter(null); }}
          onSkip={() => { if (character === 'onboard') step(2); setCharacter(null); }} />
      )}
      {shopping && <ShopPanel initial={prefs?.avatar} closetFirst={shopping === 'closet'} onClose={() => setShopping(false)}
        onDone={a => { savePrefs({ avatar: a }).catch(console.error); setShopping(false); }} />}
      {adjusting && <AdjustPanel onClose={changed => { setAdjusting(false); if (changed) setRefresh(r => r + 1); }} />}
    </div>
  );
}
