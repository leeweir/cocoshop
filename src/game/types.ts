export type TeaBase = 'assam' | 'jasmine' | 'oolong' | 'matcha' | 'none';
export type MilkType = 'fresh' | 'coconut' | 'none';
export type FlavorType = 'peach' | 'strawberry' | 'brownsugar' | 'osmanthus' | 'none';
export type ToppingType = 'pearl' | 'jelly' | 'taro' | 'cheese' | 'none';
export type IceType = 'hot' | 'less' | 'normal';
export type SugarType = 'zero' | 'half' | 'full';
export type SizeType = 'medium' | 'large';

export type ProductCategory = 'tea' | 'milkshake' | 'icecream';
export type FinishMode = 'shake' | 'blend' | 'scoop';
export type OrderChannel = 'dine-in' | 'delivery';
export type DrinkSource = 'city' | 'travel';

export type CitySpotId = 'market' | 'bakery' | 'flower' | 'airclub' | 'home' | 'shop';
export type SupplyId = 'peach_crate' | 'jasmine_tin' | 'pearl_pouch' | 'sea_cream';

export interface CitySave {
  /** The upcoming day this evening belongs to; used to reset slots once. */
  evening: number;
  slotsLeft: number;
  supplies: SupplyId[];
  recipes: string[];
  stories: string[];
  usedSpots: string[];
  visits: number;
  plane: boolean;
  /** Chapter already paid for but not finished; survives a mid-trip reload. */
  traveling: string | null;
}

export interface TravelRecord {
  stars: number;
  day: number;
}

export interface TravelSave {
  chapters: Record<string, TravelRecord>;
}

export interface Recipe {
  tea: TeaBase;
  milk: MilkType;
  flavor: FlavorType;
  topping: ToppingType;
  ice: IceType;
  sugar: SugarType;
  size: SizeType;
}

export type Species = 'fox' | 'bear' | 'cat' | 'rabbit' | 'wolf' | 'dog';
export type HairStyle = 'bob' | 'twintails' | 'long' | 'short' | 'fluffy' | 'ponytail';
export type Accessory = 'star' | 'beret' | 'ribbon' | 'glasses' | 'scarf' | 'clip';

export type TasteTag =
  | 'fruity'
  | 'pink'
  | 'milky'
  | 'tea'
  | 'rich'
  | 'matcha'
  | 'floral'
  | 'chewy'
  | 'fresh'
  | 'creamy';

export interface CustomerTaste {
  /** Drink ids this guest gravitates to, most loved first. */
  favorites: string[];
  tags: TasteTag[];
  sugar: SugarType;
  /** 'hot' only ever applies to tea; other categories fall back to 'less'. */
  ice: IceType;
  size: SizeType;
}

export interface CustomerDef {
  id: string;
  name: string;
  latin: string;
  title: string;
  species: Species;
  hairStyle: HairStyle;
  accessory: Accessory;
  quote: string;
  lines: {
    perfect: string;
    good: string;
    bad: string;
    angry: string;
    leaving: string;
  };
  colors: {
    hair: string;
    hairShade: string;
    earInner: string;
    skin: string;
    coat: string;
    coatShade: string;
    accent: string;
    eyes: string;
  };
  minDay: number;
  vip?: boolean;
  taste: CustomerTaste;
  /** Tiered small talk, unlocked by rapport (0 / 2 / 4 / 7). */
  chats: CustomerChat[];
}

export interface CustomerChat {
  /** Stable id persisted in `SaveData.chatsSeen`, e.g. `momo-1`. */
  id: string;
  minRapport: number;
  line: string;
  options: CustomerChatOption[];
}

export interface CustomerChatOption {
  label: string;
  reply: string;
  /** Exactly one option per chat is the one this guest loves. */
  liked?: boolean;
}

export interface DrinkDef {
  id: string;
  name: string;
  latin: string;
  tagline: string;
  price: number;
  color: string;
  colorTop: string;
  accent: string;
  unlockDay: number;
  badge?: string;
  category: ProductCategory;
  finish: FinishMode;
  recipe: Recipe;
  source?: DrinkSource;
  tags: TasteTag[];
}

export interface DayTheme {
  id: 'noon' | 'dusk' | 'night' | 'morning' | 'candy';
  name: string;
  skyTop: string;
  skyBottom: string;
  glow: string;
  ambient: string;
  sun: string;
  fog: string;
  accent: string;
  hint: string;
}

export interface DayConfig {
  day: number;
  shiftSeconds: number;
  goal: number;
  spawnEvery: number;
  deliveryEvery: number;
  patience: number;
  vipChance: number;
  rushChance: number;
  /** Orders (dine-in + delivery) allowed in the shop at once. */
  maxOrders: number;
  theme: DayTheme;
  challenge: DailyChallenge;
  unlockedDrinkIds: string[];
  newDrinkIds: string[];
}

export type ChallengeKind = 'perfect' | 'combo' | 'delivery3' | 'noWalkout' | 'categories';

export interface DailyChallenge {
  kind: ChallengeKind;
  target: number;
  /** Full sentence for intro / summary, e.g. 「完美出杯 3 杯」. */
  label: string;
  /** Short HUD label, e.g. 「完美」. */
  short: string;
  reward: number;
}

export interface ChallengeProgress {
  challenge: DailyChallenge;
  value: number;
  done: boolean;
  /** noWalkout can be lost mid-day; other kinds only grow. */
  failed: boolean;
}

export type DecorSlot = 'counter' | 'wainscot' | 'curtain' | 'bunting' | 'rug';

export interface DecorSave {
  owned: string[];
  equipped: Record<DecorSlot, string>;
}

export interface LastOrder {
  drinkId: string;
  recipe: Recipe;
  day: number;
}

export interface UpgradeDef {
  id: UpgradeId;
  name: string;
  latin: string;
  description: string;
  flavor: string;
  maxLevel: number;
  costs: number[];
  accent: string;
}

export type UpgradeId = 'seat' | 'sign' | 'display' | 'training';

export interface SaveData {
  version: number;
  day: number;
  /** The shift just completed whose post-shift shop has not been left yet. */
  pendingShopDay?: number;
  /** Day whose shift was running when the page was last unloaded. */
  openShiftDay?: number;
  coins: number;
  totalCoinsEarned: number;
  bestRevenue: number;
  bestCombo: number;
  servedTotal: number;
  perfectTotal: number;
  upgrades: Record<UpgradeId, number>;
  metCustomers: string[];
  regulars: Record<string, number>;
  deliveryTotal: number;
  bestDeliveryRating: number;
  tutorialSeen: boolean;
  sound: boolean;
  /** Optional music-box loop; off unless the player turns it on. */
  music: boolean;
  city: CitySave;
  travel: TravelSave;
  /** Last perfectly served order per guest; drives 「老样子」 orders. */
  lastOrders: Record<string, LastOrder>;
  chatsSeen: string[];
  decor: DecorSave;
  challengesDone: number;
}

export interface PlayerState {
  day: number;
  coins: number;
  shiftLeft: number;
  revenue: number;
  servedToday: number;
  perfectToday: number;
  hearts: number;
  combo: number;
  maxComboToday: number;
  orders: OrderState[];
  completedOrders: CompletedOrder[];
  supplies: SupplyId[];
  /** Guests or riders who gave up waiting today. */
  walkouts: number;
  delivery3Today: number;
  /** Categories served with at least 5/7 matching today. */
  categoriesServed: ProductCategory[];
  challengeDone: boolean;
}

export interface DeliveryInfo {
  address: string;
  distance: string;
  fee: number;
  note: string;
  packaging: string[];
}

export type OrderKind = 'menu' | 'wish' | 'usual';

export interface OrderState {
  id: string;
  customerId: string;
  /**
   * Menu / usual: the drink that must be made. Wish: one valid candidate,
   * used as the comparison target if the player picks a drink that does not
   * fit the wish.
   */
  drinkId: string;
  request: Recipe;
  kind: OrderKind;
  /** Wish orders only: the two taste tags the guest asked for. */
  wishTags?: TasteTag[];
  patienceMax: number;
  patience: number;
  accepted: boolean;
  vip: boolean;
  rush: boolean;
  seat: number;
  channel: OrderChannel;
  delivery?: DeliveryInfo;
  talked: boolean;
  tipBonus: number;
  createdAt: number;
  status: 'waiting' | 'in-craft' | 'served' | 'left';
}

export interface CompletedOrder {
  id: string;
  customerId: string;
  drinkId: string;
  payout: number;
  matches: number;
  total: number;
  perfectShake: boolean;
}

export type CraftStep = 'assemble' | 'shake' | 'ready';

export interface CraftSelections {
  tea: TeaBase | null;
  milk: MilkType | null;
  flavor: FlavorType | null;
  topping: ToppingType | null;
  ice: IceType | null;
  sugar: SugarType | null;
  size: SizeType | null;
}

export interface ServeResult {
  order: OrderState;
  /** Drink the player actually chose in step 1. */
  chosenDrinkId: string;
  /** The 7-field target the cup was compared against. */
  target: Recipe;
  matches: number;
  total: number;
  matched: Record<keyof Recipe, boolean>;
  payout: number;
  tip: number;
  perfect: boolean;
  angry: boolean;
  shakeQuality: number;
  perfectShake: boolean;
  deliveryFee: number;
  deliveryRating: number;
  packagingScore: number;
  packagingTotal: number;
  /** Wrong items packed into a delivery bag. */
  packagingWrong: number;
  /** Menu / usual: chose the ordered drink. Wish: chosen drink has both wish tags. */
  drinkOk: boolean;
  /** Wish only: chosen drink is one of the guest's favorites. */
  favorite: boolean;
  /** Wish only: whether each requested tag is present on the chosen drink. */
  wishMatched: boolean[] | null;
  rapportGain: number;
}

export type ScreenId =
  | 'boot'
  | 'title'
  | 'dayIntro'
  | 'playing'
  | 'orderSlip'
  | 'chat'
  | 'craft'
  | 'notebook'
  | 'summary'
  | 'shop'
  | 'city'
  | 'travel'
  | 'pause'
  | 'help';
