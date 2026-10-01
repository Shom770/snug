'use client';
import React from 'react';
import { Component as SnugLogic, PRESETS, INTDEF, outfitFor } from '../lib/engine';
import { buildPreset } from '../lib/weather';
import type { OutfitFn, WeatherInput } from '../lib/types';
import Template from './SnugTemplate';

export interface SnugProps {
  /** Live weather. Omit it to use the built-in presets. */
  weather?: WeatherInput;
  units?: '°F' | '°C';
  /** built-in preset key, used when weather is omitted */
  preset?: string;
  intensity?: number;
  motion?: boolean;
  /** start inside the app instead of the sign-in flow */
  skipLogin?: boolean;
  /** show the loading world (snug playing in the scene) until this turns false, then reveal the forecast */
  loading?: boolean;
  /** the forecast being revealed is one we already had: skip the walk back and growing hills, snug just poofs in */
  quick?: boolean;
  /** place name shown on the signs, lowercase */
  city?: string;
  /** the evening check-in was saved; reject to show the message on the save button */
  onCheckin?: (c: { felt: number; fit: string | null }) => Promise<void>;
  /** opens the quick outfit/style change (the "change style" link under what to wear) */
  onChangeStyle?: () => void;
  /** how snug looks (skin, hair, style...); see CharacterPanel */
  avatar?: { skin: string; body: 'boy' | 'girl'; hair: string; hairColor: string; style: string; skirt: boolean } | null;
  /** tonight's saved check-in, if any; the check-in card shows it as done */
  checkin?: { felt: number; fit: string | null } | null;
  /** true shows the app, false the sign-in / onboarding flow (defaults to the engine's own flag) */
  showApp?: boolean;
  /** move the onboarding to a step (0 welcome, 1 place, 2 which-day-feels-better, 3 done); bump seq to re-send */
  loginGoto?: { step: number; seq: number };
  /** a place has been chosen, so step 1 offers "next" instead of "skip" */
  placeSet?: boolean;
  /** onboarding finished; receives the tuning summary from the which-day-feels-better picks (null if skipped) */
  onFinishLogin?: (tuning: { ideal: number; windAvoid: number; cloudAvoid: number } | null) => void;
}

// The logic class is generated from the design (lib/engine.ts) and stays untyped.
const Base = SnugLogic as unknown as React.ComponentClass<SnugProps, Record<string, any>> & {
  prototype: { renderVals(): Record<string, any>; componentDidUpdate?(pp: SnugProps, ps: Record<string, any>): void; startDress?(): void };
};

export default class Snug extends Base {
  private _wx?: ReturnType<typeof setTimeout>;
  declare startDress?: () => void;

  constructor(props: SnugProps) {
    super(props);
    if (props.skipLogin) this.state = { ...this.state, authed: true, onboarded: true };
    // the season picker lived in the removed preview strip; don't stay stuck on an old pick
    this.state = { ...this.state, season: 'auto' };
  }

  renderVals(): Record<string, any> {
    const w = this.props.weather;
    const baseRender = (Base.prototype.renderVals as () => Record<string, any>).bind(this);
    let v: Record<string, any>;
    if (w) {
      const { preset } = buildPreset(w, outfitFor as OutfitFn);
      (PRESETS as Record<string, unknown>).__input = preset;
      (INTDEF as Record<string, number>).__input = preset.intensity || 0;
      const saved = this.state;
      (this as any).state = { ...saved, preset: '__input', night: !!preset.night, intensity: preset.intensity || null };
      try { v = baseRender(); } finally { (this as any).state = saved; }
    } else v = baseRender();
    return v;
  }

  componentDidUpdate(pp: SnugProps, ps: Record<string, any>) {
    Base.prototype.componentDidUpdate?.call(this, pp, ps);
    const a = JSON.stringify(pp.weather ?? null), b = JSON.stringify(this.props.weather ?? null);
    if (a !== b && this.startDress) {
      clearTimeout(this._wx);
      this._wx = setTimeout(() => this.startDress?.(), 400);
    }
  }

  render() {
    return <Template v={this.renderVals()} />;
  }
}
