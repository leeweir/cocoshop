import './style.css';
import { Game } from './game/Game';

function plantPetals() {
  const layer = document.getElementById('ui-petals');
  if (!layer) return;
  const count = window.matchMedia('(max-width: 820px)').matches ? 10 : 18;
  for (let i = 0; i < count; i++) {
    const petal = document.createElement('span');
    petal.className = 'petal';
    const size = 7 + Math.random() * 9;
    petal.style.left = `${Math.random() * 100}%`;
    petal.style.setProperty('--size', `${size.toFixed(1)}px`);
    petal.style.setProperty('--duration', `${16 + Math.random() * 14}s`);
    petal.style.setProperty('--delay', `${-Math.random() * 26}s`);
    petal.style.opacity = String(0.32 + Math.random() * 0.36);
    layer.appendChild(petal);
  }
}

function showBootError(message: string) {
  const boot = document.getElementById('boot');
  if (!boot) return;
  boot.classList.remove('is-hidden');
  boot.innerHTML = `
    <div class="boot-mark">
      <div class="boot-name">茶炉熄火了</div>
      <div class="boot-sub">3D 场景没有成功启动</div>
      <p style="max-width:340px;margin:14px 0 0;font-size:13px;line-height:1.7;color:#8d6874">${message}<br />请尝试刷新页面，或换用支持 WebGL 的现代浏览器。</p>
    </div>
  `;
}

async function waitForFonts() {
  if (!('fonts' in document)) return;
  await Promise.race([
    document.fonts.ready,
    new Promise<void>((resolve) => window.setTimeout(resolve, 2200)),
  ]);
}

async function boot() {
  plantPetals();
  await waitForFonts();

  const canvas = document.getElementById('scene');
  if (!(canvas instanceof HTMLCanvasElement)) {
    showBootError('找不到 3D 画布节点。');
    return;
  }

  let game: Game;
  try {
    game = new Game(canvas);
    game.start();
  } catch (error) {
    console.error(error);
    showBootError(error instanceof Error ? error.message : String(error));
    return;
  }

  if (import.meta.hot) {
    import.meta.hot.dispose(() => game.stop());
  }

  // Let the first frames settle before lifting the curtain.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const bootScreen = document.getElementById('boot');
      if (!bootScreen) return;
      bootScreen.classList.add('is-hidden');
      window.setTimeout(() => bootScreen.remove(), 700);
    });
  });
}

void boot();
