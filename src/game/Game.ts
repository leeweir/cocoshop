import { CafeScene } from '../scene/CafeScene';
import { CupPreview } from '../scene/CupPreview';
import { Screens, type ChatView, type CityView, type CraftView, type DeliveryRailView, type HelpView, type HudState, type NotebookTab, type NotebookView, type OrderSlipView, type PauseView, type ServeView, type ShakeView, type ShopView, type SummaryView, type TravelSessionView, type TravelView, type UiActions, type WorldOrderView } from '../ui/Screens';
import { AudioEngine } from './audio';
import { FINISH_ENGINE, cloneFinish, createFinish, finishFrame, pressFinish, releaseFinish, tickFinish, type FinishEvent, type FinishState } from './finish';
import {
  CATEGORY_META,
  CUSTOMERS_MAP,
  DELIVERY_ADDRESSES,
  DRINKS,
  DRINKS_MAP,
  PACKAGING_META,
  THEMES,
  UPGRADES,
  UPGRADES_MAP,
  compareRecipe,
  customerForDay,
  getDayConfig,
} from './data';
import { challengeProgress } from './challenge';
import { packingShelf, planDelivery, planDineIn, resolveTarget, revealsDrinkName } from './orders';
import {
  CITY_EVENING_SLOTS,
  CITY_SUPPLY_LIMIT,
  SUPPLIES,
  SUPPLIES_MAP,
  TRAVEL_CHAPTERS,
  TRAVEL_CHAPTERS_MAP,
  TRAVEL_COST_COINS,
  TRAVEL_COST_SLOTS,
  chapterUnlocked,
  cityStoryById,
  completedChapterCount,
  extraDrinkIds,
  storiesForSpot,
  supplyBuff,
  travelSouvenirBonus,
  type SupplyDef,
  type TravelChapterDef,
} from './expansion';
import { freshSave, loadSave, persistSave, wipeSave } from './save';
import { DECOR_MAP, DECOR_SLOTS } from './decor';
import type {
  ChallengeProgress,
  CitySpotId,
  CraftSelections,
  CraftStep,
  CustomerDef,
  DayConfig,
  DrinkDef,
  FlavorType,
  IceType,
  MilkType,
  OrderState,
  PlayerState,
  ProductCategory,
  Recipe,
  SaveData,
  ScreenId,
  ServeResult,
  SizeType,
  SupplyId,
  TeaBase,
  ToppingType,
  UpgradeId,
} from './types';

type Overlay = 'order' | 'craft' | 'notebook' | 'pause' | 'help' | 'result' | 'chat' | null;
type HelpOrigin = 'title' | 'pause' | null;
type EndReason = 'time' | 'hearts';

/** Ignore 「完成」/「送出」 this long after the step before it finished, so trailing taps don't skip ahead. */
const STEP_GUARD_MS = 450;

interface CraftSession {
  orderId: string;
  /** Drink picked in the 「选杯」 step; null until the player picks one. */
  drinkId: string | null;
  step: CraftStep;
  selections: CraftSelections;
  shake: FinishState | null;
  packed: string[];
  /** Items packed that this delivery did not need. */
  packWrong: number;
}

interface CraftDraft {
  drinkId: string | null;
  step: CraftStep;
  selections: CraftSelections;
  shake: FinishState | null;
  packed: string[];
  packWrong: number;
}

interface TravelSession {
  chapterId: string;
  phase: 'scene' | 'choice' | 'mini' | 'result';
  beat: number;
  replyIndex: number | null;
  timing: FinishState | null;
  quizIndex: number;
  quizCorrect: number;
  quizAnswered: number | null;
  quizDone: boolean;
  stars: number;
  earned: number;
  revisit: boolean;
}

function emptySelections(): CraftSelections {
  return { tea: null, milk: null, flavor: null, topping: null, ice: null, sugar: null, size: null };
}

function allSelected(selections: CraftSelections): selections is Recipe {
  return (
    selections.tea !== null &&
    selections.milk !== null &&
    selections.flavor !== null &&
    selections.topping !== null &&
    selections.ice !== null &&
    selections.sugar !== null &&
    selections.size !== null
  );
}

function partialRecipe(selections: CraftSelections): Partial<Recipe> {
  const result: Partial<Recipe> = {};
  for (const key of Object.keys(selections) as (keyof CraftSelections)[]) {
    const value = selections[key];
    if (value !== null) {
      (result as Record<string, unknown>)[key] = value;
    }
  }
  return result;
}

export class Game {
  private canvas: HTMLCanvasElement;
  private scene: CafeScene;
  private ui: Screens;
  private audio = new AudioEngine();
  private preview: CupPreview | null = null;
  private previewCanvas: HTMLCanvasElement | null = null;

  private save: SaveData = loadSave();
  private config: DayConfig;
  private screen: ScreenId = 'boot';
  private overlay: Overlay = null;
  private helpOrigin: HelpOrigin = null;
  private player: PlayerState | null = null;
  private craft: CraftSession | null = null;
  private craftDrafts = new Map<string, CraftDraft>();
  private upgradeLockUntil = 0;
  private stepGuardUntil = 0;

  private spawnTimer = 0;
  private deliveryTimer = 0;
  private orderSeq = 0;
  private tutorialStep = 0;
  private dayActive = false;
  private storeOpen = false;
  private signBeforePause: boolean | null = null;
  private chat: { orderId: string; chatId: string; replyIndex: number | null; liked: boolean } | null = null;
  private pendingEnd: EndReason | null = null;

  private citySpot: CitySpotId | null = null;
  private cityStoryId: string | null = null;
  private cityStoryReply: number | null = null;
  private cityStoryRepeat = false;
  private cityStoryReward: string[] = [];
  private cityStoryRecipe: string | null = null;
  private cityStoryPlane = false;
  private travelSession: TravelSession | null = null;
  private travelOrigin: 'shop' | 'city' = 'shop';

  private lastFrame = 0;
  private raf = 0;
  private resizeTimer = 0;
  private stopped = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.config = getDayConfig(this.save.day, this.extraDrinks());
    this.tutorialStep = this.save.tutorialSeen ? 4 : 0;
    this.audio.setEnabled(this.save.sound);
    this.audio.setMusicEnabled(this.save.music);
    this.scene = new CafeScene(canvas, this.config.theme, {
      onCustomerClick: (id) => this.openOrder(id),
      onCustomerArrive: (id) => this.onCustomerArrive(id),
      onCustomerGone: (id) => this.onCustomerGone(id),
      onMenuClick: () => {
        if (this.screen === 'playing' && !this.overlay) this.openNotebook('recipes');
      },
    });
    this.scene.setDay(this.config.day, this.config.theme, this.config.unlockedDrinkIds);
    this.scene.setUpgrades(this.save.upgrades);
    this.scene.setDecor(this.save.decor.equipped);
    this.ui = new Screens(this.buildActions());
    this.ui.setSound(this.save.sound);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
    window.addEventListener('resize', this.onResize);
    this.showTitle();
    this.resumePendingShop();
  }

  start() {
    if (this.raf) return;
    this.lastFrame = performance.now();
    this.raf = requestAnimationFrame(this.loop);
  }

  stop() {
    if (this.stopped) return;
    this.stopped = true;
    cancelAnimationFrame(this.raf);
    window.clearTimeout(this.resizeTimer);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    window.removeEventListener('resize', this.onResize);
    this.preview?.dispose();
    this.preview = null;
    this.previewCanvas = null;
    this.audio.dispose();
    this.ui.dispose();
    this.scene.dispose();
  }

  private buildActions(): UiActions {
    return {
      openDayIntro: () => this.openDayIntro(),
      beginDay: () => this.beginDay(),
      backToTitle: () => this.goTitle(),
      openOrder: (id) => this.openOrder(id),
      acceptOrder: (id) => this.acceptOrder(id),
      startCraft: (id) => this.startCraft(id),
      pickDrink: (id) => this.pickDrink(id),
      selectIngredient: (key, value) => this.selectIngredient(key, value),
      clearSelections: () => this.clearSelections(),
      goShake: () => this.goShake(),
      tapShake: () => this.tapShake(),
      finishShake: () => this.finishShake(),
      releaseShake: () => this.releaseShake(),
      serve: () => this.serve(),
      closeOverlay: () => this.closeOverlay(),
      openNotebook: () => this.openNotebook(),
      openPause: () => this.openPause(),
      resume: () => this.resume(),
      goTitle: () => this.goTitle(),
      resetSave: () => this.resetSave(),
      openHelp: () => this.openHelp(),
      closeHelp: () => this.closeHelp(),
      toggleSound: () => this.toggleSound(),
      toggleMusic: () => this.toggleMusic(),
      nextFromSummary: () => this.openShop(),
      buyUpgrade: (id) => this.buyUpgrade(id),
      buyDecor: (id) => this.buyDecor(id),
      equipDecor: (id) => this.equipDecor(id),
      nextDay: () => this.nextDay(),
      skipTutorial: () => this.skipTutorial(),
      toggleSign: () => this.toggleSign(),
      answerChat: (index) => this.answerChat(index),
      finishChat: () => this.finishChat(),
      packItem: (id) => this.packItem(id),
      openCity: () => this.openCity(),
      closeCity: () => this.closeCity(),
      visitCitySpot: (spot) => this.visitCitySpot(spot),
      cityStoryChoice: (index) => this.cityStoryChoice(index),
      cityBackToPanel: () => this.cityBackToPanel(),
      buySupply: (id) => this.buySupply(id),
      openTravel: () => this.openTravel(),
      closeTravel: () => this.closeTravel(),
      startTravelChapter: (id) => this.startTravelChapter(id),
      resumeTravelChapter: () => this.resumeTravelChapter(),
      travelNext: () => this.travelNext(),
      travelChoose: (index) => this.travelChoose(index),
      travelTimingTap: () => this.travelTimingTap(),
      travelQuizAnswer: (index) => this.travelQuizAnswer(index),
      travelTimingRelease: () => this.travelTimingRelease(),
      travelQuizNext: () => this.travelQuizNext(),
      travelFinish: () => this.travelFinish(),
      travelBackToJournal: () => this.travelBackToJournal(),
      travelRevisit: (id) => this.travelRevisit(id),
    };
  }

  // ───────────────────────────────────────── main loop

  private loop = (now: number) => {
    if (this.stopped) return;
    const dt = Math.min(0.05, Math.max(0, (now - this.lastFrame) / 1000));
    this.lastFrame = now;

    this.scene.tick(dt);
    if (this.screen === 'playing' && this.player) {
      // Pause and help freeze the whole shift. Every other overlay (slip, chat,
      // crafting, notebook, result) keeps the clock, patience and arrivals
      // running, so a busy player sees a busy shop.
      const frozen = this.overlay === 'pause' || this.overlay === 'help';
      if (this.dayActive && !frozen) this.simulate(dt);
      if (this.overlay === 'craft' && this.craft?.step === 'shake' && this.craft.shake) {
        this.updateShake(dt);
      }
      this.ui.updateHud(this.hudState());
    }
    if (
      this.screen === 'travel' &&
      this.travelSession?.phase === 'mini' &&
      this.travelSession.timing &&
      !this.travelSession.timing.done
    ) {
      this.updateTravelTiming(dt);
    }

    const worldActive = this.screen === 'playing' && !this.overlay && this.dayActive;
    if (this.player) {
      const revealName = revealsDrinkName(this.config.day, this.save.tutorialSeen);
      const orders = this.player.orders
        .filter((order) => order.status === 'waiting' || order.status === 'in-craft')
        .map((order) => {
          const customer = CUSTOMERS_MAP[order.customerId];
          const drink = DRINKS_MAP[order.drinkId];
          return customer && drink ? { order, customer, drink, revealName } : null;
        })
        .filter((view): view is WorldOrderView => view !== null);
      this.ui.updateWorld(orders, this.scene.getBubbleAnchors(), worldActive);
      const deliveries = orders.filter(
        (view): view is DeliveryRailView => view.order.channel === 'delivery',
      );
      this.ui.updateDelivery(deliveries, worldActive);
    } else {
      this.ui.updateWorld([], [], false);
      this.ui.updateDelivery([], false);
    }

    this.scene.render();
    this.preview?.tick(dt);
    this.raf = requestAnimationFrame(this.loop);
  };

  private simulate(dt: number) {
    const p = this.player;
    if (!p || !this.dayActive) return;

    // The clock keeps running beneath overlays, but never yanks the player out
    // of a drink they are mid-way through crafting.
    p.shiftLeft = Math.max(0, p.shiftLeft - dt);
    if (p.shiftLeft <= 0 && this.overlay !== 'craft') {
      this.endDay('time');
      return;
    }

    if (this.storeOpen) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        const spawned = this.trySpawn();
        this.spawnTimer = spawned ? this.config.spawnEvery * (0.88 + Math.random() * 0.3) : 1.1;
      }
      if (this.config.deliveryEvery > 0) {
        this.deliveryTimer -= dt;
        if (this.deliveryTimer <= 0) {
          const spawned = this.trySpawnDelivery();
          this.deliveryTimer = spawned ? this.config.deliveryEvery * (0.82 + Math.random() * 0.36) : 1.1;
        }
      }
    }

    for (const order of [...p.orders]) {
      if (order.status !== 'waiting') continue;
      order.patience -= dt;
      if (order.channel === 'dine-in') {
        const ratio = order.patience / Math.max(1, order.patienceMax);
        this.scene.setCustomerMood(order.id, ratio < 0.22 ? 'sad' : ratio < 0.5 ? 'worried' : 'neutral');
      }
      if (order.patience <= 0) {
        if (order.channel === 'delivery') this.deliveryGaveUp(order);
        else this.customerGaveUp(order);
        if (!this.dayActive || this.overlay) return;
      }
    }
  }

  private hudState(): HudState {
    const p = this.player;
    const accepted = p?.orders.filter((order) => order.accepted).length ?? 0;
    const deliveries = p?.orders.filter((order) => order.channel === 'delivery').length ?? 0;
    return {
      day: this.config.day,
      themeName: this.config.theme.name,
      shiftLeft: p?.shiftLeft ?? this.config.shiftSeconds,
      revenue: p?.revenue ?? 0,
      goal: this.config.goal,
      coins: this.save.coins,
      hearts: p?.hearts ?? 3,
      combo: p?.combo ?? 0,
      notebookCount: accepted,
      deliveryCount: deliveries,
      signOpen: this.storeOpen,
      sound: this.save.sound,
      coach: this.coachText(),
      challenge: p ? challengeProgress(this.config.challenge, p) : null,
    };
  }

  /** Toast once when a same-day 每日小目标 is reached (「无人久等」 settles at close). */
  private checkChallenge() {
    const p = this.player;
    if (!p || p.challengeDone) return;
    if (!challengeProgress(this.config.challenge, p).done) return;
    p.challengeDone = true;
    this.audio.play('summary');
    this.ui.toast(`每日小目标达成：${this.config.challenge.label}！打烊时多领 ¥${this.config.challenge.reward}`, 'success', 'trophy');
  }

  private coachText(): string | null {
    if (this.save.tutorialSeen || this.tutorialStep >= 4) return null;
    switch (this.tutorialStep) {
      case 0:
        return '点一下客人的气泡，看看 Ta 今天想喝什么。';
      case 1:
        return '看看客人想喝哪一杯、有什么特别要求，再记下订单。';
      case 2:
        return '先在「选杯」里点这杯，配方会自动填好；再照便签改冰量、糖度、杯型和小料。';
      case 3:
        return '按品类收尾：茶饮跟着节拍摇，奶昔按住搅拌到目标带松手，冰淇淋对准顶部落球。';
      default:
        return null;
    }
  }

  private advanceTutorial(step: number) {
    if (this.save.tutorialSeen) return;
    if (this.tutorialStep < step) this.tutorialStep = step;
  }

  private skipTutorial() {
    this.save.tutorialSeen = true;
    this.tutorialStep = 4;
    persistSave(this.save);
    this.ui.setCoach(null);
    this.ui.toast('已经跳过新手引导，随时可以在暂停菜单查看玩法。', 'info', 'book');
  }

  private toggleSign() {
    if (this.screen !== 'playing' || !this.dayActive || this.overlay) return;
    this.storeOpen = !this.storeOpen;
    this.scene.setStoreOpen(this.storeOpen);
    this.audio.play(this.storeOpen ? 'doorBell' : 'close');
    this.ui.toast(
      this.storeOpen ? '营业牌翻到「营业中」，门铃又响起来了。' : '营业牌翻到「休息中」，先把手里这杯慢慢做完吧。',
      this.storeOpen ? 'success' : 'info',
      this.storeOpen ? 'openSign' : 'door',
    );
    this.ui.updateHud(this.hudState());
  }

  // ───────────────────────────────────────── day flow

  private showTitle() {
    this.screen = 'title';
    this.overlay = null;
    this.helpOrigin = null;
    this.dayActive = false;
    this.storeOpen = false;
    this.signBeforePause = null;
    this.chat = null;
    this.player = null;
    this.craft = null;
    this.craftDrafts.clear();
    this.citySpot = null;
    this.cityStoryId = null;
    this.cityStoryReply = null;
    this.cityStoryRepeat = false;
    this.cityStoryReward = [];
    this.cityStoryRecipe = null;
    this.cityStoryPlane = false;
    this.travelSession = null;
    this.travelOrigin = 'shop';
    this.preview?.setActive(false);
    this.config = getDayConfig(this.save.day, this.extraDrinks());
    this.scene.clearCustomers(false);
    this.scene.setDay(this.config.day, this.config.theme, this.config.unlockedDrinkIds);
    this.scene.setUpgrades(this.save.upgrades);
    this.scene.setDecor(this.save.decor.equipped);
    this.scene.setCameraMode('title');
    this.scene.setInteractive(false);
    this.scene.setStoreOpen(false);
    this.ui.hideHud();
    this.ui.setOverlayActive(false);
    this.ui.clearScreen();
    const unlocked = DRINKS.filter((drink) => drink.unlockDay <= this.save.day);
    const menu = (['tea', 'milkshake', 'icecream'] as ProductCategory[])
      .map((category) => unlocked.find((drink) => drink.category === category))
      .filter((drink): drink is DrinkDef => !!drink)
      .slice(0, 3);
    this.ui.showTitle({ save: this.save, theme: this.config.theme, menu });
    this.ui.setSound(this.save.sound);
  }

  private openDayIntro() {
    if (this.screen !== 'title') return;
    this.audio.play('open');
    this.screen = 'dayIntro';
    this.storeOpen = false;
    this.config = getDayConfig(this.save.day, this.extraDrinks());
    this.scene.setDay(this.config.day, this.config.theme, this.config.unlockedDrinkIds);
    this.scene.setCameraMode('title');
    this.scene.setInteractive(false);
    this.scene.setStoreOpen(false);
    this.ui.clearScreen();
    this.ui.showDayIntro({
      config: this.config,
      coins: this.save.coins,
      tutorialSeen: this.save.tutorialSeen,
      supplies: this.supplyDefs(this.save.city.supplies),
      travelBonus: this.travelBonus(),
    });
  }

  private beginDay() {
    if (this.screen !== 'dayIntro') return;
    this.audio.play('day');
    this.config = getDayConfig(this.save.day, this.extraDrinks());
    this.player = {
      day: this.config.day,
      coins: this.save.coins,
      shiftLeft: this.config.shiftSeconds,
      revenue: 0,
      servedToday: 0,
      perfectToday: 0,
      hearts: 3,
      combo: 0,
      maxComboToday: 0,
      orders: [],
      completedOrders: [],
      supplies: [...this.save.city.supplies],
      walkouts: 0,
      delivery3Today: 0,
      categoriesServed: [],
      challengeDone: false,
    };
    this.tutorialStep = this.save.tutorialSeen ? 4 : 0;
    this.dayActive = true;
    this.storeOpen = true;
    this.signBeforePause = null;
    this.chat = null;
    this.overlay = null;
    this.pendingEnd = null;
    this.craft = null;
    this.craftDrafts.clear();
    this.spawnTimer = 2.1;
    this.deliveryTimer = this.config.deliveryEvery > 0 ? Math.max(8, this.config.deliveryEvery * 0.55) : 0;
    this.orderSeq = 0;
    this.screen = 'playing';
    this.save.openShiftDay = this.config.day;
    this.scene.setDay(this.config.day, this.config.theme, this.config.unlockedDrinkIds);
    this.scene.setUpgrades(this.save.upgrades);
    this.scene.setCameraMode('play');
    this.scene.setInteractive(true);
    this.scene.setStoreOpen(true);
    this.ui.setOverlayActive(false);
    this.ui.clearScreen();
    this.ui.showHud(this.hudState());
    this.ui.toast(`${this.config.theme.name}，门铃响啦，开始营业！`, 'success', 'bell');
    this.audio.play('doorBell');
    persistSave(this.save);
  }

  private endDay(reason: EndReason) {
    if (!this.dayActive) return;
    const p = this.player;
    if (!p) return;
    this.dayActive = false;
    this.storeOpen = false;
    this.signBeforePause = null;
    this.chat = null;
    this.overlay = null;
    this.helpOrigin = null;
    this.pendingEnd = null;
    this.craft = null;
    this.craftDrafts.clear();
    this.preview?.setActive(false);
    this.scene.setInteractive(false);
    this.scene.setStoreOpen(false);
    this.scene.clearCustomers(false);
    this.scene.setCameraMode('summary');
    this.ui.setOverlayActive(false);
    this.ui.hideHud();
    this.ui.clearScreen();

    const goalMet = p.revenue >= this.config.goal;
    const challenge = challengeProgress(this.config.challenge, p, true);
    let grade = 0;
    if (goalMet && challenge.done) grade = 3;
    else if (goalMet) grade = 2;
    else if (p.revenue >= this.config.goal * 0.55) grade = 1;

    const bonus = goalMet
      ? Math.round(this.config.goal * 0.18 + p.hearts * 12 + p.maxComboToday * 4)
      : 0;
    const challengeReward = challenge.done ? this.config.challenge.reward : 0;
    this.save.coins += bonus + challengeReward;
    if (challenge.done) this.save.challengesDone += 1;
    this.save.bestRevenue = Math.max(this.save.bestRevenue, Math.round(p.revenue));
    this.save.bestCombo = Math.max(this.save.bestCombo, p.maxComboToday);
    // Advance the save immediately so refreshing the summary cannot replay this shift.
    this.save.pendingShopDay = this.config.day;
    this.save.openShiftDay = undefined;
    this.save.day = Math.min(999, this.config.day + 1);
    this.save.city.supplies = [];
    this.ensureEvening();
    persistSave(this.save);

    this.screen = 'summary';
    const view: SummaryView = {
      day: this.config.day,
      theme: this.config.theme,
      revenue: Math.round(p.revenue),
      goal: this.config.goal,
      served: p.servedToday,
      perfect: p.perfectToday,
      maxCombo: p.maxComboToday,
      hearts: p.hearts,
      bonus,
      challenge,
      challengeReward,
      coins: this.save.coins,
      grade,
      goalMet,
      reason,
    };
    this.ui.showSummary(view);
    this.ui.setSound(this.save.sound);
    if (goalMet || challenge.done) {
      this.scene.celebrate();
      this.audio.play('summary');
    } else {
      this.audio.play('day');
    }
    this.player = p;
  }

  private openShop() {
    if (this.screen !== 'summary') return;
    this.audio.play('open');
    this.ensureEvening();
    this.screen = 'shop';
    this.overlay = null;
    this.ui.clearScreen();
    this.ui.showShop(this.shopView());
    this.scene.setCameraMode('summary');
  }

  private resumePendingShop() {
    if (this.save.pendingShopDay === undefined) return;
    this.ensureEvening();
    this.screen = 'shop';
    this.overlay = null;
    this.dayActive = false;
    this.scene.setCameraMode('summary');
    this.scene.setInteractive(false);
    this.ui.clearScreen();
    this.ui.showShop(this.shopView());
    this.ui.toast(`第 ${this.save.pendingShopDay} 天已经打烊，升级完再开第 ${this.save.day} 天。`, 'info', 'cart');
  }

  private shopView(): ShopView {
    const extra = this.extraDrinks();
    const nextConfig = getDayConfig(this.save.day, extra);
    return {
      day: this.save.pendingShopDay ?? this.config.day,
      coins: this.save.coins,
      upgrades: { ...this.save.upgrades },
      decor: { owned: [...this.save.decor.owned], equipped: { ...this.save.decor.equipped } },
      nextTheme: nextConfig.theme,
      nextGoal: nextConfig.goal,
      nextShift: nextConfig.shiftSeconds,
      nextNewDrinks: nextConfig.newDrinkIds.map((id) => DRINKS_MAP[id]).filter(Boolean),
      servedTotal: this.save.servedTotal,
      supplies: this.supplyDefs(this.save.city.supplies),
      limited: extra
        .map((id) => DRINKS_MAP[id])
        .filter((drink): drink is DrinkDef => !!drink),
      city: {
        slotsLeft: this.save.city.slotsLeft,
        plane: this.save.city.plane,
        visits: this.save.city.visits,
        travelDone: completedChapterCount(this.save.travel),
        travelBonus: this.travelBonus(),
      },
    };
  }

  private buyUpgrade(id: UpgradeId) {
    if (this.screen !== 'shop') return;
    const now = performance.now();
    if (now < this.upgradeLockUntil) return;
    this.upgradeLockUntil = now + 320;
    const def = UPGRADES_MAP[id];
    if (!def) return;
    const level = this.save.upgrades[id];
    if (level >= def.maxLevel) return;
    const cost = def.costs[level];
    if (this.save.coins < cost) {
      this.audio.play('error');
      this.ui.toast('金币还不够，明天再努力一点点。', 'warning', 'coin');
      return;
    }
    this.save.coins -= cost;
    this.save.upgrades[id] = level + 1;
    persistSave(this.save);
    this.scene.setUpgrades(this.save.upgrades);
    this.audio.play('buy');
    this.ui.showShop(this.shopView());
    this.ui.toast(`${def.name}升级到 Lv.${level + 1} 啦！`, 'success', 'sparkle');
  }

  private buyDecor(id: string) {
    if (this.screen !== 'shop') return;
    const now = performance.now();
    if (now < this.upgradeLockUntil) return;
    this.upgradeLockUntil = now + 320;
    const def = DECOR_MAP[id];
    if (!def || this.save.decor.owned.includes(id)) return;
    if (this.save.coins < def.cost) {
      this.audio.play('error');
      this.ui.toast('金币还不够，再攒几天就能换上啦。', 'warning', 'coin');
      return;
    }
    this.save.coins -= def.cost;
    this.save.decor.owned.push(id);
    this.save.decor.equipped[def.slot] = id;
    persistSave(this.save);
    this.scene.setDecor(this.save.decor.equipped);
    this.audio.play('buy');
    this.ui.showShop(this.shopView());
    this.ui.toast(`买下了「${def.name}」，店里已经换上啦！`, 'success', 'brush');
  }

  private equipDecor(id: string) {
    if (this.screen !== 'shop') return;
    const now = performance.now();
    if (now < this.upgradeLockUntil) return;
    this.upgradeLockUntil = now + 320;
    const def = DECOR_MAP[id];
    if (!def || !this.save.decor.owned.includes(id) || this.save.decor.equipped[def.slot] === id) return;
    this.save.decor.equipped[def.slot] = id;
    persistSave(this.save);
    this.scene.setDecor(this.save.decor.equipped);
    this.audio.play('select');
    this.ui.showShop(this.shopView());
    const slot = DECOR_SLOTS.find((entry) => entry.id === def.slot);
    this.ui.toast(`${slot?.label ?? '装修'}换成了「${def.name}」。`, 'success', 'brush');
  }

  private nextDay() {
    if (this.screen !== 'shop') return;
    this.save.pendingShopDay = undefined;
    persistSave(this.save);
    this.config = getDayConfig(this.save.day, this.extraDrinks());
    this.screen = 'dayIntro';
    this.player = null;
    this.overlay = null;
    this.storeOpen = false;
    this.signBeforePause = null;
    this.scene.setDay(this.config.day, this.config.theme, this.config.unlockedDrinkIds);
    this.scene.setUpgrades(this.save.upgrades);
    this.scene.setCameraMode('title');
    this.scene.setInteractive(false);
    this.scene.setStoreOpen(false);
    this.ui.clearScreen();
    this.ui.showDayIntro({
      config: this.config,
      coins: this.save.coins,
      tutorialSeen: this.save.tutorialSeen,
      supplies: this.supplyDefs(this.save.city.supplies),
      travelBonus: this.travelBonus(),
    });
    this.audio.play('day');
  }

  // ───────────────────────────────────────── evening: city & travel

  private extraDrinks(): string[] {
    return extraDrinkIds(this.save.city, this.save.travel);
  }

  private travelBonus(): number {
    return travelSouvenirBonus(this.save.travel);
  }

  private ensureEvening() {
    if (this.save.city.evening === this.save.day) return;
    this.save.city.evening = this.save.day;
    this.save.city.slotsLeft = CITY_EVENING_SLOTS;
    this.save.city.usedSpots = [];
    persistSave(this.save);
  }

  private supplyDefs(ids: SupplyId[]): SupplyDef[] {
    return ids.map((id) => SUPPLIES_MAP[id]).filter((def): def is SupplyDef => !!def);
  }

  private supplyIds(): SupplyId[] {
    return this.player?.supplies ?? this.save.city.supplies;
  }

  private suppliesBuff() {
    return supplyBuff(this.supplyIds());
  }

  private openCity() {
    if (this.screen !== 'shop') return;
    this.ensureEvening();
    if (this.save.city.slotsLeft <= 0) {
      this.audio.play('close');
      this.ui.toast('今晚的散步已经收尾了，明晚还有新的 3 段时光。', 'info', 'moon');
      return;
    }
    this.resetCityStory();
    this.citySpot = null;
    this.save.city.visits += 1;
    persistSave(this.save);
    this.screen = 'city';
    this.overlay = null;
    this.audio.play('open');
    this.ui.clearScreen();
    this.ui.showCity(this.cityView());
  }

  private closeCity() {
    if (this.screen !== 'city') return;
    if (this.cityStoryId && this.cityStoryReply === null) {
      this.audio.play('error');
      this.ui.toast('先把这段街坊故事听完吧，只剩最后一句了。', 'warning', 'bubble');
      return;
    }
    if (this.save.city.slotsLeft > 0) {
      void this.ui
        .confirm({
          title: '结束今晚的散步？',
          text: `还剩 ${this.save.city.slotsLeft} 段时光。回小店后，今晚就不能再出门了。`,
          confirmLabel: '回小店',
        })
        .then((yes) => {
          if (yes) this.finishEvening();
        });
      return;
    }
    this.finishEvening();
  }

  private finishEvening() {
    if (this.screen !== 'city') return;
    this.save.city.slotsLeft = 0;
    this.resetCityStory();
    this.citySpot = null;
    persistSave(this.save);
    this.screen = 'shop';
    this.audio.play('close');
    this.ui.clearScreen();
    this.ui.showShop(this.shopView());
  }

  private resetCityStory() {
    this.cityStoryId = null;
    this.cityStoryReply = null;
    this.cityStoryRepeat = false;
    this.cityStoryReward = [];
    this.cityStoryRecipe = null;
    this.cityStoryPlane = false;
  }

  private visitCitySpot(spot: CitySpotId) {
    if (this.screen !== 'city') return;
    if (this.citySpot !== spot) {
      this.citySpot = spot;
      this.resetCityStory();
      this.audio.play('select');
      this.ui.showCity(this.cityView());
      return;
    }
    if (spot === 'market' || spot === 'home' || spot === 'shop') return;
    if (this.save.city.usedSpots.includes(spot)) return;
    if (this.save.city.slotsLeft <= 0) {
      this.audio.play('error');
      this.ui.toast('今晚的时光用完了，明晚再来找他们聊天吧。', 'warning', 'moon');
      return;
    }
    this.enterCityStory(spot);
  }

  private enterCityStory(spot: CitySpotId) {
    const defs = storiesForSpot(spot, this.save.metCustomers);
    if (!defs.length) return;
    const unseen = defs.filter((story) => !this.save.city.stories.includes(story.id));
    const preferred = unseen.filter((story) =>
      story.choices.some((choice) => {
        if (choice.reward.plane && !this.save.city.plane) return true;
        return !!choice.reward.recipe && !this.save.city.recipes.includes(choice.reward.recipe);
      }),
    );
    const pool = preferred.length > 0 ? preferred : unseen;
    const repeat = pool.length === 0;
    const source = repeat ? defs : pool;
    const story = source[Math.floor(Math.random() * source.length)];
    if (!story) return;
    this.save.city.slotsLeft = Math.max(0, this.save.city.slotsLeft - 1);
    if (!this.save.city.usedSpots.includes(spot)) this.save.city.usedSpots.push(spot);
    this.cityStoryId = story.id;
    this.cityStoryReply = null;
    this.cityStoryRepeat = repeat;
    this.cityStoryReward = [];
    this.cityStoryRecipe = null;
    this.cityStoryPlane = false;
    persistSave(this.save);
    this.audio.play('chat');
    this.ui.showCity(this.cityView());
  }

  private cityStoryChoice(index: number) {
    if (this.screen !== 'city') return;
    const story = this.cityStoryId ? cityStoryById(this.cityStoryId) : undefined;
    if (!story || this.cityStoryReply !== null) return;
    const choice = story.choices[index];
    if (!choice) return;
    const reward = choice.reward;
    const lines: string[] = [];
    let coins = 0;
    let recipe: string | null = null;
    let plane = false;

    if (this.cityStoryRepeat) {
      coins = Math.round((reward.coins ?? 0) / 2);
      if (coins > 0) lines.push(`金币 +${coins}`);
    } else {
      if (reward.plane && !this.save.city.plane) {
        this.save.city.plane = true;
        plane = true;
        lines.push('小桃号钥匙');
      }
      if (reward.recipe && !this.save.city.recipes.includes(reward.recipe)) {
        this.save.city.recipes.push(reward.recipe);
        recipe = reward.recipe;
        const drink = DRINKS_MAP[reward.recipe];
        if (drink) lines.push(`配方「${drink.name}」`);
      }
      if (reward.supply && this.save.city.supplies.length < CITY_SUPPLY_LIMIT) {
        this.save.city.supplies.push(reward.supply);
        const supply = SUPPLIES_MAP[reward.supply];
        if (supply) lines.push(`补给「${supply.name}」`);
      }
      if (reward.rapport) {
        this.save.regulars[reward.rapport] = Math.min(99, (this.save.regulars[reward.rapport] ?? 0) + 1);
        lines.push('常客好感 +1');
      }
      coins = reward.coins ?? 0;
      if (coins > 0) lines.push(`金币 +${coins}`);
    }

    this.save.coins += coins;
    if (!this.save.city.stories.includes(story.id)) this.save.city.stories.push(story.id);
    this.cityStoryReply = index;
    this.cityStoryReward = lines;
    this.cityStoryRecipe = recipe;
    this.cityStoryPlane = plane;
    persistSave(this.save);
    this.audio.play(coins > 0 ? 'coin' : 'accept');
    this.ui.showCity(this.cityView());
  }

  private cityBackToPanel() {
    if (this.screen !== 'city') return;
    if (this.cityStoryId && this.cityStoryReply === null) return;
    this.citySpot = null;
    this.resetCityStory();
    this.audio.play('close');
    this.ui.showCity(this.cityView());
  }

  private buySupply(id: SupplyId) {
    if (this.screen !== 'city' || this.citySpot !== 'market') return;
    const def = SUPPLIES_MAP[id];
    if (!def) return;
    if (this.save.city.slotsLeft <= 0) {
      this.audio.play('error');
      this.ui.toast('今晚的时光用完了，明晚再来采购吧。', 'warning', 'moon');
      return;
    }
    if (this.save.city.supplies.length >= CITY_SUPPLY_LIMIT) {
      this.audio.play('error');
      this.ui.toast('购物篮装满了，明天用完再来。', 'warning', 'cart');
      return;
    }
    if (this.save.coins < def.cost) {
      this.audio.play('error');
      this.ui.toast('金币还不够，明天多卖几杯吧。', 'warning', 'coin');
      return;
    }
    this.save.coins -= def.cost;
    this.save.city.supplies.push(id);
    this.save.city.slotsLeft -= 1;
    persistSave(this.save);
    this.audio.play('buy');
    this.ui.showCity(this.cityView());
    this.ui.toast(`把「${def.name}」放进购物篮，明天开门就会生效。`, 'success', 'cart');
  }

  private cityView(): CityView {
    const story = this.cityStoryId ? cityStoryById(this.cityStoryId) ?? null : null;
    return {
      day: this.save.pendingShopDay ?? this.config.day,
      coins: this.save.coins,
      slotsLeft: this.save.city.slotsLeft,
      supplies: this.supplyDefs(this.save.city.supplies),
      recipes: this.save.city.recipes
        .map((id) => DRINKS_MAP[id])
        .filter((drink): drink is DrinkDef => !!drink),
      plane: this.save.city.plane,
      visits: this.save.city.visits,
      activeSpot: this.citySpot,
      usedSpots: [...this.save.city.usedSpots] as CitySpotId[],
      market: SUPPLIES.map((def) => ({
        def,
        count: this.save.city.supplies.filter((id) => id === def.id).length,
        canBuy:
          this.save.coins >= def.cost &&
          this.save.city.slotsLeft > 0 &&
          this.save.city.supplies.length < CITY_SUPPLY_LIMIT,
      })),
      story: story
        ? {
            id: story.id,
            regular: story.regular ? CUSTOMERS_MAP[story.regular] ?? null : null,
            kicker: story.kicker,
            title: story.title,
            text: story.text,
            choices: story.choices.map((choice) => ({ label: choice.label, reply: choice.reply })),
            replyIndex: this.cityStoryReply,
            rewardLines: [...this.cityStoryReward],
            repeat: this.cityStoryRepeat,
            planeUnlocked: this.cityStoryPlane,
            recipe: this.cityStoryRecipe ? DRINKS_MAP[this.cityStoryRecipe] ?? null : null,
          }
        : null,
      travelDone: completedChapterCount(this.save.travel),
      travelBonus: this.travelBonus(),
    };
  }

  // ───────────────────────────────────────── travel journal

  private travelView(): TravelView {
    return {
      coins: this.save.coins,
      slotsLeft: this.save.city.slotsLeft,
      chapters: TRAVEL_CHAPTERS.map((def) => ({
        def,
        unlocked: chapterUnlocked(def.id, this.save.travel),
        record: this.save.travel.chapters[def.id] ?? null,
      })),
      completed: completedChapterCount(this.save.travel),
      bonus: this.travelBonus(),
      plane: this.save.city.plane,
      interrupted: this.save.city.traveling ? TRAVEL_CHAPTERS_MAP[this.save.city.traveling] ?? null : null,
    };
  }

  private openTravel() {
    if (this.screen !== 'shop' && this.screen !== 'city') return;
    this.ensureEvening();
    if (!this.save.city.plane) {
      this.audio.play('error');
      this.ui.toast('先去航空俱乐部，把旧机库门后的钥匙找出来。', 'warning', 'plane');
      return;
    }
    this.travelOrigin = this.screen === 'city' ? 'city' : 'shop';
    this.travelSession = null;
    this.screen = 'travel';
    this.overlay = null;
    this.audio.play('open');
    this.ui.clearScreen();
    this.ui.showTravel(this.travelView());
  }

  private closeTravel() {
    if (this.screen !== 'travel') return;
    if (this.travelSession) {
      if (this.travelSession.phase !== 'result') {
        this.audio.play('error');
        this.ui.toast('这一章还没走完，小桃号会等你。', 'info', 'plane');
        return;
      }
      this.travelSession = null;
    }
    this.audio.play('close');
    this.ui.clearScreen();
    if (this.travelOrigin === 'city') {
      this.screen = 'city';
      this.ui.showCity(this.cityView());
    } else {
      this.screen = 'shop';
      this.ui.showShop(this.shopView());
    }
  }

  private startTravelChapter(id: string) {
    if (this.screen !== 'travel' || this.travelSession) return;
    const def = TRAVEL_CHAPTERS_MAP[id];
    if (!def) return;
    if (this.save.city.traveling) {
      if (this.save.city.traveling === id) {
        this.resumeTravelChapter();
        return;
      }
      this.audio.play('error');
      this.ui.toast('手账里还有一张没走完的机票，先把它走完吧。', 'info', 'plane');
      return;
    }
    if (!chapterUnlocked(id, this.save.travel)) {
      this.audio.play('error');
      this.ui.toast('先走完上一章，才能去更远的地方。', 'warning', 'lock');
      return;
    }
    if (this.save.travel.chapters[id]) {
      this.audio.play('error');
      this.ui.toast('这一站已经去过了，可以重温旧明信片。', 'info', 'postcard');
      return;
    }
    if (!this.save.city.plane) return;
    if (this.save.city.slotsLeft < TRAVEL_COST_SLOTS) {
      this.audio.play('error');
      this.ui.toast('傍晚时光不够，明晚再出发吧。', 'warning', 'moon');
      return;
    }
    if (this.save.coins < TRAVEL_COST_COINS) {
      this.audio.play('error');
      this.ui.toast('航油金币还不够，再攒一点吧。', 'warning', 'coin');
      return;
    }
    this.save.city.slotsLeft -= TRAVEL_COST_SLOTS;
    this.save.coins -= TRAVEL_COST_COINS;
    this.save.city.traveling = id;
    persistSave(this.save);
    this.beginTravelSession(id);
  }

  private beginTravelSession(id: string, revisit = false) {
    if (!TRAVEL_CHAPTERS_MAP[id]) return;
    const record = this.save.travel.chapters[id];
    this.travelSession = {
      chapterId: id,
      phase: 'scene',
      beat: 0,
      replyIndex: null,
      timing: null,
      quizIndex: 0,
      quizCorrect: 0,
      quizAnswered: null,
      quizDone: false,
      stars: revisit ? record?.stars ?? 1 : 0,
      earned: 0,
      revisit,
    };
    this.audio.play(revisit ? 'open' : 'day');
    this.ui.clearScreen();
    this.showTravelSession();
  }

  private resumeTravelChapter() {
    if (this.screen !== 'travel' || this.travelSession) return;
    const id = this.save.city.traveling;
    const def = id ? TRAVEL_CHAPTERS_MAP[id] : undefined;
    if (!id || !def) return;
    if (this.save.travel.chapters[id]) {
      this.save.city.traveling = null;
      persistSave(this.save);
      this.ui.showTravel(this.travelView());
      return;
    }
    this.ui.toast(`继续第 ${def.index} 站 · ${def.name}`, 'success', 'plane');
    this.beginTravelSession(id);
  }

  private travelRevisit(id: string) {
    if (this.screen !== 'travel' || this.travelSession) return;
    const chapter = TRAVEL_CHAPTERS_MAP[id];
    const record = this.save.travel.chapters[id];
    if (!chapter || !record) return;
    this.beginTravelSession(id, true);
  }

  private travelSessionView(): TravelSessionView | null {
    const session = this.travelSession;
    if (!session) return null;
    const chapter = TRAVEL_CHAPTERS_MAP[session.chapterId];
    if (!chapter) return null;
    const stars = session.phase === 'result' ? session.stars : this.travelStarsFor(session, chapter);
    let mini: TravelSessionView['mini'] = null;
    if (session.phase === 'mini') {
      if (chapter.miniGame === 'timing' && chapter.timing) {
        mini = {
          mode: 'timing',
          engine: chapter.timing.engine,
          taps: session.timing?.scores.length ?? 0,
          tapsNeeded: chapter.timing.taps,
          scores: session.timing?.scores ?? [],
          grades: session.timing?.grades ?? [],
          done: session.timing?.done ?? false,
          stars,
          unit: chapter.timing.unit,
          quizIndex: 0,
          quizTotal: 0,
          quizCorrect: 0,
          quizAnswered: null,
          quizDone: false,
        };
      } else if (chapter.quiz) {
        mini = {
          mode: 'quiz',
          engine: null,
          taps: 0,
          tapsNeeded: chapter.quiz.length,
          scores: [],
          grades: [],
          done: session.quizDone,
          stars,
          unit: '杯',
          quizIndex: session.quizIndex,
          quizTotal: chapter.quiz.length,
          quizCorrect: session.quizCorrect,
          quizAnswered: session.quizAnswered,
          quizDone: session.quizDone,
        };
      }
    }
    const choice = session.replyIndex !== null ? chapter.choices[session.replyIndex] : null;
    return {
      chapter,
      phase: session.phase,
      beat: session.beat,
      replyIndex: session.replyIndex,
      reply: choice?.reply ?? null,
      mini,
      stars,
      earned: session.earned,
      bonus: this.travelBonus(),
      revisit: session.revisit,
    };
  }

  private showTravelSession() {
    const view = this.travelSessionView();
    if (!view) return;
    this.ui.showTravelSession(view);
    if (view.mini?.mode === 'timing' && this.travelSession?.timing) this.ui.updateFinish(finishFrame(this.travelSession.timing));
  }

  private travelStarsFor(session: TravelSession, chapter: TravelChapterDef): number {
    if (chapter.miniGame === 'quiz') {
      const total = chapter.quiz?.length ?? 1;
      const ratio = total > 0 ? session.quizCorrect / total : 1;
      return ratio >= 0.99 ? 3 : ratio >= 0.5 ? 2 : 1;
    }
    const scores = session.timing?.scores ?? [];
    if (!scores.length) return 1;
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    return average >= 0.85 ? 3 : average >= 0.55 ? 2 : 1;
  }

  private updateTravelTiming(dt: number) {
    const timing = this.travelSession?.timing;
    if (!timing || timing.done) return;
    const events = tickFinish(timing, dt);
    if (events.length) this.onTravelFinishEvents(events);
    if (this.travelSession?.timing === timing && !timing.done) this.ui.updateFinish(finishFrame(timing));
  }

  /** Sfx + light UI refresh for travel timing events; the postcard step re-renders once it's done. */
  private onTravelFinishEvents(events: FinishEvent[]) {
    const timing = this.travelSession?.timing;
    if (!timing) return;
    this.playFinishSfx(events, timing.engine);
    if (timing.done) {
      this.showTravelSession();
      return;
    }
    if (events.some((event) => event.type === 'score')) {
      const view = this.travelSessionView();
      if (view) this.ui.updateTravelMini(view);
    }
  }

  /** One sound per finish event: soft beat ticks, a stir when a hold starts, a voice per scored unit. */
  private playFinishSfx(events: FinishEvent[], engine: FinishState['engine']) {
    for (const event of events) {
      if (event.type === 'beat') this.audio.play('beat');
      else if (event.type === 'hold') this.audio.play('blend');
      else if (event.type === 'done') this.audio.play('accept');
      else if (event.grade === 'perfect') this.audio.play('shakePerfect');
      else if (event.grade === 'over') this.audio.play('error');
      else this.audio.play(engine === 'hold' ? 'blend' : engine === 'stack' ? 'drop' : 'shake');
    }
  }

  private travelNext() {
    if (this.screen !== 'travel' || !this.travelSession) return;
    const session = this.travelSession;
    const chapter = TRAVEL_CHAPTERS_MAP[session.chapterId];
    if (!chapter) return;
    if (session.phase === 'scene') {
      if (session.beat < chapter.scene.length - 1) {
        session.beat += 1;
        this.audio.play('click');
        this.showTravelSession();
        return;
      }
      if (session.revisit) {
        session.stars = this.save.travel.chapters[chapter.id]?.stars ?? this.travelStarsFor(session, chapter);
        session.earned = 0;
        session.phase = 'result';
        this.audio.play('open');
        this.showTravelSession();
        return;
      }
      session.phase = 'choice';
      this.audio.play('open');
      this.showTravelSession();
      return;
    }
    if (session.phase === 'mini') {
      const done = chapter.miniGame === 'quiz' ? session.quizDone : session.timing?.done;
      if (!done) return;
      this.completeTravelChapter();
    }
  }

  private travelChoose(index: number) {
    if (this.screen !== 'travel' || !this.travelSession) return;
    const session = this.travelSession;
    const chapter = TRAVEL_CHAPTERS_MAP[session.chapterId];
    if (session.phase !== 'choice' || session.replyIndex !== null || !chapter) return;
    if (!chapter.choices[index]) return;
    session.replyIndex = index;
    if (chapter.miniGame === 'timing' && chapter.timing) {
      const cfg = chapter.timing;
      session.timing = createFinish(cfg.engine, {
        units: cfg.taps,
        speed: cfg.speed,
        zone: cfg.zone,
        drift: cfg.drift,
        // Trips happen in the evening, so the pearl pouch counted is the one
        // packed for tomorrow, not the shift that just ended.
        ease: this.finishEase(this.save.city.supplies),
        seed: Math.floor(Math.random() * 2 ** 31),
      });
    } else {
      session.quizIndex = 0;
      session.quizCorrect = 0;
      session.quizAnswered = null;
      session.quizDone = false;
    }
    session.phase = 'mini';
    this.audio.play('accept');
    this.showTravelSession();
  }

  private travelTimingTap() {
    const timing = this.activeTravelTiming();
    if (!timing) return;
    const events = pressFinish(timing);
    if (events.length) this.onTravelFinishEvents(events);
  }

  private travelTimingRelease() {
    const timing = this.activeTravelTiming();
    if (!timing) return;
    const events = releaseFinish(timing);
    if (events.length) this.onTravelFinishEvents(events);
  }

  private activeTravelTiming(): FinishState | null {
    if (this.screen !== 'travel' || this.travelSession?.phase !== 'mini') return null;
    const timing = this.travelSession.timing;
    return timing && !timing.done ? timing : null;
  }

  private travelQuizAnswer(index: number) {
    if (this.screen !== 'travel' || !this.travelSession) return;
    const session = this.travelSession;
    const chapter = TRAVEL_CHAPTERS_MAP[session.chapterId];
    if (session.phase !== 'mini' || session.quizAnswered !== null || !chapter?.quiz) return;
    const question = chapter.quiz[session.quizIndex];
    if (!question?.options[index]) return;
    session.quizAnswered = index;
    if (question.options[index].correct) session.quizCorrect += 1;
    this.audio.play(question.options[index].correct ? 'accept' : 'error');
    this.showTravelSession();
  }

  private travelQuizNext() {
    if (this.screen !== 'travel' || !this.travelSession) return;
    const session = this.travelSession;
    const chapter = TRAVEL_CHAPTERS_MAP[session.chapterId];
    if (session.phase !== 'mini' || session.quizAnswered === null || !chapter?.quiz) return;
    if (session.quizIndex + 1 >= chapter.quiz.length) {
      session.quizDone = true;
    } else {
      session.quizIndex += 1;
      session.quizAnswered = null;
    }
    this.audio.play('select');
    this.showTravelSession();
  }

  private completeTravelChapter() {
    const session = this.travelSession;
    if (!session) return;
    const chapter = TRAVEL_CHAPTERS_MAP[session.chapterId];
    if (!chapter) return;
    const stars = this.travelStarsFor(session, chapter);
    const firstTime = !this.save.travel.chapters[chapter.id];
    let earned = 0;
    if (firstTime) {
      earned = chapter.rewardCoins[Math.max(0, Math.min(2, stars - 1))] ?? 0;
      this.save.coins += earned;
      this.save.travel.chapters[chapter.id] = {
        stars,
        day: this.save.pendingShopDay ?? this.save.day,
      };
    }
    this.save.city.traveling = null;
    persistSave(this.save);
    session.stars = stars;
    session.earned = earned;
    session.phase = 'result';
    this.audio.play(firstTime ? 'summary' : 'open');
    if (firstTime) this.ui.flash('gold');
    this.showTravelSession();
  }

  private travelFinish() {
    if (this.screen !== 'travel' || !this.travelSession || this.travelSession.phase !== 'result') return;
    const revisit = this.travelSession.revisit;
    this.travelSession = null;
    this.audio.play('close');
    this.ui.clearScreen();
    if (revisit) {
      this.ui.showTravel(this.travelView());
      return;
    }
    if (this.travelOrigin === 'city') {
      this.screen = 'city';
      this.ui.showCity(this.cityView());
    } else {
      this.screen = 'shop';
      this.ui.showShop(this.shopView());
    }
  }

  private travelBackToJournal() {
    if (this.screen !== 'travel' || !this.travelSession) return;
    if (this.travelSession.phase !== 'result') return;
    this.travelSession = null;
    this.ui.clearScreen();
    this.ui.showTravel(this.travelView());
  }

  // ───────────────────────────────────────── spawning & customers

  private trySpawn(): boolean {
    const p = this.player;
    if (!p || !this.dayActive) return false;
    if (p.orders.length >= this.config.maxOrders) return false;
    const seat = this.scene.getSeatForNewCustomer();
    if (seat === null) return false;

    const met = new Set(this.save.metCustomers);
    const activeCustomers = new Set(p.orders.map((order) => order.customerId));
    let picked = customerForDay(this.config.day, this.config.vipChance, met);
    for (let i = 0; i < 5 && activeCustomers.has(picked.customer.id); i++) {
      picked = customerForDay(this.config.day, this.config.vipChance, met);
    }
    const { customer, vip } = picked;
    const rush = !vip && Math.random() < this.config.rushChance;
    const plan = planDineIn({
      day: this.config.day,
      customer,
      unlocked: this.unlockedDrinks(),
      extraIds: this.extraDrinks(),
      rapport: this.save.regulars[customer.id] ?? 0,
      last: this.save.lastOrders[customer.id],
      allowSpecial: !vip && !rush,
    });
    const patienceMax = Math.max(
      18,
      this.config.patience *
        (1 + this.save.upgrades.seat * 0.1 + this.suppliesBuff().patience) *
        (vip ? 0.86 : 1) *
        (rush ? 0.62 : 1),
    );
    const order: OrderState = {
      id: `order-${Date.now()}-${this.orderSeq++}`,
      customerId: customer.id,
      drinkId: plan.drinkId,
      request: plan.request,
      kind: plan.kind,
      wishTags: plan.wishTags,
      patienceMax,
      patience: patienceMax,
      accepted: false,
      vip,
      rush,
      seat,
      channel: 'dine-in',
      talked: false,
      tipBonus: 0,
      createdAt: performance.now(),
      status: 'waiting',
    };
    p.orders.push(order);
    this.scene.spawnCustomer(order.id, customer, seat, vip);

    const isNew = !met.has(customer.id);
    if (isNew) {
      this.save.metCustomers.push(customer.id);
      persistSave(this.save);
      this.ui.toast(`第一次见到「${customer.name}」`, 'heart', 'heart');
    }
    return true;
  }

  private trySpawnDelivery(): boolean {
    const p = this.player;
    if (!p || !this.dayActive || this.config.deliveryEvery <= 0) return false;
    if (p.orders.length >= this.config.maxOrders) return false;

    const met = new Set(this.save.metCustomers);
    const pool = Object.values(CUSTOMERS_MAP).filter((customer) => customer.minDay <= this.config.day);
    const known = pool.filter((customer) => met.has(customer.id));
    const base = known.length > 0 ? known : pool;
    const active = new Set(p.orders.filter((order) => order.channel === 'dine-in').map((order) => order.customerId));
    const candidates = base.filter((customer) => !active.has(customer.id));
    const choices = candidates.length > 0 ? candidates : base;
    const customer = choices[Math.floor(Math.random() * choices.length)];
    if (!customer) return false;

    const plan = planDelivery(this.config.day, customer, this.unlockedDrinks(), this.extraDrinks());
    const drink = DRINKS_MAP[plan.drinkId];
    const fee = 4 + Math.floor(Math.random() * 6);
    const distance = `${280 + Math.floor(Math.random() * 1500)}m`;
    const address = DELIVERY_ADDRESSES[Math.floor(Math.random() * DELIVERY_ADDRESSES.length)];
    const patienceMax = Math.max(26, this.config.patience * 0.64 * (1 + this.suppliesBuff().patience));
    const order: OrderState = {
      id: `order-${Date.now()}-${this.orderSeq++}`,
      customerId: customer.id,
      drinkId: plan.drinkId,
      request: plan.request,
      kind: 'menu',
      patienceMax,
      patience: patienceMax,
      accepted: false,
      vip: false,
      rush: false,
      seat: -1,
      channel: 'delivery',
      delivery: {
        address,
        distance,
        fee,
        note: plan.note.text,
        packaging: plan.packaging,
      },
      talked: false,
      tipBonus: 0,
      createdAt: performance.now(),
      status: 'waiting',
    };
    p.orders.push(order);
    this.audio.play('delivery');
    this.ui.toast(`外卖单来了：${address} · ${drink ? CATEGORY_META[drink.category].label : '饮品'}`, 'info', 'delivery');
    return true;
  }

  private onCustomerArrive(id: string) {
    if (!this.player) return;
    const order = this.player.orders.find((entry) => entry.id === id);
    if (!order) return;
    this.audio.play('spawn');
    if (order.vip) {
      const customer = CUSTOMERS_MAP[order.customerId];
      if (customer) this.ui.toast(`贵宾 ${customer.name} 来了，好好招待！`, 'warning', 'crown');
    }
  }

  private onCustomerGone(id: string) {
    if (!this.player) return;
    this.player.orders = this.player.orders.filter((order) => order.id !== id);
    this.craftDrafts.delete(id);
  }

  private customerGaveUp(order: OrderState) {
    const p = this.player;
    if (!p) return;
    if (!p.orders.some((entry) => entry.id === order.id)) return;
    const customer = CUSTOMERS_MAP[order.customerId];
    p.orders = p.orders.filter((entry) => entry.id !== order.id);
    this.craftDrafts.delete(order.id);
    p.hearts = Math.max(0, p.hearts - 1);
    p.combo = 0;
    p.walkouts += 1;
    order.status = 'left';
    this.scene.sendCustomerAway(order.id, true);
    this.audio.play('heart');
    this.ui.flash('heart');
    this.ui.hurtHud();
    this.ui.toast(`${customer?.name ?? '客人'}等太久了，先走了…`, 'heart', 'heart');
    this.save.bestCombo = Math.max(this.save.bestCombo, p.maxComboToday);
    persistSave(this.save);
    if (p.hearts <= 0) this.endDay('hearts');
  }

  private deliveryGaveUp(order: OrderState) {
    const p = this.player;
    if (!p) return;
    if (!p.orders.some((entry) => entry.id === order.id)) return;
    const address = order.delivery?.address ?? '街角';
    p.orders = p.orders.filter((entry) => entry.id !== order.id);
    this.craftDrafts.delete(order.id);
    p.hearts = Math.max(0, p.hearts - 1);
    p.combo = 0;
    p.walkouts += 1;
    order.status = 'left';
    this.audio.play('heart');
    this.ui.flash('heart');
    this.ui.hurtHud();
    this.ui.toast(`${address} 的外卖超时了，骑手先走了…`, 'heart', 'delivery');
    this.save.bestCombo = Math.max(this.save.bestCombo, p.maxComboToday);
    persistSave(this.save);
    if (p.hearts <= 0) this.endDay('hearts');
  }

  // ───────────────────────────────────────── order & craft

  private openOrder(id: string) {
    if (this.screen !== 'playing' || this.overlay) return;
    const p = this.player;
    if (!p) return;
    const order = p.orders.find((entry) => entry.id === id);
    if (!order) return;
    if (order.accepted) {
      this.startCraft(id);
      return;
    }
    const customer = CUSTOMERS_MAP[order.customerId];
    const drink = DRINKS_MAP[order.drinkId];
    if (!customer || !drink) return;
    this.overlay = 'order';
    this.scene.setInteractive(false);
    this.ui.setOverlayActive(true);
    this.advanceTutorial(1);
    this.audio.play('open');
    const view: OrderSlipView = {
      order,
      customer,
      drink,
      recipes: this.unlockedDrinks(),
      tutorial: !this.save.tutorialSeen && this.tutorialStep <= 1,
      revealName: revealsDrinkName(this.config.day, this.save.tutorialSeen),
    };
    this.ui.showOrderSlip(view);
  }

  private acceptOrder(id: string) {
    if (this.screen !== 'playing') return;
    if (this.overlay !== 'order') return;
    const order = this.player?.orders.find((entry) => entry.id === id);
    if (!order || order.accepted) return;
    order.accepted = true;
    order.status = 'waiting';
    if (order.channel === 'delivery') {
      order.patience = Math.min(order.patienceMax, order.patience + 3);
    } else {
      order.patience = order.patienceMax;
    }
    this.audio.play('accept');
    this.advanceTutorial(2);
    this.ui.toast(
      order.channel === 'delivery' ? '外卖单记下了，骑手在等这一单。' : '已经记进小本子啦，开始调饮！',
      'success',
      'notebook',
    );
    if (this.maybeStartChat(order)) return;
    this.startCraft(id, true);
  }

  private maybeStartChat(order: OrderState): boolean {
    const customer = CUSTOMERS_MAP[order.customerId];
    if (!customer || order.rush || order.talked) return false;
    if (!this.save.tutorialSeen) return false;
    const drink = DRINKS_MAP[order.drinkId];
    if (!drink) return false;
    const rapport = this.save.regulars[customer.id] ?? 0;
    const unlocked = customer.chats.filter((entry) => entry.minRapport <= rapport);
    if (!unlocked.length) return false;
    const chance = Math.min(0.58, 0.32 + rapport * 0.03);
    if (Math.random() > chance) return false;
    // Newest unlocked tier first; once every tier is heard, any unlocked one.
    const fresh = unlocked
      .filter((entry) => !this.save.chatsSeen.includes(entry.id))
      .sort((a, b) => b.minRapport - a.minRapport)[0];
    const chat = fresh ?? unlocked[Math.floor(Math.random() * unlocked.length)];
    order.talked = true;
    this.chat = { orderId: order.id, chatId: chat.id, replyIndex: null, liked: false };
    this.overlay = 'chat';
    this.scene.setInteractive(false);
    this.ui.setOverlayActive(true);
    this.audio.play('chat');
    this.ui.showChat({ order, customer, drink, chat, replyIndex: null, liked: false });
    return true;
  }

  private answerChat(index: number) {
    if (!this.chat || this.overlay !== 'chat' || this.chat.replyIndex !== null) return;
    const state = this.chat;
    const order = this.player?.orders.find((entry) => entry.id === state.orderId);
    const customer = order ? CUSTOMERS_MAP[order.customerId] : undefined;
    const drink = order ? DRINKS_MAP[order.drinkId] : undefined;
    const chat = customer?.chats.find((entry) => entry.id === state.chatId);
    const option = chat?.options[index];
    if (!order || !customer || !drink || !chat || !option) return;
    const liked = !!option.liked;
    state.replyIndex = index;
    state.liked = liked;
    if (liked) {
      order.tipBonus += 0.1;
      this.save.regulars[customer.id] = Math.min(99, (this.save.regulars[customer.id] ?? 0) + 1);
    } else {
      order.tipBonus += 0.04;
    }
    if (!this.save.chatsSeen.includes(chat.id)) this.save.chatsSeen.push(chat.id);
    persistSave(this.save);
    this.audio.play(liked ? 'accept' : 'select');
    this.ui.showChat({ order, customer, drink, chat, replyIndex: index, liked });
  }

  private finishChat() {
    if (this.overlay !== 'chat') return;
    const id = this.chat?.orderId;
    this.chat = null;
    this.overlay = null;
    if (id) this.startCraft(id, true);
    // startCraft can bail (order gone, guest left); never leave the chat layer
    // on screen with no overlay owning it.
    if (this.overlay !== 'craft') {
      this.scene.setInteractive(true);
      this.ui.setOverlayActive(false);
      this.ui.clearScreen();
    }
  }

  private startCraft(id: string, fromSlip = false) {
    if (this.screen !== 'playing') return;
    if (!fromSlip && this.overlay !== null && this.overlay !== 'notebook' && this.overlay !== 'order') return;
    const p = this.player;
    if (!p) return;
    const order = p.orders.find((entry) => entry.id === id);
    if (!order || !order.accepted) return;
    if (order.channel === 'dine-in' && !this.scene.isCustomerActive(id)) return;
    const customer = CUSTOMERS_MAP[order.customerId];
    const drink = DRINKS_MAP[order.drinkId];
    if (!customer || !drink) return;

    const draft = this.craftDrafts.get(id);
    this.craft = draft
      ? {
          orderId: id,
          drinkId: draft.drinkId,
          step: draft.step,
          selections: { ...draft.selections },
          shake: draft.shake ? cloneFinish(draft.shake) : null,
          packed: [...draft.packed],
          packWrong: draft.packWrong,
        }
      : {
          orderId: id,
          drinkId: null,
          step: 'assemble',
          selections: emptySelections(),
          shake: null,
          packed: [],
          packWrong: 0,
        };
    order.status = 'in-craft';
    this.overlay = 'craft';
    this.scene.setInteractive(false);
    this.ui.setOverlayActive(true);
    this.audio.play('open');
    this.ensurePreview();
    const view = this.craftView();
    if (!view) return;
    this.ui.showCraft(view);
    if (this.previewCanvas) this.ui.mountPreviewCanvas(this.previewCanvas);
    const preview = this.preview;
    window.requestAnimationFrame(() => {
      if (this.overlay !== 'craft') return;
      preview?.setActive(true);
      preview?.resize();
      this.refreshPreview();
    });
    window.setTimeout(() => {
      if (this.overlay === 'craft') preview?.resize();
    }, 120);
  }

  private ensurePreview() {
    if (!this.previewCanvas) {
      this.previewCanvas = document.createElement('canvas');
      this.previewCanvas.setAttribute('aria-hidden', 'true');
    }
    if (!this.preview) {
      this.preview = new CupPreview(this.previewCanvas);
    }
  }

  private refreshPreview() {
    if (!this.craft || !this.preview) return;
    // Before 「选杯」 show a plain tea cup: the order's own cup shape would give
    // away which drink a described or wished-for order means.
    const drink = this.craft.drinkId ? DRINKS_MAP[this.craft.drinkId] : DRINKS[0];
    if (!drink) return;
    this.preview.setCup(partialRecipe(this.craft.selections), drink, this.craft.step);
  }

  /** The drink being made: the one picked in 「选杯」, else the order's drink. */
  private craftDrink(): DrinkDef | undefined {
    if (!this.craft) return undefined;
    if (this.craft.drinkId) return DRINKS_MAP[this.craft.drinkId];
    const order = this.player?.orders.find((entry) => entry.id === this.craft?.orderId);
    return order ? DRINKS_MAP[order.drinkId] : undefined;
  }

  private craftView(): CraftView | null {
    if (!this.craft) return null;
    const order = this.player?.orders.find((entry) => entry.id === this.craft?.orderId);
    if (!order) return null;
    const customer = CUSTOMERS_MAP[order.customerId];
    const orderDrink = DRINKS_MAP[order.drinkId];
    const drink = this.craftDrink();
    if (!customer || !orderDrink || !drink) return null;
    const shake = this.craft.shake;
    const shakeView: ShakeView | null = shake
      ? {
          drink,
          engine: shake.engine,
          taps: shake.scores.length,
          tapsNeeded: shake.units,
          scores: shake.scores,
          grades: shake.grades,
          quality: shake.quality,
          done: shake.done,
          perfect: shake.perfect,
        }
      : null;
    const packed = this.craft.packed;
    const required = order.delivery?.packaging ?? [];
    const teaching = this.save.deliveryTotal < 2;
    const packaging =
      order.channel === 'delivery' && order.delivery
        ? {
            items: packingShelf(required).map((id) => {
              const meta = PACKAGING_META[id];
              return {
                id,
                label: meta?.label ?? id,
                sub: meta?.sub ?? '',
                icon: meta?.icon ?? 'delivery',
                color: meta?.color ?? '#a8b6ea',
                packed: packed.includes(id),
                hint: teaching && required.includes(id),
              };
            }),
            needed: required.length,
            done: required.filter((id) => packed.includes(id)).length,
            wrong: this.craft.packWrong,
            allPacked: required.every((id) => packed.includes(id)),
          }
        : null;
    const last = this.save.lastOrders[customer.id];
    const lastDrink = last ? DRINKS_MAP[last.drinkId] : undefined;
    return {
      order,
      customer,
      drink,
      orderDrink,
      chosen: this.craft.drinkId ? drink : null,
      revealName: revealsDrinkName(this.config.day, this.save.tutorialSeen),
      rapport: this.save.regulars[customer.id] ?? 0,
      last: last && lastDrink ? { drink: lastDrink, recipe: last.recipe } : null,
      selections: this.craft.selections,
      step: this.craft.step,
      shake: shakeView,
      packaging,
      recipes: this.unlockedDrinks(),
      tutorialHint: this.craftTutorialHint(),
    };
  }

  private craftTutorialHint(): string | null {
    if (this.save.tutorialSeen || !this.craft) return null;
    if (this.craft.step === 'assemble' && this.tutorialStep >= 1) {
      return '小提示：先在「选杯」里点客人要的那杯，配方会自动填好；再照便签改冰量、糖度、杯型和小料。';
    }
    if (this.craft.step === 'shake') {
      return '小提示：茶饮跟节拍点按，奶昔按住再在薄荷色目标带松手，冰淇淋对准球堆顶部落球。空格键也可以。';
    }
    return null;
  }

  private unlockedDrinks(): DrinkDef[] {
    return DRINKS.filter((drink) => this.config.unlockedDrinkIds.includes(drink.id));
  }

  /** Widens every finish window: 收尾特训 +18% per level, plus 珍珠礼袋. */
  private finishEase(supplies: SupplyId[] = this.supplyIds()): number {
    return 1 + this.save.upgrades.training * 0.18 + supplyBuff(supplies).zone;
  }

  /** 「选杯」: picking a drink fills all seven fields with its base recipe. */
  private pickDrink(id: string) {
    if (!this.craft || this.craft.step !== 'assemble') return;
    const drink = DRINKS_MAP[id];
    if (!drink || !this.config.unlockedDrinkIds.includes(id)) return;
    this.craft.drinkId = id;
    this.craft.selections = { ...drink.recipe };
    this.audio.play('select');
    const view = this.craftView();
    if (!view) return;
    // The finish panel and preview caption are built for one drink; rebuild.
    this.ui.showCraft(view);
    if (this.previewCanvas) this.ui.mountPreviewCanvas(this.previewCanvas);
    window.requestAnimationFrame(() => this.preview?.resize());
    this.refreshPreview();
  }

  private selectIngredient(key: keyof CraftSelections, value: string) {
    if (!this.craft || this.craft.step !== 'assemble') return;
    // Selections only ever exist alongside a picked drink, so a complete
    // recipe always has a drink to be judged as.
    if (!this.craft.drinkId) {
      this.audio.play('error');
      this.ui.toast('先在「选杯」里点一杯，配方会自动填好。', 'info', 'cup');
      return;
    }
    const selections = this.craft.selections;
    if (selections[key] === value) return;
    switch (key) {
      case 'tea':
        selections.tea = value as TeaBase;
        break;
      case 'milk':
        selections.milk = value as MilkType;
        break;
      case 'flavor':
        selections.flavor = value as FlavorType;
        break;
      case 'topping':
        selections.topping = value as ToppingType;
        break;
      case 'ice':
        selections.ice = value as IceType;
        break;
      case 'sugar':
        selections.sugar = value as CraftSelections['sugar'];
        break;
      case 'size':
        selections.size = value as SizeType;
        break;
    }
    this.audio.play('select');
    this.refreshPreview();
    const view = this.craftView();
    if (view) this.ui.updateCraft(view);
  }

  private clearSelections() {
    if (!this.craft || this.craft.step !== 'assemble') return;
    this.craft.selections = emptySelections();
    this.craft.drinkId = null;
    this.audio.play('close');
    this.refreshPreview();
    const view = this.craftView();
    if (view) this.ui.updateCraft(view);
  }

  private goShake() {
    if (!this.craft || this.craft.step !== 'assemble') return;
    if (!allSelected(this.craft.selections)) return;
    this.craft.step = 'shake';
    const drink = this.craftDrink();
    this.craft.shake = createFinish(FINISH_ENGINE[drink?.finish ?? 'shake'], {
      ease: this.finishEase(),
      seed: Math.floor(Math.random() * 2 ** 31),
    });
    this.advanceTutorial(3);
    this.audio.play('open');
    this.preview?.pulse(0.6);
    this.refreshPreview();
    const view = this.craftView();
    if (view) this.ui.updateCraft(view);
  }

  private updateShake(dt: number) {
    const shake = this.craft?.shake;
    if (!shake) return;
    const events = tickFinish(shake, dt);
    if (events.length) this.onShopFinishEvents(events);
    this.ui.updateFinish(finishFrame(shake));
  }

  private tapShake() {
    const shake = this.activeShake();
    if (!shake) return;
    const events = pressFinish(shake);
    if (events.length) this.onShopFinishEvents(events);
  }

  private releaseShake() {
    const shake = this.activeShake();
    if (!shake) return;
    const events = releaseFinish(shake);
    if (events.length) this.onShopFinishEvents(events);
  }

  private activeShake(): FinishState | null {
    if (this.overlay !== 'craft' || this.craft?.step !== 'shake') return null;
    const shake = this.craft.shake;
    return shake && !shake.done ? shake : null;
  }

  private onShopFinishEvents(events: FinishEvent[]) {
    const shake = this.craft?.shake;
    if (!shake) return;
    this.playFinishSfx(events, shake.engine);
    let scored = false;
    for (const event of events) {
      if (event.type === 'score') {
        scored = true;
        this.preview?.pulse(event.grade === 'perfect' ? 0.9 : 0.45);
      } else if (event.type === 'done') {
        this.preview?.pulse(1);
        // Players tapping to the beat keep tapping; don't let those taps land on 「完成」.
        this.stepGuardUntil = performance.now() + STEP_GUARD_MS;
      }
    }
    if (!scored) return;
    const view = this.craftView();
    if (view) this.ui.updateCraft(view);
  }

  private finishShake() {
    if (!this.craft || !this.craft.shake?.done) return;
    if (performance.now() < this.stepGuardUntil) return;
    this.craft.step = 'ready';
    this.stepGuardUntil = performance.now() + STEP_GUARD_MS;
    this.audio.play('accept');
    this.advanceTutorial(4);
    if (!this.save.tutorialSeen) {
      this.save.tutorialSeen = true;
      this.tutorialStep = 4;
      persistSave(this.save);
      this.ui.toast('新手引导完成，接下来就交给你啦。', 'success', 'star');
    }
    const order = this.player?.orders.find((entry) => entry.id === this.craft?.orderId);
    if (order?.channel === 'delivery') {
      this.ui.toast('出杯啦，记得把外卖打包好再交给骑手。', 'info', 'delivery');
    }
    this.refreshPreview();
    const view = this.craftView();
    if (view) this.ui.updateCraft(view);
  }

  private packItem(id: string) {
    const craft = this.craft;
    if (!craft || craft.step !== 'ready') return;
    const order = this.player?.orders.find((entry) => entry.id === craft.orderId);
    if (!order?.delivery) return;
    const required = order.delivery.packaging;
    if (!packingShelf(required).includes(id)) return;
    const label = PACKAGING_META[id]?.label ?? id;
    if (craft.packed.includes(id)) {
      craft.packed = craft.packed.filter((item) => item !== id);
      this.audio.play('pack');
    } else if (!required.includes(id)) {
      craft.packWrong += 1;
      this.audio.play('error');
      this.ui.toast(`这一单用不上「${label}」，拿回架子上啦。`, 'warning', 'delivery');
    } else if (id === 'bag' && required.some((item) => item !== 'bag' && !craft.packed.includes(item))) {
      this.audio.play('error');
      this.ui.toast('袋子先别封口，还有东西没装进去。', 'warning', 'delivery');
    } else {
      craft.packed.push(id);
      this.audio.play('pack');
      if (required.every((item) => craft.packed.includes(item))) {
        this.ui.toast('打包完成，可以交给骑手啦！', 'success', 'check');
      }
    }
    const view = this.craftView();
    if (view) this.ui.updateCraft(view);
  }

  private serve() {
    if (!this.craft || this.craft.step !== 'ready') return;
    if (performance.now() < this.stepGuardUntil) return;
    const p = this.player;
    if (!p) return;
    const order = p.orders.find((entry) => entry.id === this.craft?.orderId);
    if (!order || !allSelected(this.craft.selections)) return;
    const customer = CUSTOMERS_MAP[order.customerId];
    const orderDrink = DRINKS_MAP[order.drinkId];
    const chosen = this.craftDrink();
    if (!customer || !orderDrink || !chosen) return;

    const required = order.delivery?.packaging ?? [];
    const packagingTotal = required.length;
    if (order.channel === 'delivery' && !required.every((id) => this.craft?.packed.includes(id))) {
      this.audio.play('error');
      this.ui.toast('还有东西没装进袋子，骑手不能取餐哦。', 'warning', 'delivery');
      return;
    }
    const packagingWrong = this.craft.packWrong;
    const packagingScore = packagingTotal > 0 ? Math.max(0, 1 - packagingWrong * 0.15) : 1;

    const made: Recipe = { ...this.craft.selections };
    const { target, drinkOk, favorite, wishMatched } = resolveTarget(order, chosen, customer);
    const comparison = compareRecipe(target, made);
    const shake = this.craft.shake;
    const shakeQuality = shake?.quality ?? 0;
    const perfectShake = shake?.perfect ?? false;
    const perfect = comparison.matches === comparison.total;

    const displayMult = 1 + this.save.upgrades.display * 0.07;
    const signLevel = this.save.upgrades.sign;
    // A wish is priced by whichever fitting drink the player chose.
    const base = (drinkOk ? chosen : orderDrink).price * displayMult;
    let payout = 0;
    let tip = 0;
    if (perfect) {
      payout = Math.round(base) + 4;
      tip = Math.round(base * (0.2 + signLevel * 0.05 + (perfectShake ? 0.12 : 0)) + p.combo * 1.4);
    } else if (comparison.matches >= 5) {
      payout = Math.round(base * (comparison.matches === 6 ? 0.88 : 0.78));
      tip = Math.round(base * (0.05 + signLevel * 0.03)) + (perfectShake ? 2 : 0);
    } else {
      payout = Math.round(base * 0.5);
    }
    if (order.vip) {
      payout = Math.round(payout * 1.8);
      tip = Math.round(tip * 1.8);
    }
    if (order.rush) payout += 6;
    if (order.tipBonus > 0) tip += Math.round(base * order.tipBonus);
    if (order.kind === 'wish' && drinkOk) tip += Math.round(base * (0.15 + (favorite ? 0.1 : 0)));
    if (order.kind === 'usual' && perfect) tip += Math.round(base * 0.25);

    let deliveryFee = 0;
    let deliveryRating = 0;
    if (order.channel === 'delivery') {
      deliveryFee = order.delivery?.fee ?? 0;
      const patienceRatio = order.patience / Math.max(1, order.patienceMax);
      if (comparison.matches >= 7 && patienceRatio > 0.18) deliveryRating = 3;
      else if (comparison.matches >= 5) deliveryRating = patienceRatio > 0.18 ? 2 : 1;
      else deliveryRating = 1;
      if (patienceRatio < 0.12) deliveryRating = Math.min(deliveryRating, 2);
      if (packagingWrong >= 3) deliveryRating = 1;
      else if (packagingWrong >= 1) deliveryRating = Math.min(deliveryRating, 2);
      tip += deliveryRating * 3;
      if (deliveryRating === 3) p.delivery3Today += 1;
    }

    const supply = this.suppliesBuff();
    const souvenirBonus = this.travelBonus();
    payout = Math.round(payout * (1 + supply.price));
    if (tip > 0) tip = Math.round(tip * (1 + supply.tip + souvenirBonus));

    if (comparison.matches >= 6) {
      p.combo += 1;
      p.maxComboToday = Math.max(p.maxComboToday, p.combo);
      this.save.bestCombo = Math.max(this.save.bestCombo, p.combo);
    } else if (comparison.matches <= 4) {
      p.combo = 0;
    }
    if (comparison.matches <= 4) {
      p.hearts = Math.max(0, p.hearts - 1);
      this.audio.play('heart');
      this.ui.flash('heart');
      this.ui.hurtHud();
    }
    let rapportGain = 0;
    if (perfect) {
      p.perfectToday += 1;
      rapportGain += 1;
      this.save.lastOrders[customer.id] = { drinkId: chosen.id, recipe: { ...made }, day: this.config.day };
    }
    if (favorite) rapportGain += 1;
    if (rapportGain > 0) {
      this.save.regulars[customer.id] = Math.min(99, (this.save.regulars[customer.id] ?? 0) + rapportGain);
    }
    if (comparison.matches >= 5 && !p.categoriesServed.includes(chosen.category)) {
      p.categoriesServed.push(chosen.category);
    }
    const earned = payout + tip + deliveryFee;
    p.revenue += earned;
    p.servedToday += 1;
    p.coins = this.save.coins + earned;
    this.save.coins += earned;
    this.save.totalCoinsEarned += earned;
    this.save.servedTotal += 1;
    if (perfect) this.save.perfectTotal += 1;
    if (order.channel === 'delivery') {
      this.save.deliveryTotal += 1;
      this.save.bestDeliveryRating = Math.max(this.save.bestDeliveryRating, deliveryRating);
    }
    this.save.bestRevenue = Math.max(this.save.bestRevenue, Math.round(p.revenue));
    p.completedOrders.push({
      id: order.id,
      customerId: order.customerId,
      drinkId: chosen.id,
      payout,
      matches: comparison.matches,
      total: comparison.total,
      perfectShake,
    });

    const result: ServeResult = {
      order,
      chosenDrinkId: chosen.id,
      target,
      matches: comparison.matches,
      total: comparison.total,
      matched: comparison.matched,
      payout,
      tip,
      perfect,
      angry: comparison.matches <= 4,
      shakeQuality,
      perfectShake,
      deliveryFee,
      deliveryRating,
      packagingScore,
      packagingTotal,
      packagingWrong,
      drinkOk,
      favorite,
      wishMatched,
      rapportGain,
    };

    order.status = 'served';
    if (order.channel === 'dine-in') {
      this.scene.serveCustomer(order.id, chosen.id, made.topping);
    }
    p.orders = p.orders.filter((entry) => entry.id !== order.id);
    this.craftDrafts.delete(order.id);
    this.craft = null;
    this.overlay = 'result';
    this.pendingEnd = p.hearts <= 0 ? 'hearts' : null;
    this.preview?.setActive(false);
    this.scene.setInteractive(false);
    this.ui.setOverlayActive(true);
    this.audio.play('serve');
    window.setTimeout(() => this.audio.play('coin'), 260);
    if (perfect) {
      this.ui.flash('gold');
      if (perfectShake || p.combo === 3) this.scene.celebrate();
    }
    if (deliveryRating === 3) this.scene.celebrate();

    const expression = perfect ? 'happy' : comparison.matches >= 5 ? 'smile' : 'sad';
    const quote =
      order.channel === 'delivery' && order.delivery?.note
        ? order.delivery.note
        : perfect
          ? customer.lines.perfect
          : comparison.matches >= 5
            ? customer.lines.good
            : customer.lines.bad;
    const view: ServeView = {
      result,
      order,
      customer,
      drink: chosen,
      made,
      quote,
      coins: this.save.coins,
      combo: p.combo,
      hearts: p.hearts,
      expression,
    };
    this.ui.showServeResult(view);
    this.ui.updateHud(this.hudState());
    persistSave(this.save);
    this.checkChallenge();
  }

  private closeCraft() {
    if (!this.craft) return;
    const order = this.player?.orders.find((entry) => entry.id === this.craft?.orderId);
    this.craftDrafts.set(this.craft.orderId, {
      drinkId: this.craft.drinkId,
      step: this.craft.step,
      selections: { ...this.craft.selections },
      shake: this.craft.shake ? cloneFinish(this.craft.shake) : null,
      packed: [...this.craft.packed],
      packWrong: this.craft.packWrong,
    });
    if (order && order.status === 'in-craft') order.status = 'waiting';
    this.craft = null;
    this.overlay = null;
    this.preview?.setActive(false);
    this.scene.setInteractive(true);
    this.ui.setOverlayActive(false);
    this.ui.clearScreen();
    this.audio.play('close');
    this.ui.toast('订单留在小本子里，随时可以继续。', 'info', 'notebook');
  }

  // ───────────────────────────────────────── overlays

  private openNotebook(tab?: NotebookTab) {
    if (this.screen !== 'playing' || this.overlay) return;
    const p = this.player;
    if (!p) return;
    this.overlay = 'notebook';
    this.scene.setInteractive(false);
    this.ui.setOverlayActive(true);
    this.audio.play('open');
    const view: NotebookView = {
      day: this.config.day,
      themeName: this.config.theme.name,
      revealName: revealsDrinkName(this.config.day, this.save.tutorialSeen),
      orders: p.orders
        .filter((order) => order.accepted && order.status === 'waiting')
        .map((order) => ({
          order,
          customer: CUSTOMERS_MAP[order.customerId],
          drink: DRINKS_MAP[order.drinkId],
        }))
        .filter((entry) => !!entry.customer && !!entry.drink),
      met: this.save.metCustomers
        .map((id) => CUSTOMERS_MAP[id])
        .filter((customer): customer is CustomerDef => !!customer),
      regulars: { ...this.save.regulars },
      lastOrders: { ...this.save.lastOrders },
      unlocked: this.unlockedDrinks(),
      totalServed: this.save.servedTotal,
    };
    this.ui.showNotebook(view, tab);
  }

  private pauseView(): PauseView | null {
    const p = this.player;
    if (!p) return null;
    return {
      day: this.config.day,
      revenue: p.revenue,
      goal: this.config.goal,
      hearts: p.hearts,
      sound: this.save.sound,
      music: this.save.music,
      supplies: this.supplyDefs(this.supplyIds()),
      travelBonus: this.travelBonus(),
      challenge: challengeProgress(this.config.challenge, p),
    };
  }

  private openPause() {
    if (this.screen !== 'playing' || this.overlay) return;
    const view = this.pauseView();
    if (!view) return;
    this.overlay = 'pause';
    this.signBeforePause = this.storeOpen;
    this.storeOpen = false;
    this.scene.setStoreOpen(false);
    this.scene.setInteractive(false);
    this.ui.setOverlayActive(true);
    this.audio.play('open');
    this.ui.showPause(view);
  }

  private resume() {
    if (this.overlay !== 'pause') return;
    this.overlay = null;
    this.storeOpen = this.signBeforePause ?? true;
    this.signBeforePause = null;
    this.scene.setStoreOpen(this.storeOpen);
    this.scene.setInteractive(true);
    this.ui.setOverlayActive(false);
    this.ui.clearScreen();
    this.audio.play('close');
    this.ui.updateHud(this.hudState());
  }

  private openHelp() {
    if (this.screen === 'title') {
      this.helpOrigin = 'title';
      this.screen = 'help';
      this.audio.play('open');
      this.ui.showHelp({ fromTitle: true });
      return;
    }
    if (this.overlay === 'pause') {
      this.helpOrigin = 'pause';
      this.overlay = 'help';
      this.audio.play('open');
      const view: HelpView = { fromTitle: false };
      this.ui.showHelp(view);
    }
  }

  private closeHelp() {
    this.audio.play('close');
    if (this.helpOrigin === 'pause') {
      this.helpOrigin = null;
      this.overlay = 'pause';
      const view = this.pauseView();
      if (view) this.ui.showPause(view);
      return;
    }
    if (this.helpOrigin === 'title') {
      this.helpOrigin = null;
      this.showTitle();
      return;
    }
    this.helpOrigin = null;
    if (this.screen === 'help') this.showTitle();
  }

  private closeResult() {
    if (this.overlay !== 'result') return;
    this.overlay = null;
    this.ui.setOverlayActive(false);
    this.ui.clearScreen();
    if (this.pendingEnd) {
      const reason = this.pendingEnd;
      this.pendingEnd = null;
      this.endDay(reason);
      return;
    }
    this.scene.setInteractive(true);
  }

  private closeOverlay() {
    switch (this.overlay) {
      case 'order':
        this.overlay = null;
        this.scene.setInteractive(true);
        this.ui.setOverlayActive(false);
        this.ui.clearScreen();
        this.audio.play('close');
        break;
      case 'craft':
        this.closeCraft();
        break;
      case 'notebook':
        this.overlay = null;
        this.scene.setInteractive(true);
        this.ui.setOverlayActive(false);
        this.ui.clearScreen();
        this.audio.play('close');
        break;
      case 'pause':
        this.resume();
        break;
      case 'help':
        this.closeHelp();
        break;
      case 'result':
        this.closeResult();
        break;
      case 'chat':
        this.finishChat();
        break;
      default:
        break;
    }
  }

  private goTitle() {
    if (this.screen === 'playing' && this.dayActive) {
      void this.ui
        .confirm({
          title: '回到标题画面？',
          text: '今天的营业会提前结束，已经赚到的金币会保留，但这一天不会重来。',
          confirmLabel: '结束营业并回标题',
        })
        .then((yes) => {
          if (yes) this.abandonShift();
        });
      return;
    }
    this.returnToTitle();
  }

  /**
   * Leaving a running shift early still consumes the day. Coins earned are
   * already banked, so without this the player could replay day 1 forever.
   */
  private abandonShift() {
    const p = this.player;
    this.save.pendingShopDay = this.config.day;
    this.save.openShiftDay = undefined;
    this.save.day = Math.min(999, this.config.day + 1);
    this.save.bestRevenue = Math.max(this.save.bestRevenue, Math.round(p?.revenue ?? 0));
    this.save.bestCombo = Math.max(this.save.bestCombo, p?.maxComboToday ?? 0);
    this.save.city.supplies = [];
    this.ensureEvening();
    persistSave(this.save);
    this.returnToTitle();
  }

  private returnToTitle() {
    this.audio.play('close');
    this.preview?.setActive(false);
    this.dayActive = false;
    this.overlay = null;
    this.helpOrigin = null;
    this.player = null;
    this.craft = null;
    this.chat = null;
    this.storeOpen = false;
    this.signBeforePause = null;
    this.craftDrafts.clear();
    this.scene.clearCustomers(false);
    this.scene.setStoreOpen(false);
    this.scene.setInteractive(false);
    this.ui.setOverlayActive(false);
    this.showTitle();
  }

  private async resetSave() {
    const yes = await this.ui.confirm({
      title: '重新开张？',
      text: '所有金币、配方、常客记录和升级都会消失。这个动作不能撤销，但会给你一个全新的第一天。',
      confirmLabel: '清空进度',
      danger: true,
    });
    if (!yes) return;
    wipeSave();
    this.save = freshSave();
    this.tutorialStep = 0;
    this.config = getDayConfig(1);
    this.audio.setEnabled(this.save.sound);
    this.preview?.setActive(false);
    this.dayActive = false;
    this.overlay = null;
    this.player = null;
    this.craft = null;
    this.chat = null;
    this.storeOpen = false;
    this.signBeforePause = null;
    this.craftDrafts.clear();
    this.scene.clearCustomers(false);
    this.scene.setStoreOpen(false);
    this.scene.setUpgrades(this.save.upgrades);
    this.scene.setDay(1, this.config.theme, this.config.unlockedDrinkIds);
    this.showTitle();
    this.ui.toast('新的第一天，重新开始吧。', 'success', 'peach');
  }

  private toggleSound() {
    const next = !this.save.sound;
    this.save.sound = next;
    if (next) {
      this.audio.setEnabled(true);
      this.audio.play('click');
    } else {
      this.audio.play('close');
      this.audio.setEnabled(false);
    }
    persistSave(this.save);
    this.ui.setSound(next);
    if (this.overlay === 'pause') {
      const view = this.pauseView();
      if (view) this.ui.showPause(view);
    }
    if (this.screen === 'playing' && this.player) this.ui.updateHud(this.hudState());
  }

  private toggleMusic() {
    const next = !this.save.music;
    this.save.music = next;
    this.audio.setMusicEnabled(next);
    // Unlock the AudioContext on this gesture so music can start immediately.
    if (next) this.audio.unlock();
    persistSave(this.save);
    this.ui.setMusic(next);
    if (this.screen === 'title') {
      // Re-render the title button icon via setMusic (already done above).
      return;
    }
    if (this.overlay === 'pause') {
      const view = this.pauseView();
      if (view) this.ui.showPause(view);
    }
  }

  // ───────────────────────────────────────── input & lifecycle

  private onKeyDown = (event: KeyboardEvent) => {
    if (document.querySelector('.confirm-layer')) return;
    if (event.key === 'Escape') {
      if (this.overlay) {
        event.preventDefault();
        if (this.overlay === 'pause') this.resume();
        else this.closeOverlay();
        return;
      }
      if (this.screen === 'playing') {
        event.preventDefault();
        this.openPause();
        return;
      }
      if (this.screen === 'city') {
        event.preventDefault();
        this.closeCity();
        return;
      }
      if (this.screen === 'travel') {
        event.preventDefault();
        if (this.travelSession) {
          if (this.travelSession.phase === 'result') this.travelFinish();
          else this.ui.toast('这一章还没走完，小桃号会等你。', 'info', 'plane');
        } else {
          this.closeTravel();
        }
        return;
      }
      if (this.screen === 'help') {
        event.preventDefault();
        this.closeHelp();
        return;
      }
      return;
    }
    if (event.code === 'Space' || event.key === ' ') {
      const target = this.spaceTarget();
      if (target) {
        event.preventDefault();
        if (event.repeat) return;
        if (target === 'shake') this.tapShake();
        else this.travelTimingTap();
      }
      return;
    }
    if (event.key === 'n' || event.key === 'N') {
      if (this.screen === 'playing' && !this.overlay) {
        event.preventDefault();
        this.openNotebook();
      }
    }
  };

  /** Space keyup releases a finish press (hold engine: 松手). */
  private onKeyUp = (event: KeyboardEvent) => {
    if (event.code !== 'Space' && event.key !== ' ') return;
    const target = this.spaceTarget();
    if (!target) return;
    event.preventDefault();
    if (target === 'shake') this.releaseShake();
    else this.travelTimingRelease();
  };

  /** Losing focus mid-hold would never deliver keyup / pointerup. */
  private onBlur = () => {
    this.releaseShake();
    this.travelTimingRelease();
  };

  /** Which finish mini-game Space drives right now, if any. */
  private spaceTarget(): 'shake' | 'travel' | null {
    if (this.overlay === 'craft' && this.craft?.step === 'shake') return 'shake';
    const timing = this.travelSession?.timing;
    if (this.screen === 'travel' && this.travelSession?.phase === 'mini' && timing && !timing.done) return 'travel';
    return null;
  }

  private onResize = () => {
    window.clearTimeout(this.resizeTimer);
    this.resizeTimer = window.setTimeout(() => {
      if (this.overlay === 'craft') {
        this.preview?.resize();
      }
    }, 120);
  };
}
