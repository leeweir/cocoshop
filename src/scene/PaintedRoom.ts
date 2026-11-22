import * as THREE from 'three';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import type { DayTheme } from '../game/types';
import { paintCoverage, raycastPaint, type PaintCoverage } from './threeUtils';

const art = import.meta.glob<string>('../art/teahouse/*.webp', { eager: true, query: '?url', import: 'default' });
type Surface = 'counter-panel' | 'oak' | 'floor' | 'plaster';
type Prop = 'chair-front' | 'chair-turned' | 'table-rose' | 'table-daisy' | 'monstera' | 'blossoms' | 'posy' | 'register' | 'bench' | 'stool' | 'pendant' | 'pastries';
type ArtKey = Surface | Prop | 'garden';

const lightOnPaper: Record<DayTheme['id'], string> = {
  noon: '#fffaf2', dusk: '#ffdec9', night: '#c6c5d8', morning: '#f5faf2', candy: '#fff2ea',
};
const lightOutdoors: Record<DayTheme['id'], string> = {
  noon: '#fff9f1', dusk: '#f8bb9f', night: '#615f88', morning: '#e3f5ed', candy: '#fbe5ed',
};

/** Painted surfaces use the room lights. Freestanding illustrations share the guests' paper tint. */
export class PaintedRoom {
  readonly paperLight = new THREE.Color();
  readonly surfaces: Record<Surface, THREE.MeshStandardMaterial>;
  private readonly loader = new THREE.TextureLoader();
  private readonly textures = new Map<ArtKey, Promise<THREE.Texture<HTMLImageElement>>>();
  private readonly paperMaterials = new Map<Prop, THREE.MeshBasicMaterial>();
  private readonly tableMasks = new Map<Prop, PaintCoverage>();
  private readonly tables: THREE.Object3D[] = [];
  private readonly geometries: THREE.BufferGeometry[] = [];
  private disposed = false;

  constructor() {
    this.surfaces = {
      'counter-panel': this.surface('counter-panel', '#aec1a4', .07),
      oak: this.surface('oak', '#dec19b', .23),
      floor: this.surface('floor', '#efddc9', .44),
      plaster: this.surface('plaster', '#f5e5cc', .36),
    };
  }

  private whenReady(key: ArtKey, use: (texture: THREE.Texture<HTMLImageElement>) => void) {
    let loaded = this.textures.get(key);
    if (!loaded) {
      const url = art[`../art/teahouse/${key}.webp`];
      loaded = this.loader.loadAsync(url).catch(() => this.loader.loadAsync(`${url}?retry=1`));
      this.textures.set(key, loaded);
    }
    // Geometry and solid paint underneath are usable throughout loading and after an offline miss.
    void loaded.then(texture => {
      if (this.disposed) return;
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 4;
      use(texture);
    }).catch(() => {});
  }

  private surface(key: Surface, base: string, wash: number) {
    const material = new THREE.MeshStandardMaterial({ color: base, roughness: .96 });
    material.onBeforeCompile = shader => {
      shader.uniforms.paperBase = { value: new THREE.Color(base) };
      shader.uniforms.paperWash = { value: wash };
      shader.fragmentShader = 'uniform vec3 paperBase;\nuniform float paperWash;\n' + shader.fragmentShader.replace(
        '#include <map_fragment>', '#include <map_fragment>\n diffuseColor.rgb = mix(diffuseColor.rgb, paperBase, paperWash);',
      );
    };
    this.whenReady(key, texture => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      material.map = texture;
      material.color.set('#fffaf5');
      material.needsUpdate = true;
    });
    return material;
  }

  /** The lower edge touches the floor. A seat's back stays behind the figure, a table in front. */
  furnishing(key: Prop, fallback: THREE.Group, height: number, mirror = false, width?: number) {
    const group = new THREE.Group();
    group.add(fallback);
    const isTable = key === 'table-daisy' || key === 'table-rose';
    const tableIndex = isTable ? this.tables.push(fallback) - 1 : -1;
    this.whenReady(key, texture => {
      let material = this.paperMaterials.get(key);
      if (!material) {
        material = new THREE.MeshBasicMaterial({ map: texture, color: this.paperLight, transparent: true, alphaTest: .12, toneMapped: false });
        this.paperMaterials.set(key, material);
      }
      const geometry = new THREE.PlaneGeometry(width ?? height * texture.image.width / texture.image.height, height);
      this.geometries.push(geometry);
      const sprite = new THREE.Mesh(geometry, material);
      sprite.position.y = height / 2 + .008;
      if (mirror) {
        const uv = geometry.attributes.uv;
        for (let i = 0; i < uv.count; i++) uv.setX(i, 1 - uv.getX(i));
      }
      if (isTable) {
        if (!this.tableMasks.has(key)) this.tableMasks.set(key, paintCoverage(texture.image, 96, 128));
        raycastPaint(sprite, () => this.tableMasks.get(key));
        this.tables[tableIndex] = sprite;
      }
      group.add(sprite);
      fallback.visible = false;
    });
    return group;
  }

  tableCovers(ray: THREE.Raycaster, guestDistance: number) {
    const nearest = ray.intersectObjects(this.tables, true)[0];
    return !!nearest && nearest.distance < guestDistance;
  }

  loadGarden(draw: (image: HTMLImageElement) => void) {
    this.whenReady('garden', texture => draw(texture.image));
  }

  setTheme(theme: DayTheme) {
    this.paperLight.set(lightOnPaper[theme.id]);
    for (const material of this.paperMaterials.values()) material.color.copy(this.paperLight);
  }

  dispose() {
    this.disposed = true;
    for (const texture of this.textures.values()) void texture.then(t => t.dispose()).catch(() => {});
    for (const material of [...Object.values(this.surfaces), ...this.paperMaterials.values()]) material.dispose();
    for (const geometry of this.geometries) geometry.dispose();
  }
}

/** Keep one continuous street outside both arched windows as daylight changes. */
export function drawGarden(ctx: CanvasRenderingContext2D, image: HTMLImageElement, theme: DayTheme) {
  const { width, height } = ctx.canvas;
  const scale = Math.max(width / image.width, height / image.height);
  ctx.save();
  ctx.drawImage(image, (width - image.width * scale) / 2, (height - image.height * scale) / 2, image.width * scale, image.height * scale);
  ctx.fillStyle = 'rgba(253,240,222,.16)';
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = lightOutdoors[theme.id];
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = 'source-over';
  if (theme.id === 'night') {
    const wash = ctx.createLinearGradient(0, 0, 0, height * .7);
    wash.addColorStop(0, 'rgba(37,39,81,.74)');
    wash.addColorStop(1, 'rgba(73,62,93,0)');
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#f4ddaf';
    for (let i = 0; i < 27; i++) {
      const x = ((i * 137 + 63) % 997) / 997 * width;
      const y = ((i * 89 + 4) % 251) / 251 * height * .23;
      ctx.beginPath(); ctx.arc(x, y, i % 4 === 0 ? 1.3 : .8, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
}

/** Give the modeled props the fine edges and visible paper tooth of the artwork in one pass. */
export function paperFinish() {
  return new ShaderPass({
    name: 'TeahousePaper',
    uniforms: { tDiffuse: { value: null }, pixel: { value: new THREE.Vector2() } },
    vertexShader: `varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform sampler2D tDiffuse;
      uniform vec2 pixel;
      varying vec2 vUv;
      float lightAt(vec2 uv) { return dot(texture2D(tDiffuse, uv).rgb, vec3(.299,.587,.114)); }
      void main() {
        vec4 paint = texture2D(tDiffuse, vUv);
        float value = dot(paint.rgb, vec3(.299,.587,.114));
        float low = min(min(lightAt(vUv+vec2(pixel.x,0.)), lightAt(vUv-vec2(pixel.x,0.))),
                        min(lightAt(vUv+vec2(0.,pixel.y)), lightAt(vUv-vec2(0.,pixel.y))));
        float ink = smoothstep(.035,.36,(value-low)/(.17+value));
        vec2 p = floor(gl_FragCoord.xy);
        float grain = fract(52.9829189 * fract(dot(p, vec2(.06711056,.00583715)))) - .5;
        vec3 color = paint.rgb * (1. + grain*.045) * mix(vec3(1.), vec3(.71,.61,.56), ink*.66);
        gl_FragColor = vec4(color,paint.a);
      }`,
  });
}
