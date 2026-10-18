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
  chat?: CustomerChat;
}

export interface CustomerChat {
  line: string;
  options: CustomerChatOption[];
}

export interface CustomerChatOption {
  label: string;
  reply: string;
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
  theme: DayTheme;
  unlockedDrinkIds: string[];
  newDrinkIds: string[];
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
  city: CitySave;
  travel: TravelSave;
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
}

export interface DeliveryInfo {
  address: string;
  distance: string;
  fee: number;
  note: string;
  packaging: string[];
}

export interface OrderState {
  id: string;
  customerId: string;
  drinkId: string;
  request: Recipe;
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
  wish?: string;
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
