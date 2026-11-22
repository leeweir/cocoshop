import type { FinishMode } from './types';

/**
 * Craft finishing mini-games (SPEC §12.5) as a pure, deterministic engine.
 * No DOM and no wall clock: the game loop advances time with `tickFinish`,
 * input arrives through `pressFinish` / `releaseFinish`, and the UI draws
 * whatever `finishFrame` returns. State is plain data so drafts can clone it.
 */

export type FinishEngine = 'rhythm' | 'hold' | 'stack' | 'pendulum';

/** perfect / good / miss, plus `over` when the hold meter tops out (太稠). */
export type FinishGrade = 'perfect' | 'good' | 'miss' | 'over';

/** Shop finish per drink category: tea 节拍手摇, milkshake 长按搅拌, ice cream 堆球. */
export const FINISH_ENGINE: Record<FinishMode, FinishEngine> = {
  shake: 'rhythm',
  blend: 'hold',
  scoop: 'stack',
};

/** Shop quality needed for 「完美出杯」. */
export const PERFECT_QUALITY = 0.84;

export interface FinishTuning {
  /** ≥ 1; widens beat windows, the hold band and the stack tolerance. */
  ease?: number;
  /** Tempo multiplier (beat rate, fill rate, scoop / pointer sweep rate). */
  speed?: number;
  /** Notes / rounds / balls / taps. Defaults: rhythm 4, hold 2, stack 3, pendulum 3. */
  units?: number;
  /** pendulum: half-width of the sweet zone in track units (0..0.5). */
  zone?: number;
  /** pendulum: the pointer wobbles a little. */
  drift?: boolean;
  /** Seeds the hold target bands. */
  seed?: number;
}

export interface FinishNote {
  /** Time the note reaches the hit circle. */
  at: number;
  grade: FinishGrade | null;
}

export interface FinishState {
  engine: FinishEngine;
  t: number;
  ease: number;
  speed: number;
  units: number;
  scores: number[];
  grades: FinishGrade[];
  done: boolean;
  quality: number;
  perfect: boolean;
  /** rhythm */
  notes: FinishNote[];
  beats: number;
  /** hold */
  holding: boolean;
  holdT: number;
  fill: number;
  targets: number[];
  ghost: number | null;
  /** stack: landed x of each ball (0..1, cone centre 0.5). */
  stack: number[];
  scoopPhase: number;
  /** pendulum */
  zone: number;
  drift: boolean;
}

export type FinishEvent =
  | { type: 'beat'; index: number }
  | { type: 'hold' }
  | { type: 'score'; index: number; score: number; grade: FinishGrade }
  | { type: 'done'; quality: number; perfect: boolean };

export interface RhythmFrame {
  engine: 'rhythm';
  done: boolean;
  /** Hit circle position along the lane (0 = left, 1 = right). */
  hitX: number;
  /** x along the lane per note; > 1 means still off-screen right. */
  notes: { x: number; grade: FinishGrade | null }[];
  /** A pending note is inside the perfect window right now. */
  hot: boolean;
  /** Judgement ease (≥ 1); the hit circle grows with it. */
  ease: number;
}

export interface HoldFrame {
  engine: 'hold';
  done: boolean;
  fill: number;
  target: number;
  band: number;
  holding: boolean;
  ghost: number | null;
  round: number;
  hot: boolean;
}

export interface StackFrame {
  engine: 'stack';
  done: boolean;
  scoopX: number;
  top: number;
  tolerance: number;
  balls: number[];
  hot: boolean;
}

export interface PendulumFrame {
  engine: 'pendulum';
  done: boolean;
  pointer: number;
  zone: number;
  hot: boolean;
}

export type FinishFrame = RhythmFrame | HoldFrame | StackFrame | PendulumFrame;

// ───────────────────────────────────────── tuning constants

const RHYTHM_LEAD = 1.1;
const RHYTHM_INTERVAL = 0.62;
const RHYTHM_HIT_X = 0.16;
const RHYTHM_PERFECT = 0.06;
const RHYTHM_GOOD = 0.15;
const RHYTHM_REACH = 0.22;

const HOLD_BAND = 0.07;
const HOLD_TARGET_MIN = 0.55;
const HOLD_TARGET_MAX = 0.8;

const STACK_TOLERANCE = 0.05;
const STACK_FALLOFF = 0.24;
const STACK_MIN_X = 0.1;
const STACK_MAX_X = 0.9;

const PENDULUM_ZONE = 0.11;

/** Default notes / rounds / balls / taps per engine. */
export const FINISH_UNITS: Record<FinishEngine, number> = { rhythm: 4, hold: 2, stack: 3, pendulum: 3 };

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 0 → 1 → 0 triangle wave over one period of 2. */
function bounce(phase: number): number {
  const p = ((phase % 2) + 2) % 2;
  return p < 1 ? p : 2 - p;
}

// ───────────────────────────────────────── lifecycle

export function createFinish(engine: FinishEngine, tuning: FinishTuning = {}): FinishState {
  const ease = Math.max(1, tuning.ease ?? 1);
  const speed = Math.max(0.3, tuning.speed ?? 1);
  const units = Math.max(1, Math.round(tuning.units ?? FINISH_UNITS[engine]));
  const interval = RHYTHM_INTERVAL / speed;
  const random = mulberry32(tuning.seed ?? 1);
  return {
    engine,
    t: 0,
    ease,
    speed,
    units,
    scores: [],
    grades: [],
    done: false,
    quality: 0,
    perfect: false,
    notes: engine === 'rhythm' ? Array.from({ length: units }, (_, i) => ({ at: RHYTHM_LEAD + i * interval, grade: null })) : [],
    beats: 0,
    holding: false,
    holdT: 0,
    fill: 0,
    targets:
      engine === 'hold'
        ? Array.from({ length: units }, () => HOLD_TARGET_MIN + random() * (HOLD_TARGET_MAX - HOLD_TARGET_MIN))
        : [],
    ghost: null,
    stack: [],
    scoopPhase: 0,
    zone: (tuning.zone ?? PENDULUM_ZONE) * ease,
    drift: tuning.drift ?? false,
  };
}

/**
 * Deep copy for craft drafts. A press can't survive the overlay closing, so
 * an unfinished hold round is dropped (the player simply stirs it again).
 */
export function cloneFinish(state: FinishState): FinishState {
  const copy: FinishState = {
    ...state,
    scores: [...state.scores],
    grades: [...state.grades],
    notes: state.notes.map((note) => ({ ...note })),
    targets: [...state.targets],
    stack: [...state.stack],
  };
  if (copy.holding) {
    copy.holding = false;
    copy.holdT = 0;
    copy.fill = 0;
  }
  return copy;
}

function record(state: FinishState, score: number, grade: FinishGrade, events: FinishEvent[]) {
  const index = state.scores.length;
  state.scores.push(score);
  state.grades.push(grade);
  events.push({ type: 'score', index, score, grade });
  if (state.scores.length >= state.units) {
    state.done = true;
    state.holding = false;
    state.quality = state.scores.reduce((sum, value) => sum + value, 0) / state.scores.length;
    state.perfect = state.quality >= PERFECT_QUALITY;
    events.push({ type: 'done', quality: state.quality, perfect: state.perfect });
  }
}

// ───────────────────────────────────────── per-engine helpers

function holdFill(holdT: number, speed: number): number {
  // Ease-in: slow at first, then the texture thickens quickly.
  return speed * (0.24 * holdT + 0.3 * holdT * holdT);
}

function stackTop(state: FinishState): number {
  return state.stack.length ? state.stack[state.stack.length - 1] : 0.5;
}

function scoopX(state: FinishState): number {
  return STACK_MIN_X + bounce(state.scoopPhase) * (STACK_MAX_X - STACK_MIN_X);
}

function pendulumPos(state: FinishState): number {
  let pos = bounce(state.t * state.speed);
  if (state.drift) pos = Math.max(0, Math.min(1, pos + Math.sin(state.t * 2.4 + 0.6) * 0.06));
  return pos;
}

function rhythmScore(delta: number, ease: number): { score: number; grade: FinishGrade } {
  const d = Math.abs(delta);
  if (d <= RHYTHM_PERFECT * ease) return { score: 1, grade: 'perfect' };
  if (d <= RHYTHM_GOOD * ease) return { score: 0.8, grade: 'good' };
  return { score: 0.45, grade: 'miss' };
}

function holdScore(fill: number, target: number, ease: number): { score: number; grade: FinishGrade } {
  const band = HOLD_BAND * ease;
  const d = Math.abs(fill - target);
  if (d <= band * 0.4) return { score: 1, grade: 'perfect' };
  if (d <= band) return { score: 1 - ((d - band * 0.4) / (band * 0.6)) * 0.2, grade: 'good' };
  return { score: Math.max(0.3, 0.72 - (d - band) * 2.4), grade: 'miss' };
}

function stackScore(x: number, top: number, ease: number): { score: number; grade: FinishGrade } {
  const tol = STACK_TOLERANCE * ease;
  const d = Math.abs(x - top);
  if (d <= tol) return { score: 1, grade: 'perfect' };
  const score = Math.max(0.3, 1 - ((d - tol) / STACK_FALLOFF) * 0.7);
  return { score, grade: score >= 0.62 ? 'good' : 'miss' };
}

function pendulumScore(pos: number, zone: number): { score: number; grade: FinishGrade } {
  const d = Math.abs(pos - 0.5);
  if (d <= zone * 0.22) return { score: 1, grade: 'perfect' };
  if (d <= zone) return { score: 1 - ((d - zone * 0.22) / (zone * 0.78)) * 0.26, grade: 'good' };
  return { score: Math.max(0.12, 0.72 - (d - zone) * 1.5), grade: 'miss' };
}

// ───────────────────────────────────────── input & time

export function tickFinish(state: FinishState, dt: number): FinishEvent[] {
  const events: FinishEvent[] = [];
  if (state.done || dt <= 0) return events;
  state.t += dt;
  switch (state.engine) {
    case 'rhythm': {
      while (state.beats < state.notes.length && state.t >= state.notes[state.beats].at) {
        events.push({ type: 'beat', index: state.beats });
        state.beats += 1;
      }
      const late = RHYTHM_REACH * state.ease;
      for (const note of state.notes) {
        if (state.done) break;
        if (note.grade === null && state.t > note.at + late) {
          note.grade = 'miss';
          record(state, 0.35, 'miss', events);
        }
      }
      break;
    }
    case 'hold': {
      if (!state.holding) break;
      state.holdT += dt;
      state.fill = holdFill(state.holdT, state.speed);
      if (state.fill >= 1) {
        state.fill = 1;
        state.holding = false;
        state.ghost = 1;
        record(state, 0.3, 'over', events);
        if (!state.done) state.fill = 0;
      }
      break;
    }
    case 'stack':
      // Each ball sweeps a little faster than the last.
      state.scoopPhase += dt * (0.62 + state.stack.length * 0.2) * state.speed;
      break;
    case 'pendulum':
      break;
  }
  return events;
}

export function pressFinish(state: FinishState): FinishEvent[] {
  const events: FinishEvent[] = [];
  if (state.done) return events;
  switch (state.engine) {
    case 'rhythm': {
      const reach = RHYTHM_REACH * state.ease;
      let best: FinishNote | null = null;
      for (const note of state.notes) {
        if (note.grade !== null) continue;
        const d = Math.abs(state.t - note.at);
        if (d > reach) continue;
        if (!best || d < Math.abs(state.t - best.at)) best = note;
      }
      if (!best) break;
      const { score, grade } = rhythmScore(state.t - best.at, state.ease);
      best.grade = grade;
      record(state, score, grade, events);
      break;
    }
    case 'hold':
      if (state.holding) break;
      state.holding = true;
      state.holdT = 0;
      state.fill = 0;
      events.push({ type: 'hold' });
      break;
    case 'stack': {
      const x = scoopX(state);
      const { score, grade } = stackScore(x, stackTop(state), state.ease);
      state.stack.push(x);
      // The scoop goes back for the next ball and comes in from the far side,
      // so dropping again straight away cannot land on the ball just placed.
      state.scoopPhase = x < 0.5 ? 1 : 0;
      record(state, score, grade, events);
      break;
    }
    case 'pendulum': {
      const { score, grade } = pendulumScore(pendulumPos(state), state.zone);
      record(state, score, grade, events);
      break;
    }
  }
  return events;
}

export function releaseFinish(state: FinishState): FinishEvent[] {
  const events: FinishEvent[] = [];
  if (state.done || state.engine !== 'hold' || !state.holding) return events;
  const target = state.targets[state.scores.length] ?? 0.68;
  const { score, grade } = holdScore(state.fill, target, state.ease);
  state.holding = false;
  state.ghost = state.fill;
  record(state, score, grade, events);
  if (!state.done) {
    state.fill = 0;
    state.holdT = 0;
  }
  return events;
}

export function finishFrame(state: FinishState): FinishFrame {
  switch (state.engine) {
    case 'rhythm': {
      const span = 1 - RHYTHM_HIT_X;
      const perfect = RHYTHM_PERFECT * state.ease;
      return {
        engine: 'rhythm',
        done: state.done,
        hitX: RHYTHM_HIT_X,
        notes: state.notes.map((note) => ({
          x: RHYTHM_HIT_X + ((note.at - state.t) / RHYTHM_LEAD) * span,
          grade: note.grade,
        })),
        hot: state.notes.some((note) => note.grade === null && Math.abs(state.t - note.at) <= perfect),
        ease: state.ease,
      };
    }
    case 'hold': {
      const round = Math.min(state.scores.length, state.units - 1);
      const target = state.targets[round] ?? 0.68;
      const band = HOLD_BAND * state.ease;
      return {
        engine: 'hold',
        done: state.done,
        fill: state.fill,
        target,
        band,
        holding: state.holding,
        ghost: state.ghost,
        round,
        hot: state.holding && Math.abs(state.fill - target) <= band,
      };
    }
    case 'stack': {
      const x = scoopX(state);
      const top = stackTop(state);
      const tolerance = STACK_TOLERANCE * state.ease;
      return {
        engine: 'stack',
        done: state.done,
        scoopX: x,
        top,
        tolerance,
        balls: [...state.stack],
        hot: !state.done && Math.abs(x - top) <= tolerance,
      };
    }
    case 'pendulum': {
      const pointer = pendulumPos(state);
      return {
        engine: 'pendulum',
        done: state.done,
        pointer,
        zone: state.zone,
        hot: Math.abs(pointer - 0.5) <= state.zone,
      };
    }
  }
}
