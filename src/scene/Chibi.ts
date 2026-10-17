import * as THREE from 'three';
import type { CustomerDef } from '../game/types';
import { getFaceTexture } from '../ui/portrait';
import { addOutline, toon, toonSkin, standard } from './threeUtils';

type Mood = 'neutral' | 'worried' | 'sad' | 'happy';
type FaceExpr = 'smile' | 'happy' | 'blink' | 'worried' | 'sad';

const loader = new THREE.TextureLoader();
const faceTextureCache = new Map<string, THREE.Texture>();

function faceTexture(customer: CustomerDef, expr: FaceExpr): THREE.Texture {
  const key = `${customer.id}:${expr}`;
  const found = faceTextureCache.get(key);
  if (found) return found;
  const tex = loader.load(getFaceTexture(customer, expr));
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  faceTextureCache.set(key, tex);
  return tex;
}

export class Chibi {
  readonly root = new THREE.Group();
  readonly visual = new THREE.Group();
  readonly headGroup = new THREE.Group();
  readonly customer: CustomerDef;
  readonly vip: boolean;
  readonly hoverRing: THREE.Mesh;

  private bodyGroup = new THREE.Group();
  private hairCap!: THREE.Mesh;
  private faceMaterial!: THREE.MeshBasicMaterial;
  private faceGeometry!: THREE.SphereGeometry;
  private faceMesh!: THREE.Mesh;
  private leftEar = new THREE.Group();
  private rightEar = new THREE.Group();
  private leftArm!: THREE.Mesh;
  private rightArm!: THREE.Mesh;
  private leftLeg!: THREE.Mesh;
  private rightLeg!: THREE.Mesh;
  private tail?: THREE.Group;
  private mood: Mood = 'neutral';
  private blinkIn = 2 + Math.random() * 3;
  private blinkLeft = 0;
  private earFlick = 0;
  private time = 0;
  private walking = false;
  private walkPhase = Math.random() * 10;
  private hovered = false;
  private hop = 0;
  private shake = 0;
  private angry = false;
  private disposed = false;

  constructor(customer: CustomerDef, vip = false) {
    this.customer = customer;
    this.vip = vip;
    this.root.add(this.visual);
    this.visual.add(this.bodyGroup, this.headGroup);
    this.headGroup.position.y = 1.34;

    this.faceGeometry = this.buildFaceGeometry();
    this.buildBody();
    this.buildHead();
    this.buildAccessory();
    if (vip) this.buildCrown();

    this.hoverRing = new THREE.Mesh(
      new THREE.RingGeometry(0.42, 0.52, 48),
      new THREE.MeshBasicMaterial({ color: 0xff8eb2, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }),
    );
    this.hoverRing.rotation.x = -Math.PI / 2;
    this.hoverRing.position.y = 0.015;
    this.root.add(this.hoverRing);

    this.root.userData.customer = this;
    this.visual.scale.setScalar(0.94);
    this.setMood('neutral');
    this.root.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.userData.chibi = this;
        if (o.material === this.hoverRing.material) return;
        o.castShadow = true;
        o.receiveShadow = false;
      }
    });
    this.faceMesh.renderOrder = 5;
    this.faceMesh.castShadow = false;
    this.faceMesh.receiveShadow = false;
  }

  private buildFaceGeometry(): THREE.SphereGeometry {
    const phiStart = Math.PI / 2 - 0.85;
    const phiLength = 1.7;
    const thetaStart = 0.96;
    const thetaLength = 1.03;
    const geo = new THREE.SphereGeometry(0.504, 32, 24, phiStart, phiLength, thetaStart, thetaLength);
    const uv = geo.attributes.uv as THREE.BufferAttribute;
    let minU = Infinity;
    let maxU = -Infinity;
    let minV = Infinity;
    let maxV = -Infinity;
    for (let i = 0; i < uv.count; i++) {
      minU = Math.min(minU, uv.getX(i));
      maxU = Math.max(maxU, uv.getX(i));
      minV = Math.min(minV, uv.getY(i));
      maxV = Math.max(maxV, uv.getY(i));
    }
    for (let i = 0; i < uv.count; i++) {
      uv.setXY(i, (uv.getX(i) - minU) / (maxU - minU), (uv.getY(i) - minV) / (maxV - minV));
    }
    uv.needsUpdate = true;
    geo.scale(1, 0.94, 0.92);
    return geo;
  }

  private buildBody() {
    const c = this.customer.colors;
    const coat = toon(c.coat);
    const coatShade = toon(c.coatShade);
    const skin = toonSkin(c.skin);
    const accent = toon(c.accent);
    const cream = toon('#fff8ec');
    const shoeColor = standard(c.coatShade, { roughness: 0.9 });

    // legs & shoes
    const legGeo = new THREE.CapsuleGeometry(0.072, 0.2, 6, 12);
    this.leftLeg = new THREE.Mesh(legGeo, toonSkin(c.skin));
    this.leftLeg.position.set(-0.14, 0.29, 0);
    this.leftLeg.castShadow = true;
    this.rightLeg = new THREE.Mesh(legGeo, toonSkin(c.skin));
    this.rightLeg.position.set(0.14, 0.29, 0);
    this.rightLeg.castShadow = true;
    this.bodyGroup.add(this.leftLeg, this.rightLeg);

    const shoeGeo = new THREE.SphereGeometry(0.105, 16, 12);
    for (const s of [-1, 1]) {
      const shoe = new THREE.Mesh(shoeGeo, shoeColor);
      shoe.scale.set(1, 0.72, 1.35);
      shoe.position.set(s * 0.14, 0.075, 0.045);
      shoe.castShadow = true;
      this.bodyGroup.add(shoe);
    }

    // torso
    const torsoGeo = new THREE.CapsuleGeometry(0.27, 0.28, 8, 20);
    const torso = new THREE.Mesh(torsoGeo, coat);
    torso.scale.set(1.02, 1, 0.84);
    torso.position.y = 0.72;
    torso.castShadow = true;
    addOutline(torso, 1.035);
    this.bodyGroup.add(torso);

    // flared little hem
    const hem = new THREE.Mesh(new THREE.CylinderGeometry(0.275, 0.34, 0.22, 24), coatShade);
    hem.position.y = 0.5;
    hem.scale.z = 0.86;
    hem.castShadow = true;
    this.bodyGroup.add(hem);
    const hemTrim = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.022, 8, 32), accent);
    hemTrim.rotation.x = Math.PI / 2;
    hemTrim.scale.z = 0.86;
    hemTrim.position.y = 0.405;
    this.bodyGroup.add(hemTrim);

    // little pearl scallops around the hem
    const pearlMat = standard('#fff7e8', { roughness: 0.32, metalness: 0.08 });
    const pearlGeo = new THREE.SphereGeometry(0.022, 8, 6);
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const pearl = new THREE.Mesh(pearlGeo, pearlMat);
      pearl.position.set(Math.cos(a) * 0.328, 0.389, Math.sin(a) * 0.328 * 0.86);
      pearl.scale.set(1, 0.85, 1);
      this.bodyGroup.add(pearl);
    }

    // puffed sleeves
    for (const s of [-1, 1]) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.137, 16, 12), coat);
      puff.scale.set(1.02, 0.8, 0.96);
      puff.position.set(s * 0.283, 0.95, 0.005);
      this.bodyGroup.add(puff);
    }

    // collar V
    for (const s of [-1, 1]) {
      const flap = new THREE.Mesh(new THREE.ConeGeometry(0.125, 0.21, 3), cream);
      flap.rotation.z = s * 0.42;
      flap.rotation.x = Math.PI * 0.5;
      flap.position.set(s * 0.12, 0.96, 0.24);
      flap.scale.z = 0.35;
      this.bodyGroup.add(flap);
    }

    // bow
    const bow = new THREE.Group();
    for (const s of [-1, 1]) {
      const wing = new THREE.Mesh(new THREE.SphereGeometry(0.062, 12, 10), accent);
      wing.scale.set(1.4, 0.85, 0.55);
      wing.position.x = s * 0.06;
      bow.add(wing);
    }
    const knot = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 10), cream);
    bow.add(knot);
    bow.position.set(0, 0.87, 0.27);
    this.bodyGroup.add(bow);

    const buttonGeo = new THREE.SphereGeometry(0.018, 10, 8);
    for (let i = 0; i < 2; i++) {
      const btn = new THREE.Mesh(buttonGeo, standard('#d5b39f', { roughness: 0.4, metalness: 0.2 }));
      btn.position.set(0.06, 0.7 - i * 0.12, 0.29);
      this.bodyGroup.add(btn);
    }

    // neck
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.11, 0.16, 16), skin);
    neck.position.y = 1.05;
    this.bodyGroup.add(neck);

    // arms
    const armGeo = new THREE.CapsuleGeometry(0.073, 0.28, 6, 12);
    this.leftArm = new THREE.Mesh(armGeo, coat);
    this.leftArm.position.set(-0.32, 0.79, 0.02);
    this.leftArm.rotation.z = -0.16;
    this.leftArm.rotation.x = -0.12;
    this.leftArm.castShadow = true;
    addOutline(this.leftArm, 1.04);
    this.rightArm = new THREE.Mesh(armGeo, coat);
    this.rightArm.position.set(0.32, 0.79, 0.02);
    this.rightArm.rotation.z = 0.16;
    this.rightArm.rotation.x = -0.12;
    this.rightArm.castShadow = true;
    addOutline(this.rightArm, 1.04);
    this.bodyGroup.add(this.leftArm, this.rightArm);

    // contrast cuffs that travel with the arms
    const cuffGeo = new THREE.TorusGeometry(0.078, 0.016, 6, 18);
    for (const arm of [this.leftArm, this.rightArm]) {
      const cuff = new THREE.Mesh(cuffGeo, accent);
      cuff.rotation.x = Math.PI / 2;
      cuff.position.y = -0.178;
      arm.add(cuff);
    }

    // tiny embroidered flower on the left chest
    const flower = new THREE.Group();
    const petalGeo = new THREE.SphereGeometry(0.02, 8, 6);
    const petalMat = toon(c.accent);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      const petal = new THREE.Mesh(petalGeo, petalMat);
      petal.position.set(Math.cos(a) * 0.031, Math.sin(a) * 0.031, 0);
      petal.scale.set(1, 1, 0.42);
      flower.add(petal);
    }
    const flowerCenter = new THREE.Mesh(new THREE.SphereGeometry(0.013, 8, 6), standard('#ffe6a1', { roughness: 0.4 }));
    flowerCenter.scale.z = 0.55;
    flower.add(flowerCenter);
    flower.position.set(-0.115, 0.785, 0.232);
    flower.rotation.x = -0.12;
    this.bodyGroup.add(flower);

    const handGeo = new THREE.SphereGeometry(0.075, 14, 12);
    for (const s of [-1, 1]) {
      const hand = new THREE.Mesh(handGeo, skin);
      hand.position.set(s * 0.35, 0.56, 0.055);
      hand.scale.set(1, 0.9, 0.95);
      this.bodyGroup.add(hand);
    }

    // scarf accessory
    if (this.customer.accessory === 'scarf') {
      const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.215, 0.055, 10, 28), accent);
      scarf.rotation.x = Math.PI / 2;
      scarf.position.y = 0.99;
      scarf.castShadow = true;
      this.bodyGroup.add(scarf);
      const tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.22, 6, 10), accent);
      tail.position.set(0.13, 0.84, 0.25);
      tail.rotation.z = 0.2;
      this.bodyGroup.add(tail);
    }

    this.buildTail();
  }

  private buildTail() {
    const c = this.customer.colors;
    const tailMat = toon(c.hair);
    const group = new THREE.Group();
    group.position.set(0, 0.62, -0.28);
    const species = this.customer.species;
    if (species === 'fox' || species === 'wolf') {
      const sizes = [0.16, 0.2, 0.17, 0.1];
      let x = 0;
      let y = 0;
      for (let i = 0; i < sizes.length; i++) {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(sizes[i], 14, 12), tailMat);
        puff.position.set(-x, y, -i * 0.08);
        puff.scale.set(1, 1.1, 0.9);
        puff.castShadow = true;
        group.add(puff);
        x += 0.11;
        y += 0.12;
      }
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 12), toon('#fff4ec'));
      tip.position.set(-0.42, 0.47, -0.26);
      group.add(tip);
    } else if (species === 'cat') {
      const seg1 = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.24, 5, 10), tailMat);
      seg1.rotation.z = -0.6;
      seg1.position.set(0.05, 0.12, 0);
      const seg2 = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10), tailMat);
      seg2.position.set(-0.15, 0.25, 0);
      group.add(seg1, seg2);
    } else if (species === 'dog') {
      const seg = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.22, 5, 10), tailMat);
      seg.rotation.z = 0.8;
      seg.position.set(-0.03, 0.2, 0);
      group.add(seg);
    } else if (species === 'rabbit') {
      const pom = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 12), toon('#fff8f1'));
      pom.position.set(0, 0.08, -0.03);
      group.add(pom);
    } else {
      const stub = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 10), tailMat);
      stub.position.set(0, 0.05, 0);
      group.add(stub);
    }
    group.traverse((o) => {
      if (o instanceof THREE.Mesh) o.castShadow = true;
    });
    this.tail = group;
    this.bodyGroup.add(group);
  }

  private buildHead() {
    const c = this.customer.colors;

    const backHairMat = toon(c.hairShade);
    const backHair = new THREE.Mesh(new THREE.SphereGeometry(0.525, 32, 24), backHairMat);
    backHair.scale.set(1.02, 1.0, 0.94);
    backHair.position.set(0, -0.015, -0.06);
    backHair.castShadow = true;
    addOutline(backHair, 1.025);
    this.headGroup.add(backHair);

    this.buildBackHairStyle();

    // Ears
    this.buildEars();

    // head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.5, 40, 32), toonSkin(c.skin));
    head.scale.set(1, 0.94, 0.92);
    head.castShadow = true;
    addOutline(head, 1.025);
    this.headGroup.add(head);

    // curved face decal
    this.faceMaterial = new THREE.MeshBasicMaterial({
      map: faceTexture(this.customer, 'smile'),
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    });
    this.faceMesh = new THREE.Mesh(this.faceGeometry, this.faceMaterial);
    this.faceMesh.renderOrder = 4;
    this.faceMesh.raycast = () => {};
    this.headGroup.add(this.faceMesh);

    // hair cap
    const capGeo = new THREE.SphereGeometry(0.529, 40, 24, 0, Math.PI * 2, 0, Math.PI * 0.44);
    this.hairCap = new THREE.Mesh(capGeo, toon(c.hair));
    this.hairCap.scale.set(1.0, 0.97, 1.02);
    this.hairCap.position.set(0, 0.005, -0.025);
    this.hairCap.castShadow = true;
    addOutline(this.hairCap, 1.02);
    this.headGroup.add(this.hairCap);

    // bangs
    const bangMat = toon(c.hair);
    const bangCount = 5;
    for (let i = 0; i < bangCount; i++) {
      const t = (i / (bangCount - 1) - 0.5) * 2;
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.125, 0.35 + Math.abs(t) * 0.04, 7), bangMat);
      cone.rotation.x = Math.PI;
      cone.rotation.z = -t * 0.28;
      cone.position.set(t * 0.27, 0.24, 0.355 - Math.abs(t) * 0.07);
      cone.scale.z = 0.65;
      cone.castShadow = true;
      this.headGroup.add(cone);
    }

    // side locks
    for (const s of [-1, 1]) {
      const lock = new THREE.Mesh(new THREE.CapsuleGeometry(0.085, 0.28, 6, 12), bangMat);
      lock.position.set(s * 0.42, -0.04, 0.27);
      lock.rotation.z = s * 0.14;
      lock.scale.z = 0.8;
      lock.castShadow = true;
      this.headGroup.add(lock);
    }

    // fluffy top tufts
    if (this.customer.hairStyle === 'fluffy') {
      for (const [x, y, z, rz] of [
        [-0.22, 0.46, 0.04, -0.5],
        [0.05, 0.52, 0.0, 0.1],
        [0.25, 0.45, 0.05, 0.55],
      ] as [number, number, number, number][]) {
        const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.105, 0.28, 6), bangMat);
        tuft.position.set(x, y, z);
        tuft.rotation.z = rz;
        tuft.castShadow = true;
        this.headGroup.add(tuft);
      }
    }

    // hair sheen arcs
    const sheenMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.26, depthWrite: false });
    const sheen = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.014, 6, 28, Math.PI * 0.7), sheenMat);
    sheen.rotation.set(0.8, 0, -0.2);
    sheen.position.set(0.02, 0.3, 0.28);
    this.headGroup.add(sheen);
    const sheenSoft = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15, depthWrite: false });
    const sheenLeft = new THREE.Mesh(new THREE.TorusGeometry(0.235, 0.009, 6, 22, Math.PI * 0.5), sheenSoft);
    sheenLeft.rotation.set(0.92, 0.12, -0.95);
    sheenLeft.position.set(-0.2, 0.3, 0.25);
    this.headGroup.add(sheenLeft);
    const sheenRight = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.008, 6, 20, Math.PI * 0.42), sheenSoft);
    sheenRight.rotation.set(0.7, -0.3, 1.95);
    sheenRight.position.set(0.24, 0.2, 0.28);
    this.headGroup.add(sheenRight);

    // strand ridges framing the fringe
    const strandMat = toon(new THREE.Color(c.hairShade).lerp(new THREE.Color('#ffffff'), 0.16));
    const strandGeo = new THREE.CapsuleGeometry(0.012, 0.16, 4, 8);
    for (const s of [-1, 1]) {
      const strand = new THREE.Mesh(strandGeo, strandMat);
      strand.position.set(s * 0.235, 0.11, 0.395);
      strand.rotation.z = s * 0.34;
      strand.rotation.x = 0.08;
      this.headGroup.add(strand);
    }
  }

  private buildBackHairStyle() {
    const c = this.customer.colors;
    const mat = toon(c.hairShade);
    const dark = toon(c.hair);
    const style = this.customer.hairStyle;
    if (style === 'twintails') {
      for (const s of [-1, 1] as const) {
        const tail = new THREE.Group();
        const upper = new THREE.Mesh(new THREE.SphereGeometry(0.155, 14, 12), mat);
        upper.position.y = -0.08;
        const lower = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.28, 6, 12), mat);
        lower.position.set(s * 0.055, -0.35, -0.04);
        lower.rotation.z = s * 0.16;
        const tie = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), toon(c.accent));
        tie.position.y = 0.08;
        tail.add(upper, lower, tie);
        tail.position.set(s * 0.47, 0.02, -0.18);
        tail.rotation.z = s * 0.18;
        tail.traverse((o) => {
          if (o instanceof THREE.Mesh) o.castShadow = true;
        });
        this.headGroup.add(tail);
      }
    } else if (style === 'long') {
      for (const s of [-1, 1] as const) {
        const lock = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.62, 8, 14), mat);
        lock.position.set(s * 0.3, -0.47, -0.25);
        lock.rotation.z = s * 0.06;
        lock.scale.z = 0.7;
        lock.castShadow = true;
        this.headGroup.add(lock);
      }
      const center = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.52, 8, 16), mat);
      center.position.set(0, -0.42, -0.34);
      center.scale.z = 0.55;
      center.castShadow = true;
      this.headGroup.add(center);
    } else if (style === 'bob') {
      for (const s of [-1, 1] as const) {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(0.19, 16, 12), mat);
        puff.position.set(s * 0.36, -0.18, -0.12);
        puff.scale.set(0.9, 1.3, 0.8);
        puff.castShadow = true;
        this.headGroup.add(puff);
      }
    } else if (style === 'ponytail') {
      const tie = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10), toon(c.accent));
      tie.position.set(0.34, 0.16, -0.34);
      const tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.55, 8, 14), dark);
      tail.position.set(0.52, -0.16, -0.4);
      tail.rotation.z = -0.65;
      tail.rotation.x = -0.2;
      tail.castShadow = true;
      this.headGroup.add(tie, tail);
    } else if (style === 'short' || style === 'fluffy') {
      for (const s of [-1, 1] as const) {
        const tip = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.24, 6), mat);
        tip.position.set(s * 0.4, -0.16, -0.2);
        tip.rotation.z = s * 2.6;
        this.headGroup.add(tip);
      }
    }
  }

  private buildEars() {
    const c = this.customer.colors;
    const mat = toon(c.hair);
    const innerMat = toon(c.earInner);
    const fluffMat = toon('#fff4ea');
    const species = this.customer.species;
    const sides: [-1, 1] = [-1, 1];
    for (const s of sides) {
      const ear = s === -1 ? this.leftEar : this.rightEar;
      ear.position.set(s * 0.27, 0.38, -0.02);
      if (species === 'cat' || species === 'fox' || species === 'wolf') {
        const size = species === 'fox' ? [0.15, 0.4] : species === 'wolf' ? [0.155, 0.34] : [0.13, 0.28];
        const outer = new THREE.Mesh(new THREE.ConeGeometry(size[0], size[1], 8), mat);
        outer.position.y = size[1] / 2;
        outer.rotation.z = s * -0.2;
        outer.castShadow = true;
        addOutline(outer, 1.04);
        const inner = new THREE.Mesh(new THREE.ConeGeometry(size[0] * 0.55, size[1] * 0.62, 8), innerMat);
        inner.position.set(0, size[1] * 0.42, 0.045);
        inner.rotation.z = s * -0.2;
        inner.scale.z = 0.3;
        ear.add(outer, inner);
        for (const k of [-1, 1]) {
          const fluff = new THREE.Mesh(new THREE.ConeGeometry(0.018, size[1] * 0.28, 5), fluffMat);
          fluff.position.set(k * size[0] * 0.16, size[1] * 0.2, 0.06);
          fluff.rotation.z = s * -0.2 + k * 0.24;
          fluff.scale.z = 0.35;
          ear.add(fluff);
        }
      } else if (species === 'bear') {
        const outer = new THREE.Mesh(new THREE.SphereGeometry(0.155, 16, 12), mat);
        outer.position.set(s * 0.06, 0.08, 0);
        outer.castShadow = true;
        addOutline(outer, 1.04);
        const inner = new THREE.Mesh(new THREE.SphereGeometry(0.085, 14, 10), innerMat);
        inner.position.set(s * 0.06, 0.08, 0.09);
        ear.add(outer, inner);
        const fluff = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), fluffMat);
        fluff.position.set(s * 0.09, 0.11, 0.105);
        fluff.scale.set(1, 0.6, 0.5);
        ear.add(fluff);
      } else if (species === 'rabbit') {
        const outer = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.38, 8, 12), mat);
        outer.position.set(s * 0.06, 0.3, -0.02);
        outer.rotation.z = s * 0.2;
        outer.scale.z = 0.72;
        outer.castShadow = true;
        addOutline(outer, 1.04);
        const inner = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.26, 6, 10), innerMat);
        inner.position.set(s * 0.07, 0.31, 0.045);
        inner.rotation.z = s * 0.2;
        inner.scale.z = 0.3;
        ear.add(outer, inner);
        for (const k of [-1, 1]) {
          const fluff = new THREE.Mesh(new THREE.ConeGeometry(0.016, 0.13, 5), fluffMat);
          fluff.position.set(s * 0.06 + k * 0.026, 0.1, 0.055);
          fluff.rotation.z = s * 0.2 + k * 0.2;
          fluff.scale.z = 0.35;
          ear.add(fluff);
        }
      } else {
        const outer = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.26, 8, 12), mat);
        outer.position.set(s * 0.1, -0.06, 0);
        outer.rotation.z = s * 0.75;
        outer.scale.z = 0.7;
        outer.castShadow = true;
        addOutline(outer, 1.04);
        ear.add(outer);
        const fluff = new THREE.Mesh(new THREE.ConeGeometry(0.017, 0.11, 5), fluffMat);
        fluff.position.set(s * 0.12, -0.02, 0.045);
        fluff.rotation.z = s * 0.72;
        fluff.scale.z = 0.35;
        ear.add(fluff);
      }
      ear.rotation.z = s * 0.06;
      this.headGroup.add(ear);
    }
  }

  private buildAccessory() {
    const c = this.customer.colors;
    const accent = toon(c.accent);
    switch (this.customer.accessory) {
      case 'star': {
        const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.09, 0), standard(c.accent, { roughness: 0.4, metalness: 0.1 }));
        star.position.set(0.37, 0.27, 0.24);
        star.rotation.z = 0.3;
        addOutline(star, 1.08);
        this.headGroup.add(star);
        break;
      }
      case 'beret': {
        const beret = new THREE.Group();
        const dome = new THREE.Mesh(new THREE.SphereGeometry(0.35, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.5), accent);
        dome.scale.set(1.15, 0.36, 1.0);
        dome.castShadow = true;
        addOutline(dome, 1.02);
        const brim = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.023, 8, 28), accent);
        brim.rotation.x = Math.PI / 2;
        brim.scale.set(1.05, 0.9, 1);
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.018, 0.08, 8), accent);
        stem.position.y = 0.16;
        beret.add(dome, brim, stem);
        beret.position.set(0.06, 0.43, 0.02);
        beret.rotation.z = -0.14;
        beret.rotation.y = 0.15;
        this.headGroup.add(beret);
        break;
      }
      case 'ribbon': {
        for (const s of [-1, 1] as const) {
          const wing = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.16, 4), accent);
          wing.rotation.x = Math.PI / 2;
          wing.rotation.z = s * 0.35;
          wing.scale.z = 0.45;
          wing.position.set(s * 0.13, 0.3, 0.03);
          wing.castShadow = true;
          const knot = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), standard('#fff3c4', { roughness: 0.5 }));
          knot.position.set(0, 0.29, 0.05);
          const ribbon = new THREE.Group();
          ribbon.add(wing, knot);
          ribbon.position.set(s * 0.24 + 0.25, 0.18, 0.13);
          ribbon.rotation.z = 0.2;
          this.headGroup.add(ribbon);
        }
        break;
      }
      case 'glasses': {
        const dark = standard('#6d5563', { roughness: 0.35, metalness: 0.2 });
        for (const s of [-1, 1]) {
          const ring = new THREE.Mesh(new THREE.TorusGeometry(0.105, 0.013, 6, 28), dark);
          ring.position.set(s * 0.185, 0.045, 0.456);
          this.headGroup.add(ring);
        }
        const bridge = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.11, 6), dark);
        bridge.rotation.z = Math.PI / 2;
        bridge.position.set(0, 0.055, 0.456);
        this.headGroup.add(bridge);
        break;
      }
      case 'scarf':
        break;
      case 'clip': {
        for (let i = 0; i < 5; i++) {
          const petal = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), standard(c.accent, { roughness: 0.6 }));
          const a = (i / 5) * Math.PI * 2;
          petal.position.set(-0.33 + Math.cos(a) * 0.045, 0.25 + Math.sin(a) * 0.045, 0.355);
          petal.scale.z = 0.35;
          this.headGroup.add(petal);
        }
        const center = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), standard('#ffe7a0', { roughness: 0.5 }));
        center.position.set(-0.33, 0.25, 0.368);
        this.headGroup.add(center);
        break;
      }
    }
  }

  private buildCrown() {
    const gold = standard('#ffd16f', { roughness: 0.28, metalness: 0.55 });
    const group = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.13, 0.05, 14, 1, true), gold);
    group.add(base);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.1, 5), gold);
      spike.position.set(Math.cos(a) * 0.115, 0.07, Math.sin(a) * 0.115);
      group.add(spike);
    }
    const gem = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff7fa4 }));
    gem.position.set(0, 0.02, 0.13);
    group.add(gem);
    group.position.set(0, 0.55, 0.04);
    group.rotation.z = 0.05;
    this.headGroup.add(group);
  }

  setMood(mood: Mood) {
    this.mood = mood;
    this.updateFace();
  }

  setHovered(value: boolean) {
    this.hovered = value;
  }

  setWalking(value: boolean) {
    this.walking = value;
  }

  cheer() {
    this.hop = 1;
    this.angry = false;
    this.setMood('happy');
  }

  sulk() {
    this.angry = true;
    this.setMood('sad');
    this.shake = 1;
  }

  getHeadAnchor(out: THREE.Vector3): THREE.Vector3 {
    this.headGroup.getWorldPosition(out);
    out.y += 0.56;
    out.z += 0.05;
    return out;
  }

  update(dt: number, elapsed: number) {
    if (this.disposed) return;
    this.time += dt;
    const t = this.time;
    const bob = Math.sin(t * 2.1 + this.walkPhase) * (this.walking ? 0.015 : 0.012);
    this.visual.position.y = bob + (this.hop > 0 ? Math.abs(Math.sin((1 - this.hop) * Math.PI * 1.5)) * 0.25 : 0);
    if (this.hop > 0) {
      this.hop = Math.max(0, this.hop - dt * 0.8);
    }

    this.headGroup.rotation.z = Math.sin(t * 0.8 + this.walkPhase) * 0.015;
    this.headGroup.rotation.x = this.angry ? 0.16 : Math.sin(t * 0.6) * 0.012;
    this.headGroup.rotation.y = Math.sin(t * 0.45 + 1) * 0.03;

    if (this.tail) {
      this.tail.rotation.y = Math.sin(t * 2.3 + this.walkPhase) * 0.22;
      this.tail.rotation.z = Math.sin(t * 1.7) * (this.customer.species === 'dog' ? 0.3 : 0.08);
    }

    if (this.walking) {
      const swing = Math.sin(t * 9 + this.walkPhase) * 0.5;
      this.leftLeg.rotation.x = swing;
      this.rightLeg.rotation.x = -swing;
      this.leftArm.rotation.x = -0.12 + -swing * 0.4;
      this.rightArm.rotation.x = -0.12 + swing * 0.4;
    } else {
      this.leftLeg.rotation.x = 0;
      this.rightLeg.rotation.x = 0;
      this.leftArm.rotation.x = -0.12 + Math.sin(t * 1.1) * 0.03;
      this.rightArm.rotation.x = -0.12 - Math.sin(t * 1.1) * 0.03;
      this.leftArm.rotation.z = -0.16 + Math.sin(t * 0.9) * 0.01;
      this.rightArm.rotation.z = 0.16 - Math.sin(t * 0.9) * 0.01;
    }

    if (this.shake > 0) {
      this.shake = Math.max(0, this.shake - dt * 0.45);
      this.visual.rotation.z = Math.sin(this.time * 34) * 0.03 * this.shake;
    } else {
      this.visual.rotation.z = 0;
    }

    this.earFlick = Math.max(0, this.earFlick - dt);
    const earWave = Math.sin(t * 2.2 + this.walkPhase) * 0.025 + (this.earFlick > 0 ? Math.sin(this.earFlick * 55) * 0.08 * this.earFlick : 0);
    this.leftEar.rotation.x = earWave;
    this.rightEar.rotation.x = -earWave * 0.8;
    if (this.earFlick <= 0 && Math.random() < dt * 0.16) this.earFlick = 0.4;

    // hover ring
    const target = this.hovered ? 0.55 : 0;
    const mat = this.hoverRing.material as THREE.MeshBasicMaterial;
    mat.opacity += (target - mat.opacity) * Math.min(1, dt * 10);
    this.hoverRing.scale.setScalar(1 + Math.sin(t * 3) * 0.02);
    this.hoverRing.position.y = 0.015;

    // blinking & mood
    this.blinkIn -= dt;
    if (this.blinkIn <= 0) {
      this.blinkLeft = 0.11;
      this.blinkIn = 2.2 + Math.random() * 3.4;
    }
    if (this.blinkLeft > 0) {
      this.blinkLeft -= dt;
      if (this.blinkLeft <= 0) this.updateFace();
      else if (this.faceMaterial.map !== faceTexture(this.customer, 'blink')) {
        const tex = faceTexture(this.customer, 'blink');
        if (tex.image) this.faceMaterial.map = tex;
        this.faceMaterial.needsUpdate = true;
      }
    }
  }

  private updateFace() {
    let expr: FaceExpr = 'smile';
    if (this.mood === 'happy') expr = 'happy';
    else if (this.mood === 'sad') expr = 'sad';
    else if (this.mood === 'worried') expr = 'worried';
    const tex = faceTexture(this.customer, expr);
    if (tex.image) {
      this.faceMaterial.map = tex;
      this.faceMaterial.needsUpdate = true;
    }
  }

  dispose() {
    this.disposed = true;
    this.root.removeFromParent();
    this.root.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((m) => {
          if (!m.userData.shared) m.dispose();
        });
      }
    });
  }
}
