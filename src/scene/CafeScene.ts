import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import type { CustomerDef, DayTheme, DrinkDef, UpgradeId } from '../game/types';
import { CUSTOMERS, DRINKS_MAP, DRINKS } from '../game/data';
import { GuestSheets, StorybookGuest } from './StorybookGuest';
import { PaintedRoom, drawGarden, paperFinish } from './PaintedRoom';
import {
  archShape,
  contactShadowTexture,
  easeOutBack,
  heartTexture,
  makeCanvasTexture,
  mesh,
  petalTexture,
  radialTexture,
  softShadowTexture,
  standard,
  starTexture,
  toon,
} from './threeUtils';
import { buildCup, disposeCup } from './cupModel';

type CustomerVisualState = 'walking' | 'waiting' | 'served' | 'leaving' | 'angry';

interface SceneCustomer {
  orderId: string;
  figure: StorybookGuest;
  seat: number;
  state: CustomerVisualState;
  /** Remaining waypoints; guests walk the aisle, never through furniture. */
  path: { x: number; z: number }[];
  leaveTimer: number;
  mood: 'neutral' | 'worried' | 'sad';
  lastScreen: { x: number; y: number; visible: boolean };
  shadow: THREE.Mesh;
}

interface HeartParticle {
  sprite: THREE.Sprite;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  spin: number;
}

interface FlightCup {
  group: THREE.Group;
  start: THREE.Vector3;
  end: THREE.Vector3;
  t: number;
  hold: number;
  done: boolean;
  orderId: string;
}

export interface BubbleAnchor {
  orderId: string;
  x: number;
  y: number;
  visible: boolean;
  state: CustomerVisualState;
}

export interface SceneOptions {
  onCustomerClick?: (orderId: string) => void;
  onCustomerArrive?: (orderId: string) => void;
  onCustomerGone?: (orderId: string) => void;
}

const SEATS = [
  { x: -2.13, z: 2.46, angle: .11, tableX: -2.87, tableZ: 3.04 },
  { x: 0, z: 2.64, angle: -.035, tableX: .78, tableZ: 3.20 },
  { x: 2.15, z: 2.37, angle: -.12, tableX: 2.93, tableZ: 2.99 },
];

// open aisle in front of the tables that guests walk along
const AISLE_Z = 4.4;
const EXIT_X = 8.6;

// decorative stools behind the counter (not used for customer seating)
const BACK_STOOLS = [
  { x: -2.35, z: -3.86 },
  { x: 0, z: -3.86 },
  { x: 2.35, z: -3.86 },
];

const SKY_W = 1536;
const SKY_H = 888;

export class CafeScene {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  private composer: EffectComposer;
  private finish = paperFinish();
  private paint = new PaintedRoom();
  private garden?: HTMLImageElement;
  private clockTime = 0;
  private customers = new Map<string, SceneCustomer>();
  private sheets = new GuestSheets();
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2(-10, -10);
  private rayPointer = new THREE.Vector2();
  private hoveredId: string | null = null;
  private interactive = false;
  private options: SceneOptions;
  private cameraMode: 'title' | 'play' | 'summary' = 'title';
  private cameraBase = new THREE.Vector3(0, 4.45, 10.4);
  private lookBase = new THREE.Vector3(0, 1.45, -0.8);
  private mouseParallax = new THREE.Vector2();
  private currentLook = new THREE.Vector3(0, 1.45, -0.8);
  private theme: DayTheme;
  private ambientLight = new THREE.HemisphereLight(0xdcecff, 0xe9cdb8, 0.9);
  private sunLight = new THREE.DirectionalLight(0xfff0d2, 1.8);
  private fillLight = new THREE.DirectionalLight(0xcfe4ff, 0.34);
  private bulbLights: THREE.PointLight[] = [];
  private windowTexture: THREE.CanvasTexture;
  private skyCanvas: HTMLCanvasElement;
  private menuTexture: THREE.CanvasTexture;
  private signTexture: THREE.CanvasTexture;
  private signGlow!: THREE.Sprite;
  private glassMaterial!: THREE.MeshPhysicalMaterial;
  private storeOpen = false;
  private doorFlip = Math.PI;
  private doorFlipTarget = Math.PI;
  private doorSignSway?: THREE.Group;
  private doorSignPivot?: THREE.Group;
  private doorBellGroup?: THREE.Group;
  private doorBellKick = 0;
  private doorGlow?: THREE.Sprite;
  private doorLight?: THREE.PointLight;
  private doorGlassMat?: THREE.MeshPhysicalMaterial;
  private petals: THREE.Sprite[] = [];
  private petalData: { speed: number; sway: number; phase: number; baseX: number; z: number }[] = [];
  private hearts: HeartParticle[] = [];
  private heartTex = heartTexture('#ff91b2');
  private flights: FlightCup[] = [];
  private softShadowTexture = softShadowTexture();
  private contactShadowTex = contactShadowTexture();
  private cushionMeshes: THREE.Mesh[] = [];
  private cakeMeshes: THREE.Object3D[] = [];
  private trophyGroup = new THREE.Group();
  private upgradeLevels: Record<UpgradeId, number> = { seat: 0, sign: 0, display: 0, training: 0 };
  private unlockedDrinks: DrinkDef[] = [];
  private day = 1;
  private busySeats = new Set<number>();
  private resizeObserver?: ResizeObserver;
  private disposed = false;

  constructor(canvas: HTMLCanvasElement, theme: DayTheme, options: SceneOptions = {}) {
    this.theme = theme;
    this.options = options;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(1.8, window.devicePixelRatio || 1));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.scene.background = new THREE.Color('#f7dfe6');

    this.camera = new THREE.PerspectiveCamera(44, window.innerWidth / window.innerHeight, 0.1, 60);
    this.camera.position.copy(this.cameraBase);
    this.camera.lookAt(this.currentLook);

    const sky = document.createElement('canvas');
    sky.width = SKY_W;
    sky.height = SKY_H;
    this.skyCanvas = sky;
    this.windowTexture = new THREE.CanvasTexture(sky);
    this.windowTexture.colorSpace = THREE.SRGBColorSpace;
    this.windowTexture.anisotropy = 8;

    this.menuTexture = makeCanvasTexture(1024, 640, (ctx, w, h) => this.drawMenu(ctx, w, h, []), { srgb: true });
    this.signTexture = makeCanvasTexture(1024, 256, (ctx, w, h) => this.drawSign(ctx, w, h));

    // Antialiasing happens in the composer's multisampled offscreen target.
    const renderTarget = new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.HalfFloatType,
      samples: 4,
    });
    this.composer = new EffectComposer(this.renderer, renderTarget);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.composer.addPass(this.finish);
    this.composer.addPass(new OutputPass());

    this.buildEnvironment();
    this.buildLights();
    this.buildPetals();
    this.setTheme(theme);
    this.paint.loadGarden(image => {
      this.garden = image;
      this.redrawWindow();
    });
    this.bindEvents();
    this.resize();
  }

  // ───────────────────────────── public API

  setDay(day: number, theme: DayTheme, unlockedDrinkIds: string[]) {
    this.day = day;
    for (const guest of CUSTOMERS) if (guest.minDay <= day) this.sheets.get(guest.id);
    this.unlockedDrinks = DRINKS.filter((d) => unlockedDrinkIds.includes(d.id));
    this.setTheme(theme);
    this.redrawMenu();
  }

  setUpgrades(levels: Record<UpgradeId, number>) {
    this.upgradeLevels = { ...levels };
    this.applyUpgradeVisuals();
  }

  setCameraMode(mode: 'title' | 'play' | 'summary') {
    this.cameraMode = mode;
    if (mode === 'title') {
      this.cameraBase.set(1.2, 4.7, 10.8);
      this.lookBase.set(0.2, 1.65, -0.9);
    } else if (mode === 'summary') {
      this.cameraBase.set(-0.5, 4.7, 10.5);
      this.lookBase.set(-0.1, 1.6, -0.9);
    } else {
      this.cameraBase.set(0, 3.60, 8.25);
      this.lookBase.set(0, 1.66, .25);
    }
  }

  setInteractive(value: boolean) {
    this.interactive = value;
    if (!value) {
      this.setHovered(null);
      this.renderer.domElement.style.cursor = 'default';
    }
  }

  setStoreOpen(open: boolean) {
    if (this.storeOpen === open) return;
    this.storeOpen = open;
    this.doorFlipTarget = open ? 0 : Math.PI;
    this.doorBellKick = 1;
    if (this.doorGlassMat) this.doorGlassMat.color.set(open ? '#ffe6ba' : '#cfe7e4');
  }

  getSeatForNewCustomer(): number | null {
    const order = [1, 0, 2];
    for (const seat of order) {
      if (!this.busySeats.has(seat)) {
        this.busySeats.add(seat);
        return seat;
      }
    }
    return null;
  }

  releaseSeat(seat: number) {
    this.busySeats.delete(seat);
  }

  spawnCustomer(orderId: string, customer: CustomerDef, seat: number, vip = false) {
    const seatData = SEATS[seat];
    const figure = new StorybookGuest(customer, this.sheets.get(customer.id), vip);
    figure.setLight(this.paint.paperLight);
    const startX = EXIT_X;
    figure.root.position.set(startX, 0, AISLE_Z);
    figure.setWalking(true);
    this.scene.add(figure.root);
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1.04, .56),
      new THREE.MeshBasicMaterial({ map: this.softShadowTexture, transparent: true, depthWrite: false, opacity: .95 }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.visible = false;
    this.scene.add(shadow);
    this.customers.set(orderId, {
      orderId,
      figure,
      seat,
      state: 'walking',
      path: [
        { x: seatData.x, z: AISLE_Z },
        { x: seatData.x, z: seatData.z },
      ],
      leaveTimer: 0,
      mood: 'neutral',
      lastScreen: { x: -999, y: -999, visible: false },
      shadow,
    });
  }

  setCustomerMood(orderId: string, mood: 'neutral' | 'worried' | 'sad') {
    const c = this.customers.get(orderId);
    if (!c || c.state !== 'waiting') return;
    if (c.mood === mood) return;
    c.mood = mood;
    c.figure.setMood(mood);
  }

  serveCustomer(orderId: string, drinkId: string, topping: string) {
    const c = this.customers.get(orderId);
    if (!c) return;
    c.state = 'served';
    c.leaveTimer = 0;
    c.figure.setWalking(false);
    c.figure.cheer();
    const drink = DRINKS_MAP[drinkId];
    const cup = buildCup({
      drinkId,
      selections: { topping: topping as never, ice: 'normal', size: 'medium' },
      fillRatio: 0.83,
      withLid: true,
      scale: 0.54,
    });
    cup.group.position.set(0.15, 1.28, 1.55);
    cup.group.traverse((o) => {
      if (o instanceof THREE.Mesh) o.castShadow = false;
    });
    this.scene.add(cup.group);
    const seat = SEATS[c.seat];
    const end = new THREE.Vector3(seat.tableX + .09, .83, seat.tableZ + .12);
    this.flights.push({
      group: cup.group,
      start: cup.group.position.clone(),
      end,
      t: 0,
      hold: 0,
      done: false,
      orderId,
    });
    // tinted sparkle trail will follow in update
    if (drink) this.spawnMiniHearts(seat.x, 1.35, seat.z + .3, 4, .55);
  }

  sendCustomerAway(orderId: string, angry: boolean) {
    const c = this.customers.get(orderId);
    if (!c) return;
    if (angry) {
      c.state = 'angry';
      c.figure.sulk();
      c.leaveTimer = 0;
    } else {
      this.startLeaving(c);
      c.figure.setMood('neutral');
    }
  }

  /** Called when game ends and all remaining guests should walk out. */
  clearCustomers(angry = false) {
    for (const [id, c] of this.customers) {
      if (c.state === 'walking' || c.state === 'waiting') {
        this.sendCustomerAway(id, angry);
      }
    }
  }

  getBubbleAnchors(): BubbleAnchor[] {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const v = new THREE.Vector3();
    const result: BubbleAnchor[] = [];
    for (const c of this.customers.values()) {
      if (c.state === 'walking' || c.state === 'leaving' || c.state === 'angry') continue;
      c.figure.getHeadAnchor(v);
      const world = v.clone();
      v.project(this.camera);
      const x = (v.x * 0.5 + 0.5) * width;
      const y = (-v.y * 0.5 + 0.5) * height;
      const visible = v.z < 1 && x > 30 && x < width - 30 && y > 40 && y < height - 160;
      c.lastScreen = { x, y, visible };
      result.push({ orderId: c.orderId, x, y, visible, state: c.state });
    }
    return result;
  }

  getCustomerScreenPosition(orderId: string): { x: number; y: number } | null {
    const c = this.customers.get(orderId);
    if (!c) return null;
    const v = new THREE.Vector3();
    c.figure.getHeadAnchor(v);
    v.project(this.camera);
    return { x: (v.x * 0.5 + 0.5) * window.innerWidth, y: (-v.y * 0.5 + 0.5) * window.innerHeight };
  }

  celebrate() {
    const colors = [0xffa8c2, 0xa9ead3, 0xffd77d, 0xc9b4ef];
    for (let i = 0; i < 55; i++) {
      const geo = new THREE.PlaneGeometry(0.06, 0.12);
      const mat = new THREE.MeshBasicMaterial({ color: colors[i % colors.length], side: THREE.DoubleSide, transparent: true });
      const confetti = new THREE.Mesh(geo, mat);
      confetti.position.set((Math.random() - 0.5) * 8, 3.5 + Math.random() * 2, (Math.random() - 0.5) * 3);
      confetti.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
      const vx = (Math.random() - 0.5) * 1.8;
      const vy = -1.2 - Math.random() * 1.5;
      this.scene.add(confetti);
      this.confetti.push({ mesh: confetti, vx, vy, life: 3 + Math.random() * 2 });
    }
  }

  private confetti: { mesh: THREE.Mesh; vx: number; vy: number; life: number }[] = [];

  isCustomerActive(orderId: string): boolean {
    const c = this.customers.get(orderId);
    return !!c && (c.state === 'waiting' || c.state === 'walking');
  }

  setCustomerAccepted(_orderId: string, _accepted: boolean) {
    // reserved for future visual badges
  }

  tick(dt: number) {
    if (this.disposed) return;
    this.clockTime += dt;
    this.updateCamera(dt);
    this.updateCustomers(dt);
    this.updateFlights(dt);
    this.updateHearts(dt);
    this.updatePetals(dt);
    this.updateConfetti(dt);
    this.updateLights(dt);
    this.updateDoor(dt);
  }

  render() {
    this.composer.render();
  }

  updateBubbles() {
    // projection is already refreshed via getBubbleAnchors()
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.resizeObserver?.disconnect();
    window.removeEventListener('resize', this.resize);
    const dom = this.renderer.domElement;
    dom.removeEventListener('pointermove', this.onPointerMove);
    dom.removeEventListener('pointerleave', this.onPointerLeave);
    dom.removeEventListener('click', this.onClick);
    for (const c of this.customers.values()) {
      c.figure.dispose();
      c.shadow.removeFromParent();
      c.shadow.geometry.dispose();
      (c.shadow.material as THREE.Material).dispose();
    }
    this.customers.clear();
    this.sheets.dispose();
    this.paint.dispose();
    this.windowTexture.dispose();
    this.softShadowTexture.dispose();
    this.contactShadowTex.dispose();
    this.finish.dispose();
    this.composer.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }

  // ───────────────────────────── events & camera

  private bindEvents() {
    window.addEventListener('resize', this.resize);
    this.renderer.domElement.addEventListener('pointermove', this.onPointerMove);
    this.renderer.domElement.addEventListener('pointerleave', this.onPointerLeave);
    this.renderer.domElement.addEventListener('click', this.onClick);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(document.body);
  }

  private resize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const aspect = w / h;
    this.camera.aspect = aspect;
    // Portrait viewports need a wider vertical FOV so all three seats stay in frame.
    const wide = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(18)) / Math.max(0.42, aspect)));
    this.camera.fov = aspect >= 1 ? 44 : THREE.MathUtils.clamp(wide, 44, 72);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h);
    this.finish.uniforms.pixel.value.set(.98 / w, .98 / h);
  };

  private customerAt(clientX: number, clientY: number): string | null {
    this.rayPointer.set((clientX / window.innerWidth) * 2 - 1, -(clientY / window.innerHeight) * 2 + 1);
    this.raycaster.setFromCamera(this.rayPointer, this.camera);
    const roots = [...this.customers.values()]
      .filter((c) => c.state === 'waiting')
      .map((c) => c.figure.root);
    const hits = this.raycaster.intersectObjects(roots, true);
    if (!hits.length || this.paint.tableCovers(this.raycaster, hits[0].distance)) return null;
    let obj: THREE.Object3D | null = hits[0].object;
    while (obj && !obj.userData.customer) obj = obj.parent;
    if (obj?.userData.customer instanceof StorybookGuest) {
      const found = [...this.customers.values()].find((c) => c.figure === obj!.userData.customer);
      return found?.orderId ?? null;
    }
    return null;
  }

  private onPointerMove = (event: PointerEvent) => {
    this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    this.mouseParallax.set(this.pointer.x, this.pointer.y);
    if (!this.interactive) return;
    const id = this.customerAt(event.clientX, event.clientY);
    this.setHovered(id);
    this.renderer.domElement.style.cursor = id ? 'pointer' : 'default';
  };

  private onPointerLeave = () => {
    this.setHovered(null);
    this.mouseParallax.set(0, 0);
  };

  private onClick = (event: MouseEvent) => {
    if (!this.interactive) return;
    const id = this.customerAt(event.clientX, event.clientY);
    if (id) this.options.onCustomerClick?.(id);
  };

  private setHovered(id: string | null) {
    if (this.hoveredId === id) return;
    if (this.hoveredId) this.customers.get(this.hoveredId)?.figure.setHovered(false);
    this.hoveredId = id;
    if (id) this.customers.get(id)?.figure.setHovered(true);
  }

  private updateCamera(dt: number) {
    const target = this.cameraBase.clone();
    const look = this.lookBase.clone();
    if (this.cameraMode === 'play' && this.camera.aspect < .8) {
      let left = Infinity;
      let right = -Infinity;
      let front = 0;
      for (const guest of this.customers.values()) {
        if (guest.state === 'leaving') continue;
        const x = SEATS[guest.seat].x;
        front = Math.max(front, SEATS[guest.seat].z);
        left = Math.min(left, x);
        right = Math.max(right, x);
      }
      if (left <= right) {
        const center = (left + right) / 2;
        target.x += center;
        look.x += center;
        // Keep a lone guest close. For a group, fit both outer silhouettes and their tickets.
        const tilt = Math.atan2(target.y - look.y, target.z - look.z);
        const distance = (target.z - front - .16) * Math.cos(tilt) + (target.y - 1.2) * Math.sin(tilt);
        const halfWidth = (right - left) / 2 + .84;
        const halfFov = THREE.MathUtils.degToRad(this.camera.fov / 2);
        const retreat = Math.max(0, halfWidth / (Math.tan(halfFov) * this.camera.aspect) - distance);
        target.y += retreat * Math.sin(tilt);
        target.z += retreat * Math.cos(tilt);
      }
    }
    target.x += this.mouseParallax.x * 0.16;
    target.y += this.mouseParallax.y * 0.08;
    look.x += this.mouseParallax.x * 0.06;
    const ease = 1 - Math.exp(-dt * 3.2);
    this.camera.position.lerp(target, ease);
    this.currentLook.lerp(look, ease);
    this.camera.lookAt(this.currentLook);
  }

  // ───────────────────────────── customer updates

  private startLeaving(c: SceneCustomer) {
    c.state = 'leaving';
    const here = c.figure.root.position;
    c.path = [
      { x: here.x, z: AISLE_Z },
      { x: EXIT_X, z: AISLE_Z },
    ];
    c.figure.setSitting(false);
    c.figure.root.rotation.y = 0;
    c.figure.faceRight(true);
    c.figure.setWalking(true);
  }

  /** Walks one step along the waypoint path; returns true once it is empty. */
  private stepPath(c: SceneCustomer, dt: number, speed: number): boolean {
    const pos = c.figure.root.position;
    let budget = dt * speed;
    while (c.path.length && budget > 0) {
      const wp = c.path[0];
      const dx = wp.x - pos.x;
      const dz = wp.z - pos.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 1e-3) {
        c.path.shift();
        continue;
      }
      if (Math.abs(dx) > .001) c.figure.faceRight(dx > 0);
      const step = Math.min(dist, budget);
      pos.x += (dx / dist) * step;
      pos.z += (dz / dist) * step;
      budget -= step;
      if (step >= dist) c.path.shift();
    }
    return c.path.length === 0;
  }

  private updateCustomers(dt: number) {
    for (const [id, c] of [...this.customers]) {
      const figure = c.figure;
      if (c.state === 'walking') {
        if (this.stepPath(c, dt, 2.2)) {
          c.state = 'waiting';
          figure.root.rotation.y = SEATS[c.seat].angle;
          figure.setWalking(false);
          figure.setSitting(true);
          this.options.onCustomerArrive?.(id);
        }
      } else if (c.state === 'served') {
        c.leaveTimer += dt;
        if (c.leaveTimer > 1.9) this.startLeaving(c);
      } else if (c.state === 'angry') {
        c.leaveTimer += dt;
        if (c.leaveTimer > 1.15) this.startLeaving(c);
      } else if (c.state === 'leaving') {
        if (this.stepPath(c, dt, 2.4)) {
          this.removeCustomer(id);
          continue;
        }
      }
      figure.update(dt);
      figure.placeFloorShadow(c.shadow);
    }
  }

  private removeCustomer(id: string) {
    const c = this.customers.get(id);
    if (!c) return;
    this.busySeats.delete(c.seat);
    this.customers.delete(id);
    c.figure.dispose();
    c.shadow.removeFromParent();
    c.shadow.geometry.dispose();
    (c.shadow.material as THREE.Material).dispose();
    this.options.onCustomerGone?.(id);
  }

  // ───────────────────────────── effects

  private spawnMiniHearts(x: number, y: number, z: number, count: number, scale = 1) {
    for (let i = 0; i < count; i++) {
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: this.heartTex, transparent: true, depthWrite: false, opacity: 0.95 }),
      );
      sprite.position.set(x + (Math.random() - 0.5) * 0.8, y + Math.random() * 0.4, z + 0.2 + Math.random() * 0.4);
      sprite.scale.setScalar((0.18 + Math.random() * 0.12) * scale);
      this.scene.add(sprite);
      this.hearts.push({
        sprite,
        vx: (Math.random() - 0.5) * 0.9,
        vy: 0.9 + Math.random() * 0.9,
        vz: (Math.random() - 0.3) * 0.4,
        life: 1.1 + Math.random() * 0.6,
        maxLife: 1.7,
        spin: (Math.random() - 0.5) * 2,
      });
    }
  }

  private updateHearts(dt: number) {
    for (let i = this.hearts.length - 1; i >= 0; i--) {
      const h = this.hearts[i];
      h.life -= dt;
      h.sprite.position.x += h.vx * dt;
      h.sprite.position.y += h.vy * dt;
      h.sprite.position.z += h.vz * dt;
      h.vy -= dt * 0.18;
      const p = Math.max(0, h.life / h.maxLife);
      (h.sprite.material as THREE.SpriteMaterial).opacity = p;
      h.sprite.scale.multiplyScalar(1 + dt * 0.28);
      if (h.life <= 0) {
        this.scene.remove(h.sprite);
        (h.sprite.material as THREE.SpriteMaterial).dispose();
        this.hearts.splice(i, 1);
      }
    }
  }

  private updateFlights(dt: number) {
    for (let i = this.flights.length - 1; i >= 0; i--) {
      const f = this.flights[i];
      if (f.group.parent === null) {
        this.flights.splice(i, 1);
        continue;
      }
      if (f.t < 1) {
        f.t = Math.min(1, f.t + dt * 1.15);
        const e = easeOutBack(f.t);
        const eased = 1 - Math.pow(1 - f.t, 3);
        f.group.position.x = THREE.MathUtils.lerp(f.start.x, f.end.x, e);
        f.group.position.z = THREE.MathUtils.lerp(f.start.z, f.end.z, eased);
        f.group.position.y = THREE.MathUtils.lerp(f.start.y, f.end.y, eased) + Math.sin(Math.PI * f.t) * 1.1;
        f.group.rotation.z = Math.sin(f.t * Math.PI) * -0.2;
        f.group.rotation.y = f.t * 0.4;
      } else {
        f.hold += dt;
        const k = Math.max(0, 1 - (f.hold - 0.35) / 0.45);
        f.group.scale.setScalar(k * (f.end.x < -1 ? 0.54 : 0.54));
        if (f.hold > 0.9) {
          if (f.orderId) {
            const c = this.customers.get(f.orderId);
            if (c) {
              const seat = SEATS[c.seat];
              this.spawnMiniHearts(seat.x, 1.6, seat.z + .3, 8, 1);
            }
          }
          disposeCup(f.group as unknown as THREE.Group);
          this.scene.remove(f.group);
          this.flights.splice(i, 1);
        }
      }
    }
  }

  private updateConfetti(dt: number) {
    for (let i = this.confetti.length - 1; i >= 0; i--) {
      const c = this.confetti[i];
      c.life -= dt;
      c.mesh.position.x += c.vx * dt;
      c.mesh.position.y += c.vy * dt;
      c.vy -= dt * 0.4;
      c.mesh.rotation.x += dt * 3;
      c.mesh.rotation.z += dt * 4;
      (c.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, c.life / 2);
      if (c.life <= 0) {
        this.scene.remove(c.mesh);
        c.mesh.geometry.dispose();
        (c.mesh.material as THREE.Material).dispose();
        this.confetti.splice(i, 1);
      }
    }
  }

  private buildPetals() {
    const textures = [petalTexture('#ffc1d5'), petalTexture('#ffe0e7'), petalTexture('#ffb7cf')];
    for (let i = 0; i < 26; i++) {
      const mat = new THREE.SpriteMaterial({
        map: textures[i % textures.length],
        transparent: true,
        depthWrite: false,
        opacity: 0.55 + Math.random() * 0.3,
        rotation: Math.random() * Math.PI * 2,
      });
      const sprite = new THREE.Sprite(mat);
      const data = {
        speed: 0.08 + Math.random() * 0.12,
        sway: 0.2 + Math.random() * 0.5,
        phase: Math.random() * 10,
        baseX: (Math.random() - 0.5) * 13,
        z: -4.6 + Math.random() * 5.2,
      };
      sprite.position.set(data.baseX, 1 + Math.random() * 4.4, data.z);
      sprite.scale.setScalar(0.07 + Math.random() * 0.09);
      this.scene.add(sprite);
      this.petals.push(sprite);
      this.petalData.push(data);
    }
  }

  private updatePetals(dt: number) {
    const t = this.clockTime;
    this.petals.forEach((p, i) => {
      const data = this.petalData[i];
      p.position.y -= data.speed * dt;
      p.position.x = data.baseX + Math.sin(t * 0.45 + data.phase) * data.sway;
      (p.material as THREE.SpriteMaterial).rotation += dt * 0.35;
      if (p.position.y < 0.2) {
        p.position.y = 4.8 + Math.random();
        data.baseX = (Math.random() - 0.5) * 13;
        p.position.x = data.baseX;
      }
    });
  }

  // ───────────────────────────── lights

  private buildLights() {
    this.ambientLight.position.set(0, 6, 4);
    this.scene.add(this.ambientLight);

    this.sunLight.position.set(-4, 8, 5);
    this.sunLight.target.position.set(0, 1, -1);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(2048, 2048);
    this.sunLight.shadow.camera.left = -9;
    this.sunLight.shadow.camera.right = 9;
    this.sunLight.shadow.camera.top = 9;
    this.sunLight.shadow.camera.bottom = -6;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 30;
    this.sunLight.shadow.bias = -0.0006;
    this.sunLight.shadow.normalBias = 0.02;
    this.sunLight.shadow.radius = 4;
    this.sunLight.shadow.intensity = .27;
    this.scene.add(this.sunLight, this.sunLight.target);

    this.fillLight.position.set(3, 4, 8);
    this.scene.add(this.fillLight);

    for (const x of [-3.05, 3.05]) {
      const y = 3.32, z = .8;
      const light = new THREE.PointLight(0xffd8a6, 4, 6.5, 2);
      light.position.set(x, y, z);
      this.scene.add(light);
      this.bulbLights.push(light);
      const shadeHeight = .53;
      const bottom = y - .025;
      const cordTop = 6.04;
      const cordBottom = bottom + shadeHeight;
      const cord = new THREE.Mesh(
        new THREE.CylinderGeometry(.008, .008, cordTop - cordBottom, 6),
        standard('#806755', { roughness: .92 }),
      );
      cord.position.set(x, (cordTop + cordBottom) / 2, z);
      this.scene.add(cord);
      const shadeModel = new THREE.Group();
      const shade = new THREE.Mesh(new THREE.CylinderGeometry(.12, .36, .35, 32, 1, true),
        standard('#f4dab7', { roughness: .9, side: THREE.DoubleSide }));
      shade.position.y = .21;
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(.083, 14, 12),
        new THREE.MeshBasicMaterial({ color: '#ffe3b0', toneMapped: false }));
      bulb.position.y = .05;
      shadeModel.add(shade, bulb);
      const lamp = this.paint.furnishing('pendant', shadeModel, shadeHeight);
      lamp.position.set(x, bottom, z);
      this.scene.add(lamp);
      const halo = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: radialTexture('rgba(255,220,170,0.55)', 'rgba(255,220,170,0)', 128),
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          opacity: 0.55,
        }),
      );
      halo.position.set(x, bottom + .08, z + .035);
      halo.scale.setScalar(1.3);
      this.scene.add(halo);
    }
  }

  private updateLights(dt: number) {
    const theme = this.theme;
    const night = theme.id === 'night';
    const dusk = theme.id === 'dusk';
    const target = new THREE.Color(theme.ambient);
    this.ambientLight.color.lerp(target, dt * 1.6);
    this.ambientLight.intensity = THREE.MathUtils.damp(this.ambientLight.intensity, night ? .65 : dusk ? .93 : 1.15, 2.2, dt);
    const sunColor = new THREE.Color(theme.sun);
    this.sunLight.color.lerp(sunColor, dt * 1.6);
    this.sunLight.intensity = THREE.MathUtils.damp(this.sunLight.intensity, night ? .6 : dusk ? 1.42 : 1.40, 2, dt);
    const fillColor = new THREE.Color(theme.accent).lerp(new THREE.Color('#eaf3ff'), 0.72);
    this.fillLight.color.lerp(fillColor, dt * 1.5);
    this.fillLight.intensity = THREE.MathUtils.damp(this.fillLight.intensity, night ? 1.25 : dusk ? 0.8 : 0.5, 2, dt);
    for (const light of this.bulbLights) {
      light.intensity = THREE.MathUtils.damp(light.intensity, night ? 6.4 : dusk ? 3.6 : 2.2, 2, dt);
    }
    if (this.signGlow) {
      const base = 0.34 + this.upgradeLevels.sign * 0.14;
      const targetOpacity = night ? 0.72 : base;
      const mat = this.signGlow.material as THREE.SpriteMaterial;
      mat.opacity = THREE.MathUtils.damp(mat.opacity, targetOpacity, 2, dt);
    }
  }

  private setTheme(theme: DayTheme) {
    this.theme = theme;
    this.paint.setTheme(theme);
    for (const guest of this.customers.values()) guest.figure.setLight(this.paint.paperLight);
    this.redrawWindow();
    if (this.scene.background instanceof THREE.Color) {
      this.scene.background.set(theme.fog);
    }
    if (!this.scene.fog) {
      this.scene.fog = new THREE.Fog(theme.fog, 16, 30);
    } else {
      (this.scene.fog as THREE.Fog).color.set(theme.fog);
    }
    document.documentElement.style.setProperty('--theme-accent', theme.accent);
    document.documentElement.style.setProperty('--sky-glow', theme.glow);
  }

  private redrawWindow() {
    const ctx = this.skyCanvas.getContext('2d')!;
    if (this.garden) drawGarden(ctx, this.garden, this.theme);
    else this.drawSky(ctx, SKY_W, SKY_H, this.theme);
    this.windowTexture.needsUpdate = true;
  }

  // ───────────────────────────── environment

  private buildEnvironment() {
    this.buildFloor();
    this.buildWalls();
    this.buildWindows();
    this.buildEntranceDoor();
    this.buildSignAndMenu();
    this.buildCounter();
    this.buildSeating();
    this.buildBackDecor();
    this.buildPlants();
    this.buildStringLights();
    this.buildBunting();
  }

  /** Soft dark decal placed on the ground beneath an object to fake contact shadow / AO. */
  private addContactShadow(x: number, z: number, width: number, depth: number, opacity = 0.28, y = 0.012) {
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(width, depth),
      new THREE.MeshBasicMaterial({
        map: this.contactShadowTex,
        transparent: true,
        opacity,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(x, y, z);
    this.scene.add(shadow);
    return shadow;
  }

  private buildFloor() {
    const floorGeometry = new THREE.PlaneGeometry(22, 18);
    const uv = floorGeometry.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 4.5, uv.getY(i) * 3.7);
    const floor = new THREE.Mesh(floorGeometry, this.paint.surfaces.floor);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, -1);
    floor.receiveShadow = true;
    this.scene.add(floor);

    const runner = makeCanvasTexture(768, 256, (ctx, w, h) => {
      const rand = mulberry(42311);
      ctx.fillStyle = '#cbb397';
      ctx.beginPath(); ctx.roundRect(6, 6, w - 12, h - 12, 28); ctx.fill();
      ctx.strokeStyle = '#a78b77'; ctx.lineWidth = 4; ctx.stroke();
      ctx.strokeStyle = '#eee0c8'; ctx.lineWidth = 3; ctx.setLineDash([5, 5]);
      ctx.strokeRect(21, 21, w - 42, h - 42);
      ctx.setLineDash([]);
      for (let i = 0; i < 3600; i++) {
        ctx.fillStyle = i % 2 ? 'rgba(255,246,222,.16)' : 'rgba(101,76,58,.09)';
        ctx.fillRect(25 + rand() * (w - 50), 25 + rand() * (h - 50), 2 + rand() * 8, .9);
      }
    });
    const rug = new THREE.Mesh(new THREE.PlaneGeometry(6.65, 1.65),
      new THREE.MeshStandardMaterial({ map: runner, transparent: true, roughness: 1, depthWrite: false }));
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(0, .009, -3.87);
    rug.receiveShadow = true;
    this.scene.add(rug);
  }

  private buildWalls() {
    const wallMat = this.paint.surfaces.plaster;
    // segmented wall so the two arched windows are real openings onto the sky
    const sections: [number, number, number, number][] = [
      // [centerX, centerY, width, height]
      [-7.7875, 3.1, 4.425, 6.2],
      [7.7875, 3.1, 4.425, 6.2],
      [0, 3.1, 5.05, 6.2],
      [-4.05, 5.375, 3.05, 1.65],
      [4.05, 5.375, 3.05, 1.65],
      [-4.05, 0.675, 3.05, 1.35],
      [4.05, 0.675, 3.05, 1.35],
    ];
    for (const [x, y, w, h] of sections) {
      const geometry = new THREE.BoxGeometry(w, h, .4);
      this.wallpaperUV(geometry, x, y);
      const panel = new THREE.Mesh(geometry, wallMat);
      panel.position.set(x, y, -5.45);
      panel.receiveShadow = true;
      this.scene.add(panel);
    }

    // The wall sections leave rectangular openings. Paper the spandrels around each curved frame.
    const radius = 1.525;
    for (const x of [-4.05, 4.05]) {
      for (const side of [-1, 1]) {
        const shape = new THREE.Shape();
        shape.moveTo(0, radius);
        shape.lineTo(side * radius, radius);
        shape.lineTo(side * radius, 0);
        shape.absarc(0, 0, radius, side < 0 ? Math.PI : 0, Math.PI / 2, side < 0);
        shape.closePath();
        const geometry = new THREE.ShapeGeometry(shape, 32);
        this.wallpaperUV(geometry, x, 3.025);
        const corner = new THREE.Mesh(geometry, wallMat);
        corner.position.set(x, 3.025, -5.25);
        this.scene.add(corner);
      }
    }

    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(24, 19),
      standard('#fff3df', { roughness: 1, emissive: '#ad9980', emissiveIntensity: .45 }));
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, 6.12, 2.8);
    this.scene.add(ceiling);
    const timber = standard('#dac4a8', { roughness: .96 });
    for (const z of [-4.9, -.75, 3.4, 7.55]) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(22, .12, .16), timber);
      beam.position.set(0, 6.03, z);
      this.scene.add(beam);
    }

    // wainscot
    const wainscot = new THREE.Mesh(new THREE.BoxGeometry(20, 1.1, 0.16), standard('#abc0a9', { roughness: .96 }));
    wainscot.position.set(0, 0.55, -5.22);
    wainscot.receiveShadow = true;
    this.scene.add(wainscot);
    const trim = new THREE.Mesh(new RoundedBoxGeometry(20, 0.09, 0.22, 3, 0.04), standard('#fff8f0', { roughness: 0.8 }));
    trim.position.set(0, 1.12, -5.16);
    trim.castShadow = true;
    this.scene.add(trim);

    // vertical fluted panel lines
    for (let i = -8; i <= 8; i += 2) {
      const line = new THREE.Mesh(new THREE.BoxGeometry(0.025, 1.02, 0.02), standard('#c2c9af', { roughness: .95 }));
      line.position.set(i, 0.55, -5.13);
      this.scene.add(line);
    }

    // ceiling trims / faux crown
    const crown = new THREE.Mesh(new RoundedBoxGeometry(20, 0.16, 0.34, 3, 0.06), standard('#fff7ee', { roughness: 0.85 }));
    crown.position.set(0, 5.95, -5.3);
    this.scene.add(crown);

    // side pillars
    for (const x of [-7.4, 7.4]) {
      const pillar = new THREE.Mesh(new RoundedBoxGeometry(0.55, 6.1, 0.6, 4, 0.14), standard('#ffe5e8', { roughness: 0.85 }));
      pillar.position.set(x, 3.05, -5.2);
      pillar.castShadow = true;
      this.scene.add(pillar);
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.1, 4.7, 0.05), standard('#fff8ee', { roughness: 0.8 }));
      stripe.position.set(x, 3.1, -4.88);
      this.scene.add(stripe);
    }

    // ceiling / upper props to catch eye
    const upperTrim = new THREE.Mesh(new RoundedBoxGeometry(16, 0.12, 0.12, 3, 0.04), standard('#ffd8e1', { roughness: 0.8 }));
    upperTrim.position.set(0, 5.7, -5.1);
    this.scene.add(upperTrim);

    // tall shelf towers at the edges
    this.buildShelfTower(-6.35);
    this.buildShelfTower(6.35);
  }

  private wallpaperUV(geometry: THREE.BufferGeometry, x: number, y: number) {
    const points = geometry.attributes.position;
    const uv = geometry.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (x + points.getX(i)) / 2.8, (y + points.getY(i)) / 2.8);
  }

  private buildShelfTower(x: number) {
      const cabinet = new THREE.Mesh(new RoundedBoxGeometry(1.5, 3.0, 0.55, 4, 0.12), standard('#ddc4a6', { roughness: .96 }));
    cabinet.position.set(x, 1.65, -5.0);
    cabinet.castShadow = true;
    cabinet.receiveShadow = true;
    this.scene.add(cabinet);
    this.addContactShadow(x, -5.0, 1.6, 0.65, 0.18);
    const panel = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.5, 0.04), standard('#ddd0ac', { roughness: .96 }));
    panel.position.set(x, 1.7, -4.7);
    this.scene.add(panel);
    for (let i = 0; i < 3; i++) {
      const shelf = new THREE.Mesh(new RoundedBoxGeometry(1.22, 0.06, 0.35, 2, 0.02), this.paint.surfaces.oak);
      shelf.position.set(x, 0.85 + i * 0.85, -4.64);
      shelf.castShadow = true;
      this.scene.add(shelf);
      const colors = ['#ffb4c7', '#b8e9d6', '#ffdc9b', '#cdb3e2', '#f5d6b7'];
      for (let j = 0; j < 3; j++) {
        const jar = this.makeJar(colors[(i * 3 + j) % colors.length], 0.16 + (j % 2) * 0.025);
        jar.position.set(x - 0.38 + j * 0.38, 0.93 + i * 0.85, -4.63);
        this.scene.add(jar);
      }
    }
  }

  private buildWindows() {
    this.buildWindow(-4.05);
    this.buildWindow(4.05);
  }

  private buildWindow(x: number) {
    const w = 3.05;
    const h = 3.2;
    const y = 2.95;
    const frameShape = archShape(w, h, w / 2);
    const innerShape = archShape(w - 0.24, h - 0.24, (w - 0.24) / 2);
    frameShape.holes.push(new THREE.Path(innerShape.getPoints(64)));
    const frameGeo = new THREE.ExtrudeGeometry(frameShape, { depth: 0.16, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 2 });
    const frame = new THREE.Mesh(frameGeo, standard('#fff5ec', { roughness: 0.72 }));
    frame.position.set(x, y, -5.2);
    frame.castShadow = true;
    this.scene.add(frame);

    // sky visible through arch
    const skyShapeGeo = new THREE.ShapeGeometry(innerShape, 64);
    const pos = skyShapeGeo.attributes.position;
    const uv = skyShapeGeo.attributes.uv as THREE.BufferAttribute;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (let i = 0; i < pos.count; i++) {
      minX = Math.min(minX, pos.getX(i));
      maxX = Math.max(maxX, pos.getX(i));
      minY = Math.min(minY, pos.getY(i));
      maxY = Math.max(maxY, pos.getY(i));
    }
    for (let i = 0; i < uv.count; i++) {
      const panoramaX = (x < 0 ? .015 : .525) + .46 * (pos.getX(i) - minX) / (maxX - minX);
      uv.setXY(i, panoramaX, (pos.getY(i) - minY) / (maxY - minY));
    }
    const sky = new THREE.Mesh(
      skyShapeGeo,
      new THREE.MeshBasicMaterial({ map: this.windowTexture, toneMapped: false }),
    );
    sky.position.set(x, y, -5.27);
    this.scene.add(sky);

    // window glass tint
    const glass = new THREE.Mesh(
      skyShapeGeo.clone(),
      new THREE.MeshPhysicalMaterial({
        color: 0xaedfe0,
        transparent: true,
        opacity: 0.07,
        roughness: 0.08,
        metalness: 0,
        side: THREE.DoubleSide,
      }),
    );
    glass.position.set(x, y, -5.23);
    this.scene.add(glass);

    // mullions
    const trimMat = standard('#fff9f1', { roughness: 0.65 });
    const vertical = new THREE.Mesh(new THREE.BoxGeometry(0.035, 2.1, 0.06), trimMat);
    vertical.position.set(x, y - 0.46, -5.17);
    this.scene.add(vertical);
    const horizontal = new THREE.Mesh(new THREE.BoxGeometry(w - 0.28, 0.035, 0.06), trimMat);
    horizontal.position.set(x, y - 0.35, -5.17);
    this.scene.add(horizontal);
    const archTrim = new THREE.Mesh(
      new THREE.TorusGeometry((w - 0.28) / 2 - 0.015, 0.018, 8, 64, Math.PI),
      trimMat,
    );
    archTrim.position.set(x, y - 0.35, -5.17);
    this.scene.add(archTrim);

    // sill + little plants
    const sill = new THREE.Mesh(new RoundedBoxGeometry(w + 0.38, 0.13, 0.45, 4, 0.04), standard('#ffd9e2', { roughness: 0.6 }));
    sill.position.set(x, y - h / 2 - 0.02, -4.98);
    sill.castShadow = true;
    this.scene.add(sill);
    // pots rest exactly on the sill top (center - 0.02 + half height 0.065)
    this.makeWindowsillPlant(x - 1.05, y - h / 2 + 0.045, -4.86, 0.7);
    this.makeWindowsillPlant(x + 0.98, y - h / 2 + 0.045, -4.86, 0.85);

    // curtains
    const curtainMat = standard('#e7f9f2', { roughness: 0.95 });
    for (const s of [-1, 1] as const) {
      const curtain = new THREE.Group();
      for (let i = 0; i < 5; i++) {
        const fold = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.085, 3.0, 10), curtainMat);
        fold.position.set(i * 0.07 - 0.14, 0, 0);
        fold.scale.z = 0.55;
        curtain.add(fold);
      }
      curtain.position.set(x + s * (w / 2 - 0.2), y + 0.02, -4.86);
      curtain.rotation.z = s * 0.02;
      curtain.traverse((o) => {
        if (o instanceof THREE.Mesh) o.castShadow = true;
      });
      this.scene.add(curtain);
      const tie = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.035, 8, 24), standard('#ffb8cb', { roughness: 0.65 }));
      tie.rotation.y = Math.PI / 2;
      tie.rotation.z = Math.PI / 2;
      tie.position.set(x + s * (w / 2 - 0.21), y - 0.5, -4.82);
      this.scene.add(tie);
    }

    // curtain rod
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, w + 0.75, 8), standard('#d8b487', { roughness: 0.35, metalness: 0.4 }));
    rod.rotation.z = Math.PI / 2;
    rod.position.set(x, y + h / 2 + 0.17, -4.8);
    this.scene.add(rod);
    for (const s of [-1, 1]) {
      const finial = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), standard('#d8b487', { roughness: 0.35, metalness: 0.4 }));
      finial.position.set(x + s * (w / 2 + 0.38), y + h / 2 + 0.17, -4.8);
      this.scene.add(finial);
    }
  }

  // ───────────────────────────── entrance door & hanging sign

  private buildEntranceDoor() {
    const door = new THREE.Group();
    door.position.set(8.62, 0, -5.18);
    this.scene.add(door);

    const frameMat = standard('#c98a76', { roughness: 0.62 });
    const trimMat = standard('#fff6e8', { roughness: 0.7 });
    const doorMat = standard('#ffe7d8', { roughness: 0.72 });

    const sideGeo = new RoundedBoxGeometry(0.12, 2.72, 0.12, 3, 0.035);
    for (const x of [-0.66, 0.66]) {
      const post = new THREE.Mesh(sideGeo, frameMat);
      post.position.set(x, 1.36, 0.05);
      post.castShadow = true;
      door.add(post);
    }
    const top = new THREE.Mesh(new RoundedBoxGeometry(1.44, 0.14, 0.14, 3, 0.04), frameMat);
    top.position.set(0, 2.77, 0.05);
    top.castShadow = true;
    door.add(top);

    const panel = new THREE.Mesh(new RoundedBoxGeometry(1.16, 2.58, 0.08, 4, 0.03), doorMat);
    panel.position.set(0, 1.33, 0.1);
    panel.castShadow = true;
    door.add(panel);

    const glass = new THREE.Mesh(
      new THREE.PlaneGeometry(0.82, 1.16),
      new THREE.MeshPhysicalMaterial({
        color: 0xfff0d8,
        transparent: true,
        opacity: 0.38,
        roughness: 0.06,
        metalness: 0,
        transmission: 0.4,
        thickness: 0.05,
        side: THREE.DoubleSide,
      }),
    );
    this.doorGlassMat = glass.material as THREE.MeshPhysicalMaterial;
    glass.position.set(0, 1.76, 0.15);
    door.add(glass);

    // warm light behind the glass so the doorway reads as "inside"
    const lit = new THREE.Mesh(
      new THREE.PlaneGeometry(0.84, 1.18),
      new THREE.MeshBasicMaterial({ color: '#ffe4b3', transparent: true, opacity: 0.5, toneMapped: false }),
    );
    lit.position.set(0, 1.76, 0.135);
    door.add(lit);

    const mullion = standard('#fffdf7', { roughness: 0.6 });
    for (const [x, y, w, h] of [
      [0, 1.76, 0.028, 1.16],
      [0, 1.76, 0.82, 0.028],
    ] as const) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.035), mullion);
      bar.position.set(x, y, 0.17);
      door.add(bar);
    }

    const lower = new THREE.Mesh(new RoundedBoxGeometry(0.84, 0.68, 0.035, 3, 0.02), standard('#ffd4ca', { roughness: 0.8 }));
    lower.position.set(0, 0.62, 0.15);
    door.add(lower);
    const lowerHeart = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: this.heartTex, transparent: true, opacity: 0.7, depthWrite: false }),
    );
    lowerHeart.scale.set(0.17, 0.16, 1);
    lowerHeart.position.set(0, 0.63, 0.19);
    door.add(lowerHeart);
    for (const y of [0.9, 0.35]) {
      const groove = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.022, 0.02), standard('#e8b6aa', { roughness: 0.85 }));
      groove.position.set(0, y, 0.18);
      door.add(groove);
    }

    const handleMat = standard('#e0b876', { roughness: 0.28, metalness: 0.55 });
    const handle = new THREE.Group();
    const lever = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.26, 10), handleMat);
    lever.rotation.z = Math.PI / 2;
    lever.position.x = 0.09;
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.08, 10), handleMat);
    neck.rotation.x = Math.PI / 2;
    neck.position.set(-0.03, 0, 0);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 10), handleMat);
    knob.position.set(0.22, 0, 0);
    handle.add(lever, neck, knob);
    handle.position.set(-0.37, 1.27, 0.22);
    door.add(handle);

    const threshold = new THREE.Mesh(new RoundedBoxGeometry(1.5, 0.06, 0.42, 3, 0.02), standard('#d7a78d', { roughness: 0.7 }));
    threshold.position.set(0, 0.03, 0.18);
    threshold.receiveShadow = true;
    door.add(threshold);

    // painted welcome mat on the floor
    const matTex = makeCanvasTexture(512, 256, (ctx, w, h) => this.drawDoorMat(ctx, w, h), { srgb: true });
    const mat = new THREE.Mesh(
      new THREE.PlaneGeometry(1.28, 0.66),
      new THREE.MeshStandardMaterial({ map: matTex, roughness: 0.96, transparent: true }),
    );
    mat.rotation.x = -Math.PI / 2;
    mat.position.set(8.62, 0.018, -4.55);
    mat.receiveShadow = true;
    this.scene.add(mat);

    this.buildHangingSign(door);
    this.buildDoorBell(door);
    this.addContactShadow(8.62, -5.18, 1.6, 0.45, 0.22);

    this.doorLight = new THREE.PointLight(0xffdca6, 0.1, 5, 2);
    this.doorLight.position.set(8.62, 2.15, -4.45);
    this.scene.add(this.doorLight);

    // tiny step-side posy
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.24, 12), standard('#f6c9c2', { roughness: 0.7 }));
    pot.position.set(7.75, 0.12, -4.72);
    pot.castShadow = true;
    this.scene.add(pot);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), standard(i % 2 ? '#a9dcc6' : '#c7ead8', { roughness: 0.8 }));
      leaf.position.set(7.75 + Math.cos(a) * 0.11, 0.31 + (i % 2) * 0.05, -4.72 + Math.sin(a) * 0.11);
      this.scene.add(leaf);
    }
  }

  private buildHangingSign(door: THREE.Group) {
    const sway = new THREE.Group();
    sway.position.set(-0.42, 2.92, 0.18);
    this.doorSignSway = sway;
    door.add(sway);

    const bracket = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.52, 8), standard('#d6ae72', { roughness: 0.3, metalness: 0.45 }));
    bracket.rotation.z = Math.PI / 2;
    bracket.position.set(0.26, 0.06, 0);
    sway.add(bracket);
    const bracketTip = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), standard('#d6ae72', { roughness: 0.3, metalness: 0.45 }));
    bracketTip.position.set(0.52, 0.06, 0);
    sway.add(bracketTip);

    const pivot = new THREE.Group();
    this.doorSignPivot = pivot;
    sway.add(pivot);

    const ropeMat = standard('#cfa36c', { roughness: 0.7 });
    for (const x of [-0.19, 0.19]) {
      const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.17, 6), ropeMat);
      rope.position.set(x, -0.085, 0);
      pivot.add(rope);
    }

    const openTex = makeCanvasTexture(512, 384, (ctx, w, h) => this.drawDoorSign(ctx, w, h, true), { srgb: true });
    const closedTex = makeCanvasTexture(512, 384, (ctx, w, h) => this.drawDoorSign(ctx, w, h, false), { srgb: true });
    const edge = standard('#e7c79b', { roughness: 0.55 });
    const openMat = new THREE.MeshBasicMaterial({ map: openTex, toneMapped: false, transparent: true });
    const closedMat = new THREE.MeshBasicMaterial({ map: closedTex, toneMapped: false, transparent: true });
    const mats: THREE.Material[] = [edge, edge, edge, edge, openMat, closedMat];
    const face = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.52, 0.045), mats);
    face.position.set(0, -0.43, 0);
    face.castShadow = true;
    pivot.add(face);

    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: radialTexture('#ffe8af', 'rgba(255,232,175,0)'),
        transparent: true,
        opacity: 0.1,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    glow.scale.set(1.15, 1.05, 1);
    glow.position.set(0, -0.42, -0.08);
    sway.add(glow);
    this.doorGlow = glow;
  }

  private buildDoorBell(door: THREE.Group) {
    const bell = new THREE.Group();
    bell.position.set(-0.48, 2.6, 0.22);
    this.doorBellGroup = bell;
    door.add(bell);

    const plate = new THREE.Mesh(new RoundedBoxGeometry(0.3, 0.16, 0.035, 3, 0.02), standard('#f4d296', { roughness: 0.3, metalness: 0.5 }));
    plate.position.y = 0.04;
    bell.add(plate);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), standard('#e8bd6e', { roughness: 0.25, metalness: 0.65 }));
    dome.position.set(0, -0.02, 0.035);
    dome.rotation.x = Math.PI;
    bell.add(dome);
    const striker = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), standard('#c79a4f', { roughness: 0.3, metalness: 0.6 }));
    striker.position.set(0, -0.11, 0.045);
    bell.add(striker);
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.18, 5), standard('#d8b070', { roughness: 0.75 }));
    cord.position.set(0.13, -0.12, 0.035);
    bell.add(cord);
  }

  private drawDoorSign(ctx: CanvasRenderingContext2D, w: number, h: number, open: boolean) {
    ctx.clearRect(0, 0, w, h);
    const bg = ctx.createLinearGradient(0, 0, w, h);
    if (open) {
      bg.addColorStop(0, '#fff6d8');
      bg.addColorStop(0.55, '#ffe4ae');
      bg.addColorStop(1, '#ffd08e');
    } else {
      bg.addColorStop(0, '#f6e7ea');
      bg.addColorStop(0.6, '#ead7e4');
      bg.addColorStop(1, '#d9c6db');
    }
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect(14, 14, w - 28, h - 28, 54);
    ctx.fill();
    ctx.lineWidth = 9;
    ctx.strokeStyle = open ? '#8fd9bd' : '#bda9cf';
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    ctx.beginPath();
    ctx.roundRect(32, 32, w - 64, h - 64, 40);
    ctx.stroke();

    // peach mark
    ctx.fillStyle = open ? '#ff9fba' : '#c7adc6';
    ctx.beginPath();
    ctx.arc(96, 120, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = open ? '#86cdb1' : '#a992b4';
    ctx.beginPath();
    ctx.ellipse(118, 84, 22, 11, -0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = open ? '#ffe8b7' : '#f0e3ee';
    ctx.beginPath();
    ctx.arc(84, 108, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.textAlign = 'center';
    ctx.fillStyle = open ? '#7a4c3d' : '#6f6179';
    ctx.font = '700 98px "PingFang SC", "Noto Sans SC", sans-serif';
    ctx.fillText(open ? '营业中' : '休息中', w / 2 + 28, 218);
    ctx.font = '700 30px "Avenir Next", "Helvetica Neue", sans-serif';
    ctx.fillStyle = open ? '#5f9d85' : '#8c7c99';
    ctx.fillText(open ? 'O P E N' : 'C L O S E D', w / 2 + 28, 278);
    ctx.font = '600 22px "PingFang SC", sans-serif';
    ctx.fillStyle = open ? 'rgba(122,76,61,0.58)' : 'rgba(111,97,121,0.58)';
    ctx.fillText(open ? '推门进来，慢慢喝' : '门已关好，明天见', w / 2 + 28, 328);
  }

  private drawDoorMat(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#f6c5ad';
    ctx.beginPath();
    ctx.roundRect(10, 10, w - 20, h - 20, 46);
    ctx.fill();
    ctx.strokeStyle = '#fff2e1';
    ctx.lineWidth = 8;
    ctx.setLineDash([22, 12]);
    ctx.beginPath();
    ctx.roundRect(30, 30, w - 60, h - 60, 32);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#98624f';
    ctx.font = '700 44px "Avenir Next", "Helvetica Neue", sans-serif';
    ctx.fillText('WELCOME', w / 2, 118);
    ctx.font = '600 34px "PingFang SC", sans-serif';
    ctx.fillText('桃 桃 茶 屋', w / 2, 178);
  }

  private updateDoor(dt: number) {
    if (this.doorSignPivot) {
      this.doorFlip = THREE.MathUtils.damp(this.doorFlip, this.doorFlipTarget, 4.6, dt);
      this.doorSignPivot.rotation.y = this.doorFlip;
    }
    if (this.doorSignSway) {
      this.doorSignSway.rotation.z = Math.sin(this.clockTime * 1.05) * 0.05 + Math.sin(this.clockTime * 0.42) * 0.018;
      this.doorSignSway.rotation.x = Math.sin(this.clockTime * 0.68) * 0.016;
    }
    this.doorBellKick = Math.max(0, this.doorBellKick - dt * 1.15);
    if (this.doorBellGroup) {
      this.doorBellGroup.rotation.z = Math.sin(this.clockTime * 13) * 0.2 * this.doorBellKick;
    }
    if (this.doorGlow) {
      const mat = this.doorGlow.material as THREE.SpriteMaterial;
      mat.opacity = THREE.MathUtils.damp(mat.opacity, this.storeOpen ? 0.52 : 0.1, 3, dt);
    }
    if (this.doorLight) {
      this.doorLight.intensity = THREE.MathUtils.damp(this.doorLight.intensity, this.storeOpen ? 1.05 : 0.14, 3, dt);
    }
    if (this.doorGlassMat) {
      this.doorGlassMat.opacity = THREE.MathUtils.damp(this.doorGlassMat.opacity, this.storeOpen ? 0.5 : 0.34, 3, dt);
    }
  }

  private buildSignAndMenu() {
    // Menu board
    const board = new THREE.Mesh(new RoundedBoxGeometry(2.82, 1.72, 0.12, 4, 0.09), standard('#f5b7c9', { roughness: 0.55 }));
    board.position.set(0, 3.42, -5.14);
    board.castShadow = true;
    this.scene.add(board);
    const paper = new THREE.Mesh(
      new THREE.PlaneGeometry(2.56, 1.46),
      new THREE.MeshBasicMaterial({ map: this.menuTexture, toneMapped: false }),
    );
    paper.position.set(0, 3.42, -5.075);
    this.scene.add(paper);
    for (const [dx, dy] of [
      [-1.3, 0.78],
      [1.3, 0.78],
      [-1.3, -0.78],
      [1.3, -0.78],
    ] as const) {
      const pin = new THREE.Mesh(new THREE.SphereGeometry(0.033, 8, 8), standard('#fff1d4', { roughness: 0.3 }));
      pin.position.set(dx, 3.42 + dy, -5.06);
      this.scene.add(pin);
    }
    // little shelf under menu with hanging cups
    const miniShelf = new THREE.Mesh(new RoundedBoxGeometry(2.35, 0.07, 0.26, 3, 0.02), standard('#fff3e4', { roughness: 0.7 }));
    miniShelf.position.set(0, 2.28, -4.98);
    miniShelf.castShadow = true;
    this.scene.add(miniShelf);
    this.addContactShadow(0, -4.98, 2.5, 0.32, 0.18);
    const mugColors = ['#ffb8ca', '#bcebd9', '#ffe0a0', '#cab7e5'];
    for (let i = 0; i < 5; i++) {
      const mug = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.065, 0.16, 16, 1, true), standard(mugColors[i % mugColors.length], { roughness: 0.5, side: THREE.DoubleSide }));
      const inner = new THREE.Mesh(new THREE.CylinderGeometry(0.064, 0.05, 0.13, 16), standard('#fff8ee', { roughness: 0.7 }));
      inner.position.y = -0.01;
      const handle = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.016, 6, 16, Math.PI), standard(mugColors[i % mugColors.length], { roughness: 0.5 }));
      handle.position.set(0.085, 0, 0);
      handle.rotation.z = -Math.PI / 2;
      mug.add(body, inner, handle);
      mug.position.set(-0.84 + i * 0.42, 2.38, -4.95);
      mug.rotation.y = Math.PI;
      this.scene.add(mug);
    }

    // Brand sign
    const signBoard = new THREE.Mesh(new RoundedBoxGeometry(3.7, 0.92, 0.15, 5, 0.1), standard('#ffc8d9', { roughness: 0.48 }));
    signBoard.position.set(0, 4.95, -5.16);
    signBoard.castShadow = true;
    this.scene.add(signBoard);
    const signFace = new THREE.Mesh(
      new THREE.PlaneGeometry(3.48, 0.76),
      new THREE.MeshBasicMaterial({ map: this.signTexture, toneMapped: false }),
    );
    signFace.position.set(0, 4.95, -5.075);
    this.scene.add(signFace);

    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: radialTexture('rgba(255,170,200,0.48)', 'rgba(255,170,200,0)', 256),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        opacity: 0.4,
      }),
    );
    glow.position.set(0, 4.95, -5.3);
    glow.scale.set(7.2, 2.9, 1);
    this.scene.add(glow);
    this.signGlow = glow;

    // small stars around sign
    for (let i = 0; i < 10; i++) {
      const star = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: starTexture(i % 2 ? '#ffe4ab' : '#ffd7e3'),
          transparent: true,
          depthWrite: false,
          opacity: 0.9,
        }),
      );
      const a = (i / 10) * Math.PI * 2;
      star.position.set(Math.cos(a) * (1.9 + (i % 3) * 0.16), 4.95 + Math.sin(a) * 0.55, -5.22);
      star.scale.setScalar(0.065 + (i % 3) * 0.025);
      this.scene.add(star);
    }
  }

  private redrawMenu() {
    const ctx = this.menuTexture.image.getContext('2d') as CanvasRenderingContext2D;
    this.drawMenu(ctx, 1024, 640, this.unlockedDrinks);
    this.menuTexture.needsUpdate = true;
  }

  private drawMenu(ctx: CanvasRenderingContext2D, w: number, h: number, unlocked: DrinkDef[]) {
    ctx.clearRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#fff8ed');
    g.addColorStop(1, '#ffedf1');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#e8a7ba';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 9]);
    ctx.strokeRect(26, 24, w - 52, h - 48);
    ctx.setLineDash([]);
    ctx.fillStyle = '#9d5c70';
    ctx.textAlign = 'center';
    ctx.font = '600 48px "ZCOOL KuaiLe", "PingFang SC", sans-serif';
    ctx.fillText('今 日 茶 单', w / 2, 104);
    ctx.font = '700 20px "Baloo 2", sans-serif';
    ctx.fillStyle = '#d18e9f';
    ctx.fillText('TODAY’S TEA MENU', w / 2, 137);

    const drinks = unlocked.length ? unlocked : DRINKS.filter((d) => d.unlockDay === 1);
    const display = drinks.slice(0, 8);
    const cols = display.length > 4 ? 2 : 1;
    const rows = Math.ceil(display.length / cols);
    const startY = 196;
    const rowH = Math.min(82, 340 / rows);
    display.forEach((d, i) => {
      const col = Math.floor(i / rows);
      const row = i % rows;
      const baseX = cols === 1 ? 380 : 170 + col * 470;
      const y = startY + row * rowH;
      if (i < display.length - 1) {
        ctx.globalAlpha = 0.23;
        ctx.strokeStyle = '#d9b4b3';
        ctx.lineWidth = 1.4;
        ctx.setLineDash([4, 8]);
        ctx.beginPath();
        ctx.moveTo(baseX - 80, y + 25);
        ctx.lineTo(baseX + 270, y + 25);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
      }
      ctx.textAlign = 'left';
      ctx.fillStyle = '#7b5361';
      ctx.font = '600 29px "ZCOOL KuaiLe", "PingFang SC", sans-serif';
      ctx.fillText(d.name, baseX - 48, y + 15);
      ctx.fillStyle = '#c28696';
      ctx.font = '700 16px "Baloo 2", sans-serif';
      ctx.fillText(d.latin, baseX - 46, y + 44);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#7b5361';
      ctx.font = '700 27px "Baloo 2", "Noto Sans SC", sans-serif';
      ctx.fillText('¥' + d.price, baseX + 288, y + 15);
      // little cup swatch
      ctx.save();
      ctx.translate(baseX - 77, y + 1);
      ctx.fillStyle = d.color;
      ctx.beginPath();
      ctx.moveTo(-11, -8);
      ctx.lineTo(13, -8);
      ctx.lineTo(9, 22);
      ctx.quadraticCurveTo(8, 27, 3, 27);
      ctx.lineTo(-3, 27);
      ctx.quadraticCurveTo(-8, 27, -9, 22);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#8b6d6b';
      ctx.lineWidth = 2.2;
      ctx.stroke();
      ctx.strokeStyle = '#82b39e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(4, -8);
      ctx.lineTo(12, -25);
      ctx.stroke();
      ctx.restore();
      if (d.badge) {
        ctx.save();
        ctx.translate(baseX + 216, y + 43);
        ctx.rotate(-0.1);
        ctx.fillStyle = '#ffe0a1';
        ctx.beginPath();
        ctx.roundRect(-24, -12, 58, 23, 10);
        ctx.fill();
        ctx.fillStyle = '#a76b55';
        ctx.font = '700 14px "Noto Sans SC", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(d.badge, 5, 4);
        ctx.restore();
      }
    });
    // bottom doodles
    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = '#ffafc5';
    ctx.beginPath();
    ctx.arc(880, 564, 29, 0, Math.PI * 2);
    ctx.arc(924, 564, 29, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#a7d9c2';
    ctx.beginPath();
    ctx.ellipse(916, 521, 21, 10, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d49baa';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(825, 574);
    ctx.quadraticCurveTo(872, 548, 917, 574);
    ctx.stroke();
    ctx.restore();
    // washi tape
    ctx.save();
    ctx.translate(100, 570);
    ctx.rotate(-0.12);
    ctx.fillStyle = 'rgba(177,231,213,0.8)';
    ctx.fillRect(-34, -12, 68, 24);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    for (let i = -28; i < 30; i += 12) ctx.fillRect(i, -12, 3, 24);
    ctx.restore();
    ctx.fillStyle = '#b07a86';
    ctx.font = '500 17px "Noto Sans SC", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('给自己留一杯甜甜的', 102, 604);
    ctx.textAlign = 'right';
    ctx.font = '700 15px "Baloo 2", sans-serif';
    ctx.fillText('PEACH & MINT · EST. 2026', 920, 610);
  }

  private drawSign(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.clearRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#fff0e2');
    g.addColorStop(0.55, '#fff8ee');
    g.addColorStop(1, '#ffe5ec');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#b9e7d7';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.roundRect(14, 14, w - 28, h - 28, 26);
    ctx.stroke();
    ctx.strokeStyle = '#ffb2c7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(29, 29, w - 58, h - 58, 18);
    ctx.stroke();
    // peach mark
    ctx.save();
    ctx.translate(154, 126);
    ctx.fillStyle = '#ff9d92';
    ctx.beginPath();
    ctx.arc(-18, 2, 31, 0, Math.PI * 2);
    ctx.arc(18, 2, 31, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d77a7a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 4, 35, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#8fc9a0';
    ctx.beginPath();
    ctx.ellipse(27, -35, 22, 10, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#cb8c7d';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -26);
    ctx.quadraticCurveTo(16, -48, 30, -40);
    ctx.stroke();
    ctx.restore();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#8f5266';
    ctx.font = '600 92px "ZCOOL KuaiLe", "PingFang SC", sans-serif';
    ctx.fillText('桃 桃 茶 屋', w / 2 + 55, 130);
    ctx.fillStyle = '#bd8493';
    ctx.font = '700 25px "Baloo 2", sans-serif';
    ctx.letterSpacing = '3px';
    ctx.fillText('P E A C H  &  M I N T   T E A   H O U S E', w / 2 + 55, 183);
    // little stars
    ctx.fillStyle = '#ffcd77';
    for (const [x, y, r] of [
      [332, 52, 8],
      [925, 200, 6],
      [286, 201, 5],
      [956, 57, 10],
    ] as const) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private buildCounter() {
    const joinery = standard('#9eae95', { roughness: .97 });
    const oak = this.paint.surfaces.oak;
    const body = new THREE.Mesh(new RoundedBoxGeometry(9.04, .98, 1.30, 4, .07), joinery);
    body.position.set(0, .51, 1.12);
    body.receiveShadow = true;
    this.scene.add(body);
    this.addContactShadow(0, 1.12, 9.25, 1.55, .55);

    const recessed = standard('#b6c2a8', { roughness: .97 });
    const trim = standard('#c7c8a6', { roughness: .94 });
    const knob = standard('#ab855d', { roughness: .76, metalness: .08 });
    const panelWidth = 1.23;
    for (let i = 0; i < 7; i++) {
      const x = (i - 3) * 1.29;
      if (i % 2 === 1) {
        const panel = new THREE.Mesh(new THREE.PlaneGeometry(panelWidth, .73), this.paint.surfaces['counter-panel']);
        panel.position.set(x, .52, 1.786);
        panel.receiveShadow = true;
        this.scene.add(panel);
      } else {
        // Between the painted panels sit two shallow tea drawers with wooden pulls.
        for (const y of [.345, .705]) {
          const face = new THREE.Mesh(new RoundedBoxGeometry(panelWidth, .325, .042, 2, .018), recessed);
          face.position.set(x, y, 1.785);
          face.receiveShadow = true;
          const pull = new THREE.Mesh(new THREE.SphereGeometry(.037, 12, 8), knob);
          pull.position.set(x, y, 1.824);
          pull.scale.set(1.65, .75, .8);
          this.scene.add(face, pull);
        }
      }
    }
    for (const y of [.105, .94]) {
      const beading = new THREE.Mesh(new RoundedBoxGeometry(9.1, .075, 1.34, 3, .025), trim);
      beading.position.set(0, y, 1.13);
      this.scene.add(beading);
    }
    const topGeometry = new RoundedBoxGeometry(9.31, .135, 1.56, 4, .045);
    const points = topGeometry.attributes.position;
    const normals = topGeometry.attributes.normal;
    const uv = topGeometry.attributes.uv;
    for (let i = 0; i < uv.count; i++) {
      const vertical = Math.abs(normals.getY(i)) > .55 ? points.getZ(i) : points.getY(i);
      uv.setXY(i, (points.getX(i) + 4.65) / 3.65, (vertical + .80) / 1.65);
    }
    const top = new THREE.Mesh(topGeometry, oak);
    top.position.set(0, 1.05, 1.1);
    top.castShadow = true;
    top.receiveShadow = true;
    this.scene.add(top);
    this.buildCounterProps();
    this.buildTrainingTrophy();
  }

  private buildCounterProps() {
    // cake display (left)
    const display = new THREE.Group();
    const base = new THREE.Mesh(new RoundedBoxGeometry(1.08, 0.16, 0.72, 3, 0.06), standard('#ffd9c9', { roughness: 0.6 }));
    base.position.y = 0.08;
    const rim = new THREE.Mesh(new RoundedBoxGeometry(1.12, 0.05, 0.76, 3, 0.02), standard('#f7c287', { roughness: 0.35, metalness: 0.2 }));
    rim.position.y = 0.17;
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xfff8f0,
      transparent: true,
      opacity: 0.23,
      roughness: 0.04,
      transmission: 0.45,
      thickness: 0.1,
      clearcoat: 1,
    });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.48, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), glassMat);
    dome.scale.set(1.1, 0.95, 0.74);
    dome.position.y = 0.19;
    const domeRim = new THREE.Mesh(new THREE.TorusGeometry(0.47, 0.02, 8, 48), standard('#f0c889', { roughness: 0.28, metalness: 0.3 }));
    domeRim.rotation.x = Math.PI / 2;
    domeRim.scale.set(1, 0.74, 1);
    domeRim.position.y = 0.19;
    const domeKnob = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 10), standard('#f0c889', { roughness: 0.28, metalness: 0.35 }));
    domeKnob.position.set(0, 0.68, 0);
    // pastel ribbon on the cloche
    const ribbonBow = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.018, 6, 16), standard('#ff9fbb', { roughness: 0.5 }));
    ribbonBow.position.set(0, 0.57, 0.04);
    ribbonBow.rotation.x = Math.PI / 2;
    display.add(base, rim, dome, domeRim, domeKnob, ribbonBow);
    const cakeColors = ['#ffd8e0', '#c9e9d5', '#f7e3a4', '#d7c1e7', '#ffe8c7'];
    for (let i = 0; i < 4; i++) {
      const cake = this.makeCake(cakeColors[i]);
      cake.position.set(-0.32 + i * 0.21, 0.19, 0.05);
      cake.scale.setScalar(0.7);
      display.add(cake);
      this.cakeMeshes.push(cake);
    }
    display.position.set(-3.25, 1.118, 0.79);
    this.scene.add(display);

    // vase with flowers
    const vase = new THREE.Group();
    const vaseBody = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 0.3, 16), standard('#e8f6ef', { roughness: 0.35 }));
    vaseBody.position.y = 0.15;
    vase.add(vaseBody);
    for (let i = 0; i < 5; i++) {
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.35, 5), standard('#7fa980', { roughness: 0.8 }));
      const a = (i / 5) * Math.PI * 2;
      stem.position.set(Math.cos(a) * 0.035, 0.42, Math.sin(a) * 0.035);
      stem.rotation.z = Math.cos(a) * 0.2;
      stem.rotation.x = Math.sin(a) * 0.2;
      const bloom = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), standard(i % 2 ? '#ffb6c9' : '#ffe0a0', { roughness: 0.6 }));
      bloom.position.set(Math.cos(a) * 0.08, 0.61, Math.sin(a) * 0.08);
      bloom.scale.y = 0.8;
      vase.add(stem, bloom);
    }
    const paintedVase = this.paint.furnishing('posy', vase, .59);
    paintedVase.position.set(-1.8, 1.13, 1.35);
    this.scene.add(paintedVase);

    // register
    const register = new THREE.Group();
    const bodyReg = new THREE.Mesh(new RoundedBoxGeometry(0.8, 0.42, 0.5, 4, 0.1), standard('#f6cad7', { roughness: 0.5 }));
    bodyReg.position.y = 0.21;
    const screen = new THREE.Mesh(new RoundedBoxGeometry(0.67, 0.42, 0.06, 3, 0.06), standard('#63576b', { roughness: 0.35 }));
    screen.position.set(0, 0.55, -0.13);
    screen.rotation.x = -0.2;
    const screenFace = new THREE.Mesh(
      new THREE.PlaneGeometry(0.55, 0.3),
      new THREE.MeshBasicMaterial({ color: '#c9f1df', toneMapped: false }),
    );
    screenFace.position.set(0, 0.56, -0.09);
    screenFace.rotation.x = -0.2;
    const keyMat = standard('#fff4e5', { roughness: 0.5 });
    for (let i = 0; i < 6; i++) {
      const key = new THREE.Mesh(new RoundedBoxGeometry(0.11, 0.045, 0.08, 2, 0.02), keyMat);
      key.position.set(-0.22 + (i % 3) * 0.22, 0.43, 0.12 + Math.floor(i / 3) * 0.1);
      register.add(key);
    }
    const earL = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.12, 4), standard('#f6cad7', { roughness: 0.5 }));
    earL.position.set(-0.22, 0.78, -0.12);
    const earR = earL.clone();
    earR.position.x = 0.22;
    register.add(bodyReg, screen, screenFace, earL, earR);
    const till = this.paint.furnishing('register', register, .88);
    till.position.set(3.25, 1.12, 1.1);
    till.rotation.y = -.08;
    this.scene.add(till);

    // cups & straws
    const cups = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.07, 0.24, 16, 1, true), standard('#fff6ed', { roughness: 0.55, side: THREE.DoubleSide }));
      cup.position.set(0, 0.12 + i * 0.15, 0);
      cups.add(cup);
      const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.02, 16), standard('#ffb7c9', { roughness: 0.5 }));
      lid.position.y = 0.25 + i * 0.15;
      cups.add(lid);
    }
    cups.position.set(2.35, 1.13, 1.42);
    this.scene.add(cups);
    const strawPot = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.11, 0.28, 16), standard('#bfe9db', { roughness: 0.5 }));
    strawPot.position.set(2.68, 1.27, 1.28);
    this.scene.add(strawPot);
    for (let i = 0; i < 5; i++) {
      const straw = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.4, 5), standard(i % 2 ? '#ffd4e0' : '#fff3d7', { roughness: 0.4 }));
      straw.position.set(2.61 + (i % 3) * 0.045, 1.46, 1.24 + Math.floor(i / 3) * 0.04);
      straw.rotation.z = 0.05 * (i - 2);
      this.scene.add(straw);
    }

    // bell
    const bell = new THREE.Group();
    const bellBody = new THREE.Mesh(new THREE.SphereGeometry(0.1, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), standard('#f6cd7d', { roughness: 0.25, metalness: 0.5 }));
    bellBody.position.y = 0.1;
    const bellBase = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.14, 0.035, 20), standard('#8f685a', { roughness: 0.6 }));
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), standard('#8f685a', { roughness: 0.5 }));
    knob.position.y = 0.2;
    bell.add(bellBody, bellBase, knob);
    bell.position.set(0.55, 1.13, 1.4);
    this.scene.add(bell);

    // tip jar
    const tip = new THREE.Group();
    const jarGlass = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.14, 0.3, 24, 1, true),
      new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.08, transparent: true, opacity: 0.25, transmission: 0.5, side: THREE.DoubleSide }),
    );
    jarGlass.position.y = 0.15;
    const coins = new THREE.Group();
    for (let i = 0; i < 8; i++) {
      const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.012, 16), standard('#ffd16f', { roughness: 0.32, metalness: 0.45 }));
      coin.position.set((Math.random() - 0.5) * 0.2, 0.04 + i * 0.011, (Math.random() - 0.5) * 0.2);
      coin.rotation.set(Math.random() * 0.3, 0, Math.random() * 0.3);
      coins.add(coin);
    }
    const label = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.12), new THREE.MeshBasicMaterial({ map: this.makeLabelTexture('小 费'), transparent: true }));
    label.position.set(0, 0.17, 0.148);
    tip.add(jarGlass, coins, label);
    tip.position.set(1.35, 1.13, 1.38);
    this.scene.add(tip);

    // lucky cat figurine
    const cat = this.makeLuckyCat();
    cat.position.set(2.86, 1.13, 0.55);
    cat.rotation.y = -0.15;
    this.scene.add(cat);

    // little jar of flowers on far right & napkins
    const napkin = new THREE.Mesh(new RoundedBoxGeometry(0.22, 0.16, 0.12, 2, 0.03), standard('#fff7ec', { roughness: 0.9 }));
    napkin.position.set(0.02, 1.21, 1.5);
    this.scene.add(napkin);

    this.buildCounterExtras();
  }

  private buildCounterExtras() {
    // tiered dessert stand
    const stand = new THREE.Group();
    const gold = standard('#e9b96e', { roughness: 0.32, metalness: 0.35 });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.22, 0.05, 24), gold);
    base.position.y = 0.025;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.42, 12), gold);
    stem.position.y = 0.24;
    const lowPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.4, 0.03, 28), standard('#fff2e4', { roughness: 0.4 }));
    lowPlate.position.y = 0.46;
    const highPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.29, 0.028, 24), standard('#fff2e4', { roughness: 0.4 }));
    highPlate.position.y = 0.72;
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 10), standard('#ff8fae', { roughness: 0.4 }));
    knob.position.y = 0.79;
    stand.add(base, stem, lowPlate, highPlate, knob);
    const cakeTones = ['#ffc2d2', '#a9e7cf', '#ffd982', '#c9b3e8', '#ffb59d'];
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const macaron = new THREE.Group();
      const shellTop = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), standard(cakeTones[i], { roughness: 0.55 }));
      shellTop.scale.y = 0.5;
      shellTop.position.y = 0.035;
      const filling = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.025, 14), standard('#fff0dc', { roughness: 0.7 }));
      const shellBottom = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), standard(cakeTones[i], { roughness: 0.55 }));
      shellBottom.scale.y = 0.5;
      shellBottom.position.y = -0.008;
      macaron.add(shellTop, filling, shellBottom);
      macaron.position.set(Math.cos(a) * 0.31, 0.49, Math.sin(a) * 0.31);
      stand.add(macaron);
    }
    for (let i = 0; i < 3; i++) {
      const mini = this.makeCake(cakeTones[i]);
      mini.scale.setScalar(0.42);
      mini.position.set(-0.15 + i * 0.15, 0.735, 0.04);
      stand.add(mini);
    }
    const pastries = this.paint.furnishing('pastries', stand, .91);
    pastries.position.set(-.9, 1.118, 1.12);
    this.scene.add(pastries);

    // syrup bottle caddy
    const caddy = new THREE.Group();
    const tray = new THREE.Mesh(new RoundedBoxGeometry(0.54, 0.08, 0.32, 3, 0.03), standard('#d9a677', { roughness: 0.6 }));
    tray.position.y = 0.04;
    caddy.add(tray);
    const syrupColors = ['#ff86a8', '#7edbb9', '#ffce67', '#a78be0'];
    for (let i = 0; i < 4; i++) {
      const bottle = new THREE.Group();
      const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.24, 14), standard(syrupColors[i], { roughness: 0.25 }));
      glass.position.y = 0.2;
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.04, 0.06, 12), standard(syrupColors[i], { roughness: 0.25 }));
      neck.position.y = 0.34;
      const pump = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.09, 8), standard('#f8e6c8', { roughness: 0.4 }));
      pump.position.y = 0.41;
      const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.05, 6), standard('#f8e6c8', { roughness: 0.4 }));
      nozzle.rotation.z = Math.PI / 2;
      nozzle.position.set(0.04, 0.45, 0);
      const label = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.045), new THREE.MeshBasicMaterial({ color: '#fff7e8' }));
      label.position.set(0, 0.2, 0.052);
      bottle.add(glass, neck, pump, nozzle, label);
      bottle.position.x = -0.185 + i * 0.123;
      caddy.add(bottle);
    }
    caddy.position.set(1.85, 1.118, 1.16);
    caddy.rotation.y = -0.16;
    this.scene.add(caddy);
  }

  private buildTrainingTrophy() {
    const group = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.06, 20), standard('#6d4a51', { roughness: 0.5 }));
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.14, 10), standard('#e4b866', { roughness: 0.3, metalness: 0.5 }));
    stem.position.y = 0.1;
    const cup = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.6), standard('#ffd16f', { roughness: 0.25, metalness: 0.5 }));
    cup.position.y = 0.24;
    cup.rotation.x = Math.PI;
    for (const s of [-1, 1]) {
      const handle = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.014, 6, 14, Math.PI), standard('#ffd16f', { roughness: 0.25, metalness: 0.5 }));
      handle.position.set(s * 0.11, 0.23, 0);
      handle.rotation.z = s * Math.PI * 0.5;
      group.add(handle);
    }
    group.add(base, stem, cup);
    group.position.set(-0.4, 1.13, 0.55);
    group.visible = false;
    this.scene.add(group);
    this.trophyGroup = group;
  }

  private buildSeating() {
    const seatColors = ['#ffb7ca', '#9ee3c9', '#ffd88f'];
    // decorative counter stools against the back wall
    for (let i = 0; i < 3; i++) {
      const x = BACK_STOOLS[i].x;
      const stool = new THREE.Group();
      const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.35, 0.13, 24), standard(seatColors[i], { roughness: 0.55 }));
      seat.position.y = 0.62;
      seat.castShadow = true;
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.075, 0.48, 12), standard('#d5aa78', { roughness: 0.45, metalness: 0.15 }));
      leg.position.y = 0.32;
      const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.05, 20), standard('#e0b783', { roughness: 0.4, metalness: 0.15 }));
      foot.position.y = 0.06;
      stool.add(seat, leg, foot);
      const cushion = new THREE.Mesh(new RoundedBoxGeometry(0.55, 0.11, 0.5, 4, 0.06), standard(i === 1 ? '#ffd6e2' : '#d3f5e8', { roughness: 0.9 }));
      cushion.position.y = 0.73;
      cushion.castShadow = true;
      cushion.visible = false;
      this.cushionMeshes.push(cushion);
      const paintedStool = this.paint.furnishing('stool', stool, .76);
      paintedStool.position.set(x, 0, BACK_STOOLS[i].z);
      cushion.position.set(x, .73, BACK_STOOLS[i].z + .035);
      this.scene.add(paintedStool, cushion);
      this.addContactShadow(x, BACK_STOOLS[i].z, .73, .55, .75, .022);
    }

    for (const [i, seat] of SEATS.entries()) {
      const tableModel = new THREE.Group();
      const top = new THREE.Mesh(new THREE.CylinderGeometry(.47, .48, .055, 28), this.paint.surfaces.oak);
      top.position.y = .79;
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(.055, .1, .75, 14), standard('#bd926c'));
      leg.position.y = .39;
      const foot = new THREE.Mesh(new THREE.CylinderGeometry(.24, .28, .06, 18), standard('#bd926c'));
      foot.position.y = .03;
      tableModel.add(top, leg, foot);
      const table = this.paint.furnishing(i === 1 ? 'table-daisy' : 'table-rose', tableModel, 1.20, i === 2);
      table.position.set(seat.tableX, 0, seat.tableZ);
      this.scene.add(table);
      this.addContactShadow(seat.tableX + .03, seat.tableZ + .03, 1.05, .69, .9, .02);

      const chair = this.paint.furnishing(i === 1 ? 'chair-front' : 'chair-turned', this.makeChair(seatColors[i]), 1.19, i === 0);
      chair.position.set(seat.x, 0, seat.z - .08);
      chair.rotation.y = seat.angle;
      this.scene.add(chair);
      this.addContactShadow(seat.x + .025, seat.z - .015, .86, .68, .85, .02);
    }

    // long banquette against the back wall, below the windows
    const bench = new THREE.Group();
    const benchBase = new THREE.Mesh(new RoundedBoxGeometry(6.8, 0.46, 0.72, 4, 0.1), standard('#9fdec6', { roughness: 0.8 }));
    benchBase.position.y = 0.23;
    const benchSeat = new THREE.Mesh(new RoundedBoxGeometry(6.8, 0.18, 0.82, 4, 0.08), standard('#ffc9d9', { roughness: 0.9 }));
    benchSeat.position.y = 0.54;
    const benchBack = new THREE.Mesh(new RoundedBoxGeometry(6.8, 0.58, 0.16, 4, 0.08), standard('#ffdbe5', { roughness: 0.9 }));
    benchBack.position.set(0, 0.92, -0.3);
    const benchTop = new THREE.Mesh(new RoundedBoxGeometry(6.82, 0.08, 0.2, 3, 0.03), standard('#f7d08d', { roughness: 0.5, metalness: 0.15 }));
    benchTop.position.set(0, 1.24, -0.3);
    bench.add(benchBase, benchSeat, benchBack, benchTop);
    const paintedBench = this.paint.furnishing('bench', bench, 1.53, false, 4.38);
    paintedBench.position.set(0, 0, -4.63);
    this.scene.add(paintedBench);
    this.addContactShadow(0, -4.63, 4.64, .82, .72);

    // framed prints between the windows and the menu board
    for (const x of [-1.93, 1.93]) {
      const art = new THREE.Mesh(new RoundedBoxGeometry(0.8, 0.62, 0.06, 3, 0.04), standard('#ffd0dc', { roughness: 0.55 }));
      art.position.set(x, 1.98, -5.18);
      const posterTex = this.makePosterTexture();
      const poster = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.48), new THREE.MeshBasicMaterial({ map: posterTex, toneMapped: false }));
      poster.position.set(x, 1.98, -5.14);
      this.scene.add(art, poster);
    }
  }

  private makeChair(seatColor: string): THREE.Group {
    const group = new THREE.Group();
    const wood = standard('#d8ae82', { roughness: 0.5 });
    // Seat runs deeper toward the counter so the backrest clears a seated
    // guest's torso and skirt.
    const seat = new THREE.Mesh(new RoundedBoxGeometry(0.56, 0.09, 0.6, 4, 0.05), standard(seatColor, { roughness: 0.65 }));
    seat.position.set(0, 0.48, -0.06);
    seat.castShadow = true;
    const back = new THREE.Mesh(new RoundedBoxGeometry(0.54, 0.42, 0.07, 4, 0.03), standard(seatColor, { roughness: 0.65 }));
    back.position.set(0, 0.78, -0.37);
    back.castShadow = true;
    const legGeo = new THREE.CylinderGeometry(0.035, 0.03, 0.46, 10);
    for (const [lx, lz] of [[-0.22, 0.17], [0.22, 0.17], [-0.22, -0.3], [0.22, -0.3]] as const) {
      const leg = new THREE.Mesh(legGeo, wood);
      leg.position.set(lx, 0.23, lz);
      leg.castShadow = true;
      group.add(leg);
    }
    group.add(seat, back);
    return group;
  }

  private buildBackDecor() {
    // dried flower bundles and shelves near windows
    for (const x of [-1.8, 1.8]) {
      const flower = this.makeHangingFlowers(x);
      this.scene.add(flower);
    }
    // hanging planters from above
    this.scene.add(this.makeHangingPlant(-6.7, 4.5, -4.2));
    this.scene.add(this.makeHangingPlant(6.7, 4.5, -4.2));
  }

  private buildPlants() {
    const bigPlant = this.paint.furnishing('monstera', this.makeMonstera(1.2), 2.88);
    bigPlant.position.set(-6.75, 0, -2.7);
    this.scene.add(bigPlant);
    this.addContactShadow(-6.75, -2.7, 1.15, 1.15, 0.22);
    const cherry = this.paint.furnishing('blossoms', this.makeCherryPot(), 2.68);
    cherry.position.set(4.65, 0, -4.4);
    cherry.scale.setScalar(1.02);
    this.scene.add(cherry);
    this.addContactShadow(4.65, -4.4, 0.75, 0.75, 0.18);

    // small fruit crates / bags on floor
    const crate = new THREE.Group();
    const crateBox = new THREE.Mesh(new RoundedBoxGeometry(0.7, 0.42, 0.5, 3, 0.03), standard('#dba47c', { roughness: 0.8 }));
    crateBox.position.y = 0.21;
    crateBox.castShadow = true;
    const crateLabel = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.16), new THREE.MeshBasicMaterial({ map: this.makeLabelTexture('蜜 桃'), transparent: true }));
    crateLabel.position.set(0, 0.25, 0.252);
    crate.add(crateBox, crateLabel);
    crate.position.set(-4.45, 0, -3.3);
    crate.rotation.y = 0.2;
    this.scene.add(crate);
    this.addContactShadow(-4.45, -3.3, 0.82, 0.62, 0.18);
    // rounded jars of fruit on top
    for (let i = 0; i < 3; i++) {
      const peach = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 12), standard('#ffab9a', { roughness: 0.55 }));
      peach.position.set(-4.65 + i * 0.2, 0.52, -3.35);
      this.scene.add(peach);
    }
    const bag = new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.6, 0.3, 3, 0.08), standard('#fff0e5', { roughness: 0.9 }));
    bag.position.set(-4.85, 0.32, -4.0);
    bag.rotation.y = -0.2;
    this.scene.add(bag);
    this.addContactShadow(-4.85, -4.0, 0.62, 0.42, 0.16);
  }

  private buildStringLights() {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= 18; i++) {
      const t = i / 18;
      const x = -7.4 + t * 14.8;
      const y = 5.62 - Math.sin(t * Math.PI) * 0.28;
      points.push(new THREE.Vector3(x, y, -5.0));
    }
    const curve = new THREE.CatmullRomCurve3(points);
    const cord = new THREE.Mesh(new THREE.TubeGeometry(curve, 64, 0.012, 5, false), standard('#a9867a', { roughness: 0.8 }));
    this.scene.add(cord);
    for (let i = 0; i <= 18; i++) {
      const t = i / 18;
      const p = curve.getPoint(t);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffe3b5', toneMapped: false }));
      bulb.position.copy(p).add(new THREE.Vector3(0, -0.045, 0.03));
      this.scene.add(bulb);
      if (i % 2 === 0) {
        const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTexture('rgba(255,210,150,0.4)', 'rgba(255,210,150,0)', 64), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.5 }));
        glow.position.copy(bulb.position);
        glow.scale.setScalar(0.55);
        this.scene.add(glow);
      }
    }
    // second smaller string over windows? no, keep clean
  }

  private buildBunting() {
    const flagColors = ['#ff8fb2', '#7fd9bb', '#ffd06e', '#b49ce4', '#84c8e8'];
    const flagShape = new THREE.Shape();
    flagShape.moveTo(-0.16, 0);
    flagShape.lineTo(0.16, 0);
    flagShape.lineTo(0, -0.32);
    flagShape.closePath();
    const flagGeo = new THREE.ShapeGeometry(flagShape);
    for (const side of [-1, 1] as const) {
      const x0 = side * 2.1;
      const x1 = side * 6.6;
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(x0, 5.12, -4.72),
        new THREE.Vector3((x0 + x1) / 2, 4.6, -4.72),
        new THREE.Vector3(x1, 5.12, -4.72),
      );
      const cord = new THREE.Mesh(new THREE.TubeGeometry(curve, 30, 0.01, 4, false), standard('#b18b7c', { roughness: 0.8 }));
      this.scene.add(cord);
      for (let i = 0; i < 11; i++) {
        const t = 0.08 + (i / 10) * 0.84;
        const p = curve.getPoint(t);
        const flag = new THREE.Mesh(flagGeo, standard(flagColors[(i + (side > 0 ? 2 : 0)) % flagColors.length], { roughness: 0.8, side: THREE.DoubleSide }));
        flag.position.copy(p);
        flag.rotation.z = Math.sin(t * Math.PI) * side * 0.04;
        flag.castShadow = false;
        this.scene.add(flag);
      }
    }
  }

  // ───────────────────────────── prop builders

  private makeJar(content: string, height: number): THREE.Group {
    const jar = new THREE.Group();
    const glass = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.1, height, 16, 1, true),
      new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.1, transparent: true, opacity: 0.2, transmission: 0.4, side: THREE.DoubleSide }),
    );
    glass.position.y = height / 2;
    const contents = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.085, height * 0.7, 16), standard(content, { roughness: 0.85 }));
    contents.position.y = height * 0.4;
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.115, 0.045, 16), standard('#f5dfc2', { roughness: 0.55 }));
    lid.position.y = height + 0.015;
    const label = new THREE.Mesh(new THREE.PlaneGeometry(0.13, 0.06), new THREE.MeshBasicMaterial({ map: this.makeLabelTexture(content === '#ffb4c7' ? 'PEACH' : content === '#b8e9d6' ? 'MINT' : 'SUGAR'), transparent: true }));
    label.position.set(0, height * 0.52, 0.105);
    jar.add(glass, contents, lid, label);
    return jar;
  }

  private makeLabelTexture(text: string): THREE.CanvasTexture {
    return makeCanvasTexture(256, 128, (ctx, w, h) => {
      ctx.fillStyle = '#fff7e8';
      ctx.beginPath();
      ctx.roundRect(10, 16, w - 20, h - 32, 16);
      ctx.fill();
      ctx.strokeStyle = '#d8ae9b';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#9d6c71';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '600 36px "ZCOOL KuaiLe", "Noto Sans SC", sans-serif';
      ctx.fillText(text, w / 2, h / 2 + 2);
    });
  }

  private makeCake(color: string): THREE.Group {
    const group = new THREE.Group();
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.025, 20), standard('#fff5ea', { roughness: 0.4 }));
    const cake = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.145, 0.17, 20), standard(color, { roughness: 0.75 }));
    cake.position.y = 0.1;
    const frosting = new THREE.Mesh(new THREE.CylinderGeometry(0.135, 0.135, 0.04, 20), standard('#fff6e9', { roughness: 0.55 }));
    frosting.position.y = 0.195;
    const berry = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 10), standard('#e7677d', { roughness: 0.4 }));
    berry.position.y = 0.25;
    group.add(plate, cake, frosting, berry);
    return group;
  }

  private makeLuckyCat(): THREE.Group {
    const group = new THREE.Group();
    const white = standard('#fff8ef', { roughness: 0.55 });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.18, 20, 16), white);
    body.scale.set(1, 1.25, 0.9);
    body.position.y = 0.22;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 20, 16), white);
    head.position.y = 0.47;
    const earGeo = new THREE.ConeGeometry(0.065, 0.12, 4);
    const earL = new THREE.Mesh(earGeo, standard('#fff8ef', { roughness: 0.55 }));
    earL.position.set(-0.1, 0.59, 0);
    earL.rotation.z = -0.2;
    const earR = earL.clone();
    earR.position.x = 0.1;
    earR.rotation.z = 0.2;
    const eyeMat = new THREE.MeshBasicMaterial({ color: '#5d414a' });
    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 8), eyeMat);
      eye.position.set(s * 0.055, 0.49, 0.14);
      group.add(eye);
    }
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.018, 6, 20), standard('#ffcf78', { roughness: 0.3, metalness: 0.35 }));
    collar.rotation.x = Math.PI / 2;
    collar.position.y = 0.37;
    const bell = new THREE.Mesh(new THREE.SphereGeometry(0.026, 10, 8), standard('#ffd16f', { roughness: 0.3, metalness: 0.4 }));
    bell.position.set(0, 0.34, 0.12);
    const paw = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.14, 6, 10), white);
    paw.position.set(0.2, 0.44, 0.11);
    paw.rotation.z = -0.8;
    group.add(body, head, earL, earR, collar, bell, paw);
    group.scale.setScalar(0.9);
    return group;
  }

  private makeWindowsillPlant(x: number, y: number, z: number, scale: number): THREE.Group {
    const group = new THREE.Group();
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.075, 0.16, 12), standard('#ffd4dc', { roughness: 0.65 }));
    pot.position.y = 0.08;
    group.add(pot);
    const rand = mulberry(Math.floor(x * 1000));
    for (let i = 0; i < 7; i++) {
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), standard(i % 2 ? '#8cc9a7' : '#b3dfbc', { roughness: 0.8 }));
      const a = rand() * Math.PI * 2;
      leaf.position.set(Math.cos(a) * 0.09, 0.2 + rand() * 0.16, Math.sin(a) * 0.06);
      leaf.scale.set(1, 0.45, 1.4);
      leaf.rotation.z = Math.cos(a) * 0.6;
      group.add(leaf);
    }
    group.position.set(x, y, z);
    group.scale.setScalar(scale);
    return group;
  }

  private makePosterTexture(): THREE.CanvasTexture {
    return makeCanvasTexture(512, 384, (ctx, w, h) => {
      ctx.fillStyle = '#fff3e4';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ffccd9';
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.54, 90, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#b6e5d4';
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.27, 34, 16, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#7d5b62';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.46);
      ctx.lineTo(w * 0.5, h * 0.86);
      ctx.stroke();
      ctx.fillStyle = '#a56d78';
      ctx.textAlign = 'center';
      ctx.font = '600 42px "ZCOOL KuaiLe", "Noto Sans SC", sans-serif';
      ctx.fillText('慢慢喝，甜甜过', w * 0.5, h * 0.93);
      ctx.font = '700 20px "Baloo 2", sans-serif';
      ctx.fillStyle = '#c7999f';
      ctx.fillText('HAVE A SWEET DAY', w * 0.5, h * 0.7);
    });
  }

  private makeMonstera(scale: number): THREE.Group {
    const group = new THREE.Group();
    const potMat = standard('#ffbccb', { roughness: 0.62 });
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.37, 0.62, 28), potMat);
    pot.position.y = 0.31;
    pot.castShadow = true;
    const potRim = new THREE.Mesh(new THREE.CylinderGeometry(0.54, 0.54, 0.1, 28), standard('#fff2e4', { roughness: 0.55 }));
    potRim.position.y = 0.62;
    potRim.castShadow = true;
    const potBand = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.48, 0.1, 28), standard('#94ddc3', { roughness: 0.6 }));
    potBand.position.y = 0.48;
    const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.03, 24), standard('#8a5c4c', { roughness: 1 }));
    soil.position.y = 0.655;
    group.add(pot, potRim, potBand, soil);

    // tiny face on the pot
    const faceMat = new THREE.MeshBasicMaterial({ color: '#7c4a55' });
    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.026, 10, 8), faceMat);
      eye.position.set(s * 0.11, 0.36, 0.405);
      eye.scale.y = 1.2;
      group.add(eye);
      const cheek = new THREE.Mesh(new THREE.CircleGeometry(0.045, 12), new THREE.MeshBasicMaterial({ color: '#ff7896', transparent: true, opacity: 0.55 }));
      cheek.position.set(s * 0.2, 0.31, 0.39);
      cheek.rotation.x = -0.3;
      group.add(cheek);
    }
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.009, 6, 18, Math.PI), faceMat);
    smile.position.set(0, 0.29, 0.42);
    smile.rotation.z = Math.PI;
    group.add(smile);

    const rand = mulberry(77);
    const leafGeo = monsteraLeafGeometry();
    const veinMat = standard('#4f8a63', { roughness: 0.9 });
    const tones = ['#3f9d6e', '#61b884', '#2f8a60', '#7cc899', '#4aa978'];
    const stems = 10;
    for (let i = 0; i < stems; i++) {
      const a = (i / stems) * Math.PI * 2 + rand() * 0.4;
      const reach = 0.45 + rand() * 0.75;
      const height = 1.0 + rand() * 1.15;
      const end = new THREE.Vector3(Math.cos(a) * reach, height, Math.sin(a) * reach);
      const start = new THREE.Vector3(0, 0.62, 0);
      const mid = new THREE.Vector3(Math.cos(a) * reach * 0.26, height * 0.55, Math.sin(a) * reach * 0.26);
      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const stem = new THREE.Mesh(new THREE.TubeGeometry(curve, 18, 0.02, 6, false), standard('#4f9a6d', { roughness: 0.85 }));
      stem.castShadow = true;
      group.add(stem);

      const leafGroup = new THREE.Group();
      const leaf = new THREE.Mesh(leafGeo, standard(tones[i % tones.length], { roughness: 0.68, side: THREE.DoubleSide }));
      leaf.castShadow = true;
      leaf.scale.setScalar(0.56 + rand() * 0.34);
      leafGroup.add(leaf);

      const vein = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.013, 0.96, 5), veinMat);
      vein.position.set(0, 0.48, 0.006);
      leafGroup.add(vein);
      const sideVein = (x1: number, y1: number, x2: number, y2: number) => {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const v = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0045, Math.hypot(dx, dy), 4), veinMat);
        v.position.set((x1 + x2) / 2, (y1 + y2) / 2, 0.006);
        v.rotation.z = -Math.atan2(dx, dy);
        leafGroup.add(v);
      };
      for (let j = 0; j < 3; j++) {
        const y = 0.28 + j * 0.2;
        sideVein(0.01, y, 0.24, y + 0.1);
        sideVein(-0.01, y, -0.24, y + 0.1);
      }
      leafGroup.position.copy(end);
      leafGroup.rotation.set(-0.18 - rand() * 0.35, (rand() - 0.5) * 1.1, (rand() - 0.5) * 0.6);
      group.add(leafGroup);
    }

    // baby leaves around the soil
    for (let i = 0; i < 3; i++) {
      const a = rand() * Math.PI * 2;
      const baby = new THREE.Mesh(leafGeo, standard(tones[(i + 2) % tones.length], { roughness: 0.7, side: THREE.DoubleSide }));
      baby.scale.setScalar(0.24);
      baby.position.set(Math.cos(a) * 0.2, 0.69, Math.sin(a) * 0.2);
      baby.rotation.set(-0.5, a, 0.4);
      group.add(baby);
    }
    group.scale.setScalar(scale);
    return group;
  }

  private makeCherryPot(): THREE.Group {
    const group = new THREE.Group();
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.23, 0.55, 22), standard('#ffe3cf', { roughness: 0.7 }));
    pot.position.y = 0.28;
    pot.castShadow = true;
    const potRim = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.06, 22), standard('#ff9fbb', { roughness: 0.6 }));
    potRim.position.y = 0.55;
    const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.025, 20), standard('#8a5c4c', { roughness: 1 }));
    soil.position.y = 0.57;
    const trunkMat = standard('#9b6a55', { roughness: 0.9 });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.085, 1.1, 8), trunkMat);
    trunk.position.y = 1.1;
    trunk.rotation.z = 0.1;
    trunk.castShadow = true;
    group.add(pot, potRim, soil, trunk);
    const rand = mulberry(1337);
    const branchTips: THREE.Vector3[] = [];
    for (let i = 0; i < 6; i++) {
      const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.038, 0.7, 6), trunkMat);
      const lean = -0.75 + i * 0.3;
      branch.position.set(-0.2 + i * 0.085, 1.6 + (i % 3) * 0.17, (rand() - 0.5) * 0.18);
      branch.rotation.z = lean;
      branch.rotation.y = i * 0.55;
      group.add(branch);
      branchTips.push(new THREE.Vector3(-0.2 + i * 0.085 + Math.sin(lean) * -0.35, 1.9 + (i % 3) * 0.17, (rand() - 0.5) * 0.18));
    }
    const blossomTones = ['#ffb3c8', '#ffd1de', '#ffe6ee', '#ff9fbc'];
    const leafMat = standard('#82c39c', { roughness: 0.8, side: THREE.DoubleSide });
    for (let i = 0; i < 22; i++) {
      const tip = branchTips[i % branchTips.length];
      const bx = tip.x + (rand() - 0.5) * 0.55;
      const by = tip.y + rand() * 0.5;
      const bz = tip.z + (rand() - 0.5) * 0.4;
      const cluster = new THREE.Mesh(
        new THREE.SphereGeometry(0.08 + rand() * 0.06, 8, 6),
        standard(blossomTones[i % blossomTones.length], { roughness: 0.75 }),
      );
      cluster.position.set(bx, by, bz);
      cluster.scale.set(1, 0.78, 1);
      group.add(cluster);
      const highlight = new THREE.Mesh(new THREE.SphereGeometry(0.032, 6, 5), standard('#fff2f4', { roughness: 0.6 }));
      highlight.position.set(bx + 0.02, by + 0.045, bz + 0.055);
      group.add(highlight);
      if (i % 3 === 0) {
        const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.11, 6, 4), leafMat);
        leaf.scale.set(1, 0.12, 0.55);
        leaf.position.set(bx + (rand() - 0.5) * 0.2, by - 0.07, bz + 0.06);
        leaf.rotation.z = rand() * 1.2;
        group.add(leaf);
      }
    }
    return group;
  }

  private makeHangingPlant(x: number, y: number, z: number): THREE.Group {
    const group = new THREE.Group();
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.14, 0.25, 16, 1, true), standard('#ffd7d9', { roughness: 0.55, side: THREE.DoubleSide }));
    pot.rotation.x = Math.PI;
    pot.position.y = -0.08;
    group.add(pot);
    // three cords gather into a hook on the ceiling so the pot doesn't float
    const cordMat = standard('#c9a88a', { roughness: 0.9 });
    const ceiling = 6.0 - y;
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const from = new THREE.Vector3(Math.cos(a) * 0.17, 0.04, Math.sin(a) * 0.17);
      const to = new THREE.Vector3(0, 0.5, 0);
      const len = from.distanceTo(to);
      const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, len, 4), cordMat);
      cord.position.copy(from).lerp(to, 0.5);
      cord.lookAt(to);
      cord.rotateX(Math.PI / 2);
      group.add(cord);
    }
    const drop = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, ceiling - 0.5, 4), cordMat);
    drop.position.y = 0.5 + (ceiling - 0.5) / 2;
    group.add(drop);
    const rand = mulberry(Math.floor(x * 44) + 7);
    for (let i = 0; i < 7; i++) {
      const a = rand() * Math.PI * 2;
      const len = 0.4 + rand() * 0.75;
      const start = new THREE.Vector3(0, -0.15, 0);
      const end = new THREE.Vector3(Math.cos(a) * 0.24, -0.25 - len, Math.sin(a) * 0.15);
      const curve = new THREE.QuadraticBezierCurve3(start, new THREE.Vector3(Math.cos(a) * 0.18, -0.5, Math.sin(a) * 0.1), end);
      const stem = new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.008, 4, false), standard('#6ea47b', { roughness: 0.85 }));
      group.add(stem);
      for (let j = 0; j < 4; j++) {
        const p = curve.getPoint(0.35 + j * 0.18);
        const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.055, 7, 5), standard(j % 2 ? '#91cba2' : '#addab3', { roughness: 0.8 }));
        leaf.scale.set(1, 0.18, 0.7);
        leaf.position.copy(p);
        leaf.rotation.z = rand();
        group.add(leaf);
      }
    }
    group.position.set(x, y, z);
    return group;
  }

  private makeHangingFlowers(x: number): THREE.Group {
    const group = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const root = new THREE.Vector3(0, 0, 0);
      const end = new THREE.Vector3((i - 1) * 0.16, -0.55 - i * 0.08, 0.03);
      const curve = new THREE.QuadraticBezierCurve3(root, new THREE.Vector3((i - 1) * 0.1, -0.3, 0), end);
      const stem = new THREE.Mesh(new THREE.TubeGeometry(curve, 10, 0.006, 4, false), standard('#9a8a6f', { roughness: 0.9 }));
      group.add(stem);
      for (let j = 0; j < 3; j++) {
        const p = curve.getPoint(0.55 + j * 0.18);
        const bud = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), standard(j % 2 ? '#f6d08f' : '#ffd9e2', { roughness: 0.7 }));
        bud.scale.y = 1.9;
        bud.position.copy(p);
        group.add(bud);
      }
    }
    group.position.set(x, 3.35, -5.0);
    return group;
  }

  private applyUpgradeVisuals() {
    const seatLvl = this.upgradeLevels.seat;
    this.cushionMeshes.forEach((mesh, i) => {
      mesh.visible = seatLvl > 0;
      mesh.scale.y = 1 + seatLvl * 0.15;
      mesh.position.y = 0.73 + seatLvl * 0.012;
      (mesh.material as THREE.MeshStandardMaterial).color.set(i === 1 ? '#ffd2e0' : '#d6f4e7');
    });
    this.cakeMeshes.forEach((cake, i) => {
      cake.visible = i < 4 + this.upgradeLevels.display * 2;
      if (i >= 4) {
        cake.position.set(-0.32 + (i - 4) * 0.21, 0.19, -0.22);
        cake.scale.setScalar(0.58);
      }
    });
    this.trophyGroup.visible = this.upgradeLevels.training > 0;
    this.trophyGroup.scale.setScalar(1 + this.upgradeLevels.training * 0.08);
  }

  private drawSky(ctx: CanvasRenderingContext2D, w: number, h: number, theme: DayTheme) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, theme.skyTop);
    g.addColorStop(0.55, theme.skyBottom);
    g.addColorStop(1, theme.id === 'night' ? '#5b4c74' : '#ffe2e8');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    const rand = mulberry(theme.id.charCodeAt(0) * 91 + 33);
    if (theme.id === 'night') {
      ctx.fillStyle = '#fff8e8';
      for (let i = 0; i < 95; i++) {
        const x = rand() * w;
        const y = rand() * h * 0.65;
        const r = rand() * 1.8 + 0.4;
        ctx.globalAlpha = 0.4 + rand() * 0.6;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(255,242,206,0.9)';
      ctx.beginPath();
      ctx.arc(w * 0.72, h * 0.19, 42, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,237,201,0.18)';
      ctx.beginPath();
      ctx.arc(w * 0.72, h * 0.19, 120, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // sun / glow
      const sunX = theme.id === 'dusk' ? w * 0.28 : w * 0.74;
      const sunY = theme.id === 'dusk' ? h * 0.55 : h * 0.24;
      const glow = ctx.createRadialGradient(sunX, sunY, 8, sunX, sunY, 260);
      glow.addColorStop(0, 'rgba(255,247,216,0.9)');
      glow.addColorStop(0.4, 'rgba(255,239,190,0.28)');
      glow.addColorStop(1, 'rgba(255,239,190,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = theme.id === 'dusk' ? 'rgba(255,218,165,0.85)' : 'rgba(255,250,229,0.8)';
      ctx.beginPath();
      ctx.arc(sunX, sunY, theme.id === 'dusk' ? 62 : 44, 0, Math.PI * 2);
      ctx.fill();
      // clouds
      ctx.filter = 'blur(16px)';
      for (let i = 0; i < 5; i++) {
        const cx = rand() * w;
        const cy = 150 + rand() * 380;
        const rw = 90 + rand() * 120;
        ctx.fillStyle = i % 2 ? 'rgba(255,241,246,0.55)' : 'rgba(255,251,238,0.5)';
        ctx.beginPath();
        ctx.ellipse(cx, cy, rw, 30 + rand() * 30, rand() * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.filter = 'none';
    }

    // distant skyline / trees
    ctx.filter = 'blur(2px)';
    const baseY = h * 0.75;
    ctx.fillStyle = theme.id === 'night' ? 'rgba(50,46,74,0.62)' : 'rgba(226,146,166,0.44)';
    for (let i = 0; i < 12; i++) {
      const bw = 40 + rand() * 80;
      const bh = 60 + rand() * 160;
      ctx.fillRect(i * 90 - 20, baseY - bh, bw, bh + 100);
    }
    ctx.filter = 'none';
    if (theme.id === 'night') {
      ctx.fillStyle = 'rgba(255,223,158,0.8)';
      for (let i = 0; i < 35; i++) {
        ctx.fillRect(rand() * w, baseY - rand() * 130, 4, 6);
      }
    }

    // cherry trees
    const treeBase = h * 0.83;
    const blossomColors = theme.id === 'night' ? ['#bc8fa9', '#997d94'] : ['#ffc6d7', '#ffdfe8', '#ffb7cd'];
    for (const side of [0, 1]) {
      const bx = side === 0 ? w * 0.06 : w * 0.94;
      ctx.strokeStyle = theme.id === 'night' ? '#6f5c6b' : '#9f7c72';
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(bx, treeBase + 80);
      ctx.quadraticCurveTo(bx + (side ? -60 : 60), treeBase - 150, bx + (side ? -150 : 150), treeBase - 300);
      ctx.stroke();
      ctx.lineWidth = 5;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(bx + (side ? -40 : 40) - i * (side ? 6 : -6), treeBase - 80 - i * 40);
        ctx.quadraticCurveTo(bx + (side ? -60 : 60), treeBase - 160 - i * 30, bx + (side ? -110 : 110), treeBase - 210 - i * 35);
        ctx.stroke();
      }
      for (let i = 0; i < 24; i++) {
        ctx.fillStyle = blossomColors[i % blossomColors.length];
        ctx.globalAlpha = 0.95;
        ctx.beginPath();
        ctx.arc(bx + (side ? -1 : 1) * (20 + rand() * 175), treeBase - 170 - rand() * 190, 10 + rand() * 18, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // soft bokeh
    if (theme.id !== 'night') {
      ctx.filter = 'blur(7px)';
      for (let i = 0; i < 18; i++) {
        ctx.fillStyle = i % 2 ? 'rgba(255,224,232,0.28)' : 'rgba(196,244,227,0.22)';
        ctx.beginPath();
        ctx.arc(rand() * w, rand() * h * 0.65, 8 + rand() * 22, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.filter = 'none';
    }

    // glass reflection
    const shine = ctx.createLinearGradient(0, 0, w, h);
    shine.addColorStop(0.28, 'rgba(255,255,255,0)');
    shine.addColorStop(0.34, 'rgba(255,255,255,0.09)');
    shine.addColorStop(0.4, 'rgba(255,255,255,0.02)');
    shine.addColorStop(0.47, 'rgba(255,255,255,0.07)');
    shine.addColorStop(0.55, 'rgba(255,255,255,0)');
    ctx.fillStyle = shine;
    ctx.fillRect(0, 0, w, h);
  }
}

let monsteraLeafGeo: THREE.ShapeGeometry | null = null;

function monsteraLeafGeometry(): THREE.ShapeGeometry {
  if (monsteraLeafGeo) return monsteraLeafGeo;
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.02);
  shape.bezierCurveTo(0.2, 0.12, 0.36, 0.38, 0.3, 0.58);
  shape.lineTo(0.12, 0.52);
  shape.lineTo(0.3, 0.72);
  shape.lineTo(0.11, 0.68);
  shape.lineTo(0.22, 0.86);
  shape.quadraticCurveTo(0.12, 0.98, 0, 1);
  shape.quadraticCurveTo(-0.12, 0.98, -0.22, 0.86);
  shape.lineTo(-0.11, 0.68);
  shape.lineTo(-0.3, 0.72);
  shape.lineTo(-0.12, 0.52);
  shape.lineTo(-0.3, 0.58);
  shape.bezierCurveTo(-0.36, 0.38, -0.2, 0.12, 0, 0.02);
  monsteraLeafGeo = new THREE.ShapeGeometry(shape, 16);
  return monsteraLeafGeo;
}

function mulberry(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
