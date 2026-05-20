/**
 * Spine 2D 骨骼桌面宠（Electron 渲染进程脚本，经 esbuild 打包为 pet-desktop.bundle.js）
 */
import { Application, Assets, Cache } from "pixi.js";
import { Physics } from "@esotericsoftware/spine-core";
import { Spine } from "@esotericsoftware/spine-pixi-v8";
import { normalizeLegacySpineJson } from "./spine-json-legacy.mjs";

const ANIM_LABELS_ZH = {
  aim: "瞄准",
  death: "倒下",
  hoverboard: "悬浮板",
  idle: "待机",
  "idle-turn": "转身待机",
  jump: "跳跃",
  portal: "传送门",
  run: "奔跑",
  "run-to-idle": "跑停",
  shoot: "射击",
  walk: "走路",
};

const SKEL_ALIAS = "desktopPetSkel";
const ATLAS_ALIAS = "desktopPetAtlas";
const VIEW_W = 288;
const VIEW_H = 288;
const AUTO_SWITCH_MS = 6000;
const DRAG_THRESHOLD = 6;

/**
 * Death 等对循环不友好的演示动作，仅从自动轮换中排除。
 */
function useInAutoRotate(name) {
  return name !== "death";
}

function labelForAnimation(name) {
  return ANIM_LABELS_ZH[name] ?? name;
}

function escapeHtml(raw) {
  return String(raw)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
/**
 * 按 Pixi 里实际画出的包围盒缩放、摆位（Spine yDown 时不能用 skeleton.data 的 x/y/width/height 直接居中）。
 * @param {Spine} spine
 * @param {string} [animationName]
 */
function fitSpineInView(spine, animationName) {
  spine.position.set(0, 0);
  spine.scale.set(1);

  spine.skeleton.setupPose();
  const anim =
    animationName ??
    (spine.skeleton.data.findAnimation("idle") ? "idle" : spine.skeleton.data.animations[0]?.name);
  if (anim) {
    spine.state.setAnimation(0, anim, true);
  }
  spine.state.apply(spine.skeleton);
  spine.update(0);

  spine._boundsDirty = true;
  const b = spine.bounds;
  const bw = b.maxX - b.minX;
  const bh = b.maxY - b.minY;

  const pad = 12;
  if (!(bw > 1) || !(bh > 1)) {
    const h = Math.max(spine.skeleton.data.height || 600, 1);
    const scale = (VIEW_H - pad * 2) / h;
    spine.scale.set(scale);
    spine.position.set(VIEW_W / 2, VIEW_H - pad);
    return;
  }

  const scale = Math.min((VIEW_W - pad * 2) / bw, (VIEW_H - pad * 2) / bh);
  spine.scale.set(scale);

  const centerX = (b.minX + b.maxX) / 2;
  spine.x = VIEW_W / 2 - centerX * scale;
  // 脚底对齐画布下缘，避免只露出脚在顶部
  spine.y = VIEW_H - pad - b.maxY * scale;
}

/** @param {Spine} spine */
function prefersLoop(animationName) {
  const once = ["jump", "death", "run-to-idle", "idle-turn", "portal"];
  return !once.includes(animationName);
}

function exposeDesktopChrome() {
  document.documentElement.classList.add("desktop-app");
}

function getDesktopPet() {
  const api = typeof window !== "undefined" ? window.desktopPet : undefined;
  if (!api || !api.startDrag || !api.drag || !api.endDrag) {
    return null;
  }
  return api;
}

async function bootstrap() {
  const params = new URLSearchParams(window.location.search);
  const isDesktopMode =
    params.get("mode") === "desktop" ||
    (typeof window.desktopPet?.isDesktop === "boolean" && window.desktopPet.isDesktop);
  if (!isDesktopMode) {
    return;
  }

  exposeDesktopChrome();

  const petShell = document.querySelector(".pet-shell");
  const petButton = document.querySelector("#petButton");
  const petMount = document.querySelector("#petPixiMount");
  const closeButton = document.querySelector("#closeButton");

  if (!petShell || !petButton || !petMount || !document.body) {
    return;
  }

  const ipc = getDesktopPet();
  let interactionActive = false;
  let interactionMoved = false;
  let dragStarted = false;
  let startClientX = 0;
  let startClientY = 0;
  let startScreenX = 0;
  let startScreenY = 0;

  const SKEL_URL = "./assets/spine/spineboy/spineboy-pro.json";

  Assets.add({
    alias: ATLAS_ALIAS,
    src: "./assets/spine/spineboy/spineboy-pma.atlas",
  });

  /** @type {Application | undefined} */
  let app;

  /** @type {Spine | undefined} */
  let spine;

  try {
    const skelResponse = await fetch(SKEL_URL);
    if (!skelResponse.ok) {
      throw new Error(`HTTP ${skelResponse.status} ${SKEL_URL}`);
    }
    const skelJson = normalizeLegacySpineJson(await skelResponse.json());
    await Assets.load(ATLAS_ALIAS);
    Cache.set(SKEL_ALIAS, skelJson);
  } catch (err) {
    console.error("[desktop-spine] 资源加载失败", err);
    petMount.innerHTML =
      '<p class="pet-load-error">Spine 资源加载失败。<br /><small>请确认已下载 assets/spine/spineboy/</small></p>';
    petButton.setAttribute("aria-label", "Spine 资源加载失败");
    return;
  }

  try {
    app = new Application();
    await app.init({
      width: VIEW_W,
      height: VIEW_H,
      backgroundAlpha: 0,
      antialias: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
      preference: "webgl",
      powerPreference: "high-performance",
    });
  } catch (err) {
    console.error("[desktop-spine] Pixi 初始化失败", err);
    petMount.textContent = "画布初始化失败（WebGL）。请检查是否在远程桌面 / 虚拟机中禁用了 GPU。";
    return;
  }

  petMount.replaceChildren(app.canvas);

  spine = new Spine({
    ...(Spine.createOptions({
      skeleton: SKEL_ALIAS,
      atlas: ATLAS_ALIAS,
      scale: 1,
      autoUpdate: true,
    })),
  });

  app.stage.addChild(spine);

  /** @type {string[]} */
  let animationNames = spine.skeleton.data.animations
    .map((a) => a.name)
    .filter(useInAutoRotate)
    .sort((a, b) => a.localeCompare(b));

  if (animationNames.length === 0) {
    animationNames = spine.skeleton.data.animations.map((a) => a.name).sort((a, b) => a.localeCompare(b));
  }

  const idleName = animationNames.includes("idle") ? "idle" : animationNames[0];
  const sorted = [...animationNames].sort((a, b) => a.localeCompare(b));
  const sequence =
    idleName && sorted.includes(idleName)
      ? [idleName, ...sorted.filter((n) => n !== idleName)]
      : sorted;

  if (sequence.length === 0) {
    petMount.innerHTML =
      '<p class="pet-load-error">该 Spine 数据未包含任何可用动作（animations）。</p>';
    return;
  }

  let currentIndex = 0;

  let autoSwitchTimerId = /** @type {ReturnType<typeof setInterval> | null} */ (null);

  function updateAria(animationName) {
    const zh = labelForAnimation(animationName);
    petShell.dataset.state = animationName;
    petButton.setAttribute("aria-label", `当前动作：${zh}`);
  }

  /** @param {string} name */
  function playNamed(name, loopExplicit) {
    if (!spine) {
      return;
    }

    const loop = loopExplicit ?? prefersLoop(name);
    spine.state.setAnimation(0, name, loop);
    spine.state.apply(spine.skeleton);
    spine.skeleton.updateWorldTransform(Physics.update);

    updateAria(name);
  }

  function advanceSequence() {
    currentIndex = (currentIndex + 1) % sequence.length;
    const name = sequence[currentIndex];
    playNamed(name);
  }

  function stopAutoSwitch() {
    if (autoSwitchTimerId) {
      window.clearInterval(autoSwitchTimerId);
      autoSwitchTimerId = null;
    }
  }

  function startAutoSwitch() {
    stopAutoSwitch();
    autoSwitchTimerId = window.setInterval(() => {
      if (!interactionActive) {
        advanceSequence();
      }
    }, AUTO_SWITCH_MS);
  }

  function finishInteraction(shouldAdvance) {
    if (!interactionActive) {
      return;
    }

    if (ipc) {
      if (dragStarted) {
        ipc.endDrag();
      }
    }

    petShell.classList.remove("dragging");
    interactionActive = false;
    interactionMoved = false;
    dragStarted = false;

    if (shouldAdvance) {
      advanceSequence();
    }

    startAutoSwitch();
  }

  spine.state.clearListeners();

  spine.state.addListener({
    complete: (entry) => {
      const name = entry?.animation?.name ?? "";
      if (!name || name === idleName) {
        return;
      }
      if (!prefersLoop(name) && spine) {
        const idleIdx = sequence.indexOf(idleName);
        currentIndex = idleIdx >= 0 ? idleIdx : 0;
        playNamed(idleName, true);
      }
    },
  });

  petButton.addEventListener("dragstart", (event) => {
    event.preventDefault();
  });

  petButton.addEventListener("mousedown", (event) => {
    if (event.button !== 0) {
      return;
    }

    interactionActive = true;
    interactionMoved = false;
    dragStarted = false;
    startClientX = event.clientX;
    startClientY = event.clientY;
    startScreenX = event.screenX;
    startScreenY = event.screenY;
    petShell.classList.add("dragging");
    stopAutoSwitch();
    event.preventDefault();
  });

  window.addEventListener("mousemove", (event) => {
    if (!interactionActive) {
      return;
    }

    const deltaX = event.clientX - startClientX;
    const deltaY = event.clientY - startClientY;

    if (!interactionMoved && Math.hypot(deltaX, deltaY) > DRAG_THRESHOLD) {
      interactionMoved = true;
    }

    if (!interactionMoved) {
      return;
    }

    if (!ipc) {
      return;
    }

    if (!dragStarted) {
      ipc.startDrag(startScreenX, startScreenY);
      dragStarted = true;
    }

    ipc.drag(event.screenX, event.screenY);
  });

  window.addEventListener("mouseup", (event) => {
    if (event.button !== 0) {
      return;
    }

    finishInteraction(!interactionMoved);
  });

  window.addEventListener("blur", () => {
    finishInteraction(false);
  });

  closeButton?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    ipc?.close();
  });

  const initialAnim = sequence[currentIndex];
  playNamed(initialAnim);
  fitSpineInView(spine, initialAnim);
  startAutoSwitch();
}

bootstrap().catch((err) => {
  console.error("[desktop-spine] 启动失败", err);
  const mount = document.querySelector("#petPixiMount");
  if (mount) {
    const msgRaw =
      typeof err?.message === "string"
        ? err.message
        : typeof err?.toString === "function"
          ? err.toString()
          : "未知错误";
    mount.innerHTML = `<p class="pet-load-error">桌宠启动失败。<br /><small>${escapeHtml(msgRaw)}</small></p>`;
  }
});
