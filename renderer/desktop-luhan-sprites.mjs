/**
 * 鹿晗桌宠：内嵌 SVG + CSS 动画（保留 SVG 内叠加层动画，路线 1）
 * 说明：Pixi 贴图会丢掉 <animate>；Chromium 也不执行 SVG SMIL，故用 DOM + luhan-svg-animations.css
 */
const VIEW_W = 288;
const VIEW_H = 288;
const CROSSFADE_MS = 380;
const AUTO_SWITCH_MS = 6000;
const DRAG_THRESHOLD = 6;

/** @type {{ key: string; src: string; label: string; hasOverlayAnimation?: boolean }[]} */
const POSES = [
  { key: "idle-sit", src: "./assets/idle-sit.svg", label: "待机" },
  { key: "action-sing", src: "./assets/action-sing.svg", label: "唱歌", hasOverlayAnimation: true },
  { key: "action-pat", src: "./assets/action-pat.svg", label: "摸头", hasOverlayAnimation: true },
  { key: "action-jump", src: "./assets/action-jump.svg", label: "跳起" },
  { key: "jump", src: "./assets/jump.svg", label: "跳跃", hasOverlayAnimation: true },
  { key: "bubble", src: "./assets/bubble.svg", label: "泡泡", hasOverlayAnimation: true },
  { key: "flower", src: "./assets/flower.svg", label: "拿花", hasOverlayAnimation: true },
  { key: "sit3", src: "./assets/sit3.svg", label: "托腮", hasOverlayAnimation: true },
];

function escapeHtml(raw) {
  return String(raw)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
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

/** @param {HTMLElement} layer @param {string} poseKey */
function normalizeInjectedSvg(layer, poseKey) {
  const svg = layer.querySelector("svg");
  if (!svg) {
    return;
  }
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "100%");
  svg.style.display = "block";
  svg.style.maxWidth = "100%";
  svg.style.maxHeight = "100%";
  svg.style.overflow = "visible";

  // Chromium 不跑 SMIL；bubble 圆点上的 opacity="0" 会盖掉 CSS 动画
  if (poseKey === "bubble") {
    layer.querySelectorAll(".pet-bubble, .pet-bubble-highlight").forEach((el) => {
      el.removeAttribute("opacity");
    });
  }

  layer.querySelectorAll("animate, animateTransform").forEach((el) => el.remove());
}

/** @param {HTMLElement} layer @param {string} src @param {string} poseKey */
async function loadSvgIntoLayer(layer, src, poseKey) {
  const response = await fetch(src);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${src}`);
  }
  layer.innerHTML = await response.text();
  normalizeInjectedSvg(layer, poseKey);
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

  if (!petShell || !petButton || !petMount) {
    return;
  }

  petMount.classList.add("pet-svg-stage");

  const ipc = getDesktopPet();
  let interactionActive = false;
  let interactionMoved = false;
  let dragStarted = false;
  let startClientX = 0;
  let startClientY = 0;
  let startScreenX = 0;
  let startScreenY = 0;

  /** @type {HTMLElement[]} */
  const layers = POSES.map((pose) => {
    const layer = document.createElement("div");
    layer.className = "pet-svg-layer";
    layer.dataset.pose = pose.key;
    layer.hidden = true;
    layer.style.opacity = "0";
    petMount.appendChild(layer);
    return layer;
  });

  try {
    await Promise.all(
      POSES.map((pose, index) => loadSvgIntoLayer(layers[index], pose.src, pose.key))
    );
  } catch (err) {
    console.error("[desktop-luhan] SVG 加载失败", err);
    petMount.innerHTML =
      '<p class="pet-load-error">鹿晗 SVG 加载失败。<br /><small>请确认 assets/*.svg 存在</small></p>';
    petButton.setAttribute("aria-label", "SVG 加载失败");
    return;
  }

  let currentIndex = 0;
  let fading = false;
  let fadeElapsed = 0;
  /** @type {HTMLElement | null} */
  let fadeFrom = null;
  /** @type {HTMLElement | null} */
  let fadeTo = null;
  let fadeRafId = 0;
  let autoSwitchTimerId = /** @type {ReturnType<typeof setInterval> | null} */ (null);

  function updateAria(index) {
    const pose = POSES[index];
    petShell.dataset.state = pose.key;
    petButton.setAttribute("aria-label", `当前动作：${pose.label}`);
  }

  /** @param {HTMLElement | null} except */
  function hideAllExcept(except) {
    for (const layer of layers) {
      if (layer !== except) {
        layer.classList.remove("is-active");
        layer.hidden = true;
        layer.style.opacity = "0";
      }
    }
  }

  /** @param {number} index */
  function showPoseImmediate(index) {
    const layer = layers[index];
    hideAllExcept(layer);
    layer.hidden = false;
    layer.classList.add("is-active");
    layer.style.opacity = "1";
    currentIndex = index;
    updateAria(index);
  }

  function stopFadeRaf() {
    if (fadeRafId) {
      cancelAnimationFrame(fadeRafId);
      fadeRafId = 0;
    }
  }

  /** @param {number} time */
  function onFadeFrame(time) {
    if (!fadeFrom || !fadeTo || !fading) {
      return;
    }
    if (!fadeElapsed) {
      fadeElapsed = time;
    }
    const t = Math.min((time - fadeElapsed) / CROSSFADE_MS, 1);
    fadeFrom.style.opacity = String(1 - t);
    fadeTo.style.opacity = String(t);
    if (t >= 1) {
      hideAllExcept(fadeTo);
      fadeTo.style.opacity = "1";
      currentIndex = layers.indexOf(fadeTo);
      fading = false;
      fadeFrom = null;
      fadeTo = null;
      fadeElapsed = 0;
      stopFadeRaf();
      return;
    }
    fadeRafId = requestAnimationFrame(onFadeFrame);
  }

  /** @param {number} nextIndex */
  function transitionTo(nextIndex) {
    if (nextIndex === currentIndex && !fading) {
      return;
    }
    if (fading) {
      stopFadeRaf();
      if (fadeTo) {
        hideAllExcept(fadeTo);
        fadeTo.style.opacity = "1";
        fadeTo.classList.add("is-active");
        currentIndex = layers.indexOf(fadeTo);
      }
      fading = false;
      fadeFrom = null;
      fadeTo = null;
      fadeElapsed = 0;
    }

    const from = layers[currentIndex];
    const to = layers[nextIndex];
    from.hidden = false;
    to.hidden = false;
    from.classList.add("is-active");
    to.classList.add("is-active");
    to.style.opacity = "0";
    from.style.opacity = "1";

    fadeFrom = from;
    fadeTo = to;
    fading = true;
    fadeElapsed = 0;
    updateAria(nextIndex);
    stopFadeRaf();
    fadeRafId = requestAnimationFrame(onFadeFrame);
  }

  function advancePose() {
    transitionTo((currentIndex + 1) % POSES.length);
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
      if (!interactionActive && !fading) {
        advancePose();
      }
    }, AUTO_SWITCH_MS);
  }

  function finishInteraction(shouldAdvance) {
    if (!interactionActive) {
      return;
    }
    if (ipc && dragStarted) {
      ipc.endDrag();
    }
    petShell.classList.remove("dragging");
    interactionActive = false;
    interactionMoved = false;
    dragStarted = false;
    if (shouldAdvance) {
      advancePose();
    }
    startAutoSwitch();
  }

  petButton.addEventListener("dragstart", (e) => e.preventDefault());

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
    if (!interactionMoved || !ipc) {
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

  window.addEventListener("blur", () => finishInteraction(false));

  closeButton?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    ipc?.close();
  });

  showPoseImmediate(0);
  startAutoSwitch();
}

bootstrap().catch((err) => {
  console.error("[desktop-luhan] 启动失败", err);
  const mount = document.querySelector("#petPixiMount");
  if (mount) {
    const msg =
      typeof err?.message === "string"
        ? err.message
        : typeof err?.toString === "function"
          ? err.toString()
          : "未知错误";
    mount.innerHTML = `<p class="pet-load-error">桌宠启动失败。<br /><small>${escapeHtml(msg)}</small></p>`;
  }
});
