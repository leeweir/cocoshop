import { DELIVERY_NOTES, DRINKS_MAP, PACKAGING_BY_CATEGORY, drinkForDay, type DeliveryNote } from './data';
import type {
  CustomerDef,
  CustomerTaste,
  DrinkDef,
  IceType,
  LastOrder,
  OrderKind,
  OrderState,
  ProductCategory,
  Recipe,
  SizeType,
  SugarType,
  TasteTag,
  ToppingType,
} from './types';

/** Rapport needed before a regular starts describing wishes instead of drinks. */
export const RAPPORT_WISH = 2;
/** Rapport needed before a regular may simply ask for 「老样子」. */
export const RAPPORT_USUAL = 4;

const USUAL_CHANCE = 0.3;
const WISH_CHANCE = 0.35;
const TASTE_PICK_CHANCE = 0.55;

export const TASTE_TAGS: Record<TasteTag, { label: string; phrase: string; color: string }> = {
  fruity: { label: '果香', phrase: '带点果香的', color: '#ffb29f' },
  pink: { label: '粉粉的', phrase: '粉粉的', color: '#ff9fbe' },
  milky: { label: '奶香', phrase: '奶香浓一点的', color: '#efd6b4' },
  tea: { label: '茶香', phrase: '喝得出茶香的', color: '#c99f68' },
  rich: { label: '浓甜', phrase: '浓浓甜甜的', color: '#b98563' },
  matcha: { label: '抹茶', phrase: '抹茶味的', color: '#9cc27f' },
  floral: { label: '花香', phrase: '有花香的', color: '#e8bd54' },
  chewy: { label: '有嚼劲', phrase: '有东西可以嚼的', color: '#9a7563' },
  fresh: { label: '清爽', phrase: '清清爽爽的', color: '#8fd9c1' },
  creamy: { label: '绵密', phrase: '绵绵密密的', color: '#f3c98f' },
};

const ALL_TAGS = Object.keys(TASTE_TAGS) as TasteTag[];
const SUGARS: SugarType[] = ['zero', 'half', 'full'];
const SIZES: SizeType[] = ['medium', 'large'];
const TOPPINGS: ToppingType[] = ['pearl', 'jelly', 'taro', 'cheese', 'none'];

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/** 「粉粉的、带点果香的」 */
export function wishText(tags: TasteTag[]): string {
  return tags.map((tag) => TASTE_TAGS[tag].phrase).join('、');
}

/** Drink names stay on order slips while the player is still learning the menu. */
export function revealsDrinkName(day: number, tutorialSeen: boolean): boolean {
  return day <= 2 || !tutorialSeen;
}

/** Drinks that satisfy a wish. Only teas can be served hot, so a hot wish rules out shakes and ice cream. */
export function wishCandidates(tags: TasteTag[], unlocked: DrinkDef[], ice?: IceType): DrinkDef[] {
  return unlocked.filter(
    (drink) => tags.every((tag) => drink.tags.includes(tag)) && (ice !== 'hot' || drink.category === 'tea'),
  );
}

export function menuRequest(drink: DrinkDef, day: number, taste?: CustomerTaste): Recipe {
  const request: Recipe = { ...drink.recipe };
  const coldOnly = drink.category !== 'tea' || day < 2;
  if (Math.random() < 0.5) {
    request.sugar = taste && Math.random() < 0.65 ? taste.sugar : pick(SUGARS);
  }
  if (Math.random() < 0.55) {
    const ices: IceType[] = coldOnly ? ['less', 'normal'] : ['hot', 'less', 'normal'];
    const habit = taste?.ice;
    request.ice = habit && ices.includes(habit) && Math.random() < 0.6 ? habit : pick(ices);
  }
  if (Math.random() < 0.42) {
    request.size = taste && Math.random() < 0.6 ? taste.size : pick(SIZES);
  }
  if (Math.random() < 0.32) {
    request.topping = pick(TOPPINGS);
  }
  return request;
}

function menuDrink(day: number, unlocked: DrinkDef[], extraIds: string[], taste?: CustomerTaste): DrinkDef {
  if (taste && Math.random() < TASTE_PICK_CHANCE) {
    const weighted: DrinkDef[] = [];
    for (const drink of unlocked) {
      if (taste.favorites.includes(drink.id)) weighted.push(drink, drink, drink);
      else if (drink.tags.some((tag) => taste.tags.includes(tag))) weighted.push(drink);
    }
    if (weighted.length) return pick(weighted);
  }
  return drinkForDay(day, extraIds);
}

export interface OrderPlan {
  kind: OrderKind;
  drinkId: string;
  request: Recipe;
  wishTags?: TasteTag[];
}

export interface DineInContext {
  day: number;
  customer: CustomerDef;
  unlocked: DrinkDef[];
  extraIds: string[];
  rapport: number;
  last?: LastOrder;
  /** Wish / usual orders only happen for calm dine-in guests (no VIP, no rush). */
  allowSpecial: boolean;
}

export function planDineIn(ctx: DineInContext): OrderPlan {
  const { day, customer, unlocked, extraIds, rapport, last, allowSpecial } = ctx;
  if (allowSpecial && day >= 2) {
    if (
      last &&
      rapport >= RAPPORT_USUAL &&
      unlocked.some((drink) => drink.id === last.drinkId) &&
      Math.random() < USUAL_CHANCE
    ) {
      return { kind: 'usual', drinkId: last.drinkId, request: { ...last.recipe } };
    }
    if (rapport >= RAPPORT_WISH && Math.random() < WISH_CHANCE) {
      const wish = planWish(customer.taste, unlocked);
      if (wish) return wish;
    }
  }
  const drink = menuDrink(day, unlocked, extraIds, customer.taste);
  return { kind: 'menu', drinkId: drink.id, request: menuRequest(drink, day, customer.taste) };
}

function planWish(taste: CustomerTaste, unlocked: DrinkDef[]): OrderPlan | null {
  const optionsFor = (ice: IceType) => {
    const seen = new Set<string>();
    const options: { tags: TasteTag[]; candidates: DrinkDef[] }[] = [];
    for (const first of taste.tags) {
      for (const second of ALL_TAGS) {
        if (first === second) continue;
        const key = [first, second].sort().join('+');
        if (seen.has(key)) continue;
        seen.add(key);
        const tags = [first, second];
        const candidates = wishCandidates(tags, unlocked, ice);
        if (candidates.length) options.push({ tags, candidates });
      }
    }
    return options;
  };
  let ice: IceType = taste.ice;
  let options = optionsFor(ice);
  if (!options.length && ice === 'hot') {
    ice = 'less';
    options = optionsFor(ice);
  }
  if (!options.length) return null;
  // Prefer wishes with more than one right answer, and ones that sound like this guest.
  const roomy = options.filter((option) => option.candidates.length >= 2);
  const pool = roomy.length ? roomy : options;
  const inCharacter = pool.filter((option) => option.tags.every((tag) => taste.tags.includes(tag)));
  const chosen = pick(inCharacter.length && Math.random() < 0.6 ? inCharacter : pool);

  const sugar = Math.random() < 0.7 ? taste.sugar : pick(SUGARS);
  const size = Math.random() < 0.7 ? taste.size : pick(SIZES);
  const favorites = chosen.candidates.filter((drink) => taste.favorites.includes(drink.id));
  const target = pick(favorites.length ? favorites : chosen.candidates);
  return {
    kind: 'wish',
    drinkId: target.id,
    wishTags: chosen.tags,
    request: { ...target.recipe, ice, sugar, size },
  };
}

export interface ServeTarget {
  target: Recipe;
  drinkOk: boolean;
  favorite: boolean;
  wishMatched: boolean[] | null;
}

/**
 * What the cup is judged against. Wish orders accept any drink carrying both
 * wished tags; the guest's ice / sugar / size still apply and the topping
 * follows the chosen drink.
 */
export function resolveTarget(order: OrderState, chosen: DrinkDef, customer: CustomerDef): ServeTarget {
  if (order.kind === 'wish' && order.wishTags?.length) {
    const wishMatched = order.wishTags.map((tag) => chosen.tags.includes(tag));
    const drinkOk = wishCandidates(order.wishTags, [chosen], order.request.ice).length > 0;
    const base = drinkOk ? chosen.recipe : (DRINKS_MAP[order.drinkId]?.recipe ?? order.request);
    return {
      target: { ...base, ice: order.request.ice, sugar: order.request.sugar, size: order.request.size },
      drinkOk,
      favorite: drinkOk && customer.taste.favorites.includes(chosen.id),
      wishMatched,
    };
  }
  return { target: order.request, drinkOk: chosen.id === order.drinkId, favorite: false, wishMatched: null };
}

// ───────────────────────────────────────── delivery

/** Everything on the packing shelf; note extras (napkin, card) join only when asked for. */
const SHELF = ['seal', 'straw', 'sleeve', 'guard', 'spoon'];

export function requiredPackaging(category: ProductCategory, extra?: string): string[] {
  const head = PACKAGING_BY_CATEGORY[category].filter((id) => id !== 'bag');
  return [...head, ...(extra ? [extra] : []), 'bag'];
}

export function packingShelf(required: string[]): string[] {
  const extras = required.filter((id) => id !== 'bag' && !SHELF.includes(id));
  return [...SHELF, ...extras, 'bag'];
}

export interface DeliveryPlan extends OrderPlan {
  note: DeliveryNote;
  packaging: string[];
}

export function planDelivery(day: number, customer: CustomerDef, unlocked: DrinkDef[], extraIds: string[]): DeliveryPlan {
  const drink = menuDrink(day, unlocked, extraIds, customer.taste);
  const request = menuRequest(drink, day, customer.taste);
  const required = PACKAGING_BY_CATEGORY[drink.category];
  const fitting = DELIVERY_NOTES.filter(
    (note) => !(note.ice && request.ice === 'hot') && !(note.extra && required.includes(note.extra)),
  );
  const note = pick(fitting.length ? fitting : DELIVERY_NOTES);
  if (note.ice) request.ice = note.ice;
  if (note.sugar) request.sugar = note.sugar;
  return {
    kind: 'menu',
    drinkId: drink.id,
    request,
    note,
    packaging: requiredPackaging(drink.category, note.extra),
  };
}
