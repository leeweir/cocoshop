import * as THREE from 'three';
import { guestArtUrl } from '../art/guestArt';
import arrivalsUrl from '../art/guest-arrivals.webp?inline';
import type { CustomerDef } from '../game/types';
import { makeCanvasTexture, paintCoverage, raycastPaint, type PaintCoverage } from './threeUtils';

type Mood = 'neutral' | 'worried' | 'sad' | 'happy';
const COLUMNS = 4;
const ROWS = 2;
const CELL_ASPECT = 432 / 608;
const SOLE_MARGIN = 8 / 608;
// Each row in the embedded strip holds this guest's seated and walking silhouettes.
const ARRIVALS = ['momo', 'kuri', 'yuzu', 'tsukimi', 'usui', 'alan', 'rin'];
const MASK_WIDTH = COLUMNS * 80;
const MASK_HEIGHT = ROWS * 112;
const sittingHeight: Record<string, number> = {
  momo: 1.84, yuzu: 1.72, kuri: 1.78, tsukimi: 1.96, usui: 1.82, alan: 1.86, rin: 1.90,
};

interface Sheet {
  texture?: THREE.Texture;
  /** Keep the off-DOM image alive until its decode callback installs the full texture. */
  pendingImage?: HTMLImageElement;
  retryTimer?: number;
  coverage?: PaintCoverage;
  feet?: number[];
  retry?: () => void;
}

/** The shoes do not generally sit under the center of the drawing, especially mid-stride. */
function shoeCenters(mask: PaintCoverage) {
  const width = mask.width / COLUMNS, height = mask.height / ROWS;
  return Array.from({ length: COLUMNS * ROWS }, (_, cell) => {
    const left = cell % COLUMNS * width, top = Math.floor(cell / COLUMNS) * height;
    let sum = 0, weight = 0;
    for (let y = Math.floor(height * .91); y < height; y++) {
      for (let x = 0; x < width; x++) {
        const alpha = mask.pixels[((top + y) * mask.width + left + x) * 4 + 3];
        sum += alpha * (x + .5);
        weight += alpha;
      }
    }
    return weight > 0 ? sum / weight / width - .5 : 0;
  });
}

export class GuestSheets {
  private readonly sheets = new Map<string, Sheet>();
  private readonly arrivals = new Image();

  constructor() {
    this.arrivals.onload = () => {
      for (const [id, sheet] of this.sheets) this.useArrival(id, sheet);
    };
    this.arrivals.src = arrivalsUrl;
    window.addEventListener('online', this.retryFailed);
  }

  private retryFailed = () => {
    for (const sheet of this.sheets.values()) sheet.retry?.();
  };

  private install(sheet: Sheet, image: HTMLImageElement | HTMLCanvasElement) {
    const coverage = paintCoverage(image, MASK_WIDTH, MASK_HEIGHT);
    const texture = new THREE.Texture(image);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 2;
    texture.needsUpdate = true;
    // Allocate a new GPU texture when switching to a different resolution.
    sheet.texture?.dispose();
    sheet.texture = texture;
    sheet.coverage = coverage;
    sheet.feet = shoeCenters(coverage);
  }

  private useArrival(id: string, sheet: Sheet) {
    if (sheet.texture || !this.arrivals.naturalWidth) return;
    const guest = ARRIVALS.indexOf(id);
    if (guest < 0) return;
    const w = this.arrivals.naturalWidth / 2, h = this.arrivals.naturalHeight / ARRIVALS.length;
    const canvas = document.createElement('canvas');
    canvas.width = w * COLUMNS;
    canvas.height = h * ROWS;
    const ctx = canvas.getContext('2d')!;
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLUMNS; col++) {
        ctx.drawImage(this.arrivals, row * w, guest * h, w, h, col * w, row * h, w, h);
      }
    }
    this.install(sheet, canvas);
  }

  get(id: string): Sheet {
    const cached = this.sheets.get(id);
    if (cached) {
      cached.retry?.();
      return cached;
    }
    const bitmap = new Image();
    const sheet: Sheet = { pendingImage: bitmap };
    this.sheets.set(id, sheet);
    this.useArrival(id, sheet);
    const url = guestArtUrl(id, 'poses');
    const delays = [350, 2800, 9000];
    let attempts = 0;
    const request = () => {
      window.clearTimeout(sheet.retryTimer);
      sheet.retry = undefined;
      bitmap.src = attempts === 0 ? url : url + '?retry=' + attempts;
      attempts++;
    };
    bitmap.onload = () => {
      if (this.sheets.get(id) !== sheet) return;
      this.install(sheet, bitmap);
      sheet.pendingImage = undefined;
      bitmap.onload = bitmap.onerror = null;
    };
    bitmap.onerror = () => {
      if (this.sheets.get(id) !== sheet) return;
      sheet.retry = request;
      if (navigator.onLine && attempts <= delays.length) {
        sheet.retryTimer = window.setTimeout(request, delays[attempts - 1]);
      }
    };
    request();
    return sheet;
  }

  dispose() {
    this.arrivals.onload = null;
    window.removeEventListener('online', this.retryFailed);
    for (const sheet of this.sheets.values()) {
      window.clearTimeout(sheet.retryTimer);
      if (sheet.pendingImage) sheet.pendingImage.onload = sheet.pendingImage.onerror = null;
      sheet.texture?.dispose();
    }
    this.sheets.clear();
  }
}

export class StorybookGuest {
  readonly root = new THREE.Group();
  private readonly paper = new THREE.PlaneGeometry(1, 1, 8, 14);
  private readonly figure: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  private readonly baseUV = this.paper.attributes.uv.clone();
  private readonly ring: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;
  private crown?: THREE.Sprite;
  private readonly seatedHeight: number;
  private mood: Mood = 'neutral';
  private walking = false;
  private seated = false;
  private facing = -1;
  private hovered = false;
  private elapsed = 0;
  private stride = 0;
  private poseTime = 1;
  private blinkIn = 2.1 + Math.random() * 2;
  private blinkLeft = 0;
  private cheerLeft = 0;
  private frame = -1;
  private top = 2;

  constructor(customer: CustomerDef, private sheet: Sheet, vip: boolean) {
    this.seatedHeight = sittingHeight[customer.id] ?? 1.84;
    this.figure = new THREE.Mesh(this.paper, new THREE.MeshBasicMaterial({
      map: sheet.texture ?? null, transparent: true, alphaTest: .075, depthWrite: true, toneMapped: false, vertexColors: true,
    }));
    this.figure.visible = false;
    // A light watercolor wash from the window. The floor contact is drawn under the shoe soles.
    const color = new THREE.BufferAttribute(new Float32Array(this.baseUV.count * 3), 3);
    for (let i = 0; i < color.count; i++) {
      const u = this.baseUV.getX(i), v = this.baseUV.getY(i);
      const shade = (1 - v) * .065 + u * .024;
      color.setXYZ(i, 1 - shade, 1 - shade * .92, 1 - shade * .75);
    }
    this.paper.setAttribute('color', color);
    (this.paper.attributes.position as THREE.BufferAttribute).setUsage(THREE.DynamicDrawUsage);
    this.paper.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 1.05, .14), 1.75);
    raycastPaint(this.figure, () => this.sheet.coverage);
    this.ring = new THREE.Mesh(new THREE.RingGeometry(.38,.44,48), new THREE.MeshBasicMaterial({
      color: '#eeb399', transparent: true, opacity: 0, depthWrite: false,
    }));
    this.ring.rotation.x = -Math.PI / 2;
    this.ring.position.set(0,.018,.14);
    this.ring.raycast = () => {};
    this.root.userData.customer = this;
    this.root.add(this.figure, this.ring);
    if (vip) {
      const map = makeCanvasTexture(72, 64, (ctx) => {
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#865c46';
        ctx.fillStyle = '#f0c278';
        ctx.beginPath();
        ctx.moveTo(7,21); ctx.lineTo(25,33); ctx.lineTo(37,8); ctx.lineTo(49,32);
        ctx.lineTo(66,17); ctx.lineTo(58,53); ctx.quadraticCurveTo(35,59,15,52);
        ctx.closePath(); ctx.fill(); ctx.stroke();
      });
      this.crown = new THREE.Sprite(new THREE.SpriteMaterial({ map, transparent: true, depthWrite: false }));
      this.crown.scale.set(.18,.16,1);
      this.crown.raycast = () => {};
      this.root.add(this.crown);
    }
  }

  faceRight(right: boolean) {
    const facing = right ? 1 : -1;
    if (this.facing !== facing) this.frame = -1;
    this.facing = facing;
  }
  get ready() { return !!this.sheet.texture; }

  setHovered(value: boolean) { this.hovered = value; }
  setWalking(value: boolean) { this.walking = value; }
  setMood(mood: Mood) { this.mood = mood; }
  setLight(color: THREE.Color) { this.figure.material.color.copy(color); }

  setSitting(value: boolean) {
    if (value === this.seated) return;
    this.seated = value;
    this.poseTime = 0;
  }

  cheer() {
    this.mood = 'happy';
    this.cheerLeft = .8;
  }

  sulk() { this.mood = 'sad'; }

  getHeadAnchor(out: THREE.Vector3) {
    return this.root.localToWorld(out.set(0,this.top + .025,.12));
  }

  placeFloorShadow(shadow: THREE.Mesh) {
    shadow.visible = this.figure.visible;
    const height = this.seated ? this.seatedHeight : this.seatedHeight * 1.18;
    const x = (this.sheet.feet?.[this.frame] ?? 0) * height * CELL_ASPECT;
    const flip = this.walking && this.facing < 0 ? -1 : 1;
    this.root.localToWorld(shadow.position.set(x * flip, .019, this.seated ? .375 : .08));
  }

  private showFrame(frame: number) {
    if (frame === this.frame) return;
    this.frame = frame;
    const col = frame % COLUMNS;
    const row = Math.floor(frame / COLUMNS);
    const uv = this.paper.attributes.uv;
    for (let i = 0; i < uv.count; i++) {
      const u = this.baseUV.getX(i);
      const facingU = this.walking && this.facing < 0 ? 1 - u : u;
      uv.setXY(i, (col + facingU) / COLUMNS, (ROWS - row - 1 + this.baseUV.getY(i)) / ROWS);
    }
    uv.needsUpdate = true;
  }

  update(dt: number) {
    this.elapsed += dt;
    this.poseTime += dt;
    this.blinkIn -= dt;
    this.blinkLeft = Math.max(0, this.blinkLeft - dt);
    this.cheerLeft = Math.max(0, this.cheerLeft - dt);
    if (this.blinkIn <= 0) {
      this.blinkLeft = .12;
      this.blinkIn = 2.8 + Math.random() * 2.3;
    }
    if (this.walking) this.stride += dt * 7.2;
    const expression = this.mood === 'happy' ? 1 : this.mood !== 'neutral' ? 2 : this.blinkLeft > 0 ? 3 : 0;
    this.showFrame(this.walking ? 4 + Math.floor(this.stride) % 4 : expression);
    const texture = this.sheet.texture;
    if (texture && this.figure.material.map !== texture) {
      this.figure.material.map = texture;
      this.figure.material.needsUpdate = true;
    }
    this.figure.visible = this.ready;
    const height = this.seated ? this.seatedHeight : this.seatedHeight * 1.18;
    const settle = this.seated ? .065 * Math.exp(-9 * this.poseTime) * Math.cos(14 * this.poseTime) : 0;
    const step = this.walking ? Math.sin(Math.PI * this.stride * .5) ** 2 * .016 : 0;
    const lift = .003 - SOLE_MARGIN * height + settle + step;
    const breathing = this.walking ? 0 : Math.sin(this.elapsed * 1.8) * .0045;
    const smile = this.cheerLeft > 0 ? Math.sin(this.cheerLeft / .8 * Math.PI) * .035 : 0;
    const slouch = this.mood === 'sad' ? .025 : 0;
    const positions = this.paper.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const u = this.baseUV.getX(i), v = this.baseUV.getY(i);
      const x = (u - .5) * height * CELL_ASPECT;
      const y = lift + v * (height + (breathing + smile - slouch) * v);
      // The lower half of a seated drawing hangs in front of the chair rail.
      const z = this.seated ? .095 + .28 * (1 - THREE.MathUtils.smoothstep(v,.06,.48)) : .08;
      positions.setXYZ(i, x, y, z);
    }
    positions.needsUpdate = true;
    this.top = lift + height * .985 + breathing + smile;
    if (this.crown) {
      this.crown.visible = this.figure.visible && this.seated;
      this.crown.position.set(.22, this.top - .10, .16);
    }
    this.ring.material.opacity = THREE.MathUtils.damp(this.ring.material.opacity, this.hovered ? .65 : 0, 10, dt);
  }

  dispose() {
    this.root.removeFromParent();
    this.paper.dispose();
    this.figure.material.dispose();
    this.ring.geometry.dispose();
    this.ring.material.dispose();
    this.crown?.material.map?.dispose();
    this.crown?.material.dispose();
  }
}
