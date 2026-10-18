import * as THREE from 'three';
import type { CraftStep, DrinkDef, Recipe } from '../game/types';
import { buildCup, disposeCup, type CupBuildResult } from './cupModel';
import { radialTexture, starTexture } from './threeUtils';

const HALO_COLORS: Record<string, [string, string]> = {
  tea: ['rgba(255, 171, 196, 0.4)', 'rgba(255, 171, 196, 0)'],
  milkshake: ['rgba(255, 205, 143, 0.42)', 'rgba(255, 205, 143, 0)'],
  icecream: ['rgba(151, 226, 201, 0.42)', 'rgba(151, 226, 201, 0)'],
};

export class CupPreview {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private holder = new THREE.Group();
  private cupRoot = new THREE.Group();
  private sparkles: THREE.Sprite[] = [];
  private halo: THREE.Sprite;
  private haloCache = new Map<string, THREE.CanvasTexture>();
  private cup: CupBuildResult | null = null;
  private selections: Partial<Recipe> | null = null;
  private drink: DrinkDef | null = null;
  private step: CraftStep = 'assemble';
  private time = 0;
  private shakePulse = 0;
  private active = false;
  readonly canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.86;
    this.camera = new THREE.PerspectiveCamera(31, 1, 0.1, 30);
    this.camera.position.set(0.08, 1.0, 4.3);
    this.camera.lookAt(0, 0.66, 0);

    const hemi = new THREE.HemisphereLight(0xfff6ef, 0xe2b8b7, 0.95);
    this.scene.add(hemi);

    const key = new THREE.DirectionalLight(0xfff1da, 1.7);
    key.position.set(2.4, 4.2, 3.4);
    this.scene.add(key);

    const fill = new THREE.DirectionalLight(0xffa9c8, 0.75);
    fill.position.set(-3.2, 2.2, 2.2);
    this.scene.add(fill);

    const rim = new THREE.DirectionalLight(0xb2f2dc, 0.55);
    rim.position.set(0, 2.5, -3.5);
    this.scene.add(rim);

    this.buildPedestal();
    this.buildSparkles();
    this.halo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: this.haloTexture('tea'),
        transparent: true,
        depthWrite: false,
      }),
    );
    this.halo.position.set(0, 0.7, -1.5);
    this.halo.scale.set(2.7, 2.7, 1);
    this.scene.add(this.halo);
    this.scene.add(this.holder);
    this.holder.add(this.cupRoot);
  }

  private haloTexture(category: string): THREE.CanvasTexture {
    const cached = this.haloCache.get(category);
    if (cached) return cached;
    const [inner, outer] = HALO_COLORS[category] ?? HALO_COLORS.tea;
    const tex = radialTexture(inner, outer, 256);
    this.haloCache.set(category, tex);
    return tex;
  }

  private cupCategory(): keyof typeof HALO_COLORS {
    return (this.drink?.category ?? 'tea') as keyof typeof HALO_COLORS;
  }

  private targetHeight(): number {
    const cat = this.cupCategory();
    if (cat === 'milkshake') return 2.08;
    if (cat === 'icecream') return 1.9;
    return this.step === 'ready' ? 2.16 : 1.55;
  }

  private buildPedestal() {
    const group = new THREE.Group();
    const baseMat = new THREE.MeshStandardMaterial({ color: '#ffd7e3', roughness: 0.55 });
    const trimMat = new THREE.MeshStandardMaterial({ color: '#fff1e2', roughness: 0.45 });
    const mintMat = new THREE.MeshStandardMaterial({ color: '#bceadd', roughness: 0.5 });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.86, 0.98, 0.12, 64), baseMat);
    base.position.y = -0.19;
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.86, 0.075, 64), trimMat);
    top.position.y = -0.095;
    const stripe = new THREE.Mesh(new THREE.TorusGeometry(0.855, 0.018, 8, 64), mintMat);
    stripe.rotation.x = Math.PI / 2;
    stripe.position.y = -0.14;
    const blob = new THREE.Mesh(new THREE.CircleGeometry(0.55, 48), new THREE.MeshBasicMaterial({ color: 0x6f4654, transparent: true, opacity: 0.1 }));
    blob.rotation.x = -Math.PI / 2;
    blob.position.y = -0.052;
    group.add(base, top, stripe, blob);
    this.scene.add(group);
  }

  private buildSparkles() {
    const tex = starTexture('#ffe4a1');
    for (let i = 0; i < 5; i++) {
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0 }));
      sprite.scale.setScalar(0.12 + i * 0.02);
      this.scene.add(sprite);
      this.sparkles.push(sprite);
    }
  }

  setCup(selections: Partial<Recipe>, drink: DrinkDef, step: CraftStep) {
    this.selections = { ...selections };
    this.drink = drink;
    const changed = this.step !== step;
    this.step = step;
    this.rebuild();
    this.applyHalo();
    if (changed) this.resize();
    if (changed && step === 'shake') this.pulse(0.6);
    if (changed && step === 'ready') this.time = 0;
  }

  private applyHalo() {
    const category = this.cupCategory();
    const mat = this.halo.material as THREE.SpriteMaterial;
    mat.map = this.haloTexture(category);
    mat.needsUpdate = true;
    const h = this.targetHeight();
    this.halo.position.set(0, h * 0.44, -1.5);
    this.halo.scale.set(h * 1.45, h * 1.45, 1);
  }

  private rebuild() {
    if (!this.selections || !this.drink) return;
    if (this.cup) {
      this.cupRoot.remove(this.cup.group);
      disposeCup(this.cup.group);
    }
    const category = this.drink.category ?? 'tea';
    const fillRatio = category === 'tea' ? (this.step === 'assemble' ? 0.82 : 0.88) : 0.86;
    const cup = buildCup({
      drinkId: this.drink.id,
      selections: this.selections,
      fillRatio,
      withLid: category === 'tea' && this.step === 'ready',
      scale: this.selections.size === 'large' ? 1.02 : category === 'icecream' ? 0.9 : 0.95,
    });
    this.cup = cup;
    cup.group.position.y = 0;
    this.cupRoot.add(cup.group);
  }

  pulse(amount = 1) {
    this.shakePulse = Math.min(1.2, this.shakePulse + amount);
  }

  setActive(value: boolean) {
    this.active = value;
    if (value) {
      this.time = 0;
      this.resize();
    }
  }

  dispose() {
    this.active = false;
    if (this.cup) {
      this.cupRoot.remove(this.cup.group);
      disposeCup(this.cup.group);
      this.cup = null;
    }
    for (const sprite of this.sparkles) {
      this.scene.remove(sprite);
      const material = sprite.material as THREE.SpriteMaterial;
      material.map?.dispose();
      material.dispose();
    }
    this.sparkles = [];
    (this.halo.material as THREE.SpriteMaterial).dispose();
    for (const texture of this.haloCache.values()) texture.dispose();
    this.haloCache.clear();
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials) material.dispose();
      }
    });
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }

  resize() {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    const w = Math.max(200, Math.floor(rect.width));
    const h = Math.max(120, Math.floor(rect.height));
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.frameCamera();
    this.applyHalo();
  }

  private frameCamera() {
    const targetH = this.targetHeight() * (this.selections?.size === 'large' ? 1.12 : 1);
    // Wide, short preview stages (mobile) need extra headroom for the pedestal.
    const heightFactor = this.camera.aspect > 1.8 ? 1.45 : 1.24;
    const viewH = targetH * heightFactor;
    const distance = viewH / (2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov) / 2));
    this.camera.position.set(0.08, targetH * 0.56, Math.max(2.6, distance));
    this.camera.lookAt(0, targetH * 0.45, 0);
    this.holder.position.y = 0;
  }

  tick(dt: number) {
    if (!this.active) return;
    this.time += dt;
    const t = this.time;
    this.shakePulse = Math.max(0, this.shakePulse - dt * 1.6);
    const shakeAmp = this.shakePulse * 0.08 + (this.step === 'shake' ? 0.018 : 0);
    this.cupRoot.rotation.z = Math.sin(t * 38) * shakeAmp;
    this.cupRoot.rotation.x = Math.cos(t * 31) * shakeAmp * 0.6;
    this.cupRoot.position.x = Math.sin(t * 44) * shakeAmp * 0.3;
    this.holder.rotation.y = Math.sin(t * 0.5) * 0.11 - 0.18;

    const float = Math.sin(t * 1.5) * 0.015;
    this.holder.position.y = float;

    if (this.cup) {
      if (this.cupCategory() === 'tea') {
        this.cup.boba.rotation.y += dt * (this.step === 'shake' ? 3.4 : 0.25);
      }
      const children = this.cup.steamGroup.children as THREE.Sprite[];
      children.forEach((s, i) => {
        const p = (t * 0.35 + i * 0.24) % 1;
        s.position.y = 1.55 + p * 0.95;
        s.position.x = (i - 1.5) * 0.11 + Math.sin(t * 0.9 + i) * 0.08;
        s.position.z = 0.05;
        const mat = s.material as THREE.SpriteMaterial;
        mat.opacity = 0.22 * Math.sin(p * Math.PI);
        s.scale.setScalar(0.28 + p * 0.3);
      });
    }

    const showSparkles = this.step === 'ready';
    this.sparkles.forEach((s, i) => {
      const a = t * 0.55 + (i / this.sparkles.length) * Math.PI * 2;
      const r = 0.95 + Math.sin(t * 0.8 + i) * 0.1;
      s.position.set(Math.cos(a) * r, 1.15 + Math.sin(t * 1.1 + i * 1.7) * 0.5, Math.sin(a) * r * 0.4);
      const mat = s.material as THREE.SpriteMaterial;
      mat.opacity += ((showSparkles ? 0.5 + Math.sin(t * 2 + i) * 0.25 : 0) - mat.opacity) * Math.min(1, dt * 4);
      s.scale.setScalar((0.1 + (i % 3) * 0.035) * (1 + Math.sin(t * 3 + i) * 0.18));
    });

    this.renderer.render(this.scene, this.camera);
  }
}
