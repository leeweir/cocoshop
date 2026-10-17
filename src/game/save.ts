import { CUSTOMERS, UPGRADES } from './data';
import type { SaveData, UpgradeId } from './types';

const SAVE_KEY = 'peach-mint-cafe.save.v1';

export function freshSave(): SaveData {
  return {
    version: 2,
    day: 1,
    coins: 0,
    totalCoinsEarned: 0,
    bestRevenue: 0,
    bestCombo: 0,
    servedTotal: 0,
    perfectTotal: 0,
    upgrades: { seat: 0, sign: 0, display: 0, training: 0 },
    metCustomers: [],
    regulars: {},
    deliveryTotal: 0,
    bestDeliveryRating: 0,
    tutorialSeen: false,
    sound: true,
  };
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === 'number' && Number.isFinite(value) ? Math.floor(value) : fallback;
  return Math.min(max, Math.max(min, n));
}

export function loadSave(): SaveData {
  const base = freshSave();
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return base;
    const data = JSON.parse(raw) as Partial<SaveData> | null;
    if (!data || typeof data !== 'object') return base;

    const rawUpgrades = (data.upgrades ?? {}) as Partial<Record<UpgradeId, unknown>>;
    const upgrades = { ...base.upgrades };
    for (const def of UPGRADES) {
      upgrades[def.id] = clampInt(rawUpgrades[def.id], 0, def.maxLevel, 0);
    }

    const known = new Set(CUSTOMERS.map((c) => c.id));
    const met = Array.isArray(data.metCustomers)
      ? [...new Set(data.metCustomers.filter((id): id is string => typeof id === 'string' && known.has(id)))]
      : [];

    const rawRegulars = (data.regulars ?? {}) as Record<string, unknown>;
    const regulars: Record<string, number> = {};
    for (const id of known) {
      regulars[id] = clampInt(rawRegulars[id], 0, 99, 0);
    }

    return {
      version: 2,
      day: clampInt(data.day, 1, 999, 1),
      coins: clampInt(data.coins, 0, 9_999_999, 0),
      totalCoinsEarned: clampInt(data.totalCoinsEarned, 0, 99_999_999, 0),
      bestRevenue: clampInt(data.bestRevenue, 0, 99_999_999, 0),
      bestCombo: clampInt(data.bestCombo, 0, 9_999, 0),
      servedTotal: clampInt(data.servedTotal, 0, 9_999_999, 0),
      perfectTotal: clampInt(data.perfectTotal, 0, 9_999_999, 0),
      upgrades,
      metCustomers: met,
      regulars,
      deliveryTotal: clampInt(data.deliveryTotal, 0, 9_999_999, 0),
      bestDeliveryRating: clampInt(data.bestDeliveryRating, 0, 3, 0),
      tutorialSeen: data.tutorialSeen === true,
      sound: data.sound !== false,
    };
  } catch {
    return base;
  }
}

export function persistSave(save: SaveData): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    // A full or unavailable storage should never interrupt a shift.
  }
}

export function wipeSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // ignore
  }
}
