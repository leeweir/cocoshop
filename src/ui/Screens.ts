import {
  CATEGORY_META,
  CUSTOMERS,
  CUSTOMERS_MAP,
  DRINKS,
  DRINKS_MAP,
  FINISH_META,
  FLAVORS,
  ICES,
  MILKS,
  PACKAGING_META,
  RECIPE_FIELDS,
  SIZES,
  SUGARS,
  TEAS,
  TOPPINGS,
  TUTORIAL_STEPS,
  UPGRADES,
  UPGRADE_EFFECTS,
  baseRecipeLineFor,
  categoryOf,
  recipeValueLabelFor,
  recipeValueMeta,
} from '../game/data';
import {
  CITY_EVENING_SLOTS,
  CITY_SPOTS,
  CITY_SUPPLY_LIMIT,
  TRAVEL_CHAPTERS,
  TRAVEL_COST_COINS,
  TRAVEL_COST_SLOTS,
  type SupplyDef,
  type TravelChapterDef,
} from '../game/expansion';
import type {
  CitySpotId,
  CraftSelections,
  CraftStep,
  CustomerDef,
  DayConfig,
  DayTheme,
  DrinkDef,
  FinishMode,
  OrderState,
  Recipe,
  SaveData,
  ServeResult,
  SupplyId,
  TravelRecord,
  UpgradeId,
} from '../game/types';
import type { BubbleAnchor } from '../scene/CafeScene';
import { icon, ingredientIcon } from './icons';
import { portraitImg } from './portrait';

export type NotebookTab = 'orders' | 'recipes' | 'regulars';

export interface UiActions {
  openDayIntro(): void;
  beginDay(): void;
  backToTitle(): void;
  openOrder(id: string): void;
  acceptOrder(id: string): void;
  startCraft(id: string): void;
  selectIngredient(key: keyof CraftSelections, value: string): void;
  clearSelections(): void;
  goShake(): void;
  tapShake(): void;
  finishShake(): void;
  serve(): void;
  closeOverlay(): void;
  openNotebook(): void;
  openPause(): void;
  resume(): void;
  goTitle(): void;
  resetSave(): void;
  openHelp(): void;
  closeHelp(): void;
  toggleSound(): void;
  nextFromSummary(): void;
  buyUpgrade(id: UpgradeId): void;
  nextDay(): void;
  skipTutorial(): void;
  toggleSign(): void;
  answerChat(index: number): void;
  finishChat(): void;
  packItem(id: string): void;
  openCity(): void;
  closeCity(): void;
  visitCitySpot(spot: CitySpotId): void;
  cityStoryChoice(index: number): void;
  cityBackToPanel(): void;
  buySupply(id: SupplyId): void;
  openTravel(): void;
  closeTravel(): void;
  startTravelChapter(id: string): void;
  resumeTravelChapter(): void;
  travelNext(): void;
  travelChoose(index: number): void;
  travelTimingTap(): void;
  travelQuizAnswer(index: number): void;
  travelQuizNext(): void;
  travelFinish(): void;
  travelBackToJournal(): void;
  travelRevisit(id: string): void;
}

export interface HudState {
  day: number;
  themeName: string;
  shiftLeft: number;
  revenue: number;
  goal: number;
  coins: number;
  hearts: number;
  combo: number;
  notebookCount: number;
  deliveryCount: number;
  signOpen: boolean;
  sound: boolean;
  coach: string | null;
}

export interface WorldOrderView {
  order: OrderState;
  customer: CustomerDef;
  drink: DrinkDef;
}

export interface ShakeView {
  taps: number;
  tapsNeeded: number;
  scores: number[];
  zone: number;
  quality: number;
  done: boolean;
  perfect: boolean;
  mode: FinishMode;
}

export interface PackagingItemView {
  id: string;
  label: string;
  sub: string;
  icon: string;
  color: string;
  packed: boolean;
}

export interface PackagingView {
  items: PackagingItemView[];
  allPacked: boolean;
}

export interface CraftView {
  order: OrderState;
  customer: CustomerDef;
  drink: DrinkDef;
  selections: CraftSelections;
  step: CraftStep;
  shake: ShakeView | null;
  packaging: PackagingView | null;
  recipes: DrinkDef[];
  tutorialHint: string | null;
}

export interface ChatView {
  order: OrderState;
  customer: CustomerDef;
  drink: DrinkDef;
  replyIndex: number | null;
}

export interface DeliveryRailView {
  order: OrderState;
  customer: CustomerDef;
  drink: DrinkDef;
}

export interface TitleView {
  save: SaveData;
  theme: DayTheme;
  menu: DrinkDef[];
}

export interface DayIntroView {
  config: DayConfig;
  coins: number;
  tutorialSeen: boolean;
  supplies: SupplyDef[];
  travelBonus: number;
}

export interface OrderSlipView {
  order: OrderState;
  customer: CustomerDef;
  drink: DrinkDef;
  recipes: DrinkDef[];
  tutorial: boolean;
}

export interface NotebookOrderView {
  order: OrderState;
  customer: CustomerDef;
  drink: DrinkDef;
}

export interface NotebookView {
  day: number;
  themeName: string;
  orders: NotebookOrderView[];
  met: CustomerDef[];
  regulars: Record<string, number>;
  unlocked: DrinkDef[];
  totalServed: number;
}

export interface ServeView {
  result: ServeResult;
  order: OrderState;
  customer: CustomerDef;
  drink: DrinkDef;
  made: Recipe;
  quote: string;
  coins: number;
  combo: number;
  hearts: number;
  expression: 'happy' | 'smile' | 'sad';
}

export interface SummaryView {
  day: number;
  theme: DayTheme;
  revenue: number;
  goal: number;
  served: number;
  perfect: number;
  maxCombo: number;
  hearts: number;
  bonus: number;
  coins: number;
  grade: number;
  goalMet: boolean;
  reason: 'time' | 'hearts';
}

export interface ShopView {
  day: number;
  coins: number;
  upgrades: Record<UpgradeId, number>;
  nextTheme: DayTheme;
  nextGoal: number;
  nextShift: number;
  nextNewDrinks: DrinkDef[];
  servedTotal: number;
  supplies: SupplyDef[];
  limited: DrinkDef[];
  city: {
    slotsLeft: number;
    plane: boolean;
    visits: number;
    travelDone: number;
    travelBonus: number;
  };
}

export interface PauseView {
  day: number;
  revenue: number;
  goal: number;
  hearts: number;
  sound: boolean;
  supplies: SupplyDef[];
  travelBonus: number;
}

export interface CitySupplyView {
  def: SupplyDef;
  count: number;
  canBuy: boolean;
}

export interface CityStoryChoiceView {
  label: string;
  reply: string | null;
}

export interface CityStoryView {
  id: string;
  kicker: string;
  title: string;
  text: string;
  choices: CityStoryChoiceView[];
  replyIndex: number | null;
  rewardLines: string[];
  repeat: boolean;
  planeUnlocked: boolean;
  recipe: DrinkDef | null;
}

export interface CityView {
  day: number;
  coins: number;
  slotsLeft: number;
  supplies: SupplyDef[];
  recipes: DrinkDef[];
  plane: boolean;
  visits: number;
  activeSpot: CitySpotId | null;
  usedSpots: CitySpotId[];
  market: CitySupplyView[];
  story: CityStoryView | null;
  travelDone: number;
  travelBonus: number;
}

export interface TravelChapterCardView {
  def: TravelChapterDef;
  unlocked: boolean;
  record: TravelRecord | null;
}

export interface TravelView {
  coins: number;
  slotsLeft: number;
  chapters: TravelChapterCardView[];
  completed: number;
  bonus: number;
  plane: boolean;
  interrupted: TravelChapterDef | null;
}

export interface TravelMiniView {
  mode: 'timing' | 'quiz';
  taps: number;
  tapsNeeded: number;
  scores: number[];
  zone: number;
  done: boolean;
  stars: number;
  unit: string;
  quizIndex: number;
  quizTotal: number;
  quizCorrect: number;
  quizAnswered: number | null;
  quizDone: boolean;
}

export interface TravelSessionView {
  chapter: TravelChapterDef;
  phase: 'scene' | 'choice' | 'mini' | 'result';
  beat: number;
  replyIndex: number | null;
  reply: string | null;
  mini: TravelMiniView | null;
  stars: number;
  earned: number;
  bonus: number;
  revisit: boolean;
}

export interface HelpView {
  fromTitle: boolean;
}

const SELECTION_GROUPS: {
  key: keyof CraftSelections;
  label: string;
  latin: string;
  options: typeof TEAS;
}[] = [
  { key: 'tea', label: '茶底', latin: 'TEA BASE', options: TEAS },
  { key: 'milk', label: '奶', latin: 'MILK', options: MILKS },
  { key: 'flavor', label: '风味', latin: 'FLAVOR', options: FLAVORS },
  { key: 'topping', label: '小料', latin: 'TOPPING', options: TOPPINGS },
  { key: 'ice', label: '冰量', latin: 'ICE', options: ICES },
  { key: 'sugar', label: '糖度', latin: 'SUGAR', options: SUGARS },
  { key: 'size', label: '杯型', latin: 'SIZE', options: SIZES },
];

const UPGRADE_ICONS: Record<UpgradeId, string> = {
  seat: 'seat',
  sign: 'signupgrade',
  display: 'cake',
  training: 'shakeClass',
};

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function formatClock(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  return `${pad2(Math.floor(s / 60))}:${pad2(s % 60)}`;
}

function heartsHtml(count: number): string {
  return Array.from({ length: 3 }, (_, i) =>
    `<span class="heart ${i < count ? 'is-full' : 'is-empty'}">${icon('heart')}</span>`,
  ).join('');
}

function starRow(score: number, size = ''): string {
  const filled = Math.max(0, Math.min(3, Math.round(score * 3)));
  return Array.from({ length: 3 }, (_, i) =>
    `<span class="star ${i < filled ? 'is-on' : 'is-off'} ${size}">${icon('star')}</span>`,
  ).join('');
}

function miniCup(drink: DrinkDef, extra = ''): string {
  const cat = categoryOf(drink);
  return `<span class="mini-cup cat-${cat} ${extra}" style="--drink:${drink.color};--drink-top:${drink.colorTop};--accent:${drink.accent}">
    <i class="mini-straw"></i><i class="mini-lid"></i>
    <i class="mini-body"><i class="mini-fill"></i><i class="mini-pearls"></i></i>
    <i class="mini-sleeve">桃</i>
    <i class="mini-cat-deco"></i>
  </span>`;
}

function reqChips(request: Recipe, category: DrinkDef['category'] = 'tea'): string {
  const keys = ['ice', 'sugar', 'size', 'topping'] as const;
  return keys
    .map((key) => {
      const meta = recipeValueMeta(key, request[key]);
      const label = recipeValueLabelFor(category, key, request[key]);
      return `<span class="req-chip" style="--chip:${meta.color}" title="${label}">${ingredientIcon(meta.icon)}<b>${label}</b></span>`;
    })
    .join('');
}

function baseChips(drink: DrinkDef): string {
  const cat = categoryOf(drink);
  const keys = (cat === 'icecream' ? ['flavor', 'milk', 'topping'] : ['tea', 'milk', 'flavor']) as (keyof Recipe)[];
  return keys
    .map((key) => {
      const meta = recipeValueMeta(key, drink.recipe[key]);
      return `<span class="base-chip" style="--chip:${meta.color}">${ingredientIcon(meta.icon)}${meta.label}</span>`;
    })
    .join('');
}

function catBadge(drink: DrinkDef, extra = ''): string {
  const meta = CATEGORY_META[categoryOf(drink)];
  return `<span class="cat-badge ${extra}" style="--cat:${meta.color}">${icon(meta.icon)}${meta.label}</span>`;
}

function selectionRecipe(view: CraftView): { key: keyof Recipe; label: string; value: string }[] {
  return RECIPE_FIELDS.flatMap((field) => {
    const value = view.selections[field.key];
    if (!value) return [];
    return [{ key: field.key, label: field.label, value }];
  });
}

function badges(order: OrderState): string {
  return [
    order.channel === 'delivery' ? `<span class="badge badge-delivery">${icon('delivery')} 外卖</span>` : '',
    order.vip ? `<span class="badge badge-vip">${icon('crown')} 贵宾</span>` : '',
    order.rush ? `<span class="badge badge-rush">${icon('bolt')} 加急</span>` : '',
    order.wish ? `<span class="badge badge-wish">${icon('heartWish')} 常客心愿</span>` : '',
  ].join('');
}

function orderPlace(order: OrderState): string {
  if (order.channel === 'delivery') return order.delivery?.address ?? '外卖订单';
  return `第 ${order.seat + 1} 桌`;
}

function finishUnit(mode: FinishMode): string {
  if (mode === 'blend') return '次';
  if (mode === 'scoop') return '球';
  return '下';
}

function finishDoneLine(drink: DrinkDef, perfect: boolean): string {
  if (drink.finish === 'blend') return perfect ? '奶昔绵密，完美！' : '搅拌完成，出杯吧';
  if (drink.finish === 'scoop') return perfect ? '圆滚滚，完美！' : '堆球完成，出杯吧';
  return perfect ? '云朵奶泡，完美！' : '手摇完成，出杯吧';
}

function finishTitle(drink: DrinkDef): string {
  if (drink.finish === 'blend') return '握住搅拌杯，把奶昔打绵';
  if (drink.finish === 'scoop') return '一球一球，堆成小小的山';
  return '跟着节拍，摇出云朵奶泡';
}

function readyTitle(drink: DrinkDef, delivery: boolean): string {
  if (delivery) return '把这份小心愿，稳稳打包好';
  if (drink.finish === 'blend') return '奶油云朵已经挤好啦';
  if (drink.finish === 'scoop') return '最后一球，稳稳落下';
  return '最后一颗珍珠也落好了';
}

function packagingMarkup(view: CraftView): string {
  const pack = view.packaging;
  if (!pack) return '';
  const done = pack.items.filter((item) => item.packed).length;
  return `
    <div class="pack-checklist" data-pack-checklist>
      <div class="pack-head">
        <div><span>${icon('delivery')} 外卖打包</span><b data-pack-progress>${done} / ${pack.items.length}</b></div>
        <small>骑手在等，逐项点名装好再交给他。</small>
      </div>
      <div class="pack-items">
        ${pack.items
          .map(
            (item) => `<button type="button" class="pack-item ${item.packed ? 'is-packed' : ''}" data-action="packItem" data-id="${item.id}" data-pack-item="${item.id}" style="--pack:${item.color}" aria-pressed="${item.packed}">
              <span class="pack-check">${icon(item.packed ? 'check' : item.icon)}</span>
              <span class="pack-copy"><b>${item.label}</b><small>${item.packed ? '装好了' : item.sub}</small></span>
            </button>`,
          )
          .join('')}
      </div>
    </div>
  `;
}

function chatRapport(rapport: number): string {
  return `<span class="rapport-hearts">${Array.from({ length: 3 }, (_, i) => `<i class="${i < Math.min(3, rapport) ? 'is-on' : ''}">${icon('heart')}</i>`).join('')}</span>`;
}

function scoreWord(score: number): string {
  if (score >= 0.86) return '完美';
  if (score >= 0.62) return '不错';
  return '偏了';
}

function gradeHeadline(grade: number, reason: 'time' | 'hearts'): string {
  if (reason === 'hearts') return '客人们先回去了，今天提前打烊。';
  if (grade >= 3) return '蜜桃味的完美一天，连灯牌都在发光。';
  if (grade === 2) return '稳稳当当，甜度和火候都刚刚好。';
  if (grade === 1) return '有点手忙脚乱，不过茶还是温热的。';
  return '今天也辛苦了，明天再慢慢摇一杯。';
}

function cupDoodle(caption: string): string {
  return `
    <svg viewBox="0 0 168 168" fill="none" aria-hidden="true">
      <circle cx="84" cy="88" r="62" stroke="#f0c7d2" stroke-width="1.6" stroke-dasharray="2 8" stroke-linecap="round" />
      <path d="M73 54c-5-8 5-12 0-21M91 52c-5-8 5-12 0-20" stroke="#c7eadf" stroke-width="4" stroke-linecap="round" />
      <path d="M96 52 106 24" stroke="#8fd9c1" stroke-width="7" stroke-linecap="round" />
      <path d="M56 58h56l-5.5 62a13 13 0 0 1-13 12H74.5a13 13 0 0 1-13-12L56 58Z" fill="#fff8f1" stroke="#eec3cd" stroke-width="2.4" />
      <path d="M60 82h48l-4.2 38a12 12 0 0 1-12 11H76.2a12 12 0 0 1-12-11L60 82Z" fill="#ffd7e2" />
      <rect x="50" y="48" width="68" height="13" rx="6.5" fill="#fff3e6" stroke="#eec3cd" stroke-width="2.4" />
      <path d="M83 48h4" stroke="#f3bccb" stroke-width="4" stroke-linecap="round" />
      <circle cx="74" cy="116" r="4.6" fill="#6b4437" />
      <circle cx="88" cy="123" r="4.2" fill="#6b4437" />
      <circle cx="98" cy="113" r="4" fill="#6b4437" />
      <circle cx="81" cy="131" r="3.6" fill="#6b4437" />
      <path d="M41 36c-8-9-6-20 4-25 3 11 1 19-4 25Z" fill="#b8e7d5" />
      <path d="M41 36c-1 6-4 10-9 13" stroke="#b8e7d5" stroke-width="3" stroke-linecap="round" />
      <path d="M130 68l2.3 5.7L138 76l-5.7 2.3L130 84l-2.3-5.7L122 76l5.7-2.3L130 68Z" fill="#f6d48f" />
      <path d="M38 98l1.6 3.9 3.9 1.6-3.9 1.6L38 109l-1.6-3.9-3.9-1.6 3.9-1.6L38 98Z" fill="#f6d48f" opacity=".8" />
    </svg>
    <span>${caption}</span>
  `;
}

const CITY_MAP: Record<CitySpotId, { x: number; y: number }> = {
  shop: { x: 15, y: 76 },
  market: { x: 35, y: 42 },
  bakery: { x: 57, y: 27 },
  flower: { x: 78, y: 42 },
  airclub: { x: 88, y: 74 },
  home: { x: 41, y: 88 },
};

const CITY_SHORT: Record<CitySpotId, string> = {
  shop: '桃桃茶屋',
  market: '原料市场',
  bakery: '栗子面包房',
  flower: '蓝莓花店',
  airclub: '航空俱乐部',
  home: '家',
};

function citySlotsHtml(slotsLeft: number): string {
  return `<span class="city-slots" aria-label="还剩 ${slotsLeft} 段傍晚时光">${Array.from(
    { length: CITY_EVENING_SLOTS },
    (_, i) => `<i class="${i < slotsLeft ? 'is-on' : ''}">${icon('moon')}</i>`,
  ).join('')}</span>`;
}

function supplyChips(supplies: SupplyDef[], empty = '还没有准备明日特供'): string {
  if (supplies.length === 0) return `<span class="supply-empty">${empty}</span>`;
  return supplies
    .map(
      (supply) => `<span class="supply-chip" style="--supply:${supply.color}">
        ${icon(supply.icon)}<b>${supply.name}</b><small>${supply.shortLabel}</small>
      </span>`,
    )
    .join('');
}

function travelStars(stars: number): string {
  return starRow(Math.max(0, Math.min(3, stars)) / 3);
}

export class Screens {
  private actions: UiActions;
  private screenRoot: HTMLElement;
  private hudRoot: HTMLElement;
  private worldRoot: HTMLElement;
  private toastRoot: HTMLElement;
  private flashLayer: HTMLElement;

  private bubbles = new Map<string, { el: HTMLButtonElement; signature: string }>();
  private deliveryCards = new Map<string, { el: HTMLElement; signature: string }>();
  private deliveryRoot: HTMLElement;
  private hudCache: Record<string, string> = {};
  private currentCraft: CraftView | null = null;
  private shakePointer: HTMLElement | null = null;
  private shakeZone = 0.11;
  private travelPointer: HTMLElement | null = null;
  private notebookData: NotebookView | null = null;
  private notebookTab: NotebookTab = 'orders';
  private soundEnabled = true;
  private coachText: string | null = null;
  private overlayFocus: HTMLElement | null = null;
  private dialogObserver: MutationObserver | null = null;
  private focusRaf = 0;

  constructor(actions: UiActions) {
    this.actions = actions;
    const screen = document.getElementById('screen-root');
    const hud = document.getElementById('hud');
    const world = document.getElementById('world-ui');
    const toast = document.getElementById('toast-root');
    const flash = document.getElementById('flash');
    if (!screen || !hud || !world || !toast || !flash) {
      throw new Error('UI roots are missing');
    }
    this.screenRoot = screen;
    this.hudRoot = hud;
    this.worldRoot = world;
    this.toastRoot = toast;
    this.flashLayer = flash;
    this.deliveryRoot = document.createElement('div');
    this.deliveryRoot.className = 'delivery-root is-hidden';
    this.worldRoot.appendChild(this.deliveryRoot);
    this.buildHud();
    this.bindEvents();
    document.addEventListener('keydown', this.onFocusKeyDown);
    this.dialogObserver = new MutationObserver(() => this.queueDialogFocus());
    this.dialogObserver.observe(this.screenRoot, { childList: true, subtree: true });
  }

  dispose() {
    this.dialogObserver?.disconnect();
    this.dialogObserver = null;
    cancelAnimationFrame(this.focusRaf);
    this.focusRaf = 0;
    this.screenRoot.removeEventListener('click', this.onClickRoot);
    this.hudRoot.removeEventListener('click', this.onClickRoot);
    this.worldRoot.removeEventListener('click', this.onClickRoot);
    this.screenRoot.removeEventListener('pointerdown', this.onPointerDownRoot);
    document.removeEventListener('keydown', this.onFocusKeyDown);
    this.deliveryRoot.remove();
    for (const entry of this.bubbles.values()) entry.el.remove();
    this.bubbles.clear();
    this.deliveryCards.clear();
  }

  // ───────────────────────────────────────── persistent HUD

  private buildHud() {
    this.hudRoot.innerHTML = `
      <div class="hud-bar">
        <div class="hud-island hud-brand">
          <span class="brand-mark">${icon('peach')}</span>
          <span class="brand-mini-text">
            <b>桃桃茶屋</b>
            <small><span data-hud="day">DAY 01</span><i></i><span data-hud="theme">粉桃午后</span></small>
          </span>
        </div>
        <div class="hud-center">
          <button type="button" class="sign-pill is-open" data-action="toggleSign" data-hud="sign-pill" aria-label="翻动营业牌">
            <span class="sign-lamp"></span>
            <span class="sign-copy"><small>门边小牌</small><b data-hud="sign">营业中</b></span>
            <span class="sign-delivery is-hidden" data-hud="delivery-count"></span>
          </button>
          <div class="shift-pill">
            <span class="shift-icon">${icon('clock')}</span>
            <span class="shift-copy"><small>营业剩余</small><b data-hud="time">02:35</b></span>
          </div>
          <div class="goal-board">
            <div class="goal-line">
              <span>今日营收</span>
              <b data-hud="revenue">¥0</b>
              <span class="goal-target" data-hud="goal">/ ¥90</span>
            </div>
            <div class="goal-track"><span data-hud="fill"></span><i class="goal-spark">${icon('sparkle')}</i></div>
          </div>
        </div>
        <div class="hud-actions">
          <div class="hud-pill coin-pill">${icon('coin')}<b data-hud="coins">0</b></div>
          <div class="hud-pill heart-pill" data-hud="hearts">${heartsHtml(3)}</div>
          <button type="button" class="icon-btn hud-icon notebook-btn" data-action="openNotebook" aria-label="打开点单小本子">
            ${icon('notebook')}<span class="notebook-badge" data-hud="notebook">0</span>
          </button>
          <button type="button" class="icon-btn hud-icon sound-toggle" data-action="toggleSound" data-sound-icon aria-label="切换音效">
            ${icon('sound')}
          </button>
          <button type="button" class="icon-btn hud-icon" data-action="openPause" aria-label="暂停营业">
            ${icon('pause')}
          </button>
        </div>
      </div>
      <div class="combo-pill" data-hud="combo">
        <span class="combo-spark">${icon('sparkle')}</span>
        <b data-hud="combo-value">x2</b>
        <span>完美连击</span>
      </div>
      <div class="coach-bar" data-hud="coach">
        <span class="coach-icon">${icon('sparkle')}</span>
        <span class="coach-text" data-hud="coach-text"></span>
        <button type="button" class="coach-skip" data-action="skipTutorial">跳过引导</button>
      </div>
    `;
    this.hudRoot.classList.add('is-hidden');
    this.worldRoot.classList.add('is-hidden');
  }

  setSoundIcon(): void {
    this.applySound(this.soundEnabled);
  }

  setSound(enabled: boolean): void {
    this.soundEnabled = enabled;
    this.applySound(enabled);
  }

  private applySound(enabled: boolean) {
    this.hudRoot.querySelectorAll<HTMLElement>('[data-sound-icon]').forEach((el) => {
      el.innerHTML = icon(enabled ? 'sound' : 'soundOff');
    });
    this.screenRoot.querySelectorAll<HTMLElement>('[data-sound-label]').forEach((el) => {
      el.textContent = enabled ? '音效：开' : '音效：关';
    });
  }

  showHud(state: HudState) {
    this.hudRoot.classList.remove('is-hidden');
    this.hudCache = {};
    this.updateHud(state);
  }

  hideHud() {
    this.hudRoot.classList.add('is-hidden');
  }

  updateHud(state: HudState) {
    const day = `DAY ${pad2(state.day)}`;
    if (this.hudCache.day !== day) {
      this.setText('[data-hud="day"]', day);
      this.hudCache.day = day;
    }
    if (this.hudCache.theme !== state.themeName) {
      this.setText('[data-hud="theme"]', state.themeName);
      this.hudCache.theme = state.themeName;
    }
    const clock = formatClock(state.shiftLeft);
    if (this.hudCache.time !== clock) {
      this.setText('[data-hud="time"]', clock);
      this.hudCache.time = clock;
      this.hudRoot.classList.toggle('is-closing', state.shiftLeft <= 20);
    }
    const revenue = Math.round(state.revenue);
    if (this.hudCache.revenue !== String(revenue)) {
      this.setText('[data-hud="revenue"]', `¥${revenue}`);
      this.hudCache.revenue = String(revenue);
    }
    const goal = `/ ¥${state.goal}`;
    if (this.hudCache.goal !== goal) {
      this.setText('[data-hud="goal"]', goal);
      this.hudCache.goal = goal;
    }
    const pct = Math.min(100, Math.round((state.revenue / Math.max(1, state.goal)) * 100));
    if (this.hudCache.fill !== String(pct)) {
      const fill = this.hudRoot.querySelector<HTMLElement>('[data-hud="fill"]');
      if (fill) fill.style.width = `${pct}%`;
      const board = this.hudRoot.querySelector('.goal-board');
      board?.classList.toggle('is-met', state.revenue >= state.goal);
      this.hudCache.fill = String(pct);
    }
    if (this.hudCache.coins !== String(state.coins)) {
      this.setText('[data-hud="coins"]', String(state.coins));
      this.hudCache.coins = String(state.coins);
    }
    if (this.hudCache.hearts !== String(state.hearts)) {
      const wrap = this.hudRoot.querySelector<HTMLElement>('[data-hud="hearts"]');
      if (wrap) wrap.innerHTML = heartsHtml(state.hearts);
      this.hudCache.hearts = String(state.hearts);
    }
    const notebook = String(state.notebookCount);
    if (this.hudCache.notebook !== notebook) {
      this.setText('[data-hud="notebook"]', notebook);
      const btn = this.hudRoot.querySelector('.notebook-btn');
      btn?.classList.toggle('has-orders', state.notebookCount > 0);
      this.hudCache.notebook = notebook;
    }
    if (this.hudCache.sign !== String(state.signOpen)) {
      this.setText('[data-hud="sign"]', state.signOpen ? '营业中' : '休息中');
      const pill = this.hudRoot.querySelector<HTMLElement>('[data-hud="sign-pill"]');
      pill?.classList.toggle('is-open', state.signOpen);
      pill?.classList.toggle('is-closed', !state.signOpen);
      pill?.setAttribute('aria-label', state.signOpen ? '翻成休息中，暂时不接新客' : '翻成营业中，继续接单');
      this.hudCache.sign = String(state.signOpen);
    }
    if (this.hudCache.delivery !== String(state.deliveryCount)) {
      const chip = this.hudRoot.querySelector<HTMLElement>('[data-hud="delivery-count"]');
      if (chip) {
        chip.classList.toggle('is-hidden', state.deliveryCount <= 0);
        chip.textContent = state.deliveryCount > 0 ? `外卖 ${state.deliveryCount}` : '';
      }
      this.hudCache.delivery = String(state.deliveryCount);
    }
    if (this.hudCache.combo !== String(state.combo)) {
      const pill = this.hudRoot.querySelector<HTMLElement>('[data-hud="combo"]');
      this.setText('[data-hud="combo-value"]', `x${Math.max(1, state.combo)}`);
      if (pill) {
        pill.classList.toggle('is-visible', state.combo >= 2);
        pill.classList.toggle('is-hot', state.combo >= 4);
        if (state.combo >= 2) {
          pill.classList.remove('is-bump');
          void pill.offsetWidth;
          pill.classList.add('is-bump');
        }
      }
      this.hudCache.combo = String(state.combo);
    }
    if (this.hudCache.sound !== String(state.sound)) {
      this.setSound(state.sound);
      this.hudCache.sound = String(state.sound);
    }
    this.setCoach(state.coach);
  }

  private setText(selector: string, value: string) {
    this.hudRoot.querySelectorAll<HTMLElement>(selector).forEach((el) => {
      el.textContent = value;
    });
  }

  setCoach(text: string | null) {
    if (this.coachText === text) return;
    this.coachText = text;
    const bar = this.hudRoot.querySelector<HTMLElement>('[data-hud="coach"]');
    if (!bar) return;
    bar.classList.toggle('is-visible', !!text);
    if (text) {
      const el = bar.querySelector<HTMLElement>('[data-hud="coach-text"]');
      if (el) el.textContent = text;
    }
  }

  setOverlayActive(active: boolean) {
    this.hudRoot.classList.toggle('is-dimmed', active);
    this.worldRoot.classList.toggle('is-hidden', active);
    if (active) {
      const current = document.activeElement;
      this.overlayFocus = current instanceof HTMLElement && current !== document.body ? current : null;
    } else {
      const restore = this.overlayFocus;
      this.overlayFocus = null;
      if (restore?.isConnected) restore.focus({ preventScroll: true });
    }
  }

  hurtHud() {
    this.hudRoot.classList.remove('is-hurt');
    void this.hudRoot.offsetWidth;
    this.hudRoot.classList.add('is-hurt');
    window.setTimeout(() => this.hudRoot.classList.remove('is-hurt'), 700);
  }

  // ───────────────────────────────────────── world bubbles

  updateWorld(orders: WorldOrderView[], anchors: BubbleAnchor[], active: boolean) {
    this.worldRoot.classList.toggle('is-hidden', !active);
    if (!active) {
      for (const entry of this.bubbles.values()) entry.el.classList.remove('is-visible');
      return;
    }
    const narrow = window.innerWidth <= 600;
    // On desktop the delivery rail docks on the left; keep tickets clear of it.
    let railRight = 0;
    if (!narrow && !this.deliveryRoot.classList.contains('is-hidden')) {
      const rail = this.deliveryRoot.getBoundingClientRect();
      if (rail.width > 0 && rail.left < window.innerWidth / 2) railRight = rail.right + 12;
    }
    const anchorMap = new Map(anchors.map((a) => [a.orderId, a]));
    const live = new Set<string>();

    for (const view of orders) {
      const anchor = anchorMap.get(view.order.id);
      if (!anchor) continue;
      live.add(view.order.id);
      let entry = this.bubbles.get(view.order.id);
      if (!entry) {
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'order-bubble';
        el.dataset.action = 'openOrder';
        el.dataset.id = view.order.id;
        this.worldRoot.appendChild(el);
        entry = { el, signature: '' };
        this.bubbles.set(view.order.id, entry);
      }
      const signature = `${view.order.accepted ? 'a' : 'n'}|${view.order.vip}|${view.order.rush}|${view.order.drinkId}|${view.order.request.ice}|${view.order.request.sugar}|${view.order.request.size}|${view.order.request.topping}`;
      if (entry.signature !== signature) {
        entry.el.innerHTML = this.bubbleMarkup(view);
        entry.signature = signature;
        entry.el.classList.toggle('is-accepted', view.order.accepted);
        entry.el.classList.toggle('is-vip', view.order.vip);
        entry.el.classList.toggle('is-rush', view.order.rush);
      }

      const ratio = Math.max(0, Math.min(1, view.order.patience / Math.max(1, view.order.patienceMax)));
      if (view.order.accepted) {
        const fill = entry.el.querySelector<HTMLElement>('.patience-fill');
        if (fill) fill.style.width = `${ratio * 100}%`;
      }
      const time = entry.el.querySelector<HTMLElement>('.patience-time');
      if (time) time.textContent = `${Math.ceil(view.order.patience)}s`;
      entry.el.classList.toggle('is-urgent', ratio < 0.3);

      // On phones three bubbles would sit shoulder to shoulder and cover the
      // guests, so stagger alternating tickets upward.
      const stagger = narrow ? (orders.indexOf(view) % 2) * -78 : 0;
      const halfWidth = entry.el.offsetWidth / 2;
      const x = narrow
        ? Math.max(64, Math.min(window.innerWidth - 64, anchor.x))
        : Math.max(railRight + halfWidth, anchor.x);
      entry.el.style.transform = `translate(${x}px, ${anchor.y + stagger}px) translate(-50%, calc(-100% - 12px))`;
      entry.el.classList.toggle('is-visible', anchor.visible);
      entry.el.setAttribute(
        'aria-label',
        view.order.accepted
          ? `${view.customer.name}的订单，剩余耐心 ${Math.ceil(view.order.patience)} 秒`
          : `${view.customer.name}在等你点单，还剩 ${Math.ceil(view.order.patience)} 秒`,
      );
    }

    for (const [id, entry] of this.bubbles) {
      if (!live.has(id)) {
        entry.el.remove();
        this.bubbles.delete(id);
      }
    }
  }

  private bubbleMarkup(view: WorldOrderView): string {
    const { order, customer, drink } = view;
    if (order.accepted) {
      return `
        <span class="bubble-inner accepted-inner">
          <span class="bubble-tail"></span>
          <span class="accepted-top">
            <span class="accepted-dot"></span>
            <b>已记在小本子</b>
            <span class="patience-time">${Math.ceil(order.patience)}s</span>
          </span>
          <span class="patience-track"><span class="patience-fill"></span></span>
          <span class="bubble-cta">${icon('shaker')} 继续调制</span>
        </span>
      `;
    }
    return `
      <span class="bubble-inner">
        <span class="bubble-tail"></span>
        <span class="bubble-top">
          ${miniCup(drink, 'bubble-cup')}
          <span class="bubble-name">${customer.name}${order.vip ? `<em>${icon('crown')}</em>` : ''}</span>
          ${order.rush ? `<span class="bubble-rush">${icon('bolt')} 加急</span>` : ''}
          <span class="bubble-wait">${icon('clock')}<span class="patience-time">${Math.ceil(order.patience)}s</span></span>
        </span>
        <span class="bubble-hint">“${drink.tagline}”</span>
        <span class="bubble-chips">${reqChips(order.request, categoryOf(drink))}</span>
        <span class="bubble-cta">${icon('bubble')} 点开点单</span>
      </span>
    `;
  }

  // ───────────────────────────────────────── delivery rail

  updateDelivery(views: DeliveryRailView[], active: boolean) {
    if (!active || views.length === 0) {
      this.deliveryRoot.classList.add('is-hidden');
      if (!active) return;
    } else {
      this.deliveryRoot.classList.remove('is-hidden');
    }
    this.ensureDeliveryShell();
    const list = this.deliveryRoot.querySelector<HTMLElement>('[data-delivery-list]');
    if (!list) return;
    const live = new Set<string>();
    for (const view of views) {
      const { order, customer, drink } = view;
      live.add(order.id);
      let entry = this.deliveryCards.get(order.id);
      if (!entry) {
        const el = document.createElement('article');
        list.appendChild(el);
        entry = { el, signature: '' };
        this.deliveryCards.set(order.id, entry);
      }
      const signature = `${order.accepted ? 'a' : 'n'}|${order.drinkId}|${order.delivery?.address ?? ''}|${order.delivery?.fee ?? 0}|${order.delivery?.note ?? ''}`;
      if (entry.signature !== signature) {
        entry.el.className = `delivery-card ${order.accepted ? 'is-accepted' : 'is-new'}`;
        entry.el.innerHTML = this.deliveryCardMarkup(view);
        entry.signature = signature;
      }
      const ratio = Math.max(0, Math.min(1, order.patience / Math.max(1, order.patienceMax)));
      const time = entry.el.querySelector<HTMLElement>('[data-delivery-time]');
      if (time) time.textContent = `${Math.ceil(order.patience)}s`;
      const fill = entry.el.querySelector<HTMLElement>('[data-delivery-fill]');
      if (fill) fill.style.width = `${ratio * 100}%`;
      entry.el.classList.toggle('is-urgent', ratio < 0.28);
      entry.el.setAttribute(
        'aria-label',
        `${customer.name}的外卖，${order.delivery?.address ?? ''}，剩余 ${Math.ceil(order.patience)} 秒`,
      );
    }
    for (const [id, entry] of this.deliveryCards) {
      if (!live.has(id)) {
        entry.el.remove();
        this.deliveryCards.delete(id);
      }
    }
    const count = this.deliveryRoot.querySelector<HTMLElement>('[data-delivery-rail-count]');
    if (count) count.textContent = String(views.length);
  }

  private ensureDeliveryShell() {
    if (this.deliveryRoot.querySelector('[data-delivery-list]')) return;
    this.deliveryRoot.innerHTML = `
      <header class="delivery-rail-head">
        <span class="delivery-rail-icon">${icon('delivery')}</span>
        <div><b>外卖台</b><small>DELIVERY PICKUP</small></div>
        <span class="delivery-rail-count" data-delivery-rail-count>0</span>
      </header>
      <div class="delivery-list" data-delivery-list></div>
      <p class="delivery-rail-foot">${icon('clock')} 耐心一直在倒数，接单能多 3 秒，尽快交给骑手</p>
    `;
  }

  private deliveryCardMarkup(view: DeliveryRailView): string {
    const { order, customer, drink } = view;
    const info = order.delivery;
    const cat = categoryOf(drink);
    return `
      <div class="delivery-card-top">
        <span class="delivery-address">${icon('location')} ${info?.address ?? '街角'} <small>${info?.distance ?? ''}</small></span>
        <span class="delivery-time" data-delivery-time>${Math.ceil(order.patience)}s</span>
      </div>
      <div class="delivery-card-body">
        ${miniCup(drink, 'delivery-cup')}
        <div class="delivery-copy">
          <b>${drink.name}</b>
          <small>${customer.name} · ${CATEGORY_META[cat].label} · ${info?.packaging.length ?? 0} 件打包</small>
          <p>“${info?.note ?? drink.tagline}”</p>
        </div>
        <em class="delivery-fee">${icon('coin')}¥${info?.fee ?? 0}</em>
      </div>
      <div class="delivery-track"><span data-delivery-fill style="width:${Math.max(0, Math.min(100, (order.patience / Math.max(1, order.patienceMax)) * 100))}%"></span></div>
      <button type="button" class="delivery-cta" data-action="${order.accepted ? 'startCraft' : 'openOrder'}" data-id="${order.id}">
        ${order.accepted ? `${icon('shaker')} 去调制` : `${icon('bubble')} 看外卖便签`}
      </button>
    `;
  }

  // ───────────────────────────────────────── screens

  clearScreen() {
    this.screenRoot.innerHTML = '';
    this.currentCraft = null;
    this.shakePointer = null;
    this.notebookData = null;
  }

  showTitle(view: TitleView) {
    const { save, theme, menu } = view;
    const hasProgress = save.day > 1 || save.totalCoinsEarned > 0 || save.metCustomers.length > 0;
    const guests = [CUSTOMERS[0], CUSTOMERS[2], CUSTOMERS[1]];
    this.screenRoot.innerHTML = `
      <div class="screen screen-title">
        <div class="title-wash"></div>
        <div class="title-wrap">
          <header class="title-top">
            <div class="title-brandline">
              <span class="brand-mark">${icon('peach')}</span>
              <span class="title-brand-text">PEACH &amp; MINT<small>桃桃茶屋 · 3D TEA SHOP</small></span>
            </div>
            <div class="title-top-actions">
              <span class="sticker-chip">${icon('leaf')} 第 ${save.day} 天 · ${theme.name}</span>
              <button type="button" class="icon-btn paper sound-toggle" data-action="toggleSound" data-sound-icon aria-label="切换音效">${icon('sound')}</button>
            </div>
          </header>

          <main class="title-hero">
            <section class="title-copy">
              <span class="title-kicker">A COZY LITTLE TEA SHOP</span>
              <h1 class="game-logo" aria-label="桃桃茶屋">
                <span>桃桃</span><span>茶屋</span><i class="logo-dot">。</i>
              </h1>
              <p class="title-sub">把今天的心情，<br />摇进一杯粉粉的奶茶里。</p>
              <div class="title-door">
                <div class="title-door-art" aria-hidden="true">
                  <span class="title-door-awning"></span>
                  <span class="title-door-frame"><i class="title-door-glass"></i><i class="title-door-handle"></i></span>
                  <span class="title-door-mat"></span>
                  <span class="title-door-sign is-closed"><i class="sign-string"></i><b>休息中</b><small>CLOSED</small></span>
                </div>
                <div class="title-door-copy">
                  <span>${icon('door')} 店门口 · 推门进去</span>
                  <p>木门上挂着营业牌，现在写着「休息中」。翻到「营业中」，小店就醒了。</p>
                </div>
              </div>
              <div class="title-actions">
                <button type="button" class="btn btn-primary btn-title" data-action="openDayIntro">
                  <span class="btn-ic">${icon('bell')}</span>
                  <span class="btn-copy"><b>${hasProgress ? '继续营业' : '开始营业'}</b><small>第 ${save.day} 天 · ${theme.name}</small></span>
                  <span class="btn-arrow">${icon('arrow')}</span>
                </button>
                <button type="button" class="btn btn-paper" data-action="openHelp">${icon('book')} 怎么玩</button>
              </div>
              <div class="title-stats">
                <div class="stat-sticker"><span>营业日</span><b>${pad2(save.day)}</b><small>DAY</small></div>
                <div class="stat-sticker"><span>小金库</span><b>¥${save.coins}</b><small>COINS</small></div>
                <div class="stat-sticker"><span>最长连击</span><b>${save.bestCombo > 0 ? `x${save.bestCombo}` : '—'}</b><small>BEST COMBO</small></div>
              </div>
            </section>

            <aside class="title-side">
              <div class="title-note">
                <span class="tape tape-pink"></span>
                <div class="note-top"><span>今天的手写菜单</span><b>MENU</b></div>
                <ul class="hand-menu">
                  ${menu
                    .map(
                      (drink) => `<li>
                        ${miniCup(drink, 'menu-cup')}
                        <span><b>${drink.name}</b>${catBadge(drink, 'is-mini')}<small>${drink.tagline}</small></span>
                        <em>¥${drink.price}</em>
                      </li>`,
                    )
                    .join('')}
                </ul>
                <p class="note-sign">“慢慢来，好喝的值得等。”</p>
              </div>
              <div class="title-guests">
                <div class="guest-row">
                  ${guests
                    .map(
                      (customer, i) => `<div class="guest-sticker" style="--i:${i}">
                        ${portraitImg(customer, 'smile')}
                        <span>${customer.name}</span>
                      </div>`,
                    )
                    .join('')}
                  <span class="guest-spark">${icon('sparkle')}</span>
                </div>
                <p>今天也有可爱的客人，<br />在窗边等你点单。</p>
              </div>
            </aside>
          </main>

          <footer class="title-foot">
            <span>${icon('sound')} 音效只在动作时轻轻响起</span>
            <span class="foot-right">粉桃 · 薄荷 · 手摇奶茶</span>
          </footer>
        </div>
      </div>
    `;
    this.setSound(save.sound);
    this.soundEnabled = save.sound;
  }

  showDayIntro(view: DayIntroView) {
    const { config, tutorialSeen } = view;
    const theme = config.theme;
    const newDrinks = config.newDrinkIds.map((id) => DRINKS_MAP[id]).filter(Boolean);
    this.screenRoot.innerHTML = `
      <div class="screen day-screen">
        <div class="day-wash" style="--sky-top:${theme.skyTop};--sky-bottom:${theme.skyBottom};--sun:${theme.sun};--theme:${theme.accent}"></div>
        <article class="day-card">
          <div class="day-orb" style="--sky-top:${theme.skyTop};--sky-bottom:${theme.skyBottom};--sun:${theme.sun}">
            <span class="orb-sun"></span>
            <span class="orb-cloud c1"></span>
            <span class="orb-cloud c2"></span>
            <span class="orb-spark s1">${icon('sparkle')}</span>
            <span class="orb-spark s2">${icon('star')}</span>
            <div class="orb-label">${theme.name}<small>${theme.id.toUpperCase()}</small></div>
          </div>
          <div class="day-main">
            <div class="day-ribbon"><span>DAY ${pad2(config.day)}</span><i></i><span>${theme.name}</span></div>
            <h1>${config.day === 1 ? '今天，是茶屋的第一天。' : '新的一天，炉子已经热好了。'}</h1>
            <p class="day-hint">“${theme.hint}”</p>
            <div class="day-stats${config.deliveryEvery > 0 ? ' has-delivery' : ''}">
              <div class="day-stat"><span>今日目标</span><b>¥${config.goal}</b><small>营业额</small></div>
              <div class="day-stat"><span>营业时长</span><b>${formatClock(config.shiftSeconds)}</b><small>慢慢来</small></div>
              <div class="day-stat"><span>客人耐心</span><b>${Math.round(config.patience)}s</b><small>到店就开始</small></div>
              ${config.deliveryEvery > 0 ? `<div class="day-stat is-delivery"><span>外卖骑手</span><b>会来</b><small>第 2 天起</small></div>` : ''}
            </div>
            ${
              view.supplies.length || view.travelBonus > 0
                ? `<div class="day-supplies">
                    <div class="day-supplies-head">${icon('sparkle')} 今日特供 <span>昨晚的采购与伴手礼，从第一杯开始生效</span></div>
                    <div class="day-supplies-list">
                      ${supplyChips(view.supplies, '今天没有额外补给')}
                      ${
                        view.travelBonus > 0
                          ? `<span class="supply-chip is-souvenir" style="--supply:#ffd479">${icon('heartWish')}<b>旅行伴手礼</b><small>小费 +${Math.round(view.travelBonus * 100)}%</small></span>`
                          : ''
                      }
                    </div>
                  </div>`
                : ''
            }
            <div class="day-storefront">
              <div class="day-door" aria-hidden="true">
                <span class="day-door-awning"></span>
                <span class="day-door-frame"><i class="day-door-glass"></i><i class="day-door-handle"></i></span>
                <span class="day-door-mat"></span>
                <span class="day-door-sign is-closed"><i class="sign-string"></i><b>休息中</b><small>CLOSED</small></span>
              </div>
              <div class="day-door-copy">
                <span>${icon('door')} 店门口 · 翻牌开门</span>
                <p>门边的木牌还翻在「休息中」。翻到「营业中」，第一位客人就会推门进来。</p>
              </div>
            </div>
            ${
              newDrinks.length
                ? `<div class="new-drinks">
                    <div class="new-drinks-title">${icon('sparkle')} 今日新配方${config.day === 1 ? ' · 从茶饮、奶昔和冰淇淋开始' : ''}</div>
                    <div class="new-drinks-list">
                      ${newDrinks
                        .map(
                          (drink) => `<div class="new-drink-card">
                            ${miniCup(drink, 'new-cup')}
                            <span><b>${drink.name}</b>${catBadge(drink, 'is-mini')}<small>${baseRecipeLineFor(categoryOf(drink), drink.recipe)}</small></span>
                            <em>¥${drink.price}</em>
                          </div>`,
                        )
                        .join('')}
                    </div>
                  </div>`
                : ''
            }
            <div class="day-actions">
              <button type="button" class="btn btn-primary btn-big" data-action="beginDay">
                ${icon('bell')} 翻牌开门，开始营业 ${icon('arrow')}
              </button>
              <button type="button" class="btn btn-ghost" data-action="backToTitle">再准备一下</button>
            </div>
            <p class="day-footnote">${tutorialSeen ? '小本子已经放好，外卖台也擦干净了，今天也请多关照。' : '第一次营业？会有小提示陪着你，点单时慢慢来。'}</p>
          </div>
        </article>
      </div>
    `;
  }

  showOrderSlip(view: OrderSlipView) {
    const { order, customer, drink, recipes, tutorial } = view;
    const cat = categoryOf(drink);
    const delivery = order.channel === 'delivery';
    const info = order.delivery;
    const packItems = (info?.packaging ?? [])
      .map((id) => PACKAGING_META[id])
      .filter((meta) => !!meta)
      .map((meta) => `<i style="--pack:${meta.color}">${icon(meta.icon)}${meta.label}</i>`)
      .join('');
    this.screenRoot.innerHTML = `
      <div class="screen overlay-screen order-screen">
        <div class="scrim"></div>
        <article class="modal order-slip ${delivery ? 'is-delivery' : ''}" role="dialog" aria-modal="true" aria-label="点单">
          <button type="button" class="modal-close icon-btn paper" data-action="closeOverlay" aria-label="关闭">${icon('close')}</button>
          <header class="slip-head">
            <div class="slip-tag ${delivery ? 'is-delivery' : ''}">${delivery ? `${icon('delivery')} 外卖订单 · ${info?.address ?? '街角'}` : `${icon('bubble')} 第 ${order.seat + 1} 桌 · 新点单`}</div>
            <div class="slip-badges">${badges(order)}</div>
          </header>
          ${tutorial ? `<div class="tutorial-note">${icon('sparkle')} 和客人的形容对一对配方，再去右边找找看。</div>` : ''}
          <div class="slip-grid">
            <section class="slip-customer">
              <div class="portrait-card" style="--accent:${customer.colors.accent};--coat:${customer.colors.coat}">
                <span class="portrait-halo"></span>
                ${portraitImg(customer, 'smile', 'slip-portrait')}
                <div class="portrait-plate">
                  <b>${customer.name}</b>
                  <small>${customer.title}</small>
                </div>
              </div>
              <div class="note-paper">
                <span class="pin"></span>
                <p class="customer-quote">“${customer.quote}”</p>
                <div class="slip-drink-line">
                  ${catBadge(drink)}
                  <h3>${delivery ? '这一份，要送到…' : '客人想喝一杯…'}</h3>
                  <span>${drink.name}<small>${drink.latin}</small></span>
                </div>
                <p class="order-hint">“${drink.tagline}”</p>
                ${
                  order.wish
                    ? `<div class="wish-note">${icon('heartWish')}<div><span>常客的手写心愿</span><p>“${order.wish}”</p></div></div>`
                    : ''
                }
                <div class="req-title">${icon('bell')} 特别要求</div>
                <div class="req-chips">${reqChips(order.request, cat)}</div>
                ${
                  delivery
                    ? `<div class="slip-delivery">
                        <div class="slip-delivery-grid">
                          <span><small>送到</small><b>${info?.address ?? '街角'}</b><em>${info?.distance ?? ''}</em></span>
                          <span><small>骑手取餐</small><b>${Math.ceil(order.patience)}s</b><em>接单只多 3 秒</em></span>
                          <span><small>配送费</small><b>¥${info?.fee ?? 0}</b><em>平台补贴</em></span>
                        </div>
                        <p class="delivery-message">${icon('chat')} 客人留言：“${info?.note ?? '谢谢你～'}”</p>
                        <div class="slip-pack"><span>${icon('delivery')} 出杯后还要打包 ${info?.packaging.length ?? 0} 件</span><div>${packItems}</div></div>
                      </div>
                      <p class="wait-note is-delivery">${icon('clock')} 骑手已经在路上，取餐倒计时现在就开始啦。</p>`
                    : `<p class="wait-note">${icon('clock')} 客人的耐心从到店起就在倒数，快记下订单吧。</p>`
                }
              </div>
            </section>
            <section class="slip-book">
              <header class="slip-book-head">
                <div><span>配方手账 · 快速翻阅</span><h3>哪一杯，刚好是 Ta 说的味道？</h3></div>
                <span class="book-page">${delivery ? 'DELIVERY' : `P.${String(order.seat + 1).padStart(2, '0')}`}</span>
              </header>
              <div class="recipe-mini-list">
                ${recipes
                  .map(
                    (recipe) => `<article class="recipe-mini" style="--drink:${recipe.color};--accent:${recipe.accent}">
                      ${miniCup(recipe, 'recipe-mini-cup')}
                      <div class="recipe-mini-copy">
                        <div class="recipe-mini-title"><b>${recipe.name}</b>${catBadge(recipe, 'is-mini')}<em>¥${recipe.price}</em></div>
                        <p>${recipe.tagline}</p>
                        <div class="base-chips">${baseChips(recipe)}</div>
                      </div>
                    </article>`,
                  )
                  .join('')}
              </div>
            </section>
          </div>
          <footer class="slip-actions">
            <span class="slip-tip">${icon('recipe')} ${delivery ? '外卖也按同一份 7 项配方调制' : '茶底、奶和风味写在配方里'}</span>
            <div class="slip-buttons">
              <button type="button" class="btn btn-ghost" data-action="closeOverlay">再想想</button>
              <button type="button" class="btn btn-primary btn-big" data-action="acceptOrder" data-id="${order.id}">
                ${icon('notebook')} 记下来，开始调制
              </button>
            </div>
          </footer>
        </article>
      </div>
    `;
    this.setSound(this.soundEnabled);
  }

  showChat(view: ChatView) {
    const { customer, order, drink, replyIndex } = view;
    const chat = customer.chat;
    if (!chat) return;
    const cat = categoryOf(drink);
    const replied = replyIndex !== null;
    const option = replied ? chat.options[replyIndex] : null;
    this.screenRoot.innerHTML = `
      <div class="screen overlay-screen chat-screen cat-${cat}">
        <div class="scrim"></div>
        <article class="chat-card" role="dialog" aria-modal="true" aria-label="客人的闲聊">
          <button type="button" class="modal-close icon-btn paper" data-action="finishChat" aria-label="${replied ? '去调饮' : '跳过闲聊'}">${icon('close')}</button>
          <header class="chat-head">
            <span class="chat-tag">${icon('chat')} 出杯前的小闲聊</span>
            <span class="chat-order-tag">${order.channel === 'delivery' ? `${icon('delivery')} ${order.delivery?.address ?? '外卖'}` : `${icon('bubble')} 第 ${order.seat + 1} 桌`}</span>
          </header>
          <div class="chat-stage">
            <div class="chat-portrait" style="--accent:${customer.colors.accent};--coat:${customer.colors.coat}">
              <span class="chat-halo"></span>
              ${portraitImg(customer, replied ? 'happy' : 'smile', 'chat-portrait-img')}
              <div class="chat-portrait-plate">
                <b>${customer.name}</b>
                <small>${customer.title}</small>
              </div>
              <span class="chat-mood">${icon('heartWish')} 心情很好</span>
            </div>
            <div class="chat-dialogue">
              <div class="chat-bubble">
                <span class="chat-speaker">${customer.name}<small>${customer.latin}</small></span>
                <p>${chat.line}</p>
              </div>
              ${
                replied && option
                  ? `<div class="chat-reply"><span>你</span><p>${option.label}</p></div>
                    <div class="chat-bubble is-answer">
                      <span class="chat-speaker">${customer.name}<small>${customer.latin}</small></span>
                      <p>${option.reply}</p>
                    </div>
                    <div class="chat-reward">${icon('heartWish')} 常客好感 +1 <em>小费加成 +8%</em></div>
                    <button type="button" class="btn btn-primary btn-big chat-go" data-action="finishChat">
                      ${icon('shaker')} 去调这杯 ${icon('arrow')}
                    </button>`
                  : `<div class="chat-options">
                      ${chat.options
                        .map(
                          (choice, index) => `<button type="button" class="chat-option" data-action="answerChat" data-index="${index}">
                            <span>${pad2(index + 1)}</span><b>${choice.label}</b>${icon('arrow')}
                          </button>`,
                        )
                        .join('')}
                    </div>
                    <p class="chat-hint">${icon('clock')} 闲聊不会消耗营业时间，也不会让耐心变少。挑一句真心话就好。</p>`
              }
            </div>
            <aside class="chat-side">
              ${miniCup(drink, 'chat-cup')}
              <b>${drink.name}</b>
              ${catBadge(drink)}
              <p>“${drink.tagline}”</p>
              <div class="req-chips">${reqChips(order.request, cat)}</div>
              <small>${order.wish ? `${icon('heartWish')} ${order.wish}` : '调饮时营业计时会暂停'}</small>
            </aside>
          </div>
          <footer class="chat-foot">
            <span>${icon('leaf')} 一句好好回答，会让这杯更甜一点。</span>
            <span>${icon('notebook')} 订单已经记在小本子里</span>
          </footer>
        </article>
      </div>
    `;
    this.setSound(this.soundEnabled);
  }

  showCraft(view: CraftView) {
    this.currentCraft = view;
    this.shakeZone = view.shake?.zone ?? 0.11;
    const { order, customer, drink, recipes, tutorialHint } = view;
    const cat = categoryOf(drink);
    const catMeta = CATEGORY_META[cat];
    const finish = FINISH_META[drink.finish];
    const needed = drink.finish === 'blend' ? 2 : 3;
    const delivery = order.channel === 'delivery';
    const unit = finishUnit(drink.finish);
    const zone = (view.shake?.zone ?? 0.11) * 100;
    const zoneLeft = 50 - zone;
    const packedAll = view.packaging?.allPacked ?? true;
    this.screenRoot.innerHTML = `
      <div class="screen overlay-screen craft-screen cat-${cat}">
        <div class="scrim"></div>
        <article class="craft-shell${tutorialHint ? ' has-tutorial' : ''}${delivery ? ' is-delivery' : ''}" data-step="${view.step}" role="dialog" aria-modal="true" aria-label="调制饮品">
          <header class="craft-head">
            <div class="craft-customer">
              <div class="mini-portrait">${portraitImg(customer, 'smile')}</div>
              <div class="craft-customer-copy">
                <span class="craft-kicker">${delivery ? `${icon('delivery')} 外卖 · ${order.delivery?.address ?? '街角'}` : `第 ${order.seat + 1} 桌 · ${order.vip ? '贵宾订单' : '堂食订单'}`} ${order.rush ? '· 加急' : ''}</span>
                <h2>为 ${customer.name} 调一杯</h2>
                <p>“${customer.quote}”</p>
              </div>
            </div>
            <div class="craft-request">
              <span class="scribble-label">${icon('notebook')} 订单便签 ${catBadge(drink, 'is-mini')}</span>
              <p class="craft-hint">“${drink.tagline}”</p>
              <div class="req-chips">${reqChips(order.request, cat)}</div>
            </div>
            <div class="craft-head-actions">
              <button type="button" class="btn btn-paper btn-small" data-action="toggleRecipes">${icon('recipe')} 配方速查</button>
              <button type="button" class="icon-btn paper" data-action="closeOverlay" aria-label="稍后再做">${icon('close')}</button>
            </div>
          </header>

          <div class="craft-body">
            <aside class="craft-preview">
              <div class="preview-stage">
                <span class="preview-tag">LIVE · 3D</span>
                <div class="craft-canvas" id="craft-canvas-mount"></div>
                <div class="preview-glow"></div>
                <div class="step-track">
                  <span class="step-dot" data-step-dot="assemble"><i>1</i><b data-step-label="assemble">调制</b></span>
                  <span class="step-line"></span>
                  <span class="step-dot" data-step-dot="shake"><i>2</i><b data-step-label="shake">${catMeta.finishLabel}</b></span>
                  <span class="step-line"></span>
                  <span class="step-dot" data-step-dot="ready"><i>3</i><b data-step-label="ready">${delivery ? '打包' : '出杯'}</b></span>
                </div>
              </div>
              <div class="preview-caption">
                <div>${miniCup(drink, 'preview-cup')}<span><b>${drink.name}</b>${catBadge(drink, 'is-mini')}<small>${drink.latin}</small></span></div>
                <em>¥${drink.price}</em>
              </div>
            </aside>

            <div class="craft-main">
              <section class="craft-step assemble-panel" data-panel="assemble">
                <div class="panel-head">
                  <div>
                    <span class="panel-kicker">STEP 1 · 调制 · ${catMeta.label.toUpperCase()}</span>
                    <h3>把 7 项配方一项项选好</h3>
                    <p>茶底、奶和风味藏在配方手账里，糖冰和小料看客人便签。</p>
                  </div>
                  <div class="selection-count"><b data-craft-count>0</b><span>/ 7 已选</span></div>
                </div>
                <div class="ingredient-scroll">
                  ${SELECTION_GROUPS.map(
                    (group, index) => `<div class="ingredient-row">
                      <div class="row-label">
                        <span class="row-index">${pad2(index + 1)}</span>
                        <div><h4>${group.label}</h4><small>${group.latin}</small></div>
                      </div>
                      <div class="choice-list">
                        ${group.options
                          .map(
                            (option) => `<button type="button" class="choice" data-action="select" data-key="${group.key}" data-value="${option.id}" data-choice-key="${group.key}" data-choice-value="${option.id}" style="--swatch:${option.color};--swatch2:${option.color2 ?? option.color}" aria-pressed="false">
                              <span class="choice-icon">${ingredientIcon(option.icon)}</span>
                              <span class="choice-text"><b>${option.label}</b><small>${option.sub}</small></span>
                              <span class="choice-check">${icon('check')}</span>
                            </button>`,
                          )
                          .join('')}
                      </div>
                    </div>`,
                  ).join('')}
                </div>
                <div class="assemble-actions">
                  <span class="craft-note">${icon('clock')} 调饮时，营业计时会暂停</span>
                  <button type="button" class="btn btn-ghost" data-action="clearSelections">清空</button>
                  <button type="button" class="btn btn-primary" data-action="goShake" data-craft-next disabled>${icon(finish.icon)} ${catMeta.finishVerb} ${icon('arrow')}</button>
                </div>
              </section>

              <section class="craft-step shake-panel finish-${drink.finish}" data-panel="shake" style="--cat:${catMeta.color}">
                <div class="panel-head">
                  <div>
                    <span class="panel-kicker">STEP 2 · ${catMeta.finishLatin} · ${catMeta.finishLabel}</span>
                    <h3>${finishTitle(drink)}</h3>
                    <p>${finish.hint}</p>
                  </div>
                  <div class="shake-count"><b data-shake-count>0</b><span>/ ${needed}</span></div>
                </div>
                <div class="shake-visual">
                  <div class="shaker-hero">${icon(finish.icon)}<i class="shaker-glow"></i></div>
                  <div class="shake-mood">
                    <span data-shake-label>准备好啦</span>
                    <small>${catMeta.qualityLabel} · 越靠中心越好</small>
                  </div>
                  <div class="shake-sparkles"><i>${icon('sparkle')}</i><i>${icon('star')}</i><i>${icon('sparkle')}</i></div>
                </div>
                <div class="shake-meter">
                  <div class="shake-track">
                    <div class="shake-sweet" data-shake-zone style="left:${zoneLeft}%;width:${zone * 2}%"></div>
                    <span class="shake-center"></span>
                    <div class="shake-pointer" data-shake-pointer></div>
                  </div>
                  <div class="shake-scale"><span>${finish.scale[0]}</span><span>${finish.scale[1]}</span><span>${finish.scale[2]}</span></div>
                </div>
                <div class="shake-taps" data-shake-taps data-shake-needed="${needed}">
                  ${Array.from({ length: needed }, (_, i) => `<span class="shake-slot" data-slot="${i}"><i>${icon('sparkle')}</i><b>第 ${i + 1} ${unit}</b><small>等待</small></span>`).join('')}
                </div>
                <div class="shake-actions">
                  <button type="button" class="shake-button" data-action="shakeTap"><span>${finish.button}</span><small>SPACE / 点击</small></button>
                  <button type="button" class="btn btn-primary btn-big is-hidden" data-action="finishShake" data-shake-finish>${icon('check')} ${catMeta.finishLabel}完成，${delivery ? '准备打包' : '准备出杯'}</button>
                </div>
              </section>

              <section class="craft-step ready-panel" data-panel="ready">
                <div class="ready-inner">
                  <span class="panel-kicker">STEP 3 · ${delivery ? 'PACKING · 打包' : `SERVE · ${catMeta.label}`}</span>
                  <h3>${readyTitle(drink, delivery)}</h3>
                  <p class="ready-tagline">${delivery ? `送到 ${order.delivery?.address ?? '街角'} · 骑手还剩 ${Math.ceil(order.patience)} 秒` : `“${drink.tagline}”`}</p>
                  <div class="ready-quality">
                    <div><span>${catMeta.qualityLabel}</span><div class="quality-stars" data-ready-stars>${starRow(0)}</div></div>
                    <b data-ready-quality>0%</b>
                  </div>
                  <div class="ready-recipe" data-ready-recipe></div>
                  ${packagingMarkup(view)}
                  <div class="ready-actions">
                    <button type="button" class="btn btn-ghost" data-action="closeOverlay">再检查一下</button>
                    <button type="button" class="btn btn-primary btn-big" data-action="serve" data-serve-button ${packedAll ? '' : 'disabled'}>
                      ${delivery ? `${icon('delivery')} ${packedAll ? '打包好啦，交给骑手' : '还要打包一下'}` : `${icon('cup')} 送给 ${customer.name}`}
                    </button>
                  </div>
                  ${delivery ? `<p class="ready-pack-note" data-pack-note>${icon('leaf')} 三项打包全部完成后，才能交给骑手。</p>` : ''}
                </div>
              </section>
            </div>
          </div>

          <div class="craft-tutorial is-hidden" data-craft-tutorial>
            <span class="craft-tutorial-icon">${icon('sparkle')}</span>
            <span data-craft-tutorial-text>${tutorialHint ?? ''}</span>
          </div>

          <aside class="recipe-drawer" data-recipe-drawer>
            <header class="drawer-head">
              <div><span>配方手账</span><h3>今日可用配方</h3></div>
              <button type="button" class="icon-btn paper" data-action="toggleRecipes" aria-label="关闭配方">${icon('close')}</button>
            </header>
            <p class="drawer-note">${icon('leaf')} 客人的糖冰和小料以订单便签为准。</p>
            <div class="drawer-list">
              ${recipes
                .map(
                  (recipe) => `<article class="drawer-recipe" style="--drink:${recipe.color}">
                    ${miniCup(recipe, 'drawer-cup')}
                    <div>
                      <div class="drawer-recipe-title"><b>${recipe.name}</b>${catBadge(recipe, 'is-mini')}<em>¥${recipe.price}</em></div>
                      <p>${recipe.tagline}</p>
                      <div class="base-chips">${baseChips(recipe)}</div>
                    </div>
                  </article>`,
                )
                .join('')}
            </div>
          </aside>
        </article>
      </div>
    `;
    if (tutorialHint) {
      const el = this.screenRoot.querySelector<HTMLElement>('[data-craft-tutorial]');
      el?.classList.remove('is-hidden');
    }
    this.updateCraft(view);
  }

  mountPreviewCanvas(canvas: HTMLCanvasElement) {
    const mount = this.screenRoot.querySelector<HTMLElement>('#craft-canvas-mount');
    if (!mount) return;
    mount.appendChild(canvas);
    canvas.classList.add('preview-canvas');
  }

  updateCraft(view: CraftView) {
    this.currentCraft = view;
    const shell = this.screenRoot.querySelector<HTMLElement>('.craft-shell');
    if (!shell) return;
    shell.dataset.step = view.step;
    const cat = categoryOf(view.drink);
    const catMeta = CATEGORY_META[cat];
    const mode = view.shake?.mode ?? view.drink.finish;
    const needed = view.shake?.tapsNeeded ?? (mode === 'blend' ? 2 : 3);
    const unit = finishUnit(mode);
    const delivery = view.order.channel === 'delivery';
    const stepLabels: Record<CraftStep, string> = {
      assemble: '调制',
      shake: catMeta.finishLabel,
      ready: delivery ? '打包' : '出杯',
    };
    for (const label of this.screenRoot.querySelectorAll<HTMLElement>('[data-step-label]')) {
      const step = label.dataset.stepLabel as CraftStep;
      if (step) label.textContent = stepLabels[step];
    }

    for (const dot of this.screenRoot.querySelectorAll<HTMLElement>('[data-step-dot]')) {
      const step = dot.dataset.stepDot as CraftStep;
      const order: CraftStep[] = ['assemble', 'shake', 'ready'];
      dot.classList.toggle('is-active', step === view.step);
      dot.classList.toggle('is-done', order.indexOf(step) < order.indexOf(view.step));
    }

    let count = 0;
    for (const group of SELECTION_GROUPS) {
      const value = view.selections[group.key];
      if (value) count++;
      this.screenRoot.querySelectorAll<HTMLButtonElement>(`[data-choice-key="${group.key}"]`).forEach((btn) => {
        const selected = btn.dataset.choiceValue === value;
        btn.classList.toggle('is-selected', selected);
        btn.setAttribute('aria-pressed', String(selected));
      });
    }
    const countEl = this.screenRoot.querySelector<HTMLElement>('[data-craft-count]');
    if (countEl) countEl.textContent = String(count);
    const next = this.screenRoot.querySelector<HTMLButtonElement>('[data-craft-next]');
    if (next) next.disabled = count < 7;

    if (view.shake) {
      this.shakeZone = view.shake.zone;
      const countEl2 = this.screenRoot.querySelector<HTMLElement>('[data-shake-count]');
      if (countEl2) countEl2.textContent = String(view.shake.taps);
      const zone = this.screenRoot.querySelector<HTMLElement>('[data-shake-zone]');
      if (zone) {
        zone.style.left = `${50 - view.shake.zone * 100}%`;
        zone.style.width = `${view.shake.zone * 200}%`;
      }
      const taps = this.screenRoot.querySelector<HTMLElement>('[data-shake-taps]');
      if (taps) {
        taps.innerHTML = Array.from({ length: needed }, (_, i) => {
          const score = view.shake?.scores[i];
          const cls = score === undefined ? '' : score >= 0.86 ? 'is-perfect' : score >= 0.62 ? 'is-good' : 'is-miss';
          const hint =
            score === undefined
              ? i === view.shake!.taps
                ? '瞄准中'
                : '等待'
              : `${scoreWord(score)} · ${Math.round(score * 100)}%`;
          return `<span class="shake-slot ${cls}" data-slot="${i}"><i>${icon(score === undefined ? 'sparkle' : 'check')}</i><b>第 ${i + 1} ${unit}</b><small>${hint}</small></span>`;
        }).join('');
      }
      const label = this.screenRoot.querySelector<HTMLElement>('[data-shake-label]');
      if (label) {
        label.textContent = view.shake.done
          ? finishDoneLine(view.drink, view.shake.perfect)
          : view.shake.taps === 0
            ? '准备好啦'
            : `还差 ${Math.max(0, needed - view.shake.taps)} ${unit}`;
      }
      const shakeBtn = this.screenRoot.querySelector<HTMLButtonElement>('.shake-button');
      const finish = this.screenRoot.querySelector<HTMLElement>('[data-shake-finish]');
      shell.classList.toggle('is-shake-done', view.shake.done);
      if (shakeBtn) shakeBtn.disabled = view.shake.done;
      finish?.classList.toggle('is-hidden', !view.shake.done);
      const readyStars = this.screenRoot.querySelector<HTMLElement>('[data-ready-stars]');
      if (readyStars) readyStars.innerHTML = starRow(view.shake.quality);
      const quality = this.screenRoot.querySelector<HTMLElement>('[data-ready-quality]');
      if (quality) quality.textContent = `${Math.round(view.shake.quality * 100)}%`;
    }

    const readyRecipe = this.screenRoot.querySelector<HTMLElement>('[data-ready-recipe]');
    if (readyRecipe) {
      readyRecipe.innerHTML = selectionRecipe(view)
        .map(
          (field) => `<span class="ready-chip" style="--chip:${recipeValueMeta(field.key, field.value).color}">
            <small>${field.label}</small><b>${recipeValueLabelFor(cat, field.key, field.value)}</b>
          </span>`,
        )
        .join('');
    }

    if (view.packaging) {
      const done = view.packaging.items.filter((item) => item.packed).length;
      const progress = this.screenRoot.querySelector<HTMLElement>('[data-pack-progress]');
      if (progress) progress.textContent = `${done} / ${view.packaging.items.length}`;
      for (const item of view.packaging.items) {
        const btn = this.screenRoot.querySelector<HTMLButtonElement>(`[data-pack-item="${item.id}"]`);
        if (!btn) continue;
        btn.classList.toggle('is-packed', item.packed);
        btn.setAttribute('aria-pressed', String(item.packed));
        const check = btn.querySelector<HTMLElement>('.pack-check');
        if (check) check.innerHTML = icon(item.packed ? 'check' : item.icon);
        const sub = btn.querySelector<HTMLElement>('.pack-copy small');
        if (sub) sub.textContent = item.packed ? '装好了' : item.sub;
      }
      const serveBtn = this.screenRoot.querySelector<HTMLButtonElement>('[data-serve-button]');
      if (serveBtn) {
        serveBtn.disabled = !view.packaging.allPacked;
        serveBtn.innerHTML = view.packaging.allPacked
          ? `${icon('delivery')} 打包好啦，交给骑手`
          : `${icon('delivery')} 还要打包一下`;
      }
      const checklist = this.screenRoot.querySelector<HTMLElement>('[data-pack-checklist]');
      checklist?.classList.toggle('is-complete', view.packaging.allPacked);
    }

    shell.classList.toggle('has-tutorial', !!view.tutorialHint);
    const tutorial = this.screenRoot.querySelector<HTMLElement>('[data-craft-tutorial]');
    if (tutorial) {
      tutorial.classList.toggle('is-hidden', !view.tutorialHint);
      const text = tutorial.querySelector<HTMLElement>('[data-craft-tutorial-text]');
      if (text && view.tutorialHint) text.textContent = view.tutorialHint;
    }

    this.shakePointer = this.screenRoot.querySelector<HTMLElement>('[data-shake-pointer]');
  }

  updateShakePointer(position: number) {
    if (!this.shakePointer) return;
    this.shakePointer.style.left = `${position * 100}%`;
    this.shakePointer.classList.toggle('in-sweet', Math.abs(position - 0.5) <= this.shakeZone);
  }

  private toggleRecipeDrawer() {
    const drawer = this.screenRoot.querySelector<HTMLElement>('[data-recipe-drawer]');
    if (!drawer) return;
    drawer.classList.toggle('is-open');
    this.screenRoot.querySelector('.craft-shell')?.classList.toggle('drawer-open', drawer.classList.contains('is-open'));
  }

  showNotebook(view: NotebookView) {
    this.notebookData = view;
    this.screenRoot.innerHTML = `
      <div class="screen overlay-screen notebook-screen">
        <div class="scrim"></div>
        <article class="notebook" role="dialog" aria-modal="true" aria-label="点单小本子">
          <span class="notebook-rings">${Array.from({ length: 9 }, () => '<i></i>').join('')}</span>
          <header class="notebook-head">
            <div class="notebook-title">
              <span class="notebook-mark">${icon('notebook')}</span>
              <div><h2>店主的点单小本子</h2><p>DAY ${pad2(view.day)} · ${view.themeName} · 已经出杯 ${view.totalServed} 次</p></div>
            </div>
            <button type="button" class="icon-btn paper" data-action="closeOverlay" aria-label="合上本子">${icon('close')}</button>
          </header>
          <div class="notebook-tabs">
            <button type="button" class="notebook-tab" data-action="notebookTab" data-tab="orders">
              ${icon('bubble')} 订单 <b>${view.orders.length}</b>
            </button>
            <button type="button" class="notebook-tab" data-action="notebookTab" data-tab="recipes">
              ${icon('recipe')} 配方 <b>${view.unlocked.length}</b>
            </button>
            <button type="button" class="notebook-tab" data-action="notebookTab" data-tab="regulars">
              ${icon('heart')} 常客 <b>${view.met.length}/${CUSTOMERS.length}</b>
            </button>
          </div>
          <div class="notebook-page" data-notebook-page></div>
          <footer class="notebook-foot">${icon('leaf')} 小提示：客人到店后耐心就开始倒计时；调饮、闲聊和翻本子时，时间会暂停。</footer>
        </article>
      </div>
    `;
    this.renderNotebookPage();
  }

  private renderNotebookPage() {
    const view = this.notebookData;
    const page = this.screenRoot.querySelector<HTMLElement>('[data-notebook-page]');
    if (!view || !page) return;
    this.screenRoot.querySelectorAll<HTMLElement>('.notebook-tab').forEach((tab) => {
      tab.classList.toggle('is-active', tab.dataset.tab === this.notebookTab);
    });

    if (this.notebookTab === 'orders') {
      page.innerHTML = view.orders.length
        ? `<div class="notebook-orders">
            ${view.orders
              .map(
                ({ order, customer, drink }) => `<article class="order-note ${order.vip ? 'is-vip' : ''} ${order.channel === 'delivery' ? 'is-delivery' : ''}">
                  <span class="tape ${order.channel === 'delivery' ? 'tape-lilac' : 'tape-mint'}"></span>
                  <div class="order-note-head">
                    <div class="mini-portrait">${portraitImg(customer, 'smile')}</div>
                    <div class="order-note-name">
                      <b>${customer.name}</b>
                      <small>${order.channel === 'delivery' ? icon('delivery') : ''} ${orderPlace(order)} · ${drink.name}</small>
                    </div>
                    <div class="order-badges">${badges(order)}</div>
                  </div>
                  <p class="order-note-hint">“${order.wish ?? drink.tagline}”</p>
                  <div class="req-chips">${reqChips(order.request, categoryOf(drink))}</div>
                  <div class="patience-line">
                    <div class="patience-title"><span>${icon('clock')} ${order.channel === 'delivery' ? '骑手取餐' : '耐心'}</span><b>${Math.ceil(order.patience)}s</b></div>
                    <div class="patience-track"><span class="patience-fill" style="width:${Math.max(0, Math.min(100, (order.patience / Math.max(1, order.patienceMax)) * 100))}%"></span></div>
                  </div>
                  <button type="button" class="btn btn-primary btn-small" data-action="startCraft" data-id="${order.id}">
                    ${icon(order.channel === 'delivery' ? 'delivery' : 'shaker')} ${order.channel === 'delivery' ? '去调制并打包' : '去调制'}
                  </button>
                </article>`,
              )
              .join('')}
          </div>`
        : `<div class="notebook-empty">
            <span class="empty-cup">${icon('plainCup')}</span>
            <h3>还没有记下订单</h3>
            <p>去点点门口客人的气泡吧，<br />把小小心愿写进这里。</p>
          </div>`;
    } else if (this.notebookTab === 'recipes') {
      page.innerHTML = `<div class="recipe-grid">
        ${view.unlocked
          .map(
            (drink) => `<article class="recipe-card" style="--drink:${drink.color};--accent:${drink.accent};--cat:${CATEGORY_META[categoryOf(drink)].color}">
              <div class="recipe-card-head">
                ${miniCup(drink, 'notebook-cup')}
                <div><b>${drink.name}</b><small>${drink.latin}</small>${catBadge(drink, 'is-mini')}</div>
                <em>¥${drink.price}</em>
              </div>
              <p class="recipe-tagline">${drink.tagline}</p>
              <div class="recipe-attributes">
                ${RECIPE_FIELDS.map(
                  (field) => `<div class="recipe-attribute">
                    <small>${field.label}</small>
                    <b>${recipeValueLabelFor(categoryOf(drink), field.key, drink.recipe[field.key])}</b>
                  </div>`,
                ).join('')}
              </div>
              <div class="recipe-card-foot">
                <span>${drink.badge ? `<i>${drink.badge}</i>` : ''} 第 ${drink.unlockDay} 天解锁</span>
                <span class="base-dot" style="background:${drink.color}"></span>
              </div>
            </article>`,
          )
          .join('')}
      </div>`;
    } else {
      page.innerHTML = `<div class="regulars-head">
        <div><h3>已经遇见的客人</h3><p>每一次点单，都是一段小小的相遇。</p></div>
        <span class="regular-count">${view.met.length} / ${CUSTOMERS.length}</span>
      </div>
      <div class="regulars-grid">
        ${CUSTOMERS.map((customer) => {
          const met = view.met.some((c) => c.id === customer.id);
          if (!met) {
            return `<article class="regular-card is-unknown">
              <div class="regular-photo"><span>?</span></div>
              <div class="regular-copy"><b>？？？</b><small>还没有遇见的客人</small></div>
            </article>`;
          }
          const rapport = view.regulars[customer.id] ?? 0;
          const hasWish = rapport >= 2;
          return `<article class="regular-card ${hasWish ? 'has-wish' : ''}">
            <div class="regular-photo">${portraitImg(customer, 'happy')}</div>
            <div class="regular-copy">
              <div class="regular-name"><b>${customer.name}</b><span>${customer.latin}</span>${customer.vip ? `<em>${icon('crown')} 贵宾</em>` : ''}</div>
              <small>${customer.title}</small>
              <p>“${customer.quote}”</p>
              <div class="regular-rapport">
                <span>${icon('heartWish')} 常客好感</span>
                ${chatRapport(rapport)}
                <em>${hasWish ? '会写下心愿' : rapport >= 1 ? '再熟一点...' : '刚刚认识'}</em>
              </div>
            </div>
          </article>`;
        }).join('')}
      </div>`;
    }
  }

  showServeResult(view: ServeView) {
    const { result, customer, order, made, quote, expression, drink } = view;
    const cat = categoryOf(drink);
    const catMeta = CATEGORY_META[cat];
    const delivery = order.channel === 'delivery';
    const rating = result.deliveryRating;
    const allPerfect = result.matches === result.total;
    const tone = allPerfect ? 'is-perfect' : result.matches >= 5 ? 'is-good' : 'is-bad';
    const stamp = delivery
      ? rating >= 3
        ? '骑手五星好评！'
        : rating === 2
          ? '顺利送到啦'
          : '下次会更快'
      : allPerfect
        ? '完美复刻！'
        : result.matches >= 5
          ? '很接近了'
          : '差一点点';
    const sub = delivery
      ? rating >= 3
        ? '打包稳稳当当，客人在门口笑着接过了。'
        : rating === 2
          ? '餐点安全送到，还有一点点可以更好的地方。'
          : '骑手赶时间，这次稍微有点手忙脚乱。'
      : allPerfect
        ? '客人的眼睛亮了起来。'
        : result.matches >= 5
          ? '客人笑着收下了这杯。'
          : '客人努力挤出一个微笑。';
    const fieldChips = RECIPE_FIELDS.map((field) => {
      const ok = result.matched[field.key];
      return `<span class="match-field ${ok ? 'is-ok' : 'is-miss'}">
        <span class="match-state">${icon(ok ? 'check' : 'close')}</span>
        <small>${field.label}</small>
        <b>${recipeValueLabelFor(cat, field.key, result.order.request[field.key])}</b>
        ${ok ? '' : `<em>你用了 ${recipeValueLabelFor(cat, field.key, made[field.key])}</em>`}
      </span>`;
    }).join('');

    this.screenRoot.innerHTML = `
      <div class="screen overlay-screen result-screen ${tone} ${delivery ? 'is-delivery' : ''}">
        <div class="scrim"></div>
        <div class="result-confetti">${Array.from({ length: 14 }, (_, i) => `<i style="--i:${i}"></i>`).join('')}</div>
        <article class="result-card" role="dialog" aria-modal="true" aria-label="出杯结果">
          <header class="result-top">
            <div class="result-portrait" style="--accent:${customer.colors.accent};--coat:${customer.colors.coat}">
              ${portraitImg(customer, expression)}
              <span class="result-heart">${icon('heart')}</span>
              ${delivery ? `<span class="result-channel">${icon('delivery')} 外卖</span>` : ''}
            </div>
            <div class="result-copy">
              <span class="result-kicker">${delivery ? `${icon('delivery')} ${orderPlace(order)} · 外卖订单` : `第 ${order.seat + 1} 桌 · ${order.vip ? '贵宾订单' : order.rush ? '加急订单' : '堂食订单'}`} ${catBadge(drink, 'is-mini')}</span>
              <h2>${stamp}</h2>
              <p>${sub}</p>
              <blockquote>“${quote}”</blockquote>
              <span class="result-name">— ${delivery ? '外卖留言' : customer.name}</span>
            </div>
            <div class="result-stamp">
              <span>${icon(allPerfect ? 'star' : result.matches >= 5 ? 'sparkle' : 'heart')}</span>
              <b>${result.matches}/${result.total}</b>
              <small>配方吻合</small>
            </div>
          </header>
          <div class="result-numbers ${delivery ? 'has-delivery' : ''}">
            <div><span>本杯收入</span><b>¥${result.payout}</b></div>
            <div><span>小费</span><b class="tip">+¥${result.tip}</b></div>
            ${delivery ? `<div><span>配送费</span><b class="delivery-fee">+¥${result.deliveryFee}</b></div>
            <div><span>外卖评分</span><b class="delivery-stars">${starRow(rating / 3)}</b></div>` : ''}
            <div><span>连击</span><b class="${view.combo >= 2 ? 'hot' : ''}">x${Math.max(1, view.combo)}</b></div>
            <div><span>${catMeta.qualityLabel}</span><b class="shake-score">${starRow(result.shakeQuality)}</b></div>
          </div>
          <div class="result-breakdown">
            <div class="breakdown-head"><h3>${icon('recipe')} 配方对照</h3><span>每对上一项，客人就多一分开心</span></div>
            <div class="match-grid">${fieldChips}</div>
          </div>
          <div class="result-meta">
            <span>当前金币 <b>${icon('coin')} ${view.coins}</b></span>
            <span>小店耐心 <b>${heartsHtml(view.hearts)}</b></span>
            ${delivery ? `<span>打包完成 <b>${result.packagingScore * 100 >= 100 ? '全部装好' : '有遗漏'} (${Math.round(result.packagingScore * 100)}%)</b></span>` : ''}
            <span>${delivery ? '外卖评价' : '完美出杯'} <b>${delivery ? (rating >= 3 ? '五星好评' : `${rating} 星`) : result.perfectShake ? `${catMeta.finishLabel}满分` : '继续加油'}</b></span>
          </div>
          <div class="result-doodle" aria-hidden="true">${cupDoodle(delivery ? '桃桃茶屋 · 外卖已送达' : '桃桃茶屋 · 谢谢惠顾')}</div>
          <button type="button" class="btn btn-primary btn-big result-continue" data-action="closeOverlay">
            继续营业 ${icon('arrow')}
          </button>
        </article>
      </div>
    `;
    this.setSound(this.soundEnabled);
  }

  showSummary(view: SummaryView) {
    const pct = Math.round((view.revenue / Math.max(1, view.goal)) * 100);
    this.screenRoot.innerHTML = `
      <div class="screen summary-screen">
        <article class="summary-card">
          <span class="tape tape-pink"></span>
          <header class="summary-head">
            <div class="summary-day">
              <span>DAY ${pad2(view.day)}</span>
              <small>${view.theme.name} · 营业结束</small>
            </div>
            <div class="summary-grade">
              <div class="stars-display">${Array.from({ length: 3 }, (_, i) => `<span class="big-star ${i < view.grade ? 'is-on' : 'is-off'}">${icon('star')}</span>`).join('')}</div>
              <span>今日评价</span>
            </div>
          </header>
          <h2>${gradeHeadline(view.grade, view.reason)}</h2>
          <p class="summary-sub">${view.goalMet ? '目标达成啦，小金库又鼓了一点点。' : '没有关系，慢慢来，客人们还会再来的。'}</p>
          <div class="summary-stats">
            <div class="summary-stat wide">
              <span>营业额</span>
              <b>¥${view.revenue}</b>
              <small>目标 ¥${view.goal} · ${pct}%</small>
              <div class="mini-progress"><span style="width:${Math.min(100, pct)}%"></span></div>
            </div>
            <div class="summary-stat"><span>服务客人</span><b>${view.served}</b><small>杯</small></div>
            <div class="summary-stat"><span>完美复刻</span><b>${view.perfect}</b><small>杯</small></div>
            <div class="summary-stat"><span>最高连击</span><b>x${view.maxCombo}</b><small>COMBO</small></div>
            <div class="summary-stat"><span>剩余耐心</span><b class="hearts-inline">${heartsHtml(view.hearts)}</b><small>口碑</small></div>
          </div>
          <div class="summary-reward ${view.bonus > 0 ? 'has-bonus' : ''}">
            ${icon('coin')}
            <div><span>${view.bonus > 0 ? '目标达成奖励' : '今日小结'}</span><b>${view.bonus > 0 ? `+ ¥${view.bonus}` : '明天继续加油'}</b></div>
            <em>小金库 ¥${view.coins}</em>
          </div>
          <div class="summary-doodle" aria-hidden="true">${cupDoodle('今日的甜度，刚刚好')}</div>
          <div class="summary-actions">
            <button type="button" class="btn btn-primary btn-big" data-action="nextFromSummary">
              ${icon('cart')} 去小店整备 ${icon('arrow')}
            </button>
          </div>
          <p class="summary-foot">${icon('leaf')} 所有进度都已经自动保存在浏览器里。</p>
        </article>
      </div>
    `;
    this.setSound(this.soundEnabled);
  }

  showShop(view: ShopView) {
    const prevBody = this.screenRoot.querySelector<HTMLElement>('.shop-body');
    const prevSide = this.screenRoot.querySelector<HTMLElement>('.shop-side');
    const prevSection = this.screenRoot.querySelector<HTMLElement>('.upgrade-section');
    const scroll = {
      body: prevBody?.scrollTop ?? 0,
      side: prevSide?.scrollTop ?? 0,
      section: prevSection?.scrollTop ?? 0,
    };
    const active =
      document.activeElement instanceof HTMLElement && this.screenRoot.contains(document.activeElement)
        ? document.activeElement.closest<HTMLElement>('[data-action]')
        : null;
    const focusAction = active?.dataset.action;
    const focusId = active?.dataset.id;

    this.screenRoot.innerHTML = `
      <div class="screen overlay-screen shop-screen">
        <div class="scrim"></div>
        <article class="shop-shell" role="dialog" aria-modal="true" aria-label="小店整备">
          <header class="shop-head">
            <div>
              <span class="shop-kicker">${icon('cart')} 打烊后的小店整备 · DAY ${pad2(view.day + 1)}</span>
              <h2>把明天，打理得更温柔一点</h2>
            </div>
            <div class="shop-balance"><span>小金库</span><b>${icon('coin')} ${view.coins}</b></div>
          </header>
          <div class="shop-body">
            <aside class="shop-side">
              <div class="next-day-card" style="--sky-top:${view.nextTheme.skyTop};--sky-bottom:${view.nextTheme.skyBottom};--accent:${view.nextTheme.accent}">
                <span class="next-kicker">NEXT DAY</span>
                <div class="next-orb"><i></i><span>${view.nextTheme.name}</span></div>
                <p>“${view.nextTheme.hint}”</p>
                <div class="next-facts">
                  <span><small>目标</small><b>¥${view.nextGoal}</b></span>
                  <span><small>时长</small><b>${formatClock(view.nextShift)}</b></span>
                </div>
                ${
                  view.nextNewDrinks.length
                    ? `<div class="next-drinks">
                        <span>${icon('sparkle')} 新配方</span>
                        ${view.nextNewDrinks
                          .map(
                            (drink) => `<div class="next-drink-row">${miniCup(drink, 'next-cup')}<b>${drink.name}</b><em>¥${drink.price}</em></div>`,
                          )
                          .join('')}
                      </div>`
                    : ''
                }
                <button type="button" class="btn btn-primary btn-big" data-action="nextDay">开始第 ${view.day + 1} 天 ${icon('arrow')}</button>
              </div>
              <div class="evening-card ${view.city.slotsLeft <= 0 ? 'is-spent' : ''}">
                <div class="evening-head">
                  <div><span class="evening-kicker">${icon('moon')} 今晚的傍晚</span><b>${view.city.slotsLeft > 0 ? '出门走走？' : '今晚已收尾'}</b></div>
                  ${citySlotsHtml(view.city.slotsLeft)}
                </div>
                <p>${view.city.slotsLeft > 0 ? `还有 ${view.city.slotsLeft} 段时光。去街上采购，或者翻翻旅行手账。` : '今晚的散步结束了，明晚还有新的 3 段时光。'}</p>
                <div class="evening-supplies">
                  <span>${icon('cart')} 明日特供</span>
                  <div>${supplyChips(view.supplies, '购物篮还空着')}</div>
                </div>
                <div class="evening-actions">
                  <button type="button" class="btn btn-ghost" data-action="openCity">${icon('car')} 傍晚出门</button>
                  <button type="button" class="btn ${view.city.plane ? 'btn-primary' : 'btn-ghost'}" data-action="openTravel" ${view.city.plane ? '' : 'disabled'}>
                    ${icon(view.city.plane ? 'plane' : 'lock')} 旅行手账
                    <small>${view.city.travelDone}/${TRAVEL_CHAPTERS.length}</small>
                  </button>
                </div>
                <div class="evening-meta">
                  <span>${icon('heartWish')} 旅行伴手礼</span>
                  <b>小费 +${Math.round(view.city.travelBonus * 100)}%</b>
                  ${view.city.plane ? `<em>已去过 ${view.city.visits} 次夜晚散步</em>` : '<em>先去航空俱乐部拿钥匙</em>'}
                </div>
              </div>
              <div class="shop-tip">${icon('heart')} 已经服务过 ${view.servedTotal} 位客人，辛苦了。</div>
            </aside>
            <section class="upgrade-section">
              <div class="upgrade-head">
                <div><span>小店成长</span><h3>挑一件让明天更顺手的家具</h3></div>
                <p>升级会立刻生效，也会留在每一段营业里。</p>
              </div>
              <div class="upgrade-grid">
                ${UPGRADES.map((upgrade) => {
                  const level = view.upgrades[upgrade.id];
                  const maxed = level >= upgrade.maxLevel;
                  const cost = maxed ? 0 : upgrade.costs[level];
                  const affordable = view.coins >= cost;
                  return `<article class="upgrade-card ${maxed ? 'is-maxed' : ''}" style="--accent:${upgrade.accent}">
                    <div class="upgrade-card-top">
                      <span class="upgrade-icon">${icon(UPGRADE_ICONS[upgrade.id])}</span>
                      <div class="level-dots">
                        ${Array.from({ length: upgrade.maxLevel }, (_, i) => `<i class="${i < level ? 'is-on' : ''}"></i>`).join('')}
                      </div>
                    </div>
                    <span class="upgrade-latin">${upgrade.latin}</span>
                    <h4>${upgrade.name}</h4>
                    <p>${upgrade.description}</p>
                    <p class="upgrade-flavor">“${upgrade.flavor}”</p>
                    <div class="upgrade-effect">
                      <small>当前</small><b>${UPGRADE_EFFECTS[upgrade.id](level)}</b>
                      ${maxed ? '' : `<em>→ ${UPGRADE_EFFECTS[upgrade.id](level + 1)}</em>`}
                    </div>
                    <button type="button" class="btn btn-buy" data-action="buyUpgrade" data-id="${upgrade.id}" ${maxed || !affordable ? 'disabled' : ''}>
                      ${maxed ? `${icon('check')} 已满级` : `<span>${icon('coin')} ${cost}</span><small>${affordable ? '升级' : '金币不够'}</small>`}
                    </button>
                  </article>`;
                }).join('')}
              </div>
              ${
                view.limited.length
                  ? `<div class="limited-section">
                      <div class="upgrade-head">
                        <div><span>LOOSE PAGES · 限定配方</span><h3>从城市与远方，带回一点点新的甜</h3></div>
                        <p>已经收进配方手账，也会加入明天的刷单池。</p>
                      </div>
                      <div class="limited-grid">
                        ${view.limited
                          .map(
                            (drink) => `<article class="limited-card" style="--drink:${drink.color};--drink-top:${drink.colorTop};--accent:${drink.accent}">
                              ${miniCup(drink, 'limited-cup')}
                              <div class="limited-copy">
                                <span class="limited-badge ${drink.source === 'travel' ? 'is-travel' : 'is-city'}">${drink.source === 'travel' ? `${icon('plane')} 旅行限定` : `${icon('car')} 城市限定`}</span>
                                <b>${drink.name}</b>
                                <small>${baseRecipeLineFor(categoryOf(drink), drink.recipe)}</small>
                              </div>
                              <em>¥${drink.price}</em>
                            </article>`,
                          )
                          .join('')}
                      </div>
                    </div>`
                  : ''
              }
            </section>
          </div>
        </article>
      </div>
    `;
    this.setSound(this.soundEnabled);

    const nextBody = this.screenRoot.querySelector<HTMLElement>('.shop-body');
    if (nextBody) nextBody.scrollTop = scroll.body;
    const nextSide = this.screenRoot.querySelector<HTMLElement>('.shop-side');
    if (nextSide) nextSide.scrollTop = scroll.side;
    const nextSection = this.screenRoot.querySelector<HTMLElement>('.upgrade-section');
    if (nextSection) nextSection.scrollTop = scroll.section;

    if (focusAction) {
      const selector = focusId
        ? `[data-action="${focusAction}"][data-id="${focusId}"]`
        : `[data-action="${focusAction}"]`;
      this.screenRoot.querySelector<HTMLElement>(selector)?.focus({ preventScroll: true });
    }
  }

  showCity(view: CityView) {
    const prevPanel = this.screenRoot.querySelector<HTMLElement>('.city-panel');
    const panelScroll = prevPanel?.scrollTop ?? 0;
    const activeSpot = view.activeSpot ? CITY_SPOTS.find((spot) => spot.id === view.activeSpot) ?? null : null;
    const carSpot = CITY_MAP[view.activeSpot ?? 'shop'];
    const story = view.story;

    const buildings = CITY_SPOTS.map((spot) => {
      const pos = CITY_MAP[spot.id];
      const isDone = view.usedSpots.includes(spot.id) && spot.id !== 'market' && spot.id !== 'home' && spot.id !== 'shop';
      const isActive = view.activeSpot === spot.id;
      const isClosed = view.slotsLeft <= 0 && spot.id !== 'home' && spot.id !== 'shop' && !isActive;
      const planeHere = spot.id === 'airclub' && view.plane;
      return `<button type="button" class="city-building is-${spot.id} ${isActive ? 'is-active' : ''} ${isDone ? 'is-done' : ''} ${isClosed ? 'is-closed' : ''}" style="--x:${pos.x}%;--y:${pos.y}%;--spot:${spot.color}" data-action="visitCitySpot" data-id="${spot.id}" aria-label="${spot.name}">
        <span class="city-building-sign">${icon(spot.icon)}<b>${CITY_SHORT[spot.id]}</b></span>
        <span class="city-building-roof"></span>
        <span class="city-building-body">
          <i class="city-window w1"></i><i class="city-window w2"></i>
          <i class="city-window w3"></i>
          <i class="city-door"></i>
        </span>
        <span class="city-building-awning"></span>
        ${isDone ? '<span class="city-building-tag">今晚来过</span>' : ''}
        ${isActive ? '<span class="city-building-tag is-here">就在这里</span>' : ''}
        ${planeHere ? '<span class="city-building-tag is-plane">飞机已解锁</span>' : ''}
      </button>`;
    }).join('');

    const marketPanel = () => {
      const carried = view.supplies.length;
      const full = carried >= CITY_SUPPLY_LIMIT;
      return `
        <div class="city-panel-head" style="--spot:${activeSpot?.color ?? '#ffb0a2'}">
          <span class="city-panel-icon">${icon('cart')}</span>
          <div><small>MORNING MARKET</small><h3>阿婆原料市场</h3><p>“挑点新鲜的回去，明天客人会尝出来的。”</p></div>
        </div>
        <p class="city-panel-note">${icon('moon')} 每采购一次消耗 1 段时光 · 最多带 ${CITY_SUPPLY_LIMIT} 份特供</p>
        <div class="market-list">
          ${view.market
            .map(
              (item) => `<article class="market-item ${item.count > 0 ? 'has-item' : ''}" style="--supply:${item.def.color}">
                <span class="market-icon">${icon(item.def.icon)}</span>
                <div class="market-copy">
                  <b>${item.def.name}${item.count > 0 ? `<em>×${item.count}</em>` : ''}</b>
                  <p>${item.def.description}</p>
                  <span>${item.def.effectLabel}</span>
                </div>
                <button type="button" class="btn btn-buy market-buy" data-action="buySupply" data-id="${item.def.id}" ${item.canBuy && !full ? '' : 'disabled'}>
                  <span>${icon('coin')} ${item.def.cost}</span>
                  <small>${full ? '带不下了' : view.slotsLeft <= 0 ? '时光用完' : view.coins < item.def.cost ? '金币不够' : '采购'}</small>
                </button>
              </article>`,
            )
            .join('')}
        </div>
        <div class="market-foot">
          <span>已备特供 <b>${carried} / ${CITY_SUPPLY_LIMIT}</b></span>
          <div>${supplyChips(view.supplies, '购物篮还空着')}</div>
        </div>
      `;
    };

    const storyPanel = (current: NonNullable<CityView['story']>) => {
      if (current.replyIndex === null) {
        return `
          <div class="city-story" style="--spot:${activeSpot?.color ?? '#ffb0a2'}">
            <span class="city-story-kicker">${current.kicker}</span>
            <h3>${current.title}</h3>
            <p class="city-story-text">${current.text}</p>
            <div class="city-story-choices">
              ${current.choices
                .map(
                  (choice, i) => `<button type="button" class="city-story-choice" data-action="cityStoryChoice" data-index="${i}">
                    <span>${pad2(i + 1)}</span><b>${choice.label}</b>${icon('chevron')}
                  </button>`,
                )
                .join('')}
            </div>
            <span class="city-story-foot">${icon('heart')} ${current.repeat ? '这段故事已经听过，奖励会少一些。' : '选一个吧，今晚没有对错。'}</span>
          </div>
        `;
      }
      return `
        <div class="city-story is-replied" style="--spot:${activeSpot?.color ?? '#ffb0a2'}">
          <span class="city-story-kicker">${current.kicker}</span>
          <h3>${current.title}</h3>
          <div class="story-reply">
            ${icon('bubble')}
            <p>${current.choices[current.replyIndex]?.reply ?? ''}</p>
          </div>
          ${
            current.rewardLines.length
              ? `<div class="story-rewards">
                  <span>${icon('sparkle')} 今晚的收获</span>
                  <div>${current.rewardLines.map((line) => `<b>${line}</b>`).join('')}</div>
                </div>`
              : ''
          }
          ${
            current.recipe
              ? `<div class="story-recipe" style="--drink:${current.recipe.color};--accent:${current.recipe.accent}">
                  ${miniCup(current.recipe, 'story-recipe-cup')}
                  <div><span>新配方收进手账</span><b>${current.recipe.name}</b><small>${baseRecipeLineFor(categoryOf(current.recipe), current.recipe.recipe)}</small></div>
                  ${catBadge(current.recipe, 'is-mini')}
                </div>`
              : ''
          }
          ${
            current.planeUnlocked && view.activeSpot === 'airclub'
              ? `<div class="story-plane">
                  ${icon('plane')}
                  <div><b>小桃号，随时可以起飞</b><small>旅行手账已经解锁，每章需要 2 段傍晚时光与 ¥${TRAVEL_COST_COINS} 航油。</small></div>
                </div>`
              : ''
          }
          <div class="city-story-actions">
            <button type="button" class="btn btn-primary" data-action="cityBackToPanel">继续走走 ${icon('arrow')}</button>
            ${view.plane ? `<button type="button" class="btn btn-ghost" data-action="openTravel">${icon('plane')} 翻开旅行手账</button>` : ''}
          </div>
        </div>
      `;
    };

    const visitPanel = () => {
      const spot = activeSpot!;
      if (view.slotsLeft <= 0) {
        return `<div class="city-used">
          <span class="city-used-icon is-closed">${icon('moon')}</span>
          <h3>今晚的时间用完了</h3>
          <p>街上的灯还亮着，不过该回去啦。${CITY_SHORT[spot.id]}明晚见。</p>
          <button type="button" class="btn btn-primary" data-action="closeCity">结束今晚，回小店 ${icon('arrow')}</button>
        </div>`;
      }
      return `<div class="city-place-card" style="--spot:${spot.color}">
        <span class="city-place-icon">${icon(spot.icon)}</span>
        <small>${spot.latin}</small>
        <h3>${spot.name}</h3>
        <p>${spot.tagline}</p>
        <button type="button" class="btn btn-primary btn-big" data-action="visitCitySpot" data-id="${spot.id}">
          ${icon('door')} 推门进去 <em>消耗 1 段时光</em>
        </button>
        <span class="city-place-hint">${icon('moon')} 拜访会触发一段街坊故事，没有失败。</span>
      </div>`;
    };

    const panel = (() => {
      if (!activeSpot) {
        return `<div class="city-wander">
          <span class="city-wander-kicker">${icon('compass')} WHERE TO TONIGHT?</span>
          <h3>${view.slotsLeft > 0 ? '今晚想去哪儿走走？' : '今晚就到这里吧。'}</h3>
          <p>${view.slotsLeft > 0 ? '买点明天的原料，去面包房坐一会儿，或者只是看看花店的灯。' : '空着手回家也可以，明天店里还有一整天的甜。'}</p>
          <div class="city-wander-slots">
            ${citySlotsHtml(view.slotsLeft)}
            <span>${view.slotsLeft > 0 ? `还剩 ${view.slotsLeft} 段傍晚时光` : '时光已经用完，可以回家啦'}</span>
          </div>
          <div class="city-wander-block">
            <span>${icon('cart')} 已备特供</span>
            <div>${supplyChips(view.supplies, '购物篮还空着')}</div>
          </div>
          <div class="city-wander-block">
            <span>${icon('recipe')} 从街上带回的配方</span>
            <div class="city-recipe-chips">
              ${
                view.recipes.length
                  ? view.recipes
                      .map((drink) => `<span class="city-recipe-chip" style="--drink:${drink.color};--accent:${drink.accent}">${icon('recipe')}<b>${drink.name}</b></span>`)
                      .join('')
                  : '<em>还没有。去和面包房、花店或航空俱乐部的人聊聊吧。</em>'
              }
            </div>
          </div>
          ${
            view.plane
              ? `<div class="city-travel-call">
                  <span class="city-travel-icon">${icon('plane')}</span>
                  <div><b>小桃号在跑道边等你</b><small>旅行手账已解锁 · 已完成 ${view.travelDone}/${TRAVEL_CHAPTERS.length} 章 · 小费 +${Math.round(view.travelBonus * 100)}%</small></div>
                  <button type="button" class="btn btn-ghost btn-small" data-action="openTravel">翻手账</button>
                </div>`
              : `<div class="city-travel-call is-locked">${icon('lock')}<div><b>去更远的地方</b><small>第一次拜访航空俱乐部，就能拿到小桃号的钥匙。</small></div></div>`
          }
          <p class="city-wander-foot">${icon('leaf')} 回小店或回家，都会结束今晚的散步。</p>
        </div>`;
      }
      if (story) return storyPanel(story);
      if (activeSpot.id === 'market') return marketPanel();
      if (activeSpot.id === 'home') {
        return `<div class="city-home">
          <span class="city-home-moon">${icon('moon')}</span>
          <h3>路灯亮了</h3>
          <p>${view.slotsLeft > 0 ? `还剩 ${view.slotsLeft} 段时光。回家就会结束今晚的散步。` : '今晚的散步就到这里，回家煮一碗热汤吧。'}</p>
          <button type="button" class="btn btn-primary btn-big" data-action="closeCity">结束今晚，回小店 ${icon('arrow')}</button>
        </div>`;
      }
      if (activeSpot.id === 'shop') {
        return `<div class="city-shop-card">
          <span class="city-shop-icon">${icon('peach')}</span>
          <small>PEACH &amp; MINT</small>
          <h3>桃桃茶屋</h3>
          <p>门里还留着一盏小灯。回去把明天的杯子摆好，也算给今晚收个尾。</p>
          <button type="button" class="btn btn-primary btn-big" data-action="closeCity">回到小店 ${icon('arrow')}</button>
          <span class="city-place-hint">${icon('leaf')} 回小店会结束今晚的散步。</span>
        </div>`;
      }
      if (view.usedSpots.includes(activeSpot.id)) {
        return `<div class="city-used">
          <span class="city-used-icon">${icon('check')}</span>
          <h3>今晚已经来过这里</h3>
          <p>${activeSpot.tagline} 明天傍晚再来，也许会遇见另一段故事。</p>
          <button type="button" class="btn btn-ghost" data-action="cityBackToPanel">回地图 ${icon('arrow')}</button>
        </div>`;
      }
      return visitPanel();
    })();

    this.screenRoot.innerHTML = `
      <div class="screen overlay-screen city-screen" role="dialog" aria-modal="true" aria-label="傍晚的城市散步">
        <div class="city-wash"></div>
        <div class="city-layout">
          <header class="city-head">
            <div class="city-title">
              <span class="city-kicker">${icon('moon')} EVENING WALK · DAY ${pad2(view.day + 1)}</span>
              <h2>傍晚，去街上走走</h2>
            </div>
            <div class="city-head-right">
              <div class="city-slot-copy">${citySlotsHtml(view.slotsLeft)}<span>${view.slotsLeft > 0 ? `还剩 ${view.slotsLeft} 段时光` : '今晚的时光用完了'}</span></div>
              <span class="city-coins">${icon('coin')} ${view.coins}</span>
              <button type="button" class="btn btn-ghost city-back" data-action="closeCity">回小店</button>
            </div>
          </header>
          <div class="city-stage">
            <div class="city-map">
              <div class="city-dusk">
                <span class="city-sun"></span>
                <span class="city-cloud sc1"></span><span class="city-cloud sc2"></span>
                <span class="city-star st1">✦</span><span class="city-star st2">✦</span><span class="city-star st3">✦</span>
              </div>
              <svg class="city-road" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <path d="M15 84 C26 68 23 56 35 52 S52 38 57 34 S73 36 78 48 S86 66 88 82" />
                <path d="M35 52 C34 62 37 74 41 90" />
              </svg>
              <span class="city-tree tr1"></span><span class="city-tree tr2"></span>
              <span class="city-tree tr3"></span><span class="city-tree tr4"></span>
              <span class="city-lamp lp1"></span><span class="city-lamp lp2"></span><span class="city-lamp lp3"></span>
              ${buildings}
              <span class="city-car" style="left:${carSpot.x + 3}%;top:${carSpot.y + 1}%">
                ${icon('car')}<i class="city-car-beam"></i>
              </span>
              <span class="city-map-sign">PEACH &amp; MINT · 一条回家的小路</span>
            </div>
            <aside class="city-panel">${panel}</aside>
          </div>
        </div>
      </div>
    `;

    const nextPanel = this.screenRoot.querySelector<HTMLElement>('.city-panel');
    if (nextPanel) nextPanel.scrollTop = panelScroll;
    this.setSound(this.soundEnabled);
  }

  showTravel(view: TravelView) {
    const prevList = this.screenRoot.querySelector<HTMLElement>('.travel-chapters');
    const listScroll = prevList?.scrollTop ?? 0;
    const nextCard = view.chapters.find((card) => card.unlocked && !card.record);
    const interrupted = view.interrupted;

    const chapterCards = view.chapters
      .map((card) => {
        const chapter = card.def;
        const recipe = DRINKS_MAP[chapter.recipeId];
        const previous = TRAVEL_CHAPTERS.find((entry) => entry.index === chapter.index - 1);
        const isInterrupted = interrupted?.id === chapter.id;
        const canStart =
          view.plane &&
          card.unlocked &&
          !card.record &&
          !interrupted &&
          view.slotsLeft >= TRAVEL_COST_SLOTS &&
          view.coins >= TRAVEL_COST_COINS;
        const state = card.record ? 'is-done' : card.unlocked ? 'is-open' : 'is-locked';
        return `<article class="chapter-card ${state} theme-${chapter.id} ${isInterrupted ? 'is-resuming' : ''}">
          <div class="chapter-postcard">
            <span class="chapter-no">CH.${pad2(chapter.index)}</span>
            <span class="chapter-stamp">${chapter.postcard.stamp}<i>${icon(chapter.postcard.stampIcon)}</i></span>
            <div class="chapter-scenery" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
            <div class="chapter-postcard-copy"><small>${chapter.name}</small><b>${chapter.latin}</b><em>${chapter.place}</em></div>
            ${card.record ? `<span class="chapter-stars">${travelStars(card.record.stars)}</span>` : ''}
          </div>
          <div class="chapter-copy">
            <span class="chapter-place">${icon('location')} ${chapter.place}${isInterrupted ? `<span class="chapter-resume-tag">${icon('plane')} 旅程未完成</span>` : ''}</span>
            <h3>${chapter.subtitle}</h3>
            ${
              recipe
                ? `<div class="chapter-recipe">
                    ${miniCup(recipe, 'chapter-cup')}
                    <div><span>${card.record ? '带回的配方' : '这一站的限定配方'}</span><b>${recipe.name}</b><small>${baseRecipeLineFor(categoryOf(recipe), recipe.recipe)}</small></div>
                    <em>¥${recipe.price}</em>
                  </div>`
                : ''
            }
            <div class="chapter-loot">
              <span>${icon(chapter.souvenirIcon)} ${chapter.souvenir}</span>
              <span>${icon('postcard')} ${chapter.postcard.title}</span>
            </div>
            ${
              card.record
                ? `<div class="chapter-done-meta">
                    <span>${icon('check')} 第 ${card.record.day} 天往返 · 小费 +2%</span>
                    <button type="button" class="btn btn-ghost btn-small" data-action="travelRevisit" data-id="${chapter.id}">重温明信片</button>
                  </div>`
                : card.unlocked
                  ? isInterrupted
                    ? `<div class="chapter-go">
                        <button type="button" class="btn btn-primary" data-action="resumeTravelChapter">
                          ${icon('plane')} 继续 · ${chapter.name}
                        </button>
                        <small>机票与航油已经付过，从这一章开头接着走。</small>
                      </div>`
                    : `<div class="chapter-go">
                        <button type="button" class="btn btn-primary" data-action="startTravelChapter" data-id="${chapter.id}" ${canStart ? '' : 'disabled'}>
                          ${icon('plane')} 启程 · ${chapter.name}
                        </button>
                        <small>${
                          interrupted
                            ? '先把未完成的旅程走完。'
                            : !view.plane
                              ? '还需要小桃号的钥匙。'
                              : view.slotsLeft < TRAVEL_COST_SLOTS
                                ? '傍晚时光不够，下次再出发吧。'
                                : view.coins < TRAVEL_COST_COINS
                                  ? '航油金币还不够。'
                                  : `消耗 ${TRAVEL_COST_SLOTS} 段时光 · ¥${TRAVEL_COST_COINS} 航油`
                        }</small>
                      </div>`
                  : `<div class="chapter-lock">${icon('lock')} 完成「${previous?.name ?? '上一章'}」后解锁</div>`
            }
          </div>
        </article>`;
      })
      .join('');

    const resumeBanner = interrupted
      ? `<div class="travel-resume">
          <span class="travel-resume-icon">${icon('plane')}<i></i></span>
          <div class="travel-resume-copy">
            <small>${icon('postcard')} 未完成的旅程 · TICKET KEPT</small>
            <b>第 ${interrupted.index} 站 · ${interrupted.name}</b>
            <p>上次的机票和航油已经付过。从这一章开头继续，不会再扣一次。</p>
          </div>
          <button type="button" class="btn btn-primary" data-action="resumeTravelChapter">继续旅程 ${icon('arrow')}</button>
        </div>`
      : '';

    this.screenRoot.innerHTML = `
      <div class="screen overlay-screen travel-screen travel-journal" role="dialog" aria-modal="true" aria-label="旅行手账">
        <div class="journal-sky">
          <span class="journal-moon"></span>
          <span class="journal-cloud jc1"></span><span class="journal-cloud jc2"></span><span class="journal-cloud jc3"></span>
          <span class="journal-plane">${icon('plane')}<i class="journal-trail"></i></span>
          <span class="journal-star js1">✦</span><span class="journal-star js2">✦</span><span class="journal-star js3">✦</span>
        </div>
        <div class="travel-journal-inner">
          <header class="travel-head">
            <div>
              <span class="travel-kicker">${icon('compass')} LITTLE PEACH AIR · 旅行手账</span>
              <h2>去远方，带一杯回来</h2>
              <p>${interrupted ? '一张没走完的机票还夹在手账里，先去把它走完吧。' : view.plane ? '小桃号加满了油，四张明信片在等一个晴天。' : '先去航空俱乐部，把旧机库门后的钥匙找出来。'}</p>
            </div>
            <div class="travel-head-right">
              <div class="travel-slot-copy">${citySlotsHtml(view.slotsLeft)}<span>傍晚时光</span></div>
              <span class="travel-coins">${icon('coin')} ${view.coins}</span>
              <span class="travel-plane-state ${view.plane ? 'is-ready' : ''}">${icon(view.plane ? 'plane' : 'lock')} ${view.plane ? '小桃号待飞' : '尚未解锁'}</span>
              <button type="button" class="btn btn-ghost" data-action="closeTravel">回小店</button>
            </div>
          </header>
          <div class="travel-journal-body">
            <aside class="travel-plane-card">
              <div class="travel-plane-art">
                <span class="plane-cloud pc1"></span><span class="plane-cloud pc2"></span>
                <span class="plane-horizon"></span>
                <span class="plane-trail"></span>
                ${icon('plane')}
              </div>
              <span class="travel-plane-kicker">LITTLE PEACH AIR</span>
              <h3>小桃号</h3>
              <p>奶油色的小飞机。飞得慢，但每次落地，都会带回一点能让小店变好的东西。</p>
              <div class="travel-costs">
                <span>${icon('moon')} 每章 ${TRAVEL_COST_SLOTS} 段傍晚时光</span>
                <span>${icon('coin')} 航油 ¥${TRAVEL_COST_COINS}</span>
              </div>
              <div class="travel-souvenir-card">
                <span>${icon('heartWish')} 伴手礼陈列</span>
                <b>小费永久 +${Math.round(view.bonus * 100)}%</b>
                <small>已完成 ${view.completed} / ${TRAVEL_CHAPTERS.length} 章</small>
                <div class="travel-shelf">
                  ${TRAVEL_CHAPTERS.map(
                    (chapter) => `<i class="${view.chapters.find((card) => card.def.id === chapter.id)?.record ? 'is-on' : ''}" title="${chapter.souvenir}">${icon(chapter.souvenirIcon)}</i>`,
                  ).join('')}
                </div>
              </div>
              ${nextCard ? `<p class="travel-next-hint">${icon('sparkle')} 下一站：${nextCard.def.name}</p>` : `<p class="travel-next-hint">${icon('sparkle')} 四张明信片都收齐了。</p>`}
            </aside>
            <section class="travel-chapters">${resumeBanner}${chapterCards}</section>
          </div>
          <footer class="travel-foot">
            <span>${icon('leaf')} 旅行不推进营业日，也不打断小店的核心节奏。</span>
            <button type="button" class="btn btn-primary" data-action="closeTravel">${icon('home')} 回到小店</button>
          </footer>
        </div>
      </div>
    `;

    const nextList = this.screenRoot.querySelector<HTMLElement>('.travel-chapters');
    if (nextList) nextList.scrollTop = listScroll;
    this.setSound(this.soundEnabled);
  }

  showTravelSession(view: TravelSessionView) {
    const { chapter, phase } = view;
    const recipe = DRINKS_MAP[chapter.recipeId];
    const progress = view.revisit ? ['序章', '明信片'] : ['序章', '选择', '小游戏', '明信片'];
    const progressIndex = view.revisit ? (phase === 'result' ? 1 : 0) : phase === 'scene' ? 0 : phase === 'choice' ? 1 : phase === 'mini' ? 2 : 3;

    const vignette = `<aside class="stage-vignette" aria-hidden="true">
      <div class="chapter-scenery"><i></i><i></i><i></i><i></i></div>
      <span class="chapter-no">CH.${pad2(chapter.index)}</span>
      <span class="chapter-stamp">${chapter.postcard.stamp}<i>${icon(chapter.postcard.stampIcon)}</i></span>
      <div class="stage-vignette-copy">
        <small>${chapter.latin}</small>
        <b>${chapter.postcard.title}</b>
        <em>${chapter.place} · 第 ${chapter.index} 站</em>
      </div>
    </aside>`;

    let stage = '';
    if (phase === 'scene') {
      stage = `<article class="travel-stage">
        ${vignette}
        <div class="stage-body">
          <span class="stage-kicker">${icon('location')} ${chapter.place}</span>
          <div class="travel-scene-text">
            ${chapter.scene
              .slice(0, view.beat + 1)
              .map((line, i) => `<p class="${i === view.beat ? 'is-current' : ''}">${line}</p>`)
              .join('')}
          </div>
          <div class="scene-actions">
            <span>${icon('compass')} ${view.revisit ? '正在重温这一站的文字。' : chapter.scene.length - 1 - view.beat > 0 ? `还有 ${chapter.scene.length - 1 - view.beat} 段风景` : '先听听这里的声音。'}</span>
            <button type="button" class="btn btn-primary btn-big" data-action="travelNext">
              ${view.beat < chapter.scene.length - 1 ? '继续往前' : view.revisit ? '翻到明信片' : '走近看看'} ${icon('arrow')}
            </button>
          </div>
        </div>
      </article>`;
    } else if (phase === 'choice') {
      stage = `<article class="travel-stage">
        ${vignette}
        <div class="stage-body">
          <span class="stage-kicker">${icon('bubble')} ${chapter.choicePrompt}</span>
          <div class="travel-choice-list">
            ${chapter.choices
              .map(
                (choice, i) => `<button type="button" class="travel-choice" data-action="travelChoose" data-index="${i}">
                  <span>${pad2(i + 1)}</span><b>${choice.label}</b>${icon('chevron')}
                </button>`,
              )
              .join('')}
          </div>
          <p class="stage-foot">${icon('heart')} 两个选择都不会失败，只会让这段回忆有一点不同。</p>
        </div>
      </article>`;
    } else if (phase === 'mini' && view.mini) {
      const mini = view.mini;
      const miniMarkup =
        mini.mode === 'timing' && chapter.timing
          ? `<div class="travel-timing ${mini.done ? 'is-done' : ''}">
              <div class="timing-top">
                <span>${icon('clock')} ${chapter.timing.hint}</span>
                <b>${mini.taps} / ${mini.tapsNeeded} ${chapter.timing.unit}</b>
              </div>
              <div class="timing-track">
                <span class="timing-zone" style="left:${50 - mini.zone * 100}%;width:${mini.zone * 200}%"></span>
                <span class="timing-center"></span>
                <span class="timing-pointer" data-travel-pointer></span>
              </div>
              <div class="timing-scale"><span>${chapter.timing.scale[0]}</span><span>${chapter.timing.scale[1]}</span><span>${chapter.timing.scale[2]}</span></div>
              <div class="timing-pips">
                ${Array.from(
                  { length: mini.tapsNeeded },
                  (_, i) => `<i class="${mini.scores[i] === undefined ? '' : mini.scores[i] >= 0.82 ? 'is-perfect' : mini.scores[i] >= 0.52 ? 'is-good' : 'is-miss'}">${icon('sparkle')}</i>`,
                ).join('')}
              </div>
              ${
                mini.done
                  ? `<div class="timing-done">
                      <div><span>${icon('sparkle')} ${chapter.timing.doneLine}</span><div class="mini-stars">${travelStars(mini.stars)}</div></div>
                      <button type="button" class="btn btn-primary btn-big" data-action="travelNext">看看明信片 ${icon('arrow')}</button>
                    </div>`
                  : `<button type="button" class="btn btn-primary btn-big timing-tap" data-action="travelTimingTap">${icon('sparkle')} ${chapter.timing.tapLabel}</button>
                     <p class="timing-tip">${icon('leaf')} 指针进入薄荷色区域时按下，没有失败，只有更漂亮的一接。</p>`
              }
            </div>`
          : chapter.quiz
            ? (() => {
                const question = chapter.quiz[mini.quizIndex];
                if (!question) return '';
                const answered = mini.quizAnswered;
                return `<div class="travel-quiz">
                  <div class="quiz-head">
                    <span>${icon('notebook')} 第 ${mini.quizIndex + 1} / ${mini.quizTotal} 张点单便签</span>
                    <b>${mini.quizCorrect} 答对</b>
                  </div>
                  <blockquote>${question.prompt}</blockquote>
                  <p class="quiz-hint">${icon('sparkle')} ${question.hint}</p>
                  <div class="quiz-options">
                    ${question.options
                      .map((option, i) => {
                        const chosen = answered === i;
                        const showCorrect = answered !== null && option.correct;
                        return `<button type="button" class="quiz-option ${showCorrect ? 'is-correct' : ''} ${chosen && !option.correct ? 'is-wrong' : ''}" data-action="travelQuizAnswer" data-index="${i}" ${answered !== null ? 'disabled' : ''}>
                          <span class="quiz-mark">${showCorrect ? icon('check') : chosen && !option.correct ? icon('close') : icon('bubble')}</span>
                          <span><b>${option.label}</b><small>${option.sub}</small></span>
                        </button>`;
                      })
                      .join('')}
                  </div>
                  ${
                    answered !== null
                      ? `<div class="quiz-feedback ${question.options[answered]?.correct ? 'is-good' : 'is-bad'}">
                          <p>${question.options[answered]?.correct ? '正是这一杯。等车的人接过杯子，肩膀终于松了下来。' : '这一杯好像不太对。别急，再看一眼便签上的三个条件。'}</p>
                          <button type="button" class="btn btn-ghost" data-action="travelQuizNext">${mini.quizIndex + 1 >= mini.quizTotal ? '完成核对' : '下一张便签'} ${icon('arrow')}</button>
                        </div>`
                      : ''
                  }
                  ${
                    mini.quizDone
                      ? `<div class="quiz-done">
                          <span>${icon('sparkle')} 全部核对完成，${mini.quizCorrect} / ${mini.quizTotal} 杯刚刚好。</span>
                          <div class="mini-stars">${travelStars(mini.stars)}</div>
                          <button type="button" class="btn btn-primary btn-big" data-action="travelNext">看看明信片 ${icon('arrow')}</button>
                        </div>`
                      : ''
                  }
                </div>`;
              })()
            : '';

      stage = `<article class="travel-stage travel-stage-mini">
        ${vignette}
        <div class="stage-body">
          ${
            view.reply
              ? `<div class="mini-reply">${icon('bubble')}<p>${view.reply}</p></div>`
              : ''
          }
          <span class="stage-kicker">${icon('stars')} ${chapter.miniGame === 'timing' ? (chapter.id === 'tea_mountain' ? '一芽两叶' : chapter.id === 'star_island' ? '接住星光' : '浪花正好') : '深夜点单核对'}</span>
          ${miniMarkup}
          <p class="stage-foot">${icon('leaf')} 小游戏不会失败，只影响明信片上的星星和金币。</p>
        </div>
      </article>`;
    } else if (phase === 'result') {
      stage = `<div class="travel-result">
        <article class="travel-postcard theme-${chapter.id}">
          <div class="postcard-scenery" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
          <span class="postcard-stamp">${chapter.postcard.stamp}<i>${icon(chapter.postcard.stampIcon)}</i></span>
          <div class="postcard-copy">
            <span>POSTCARD · ${chapter.latin}</span>
            <h3>${chapter.postcard.title}</h3>
            <p>${chapter.postcard.caption}</p>
            <em>${chapter.place} · 桃桃茶屋 收</em>
          </div>
        </article>
        <div class="travel-loot">
          <div class="loot-head">
            <span>${view.revisit ? '那一年的明信片' : '这一趟带回来的东西'}</span>
            <div class="mini-stars">${travelStars(view.stars)}</div>
          </div>
          ${
            view.revisit
              ? `<p class="loot-revisit">你重新读了一遍那天的风景。明信片背面还留着当时写的字，奖励不会重复发放。</p>`
              : `<div class="loot-grid">
                  <div class="loot-item is-coin">${icon('coin')}<span><small>旅行金币</small><b>+${view.earned}</b></span></div>
                  ${
                    recipe
                      ? `<div class="loot-item is-recipe">${miniCup(recipe, 'loot-cup')}<span><small>限定配方</small><b>${recipe.name}</b></span></div>`
                      : ''
                  }
                  <div class="loot-item">${icon(chapter.souvenirIcon)}<span><small>伴手礼</small><b>${chapter.souvenir}</b></span></div>
                  <div class="loot-item is-bonus">${icon('heartWish')}<span><small>陈列加成</small><b>小费 +${Math.round(view.bonus * 100)}%</b></span></div>
                </div>`
          }
          <button type="button" class="btn btn-primary btn-big" data-action="travelFinish">${view.revisit ? '回到旅行手账' : '收进手账，回小店'} ${icon('arrow')}</button>
        </div>
      </div>`;
    }

    this.screenRoot.innerHTML = `
      <div class="screen overlay-screen travel-screen travel-session theme-${chapter.id} phase-${phase}" role="dialog" aria-modal="true" aria-label="${chapter.name}">
        <div class="travel-session-sky">
          <span class="session-sun"></span>
          <span class="session-cloud sc1"></span><span class="session-cloud sc2"></span>
          <span class="session-star ss1">✦</span><span class="session-star ss2">✦</span><span class="session-star ss3">✦</span>
          <div class="session-scenery" aria-hidden="true"><i class="ridge r1"></i><i class="ridge r2"></i><i class="ridge r3"></i></div>
        </div>
        <div class="travel-session-inner">
          <header class="travel-session-head">
            <div>
              <span class="travel-kicker">${icon('plane')} LITTLE PEACH AIR · CH.${pad2(chapter.index)} · ${chapter.latin}</span>
              <h2>${chapter.name}</h2>
              <p>${chapter.place} · ${chapter.subtitle}</p>
            </div>
            <div class="travel-progress">
              ${progress.map((label, i) => `<span class="${i === progressIndex ? 'is-now' : ''} ${i < progressIndex ? 'is-done' : ''}"><i></i>${label}</span>`).join('')}
            </div>
          </header>
          ${stage}
          <p class="travel-session-foot">${icon('leaf')} ${phase === 'result' ? '明信片会收进旅行手账，配方与伴手礼永久留在小店。' : '不用赶时间，小桃号会等这一章慢慢走完。'}</p>
        </div>
      </div>
    `;

    this.travelPointer = this.screenRoot.querySelector<HTMLElement>('[data-travel-pointer]');
    this.setSound(this.soundEnabled);
  }

  updateTravelPointer(position: number) {
    if (!this.travelPointer) return;
    this.travelPointer.style.left = `${Math.max(0, Math.min(1, position)) * 100}%`;
  }

  showPause(view: PauseView) {
    this.screenRoot.innerHTML = `
      <div class="screen overlay-screen pause-screen">
        <div class="scrim"></div>
        <article class="pause-card" role="dialog" aria-modal="true" aria-label="暂停营业">
          <div class="pause-art">${icon('cup')}<span class="pause-steam">~ ~ ~</span></div>
          <span class="pause-kicker">TAKE A BREATH</span>
          <h2>歇一会儿吧</h2>
          <p>营业计时已经停下了，杯子也不会凉。</p>
          <div class="pause-stats">
            <div><span>今日营收</span><b>¥${Math.round(view.revenue)}</b></div>
            <div><span>目标</span><b>¥${view.goal}</b></div>
            <div><span>耐心</span><b class="hearts-inline">${heartsHtml(view.hearts)}</b></div>
          </div>
          ${
            view.supplies.length || view.travelBonus > 0
              ? `<div class="pause-supplies">
                  <span>${icon('sparkle')} 今日特供</span>
                  <div>
                    ${supplyChips(view.supplies, '今天没有额外补给')}
                    ${view.travelBonus > 0 ? `<span class="supply-chip is-souvenir" style="--supply:#ffd479">${icon('heartWish')}<b>伴手礼</b><small>小费 +${Math.round(view.travelBonus * 100)}%</small></span>` : ''}
                  </div>
                </div>`
              : ''
          }
          <button type="button" class="btn btn-primary btn-big pause-resume" data-action="resume">${icon('bell')} 继续营业</button>
          <div class="pause-grid">
            <button type="button" class="pause-option" data-action="openHelp">${icon('book')}<span><b>玩法说明</b><small>配方、连击和小费</small></span></button>
            <button type="button" class="pause-option" data-action="toggleSound">${icon(view.sound ? 'sound' : 'soundOff')}<span><b data-sound-label>${view.sound ? '音效：开' : '音效：关'}</b><small>只在动作时响起</small></span></button>
            <button type="button" class="pause-option" data-action="goTitle">${icon('home')}<span><b>回到标题</b><small>今天重新开始</small></span></button>
            <button type="button" class="pause-option is-danger" data-action="resetSave">${icon('star')}<span><b>重新开张</b><small>清空所有进度</small></span></button>
          </div>
          <p class="pause-foot">${icon('leaf')} 进度会自动保存 · 第 ${view.day} 天</p>
        </article>
      </div>
    `;
    this.setSound(view.sound);
    this.soundEnabled = view.sound;
  }

  showHelp(view: HelpView) {
    this.screenRoot.innerHTML = `
      <div class="screen overlay-screen help-screen">
        <div class="scrim"></div>
        <article class="help-card" role="dialog" aria-modal="true" aria-label="玩法说明">
          <header class="help-head">
            <div>
              <span class="help-kicker">${icon('book')} 店长手册</span>
              <h2>怎么开好一家奶茶店</h2>
              <p>不用急，桃桃茶屋没有真正的失败，只有慢慢变好。</p>
            </div>
            <button type="button" class="icon-btn paper" data-action="closeHelp" aria-label="关闭">${icon('close')}</button>
          </header>
          <div class="help-body">
            <div class="help-steps">
              ${TUTORIAL_STEPS.map(
                (step, i) => `<div class="help-step">
                  <span class="step-number">${pad2(i + 1)}</span>
                  <span class="help-step-icon">${icon(step.icon)}</span>
                  <div><h3>${step.title}</h3><p>${step.text}</p></div>
                </div>`,
              ).join('')}
            </div>
            <div class="help-two-col">
              <section class="help-section">
                <h3>${icon('star')} 怎么算一杯好奶茶</h3>
                <p>配方一共 7 项：茶底、奶、风味、小料、冰量、糖度、杯型。</p>
                <ul>
                  <li><b>7 / 7</b><span>完美复刻 · 全额收入 + 小费</span></li>
                  <li><b>5–6 / 7</b><span>还不错 · 会有点小遗憾</span></li>
                  <li><b>4 项以下</b><span>客人会失望 · 失去一颗耐心</span></li>
                </ul>
                <p class="help-small">糖度、冰量、杯型和小料看客人的点单便签；茶底、奶和风味翻配方页或「配方速查」。</p>
              </section>
              <section class="help-section">
                <h3>${icon('sparkle')} 多赚一点的小秘密</h3>
                <ul class="help-bullets">
                  <li>${icon('sparkle')}<span><b>完美连击</b>：连续做出 5 项以上吻合的饮品，小费会越来越高。</span></li>
                  <li>${icon('shaker')}<span><b>完美手摇</b>：指针停在薄荷区正中心，手摇奖励更丰厚。</span></li>
                  <li>${icon('crown')}<span><b>贵宾客人</b>：戴皇冠的客人要求更高，但会给出更高的小费。</span></li>
                  <li>${icon('bolt')}<span><b>加急订单</b>：会有额外奖励，记得先看耐心条。</span></li>
                  <li>${icon('cart')}<span><b>小店升级</b>：每天打烊后，用金币让明天更轻松。</span></li>
                </ul>
              </section>
            </div>
            <div class="help-shortcuts">
              <span><kbd>Esc</kbd> 关闭当前界面 / 暂停</span>
              <span><kbd>空格</kbd> 手摇时点击</span>
              <span><kbd>N</kbd> 打开小本子</span>
            </div>
          </div>
          <footer class="help-footer">
            <button type="button" class="btn btn-primary btn-big" data-action="closeHelp">${icon('check')} ${view.fromTitle ? '知道啦，去开店' : '回去继续看店'}</button>
            <span class="help-sign">—— 桃桃茶屋 · 店长手册</span>
          </footer>
        </article>
      </div>
    `;
  }

  confirm(options: {
    title: string;
    text: string;
    confirmLabel: string;
    danger?: boolean;
  }): Promise<boolean> {
    return new Promise((resolve) => {
      const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const layer = document.createElement('div');
      layer.className = 'confirm-layer';
      layer.innerHTML = `
        <div class="confirm-scrim"></div>
        <div class="confirm-card" role="dialog" aria-modal="true" aria-label="${options.title}">
          <span class="pause-kicker">${options.danger ? 'A LITTLE WARNING' : 'JUST TO BE SURE'}</span>
          <h3>${options.title}</h3>
          <p>${options.text}</p>
          <div class="confirm-actions">
            <button type="button" class="btn btn-ghost" data-confirm-no>再想想</button>
            <button type="button" class="btn ${options.danger ? 'btn-danger' : 'btn-primary'}" data-confirm-yes>${options.confirmLabel}</button>
          </div>
        </div>
      `;
      document.body.appendChild(layer);
      const noButton = layer.querySelector<HTMLButtonElement>('[data-confirm-no]');
      const yesButton = layer.querySelector<HTMLButtonElement>('[data-confirm-yes]');
      const finish = (value: boolean) => {
        layer.classList.add('is-out');
        window.setTimeout(() => {
          layer.remove();
          if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
        }, 180);
        document.removeEventListener('keydown', onKey);
        resolve(value);
      };
      const onKey = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          finish(false);
          return;
        }
        if (event.key !== 'Tab') return;
        const buttons = [noButton, yesButton].filter((button): button is HTMLButtonElement => !!button);
        if (buttons.length === 0) return;
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        const active = document.activeElement;
        if (!layer.contains(active)) {
          event.preventDefault();
          first.focus();
        } else if (event.shiftKey && active === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && active === last) {
          event.preventDefault();
          first.focus();
        }
      };
      yesButton?.addEventListener('click', () => finish(true));
      noButton?.addEventListener('click', () => finish(false));
      layer.querySelector<HTMLElement>('.confirm-scrim')?.addEventListener('click', () => finish(false));
      document.addEventListener('keydown', onKey);
      requestAnimationFrame(() => {
        layer.classList.add('is-in');
        (options.danger ? noButton : yesButton)?.focus({ preventScroll: true });
      });
    });
  }

  // ───────────────────────────────────────── feedback

  toast(text: string, kind: 'info' | 'success' | 'heart' | 'warning' = 'info', iconName = 'sparkle') {
    while (this.toastRoot.children.length >= 4) {
      this.toastRoot.firstElementChild?.remove();
    }
    const node = document.createElement('div');
    node.className = `toast toast-${kind}`;
    node.innerHTML = `<span class="toast-icon">${icon(iconName)}</span><span class="toast-text">${text}</span>`;
    this.toastRoot.appendChild(node);
    requestAnimationFrame(() => node.classList.add('is-in'));
    window.setTimeout(() => {
      node.classList.add('is-out');
      window.setTimeout(() => node.remove(), 300);
    }, 2600);
  }

  flash(kind: 'heart' | 'gold') {
    this.flashLayer.className = 'flash-layer';
    void this.flashLayer.offsetWidth;
    this.flashLayer.classList.add(kind === 'heart' ? 'flash-heart' : 'flash-gold');
    window.setTimeout(() => {
      this.flashLayer.className = 'flash-layer';
    }, 620);
  }

  // ───────────────────────────────────────── events

  private onClickRoot = (event: Event) => this.handleAction(event as MouseEvent);

  private onPointerDownRoot = (event: PointerEvent) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>('[data-action]');
    if (target?.dataset.action !== 'shakeTap') return;
    event.preventDefault();
    this.actions.tapShake();
  };

  private onFocusKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;
    if (document.querySelector('.confirm-layer')) return;
    const dialog = this.screenRoot.querySelector<HTMLElement>('[role="dialog"]');
    if (!dialog) return;
    const focusables = [...dialog.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )].filter((el) => el.getClientRects().length > 0);
    if (focusables.length === 0) {
      event.preventDefault();
      dialog.focus({ preventScroll: true });
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;
    if (!dialog.contains(active)) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
      return;
    }
    if (active === dialog) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
      return;
    }
    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  private queueDialogFocus() {
    if (this.focusRaf) return;
    this.focusRaf = requestAnimationFrame(() => {
      this.focusRaf = 0;
      if (document.querySelector('.confirm-layer')) return;
      const dialog = this.screenRoot.querySelector<HTMLElement>('[role="dialog"]');
      if (!dialog) return;
      const active = document.activeElement;
      if (active instanceof HTMLElement && this.screenRoot.contains(active)) return;
      if (!dialog.hasAttribute('tabindex')) dialog.tabIndex = -1;
      dialog.focus({ preventScroll: true });
    });
  }

  private bindEvents() {
    this.screenRoot.addEventListener('click', this.onClickRoot);
    this.hudRoot.addEventListener('click', this.onClickRoot);
    this.worldRoot.addEventListener('click', this.onClickRoot);
    this.screenRoot.addEventListener('pointerdown', this.onPointerDownRoot, { passive: false });
  }

  private handleAction(event: MouseEvent) {
    const target = (event.target as HTMLElement).closest<HTMLElement>('[data-action]');
    if (!target) return;
    const action = target.dataset.action;
    switch (action) {
      case 'openDayIntro':
        this.actions.openDayIntro();
        break;
      case 'beginDay':
        this.actions.beginDay();
        break;
      case 'backToTitle':
      case 'goTitle':
        this.actions.goTitle();
        break;
      case 'openOrder': {
        const id = target.dataset.id ?? target.closest<HTMLElement>('[data-id]')?.dataset.id;
        if (id) this.actions.openOrder(id);
        break;
      }
      case 'acceptOrder': {
        const id = target.dataset.id;
        if (id) this.actions.acceptOrder(id);
        break;
      }
      case 'startCraft': {
        const id = target.dataset.id;
        if (id) this.actions.startCraft(id);
        break;
      }
      case 'select': {
        const key = target.dataset.key as keyof CraftSelections | undefined;
        const value = target.dataset.value;
        if (key && value) this.actions.selectIngredient(key, value);
        break;
      }
      case 'clearSelections':
        this.actions.clearSelections();
        break;
      case 'goShake':
        this.actions.goShake();
        break;
      case 'shakeTap':
        break;
      case 'finishShake':
        this.actions.finishShake();
        break;
      case 'serve':
        this.actions.serve();
        break;
      case 'answerChat': {
        const index = Number(target.dataset.index);
        if (Number.isFinite(index)) this.actions.answerChat(index);
        break;
      }
      case 'finishChat':
        this.actions.finishChat();
        break;
      case 'packItem': {
        const id = target.dataset.id;
        if (id) this.actions.packItem(id);
        break;
      }
      case 'closeOverlay':
        this.actions.closeOverlay();
        break;
      case 'openNotebook':
        this.actions.openNotebook();
        break;
      case 'openPause':
        this.actions.openPause();
        break;
      case 'resume':
        this.actions.resume();
        break;
      case 'resetSave':
        this.actions.resetSave();
        break;
      case 'openHelp':
        this.actions.openHelp();
        break;
      case 'closeHelp':
        this.actions.closeHelp();
        break;
      case 'toggleSound':
        this.actions.toggleSound();
        break;
      case 'nextFromSummary':
        this.actions.nextFromSummary();
        break;
      case 'buyUpgrade': {
        const id = target.dataset.id as UpgradeId | undefined;
        if (id) this.actions.buyUpgrade(id);
        break;
      }
      case 'nextDay':
        this.actions.nextDay();
        break;
      case 'skipTutorial':
        this.actions.skipTutorial();
        break;
      case 'toggleSign':
        this.actions.toggleSign();
        break;
      case 'openCity':
        this.actions.openCity();
        break;
      case 'closeCity':
        this.actions.closeCity();
        break;
      case 'visitCitySpot': {
        const id = target.dataset.id as CitySpotId | undefined;
        if (id) this.actions.visitCitySpot(id);
        break;
      }
      case 'cityStoryChoice': {
        const index = Number(target.dataset.index);
        if (Number.isFinite(index)) this.actions.cityStoryChoice(index);
        break;
      }
      case 'cityBackToPanel':
        this.actions.cityBackToPanel();
        break;
      case 'buySupply': {
        const id = target.dataset.id as SupplyId | undefined;
        if (id) this.actions.buySupply(id);
        break;
      }
      case 'openTravel':
        this.actions.openTravel();
        break;
      case 'closeTravel':
        this.actions.closeTravel();
        break;
      case 'startTravelChapter': {
        const id = target.dataset.id;
        if (id) this.actions.startTravelChapter(id);
        break;
      }
      case 'resumeTravelChapter':
        this.actions.resumeTravelChapter();
        break;
      case 'travelNext':
        this.actions.travelNext();
        break;
      case 'travelChoose': {
        const index = Number(target.dataset.index);
        if (Number.isFinite(index)) this.actions.travelChoose(index);
        break;
      }
      case 'travelTimingTap':
        this.actions.travelTimingTap();
        break;
      case 'travelQuizAnswer': {
        const index = Number(target.dataset.index);
        if (Number.isFinite(index)) this.actions.travelQuizAnswer(index);
        break;
      }
      case 'travelQuizNext':
        this.actions.travelQuizNext();
        break;
      case 'travelFinish':
        this.actions.travelFinish();
        break;
      case 'travelBackToJournal':
        this.actions.travelBackToJournal();
        break;
      case 'travelRevisit': {
        const id = target.dataset.id;
        if (id) this.actions.travelRevisit(id);
        break;
      }
      case 'toggleRecipes':
        this.toggleRecipeDrawer();
        break;
      case 'notebookTab': {
        const tab = target.dataset.tab as NotebookTab | undefined;
        if (tab && tab !== this.notebookTab) {
          this.notebookTab = tab;
          this.renderNotebookPage();
        }
        break;
      }
    }
  }
}
