import type { CustomerDef } from '../game/types';

type Expression = 'smile' | 'happy' | 'blink' | 'worried' | 'sad';

const INK = '#5b414d';

function rgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16)];
}

function mixHex(a: string, b: string, t: number): string {
  const ca = rgb(a);
  const cb = rgb(b);
  const out = ca.map((v, i) => Math.round(v + (cb[i] - v) * t));
  return `rgb(${out[0]}, ${out[1]}, ${out[2]})`;
}

function ell(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, fill?: string, stroke = false, line = 2.4) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = INK;
    ctx.lineWidth = line;
    ctx.stroke();
  }
}

function path(ctx: CanvasRenderingContext2D, points: [number, number][], fill?: string, close = true, stroke = false, line = 2.4) {
  ctx.beginPath();
  points.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  if (close) ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = INK;
    ctx.lineWidth = line;
    ctx.stroke();
  }
}

function curveShape(
  ctx: CanvasRenderingContext2D,
  draw: () => void,
  fill: string,
  stroke = true,
  line = 2.6,
) {
  draw();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = INK;
    ctx.lineWidth = line;
    ctx.stroke();
  }
}

function drawEar(ctx: CanvasRenderingContext2D, c: CustomerDef, side: -1 | 1) {
  const { hair, earInner, hairShade } = c.colors;
  ctx.save();
  const x = 128 + side * 42;
  const mirror = side;
  switch (c.species) {
    case 'cat':
      path(ctx, [
        [x - 14 * mirror, 80],
        [x - 8 * mirror, 38],
        [x + 18 * mirror, 70],
      ], hair, true, true, 2.6);
      path(ctx, [
        [x - 5 * mirror, 73],
        [x - 3 * mirror, 50],
        [x + 9 * mirror, 67],
      ], earInner, true, false);
      ctx.strokeStyle = mixHex(hair, '#ffffff', 0.62);
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 1.6;
      for (const [dx, dy] of [[-3, 71], [1, 73]] as [number, number][]) {
        ctx.beginPath();
        ctx.moveTo(x + dx * mirror + 1, dy);
        ctx.quadraticCurveTo(x + (dx + 2) * mirror, dy - 7, x + (dx + 5) * mirror, dy - 6);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      break;
    case 'fox':
      path(ctx, [
        [x - 20 * mirror, 87],
        [x - 8 * mirror, 24],
        [x + 23 * mirror, 70],
      ], hair, true, true, 2.6);
      path(ctx, [
        [x - 8 * mirror, 75],
        [x - 2 * mirror, 40],
        [x + 13 * mirror, 67],
      ], earInner, true, false);
      ctx.strokeStyle = mixHex(hair, '#ffffff', 0.62);
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 1.7;
      for (const [dx, dy] of [[-4, 78], [0, 80], [5, 78]] as [number, number][]) {
        ctx.beginPath();
        ctx.moveTo(x + dx * mirror, dy);
        ctx.quadraticCurveTo(x + (dx + 1) * mirror, dy - 9, x + (dx + 5) * mirror, dy - 7);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      break;
    case 'wolf':
      path(ctx, [
        [x - 19 * mirror, 90],
        [x - 12 * mirror, 36],
        [x - 3 * mirror, 53],
        [x + 8 * mirror, 31],
        [x + 21 * mirror, 74],
      ], hair, true, true, 2.6);
      path(ctx, [
        [x - 7 * mirror, 76],
        [x - 3 * mirror, 50],
        [x + 10 * mirror, 70],
      ], earInner, true, false);
      ctx.strokeStyle = mixHex(hair, '#ffffff', 0.62);
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 1.7;
      for (const [dx, dy] of [[-3, 78], [2, 80], [6, 77]] as [number, number][]) {
        ctx.beginPath();
        ctx.moveTo(x + dx * mirror, dy);
        ctx.quadraticCurveTo(x + (dx + 1) * mirror, dy - 8, x + (dx + 4) * mirror, dy - 6);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      break;
    case 'bear':
      ell(ctx, x + mirror * 6, 55, 25, 25, hair, true, 2.6);
      ell(ctx, x + mirror * 6, 59, 13, 13, earInner);
      ctx.strokeStyle = mixHex(hair, '#ffffff', 0.6);
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x + mirror * 6, 58, 8, Math.PI * 1.08, Math.PI * 1.55);
      ctx.stroke();
      ctx.globalAlpha = 1;
      break;
    case 'rabbit': {
      ctx.save();
      ctx.translate(x, 67);
      ctx.rotate(mirror * 0.2);
      ell(ctx, 0, -42, 18, 48, hair, true, 2.6);
      ell(ctx, 0, -40, 8, 32, earInner);
      ctx.strokeStyle = mixHex(hair, '#ffffff', 0.6);
      ctx.globalAlpha = 0.6;
      ctx.lineWidth = 1.6;
      for (let k = 0; k < 3; k++) {
        ctx.beginPath();
        ctx.moveTo((k - 1) * 3.5, -4);
        ctx.quadraticCurveTo((k - 1) * 4, -12, (k - 1) * 5 - 2, -17);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.restore();
      break;
    }
    case 'dog': {
      ctx.save();
      ctx.translate(x + mirror * 8, 92);
      ctx.rotate(mirror * 0.38);
      ell(ctx, 0, 20, 23, 43, hairShade, true, 2.6);
      ell(ctx, 3, 22, 13, 27, earInner);
      ctx.strokeStyle = mixHex(hairShade, '#ffffff', 0.5);
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(3, 20, 9, Math.PI * 1.1, Math.PI * 1.5);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.restore();
      break;
    }
  }
  ctx.restore();
}

function drawBackHair(ctx: CanvasRenderingContext2D, c: CustomerDef) {
  const { hair, hairShade } = c.colors;
  ctx.save();
  switch (c.hairStyle) {
    case 'long':
      curveShape(ctx, () => {
        ctx.beginPath();
        ctx.moveTo(62, 118);
        ctx.bezierCurveTo(49, 187, 65, 226, 83, 246);
        ctx.lineTo(173, 246);
        ctx.bezierCurveTo(191, 226, 207, 187, 194, 118);
        ctx.bezierCurveTo(186, 58, 70, 58, 62, 118);
        ctx.closePath();
      }, hairShade, true, 3);
      ctx.strokeStyle = mixHex(hairShade, '#ffffff', 0.42);
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 3;
      for (const s of [-1, 1] as const) {
        ctx.beginPath();
        ctx.moveTo(128 + s * 55, 150);
        ctx.bezierCurveTo(128 + s * 67, 190, 128 + s * 53, 218, 128 + s * 44, 236);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      break;
    case 'bob':
      curveShape(ctx, () => {
        ctx.beginPath();
        ctx.moveTo(64, 120);
        ctx.bezierCurveTo(58, 62, 198, 62, 192, 120);
        ctx.lineTo(186, 174);
        ctx.bezierCurveTo(169, 190, 87, 190, 70, 174);
        ctx.closePath();
      }, hairShade, true, 3);
      ctx.strokeStyle = mixHex(hairShade, '#ffffff', 0.42);
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 3.2;
      for (const s of [-1, 1] as const) {
        ctx.beginPath();
        ctx.moveTo(128 + s * 48, 126);
        ctx.quadraticCurveTo(128 + s * 61, 154, 128 + s * 52, 178);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      break;
    case 'twintails':
      curveShape(ctx, () => {
        ctx.beginPath();
        ctx.moveTo(64, 116);
        ctx.bezierCurveTo(58, 62, 198, 62, 192, 116);
        ctx.lineTo(184, 172);
        ctx.lineTo(72, 172);
        ctx.closePath();
      }, hairShade, true, 3);
      for (const s of [-1, 1] as const) {
        ctx.save();
        ctx.translate(128 + s * 75, 150);
        ctx.rotate(s * 0.15);
        ell(ctx, 0, 25, 26, 51, hair, true, 2.8);
        ell(ctx, -s * 4, 34, 12, 32, hairShade);
        ctx.strokeStyle = mixHex(hair, '#ffffff', 0.62);
        ctx.globalAlpha = 0.5;
        ctx.lineWidth = 3.4;
        ctx.beginPath();
        ctx.ellipse(s * 7, 30, 15, 36, -s * 0.18, Math.PI * 1.08, Math.PI * 1.62);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.restore();
        ell(ctx, 128 + s * 65, 112, 9, 9, c.colors.accent, true, 2.2);
      }
      break;
    case 'short':
      curveShape(ctx, () => {
        ctx.beginPath();
        ctx.moveTo(66, 116);
        ctx.bezierCurveTo(61, 63, 195, 63, 190, 116);
        ctx.lineTo(184, 150);
        ctx.lineTo(72, 150);
        ctx.closePath();
      }, hairShade, true, 3);
      break;
    case 'fluffy':
      curveShape(ctx, () => {
        ctx.beginPath();
        ctx.moveTo(60, 128);
        ctx.bezierCurveTo(48, 78, 77, 51, 109, 54);
        ctx.lineTo(120, 43);
        ctx.lineTo(135, 54);
        ctx.bezierCurveTo(185, 50, 209, 86, 194, 135);
        ctx.lineTo(182, 166);
        ctx.bezierCurveTo(160, 182, 96, 182, 74, 164);
        ctx.closePath();
      }, hairShade, true, 3);
      break;
    case 'ponytail':
      curveShape(ctx, () => {
        ctx.beginPath();
        ctx.moveTo(64, 118);
        ctx.bezierCurveTo(59, 64, 197, 64, 192, 118);
        ctx.lineTo(184, 158);
        ctx.lineTo(72, 158);
        ctx.closePath();
      }, hairShade, true, 3);
      ctx.save();
      ctx.translate(197, 118);
      ctx.rotate(-0.5);
      ell(ctx, 0, 46, 25, 54, hair, true, 2.8);
      ell(ctx, 7, 52, 11, 33, hairShade);
      ctx.strokeStyle = mixHex(hair, '#ffffff', 0.6);
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 3.4;
      ctx.beginPath();
      ctx.ellipse(0, 44, 15, 38, 0.1, Math.PI * 1.05, Math.PI * 1.58);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.restore();
      ell(ctx, 180, 97, 10, 8, c.colors.accent, true, 2.2);
      break;
  }
  ctx.restore();
}

function drawBangs(ctx: CanvasRenderingContext2D, c: CustomerDef) {
  const { hair, hairShade } = c.colors;
  ctx.save();
  const bangs = () => {
    ctx.beginPath();
    ctx.moveTo(68, 124);
    ctx.bezierCurveTo(56, 58, 198, 54, 188, 124);
    ctx.lineTo(171, 92);
    ctx.bezierCurveTo(166, 110, 157, 113, 150, 98);
    ctx.bezierCurveTo(143, 119, 133, 124, 126, 103);
    ctx.bezierCurveTo(118, 124, 108, 120, 102, 98);
    ctx.bezierCurveTo(94, 117, 87, 115, 84, 96);
    ctx.closePath();
  };
  bangs();
  const hairFill = ctx.createLinearGradient(0, 56, 0, 126);
  hairFill.addColorStop(0, mixHex(hair, '#ffffff', 0.14));
  hairFill.addColorStop(0.52, hair);
  hairFill.addColorStop(1, mixHex(hair, hairShade, 0.55));
  ctx.fillStyle = hairFill;
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.6;
  ctx.stroke();

  ctx.save();
  bangs();
  ctx.clip();
  // glossy sweep across the crown of the fringe
  ctx.strokeStyle = mixHex(hair, '#ffffff', 0.68);
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 6.5;
  ctx.beginPath();
  ctx.moveTo(86, 82);
  ctx.quadraticCurveTo(124, 57, 167, 76);
  ctx.stroke();
  ctx.globalAlpha = 0.65;
  ctx.strokeStyle = mixHex(hair, '#ffffff', 0.84);
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(100, 70);
  ctx.quadraticCurveTo(124, 58, 149, 63);
  ctx.stroke();
  // soft strand separations
  ctx.strokeStyle = hairShade;
  ctx.globalAlpha = 0.38;
  ctx.lineWidth = 1.5;
  const strands: [[number, number], [number, number], [number, number]][] = [
    [[105, 62], [101, 91], [95, 104]],
    [[118, 59], [119, 87], [117, 109]],
    [[135, 59], [135, 84], [137, 101]],
    [[152, 63], [153, 82], [150, 94]],
    [[164, 68], [166, 82], [163, 90]],
  ];
  for (const [[sx, sy], [mx, my], [ex, ey]] of strands) {
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(mx, my, ex, ey);
    ctx.stroke();
  }
  ctx.restore();

  // baby hairs softening the hairline at the temples
  ctx.strokeStyle = mixHex(hair, '#ffffff', 0.12);
  ctx.globalAlpha = 0.85;
  ctx.lineWidth = 1.5;
  for (const s of [-1, 1] as const) {
    for (let k = 0; k < 2; k++) {
      ctx.beginPath();
      ctx.moveTo(128 + s * (54 + k * 5), 108 - k * 4);
      ctx.quadraticCurveTo(128 + s * (56 + k * 5), 116 - k * 3, 128 + s * (52 + k * 6), 121 - k * 2);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawFeatures(ctx: CanvasRenderingContext2D, c: CustomerDef, expression: Expression, cx = 128, cy = 128, scale = 1) {
  const eyeY = cy - 4;
  const eyeDX = 28;
  const eye = c.colors.eyes;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.translate(-cx, -cy);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // soft blush with a warm center and a lighter sheen
  for (const s of [-1, 1]) {
    const bx = cx + s * 44;
    const by = cy + 22;
    const glow = ctx.createRadialGradient(bx, by, 1, bx, by, 17);
    glow.addColorStop(0, 'rgba(255, 139, 163, 0.5)');
    glow.addColorStop(0.55, 'rgba(255, 158, 177, 0.22)');
    glow.addColorStop(1, 'rgba(255, 182, 197, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.ellipse(bx, by, 17, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1.3;
    for (let k = 0; k < 2; k++) {
      ctx.beginPath();
      ctx.moveTo(bx + s * (2 + k * 4.5), by + 1.5 + k * 2.4);
      ctx.lineTo(bx + s * (5 + k * 4.5), by - 2.6 + k * 2.4);
      ctx.stroke();
    }
  }

  const closedHappy = expression === 'happy';
  const closed = expression === 'blink' || expression === 'sad';
  for (const s of [-1, 1] as const) {
    const ex = cx + s * eyeDX;
    ctx.save();
    if (closedHappy) {
      const arc = ctx.createLinearGradient(ex, eyeY - 13, ex, eyeY + 4);
      arc.addColorStop(0, '#4d3440');
      arc.addColorStop(1, INK);
      ctx.strokeStyle = arc;
      ctx.lineWidth = 3.4;
      ctx.beginPath();
      ctx.moveTo(ex - 12.2, eyeY + 2.5);
      ctx.quadraticCurveTo(ex, eyeY - 13, ex + 12.2, eyeY + 2.5);
      ctx.stroke();
      ctx.strokeStyle = '#fff6ef';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(ex - 7, eyeY - 4.2);
      ctx.quadraticCurveTo(ex, eyeY - 8.6, ex + 6.2, eyeY - 3.4);
      ctx.stroke();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ex + s * 12, eyeY + 1.8);
      ctx.quadraticCurveTo(ex + s * 16.2, eyeY - 2.4, ex + s * 16.8, eyeY - 0.4);
      ctx.stroke();
    } else if (closed) {
      ctx.strokeStyle = INK;
      ctx.lineWidth = 3.1;
      ctx.beginPath();
      if (expression === 'sad') {
        ctx.moveTo(ex - 10.5, eyeY + 3.4);
        ctx.quadraticCurveTo(ex, eyeY - 2.4, ex + 10.5, eyeY + 3.4);
      } else {
        ctx.moveTo(ex - 11, eyeY);
        ctx.quadraticCurveTo(ex, eyeY + 7.4, ex + 11, eyeY);
      }
      ctx.stroke();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ex + s * 10.5, eyeY + 0.4);
      ctx.lineTo(ex + s * 14.6, eyeY - 3.2);
      ctx.stroke();
    } else {
      // eye whites: warm gradient instead of flat cream
      const white = ctx.createLinearGradient(ex, eyeY - 15, ex, eyeY + 15);
      white.addColorStop(0, '#fffefb');
      white.addColorStop(0.62, '#fff8f0');
      white.addColorStop(1, '#ffe9e2');
      ctx.beginPath();
      ctx.ellipse(ex, eyeY, 11.7, 14.8, 0, 0, Math.PI * 2);
      ctx.fillStyle = white;
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.7;
      ctx.stroke();

      // iris: light at the top, deep at the rim
      const iris = ctx.createRadialGradient(ex - s * 1.2, eyeY - 4.6, 1.5, ex, eyeY + 3, 12.4);
      iris.addColorStop(0, mixHex(eye, '#ffffff', 0.38));
      iris.addColorStop(0.46, eye);
      iris.addColorStop(1, mixHex(eye, '#2f2028', 0.62));
      ctx.beginPath();
      ctx.ellipse(ex + s * -0.5, eyeY + 1.2, 8.2, 11.9, 0, 0, Math.PI * 2);
      ctx.fillStyle = iris;
      ctx.fill();
      ctx.strokeStyle = mixHex(eye, '#2f2028', 0.78);
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 1.1;
      ctx.stroke();
      ctx.globalAlpha = 1;

      // inner glow at the lower iris
      ctx.strokeStyle = mixHex(eye, '#ffffff', 0.7);
      ctx.globalAlpha = 0.38;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(ex, eyeY + 2.2, 6.3, Math.PI * 0.3, Math.PI * 0.7);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // pupil
      ctx.beginPath();
      ctx.ellipse(ex + s * -0.4, eyeY + 2.2, 3.6, 5.7, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#36242d';
      ctx.fill();

      // double highlights
      ell(ctx, ex - 3.4, eyeY - 5.8, 3.3, 3.7, '#ffffff');
      ell(ctx, ex - 2.1, eyeY - 7.4, 1.2, 1.2, '#ffffff');
      ell(ctx, ex + 2.8, eyeY + 5.6, 1.7, 1.9, '#fff9ec');
      ctx.globalAlpha = 0.6;
      ell(ctx, ex + 4.6, eyeY - 2.2, 0.9, 1.3, '#ffffff');
      ctx.globalAlpha = 1;

      // crease + upper lash with an outward wing
      ctx.globalAlpha = 0.22;
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(ex - s * 7.5, eyeY - 12.8);
      ctx.quadraticCurveTo(ex - s * 0.5, eyeY - 18.6, ex + s * 7, eyeY - 12.4);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = INK;
      ctx.lineWidth = 3.4;
      ctx.beginPath();
      ctx.moveTo(ex - s * 12.2, eyeY - 1.2);
      ctx.quadraticCurveTo(ex - s * 2.2, eyeY - 15.6, ex + s * 11.8, eyeY - 4.2);
      ctx.stroke();
      ctx.lineWidth = 2.3;
      ctx.beginPath();
      ctx.moveTo(ex + s * 10.6, eyeY - 6.8);
      ctx.quadraticCurveTo(ex + s * 15.4, eyeY - 10.2, ex + s * 17, eyeY - 5.6);
      ctx.stroke();
      ctx.lineWidth = 1.7;
      ctx.beginPath();
      ctx.moveTo(ex + s * 12.2, eyeY - 2.6);
      ctx.lineTo(ex + s * 15.6, eyeY - 4.4);
      ctx.stroke();
      // lower lash hint
      ctx.strokeStyle = mixHex(INK, '#ffffff', 0.3);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(ex + s * 7.6, eyeY + 10.4);
      ctx.quadraticCurveTo(ex + s * 10.2, eyeY + 12.2, ex + s * 12, eyeY + 10.6);
      ctx.stroke();
    }
    // brows
    ctx.strokeStyle = c.colors.hairShade;
    ctx.lineWidth = 2.2;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    const browLift = expression === 'worried' ? -4 : expression === 'sad' ? 3 : 0;
    ctx.moveTo(ex - 9, eyeY - 24 + browLift);
    ctx.quadraticCurveTo(ex, eyeY - 29.4 + browLift, ex + 9, eyeY - 23 + browLift);
    ctx.stroke();
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ex - 6, eyeY - 22.4 + browLift);
    ctx.quadraticCurveTo(ex + 1, eyeY - 26 + browLift, ex + 7, eyeY - 21.8 + browLift);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // nose
  ctx.strokeStyle = '#e2a18f';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(cx - 1.8, cy + 18.4);
  ctx.quadraticCurveTo(cx + 0.8, cy + 21, cx + 2.2, cy + 18.2);
  ctx.stroke();
  ctx.globalAlpha = 0.5;
  ell(ctx, cx - 1, cy + 17.6, 1.2, 0.8, '#fff6ef');
  ctx.globalAlpha = 1;

  // mouth
  ctx.strokeStyle = '#a95f68';
  ctx.lineWidth = 2.3;
  ctx.beginPath();
  if (expression === 'happy') {
    const mouth = ctx.createLinearGradient(cx, cy + 26, cx, cy + 40);
    mouth.addColorStop(0, '#a9516a');
    mouth.addColorStop(1, '#c56e82');
    ctx.fillStyle = mouth;
    ctx.ellipse(cx, cy + 31, 8, 7, 0, 0, Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx, cy + 34, 5, 3, 0, 0, Math.PI);
    ctx.fillStyle = '#ffb1b6';
    ctx.fill();
    ctx.globalAlpha = 0.5;
    ell(ctx, cx - 2.4, cy + 33.6, 1.4, 0.9, '#fff');
    ctx.globalAlpha = 1;
  } else if (expression === 'sad') {
    ctx.moveTo(cx - 7, cy + 34);
    ctx.quadraticCurveTo(cx, cy + 26, cx + 7, cy + 34);
    ctx.stroke();
  } else if (expression === 'worried') {
    ctx.moveTo(cx - 5, cy + 31);
    ctx.quadraticCurveTo(cx, cy + 33, cx + 6, cy + 30);
    ctx.stroke();
  } else {
    ctx.moveTo(cx - 7, cy + 29);
    ctx.quadraticCurveTo(cx, cy + 35, cx + 7, cy + 29);
    ctx.stroke();
    ctx.fillStyle = '#ff9aa8';
    ell(ctx, cx, cy + 32.5, 3.2, 1.8);
    ctx.globalAlpha = 0.55;
    ell(ctx, cx - 1.2, cy + 32, 1, 0.6, '#fff');
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

function drawAccessory(ctx: CanvasRenderingContext2D, c: CustomerDef) {
  const a = c.colors.accent;
  ctx.save();
  if (c.accessory === 'star') {
    ctx.translate(178, 76);
    ctx.rotate(0.2);
    ctx.fillStyle = a;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const r = i % 2 === 0 ? 13 : 5.5;
      const ang = (i / 8) * Math.PI * 2;
      const x = Math.cos(ang) * r;
      const y = Math.sin(ang) * r;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ell(ctx, 0, 0, 2.4, 2.4, '#fff5d8');
  } else if (c.accessory === 'beret') {
    ctx.save();
    ctx.translate(127, 58);
    ctx.rotate(-0.12);
    ell(ctx, 0, 3, 58, 23, a, true, 2.6);
    ctx.beginPath();
    ctx.ellipse(20, -4, 41, 16, -0.08, 0, Math.PI * 2);
    ctx.fillStyle = a;
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.6;
    ctx.stroke();
    ctx.strokeStyle = '#c6768c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(-4, -9, 27, Math.PI * 1.12, Math.PI * 1.8);
    ctx.stroke();
    ell(ctx, 38, -20, 4, 7, a, true, 2);
    ctx.restore();
  } else if (c.accessory === 'ribbon') {
    for (const s of [-1, 1] as const) {
      ctx.save();
      ctx.translate(128 + s * 52, 75);
      ctx.rotate(s * 0.25);
      path(ctx, [[-16, 0], [-5, -12], [-6, 12]], a, true, true, 2.2);
      path(ctx, [[16, 0], [5, -12], [6, 12]], a, true, true, 2.2);
      ell(ctx, 0, 0, 6, 6, '#fff0c0', true, 2);
      ctx.restore();
    }
  } else if (c.accessory === 'clip') {
    ctx.translate(178, 78);
    ctx.rotate(0.23);
    for (let i = 0; i < 5; i++) {
      ctx.save();
      ctx.rotate((i / 5) * Math.PI * 2);
      ell(ctx, 0, -10, 6, 10, i % 2 === 0 ? a : '#fff4e4', true, 1.8);
      ctx.restore();
    }
    ell(ctx, 0, 0, 4.2, 4.2, '#ffc75f');
  }
  ctx.restore();
}

function drawCoat(ctx: CanvasRenderingContext2D, c: CustomerDef) {
  const { coat, coatShade, accent } = c.colors;
  ctx.save();
  const coatBody = () => {
    ctx.beginPath();
    ctx.moveTo(12, 256);
    ctx.bezierCurveTo(18, 202, 70, 178, 111, 170);
    ctx.lineTo(145, 170);
    ctx.bezierCurveTo(186, 178, 238, 202, 244, 256);
    ctx.closePath();
  };
  coatBody();
  const coatFill = ctx.createLinearGradient(0, 168, 0, 256);
  coatFill.addColorStop(0, mixHex(coat, '#ffffff', 0.12));
  coatFill.addColorStop(0.5, coat);
  coatFill.addColorStop(1, mixHex(coat, coatShade, 0.45));
  ctx.fillStyle = coatFill;
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.stroke();

  // shoulder seams and soft folds
  ctx.strokeStyle = mixHex(coat, coatShade, 0.6);
  ctx.globalAlpha = 0.45;
  ctx.lineWidth = 1.8;
  for (const s of [-1, 1] as const) {
    ctx.beginPath();
    ctx.moveTo(128 + s * 30, 182);
    ctx.quadraticCurveTo(128 + s * 60, 190, 128 + s * 78, 210);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(128 + s * 48, 204);
    ctx.quadraticCurveTo(128 + s * 67, 218, 128 + s * 74, 240);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // center placket with tiny stitches
  ctx.strokeStyle = mixHex(coat, coatShade, 0.7);
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(128, 212);
  ctx.lineTo(128, 256);
  ctx.stroke();
  ctx.globalAlpha = 0.65;
  ctx.strokeStyle = '#fff8ec';
  ctx.lineWidth = 1;
  ctx.setLineDash([2.2, 2.8]);
  ctx.beginPath();
  ctx.moveTo(124, 216);
  ctx.lineTo(124, 254);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(132, 216);
  ctx.lineTo(132, 254);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;

  // inner collar shadow
  path(ctx, [[111, 170], [128, 200], [145, 170]], coatShade, true, false);
  // neckline
  ctx.beginPath();
  ctx.moveTo(111, 170);
  ctx.quadraticCurveTo(128, 190, 145, 170);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.6;
  ctx.stroke();
  // collar flaps with piping stitches
  path(ctx, [[104, 174], [128, 197], [116, 214], [95, 190]], '#fffaf1', true, true, 2.2);
  path(ctx, [[152, 174], [128, 197], [140, 214], [161, 190]], '#fffaf1', true, true, 2.2);
  ctx.strokeStyle = 'rgba(214, 167, 160, 0.75)';
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 2]);
  path(ctx, [[106, 178], [125, 195], [117, 209], [100, 189]], undefined, true, true, 1);
  path(ctx, [[150, 178], [131, 195], [139, 209], [156, 189]], undefined, true, true, 1);
  ctx.setLineDash([]);

  // patch pocket with embroidery
  ctx.beginPath();
  ctx.moveTo(160, 220);
  ctx.lineTo(190, 220);
  ctx.quadraticCurveTo(192, 242, 185, 246);
  ctx.lineTo(165, 246);
  ctx.quadraticCurveTo(158, 242, 160, 220);
  ctx.closePath();
  ctx.fillStyle = mixHex(coat, '#ffffff', 0.16);
  ctx.fill();
  ctx.strokeStyle = mixHex(coat, coatShade, 0.55);
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255, 250, 242, 0.65)';
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 2.2]);
  ctx.beginPath();
  ctx.moveTo(162, 223);
  ctx.lineTo(188, 223);
  ctx.stroke();
  ctx.setLineDash([]);
  // heart embroidery on the pocket
  ctx.save();
  ctx.translate(175, 235);
  ctx.beginPath();
  ctx.moveTo(0, 4.6);
  ctx.bezierCurveTo(-8.4, -1.2, -4.8, -6.6, 0, -2.1);
  ctx.bezierCurveTo(4.8, -6.6, 8.4, -1.2, 0, 4.6);
  ctx.closePath();
  ctx.fillStyle = accent;
  ctx.fill();
  ctx.restore();
  // tiny flower on the left chest
  ctx.save();
  ctx.translate(100, 234);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    ell(ctx, Math.cos(a) * 4.2, Math.sin(a) * 4.2, 2.4, 2.4, mixHex(accent, '#ffffff', 0.25));
  }
  ell(ctx, 0, 0, 1.8, 1.8, '#ffe7a2');
  ctx.restore();

  // accent ribbon
  if (c.accessory !== 'scarf') {
    path(ctx, [[116, 196], [126, 204], [117, 212]], accent, true, true, 2);
    path(ctx, [[140, 196], [130, 204], [139, 212]], accent, true, true, 2);
    ell(ctx, 128, 204, 5, 5, '#ffe7a2', true, 2);
    ctx.globalAlpha = 0.5;
    ell(ctx, 126.6, 202.6, 1.6, 1.4, '#fff');
    ctx.globalAlpha = 1;
  }
  // buttons
  ell(ctx, 128, 228, 2.4, 2.4, '#c7a798');
  ell(ctx, 128, 242, 2.4, 2.4, '#c7a798');
  if (c.accessory === 'scarf') {
    ctx.save();
    ctx.translate(128, 182);
    ctx.beginPath();
    ctx.ellipse(0, 3, 44, 15, 0, 0, Math.PI * 2);
    ctx.fillStyle = accent;
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.4;
    ctx.stroke();
    path(ctx, [[16, 12], [38, 46], [24, 50], [8, 18]], accent, true, true, 2.2);
    ctx.restore();
  }
  if (c.vip) {
    // little gold pin
    ctx.fillStyle = '#ffd16f';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(166, 204, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ff8fae';
    ctx.beginPath();
    ctx.arc(166, 204, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawPortraitBase(ctx: CanvasRenderingContext2D, c: CustomerDef, expression: Expression = 'smile') {
  const { skin } = c.colors;
  ctx.clearRect(0, 0, 256, 256);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  drawCoat(ctx, c);

  // neck
  path(ctx, [[113, 148], [143, 148], [146, 177], [110, 177]], skin, true, true, 2.6);
  ctx.globalAlpha = 0.25;
  ell(ctx, 128, 158, 15, 8, '#d69786');
  ctx.globalAlpha = 1;

  drawBackHair(ctx, c);

  // ears behind head
  drawEar(ctx, c, -1);
  drawEar(ctx, c, 1);

  // head with a soft radial skin gradient
  ctx.beginPath();
  ctx.ellipse(128, 116, 59, 55, 0, 0, Math.PI * 2);
  const skinFill = ctx.createRadialGradient(108, 90, 8, 128, 120, 82);
  skinFill.addColorStop(0, mixHex(skin, '#ffffff', 0.3));
  skinFill.addColorStop(0.58, skin);
  skinFill.addColorStop(1, mixHex(skin, '#d89984', 0.22));
  ctx.fillStyle = skinFill;
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.stroke();

  // shadow cast by the fringe onto the forehead
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(128, 116, 58, 54, 0, 0, Math.PI * 2);
  ctx.clip();
  const fringeShade = ctx.createLinearGradient(0, 82, 0, 118);
  fringeShade.addColorStop(0, 'rgba(142, 88, 82, 0.24)');
  fringeShade.addColorStop(0.55, 'rgba(160, 104, 94, 0.1)');
  fringeShade.addColorStop(1, 'rgba(160, 104, 94, 0)');
  ctx.fillStyle = fringeShade;
  ctx.fillRect(66, 78, 124, 46);
  ctx.restore();

  // subtle cheek highlight above the blush
  ctx.globalAlpha = 0.16;
  ell(ctx, 101, 103, 13, 7, '#ffffff');
  ell(ctx, 155, 103, 13, 7, '#ffffff');
  ctx.globalAlpha = 1;

  // ear shadow on face
  ctx.globalAlpha = 0.16;
  ell(ctx, 128, 155, 25, 8, '#d89984');
  ctx.globalAlpha = 1;

  drawFeatures(ctx, c, expression, 128, 124, 1);

  drawBangs(ctx, c);

  // side locks with a glossy inner edge
  ctx.save();
  path(ctx, [[78, 98], [69, 148], [82, 174], [90, 158], [83, 120]], c.colors.hair, true, true, 2.4);
  path(ctx, [[178, 98], [187, 148], [174, 174], [166, 158], [173, 120]], c.colors.hair, true, true, 2.4);
  ctx.strokeStyle = mixHex(c.colors.hair, '#ffffff', 0.55);
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 2;
  for (const s of [-1, 1] as const) {
    ctx.beginPath();
    ctx.moveTo(128 + s * 51, 108);
    ctx.quadraticCurveTo(128 + s * 57, 138, 128 + s * 51, 158);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  drawAccessory(ctx, c);

  // tiny sparkle
  ctx.globalAlpha = 0.8;
  ctx.fillStyle = '#fff7d8';
  ctx.beginPath();
  ctx.moveTo(38, 52);
  ctx.lineTo(41, 62);
  ctx.lineTo(51, 65);
  ctx.lineTo(41, 68);
  ctx.lineTo(38, 78);
  ctx.lineTo(35, 68);
  ctx.lineTo(25, 65);
  ctx.lineTo(35, 62);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
}

const portraitCache = new Map<string, string>();
const faceCache = new Map<string, string>();

export function getPortrait(c: CustomerDef, expression: Expression = 'smile'): string {
  const key = `${c.id}-${expression}`;
  const cached = portraitCache.get(key);
  if (cached) return cached;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(2, 2);
  drawPortraitBase(ctx, c, expression);
  const url = canvas.toDataURL('image/png');
  portraitCache.set(key, url);
  return url;
}

export function getFaceTexture(c: CustomerDef, expression: Expression = 'smile'): string {
  const key = `${c.id}-face-${expression}`;
  const cached = faceCache.get(key);
  if (cached) return cached;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(2, 2);
  ctx.translate(128, 128);
  ctx.scale(1.48, 1.48);
  ctx.translate(-128, -122);
  drawFeatures(ctx, c, expression, 128, 124, 1);
  const url = canvas.toDataURL('image/png');
  faceCache.set(key, url);
  return url;
}

export function portraitImg(c: CustomerDef, expression: Expression = 'smile', className = ''): string {
  return `<img class="portrait-img ${className}" src="${getPortrait(c, expression)}" alt="${c.name}" draggable="false" />`;
}
