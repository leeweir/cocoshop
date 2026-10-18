import { CITY_EVENING_SLOTS, CITY_STORIES, SUPPLIES, TRAVEL_CHAPTERS } from './expansion';
import { CUSTOMERS, DRINKS_MAP, UPGRADES } from './data';
import type { CitySave, SaveData, SupplyId, TravelRecord, TravelSave, UpgradeId } from './types';

const SAVE_KEY = 'peach-mint-cafe.save.v1';

export function freshSave(): SaveData {
  return {
    version: 3,
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
    city: {
      evening: 1,
      slotsLeft: CITY_EVENING_SLOTS,
      supplies: [],
      recipes: [],
      stories: [],
      usedSpots: [],
      visits: 0,
      plane: false,
      traveling: null,
    },
    travel: { chapters: {} },
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

    const pendingRaw = clampInt(data.pendingShopDay, 0, 999, 0);
    const pendingShopDay = pendingRaw > 0 ? pendingRaw : undefined;
    const day = clampInt(data.day, 1, 999, 1);
    let upcomingDay = pendingShopDay ? Math.min(999, Math.max(day, pendingShopDay + 1)) : day;
    // A shift that was open when the page closed never finished. Bank it as
    // consumed so reloading cannot replay the same day for free coins.
    const openShiftRaw = clampInt(data.openShiftDay, 0, 999, 0);
    let recoveredShopDay = pendingShopDay;
    if (openShiftRaw > 0 && openShiftRaw === upcomingDay) {
      recoveredShopDay = Math.max(pendingShopDay ?? 0, openShiftRaw);
      upcomingDay = Math.min(999, openShiftRaw + 1);
    }

    const rawCity = (data.city ?? {}) as Partial<CitySave>;
    const validSupplyIds = new Set<string>(SUPPLIES.map((supply) => supply.id));
    const validStoryIds = new Set(CITY_STORIES.map((story) => story.id));
    const validSpotIds = new Set(['market', 'bakery', 'flower', 'airclub', 'home']);
    const citySupplies = Array.isArray(rawCity.supplies)
      ? [...new Set(rawCity.supplies.filter((id): id is SupplyId => typeof id === 'string' && validSupplyIds.has(id)))].slice(0, 3)
      : [];
    const cityRecipes = Array.isArray(rawCity.recipes)
      ? [...new Set(rawCity.recipes.filter((id): id is string => typeof id === 'string' && DRINKS_MAP[id]?.source === 'city'))]
      : [];
    const cityStories = Array.isArray(rawCity.stories)
      ? [...new Set(rawCity.stories.filter((id): id is string => typeof id === 'string' && validStoryIds.has(id)))]
      : [];
    const rawEvening = clampInt(rawCity.evening, 1, 999, upcomingDay);
    const sameEvening = rawEvening === upcomingDay;
    const rawTraveling = typeof rawCity.traveling === 'string' ? rawCity.traveling : null;
    const city: CitySave = {
      evening: upcomingDay,
      slotsLeft: sameEvening ? clampInt(rawCity.slotsLeft, 0, CITY_EVENING_SLOTS, CITY_EVENING_SLOTS) : CITY_EVENING_SLOTS,
      supplies: citySupplies,
      recipes: cityRecipes,
      stories: cityStories,
      usedSpots: sameEvening && Array.isArray(rawCity.usedSpots)
        ? [...new Set(rawCity.usedSpots.filter((id): id is string => typeof id === 'string' && validSpotIds.has(id)))]
        : [],
      visits: clampInt(rawCity.visits, 0, 999_999, 0),
      plane: rawCity.plane === true,
      traveling: null,
    };

    const rawTravel = (data.travel ?? {}) as Partial<TravelSave>;
    const rawChapters = (rawTravel.chapters ?? {}) as Record<string, unknown>;
    const chapters: Record<string, TravelRecord> = {};
    for (const chapter of TRAVEL_CHAPTERS) {
      const entry = rawChapters[chapter.id] as Partial<TravelRecord> | undefined;
      if (!entry || typeof entry !== 'object') continue;
      chapters[chapter.id] = {
        stars: clampInt(entry.stars, 0, 3, 0),
        day: clampInt(entry.day, 1, 999, upcomingDay),
      };
    }
    if (rawTraveling && TRAVEL_CHAPTERS.some((chapter) => chapter.id === rawTraveling) && !chapters[rawTraveling]) {
      city.traveling = rawTraveling;
    }

    return {
      version: 3,
      day: upcomingDay,
      pendingShopDay: recoveredShopDay,
      openShiftDay: openShiftRaw > 0 && openShiftRaw === pendingShopDay ? openShiftRaw : undefined,
      city,
      travel: { chapters },
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
