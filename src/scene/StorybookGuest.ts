import * as THREE from 'three';
import { guestArtUrl } from '../art/guestArt';
import type { CustomerDef } from '../game/types';
import { makeCanvasTexture } from './threeUtils';

type Mood = 'neutral' | 'worried' | 'sad' | 'happy';
const COLUMNS = 4;
const ROWS = 2;
const CELL_ASPECT = 432 / 608;
const MASK_WIDTH = COLUMNS * 80;
const MASK_HEIGHT = ROWS * 112;
const sittingHeight: Record<string, number> = {
  momo: 1.84, yuzu: 1.72, kuri: 1.78, tsukimi: 1.96, usui: 1.82, alan: 1.86, rin: 1.90,
};

interface Sheet {
  texture: THREE.Texture;
  coverage?: Uint8ClampedArray;
  retry?: () => void;
}

export class GuestSheets {
  private sheets = new Map<string, Sheet>();

  constructor() {
    window.addEventListener('online', this.retryFailed);
  }

  private retryFailed = () => {
    for (const sheet of this.sheets.values()) sheet.retry?.();
  };

  get(id: string): Sheet {
    const cached = this.sheets.get(id);
    if (cached) {
      cached.retry?.();
      return cached;
    }
    const bitmap = new Image();
    const texture = new THREE.Texture();
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 2;
    const sheet: Sheet = { texture };
    this.sheets.set(id, sheet);
    const url = guestArtUrl(id, 'poses');
    let retried = false;
    bitmap.onload = () => {
      if (this.sheets.get(id) !== sheet) return;
      texture.image = bitmap;
      texture.needsUpdate = true;
      // Ray hits through the space around hair, legs or a tail should pass through.
      const mask = document.createElement('canvas');
      mask.width = MASK_WIDTH;
      mask.height = MASK_HEIGHT;
      const ctx = mask.getContext('2d')!;
      ctx.drawImage(bitmap, 0, 0, mask.width, mask.height);
      sheet.coverage = ctx.getImageData(0, 0, mask.width, mask.height).data;
    };
    bitmap.onerror = () => {
      if (this.sheets.get(id) !== sheet) return;
      if (retried) {
        // Existing guests keep this same texture when a later visit or reconnect retries it.
        sheet.retry = () => {
          sheet.retry = undefined;
          retried = false;
          bitmap.src = url;
        };
      } else {
        retried = true;
        bitmap.src = url + '?retry=1';
      }
    };
    bitmap.src = url;
    return sheet;
  }

  dispose() {
    window.removeEventListener('online', this.retryFailed);
    for (const sheet of this.sheets.values()) sheet.texture.dispose();
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
      map: sheet.texture, transparent: true, alphaTest: .075, depthWrite: true, toneMapped: false,
    }));
    this.figure.visible = false;
    this.figure.castShadow = true;
    (this.paper.attributes.position as THREE.BufferAttribute).setUsage(THREE.DynamicDrawUsage);
    this.paper.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 1.05, .14), 1.75);
    const cast = this.figure.raycast.bind(this.figure);
    this.figure.raycast = (ray, hits) => {
      if (!this.sheet.coverage || !this.figure.visible) return;
      const candidates: THREE.Intersection[] = [];
      cast(ray, candidates);
      for (const hit of candidates) {
        if (!hit.uv) continue;
        const x = THREE.MathUtils.clamp(Math.floor(hit.uv.x * MASK_WIDTH), 0, MASK_WIDTH - 1);
        const y = THREE.MathUtils.clamp(Math.floor((1 - hit.uv.y) * MASK_HEIGHT), 0, MASK_HEIGHT - 1);
        if (this.sheet.coverage[(y * MASK_WIDTH + x) * 4 + 3] > 40) hits.push(hit);
      }
    };
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
  setHovered(value: boolean) { this.hovered = value; }
  setWalking(value: boolean) { this.walking = value; }
  setMood(mood: Mood) { this.mood = mood; }

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
    this.figure.visible = !!this.sheet.texture.image;
    const height = this.seated ? this.seatedHeight : this.seatedHeight * 1.18;
    const settle = this.seated ? .065 * Math.exp(-9 * this.poseTime) * Math.cos(14 * this.poseTime) : 0;
    const lift = this.seated ? .055 + settle : .013 + Math.sin(Math.PI * this.stride * .5) ** 2 * .027;
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
