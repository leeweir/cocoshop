import * as THREE from 'three';
import type { CraftSelections, DrinkDef, Recipe } from '../game/types';
import { DRINKS_MAP, FLAVORS_MAP, MILKS_MAP, TEAS_MAP } from '../game/data';
import { makeCanvasTexture } from './threeUtils';

function color(hex: string): THREE.Color {
  return new THREE.Color(hex);
}

export function mixLiquidColor(s: Partial<Recipe>): THREE.Color {
  const base = new THREE.Color('#f5f0e7');
  let result = base.clone();
  if (s.tea && s.tea !== 'none') result = color(TEAS_MAP[s.tea].color);
  else if (s.milk && s.milk === 'coconut') result = color('#f1ebd9');
  if (s.milk === 'fresh') {
    if (s.tea === 'none' || !s.tea) result = color('#fff5e7');
    else result.lerp(color('#fff1e1'), 0.3);
  } else if (s.milk === 'coconut') {
    result.lerp(color('#f5eddc'), 0.22);
  }
  if (s.flavor && s.flavor !== 'none') {
    const f = color(FLAVORS_MAP[s.flavor].color);
    result.lerp(f, s.flavor === 'brownsugar' ? 0.62 : 0.5);
  }
  result.offsetHSL(0, 0.1, -0.045);
  return result;
}

const sleeveCache = new Map<string, THREE.CanvasTexture>();
let strawTexture: THREE.CanvasTexture | null = null;
let candyStrawTexture: THREE.CanvasTexture | null = null;
let steamTexture: THREE.CanvasTexture | null = null;
let waffleTexture: THREE.CanvasTexture | null = null;
let waferTexture: THREE.CanvasTexture | null = null;
const wrapperCache = new Map<string, THREE.CanvasTexture>();

function sleeveTexture(drink?: DrinkDef): THREE.CanvasTexture {
  const key = drink?.id ?? 'house';
  const cached = sleeveCache.get(key);
  if (cached) return cached;
  const tex = makeCanvasTexture(768, 256, (ctx, w, h) => {
    ctx.fillStyle = '#ffd3e1';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ffc033';
    ctx.globalAlpha = 0.22;
    for (let i = 0; i < 7; i++) {
      ctx.beginPath();
      ctx.arc(54 + i * 118, h + 20, 80, Math.PI, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#aee7d4';
    ctx.fillRect(0, 0, w, 26);
    ctx.fillStyle = '#ff9fc0';
    for (let i = 0; i < 18; i++) {
      ctx.beginPath();
      ctx.arc(22 + i * 44, 0, 24, 0, Math.PI);
      ctx.fill();
    }
    ctx.fillStyle = '#7a4d5e';
    ctx.font = '600 54px "ZCOOL KuaiLe", "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('桃 桃 茶 屋', w / 2, h * 0.43);
    ctx.font = '700 22px "Baloo 2", "Noto Sans SC", sans-serif';
    ctx.globalAlpha = 0.65;
    ctx.fillText((drink?.latin ?? 'PEACH & MINT') + '  ·  FRESHLY SHAKEN', w / 2, h * 0.66);
    ctx.globalAlpha = 1;
    ctx.save();
    ctx.translate(95, 128);
    ctx.fillStyle = '#ffab9e';
    ctx.beginPath();
    ctx.arc(-13, 0, 22, 0, Math.PI * 2);
    ctx.arc(13, 0, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#81bd8d';
    ctx.beginPath();
    ctx.ellipse(21, -28, 15, 7, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.translate(w - 96, 128);
    ctx.strokeStyle = '#fff8ef';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-22, -22);
    ctx.lineTo(22, 22);
    ctx.moveTo(22, -22);
    ctx.lineTo(-22, 22);
    ctx.stroke();
    ctx.restore();
  });
  sleeveCache.set(key, tex);
  return tex;
}

function getShakeWrapperTexture(drink?: DrinkDef): THREE.CanvasTexture {
  const key = drink?.id ?? 'house';
  const cached = wrapperCache.get(key);
  if (cached) return cached;
  const tex = makeCanvasTexture(768, 256, (ctx, w, h) => {
    ctx.fillStyle = '#fff5e9';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#b9ecdc';
    ctx.fillRect(0, 0, w, 22);
    ctx.fillStyle = '#ffb7cd';
    for (let i = 0; i < 26; i++) {
      ctx.beginPath();
      ctx.arc(14 + i * 30, 22, 13, 0, Math.PI);
      ctx.fill();
    }
    ctx.fillStyle = '#ffe6ad';
    ctx.globalAlpha = 0.45;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(80 + i * 150, 186, 64, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#f6a9c1';
    for (let i = 0; i < 9; i++) {
      ctx.beginPath();
      ctx.arc(46 + i * 88, 210, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#7a4d5e';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '600 48px "ZCOOL KuaiLe", "PingFang SC", sans-serif';
    ctx.fillText('桃 桃 茶 屋', w / 2, h * 0.42);
    ctx.fillStyle = '#d07d95';
    ctx.font = '700 21px "Baloo 2", "Noto Sans SC", sans-serif';
    ctx.fillText((drink?.latin ?? 'PEACH & MINT') + '  ·  BLENDED SOFTLY', w / 2, h * 0.62);
    ctx.strokeStyle = '#ffc0d4';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 120, h * 0.52);
    ctx.quadraticCurveTo(w / 2, h * 0.48, w / 2 + 120, h * 0.52);
    ctx.stroke();
  });
  wrapperCache.set(key, tex);
  return tex;
}

function getStrawTexture(): THREE.CanvasTexture {
  if (strawTexture) return strawTexture;
  strawTexture = makeCanvasTexture(128, 256, (ctx, w, h) => {
    ctx.fillStyle = '#b9eedd';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#fff9f0';
    ctx.lineWidth = 22;
    for (let y = -w; y < h + w; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y - w);
      ctx.stroke();
    }
  });
  return strawTexture;
}

function getCandyStrawTexture(): THREE.CanvasTexture {
  if (candyStrawTexture) return candyStrawTexture;
  candyStrawTexture = makeCanvasTexture(128, 256, (ctx, w, h) => {
    ctx.fillStyle = '#fff6ec';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#ffa9c4';
    ctx.lineWidth = 26;
    for (let y = -w; y < h + w; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y - w);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 5;
    for (let y = -w; y < h + w; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y + 17);
      ctx.lineTo(w, y - w + 17);
      ctx.stroke();
    }
  });
  return candyStrawTexture;
}

export function getSteamTexture(): THREE.CanvasTexture {
  if (steamTexture) return steamTexture;
  steamTexture = makeCanvasTexture(128, 128, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,0.9)');
    g.addColorStop(0.5, 'rgba(255,247,240,0.35)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
  return steamTexture;
}

function getWaffleTexture(): THREE.CanvasTexture {
  if (waffleTexture) return waffleTexture;
  waffleTexture = makeCanvasTexture(384, 384, (ctx, w, h) => {
    ctx.fillStyle = '#edc086';
    ctx.fillRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, 'rgba(255,240,202,0.5)');
    g.addColorStop(0.5, 'rgba(196,130,72,0.12)');
    g.addColorStop(1, 'rgba(255,248,222,0.4)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#b57d47';
    ctx.lineWidth = 15;
    for (let i = -h; i < w + h; i += 52) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + h, h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(i, h);
      ctx.lineTo(i + h, 0);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(255,233,188,0.55)';
    ctx.lineWidth = 5;
    for (let i = -h; i < w + h; i += 52) {
      ctx.beginPath();
      ctx.moveTo(i + 7, 0);
      ctx.lineTo(i + h + 7, h);
      ctx.stroke();
    }
  });
  return waffleTexture;
}

function getWaferTexture(): THREE.CanvasTexture {
  if (waferTexture) return waferTexture;
  waferTexture = makeCanvasTexture(128, 256, (ctx, w, h) => {
    ctx.fillStyle = '#f0c990';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#c28b54';
    ctx.lineWidth = 8;
    for (let y = 16; y < h; y += 34) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(255,246,220,0.5)';
    ctx.lineWidth = 3;
    for (let y = 20; y < h; y += 34) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  });
  return waferTexture;
}

export interface CupBuildResult {
  group: THREE.Group;
  steamGroup: THREE.Group;
  liquid: THREE.Mesh;
  boba: THREE.Group;
  lid: THREE.Group;
}

export interface CupOptions {
  drinkId?: string;
  selections?: Partial<Recipe>;
  fillRatio?: number;
  withLid?: boolean;
  toastTop?: string;
  scale?: number;
  glassOpacity?: number;
}

export function buildCup(options: CupOptions = {}): CupBuildResult {
  const group = new THREE.Group();
  const selections = options.selections ?? {};
  const drink = options.drinkId ? DRINKS_MAP[options.drinkId] : undefined;
  const category = drink?.category ?? 'tea';
  const large = selections.size === 'large';
  const scale = (options.scale ?? 1) * (large ? 1.1 : 1);
  group.scale.setScalar(scale);

  const result =
    category === 'milkshake'
      ? buildMilkshake(group, drink, selections, options)
      : category === 'icecream'
        ? buildIcecream(group, drink, selections, options)
        : buildTea(group, drink, selections, options);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(category === 'icecream' ? 0.5 : 0.62, 48),
    new THREE.MeshBasicMaterial({ color: 0x8c5f6b, transparent: true, opacity: 0.14, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -0.005;
  shadow.scale.y = 0.55;
  group.add(shadow);

  return result;
}

function buildTea(
  group: THREE.Group,
  drink: DrinkDef | undefined,
  selections: Partial<Recipe>,
  options: CupOptions,
): CupBuildResult {
  const fill = options.fillRatio ?? 0.82;
  const cupHeight = 1.36;
  const topR = 0.5;
  const bottomR = 0.37;

  const liquidColor = mixLiquidColor(selections);
  if (drink && (selections.tea === undefined || selections.milk === undefined)) {
    liquidColor.lerp(color(drink.color), 0.7);
  }
  const liquidMat = new THREE.MeshPhysicalMaterial({
    color: liquidColor,
    roughness: 0.2,
    metalness: 0,
    transparent: true,
    opacity: 0.96,
    clearcoat: 0.45,
    clearcoatRoughness: 0.3,
  });
  const fillH = cupHeight * fill * 0.91;
  const liquidTopR = bottomR + (topR - bottomR) * fill;
  const liquid = new THREE.Mesh(new THREE.CylinderGeometry(liquidTopR * 0.985, bottomR * 0.94, fillH, 48), liquidMat);
  liquid.position.y = 0.035 + fillH / 2;
  liquid.renderOrder = 1;
  liquid.castShadow = true;
  group.add(liquid);

  // glossy drink surface
  const surface = new THREE.Mesh(
    new THREE.CylinderGeometry(liquidTopR * 0.97, liquidTopR * 0.97, 0.022, 48),
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(liquidColor).lerp(new THREE.Color('#fffaf0'), 0.32),
      roughness: 0.22,
      transparent: true,
      opacity: 0.92,
    }),
  );
  surface.position.y = 0.035 + fillH - 0.006;
  group.add(surface);

  if (fillH > 0.2) {
    const topColor = new THREE.Color(liquidColor).lerp(new THREE.Color(drink?.colorTop ?? '#fff4e8'), 0.45);
    const topMat = new THREE.MeshStandardMaterial({
      color: topColor,
      transparent: true,
      opacity: selections.milk === 'none' ? 0.22 : 0.38,
      roughness: 0.3,
    });
    const bandH = Math.min(0.14, fillH * 0.16);
    const topBand = new THREE.Mesh(new THREE.CylinderGeometry(liquidTopR * 0.995, liquidTopR * 0.96, bandH, 48), topMat);
    topBand.position.y = 0.035 + fillH - bandH / 2 + 0.002;
    group.add(topBand);
  }

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xfff8f4,
    roughness: 0.06,
    metalness: 0,
    transparent: true,
    opacity: options.glassOpacity ?? 0.2,
    transmission: 0.24,
    thickness: 0.08,
    clearcoat: 1,
    side: THREE.DoubleSide,
  });
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(topR, bottomR, cupHeight, 64, 1, true), glassMat);
  glass.position.y = cupHeight / 2 + 0.02;
  glass.renderOrder = 3;
  group.add(glass);
  const bottom = new THREE.Mesh(new THREE.CylinderGeometry(bottomR * 0.97, bottomR * 0.93, 0.04, 48), glassMat);
  bottom.position.y = 0.03;
  group.add(bottom);

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(topR - 0.006, 0.019, 8, 64),
    new THREE.MeshStandardMaterial({ color: 0xfff8f1, roughness: 0.22, transparent: true, opacity: 0.95 }),
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = cupHeight + 0.02;
  group.add(rim);

  // tall glass shine so the silhouette reads against pastel backgrounds
  const shineMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, depthWrite: false });
  for (const [x, z, len, tilt, op] of [
    [-0.22, 0.405, 0.72, -0.07, 0.34],
    [0.245, 0.38, 0.5, 0.06, 0.2],
  ] as [number, number, number, number, number][]) {
    const shine = new THREE.Mesh(new THREE.CapsuleGeometry(0.011, len, 4, 8), shineMat.clone());
    (shine.material as THREE.MeshBasicMaterial).opacity = op;
    shine.position.set(x, 0.64 + len / 2, z);
    shine.rotation.z = tilt;
    shine.renderOrder = 4;
    group.add(shine);
  }

  const sleeveMat = new THREE.MeshStandardMaterial({ map: sleeveTexture(drink), roughness: 0.58, side: THREE.DoubleSide });
  const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(topR * 0.93, bottomR * 0.905, 0.4, 64, 1, true), sleeveMat);
  sleeve.position.y = 0.46;
  sleeve.rotation.y = Math.PI * 0.92;
  group.add(sleeve);

  const boba = new THREE.Group();
  const seedRandom = mulberry32(hashString((options.drinkId ?? '') + JSON.stringify(selections)));
  if (selections.topping === 'pearl') {
    const pearlMat = new THREE.MeshPhysicalMaterial({ color: '#4a2d23', roughness: 0.25, metalness: 0.05, clearcoat: 0.8 });
    for (let i = 0; i < 26; i++) {
      const r = 0.045 + seedRandom() * 0.03;
      const angle = seedRandom() * Math.PI * 2;
      const rad = Math.sqrt(seedRandom()) * 0.31;
      const pearl = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 12), pearlMat);
      pearl.position.set(Math.cos(angle) * rad, 0.09 + seedRandom() * 0.19, Math.sin(angle) * rad);
      pearl.scale.y = 0.92;
      boba.add(pearl);
    }
  } else if (selections.topping === 'jelly') {
    const jellyMat = new THREE.MeshPhysicalMaterial({ color: '#f9edcf', roughness: 0.2, transparent: true, opacity: 0.88, clearcoat: 0.7 });
    for (let i = 0; i < 12; i++) {
      const s = 0.07 + seedRandom() * 0.045;
      const angle = seedRandom() * Math.PI * 2;
      const rad = Math.sqrt(seedRandom()) * 0.27;
      const cube = new THREE.Mesh(new THREE.BoxGeometry(s, s * 0.8, s), jellyMat);
      cube.position.set(Math.cos(angle) * rad, 0.1 + seedRandom() * 0.15, Math.sin(angle) * rad);
      cube.rotation.set(seedRandom(), seedRandom(), seedRandom());
      boba.add(cube);
    }
  } else if (selections.topping === 'taro') {
    const taroMat = new THREE.MeshStandardMaterial({ color: '#b795cf', roughness: 0.7 });
    for (let i = 0; i < 10; i++) {
      const s = 0.07 + seedRandom() * 0.055;
      const angle = seedRandom() * Math.PI * 2;
      const rad = Math.sqrt(seedRandom()) * 0.24;
      const blob = new THREE.Mesh(new THREE.SphereGeometry(s, 12, 10), taroMat);
      blob.scale.set(1, 0.7, 1);
      blob.position.set(Math.cos(angle) * rad, 0.11 + seedRandom() * 0.1, Math.sin(angle) * rad);
      boba.add(blob);
    }
  }
  group.add(boba);

  if (selections.ice && selections.ice !== 'hot' && fill > 0.3) {
    const iceMat = new THREE.MeshPhysicalMaterial({
      color: 0xe4f7fb,
      roughness: 0.05,
      transparent: true,
      opacity: 0.62,
      transmission: 0.6,
    });
    const count = selections.ice === 'normal' ? 6 : 3;
    for (let i = 0; i < count; i++) {
      const cube = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.14), iceMat);
      const a = seedRandom() * Math.PI * 2;
      const rad = 0.08 + seedRandom() * 0.22;
      cube.position.set(Math.cos(a) * rad, fillH - 0.1 - seedRandom() * 0.32, Math.sin(a) * rad);
      cube.rotation.set(seedRandom() * 0.7, seedRandom() * 0.7, seedRandom() * 0.7);
      group.add(cube);
    }
  }

  if (selections.topping === 'cheese') {
    const foamMat = new THREE.MeshStandardMaterial({ color: '#fff2da', roughness: 0.55 });
    const foam = new THREE.Mesh(new THREE.CylinderGeometry(topR * 0.92, topR * 0.88, 0.17, 48), foamMat);
    foam.position.y = cupHeight - 0.02;
    group.add(foam);
    for (let i = 0; i < 7; i++) {
      const blob = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 8), foamMat);
      const a = (i / 7) * Math.PI * 2;
      blob.scale.y = 0.45;
      blob.position.set(Math.cos(a) * 0.31, cupHeight + 0.045, Math.sin(a) * 0.31);
      group.add(blob);
    }
  }

  const lid = new THREE.Group();
  const lidMat = new THREE.MeshStandardMaterial({ color: '#fff4e9', roughness: 0.35 });
  const lidTop = new THREE.Mesh(new THREE.CylinderGeometry(topR + 0.025, topR + 0.01, 0.055, 48), lidMat);
  lidTop.position.y = cupHeight + 0.09;
  const lidDome = new THREE.Mesh(new THREE.SphereGeometry(topR * 0.92, 48, 16, 0, Math.PI * 2, 0, Math.PI / 2), lidMat);
  lidDome.scale.y = 0.22;
  lidDome.position.y = cupHeight + 0.11;
  const strawMat = new THREE.MeshStandardMaterial({ map: getStrawTexture(), roughness: 0.45 });
  const straw = new THREE.Mesh(new THREE.CylinderGeometry(0.044, 0.044, 0.72, 16, 1, true), strawMat);
  straw.position.set(0.13, cupHeight + 0.34, -0.03);
  straw.rotation.z = -0.16;
  straw.rotation.x = 0.05;
  lid.add(lidTop, lidDome, straw);
  lid.visible = options.withLid ?? false;
  group.add(lid);

  const steamGroup = new THREE.Group();
  if (selections.ice === 'hot') {
    for (let i = 0; i < 4; i++) {
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: getSteamTexture(), transparent: true, opacity: 0.22, depthWrite: false }),
      );
      sprite.scale.setScalar(0.32 + i * 0.04);
      sprite.position.set((i - 1.5) * 0.11, cupHeight + 0.25 + i * 0.1, 0.02);
      steamGroup.add(sprite);
    }
  }
  group.add(steamGroup);

  return { group, steamGroup, liquid, boba, lid };
}

function buildMilkshake(
  group: THREE.Group,
  drink: DrinkDef | undefined,
  selections: Partial<Recipe>,
  _options: CupOptions,
): CupBuildResult {
  const cupH = 1.16;
  const topR = 0.48;
  const bottomR = 0.345;
  const seedRandom = mulberry32(hashString((drink?.id ?? 'shake') + JSON.stringify(selections)));

  const baseTint = color(drink?.color ?? '#ffb3c9');
  const paperColor = baseTint.clone().lerp(color('#fffaf3'), 0.46);
  const paperMat = new THREE.MeshStandardMaterial({ color: paperColor, roughness: 0.5 });
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(topR, bottomR, cupH, 48), paperMat);
  cup.position.y = cupH / 2 + 0.02;
  cup.castShadow = true;
  group.add(cup);

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(topR - 0.004, 0.022, 8, 64),
    new THREE.MeshStandardMaterial({ color: paperColor.clone().lerp(color('#ffffff'), 0.4), roughness: 0.35 }),
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = cupH + 0.02;
  group.add(rim);

  const wrapper = new THREE.Mesh(
    new THREE.CylinderGeometry(topR * 0.996, topR * 0.93, 0.44, 48, 1, true),
    new THREE.MeshStandardMaterial({ map: getShakeWrapperTexture(drink), roughness: 0.55, side: THREE.DoubleSide }),
  );
  wrapper.position.y = 0.59;
  wrapper.rotation.y = Math.PI * 0.94;
  group.add(wrapper);

  const foil = new THREE.Mesh(
    new THREE.CylinderGeometry(bottomR * 0.94, bottomR * 0.82, 0.12, 32),
    new THREE.MeshStandardMaterial({ color: '#f4d8de', roughness: 0.4, metalness: 0.08 }),
  );
  foil.position.y = 0.07;
  group.add(foil);

  // blended drink visible through the cream ring
  const liquid = new THREE.Mesh(
    new THREE.CylinderGeometry(topR * 0.94, topR * 0.94, 0.05, 40),
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(mixLiquidColor(selections)).lerp(color(drink?.color ?? '#ffb3c9'), 0.24),
      roughness: 0.25,
      transparent: true,
      opacity: 0.95,
    }),
  );
  liquid.position.y = cupH - 0.015;
  group.add(liquid);

  const creamMat = new THREE.MeshStandardMaterial({ color: '#fff7e9', roughness: 0.52 });
  const creamShade = new THREE.MeshStandardMaterial({ color: '#ffeccf', roughness: 0.6 });
  const cream = new THREE.Group();
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(topR * 0.94, topR * 0.9, 0.15, 40), creamMat);
  collar.position.y = cupH + 0.075;
  cream.add(collar);
  const dripCount = 9;
  for (let i = 0; i < dripCount; i++) {
    const a = (i / dripCount) * Math.PI * 2 + 0.15;
    const drip = new THREE.Mesh(new THREE.SphereGeometry(0.052 + seedRandom() * 0.022, 12, 10), creamShade);
    drip.scale.set(1, 1.35 + seedRandom() * 0.5, 1);
    drip.position.set(Math.cos(a) * topR * 0.93, cupH + 0.02 - seedRandom() * 0.055, Math.sin(a) * topR * 0.93);
    cream.add(drip);
  }
  const swirlRings = [0.365, 0.32, 0.265, 0.198, 0.128];
  swirlRings.forEach((r, i) => {
    const blob = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), i === swirlRings.length - 1 ? creamShade : creamMat);
    blob.scale.set(1, 0.56, 1);
    blob.position.set(Math.sin(i * 1.7) * 0.035, cupH + 0.185 + i * 0.076, Math.cos(i * 1.7) * 0.03);
    blob.rotation.y = i * 0.72;
    cream.add(blob);
  });
  const peak = new THREE.Mesh(new THREE.SphereGeometry(0.085, 16, 12), creamMat);
  peak.scale.set(0.92, 1.5, 0.92);
  peak.position.y = cupH + 0.56;
  cream.add(peak);
  group.add(cream);

  // toppings nestled in the cream
  const toppingGroup = new THREE.Group();
  if (selections.topping === 'pearl') {
    const pearlMat = new THREE.MeshPhysicalMaterial({ color: '#4a2d23', roughness: 0.25, clearcoat: 0.9 });
    for (let i = 0; i < 8; i++) {
      const pearl = new THREE.Mesh(new THREE.SphereGeometry(0.05 + seedRandom() * 0.018, 12, 10), pearlMat);
      const a = seedRandom() * Math.PI * 2;
      const r = 0.08 + seedRandom() * 0.22;
      pearl.position.set(Math.cos(a) * r, cupH + 0.25 + seedRandom() * 0.17, Math.sin(a) * r);
      toppingGroup.add(pearl);
    }
  } else if (selections.topping === 'jelly') {
    const jellyMat = new THREE.MeshPhysicalMaterial({ color: '#fbefce', roughness: 0.2, transparent: true, opacity: 0.9, clearcoat: 0.6 });
    for (let i = 0; i < 7; i++) {
      const s = 0.055 + seedRandom() * 0.025;
      const cube = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), jellyMat);
      const a = seedRandom() * Math.PI * 2;
      const r = 0.06 + seedRandom() * 0.22;
      cube.position.set(Math.cos(a) * r, cupH + 0.24 + seedRandom() * 0.22, Math.sin(a) * r);
      cube.rotation.set(seedRandom(), seedRandom(), seedRandom());
      toppingGroup.add(cube);
    }
  } else if (selections.topping === 'taro') {
    const taroMat = new THREE.MeshStandardMaterial({ color: '#b795cf', roughness: 0.68 });
    for (let i = 0; i < 7; i++) {
      const blob = new THREE.Mesh(new THREE.SphereGeometry(0.055 + seedRandom() * 0.03, 12, 10), taroMat);
      blob.scale.y = 0.7;
      const a = seedRandom() * Math.PI * 2;
      const r = 0.05 + seedRandom() * 0.2;
      blob.position.set(Math.cos(a) * r, cupH + 0.22 + seedRandom() * 0.18, Math.sin(a) * r);
      toppingGroup.add(blob);
    }
  }
  group.add(toppingGroup);

  const palette = ['#ff9fc0', '#8fdcc5', '#ffd16f', '#b8a4e3', '#ffb38a'];
  for (let i = 0; i < 18; i++) {
    const a = seedRandom() * Math.PI * 2;
    const r = seedRandom() * 0.3;
    const sprinkle = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.011, 0.05 + seedRandom() * 0.03, 3, 5),
      new THREE.MeshStandardMaterial({ color: palette[Math.floor(seedRandom() * palette.length)], roughness: 0.45 }),
    );
    sprinkle.position.set(Math.cos(a) * r, cupH + 0.2 + seedRandom() * 0.32, Math.sin(a) * r);
    sprinkle.rotation.set(seedRandom() * Math.PI, seedRandom() * Math.PI, seedRandom() * Math.PI);
    group.add(sprinkle);
  }

  const cherry = new THREE.Group();
  const cherryMat = new THREE.MeshPhysicalMaterial({ color: '#e8556d', roughness: 0.18, clearcoat: 1 });
  const fruit = new THREE.Mesh(new THREE.SphereGeometry(0.095, 18, 14), cherryMat);
  fruit.scale.y = 0.94;
  const shine = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 6), new THREE.MeshBasicMaterial({ color: '#fff6ef' }));
  shine.position.set(-0.035, 0.04, 0.075);
  const stem = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.01, 0.04, 0),
        new THREE.Vector3(0.055, 0.13, 0.02),
        new THREE.Vector3(0.0, 0.21, 0.03),
      ]),
      12,
      0.012,
      5,
      false,
    ),
    new THREE.MeshStandardMaterial({ color: '#6f9b5c', roughness: 0.6 }),
  );
  cherry.add(fruit, shine, stem);
  cherry.position.set(0.07, cupH + 0.61, 0.03);
  group.add(cherry);

  const straw = new THREE.Mesh(
    new THREE.CylinderGeometry(0.046, 0.046, 0.8, 16, 1, true),
    new THREE.MeshStandardMaterial({ map: getCandyStrawTexture(), roughness: 0.45 }),
  );
  straw.position.set(0.2, cupH + 0.47, -0.02);
  straw.rotation.z = -0.15;
  group.add(straw);

  const lid = new THREE.Group();
  lid.visible = false;
  group.add(lid);

  const steamGroup = new THREE.Group();
  group.add(steamGroup);

  return { group, steamGroup, liquid, boba: toppingGroup, lid };
}

function buildIcecream(
  group: THREE.Group,
  drink: DrinkDef | undefined,
  selections: Partial<Recipe>,
  _options: CupOptions,
): CupBuildResult {
  const seedRandom = mulberry32(hashString((drink?.id ?? 'gelato') + JSON.stringify(selections)));
  const coneH = 0.98;
  const coneR = 0.345;

  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(coneR, coneH, 40, 6, true),
    new THREE.MeshStandardMaterial({ map: getWaffleTexture(), roughness: 0.68, side: THREE.DoubleSide }),
  );
  cone.rotation.x = Math.PI;
  cone.position.y = coneH / 2 + 0.02;
  cone.castShadow = true;
  group.add(cone);

  const coneRim = new THREE.Mesh(
    new THREE.TorusGeometry(coneR * 0.99, 0.026, 8, 48),
    new THREE.MeshStandardMaterial({ color: '#d9a364', roughness: 0.6 }),
  );
  coneRim.rotation.x = Math.PI / 2;
  coneRim.position.y = coneH + 0.015;
  group.add(coneRim);

  const cuff = new THREE.Mesh(
    new THREE.CylinderGeometry(coneR * 1.01, coneR * 0.9, 0.16, 40, 1, true),
    new THREE.MeshStandardMaterial({ color: '#ffd3df', roughness: 0.55, side: THREE.DoubleSide }),
  );
  cuff.position.y = coneH * 0.84;
  group.add(cuff);

  // little paper holder keeps the cone planted on the pedestal
  const holder = new THREE.Mesh(
    new THREE.CylinderGeometry(0.205, 0.155, 0.26, 36),
    new THREE.MeshStandardMaterial({ color: '#ffd7e1', roughness: 0.55 }),
  );
  holder.position.y = 0.14;
  group.add(holder);
  const holderRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.2, 0.02, 8, 36),
    new THREE.MeshStandardMaterial({ color: '#fff5ea', roughness: 0.4 }),
  );
  holderRim.rotation.x = Math.PI / 2;
  holderRim.position.y = 0.263;
  group.add(holderRim);
  const holderStripe = new THREE.Mesh(
    new THREE.CylinderGeometry(0.185, 0.168, 0.05, 36, 1, true),
    new THREE.MeshStandardMaterial({ color: '#9fe3cf', roughness: 0.5 }),
  );
  holderStripe.position.y = 0.1;
  group.add(holderStripe);
  const holderHeart = new THREE.Mesh(
    new THREE.SphereGeometry(0.025, 10, 8),
    new THREE.MeshStandardMaterial({ color: '#ff8fae', roughness: 0.45 }),
  );
  holderHeart.position.set(0, 0.185, 0.19);
  holderHeart.scale.set(1, 1, 0.45);
  group.add(holderHeart);

  const flavor = selections.flavor && selections.flavor !== 'none' ? FLAVORS_MAP[selections.flavor] : undefined;
  const baseColor = color(drink?.color ?? flavor?.color ?? '#ffc8a8');
  const scoopColors = [
    baseColor.clone().lerp(color('#fff6e7'), 0.04),
    baseColor.clone().lerp(color(drink?.accent ?? flavor?.color ?? '#ff9aa8'), 0.26),
    baseColor.clone().lerp(color(drink?.colorTop ?? '#fff1dc'), 0.5),
  ];
  if (selections.topping === 'cheese' && drink?.id === 'matcha_cone') {
    scoopColors[2] = color('#fff1d7');
  }
  const scoopMat = scoopColors.map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.52 }));
  const scoopGroup = new THREE.Group();
  const scoopSpecs: [number, number, number, number, number, number][] = [
    [0, coneH + 0.1, 0, 0.345, 0.8, 0.98],
    [-0.052, coneH + 0.31, 0.02, 0.295, 0.78, 0.94],
    [0.055, coneH + 0.5, -0.012, 0.24, 0.76, 0.92],
  ];
  scoopSpecs.forEach(([x, y, z, r, sy, sz], i) => {
    const scoop = new THREE.Mesh(new THREE.SphereGeometry(r, 28, 20), scoopMat[i]);
    scoop.position.set(x, y, z);
    scoop.scale.set(1, sy, sz);
    scoop.rotation.y = i * 0.8;
    scoop.castShadow = true;
    scoopGroup.add(scoop);
    const speckCount = 7;
    for (let j = 0; j < speckCount; j++) {
      const a = seedRandom() * Math.PI * 2;
      const th = 0.3 + seedRandom() * 1.1;
      const speck = new THREE.Mesh(
        new THREE.SphereGeometry(0.012 + seedRandom() * 0.01, 6, 5),
        new THREE.MeshStandardMaterial({ color: i === 2 ? '#ffffff' : drink?.accent ?? '#c98a76', roughness: 0.6 }),
      );
      speck.position.set(
        x + Math.cos(a) * Math.sin(th) * r * 0.92,
        y + Math.cos(th) * r * sy * 0.9,
        z + Math.sin(a) * Math.sin(th) * r * sz * 0.92,
      );
      scoopGroup.add(speck);
    }
  });
  group.add(scoopGroup);

  // drizzle ribbon around the middle scoop
  const drizzleColor = drink?.id === 'brownsugar_icecream'
    ? '#69422f'
    : new THREE.Color(drink?.accent ?? flavor?.color ?? '#e2a05f').lerp(color('#7a4e38'), 0.18);
  const drizzleMat = new THREE.MeshStandardMaterial({ color: drizzleColor, roughness: 0.3 });
  const drizzle = new THREE.Mesh(new THREE.TorusGeometry(0.218, 0.019, 8, 48, Math.PI * 1.8), drizzleMat);
  drizzle.rotation.x = Math.PI / 2;
  drizzle.rotation.z = 0.3;
  drizzle.position.set(-0.02, coneH + 0.405, 0.02);
  group.add(drizzle);
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 2 + (i - 1.5) * 0.46;
    const dripLen = 0.07 + seedRandom() * 0.08;
    const drip = new THREE.Mesh(new THREE.CapsuleGeometry(0.017, dripLen, 3, 6), drizzleMat);
    drip.position.set(Math.cos(a) * 0.218 - 0.02, coneH + 0.365 - dripLen / 2, Math.sin(a) * 0.218 + 0.02);
    group.add(drip);
    const drop = new THREE.Mesh(new THREE.SphereGeometry(0.026, 8, 6), drizzleMat);
    drop.position.set(Math.cos(a) * 0.218 - 0.02, coneH + 0.365 - dripLen, Math.sin(a) * 0.218 + 0.02);
    group.add(drop);
  }

  const palette = ['#ff9fc0', '#8fdcc5', '#ffd16f', '#b8a4e3'];
  for (let i = 0; i < 18; i++) {
    const a = seedRandom() * Math.PI * 2;
    const r = seedRandom() * 0.24;
    const sprinkle = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.009, 0.042, 3, 5),
      new THREE.MeshStandardMaterial({ color: palette[Math.floor(seedRandom() * palette.length)], roughness: 0.5 }),
    );
    const y = coneH + 0.45 + seedRandom() * 0.18;
    sprinkle.position.set(0.055 + Math.cos(a) * r, y, -0.012 + Math.sin(a) * r);
    sprinkle.rotation.set(seedRandom() * Math.PI, seedRandom() * Math.PI, seedRandom() * Math.PI);
    group.add(sprinkle);
  }

  const wafer = new THREE.Mesh(
    new THREE.BoxGeometry(0.135, 0.026, 0.52),
    new THREE.MeshStandardMaterial({ map: getWaferTexture(), color: '#ffe3b8', roughness: 0.55 }),
  );
  wafer.position.set(0.17, coneH + 0.68, 0.06);
  wafer.rotation.z = -0.34;
  wafer.rotation.y = 0.3;
  group.add(wafer);

  const cherryMat = new THREE.MeshPhysicalMaterial({ color: '#e8556d', roughness: 0.2, clearcoat: 1 });
  const cherry = new THREE.Group();
  const cherryBall = new THREE.Mesh(new THREE.SphereGeometry(0.072, 16, 12), cherryMat);
  const cherryShine = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), new THREE.MeshBasicMaterial({ color: '#fff6ef' }));
  cherryShine.position.set(-0.026, 0.03, 0.055);
  const cherryStem = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.01, 0.045, 0),
        new THREE.Vector3(0.05, 0.12, 0.01),
        new THREE.Vector3(0.0, 0.18, 0.02),
      ]),
      10,
      0.01,
      5,
      false,
    ),
    new THREE.MeshStandardMaterial({ color: '#6f9b5c', roughness: 0.6 }),
  );
  cherry.add(cherryBall, cherryShine, cherryStem);
  cherry.position.set(-0.12, coneH + 0.67, 0.08);
  group.add(cherry);

  const lid = new THREE.Group();
  lid.visible = false;
  group.add(lid);

  const steamGroup = new THREE.Group();
  group.add(steamGroup);

  const topScoop = scoopGroup.children[0] as THREE.Mesh;
  return { group, steamGroup, liquid: topScoop, boba: scoopGroup, lid };
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function disposeCup(group: THREE.Group) {
  group.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.geometry.dispose();
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach((m) => m.dispose());
    }
  });
}

export function cupColorForSelections(s: CraftSelections): string {
  return '#' + mixLiquidColor(s as Partial<Recipe>).getHexString();
}
