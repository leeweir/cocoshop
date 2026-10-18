import * as THREE from 'three';

let gradient: THREE.DataTexture | null = null;
let skinGradient: THREE.DataTexture | null = null;

export function toonGradient(): THREE.DataTexture {
  if (gradient) return gradient;
  const data = new Uint8Array([38, 112, 196, 255]);
  const tex = new THREE.DataTexture(data, 4, 1, THREE.RedFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  gradient = tex;
  return tex;
}

/** Softer ramp for skin so cheeks and chins don't fall into hard cel bands. */
export function skinGradientMap(): THREE.DataTexture {
  if (skinGradient) return skinGradient;
  const data = new Uint8Array([34, 66, 100, 138, 176, 210, 238, 255]);
  const tex = new THREE.DataTexture(data, data.length, 1, THREE.RedFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  skinGradient = tex;
  return tex;
}

export function toon(color: THREE.ColorRepresentation, opts?: { transparent?: boolean; opacity?: number; side?: THREE.Side }): THREE.MeshToonMaterial {
  return new THREE.MeshToonMaterial({
    color,
    gradientMap: toonGradient(),
    transparent: opts?.transparent ?? false,
    opacity: opts?.opacity ?? 1,
    side: opts?.side ?? THREE.FrontSide,
  });
}

export function toonSkin(color: THREE.ColorRepresentation): THREE.MeshToonMaterial {
  return new THREE.MeshToonMaterial({ color, gradientMap: skinGradientMap() });
}

export function standard(
  color: THREE.ColorRepresentation,
  opts?: { roughness?: number; metalness?: number; emissive?: THREE.ColorRepresentation; emissiveIntensity?: number; transparent?: boolean; opacity?: number; side?: THREE.Side },
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts?.roughness ?? 0.8,
    metalness: opts?.metalness ?? 0,
    emissive: opts?.emissive ?? 0x000000,
    emissiveIntensity: opts?.emissiveIntensity ?? 1,
    transparent: opts?.transparent ?? false,
    opacity: opts?.opacity ?? 1,
    side: opts?.side ?? THREE.FrontSide,
  });
}

const outlineMaterial = new THREE.MeshBasicMaterial({
  color: 0x5a3f4b,
  side: THREE.BackSide,
});
outlineMaterial.userData.shared = true;

export function addOutline(mesh: THREE.Mesh, scale = 1.035): THREE.Mesh {
  const outline = new THREE.Mesh(mesh.geometry, outlineMaterial);
  outline.scale.setScalar(scale);
  outline.raycast = () => {};
  outline.castShadow = false;
  outline.receiveShadow = false;
  mesh.add(outline);
  return outline;
}

export function mesh(
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  opts?: { cast?: boolean; receive?: boolean; outline?: number; position?: [number, number, number] },
): THREE.Mesh {
  const m = new THREE.Mesh(geometry, material);
  m.castShadow = opts?.cast ?? true;
  m.receiveShadow = opts?.receive ?? true;
  if (opts?.position) m.position.set(...opts.position);
  if (opts?.outline) addOutline(m, opts.outline);
  return m;
}

export function makeCanvasTexture(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  opts?: { repeat?: [number, number]; srgb?: boolean },
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  draw(ctx, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  if (opts?.srgb !== false) texture.colorSpace = THREE.SRGBColorSpace;
  if (opts?.repeat) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(...opts.repeat);
  }
  texture.anisotropy = 8;
  return texture;
}

export function radialTexture(inner: string, outer: string, size = 256): THREE.CanvasTexture {
  return makeCanvasTexture(size, size, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, inner);
    g.addColorStop(0.45, inner);
    g.addColorStop(1, outer);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}

export function softShadowTexture(): THREE.CanvasTexture {
  return makeCanvasTexture(256, 256, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(92, 58, 65, 0.28)');
    g.addColorStop(0.6, 'rgba(92, 58, 65, 0.1)');
    g.addColorStop(1, 'rgba(92, 58, 65, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}

/** Warm contact shadow placed directly beneath objects to ground them. */
export function contactShadowTexture(): THREE.CanvasTexture {
  return makeCanvasTexture(256, 256, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(92, 62, 68, 0.24)');
    g.addColorStop(0.42, 'rgba(92, 62, 68, 0.1)');
    g.addColorStop(1, 'rgba(92, 62, 68, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}

export function heartTexture(color = '#ff8dae'): THREE.CanvasTexture {
  return makeCanvasTexture(128, 128, (ctx) => {
    ctx.translate(64, 64);
    ctx.scale(0.9, 0.9);
    ctx.beginPath();
    ctx.moveTo(0, 46);
    ctx.bezierCurveTo(-58, 6, -40, -52, 0, -24);
    ctx.bezierCurveTo(40, -52, 58, 6, 0, 46);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 4;
    ctx.stroke();
  });
}

export function petalTexture(color = '#ffc2d6'): THREE.CanvasTexture {
  return makeCanvasTexture(64, 64, (ctx) => {
    ctx.translate(32, 32);
    ctx.rotate(-0.4);
    ctx.beginPath();
    ctx.ellipse(0, 0, 11, 25, 0, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.ellipse(-3, -3, 5, 14, 0.25, 0, Math.PI * 2);
    ctx.fillStyle = '#fff4f8';
    ctx.fill();
  });
}

export function starTexture(color = '#ffe4a3'): THREE.CanvasTexture {
  return makeCanvasTexture(96, 96, (ctx) => {
    ctx.translate(48, 48);
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const r = i % 2 === 0 ? 34 : 10;
      const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
  });
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

export function damp(current: number, target: number, lambda: number, dt: number): number {
  return THREE.MathUtils.damp(current, target, lambda, dt);
}

export function roundRectShape(w: number, h: number, r: number): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2 + r, -h / 2);
  shape.lineTo(w / 2 - r, -h / 2);
  shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  shape.lineTo(w / 2, h / 2 - r);
  shape.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  shape.lineTo(-w / 2 + r, h / 2);
  shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  shape.lineTo(-w / 2, -h / 2 + r);
  shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  return shape;
}

export function archShape(w: number, h: number, r: number): THREE.Shape {
  const shape = new THREE.Shape();
  const half = w / 2;
  shape.moveTo(-half, -h / 2);
  shape.lineTo(half, -h / 2);
  shape.lineTo(half, h / 2 - r);
  shape.absarc(0, h / 2 - r, half, 0, Math.PI, false);
  shape.lineTo(-half, -h / 2);
  return shape;
}

export function canvasRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

export function disposeObject(root: THREE.Object3D) {
  root.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose();
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      for (const m of mats) {
        if (m.userData.shared) continue;
        m.dispose();
      }
    }
  });
}
