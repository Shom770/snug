'use client';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Avatar } from './CharacterPanel';
import type { Outfit } from '../lib/types';
import { avOf, palOf, SKINS, sprite } from '../lib/engine';

/** Somewhere snug can drive to: a page of its world (0 is home). */
export interface Dest { page: number; label: string; icon: keyof typeof ICONS }

const FONT = "'Rethink Sans', sans-serif", INK = '#16141f';
const dressed = avOf as (av: Avatar) => unknown;
const colours = palOf as (a: unknown, k: string) => string[];
const figurine = sprite as (o: Outfit, mood: string, pose: string) => string;
const CAR = ['#e7a93b', '#c98c26', '#f3c76a']; // snug's car: mustard, like its suitcase

// little pixel signs for the GPS's list, a row of letters each (# ink, o the colour)
const ICONS = {
  home: ['   ##   ', '  #oo#  ', ' #oooo# ', '#oooooo#', ' #o##o# ', ' #o##o# ', ' ###### '],
  chair: [' ##     ', ' #o     ', ' #o     ', ' #oooo# ', ' #o##o# ', ' #o  o# ', ' ##  ## '],
  thrift: ['   ##   ', '   #    ', '  ####  ', ' #oooo# ', '#oooooo#', '########', '        '],
  boutique: [' ###### ', '#oooooo#', '#o#oo#o#', '#oo##oo#', '#o#oo#o#', '#oooooo#', ' ###### '],
  plane: ['    #   ', '    ##  ', '#   ###o', '########', '#   ###o', '    ##  ', '    #   '],
  park: [' ##  ## ', '#oo##oo#', ' ##  ## ', '#oo##oo#', '#oo##oo#', '#oo##oo#', '########'], // two friends
};
const ICON_COLOUR: Record<keyof typeof ICONS, string> = { home: '#e7a93b', chair: '#c98d5a', thrift: '#7fb07a', boutique: '#3f6b58', plane: '#5b8def', park: '#5c9150' };

// ---------- pixel drawing ----------

type G = CanvasRenderingContext2D;
type Pt = [number, number];
const rnd = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const box = (g: G, x: number, y: number, w: number, h: number, c: string) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h))); };
/** A filled polygon, row by row on whole pixels (no soft edges). */
function poly(g: G, pts: Pt[], c: string) {
  const ys = pts.map(p => p[1]), y0 = Math.ceil(Math.min(...ys) - 0.5), y1 = Math.floor(Math.max(...ys) - 0.5);
  g.fillStyle = c;
  for (let y = y0; y <= y1; y++) {
    const xs: number[] = [], yy = y + 0.5;
    for (let i = 0; i < pts.length; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
      if ((ay <= yy && by > yy) || (by <= yy && ay > yy)) xs.push(ax + ((yy - ay) * (bx - ax)) / (by - ay));
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) { const a = Math.round(xs[k]), b = Math.round(xs[k + 1]); if (b > a) g.fillRect(a, y, b - a, 1); }
  }
}
/** The same, with a one-pixel ink outline round it. */
const inked = (g: G, pts: Pt[], c: string) => { [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dx, dy]) => poly(g, pts.map(([x, y]) => [x + dx, y + dy] as Pt), INK)); poly(g, pts, c); };
function disc(g: G, cx: number, cy: number, r: number, c: string) {
  g.fillStyle = c;
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) { const h = Math.sqrt(Math.max(0, r * r - (y + 0.5 - cy) ** 2)); const a = Math.round(cx - h), b = Math.round(cx + h); if (b > a) g.fillRect(a, y, b - a, 1); }
}
function line(g: G, x0: number, y0: number, x1: number, y1: number, w: number, c: string) {
  const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
  for (let i = 0; i <= n; i++) { const t = i / n; box(g, x0 + (x1 - x0) * t - w / 2, y0 + (y1 - y0) * t - w / 2, w, w, c); }
}

interface Look { night: boolean; rain: boolean; snow: boolean; phone: boolean; skin: string[]; sleeve: string[] }

/** Out of the windshield, into its own small canvas: driving through town. A skyline at the end of the street; the
 * road with its double yellow and its lanes, crosswalks under traffic lights; sidewalks with people walking; buildings
 * shoulder to shoulder down both sides (windows, lit at night; shops with awnings and signs); street lamps, little
 * trees, cars parked at the curb, a car ahead, cars coming the other way; and the front of snug's own car, its hood. */
function drawOutside(g: G, W: number, H: number, dist: number, t: number, L: Look) {
  const hy = Math.round(H * 0.4), dull = L.rain || L.snow, go = dist * 0.0083;
  const bands = L.night ? ['#0b1030', '#111a40', '#18234e', '#1f2b5c'] : dull ? ['#6f7886', '#7a838f', '#868f9b', '#939ba6'] : ['#6fb0e2', '#83bfe8', '#9acbee', '#b5daf2'];
  bands.forEach((c, i) => box(g, 0, (hy * i) / 4, W, hy / 4 + 1, c));
  if (L.night) { for (let i = 0; i < 30; i++) if ((i + Math.floor(t / 700)) % 7) box(g, rnd(i) * W, rnd(i + 50) * hy * 0.6, 1, 1, '#f4f1e8'); disc(g, W * 0.78, H * 0.1, Math.max(3, W * 0.03), '#f4f1e8'); }
  else if (!dull) disc(g, W * 0.8, H * 0.1, Math.max(3, W * 0.04), '#fff3c4');
  for (let i = 0; i < 3; i++) {
    const span = W * 1.5, x = ((i * W * 0.5 - t * 0.003) % span + span) % span - W * 0.25, y = H * (0.05 + 0.06 * i), s = W * 0.03;
    const c = L.night ? '#2c3555' : dull ? '#a5adb8' : '#ffffff';
    disc(g, x, y, s, c); disc(g, x + s * 1.3, y - s * 0.3, s * 1.2, c); disc(g, x + s * 2.5, y, s * 0.9, c); box(g, x - s, y, s * 4.4, s * 0.8, c);
  }
  // the skyline at the end of the street: towers, a spire, a water tower; windows lit at night
  for (let i = 0; i < 22; i++) {
    const bw = W * (0.03 + rnd(i * 3) * 0.04), bx = rnd(i * 5) * W * 1.05 - W * 0.03, bh = H * (0.08 + rnd(i * 7) * 0.24);
    const c = L.night ? (i % 2 ? '#1a2140' : '#202852') : dull ? (i % 2 ? '#7f8896' : '#8a93a0') : i % 2 ? '#9fb2c6' : '#aebfd1';
    box(g, bx, hy - bh, bw, bh, c);
    if (i === 4) { box(g, bx + bw / 2 - 0.5, hy - bh - H * 0.06, 1, H * 0.06, c); }
    if (i === 9) { box(g, bx + bw * 0.2, hy - bh - 3, bw * 0.6, 3, c); box(g, bx + bw * 0.3, hy - bh - 1, 1, 2, c); }
    for (let k = 0; k < bh / 3; k++) if (rnd(i * 13 + k) > (L.night ? 0.55 : 0.8)) box(g, bx + 1 + (k % 2) * Math.max(1, bw - 3), hy - bh + 2 + k * 2, 1, 1, L.night ? '#ffd77a' : '#c9d6e3');
  }
  // the street: asphalt, the double yellow, lane dashes, crosswalks; sidewalks with a curb; the bottoms of the buildings
  const curve = (f: number) => Math.sin(dist * 0.0006) * (1 - f) * (1 - f) * W * 0.12;
  const street = (f: number) => ({ cx: W / 2 + curve(f), hw: 1 + f * W * 0.4, sw: f * W * 0.13 });
  const CROSS = 11; // a crosswalk every so far along
  for (let y = hy; y < H; y++) {
    const f = (y - hy + 1) / (H - hy), d = 1 / (f + 0.02), { cx, hw, sw } = street(f), u = d + go;
    box(g, 0, y, W, 1, L.night ? '#2a2733' : dull ? '#7d7a76' : '#a59f94');
    const walk = L.night ? '#4a4954' : dull ? '#8f8d89' : '#c9c4b8';
    box(g, cx - hw - sw, y, sw, 1, walk); box(g, cx + hw, y, sw, 1, walk);
    if (Math.floor(u * 3) % 2) { box(g, cx - hw - sw * 0.55, y, 1, 1, L.night ? '#3f3e48' : '#b3aea2'); box(g, cx + hw + sw * 0.45, y, 1, 1, L.night ? '#3f3e48' : '#b3aea2'); }
    box(g, cx - hw - Math.max(1, f * 1.5), y, Math.max(1, f * 1.5), 1, L.night ? '#8a8f99' : '#e8e4da'); box(g, cx + hw, y, Math.max(1, f * 1.5), 1, L.night ? '#8a8f99' : '#e8e4da');
    const asphalt = L.night ? (f > 0.45 ? '#4d505a' : '#2c2e35') : dull ? '#45484f' : '#55585f';
    box(g, cx - hw, y, hw * 2, 1, asphalt);
    const cw = ((u % CROSS) + CROSS) % CROSS;
    if (cw < 0.45) { for (let x = Math.round(cx - hw); x < cx + hw; x += Math.max(2, Math.round(f * 5))) box(g, x, y, Math.max(1, f * 2.5), 1, '#e8e4da'); continue; }
    box(g, cx - Math.max(1, f * 1.4), y, Math.max(1, f * 1), 1, '#f2d23a'); box(g, cx + Math.max(0.5, f * 0.6), y, Math.max(1, f * 1), 1, '#f2d23a');
    if (Math.floor(u * 4) % 2 === 0) { box(g, cx - hw * 0.5, y, Math.max(1, f * 1.2), 1, '#e8e4da'); box(g, cx + hw * 0.5, y, Math.max(1, f * 1.2), 1, '#e8e4da'); }
    if (L.rain && f > 0.25 && (y * 7 + Math.floor(dist * 0.02)) % 11 === 0) box(g, cx - hw * (0.1 + rnd(y) * 0.6), y, hw * 0.25, 1, 'rgba(200,215,235,0.4)');
  }
  // everything standing along the street, far first
  type Thing = { d: number; draw: (x: number, y: number, s: number, cx: number, hw: number, sw: number, f: number) => void };
  const things: Thing[] = [];
  const at = (slot: number, every: number, offset = 0) => { const raw = slot * every + offset - go, cyc = Math.floor(raw / (every * 14)), d = raw - cyc * every * 14 + 1.1; return { d, seed: slot * 31 + cyc * 977 }; };
  const WALLS = L.night ? ['#2d2838', '#33303f', '#2a3040', '#3a2d33'] : ['#c4917e', '#ddd0b8', '#a3bcbc', '#cbbfa8', '#b9b5ae'];
  const AWN = ['#c4625a', '#5a7d96', '#d4a24a', '#6f9a66'];
  for (let side = -1; side <= 1; side += 2) for (let slot = 0; slot < 14; slot++) {
    const { d, seed } = at(slot, 1.9, side > 0 ? 0.95 : 0);
    things.push({ d, draw: (_x, y, s, cx, hw, sw) => {
      const tall = s * (3 + rnd(seed) * 5), wide = s * 3.6, x0 = side < 0 ? cx - hw - sw - wide : cx + hw + sw, wall = WALLS[Math.floor(rnd(seed + 1) * WALLS.length)];
      box(g, x0, y - tall, wide, tall, wall);
      box(g, side < 0 ? x0 + wide - Math.max(1, s * 0.12) : x0, y - tall, Math.max(1, s * 0.12), tall, 'rgba(0,0,0,0.18)'); // the corner in shade
      box(g, x0, y - tall, wide, Math.max(1, s * 0.15), 'rgba(0,0,0,0.25)'); // the parapet
      // windows, floor by floor (some lit at night)
      const ws = Math.max(1, s * 0.32), gap = Math.max(2, s * 0.62);
      for (let wy = y - tall + gap * 0.7; wy < y - s * 1.1; wy += gap) for (let wx = x0 + gap * 0.5; wx < x0 + wide - ws; wx += gap) {
        const on = rnd(seed + wx * 7 + wy * 3) > 0.5;
        box(g, wx, wy, ws, ws * 1.2, L.night ? (on ? '#ffd77a' : '#1b1a24') : dull ? '#6c7a8a' : on ? '#9cc4e4' : '#7fa9cc');
      }
      // the shop at street level: an awning, its window, a sign that glows at night
      const awn = AWN[Math.floor(rnd(seed + 2) * AWN.length)];
      box(g, x0 + s * 0.2, y - s * 1, wide - s * 0.4, s * 0.8, L.night ? '#ffe2a0' : '#3a4a5a');
      for (let ax = 0; ax < wide - s * 0.2; ax += Math.max(2, s * 0.5)) box(g, x0 + s * 0.1 + ax, y - s * 1.25, Math.max(1, s * 0.25), s * 0.3, ax / Math.max(2, s * 0.5) % 2 ? '#f4f1e8' : awn);
      if (rnd(seed + 3) > 0.75) { const sx = x0 + wide * 0.25, sy = y - s * 1.75; box(g, sx, sy, wide * 0.5, s * 0.35, L.night ? AWN[(seed + 1) % AWN.length] : '#2b2f3a'); if (L.night) box(g, sx - 1, sy - 1, wide * 0.5 + 2, s * 0.35 + 2, 'rgba(255,200,140,0.25)'); else box(g, sx + 1, sy + s * 0.12, wide * 0.5 - 2, Math.max(1, s * 0.1), '#f4f1e8'); }
    } });
    // the curb: a lamp post, a little tree, now and then a parked car
    const c = at(slot, 1.9, side > 0 ? 0.3 : 1.25), kind = Math.floor(rnd(c.seed + 5) * 6) % 5; // mostly lamps and trees; a parked car now and then
    things.push({ d: c.d, draw: (_x, y, s, cx, hw) => {
      const x = cx + side * (hw + s * 0.25);
      if (kind === 0 || kind === 3) { box(g, x, y - s * 2.2, Math.max(1, s * 0.08), s * 2.2, '#3a3f4a'); box(g, x - side * s * 0.4, y - s * 2.2, s * 0.45, Math.max(1, s * 0.1), '#3a3f4a'); box(g, x - side * s * 0.45, y - s * 2.1, s * 0.2, s * 0.1, L.night ? '#fff2c8' : '#c4cad3'); if (L.night) disc(g, x - side * s * 0.35, y - s * 2, s * 0.6, 'rgba(255,226,150,0.16)'); }
      else if (kind === 1) { box(g, x - s * 0.05, y - s * 0.5, Math.max(1, s * 0.1), s * 0.5, '#5a3c22'); disc(g, x, y - s * 0.8, s * 0.38, L.night ? '#16301f' : '#4f8f45'); }
      else if (kind === 2) { const cw = s * 1.3, chh = s * 0.55, col = AWN[(c.seed >> 2) % AWN.length], px0 = side < 0 ? x - cw : x;
        box(g, px0, y - chh, cw, chh * 0.7, col); box(g, px0 + cw * 0.2, y - chh * 1.35, cw * 0.6, chh * 0.5, col); box(g, px0 + cw * 0.27, y - chh * 1.28, cw * 0.46, chh * 0.32, L.night ? '#0d0f16' : '#3a4a66');
        box(g, px0 + cw * 0.12, y - chh * 0.25, cw * 0.18, chh * 0.25, INK); box(g, px0 + cw * 0.7, y - chh * 0.25, cw * 0.18, chh * 0.25, INK); }
    } });
    // people walking the sidewalk, this way and that
    for (let k = 0; k < 1; k++) {
      const p = at(slot, 1.9, (side > 0 ? 0.6 : 1.5) + Math.sin(t * 0.0004 + slot) * 0.25);
      if (rnd(p.seed + 9) < 0.6 || p.d < 2.2) continue; // a few people about, nobody right up close (they'd be big blocks)
      things.push({ d: p.d, draw: (_x, y, s, cx, hw, sw) => {
        const x = cx + side * (hw + sw * (0.3 + rnd(p.seed + k) * 0.5)), h = Math.max(3, s * 0.9), step = Math.floor(t / 200 + p.seed) % 2;
        const shirt = AWN[(p.seed + k) % AWN.length], skin = ['#e8b48e', '#c98e62', '#9a6440', '#f3d2b8'][(p.seed >> 3) % 4];
        box(g, x - h * 0.15, y - h, h * 0.3, h * 0.25, skin); box(g, x - h * 0.18, y - h * 0.75, h * 0.36, h * 0.4, shirt);
        box(g, x - h * 0.14 + (step ? 1 : 0), y - h * 0.35, Math.max(1, h * 0.1), h * 0.35, INK); box(g, x + h * 0.04 - (step ? 1 : 0), y - h * 0.35, Math.max(1, h * 0.1), h * 0.35, INK);
      } });
    }
  }
  // traffic lights at the crosswalks, cycling
  for (let k = 0; k < 3; k++) {
    const raw = k * CROSS - go, d = ((raw % (CROSS * 3)) + CROSS * 3) % (CROSS * 3) + 1.1 - 0.2;
    things.push({ d, draw: (_x, y, s, cx, hw) => {
      const x = cx + hw + s * 0.3, lit = Math.floor(t / 2200 + k) % 3;
      box(g, x, y - s * 2.6, Math.max(1, s * 0.09), s * 2.6, '#2b2f3a'); box(g, x - s * 0.9, y - s * 2.6, s * 0.95, Math.max(1, s * 0.08), '#2b2f3a');
      const bx = x - s * 1, by = y - s * 2.6;
      box(g, bx, by, s * 0.32, s * 0.8, INK);
      ['#ff5a4a', '#ffb02e', '#3fe07a'].forEach((c, j) => box(g, bx + s * 0.08, by + s * 0.06 + j * s * 0.25, s * 0.16, s * 0.16, j === lit ? c : '#2a2d35'));
    } });
  }
  // a car ahead of us, its taillights; cars coming the other way
  things.push({ d: 4.2 + Math.sin(t * 0.0006) * 0.8, draw: (_x, y, s, cx, hw) => {
    const cw = s * 2.4, ch = s * 1.1, x = cx + hw * 0.5 - cw / 2, col = '#4b7bc9';
    box(g, x, y - ch, cw, ch * 0.75, col); box(g, x + cw * 0.15, y - ch * 1.45, cw * 0.7, ch * 0.55, col); box(g, x + cw * 0.22, y - ch * 1.38, cw * 0.56, ch * 0.4, L.night ? '#0d0f16' : '#3a4a66');
    [0.05, 0.8].forEach(k => { box(g, x + cw * k, y - ch * 0.75, cw * 0.15, ch * 0.18, '#ff5a4a'); if (L.night) disc(g, x + cw * (k + 0.07), y - ch * 0.66, cw * 0.18, 'rgba(255,90,74,0.25)'); });
    box(g, x + cw * 0.35, y - ch * 0.42, cw * 0.3, ch * 0.16, '#f4f1e8'); box(g, x + cw * 0.08, y - ch * 0.25, cw * 0.18, ch * 0.25, INK); box(g, x + cw * 0.74, y - ch * 0.25, cw * 0.18, ch * 0.25, INK);
  } });
  for (let k = 0; k < 1; k++) {
    const d = 30 - (((dist * 0.012 + k * 21) % 36));
    if (d > 1.2) things.push({ d, draw: (_x, y, s, cx, hw) => {
      const cw = s * 2.2, ch = s * 1, x = cx - hw * 0.5 - cw / 2, col = ['#c94b4b', '#f4f1e8', '#e7a93b'][k];
      box(g, x, y - ch, cw, ch * 0.75, col); box(g, x + cw * 0.15, y - ch * 1.4, cw * 0.7, ch * 0.5, col); box(g, x + cw * 0.22, y - ch * 1.33, cw * 0.56, ch * 0.36, L.night ? '#0d0f16' : '#3a4a66');
      [0.06, 0.78].forEach(q => { box(g, x + cw * q, y - ch * 0.6, cw * 0.16, ch * 0.2, L.night ? '#fff6c8' : '#f4f1e8'); if (L.night) disc(g, x + cw * (q + 0.08), y - ch * 0.5, cw * 0.3, 'rgba(255,240,180,0.22)'); });
    } });
  }
  things.sort((a, b) => b.d - a.d).forEach(({ d, draw }) => {
    const f = 1 / d - 0.02;
    if (f <= 0 || f > 1.15) return;
    const ff = Math.min(1, f), y = hy + ff * (H - hy), { cx, hw, sw } = street(ff);
    draw(0, y, f * W * 0.16, cx, hw, sw, f);
  });
  // snug's car: the mustard hood, shining down the middle
  const hoodH = H * 0.13;
  for (let x = 0; x < W; x++) {
    const e = (x - W / 2) / (W * 0.62), top = H - hoodH * (1 - Math.min(1, e * e) * 0.7);
    const c = Math.abs(e) < 0.12 ? CAR[2] : Math.abs(e) > 0.75 ? CAR[1] : CAR[0];
    box(g, x, top, 1, H - top, L.night ? (c === CAR[2] ? '#a07a32' : '#7d5f26') : c);
    box(g, x, top, 1, 1, L.night ? '#5a4419' : CAR[1]);
  }
  if (L.rain) for (let k = 0; k < 12; k++) box(g, rnd(k * 5) * W, H - hoodH * 0.6 + rnd(k * 9) * hoodH * 0.5, 1, 1, '#f6e7bd');
}

/** snug's car around the view: the roof and visors, the pillars, the windshield (rain or snow on it, the wipers), the
 * mirror with the air freshener swinging off it, the dash (vents, the radio, the gauges, a little snug bobbing on top,
 * the glovebox), the wheel turning a little, and snug's hands on it in its own sleeves. */
function drawCar(g: G, PW: number, PH: number, out: HTMLCanvasElement, speed: number, t: number, L: Look, wsT: number, wsB: number, bob: HTMLImageElement | null) {
  const tl = PW * 0.1, bl = PW * 0.02, edge = (y: number) => Math.round(tl + (bl - tl) * ((y - wsT) / (wsB - wsT)));
  const inside = L.night ? ['#17181e', '#1d1f26', '#26282f', '#30333b'] : ['#22242b', '#2a2d35', '#353843', '#40444f'];
  box(g, 0, 0, PW, PH, inside[1]);
  // the view, row by row through the glass
  g.imageSmoothingEnabled = false;
  for (let y = wsT; y < wsB; y++) { const xl = edge(y), xr = PW - xl; g.drawImage(out, xl, y - wsT, xr - xl, 1, xl, y, xr - xl, 1); }
  // the glass itself, tinted: the town's out there, the car's in here
  for (let y = wsT; y < wsB; y++) { const xl = edge(y); box(g, xl, y, PW - 2 * xl, 1, L.night ? 'rgba(4,6,16,0.38)' : 'rgba(26,34,52,0.32)'); }
  // rain or snow on the glass
  if (L.rain || L.snow) for (let i = 0; i < (L.phone ? 40 : 70); i++) {
    const y = wsT + ((rnd(i) * (wsB - wsT) + t * (L.snow ? 0.002 : 0.006) * (0.4 + rnd(i + 9))) % (wsB - wsT)), xl = edge(Math.floor(y)), x = xl + rnd(i + 40) * (PW - 2 * xl);
    if (L.snow) box(g, x, y, 1, 1, '#f4f8ff');
    else { box(g, x, y, 1, 2, 'rgba(200,222,250,0.7)'); box(g, x, y, 1, 1, '#ffffff'); }
  }
  if (!L.night) line(g, edge(wsT) + PW * 0.06, wsT + 3, edge(wsT) + PW * 0.16, wsT + (wsB - wsT) * 0.35, 2, 'rgba(255,255,255,0.10)'); // glare
  // the wipers: thick, parked along the bottom, sweeping when it rains
  [[PW * 0.22, 0], [PW * 0.6, 0.06]].forEach(([px, lag]) => {
    const k = L.rain ? 0.5 - 0.5 * Math.cos((t / 1300 - lag) * Math.PI * 2) : 0, a = Math.PI + k * Math.PI * 0.6, len = PW * 0.36;
    const ex = px + Math.cos(a) * len, ey = wsB - 2 + Math.sin(a) * len;
    line(g, px, wsB - 2, ex, ey, 2, '#2b2e36');
    line(g, px + Math.cos(a) * len * 0.15, wsB - 2 + Math.sin(a) * len * 0.15, ex, ey, 3, INK);
    box(g, px - 2, wsB - 4, 4, 4, INK);
  });
  // pillars, roof, visors
  for (let y = wsT; y < wsB; y++) { const xl = edge(y); box(g, 0, y, xl, 1, inside[1]); box(g, PW - xl, y, xl, 1, inside[1]); box(g, xl - 2, y, 1, 1, inside[3]); box(g, PW - xl + 1, y, 1, 1, inside[3]); box(g, xl - 1, y, 1, 1, INK); box(g, PW - xl, y, 1, 1, INK); }
  box(g, 0, 0, PW, wsT, inside[2]); box(g, 0, wsT - 1, PW, 1, INK);
  for (let x = 2; x < PW; x += 4) box(g, x, wsT - 3, 2, 1, inside[1]);
  [PW * 0.12, PW * 0.62].forEach(x => { box(g, x, wsT - 1, PW * 0.26, 4, inside[2]); box(g, x, wsT + 3, PW * 0.26, 1, INK); });
  // the mirror, and the air freshener swinging on its string
  const mw = PW * (L.phone ? 0.24 : 0.16), mh = Math.max(5, mw * 0.24), mx = PW / 2 - mw / 2, my = wsT + 2;
  box(g, PW / 2 - 1, wsT, 2, 3, INK); box(g, mx - 1, my - 1, mw + 2, mh + 2, INK); box(g, mx, my, mw, mh, '#3a3f4a');
  for (let k = 0; k < mh - 2; k++) box(g, mx + 1, my + 1 + k, mw - 2, 1, ['#8a93a6', '#7b8597', '#6a7487', '#5b6475'][Math.min(3, Math.floor((k / (mh - 2)) * 4))]);
  box(g, mx + mw * 0.3, my + 2, mw * 0.4, 1, '#a3acbd');
  const swing = Math.sin(t * 0.004) * (2 + speed * 30), sx = PW / 2 + mw * 0.3 + swing, sy = my + mh + 10;
  line(g, PW / 2 + mw * 0.3, my + mh, sx, sy, 1, '#c4cad3');
  // the air freshener: a little pine, outlined, with a highlight down one side
  ['    o    ', '   oLo   ', '  oLggo  ', '   ogo   ', '  oLggo  ', ' oLgggdo ', '  oggdo  ', ' oLgggdo ', 'oLggggddo', 'ooooooooo', '   obo   ', '   ooo   ']
    .forEach((r, yy) => [...r].forEach((c, xx) => { if (c !== ' ') box(g, sx - 4 + xx, sy + yy, 1, 1, { o: INK, L: '#7fc46e', g: '#4f8f45', d: '#3a6e34', b: '#6b4a2b' }[c] ?? INK); }));
  // the dash
  box(g, 0, wsB, PW, PH - wsB, inside[1]); box(g, 0, wsB, PW, 2, inside[3]); box(g, 0, wsB + 2, PW, 1, inside[2]); box(g, 0, wsB - 1, PW, 1, INK);
  for (let x = PW * 0.12; x < PW * 0.88; x += 3) box(g, x, wsB + 4, 2, 1, inside[0]);
  for (let y = wsB + 8; y < PH; y += 5) box(g, 0, y, PW, 1, inside[0]);
  // the wheel's place, and the gauges through it
  const R = PW * (L.phone ? 0.4 : 0.22), T = Math.max(4, R * 0.15), cx = PW * (L.phone ? 0.5 : 0.3), cy = PH + R * (L.phone ? 0.28 : 0.12);
  const gy = cy - (R - T) * 0.62, gr = Math.max(4, R * 0.2);
  disc(g, cx, gy + gr * 0.2, gr * 2.6, inside[0]);
  [-1, 1].forEach(k => {
    const gx = cx + k * gr * 1.25, lit = L.night ? '#7fe7ff' : '#c4cad3';
    disc(g, gx, gy, gr + 1, INK); disc(g, gx, gy, gr, L.night ? '#0f2230' : '#14161c');
    for (let a = 0; a < 8; a++) { const an = Math.PI * (0.8 + (a / 7) * 1.4); box(g, gx + Math.cos(an) * (gr - 1.5), gy + Math.sin(an) * (gr - 1.5), 1, 1, lit); }
    const v = k < 0 ? Math.min(1, speed / 0.12) : 0.7, an = Math.PI * (0.8 + v * 1.4);
    line(g, gx, gy, gx + Math.cos(an) * (gr - 2), gy + Math.sin(an) * (gr - 2), 1, '#ff5a4a'); box(g, gx, gy, 1, 1, lit);
  });
  if (speed > 0.002 && speed < 0.06 && Math.floor(t / 350) % 2) { box(g, cx - 2, gy - gr - 2, 1, 1, '#3fe07a'); box(g, cx - 3, gy - gr - 1, 1, 1, '#3fe07a'); box(g, cx - 2, gy - gr, 1, 1, '#3fe07a'); } // the blinker, pulling out
  // the middle of the dash: vents, the radio and its little equaliser; the glovebox; a snug bobbing on top
  if (!L.phone) {
    const mid = PW * 0.5;
    [0, 1].forEach(k => { const vx = mid - PW * 0.06 + k * PW * 0.07; box(g, vx - 1, wsB + 9, PW * 0.05 + 2, 9, INK); box(g, vx, wsB + 10, PW * 0.05, 7, inside[0]); for (let s = 0; s < 3; s++) box(g, vx, wsB + 11 + s * 2, PW * 0.05, 1, inside[3]); });
    const gx = PW * 0.74; box(g, gx - 1, wsB + 10, PW * 0.2 + 2, PH * 0.16, INK); box(g, gx, wsB + 11, PW * 0.2, PH * 0.16 - 2, inside[2]); box(g, gx + PW * 0.08, wsB + 16, PW * 0.04, 2, inside[3]);
    // a little snug on the dash in the corner, bobbing along
    if (bob && bob.complete && bob.naturalWidth) { const bw = 14, bh = 18, by = wsB - bh + 2 + (speed > 0.01 ? Math.round(Math.sin(t * 0.02)) : 0); g.drawImage(bob, Math.round(PW * 0.07), by, bw, bh); }
  }
  // the wheel, turning a little as it drives, and snug's hands on it
  const turn = Math.sin(t * 0.0018) * 0.09 * Math.min(1, speed / 0.06), cos = Math.cos(turn), sin = Math.sin(turn);
  for (let y = Math.floor(cy - R - 1); y < PH; y++) for (let x = Math.floor(cx - R - 1); x <= cx + R + 1; x++) {
    const dx = x + 0.5 - cx, dy = y + 0.5 - cy, d = Math.hypot(dx, dy), rx = dx * cos + dy * sin, ry = -dx * sin + dy * cos;
    if (d <= R && d >= R - T) {
      const outline = d > R - 1 || d < R - T + 1, lit = ry < -R * 0.55 && rx < 0;
      box(g, x, y, 1, 1, outline ? INK : (Math.round(Math.atan2(ry, rx) * 14) % 3 === 0 ? '#2b2f3a' : lit ? '#4b515e' : '#3a3f4a'));
    } else if (d < R - T && Math.abs(ry) < T * 0.45 && Math.abs(rx) > R * 0.22) box(g, x, y, 1, 1, Math.abs(ry) > T * 0.3 ? INK : '#3a3f4a'); // the spokes
    else if (d < R * 0.25) box(g, x, y, 1, 1, d > R * 0.25 - 1.2 ? INK : d < R * 0.08 ? CAR[0] : '#2b2f3a'); // the hub, a mustard badge
  }
  [-1, 1].forEach(k => {
    const a = -Math.PI / 2 + k * Math.PI * 0.32 + turn, mr = R - T / 2, hx = cx + Math.cos(a) * mr, hy = cy + Math.sin(a) * mr;
    const ax = cx + k * R * 1.05, ay = PH + 6, w = R * 0.16, n = Math.hypot(ax - hx, ay - hy), px = ((ay - hy) / n) * w, py = (-(ax - hx) / n) * w;
    // the arm, in its sleeve: shaded down the outer side, a lighter cuff at the wrist
    inked(g, [[hx + px, hy + py + T * 0.4], [hx - px, hy - py + T * 0.4], [ax - px * 1.3, ay - py], [ax + px * 1.3, ay + py]], L.sleeve[0]);
    const o = k < 0 ? 1 : -1;
    poly(g, [[hx + px * o * 0.3, hy + py * o * 0.3 + T * 0.5], [hx + px * o, hy + py * o + T * 0.4], [ax + px * 1.3 * o, ay + py * o], [ax + px * 0.5 * o, ay + py * 0.5 * o]], L.sleeve[1]);
    const cuff: Pt = [hx + (ax - hx) * 0.14, hy + (ay - hy) * 0.14 + T * 0.4];
    line(g, cuff[0] + px, cuff[1] + py, cuff[0] - px, cuff[1] - py, 2, L.sleeve[2]);
    // the hand, wrapped over the rim, knuckles showing
    const hr = Math.max(3, R * 0.11);
    disc(g, hx, hy, hr + 1, INK); disc(g, hx, hy, hr, L.skin[0]); disc(g, hx + k * hr * 0.25, hy + hr * 0.35, hr * 0.6, L.skin[1]);
    for (let q = -1; q <= 1; q++) box(g, hx + q * hr * 0.5, hy - hr * 0.35, 1, 1, L.skin[1]);
    box(g, hx - hr * 0.4, hy - hr * 0.7, hr * 0.5, 1, L.skin[2]);
  });
}

// ---------- the GPS ----------

const GS = 1.5; // the GPS's pixels, each a pixel and a half on screen: a touch low-res, like the rest of the car
const GFONT = "'Rethink Sans', sans-serif";
function drawIcon(g: G, name: keyof typeof ICONS, x: number, y: number) {
  ICONS[name].forEach((r, yy) => [...r].forEach((c, xx) => { if (c !== ' ') box(g, x + xx, y + yy, 1, 1, c === '#' ? INK : ICON_COLOUR[name]); }));
}
// ---------- snug city, the GPS's map ----------
//
// A small city on a river: downtown's grid of uneven blocks with Broad and Market (the two big streets) meeting at city
// hall's circle, a parkway cutting across it on the diagonal, the big park up top, a little square, home in the
// rowhouses to the south, the strip mall out along the pike, and past the cloverleaf on the expressway, the airport.
// Routes are worked out on its roads, nudged a little differently every drive, so it's not the same way every time.

const MW = 240, MH = 146; // the whole city, in the GPS's pixels
const AVES = [22, 38, 52, 68, 86, 100, 116, 132], STS = [12, 26, 38, 52, 66, 78, 92, 106, 120, 134]; // its streets, unevenly apart
const BROAD = 68, MARKET = 66;
const PARK = { x0: 86, y0: 12, x1: 116, y1: 52 }; // the big park
const SQUARE = { x0: 38, y0: 52, x1: 52, y1: 66 }; // the little square, a block of trees with paths across
const ROWS = { x0: 22, y0: 92, x1: 68, y1: 134 }; // the rowhouses round home
const PIKE = 150; // the strip mall's road
const EXPY: Pt[] = [[0, 4], [22, 4], [68, 4], [132, 4], [176, 4], [188, 8], [195, 18], [196, 30], [196, MARKET], [196, 90], [196, MH]];
// where each place on the GPS's list is
const SPOTS: Record<keyof typeof ICONS, Pt> = { home: [45, 120], chair: [22, 99], park: [100, 52], thrift: [PIKE, 60], boutique: [PIKE, 86], plane: [212, 116] };
type Road = 'st' | 'main' | 'hw' | 'ramp';
const PACE: Record<Road, number> = { st: 1, main: 0.8, hw: 0.42, ramp: 0.9 }; // how slow each kind of road is

interface City { pts: Pt[]; adj: { to: number; cost: number; id: number }[][]; at: Map<string, number> }
let city: City | null = null;
function cityGraph(): City {
  if (city) return city;
  const pts: Pt[] = [], adj: City['adj'] = [], at = new Map<string, number>();
  let ids = 0;
  const node = ([x, y]: Pt) => { const k = `${x},${y}`; if (!at.has(k)) { at.set(k, pts.length); pts.push([x, y]); adj.push([]); } return at.get(k)!; };
  const road = (a: Pt, b: Pt, kind: Road) => {
    const i = node(a), j = node(b), cost = Math.hypot(a[0] - b[0], a[1] - b[1]) * PACE[kind], id = ids++;
    adj[i].push({ to: j, cost, id }); adj[j].push({ to: i, cost, id });
  };
  const inPark = (x: number, y: number) => x > PARK.x0 && x < PARK.x1 && y > PARK.y0 && y < PARK.y1;
  AVES.forEach(x => STS.slice(1).forEach((y, k) => { if (!inPark(x, (y + STS[k]) / 2)) road([x, STS[k]], [x, y], x === BROAD ? 'main' : 'st'); }));
  STS.forEach(y => AVES.slice(1).forEach((x, k) => { if (!inPark((x + AVES[k]) / 2, y)) road([AVES[k], y], [x, y], y === MARKET ? 'main' : 'st'); }));
  road([BROAD, MARKET], [22, 26], 'main'); // the parkway, out to the river
  // out east: three streets run on to the pike, and Market on past the strip mall to the expressway
  [38, MARKET, 92].forEach(y => road([132, y], [PIKE, y], y === MARKET ? 'main' : 'st'));
  [38, 52, MARKET, 78, 92, 106].slice(1).forEach((y, k) => road([PIKE, [38, 52, MARKET, 78, 92, 106][k]], [PIKE, y], 'main'));
  road([PIKE, MARKET], [196, MARKET], 'main');
  // the expressway, along the top and down to the airport, with on-ramps from the avenues
  EXPY.slice(1, 10).forEach((p, k) => road(EXPY[k], p, 'hw'));
  [22, 68, 132].forEach(x => road([x, 4], [x, 12], 'ramp'));
  road([196, 90], [204, 100], 'ramp'); road([204, 100], SPOTS.plane, 'ramp');
  // the places themselves, each on its street
  road([38, 120], SPOTS.home, 'st'); road(SPOTS.home, [52, 120], 'st');
  road([22, 92], SPOTS.chair, 'st'); road(SPOTS.chair, [22, 106], 'st');
  road([PIKE, 52], SPOTS.thrift, 'main'); road(SPOTS.thrift, [PIKE, MARKET], 'main');
  road([PIKE, 78], SPOTS.boutique, 'main'); road(SPOTS.boutique, [PIKE, 92], 'main');
  return (city = { pts, adj, at });
}
/** The way from one place to another on the city's roads. With a seed, every road's a little quicker or slower than
 * usual (traffic, lights), so each drive can go its own way. */
function routeBetween(from: keyof typeof ICONS, to: keyof typeof ICONS, seed: number | null): { pts: Pt[]; cost: number } {
  const c = cityGraph(), a = c.at.get(SPOTS[from].join(','))!, b = c.at.get(SPOTS[to].join(','))!;
  const dist = c.pts.map(() => Infinity), prev = c.pts.map(() => -1), done = c.pts.map(() => false);
  dist[a] = 0;
  for (;;) {
    let u = -1;
    dist.forEach((d, i) => { if (!done[i] && d < Infinity && (u < 0 || d < dist[u])) u = i; });
    if (u < 0 || u === b) break;
    done[u] = true;
    c.adj[u].forEach(e => { const w = e.cost * (seed === null ? 1 : 0.65 + 0.8 * rnd(seed * 13.7 + e.id * 1.31)); if (dist[u] + w < dist[e.to]) { dist[e.to] = dist[u] + w; prev[e.to] = u; } });
  }
  const path: Pt[] = [];
  for (let v = b; v >= 0; v = prev[v]) path.unshift(c.pts[v]);
  let cost = 0;
  path.slice(1).forEach((q, i) => { cost += Math.hypot(q[0] - path[i][0], q[1] - path[i][1]); });
  return { pts: path, cost };
}
const minutesTo = (from: keyof typeof ICONS, to: keyof typeof ICONS) => Math.max(2, Math.round(routeBetween(from, to, null).cost / 16));

/** The city itself, drawn once: river, blocks and buildings, the park, the rowhouses, the strip mall, the airport, and
 * the roads over it all. */
let cityMap: HTMLCanvasElement | null = null;
function drawCity(): HTMLCanvasElement {
  if (cityMap) return cityMap;
  const cv = document.createElement('canvas'); cv.width = MW; cv.height = MH;
  const g = cv.getContext('2d')!;
  box(g, 0, 0, MW, MH, '#ece5d2');
  // the river down the west side, a little bendy, with ripples
  for (let y = 0; y < MH; y++) { const c = 7 + 3 * Math.sin(y / 17) + 1.5 * Math.sin(y / 7); box(g, 0, y, c + 5, 1, '#9cc8e8'); box(g, c + 5, y, 1, 1, '#c9dfe9'); }
  for (let k = 0; k < 14; k++) box(g, 2 + rnd(k) * 6, 4 + k * 10, 3, 1, '#c1dcef');
  // downtown's blocks, each with a few buildings in it
  const BLDG = ['#d9cdb0', '#d2c4a6', '#ddd2b9', '#cfc0a0'];
  AVES.slice(1).forEach((x1, i) => STS.slice(1).forEach((y1, j) => {
    const x0 = AVES[i], y0 = STS[j];
    box(g, x0, y0, x1 - x0, y1 - y0, '#e4dbc4');
    if (x0 >= ROWS.x0 && x1 <= ROWS.x1 && y0 >= ROWS.y0 && y1 <= ROWS.y1) {
      // rowhouses: two rows of little roofs back to back, gardens down the middle
      for (let x = x0 + 2; x < x1 - 2; x += 2) { box(g, x, y0 + 2, 1, 3, rnd(x + y0) > 0.5 ? '#d9b796' : '#cfa889'); box(g, x, y1 - 5, 1, 3, rnd(x * 3 + y1) > 0.5 ? '#d9b796' : '#cfa889'); }
      box(g, x0 + 2, y0 + 6, x1 - x0 - 4, y1 - y0 - 12, '#d6e2bf');
      return;
    }
    const n = 2 + Math.floor(rnd(i * 7 + j * 3) * 3), w = x1 - x0 - 4;
    for (let k = 0, x = x0 + 2; k < n; k++) {
      const bw = k === n - 1 ? x0 + 2 + w - x : Math.max(2, Math.round(w / n + (rnd(i + j * 5 + k) - 0.5) * 3));
      const tall = rnd(i * 11 + j + k * 2) > 0.7;
      box(g, x, y0 + 2, bw - 1, y1 - y0 - 4, tall && x0 >= 52 && x1 <= 132 && y1 <= 92 ? '#c7b796' : BLDG[(i + j + k) % 4]);
      x += bw;
    }
  }));
  // the little square: grass, two paths crossing, a fountain in the middle
  box(g, SQUARE.x0, SQUARE.y0, SQUARE.x1 - SQUARE.x0, SQUARE.y1 - SQUARE.y0, '#b9d7a0');
  for (let t = 0; t <= 1; t += 0.05) { box(g, SQUARE.x0 + 1 + t * 12, SQUARE.y0 + 1 + t * 12, 1, 1, '#efe8d5'); box(g, SQUARE.x1 - 2 - t * 12, SQUARE.y0 + 1 + t * 12, 1, 1, '#efe8d5'); }
  disc(g, 45, 59, 2, '#efe8d5'); box(g, 44, 58, 2, 2, '#8fc0e2');
  [[40, 54], [49, 55], [40, 63], [50, 63]].forEach(([x, y]) => box(g, x, y, 2, 2, '#7fae68'));
  // the big park: lawns, a lake, a ring of trees, paths wandering through
  box(g, PARK.x0, PARK.y0, PARK.x1 - PARK.x0, PARK.y1 - PARK.y0, '#b4d49a');
  box(g, PARK.x0 + 6, PARK.y0 + 22, 12, 9, '#c4dfaa');
  for (let x = PARK.x0 + 1; x < PARK.x1 - 1; x += 3) { box(g, x, PARK.y0 + 1, 2, 2, '#86b66f'); box(g, x + 1, PARK.y1 - 3, 2, 2, '#86b66f'); }
  for (let y = PARK.y0 + 4; y < PARK.y1 - 3; y += 3) { box(g, PARK.x0 + 1, y, 2, 2, '#86b66f'); box(g, PARK.x1 - 3, y + 1, 2, 2, '#86b66f'); }
  for (let k = 0; k < 16; k++) box(g, PARK.x0 + 5 + rnd(k * 3.3) * 20, PARK.y0 + 5 + rnd(k * 7.1) * 30, 2, 2, '#8fbe77');
  for (let y = PARK.y0 + 2; y < PARK.y1 - 1; y++) box(g, 100 + Math.round(4 * Math.sin(y / 5)), y, 1, 1, '#efe8d5');
  for (let x = PARK.x0 + 2; x < PARK.x1 - 1; x++) box(g, x, 38 + Math.round(2 * Math.sin(x / 4)), 1, 1, '#efe8d5');
  for (let a = 0; a < 6.3; a += 0.05) { const x = 104 + 7 * Math.cos(a), y = 22 + 4 * Math.sin(a); box(g, x, y, 1, 1, '#9cc8e8'); }
  disc(g, 104, 22, 4, '#9cc8e8'); box(g, 101, 20, 6, 4, '#9cc8e8'); box(g, 102, 21, 2, 1, '#c1dcef');
  // out east: lawns along the pike, then the strip mall: its lot, its long low building, a storefront for each shop
  box(g, AVES[AVES.length - 1] + 1, 10, PIKE - AVES[AVES.length - 1] - 2, MH - 10, '#e3e3cf');
  box(g, PIKE + 3, 50, 22, 46, '#d3d2cb');
  for (let y = 53; y < 94; y += 4) for (let x = PIKE + 5; x < PIKE + 24; x += 3) box(g, x, y, 1, 2, '#f6f4ee');
  box(g, PIKE + 25, 49, 11, 48, '#a88f6c'); box(g, PIKE + 26, 50, 9, 46, '#e3cba3');
  [['#7fb07a', 56], ['#e0a35a', 64], ['#c46a5a', 72], ['#6d8fb5', 78], ['#3f6b58', 84], ['#d9c46a', 91]].forEach(([c, y]) => box(g, PIKE + 25, y as number, 2, 5, c as string));
  for (let y = 12; y < MH; y += 7) box(g, PIKE + 40, y, 2, 2, '#9cbf86');
  // the airport, past the expressway: grass, two runways, the terminal and its planes
  box(g, 200, 96, MW - 200, MH - 96, '#dde6c8');
  box(g, 206, 128, MW - 206, 6, '#8e949c'); for (let x = 209; x < MW - 2; x += 5) box(g, x, 130, 3, 1, '#f4f4f4');
  line(g, 214, 144, MW - 2, 106, 4, '#8e949c'); for (let t = 0.1; t < 0.95; t += 0.12) box(g, 214 + (MW - 216) * t, 144 - 38 * t, 1, 1, '#f4f4f4');
  box(g, 216, 110, 22, 10, '#c4c8cc');
  box(g, 219, 101, 19, 8, INK); box(g, 220, 102, 17, 6, '#d7dce2'); for (let x = 221; x < 236; x += 3) box(g, x, 103, 2, 2, '#9cc1ff');
  [[220, 113], [229, 114]].forEach(([x, y]) => { box(g, x, y, 5, 1, '#ffffff'); box(g, x + 2, y - 1, 1, 3, '#ffffff'); });
  // roads: a casing first, then the road on top (the expressway orange, the big streets yellow, the rest white)
  const casing = (pts: Pt[], w: number, c: string) => pts.slice(1).forEach((p, k) => line(g, pts[k][0], pts[k][1], p[0], p[1], w, c));
  const all: { pts: Pt[]; kind: Road }[] = [];
  // (the streets that would cross the park stop at its edge)
  AVES.forEach(x => all.push({ pts: [[x, [22, BROAD, 132].includes(x) ? 4 : x > PARK.x0 && x < PARK.x1 ? PARK.y1 : 12], [x, 134]], kind: x === BROAD ? 'main' : 'st' }));
  STS.forEach(y => {
    const x0 = y === MARKET ? 0 : 22, x1 = y === MARKET ? MW : [38, 92].includes(y) ? PIKE : 132, kind: Road = y === MARKET ? 'main' : 'st';
    if (y > PARK.y0 && y < PARK.y1) all.push({ pts: [[x0, y], [PARK.x0, y]], kind }, { pts: [[PARK.x1, y], [x1, y]], kind });
    else all.push({ pts: [[x0, y], [x1, y]], kind });
  });
  all.push({ pts: [[BROAD, MARKET], [22, 26]], kind: 'main' }, { pts: [[PIKE, 10], [PIKE, MH]], kind: 'main' });
  const drawn = (kind: Road, w: number, c: string) => all.filter(r => r.kind === kind).forEach(r => casing(r.pts, w, c));
  drawn('st', 4, '#d5cbb3'); drawn('main', 5, '#d1b46a');
  drawn('st', 2, '#ffffff'); drawn('main', 3, '#fbe3a0');
  // city hall: a circle where Broad meets Market, the hall in the middle
  disc(g, BROAD, MARKET, 5, '#d1b46a'); disc(g, BROAD, MARKET, 4, '#fbe3a0'); box(g, BROAD - 2, MARKET - 2, 4, 4, '#b39d76'); box(g, BROAD - 1, MARKET - 1, 2, 2, '#e8dcc2');
  // the cloverleaf where Market crosses the expressway: four loops
  [[-6, -6], [6, -6], [-6, 6], [6, 6]].forEach(([dx, dy]) => { disc(g, 196 + dx, MARKET + dy, 5, '#d39a3e'); disc(g, 196 + dx, MARKET + dy, 4, '#f6c879'); disc(g, 196 + dx, MARKET + dy, 2, '#ece5d2'); });
  [[22, 4], [68, 4], [132, 4]].forEach(([x, y]) => { line(g, x, y, x, y + 8, 3, '#f6c879'); });
  line(g, 196, 90, 204, 100, 3, '#f6c879'); line(g, 204, 100, SPOTS.plane[0], SPOTS.plane[1], 3, '#f6c879');
  casing(EXPY, 6, '#c9852a'); casing(EXPY, 4, '#f4b350'); casing(EXPY, 1, '#fbd38a');
  box(g, 0, MARKET - 1, 12, 3, '#fbe3a0'); // Market's bridge over the river
  return (cityMap = cv);
}

/** The GPS screen. Picking: "where to?" and the places. Driving: the city, the route, the car moving along it. */
function drawGps(g: G, W: number, H: number, picks: Dest[], from: keyof typeof ICONS, dest: Dest | null, route: Pt[] | null, p: number, mins: number) {
  box(g, 0, 0, W, H, INK);
  box(g, 2, 2, W - 4, H - 4, '#f3eedf');
  g.textBaseline = 'alphabetic';
  if (!dest || !route) {
    for (let x = 2; x < W - 2; x += 8) box(g, x, 2, 1, H - 4, '#ebe4d0');
    for (let y = 2; y < H - 2; y += 8) box(g, 2, y, W - 4, 1, '#ebe4d0');
    g.fillStyle = INK; g.font = `800 11px ${GFONT}`; g.textAlign = 'left'; g.fillText('where to?', 7, 15);
    g.fillStyle = 'rgba(22,20,31,0.6)'; g.font = `700 8px ${GFONT}`; g.textAlign = 'right'; g.fillText('stay here', W - 7, 14); box(g, W - 7 - g.measureText('stay here').width, 15, g.measureText('stay here').width, 1, 'rgba(22,20,31,0.5)');
    picks.forEach((d, k) => {
      const y = 21 + k * 20, w = W - 12;
      box(g, 6, y, w, 18, INK); box(g, 7, y + 1, w - 2, 15, '#fffaf0'); box(g, 7, y + 16, w - 2, 1, '#e4dcc6');
      drawIcon(g, d.icon, 10, y + 5);
      g.fillStyle = INK; g.font = `800 10px ${GFONT}`; g.textAlign = 'left'; g.fillText(d.label, 23, y + 12.5);
      g.fillStyle = 'rgba(22,20,31,0.55)'; g.font = `700 8px ${GFONT}`; g.textAlign = 'right'; g.fillText(`${minutesTo(from, d.icon)} min`, W - 10, y + 12.5);
    });
    return;
  }
  // where the car's got to along the route
  const seg = route.slice(1).map((q, i) => Math.hypot(q[0] - route[i][0], q[1] - route[i][1])), total = seg.reduce((a, b) => a + b, 0);
  let left = p * total, cx = route[0][0], cy = route[0][1];
  for (let i = 0; i < seg.length; i++) { if (left <= seg[i]) { const f = left / (seg[i] || 1); cx = route[i][0] + (route[i + 1][0] - route[i][0]) * f; cy = route[i][1] + (route[i + 1][1] - route[i][1]) * f; break; } left -= seg[i]; cx = route[i + 1][0]; cy = route[i + 1][1]; }
  // the map, framed on the whole route (and the pin over its end), drifting along with the car
  const vw = W - 4, vh = H - 17, xs = route.map(q => q[0]), ys = route.map(q => q[1]);
  const mx = (Math.min(...xs) + Math.max(...xs)) / 2, my = (Math.min(...ys) - 12 + Math.max(...ys)) / 2;
  const fit = (c: number, v: number, M: number) => (M <= v ? (M - v) / 2 : Math.max(0, Math.min(M - v, c - v / 2)));
  const ox = Math.round(fit(mx + (cx - mx) * p * 0.5, vw, MW)), oy = Math.round(fit(my + (cy - my) * p * 0.5, vh, MH));
  g.save(); g.beginPath(); g.rect(2, 2, vw, vh); g.clip();
  box(g, 2, 2, vw, vh, '#ece5d2');
  g.drawImage(drawCity(), 2 - ox, 2 - oy);
  const X = (x: number) => 2 + x - ox, Y = (y: number) => 2 + y - oy;
  for (let i = 1; i < route.length; i++) line(g, X(route[i - 1][0]), Y(route[i - 1][1]), X(route[i][0]), Y(route[i][1]), 4, '#1f5fd1');
  for (let i = 1; i < route.length; i++) line(g, X(route[i - 1][0]), Y(route[i - 1][1]), X(route[i][0]), Y(route[i][1]), 2, '#4f94ff');
  // where it set off from, where it's going (a pin with the place's sign), and the car
  const [sx, sy] = route[0]; box(g, X(sx) - 2, Y(sy) - 2, 5, 5, INK); box(g, X(sx) - 1, Y(sy) - 1, 3, 3, '#ffffff');
  const [tx, ty] = route[route.length - 1];
  box(g, X(tx) - 6, Y(ty) - 13, 12, 11, INK); box(g, X(tx) - 5, Y(ty) - 12, 10, 9, '#fffaf0'); drawIcon(g, dest.icon, X(tx) - 4, Y(ty) - 11); box(g, X(tx), Y(ty) - 3, 1, 3, INK);
  box(g, X(cx) - 3, Y(cy) - 3, 7, 7, INK); box(g, X(cx) - 2, Y(cy) - 2, 5, 5, '#ffffff'); box(g, X(cx) - 1, Y(cy) - 1, 3, 3, '#d9483b');
  g.restore();
  // the bar along the bottom
  box(g, 2, H - 15, W - 4, 13, INK);
  g.font = `800 9px ${GFONT}`; g.textAlign = 'left'; g.fillStyle = '#fff6e2'; g.fillText(p >= 1 ? `you've arrived` : `to ${dest.label}`, 7, H - 5);
  if (p < 1) { g.textAlign = 'right'; g.fillStyle = '#f2d23a'; g.fillText(`${Math.ceil(mins * (1 - p))} min`, W - 7, H - 5); }
  // the bezel again, over the edges of the map
  box(g, 0, 0, W, 2, INK); box(g, 0, H - 2, W, 2, INK); box(g, 0, 0, 2, H, INK); box(g, W - 2, 0, 2, H, INK);
}

// ---------- the radio ----------

// what's on: an Olivia Rodrigo song, a different one most times you get in
const SONGS = ['deja vu', 'drivers license', 'good 4 u', 'vampire', 'traitor', 'brutal', 'happier', 'favorite crime', 'get him back!', 'bad idea right?', 'enough for you', 'making the bed', 'obsessed', 'the grudge', 'lacy', "can't catch me now"];
const RW = 100, RH = 16;
/** The radio's little screen: a note, the song scrolling by, the levels jumping. */
function drawRadio(g: G, W: number, H: number, song: string, t: number, speed: number) {
  box(g, 0, 0, W, H, INK); box(g, 1, 1, W - 2, H - 2, '#2b2f3a'); box(g, 3, 3, W - 6, H - 6, '#0d2a1c');
  ['  ##', '  # ', '  # ', ' ## ', '##  '].forEach((r, y) => [...r].forEach((c, x) => { if (c === '#') box(g, 6 + x, 5 + y, 1, 1, '#5ef08a'); }));
  const text = `${song}   olivia rodrigo`;
  g.save(); g.beginPath(); g.rect(13, 3, W - 32, H - 6); g.clip();
  g.font = `700 7px ${GFONT}`; g.textBaseline = 'alphabetic'; g.textAlign = 'left'; g.fillStyle = '#5ef08a';
  const tw = g.measureText(text).width, span = tw + (W - 32), x = 13 + (W - 32) - ((t * 0.028) % span);
  g.fillText(text, Math.round(x), 11); g.restore();
  for (let b = 0; b < 4; b++) { const h = 1 + Math.floor(rnd(b + Math.floor(t / 150)) * (speed > 0.01 ? 7 : 4)); box(g, W - 16 + b * 3, H - 4 - h, 2, h, '#5ef08a'); }
}

// ---------- the drive ----------

/**
 * Going somewhere by car, first person: the screen goes black, then you're in snug's car in town. The GPS on the dash
 * asks where to; pick a place and off it drives, the car moving along the route on the map, then black and you're there.
 */
export default function Drive({ from, dests, sky, avatar, outfit, onArrive, onClose }: {
  from: number; dests: Dest[]; sky: { night: boolean; rain: boolean; snow: boolean }; avatar: Avatar; outfit?: Outfit;
  onArrive: (page: number) => void; onClose: () => void;
}) {
  // in: going dark; car: sat in it, the GPS asking; drive; out: dark again; there: the place fading in;
  // leave and back: got out again without going anywhere
  const [phase, setPhase] = useState<'in' | 'car' | 'drive' | 'out' | 'there' | 'leave' | 'back'>('in');
  const [lit, setLit] = useState(false); // a frame in, so going dark is a fade, not a cut
  useEffect(() => { const r = requestAnimationFrame(() => requestAnimationFrame(() => setLit(true))); return () => cancelAnimationFrame(r); }, []);
  const [dest, setDest] = useState<Dest | null>(null);
  const [vw, setVw] = useState(() => (typeof window === 'undefined' ? 390 : window.innerWidth));
  const [vh, setVh] = useState(() => (typeof window === 'undefined' ? 844 : window.innerHeight));
  const cv = useRef<HTMLCanvasElement>(null), gps = useRef<HTMLCanvasElement>(null), radio = useRef<HTMLCanvasElement>(null);
  const [song] = useState(() => SONGS[Math.floor(Math.random() * SONGS.length)]);
  const speed = useRef(0), want = useRef(0), dist = useRef(0), destRef = useRef<Dest | null>(null), started = useRef(0);
  // where snug's setting off from, and the way the GPS picked this time
  const here = dests.find(d => d.page === from)?.icon ?? 'home', route = useRef<{ pts: Pt[]; mins: number } | null>(null);
  const go = (d: Dest) => { route.current = { pts: routeBetween(here, d.icon, Math.random() * 1000).pts, mins: minutesTo(here, d.icon) }; setDest(d); setPhase('drive'); };
  // routed, pulling off along it, and dark once the GPS has counted down its first minute (it doesn't have to get there)
  const MINUTE = 900, PULL = 300, DRIVE = PULL + MINUTE + 250;

  useEffect(() => { const on = () => { setVw(window.innerWidth); setVh(window.innerHeight); }; window.addEventListener('resize', on); return () => window.removeEventListener('resize', on); }, []);
  // the steps, one after another
  useEffect(() => {
    const t: ReturnType<typeof setTimeout>[] = [];
    if (phase === 'in' && lit) t.push(setTimeout(() => setPhase('car'), 440));
    if (phase === 'drive') { want.current = 1; started.current = performance.now(); t.push(setTimeout(() => setPhase('out'), DRIVE)); }
    if (phase === 'out') t.push(setTimeout(() => { if (dest) onArrive(dest.page); setPhase('there'); }, 480));
    if (phase === 'there') t.push(setTimeout(onClose, 620));
    if (phase === 'leave') t.push(setTimeout(() => setPhase('back'), 450));
    if (phase === 'back') t.push(setTimeout(onClose, 620));
    return () => t.forEach(clearTimeout);
  }, [phase, lit]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { destRef.current = dest; }, [dest]);

  const phone = vw < 760, PW = phone ? 128 : Math.round(vw / 4.5), S = vw / PW, PH = Math.ceil(vh / S);
  const wsT = Math.round(PH * 0.05), wsB = Math.round(PH * (phone ? 0.55 : 0.6));
  const showCar = phase === 'car' || phase === 'drive' || phase === 'out' || phase === 'leave';
  // the GPS: as tall as its list while it asks, a map's worth once it's routing
  const MAP_H = phone ? 226 : 236; // the GPS's height on screen while it's showing the city
  const gw = Math.floor((phone ? Math.min(330, vw - 28) : Math.min(360, vw * 0.38 - 16)) / GS), gh = dest ? Math.floor(MAP_H / GS) : 21 + dests.filter(d => d.page !== from).length * 20 + 6;
  const gpsX = phone ? (vw - gw * GS) / 2 : vw * 0.62, gpsY = wsB * S - (phone ? 22 : 34);
  // snug's colours for its hands and sleeves; a little snug for the dash
  const A = dressed(avatar), skin = (SKINS as Record<string, string[]>)[(avatar as { skin?: string }).skin ?? 'light'] ?? SKINS.light;
  const sleeve = colours(A, outfit && outfit.outer !== 'none' ? outfit.outer : outfit?.top ?? 'tee');
  const bob = useRef<HTMLImageElement | null>(null);
  useEffect(() => { if (!outfit) return; const im = new Image(); im.src = figurine({ ...outfit, acc: outfit.acc.filter(a => a !== 'umbrella') }, 'happy', 'stand'); bob.current = im; }, [outfit]);

  const picks = dests.filter(d => d.page !== from);
  // the whole car and the GPS, every frame while you're in it
  useEffect(() => {
    const c = cv.current, g = c?.getContext('2d'), gg = gps.current?.getContext('2d');
    if (!c || !g || !gg || !showCar) return;
    const out = document.createElement('canvas');
    out.width = PW; out.height = wsB - wsT;
    const og = out.getContext('2d')!;
    const look: Look = { ...sky, phone, skin, sleeve };
    let raf = 0, last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(50, now - last); last = now;
      speed.current += (want.current * 0.1 - speed.current) * Math.min(1, dt / 600);
      dist.current += speed.current * dt;
      drawOutside(og, PW, wsB - wsT, dist.current, now, look);
      drawCar(g, PW, PH, out, speed.current, now, look, wsT, wsB, bob.current);
      // along the route at a minute (snug time) every MINUTE of ours
      const d0 = destRef.current, r = route.current, p = d0 && r && started.current ? Math.min(1, Math.max(0, (now - started.current - PULL) / (r.mins * MINUTE))) : 0;
      drawGps(gg, gw, gh, picks, here, d0, r?.pts ?? null, p, r?.mins ?? 0);
      const rg = radio.current?.getContext('2d');
      if (rg) drawRadio(rg, RW, RH, song, now, speed.current);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [PW, PH, wsT, wsB, gw, gh, sky.night, sky.rain, sky.snow, showCar, phone, skin.join(), sleeve.join(), from, dests.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const driving = phase === 'drive' || phase === 'out';
  const dark = (phase === 'in' && lit) || phase === 'out' || phase === 'leave';

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, fontFamily: FONT, pointerEvents: phase === 'there' || phase === 'back' ? 'none' : 'auto' }}>
      <style>{`@keyframes drive-bob{0%,100%{translate:0 0}50%{translate:0 2px}}`}</style>
      {showCar && (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#20232b' }}>
          <canvas ref={cv} width={PW} height={PH} style={{ position: 'absolute', left: 0, top: 0, width: PW * S, height: PH * S, imageRendering: 'pixelated', animation: driving ? 'drive-bob .45s ease-in-out infinite' : undefined }} />
          {/* the radio, playing something good */}
          <canvas ref={radio} width={RW} height={RH} aria-label={`on the radio: ${song} by olivia rodrigo`}
            style={{ position: 'absolute', left: phone ? vw / 2 - RW : vw * 0.47, top: phone ? gpsY + Math.floor(MAP_H / GS) * GS + 16 : (wsB + 20) * S, width: RW * 2, height: RH * 2, imageRendering: 'pixelated' }} />
          {/* the GPS on the dash, and where to tap on it */}
          <div style={{ position: 'absolute', left: gpsX, top: gpsY, width: gw * GS, height: gh * GS, filter: 'drop-shadow(0 6px 0 rgba(0,0,0,0.35))' }}>
            <canvas ref={gps} width={gw} height={gh} style={{ display: 'block', width: gw * GS, height: gh * GS, imageRendering: 'pixelated' }} />
            {!dest && (
              <>
                <button onClick={() => setPhase('leave')} aria-label="stay here" style={{ position: 'absolute', right: 4 * GS, top: 4 * GS, width: 48 * GS, height: 14 * GS }} />
                {picks.map((d, k) => (
                  <button key={d.page} onClick={() => go(d)} aria-label={`go to ${d.label}`}
                    style={{ position: 'absolute', left: 6 * GS, top: (21 + k * 20) * GS, width: (gw - 12) * GS, height: 18 * GS }} />
                ))}
              </>
            )}
          </div>
        </div>
      )}
      {/* black, between places */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, background: '#000', pointerEvents: 'none', opacity: dark ? 1 : 0, transition: `opacity ${phase === 'there' || phase === 'back' ? 0.6 : 0.42}s ease` }} />
    </div>,
    document.body,
  );
}

/** Just the black between places, for going straight home: dark, then onMid (the world jumps), then light again. */
export function Fade({ onMid, onDone }: { onMid: () => void; onDone: () => void }) {
  const [step, setStep] = useState(0); // 0 clear, 1 dark, 2 clearing
  useEffect(() => {
    const r = requestAnimationFrame(() => requestAnimationFrame(() => setStep(1)));
    const a = setTimeout(() => { onMid(); setStep(2); }, 480), b = setTimeout(onDone, 1150);
    return () => { cancelAnimationFrame(r); clearTimeout(a); clearTimeout(b); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return createPortal(<div aria-hidden style={{ position: 'fixed', inset: 0, zIndex: 100, background: '#000', opacity: step === 1 ? 1 : 0, transition: `opacity ${step === 2 ? 0.6 : 0.42}s ease`, pointerEvents: step === 2 ? 'none' : 'auto' }} />, document.body);
}
