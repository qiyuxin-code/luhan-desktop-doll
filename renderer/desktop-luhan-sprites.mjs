import {
  PET_DISPLAY_WIDTH,
  applyPoseShellSize,
  poseDisplayHeight,
} from "./pet-layout.mjs";

const DRAG_THRESHOLD = 6;
const FRAME_DURATION = 250; // default ms per frame
const DEFAULT_POSE = "sit-stand";
const DEFAULT_POSE_PAUSE_MS = 15000;

const POSE_FRAME_DURATIONS = {
  "sit-stand": 450,
  "bubble-list": 250,
  "flower-list": 250,
  "haha": 250,
  "xuanzhuan": 250,
  "sing": 250,
};

// Frame sequences
const SIT_STAND_FRAMES = [
  "./assets/sit-stand/frame_1_直立.png",
  "./assets/sit-stand/frame_2_歪头.png",
  "./assets/sit-stand/frame_3_恢复直立.png",
];

const BUBBLE_FRAMES = [
  "./assets/bubble-list/frame_1_准备吹气.png",
  "./assets/bubble-list/frame_2_正在吹气.png",
  "./assets/bubble-list/frame_3_泡泡形成.png",
  "./assets/bubble-list/frame_4_泡泡飘走.png",
  "./assets/bubble-list/frame_5_恢复准备.png",
];

const FLOWER_FRAMES = [
  "./assets/flower-list/闻花动画_帧1_初始站立.png",
  "./assets/flower-list/闻花动画_帧2_开始低头.png",
  "./assets/flower-list/闻花动画_帧3_低头闻花.png",
  "./assets/flower-list/闻花动画_帧4_抬头回正.png",
  "./assets/flower-list/闻花动画_帧5_取出一朵花.png",
  "./assets/flower-list/闻花动画_帧6_递花给我们.png",
];

const HAHA_FRAMES = [
  "./assets/haha/手臂动画_1.png",
  "./assets/haha/手臂动画_2.png",
  "./assets/haha/手臂动画_3.png",
  "./assets/haha/手臂动画_4.png",
  "./assets/haha/手臂动画_5.png",
  "./assets/haha/手臂动画_6.png",
];
const XUAN_ZHUAN_FRAMES = [
  "./assets/xuanzhuan/frame_1_正面_0度.png",
  "./assets/xuanzhuan/frame_2_右前方_45度.png",
  "./assets/xuanzhuan/frame_3_右侧面_90度.png",
  "./assets/xuanzhuan/frame_4_右后方_135度.png",
  "./assets/xuanzhuan/frame_5_背面_180度.png",
  "./assets/xuanzhuan/frame_6_左后方_225度.png",
  "./assets/xuanzhuan/frame_7_左侧面_270度.png",
  "./assets/xuanzhuan/frame_8_左前方_315度.png",
];

const SING_FRAMES = [
  "./assets/sing/唱歌动画_帧3_mic最远.png",
  "./assets/sing/唱歌动画_帧4_mic回拉.png",
  "./assets/sing/唱歌动画_帧5_mic再靠近.png",
  "./assets/sing/唱歌动画_帧6_mic再稍远.png",
  "./assets/sing/唱歌动画_帧7_mic再最远.png",
  "./assets/sing/唱歌动画_帧8_mic回近结束.png",
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

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`加载图片失败: ${src}`));
  });
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
  document.documentElement.style.setProperty("--pet-display-w", `${PET_DISPLAY_WIDTH}px`);

  const ipc = getDesktopPet();
  let interactionActive = false;
  let interactionMoved = false;
  let dragStarted = false;
  let startClientX = 0;
  let startClientY = 0;
  let startScreenX = 0;
  let startScreenY = 0;

  // Clear existing items in petMount and prepare Canvas
  petMount.innerHTML = "";
  const canvas = document.createElement("canvas");
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.display = "block";
  petMount.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  // Make canvas high-DPI crisp
  canvas.width = PET_DISPLAY_WIDTH * dpr;
  canvas.height = PET_DISPLAY_WIDTH * dpr;
  ctx.scale(dpr, dpr);

  // Preloading all assets
  petButton.setAttribute("aria-label", "正在加载动画素材...");
  const animImages = {
    "sit-stand": [],
    "bubble-list": [],
    "flower-list": [],
    "haha": [],
    "xuanzhuan": [],
    "sing": []
  };

  try {
    const [sitStandImgs, bubbleImgs, flowerImgs, hahaImgs, xzImgs, singImgs] = await Promise.all([
      Promise.all(SIT_STAND_FRAMES.map(loadImage)),
      Promise.all(BUBBLE_FRAMES.map(loadImage)),
      Promise.all(FLOWER_FRAMES.map(loadImage)),
      Promise.all(HAHA_FRAMES.map(loadImage)),
      Promise.all(XUAN_ZHUAN_FRAMES.map(loadImage)),
      Promise.all(SING_FRAMES.map(loadImage))
    ]);

    animImages["sit-stand"] = sitStandImgs;
    animImages["bubble-list"] = bubbleImgs;
    animImages["flower-list"] = flowerImgs;
    animImages["haha"] = hahaImgs;
    animImages["xuanzhuan"] = xzImgs;
    animImages["sing"] = singImgs;
  } catch (err) {
    console.error("[desktop-luhan] 动画素材加载失败", err);
    petMount.innerHTML =
      `<p class="pet-load-error">鹿晗 动画素材加载失败。<br /><small>${escapeHtml(err.message)}</small></p>`;
    petButton.setAttribute("aria-label", "素材加载失败");
    return;
  }

  let currentPose = DEFAULT_POSE;
  let currentFrame = 0;
  let lastFrameTime = 0;
  let defaultPosePauseUntil = 0;

  function getFrameCount(pose) {
    if (pose === "sit-stand") return 3;
    if (pose === "bubble-list") return 5;
    if (pose === "flower-list") return 6;
    if (pose === "haha") return 6;
    if (pose === "xuanzhuan") return 8;
    if (pose === "sing") return 6;
    return 0;
  }

  function drawFrame(poseKey, frameIndex) {
    const height = poseDisplayHeight(poseKey);
    ctx.clearRect(0, 0, PET_DISPLAY_WIDTH, height);

    if (poseKey === "sit-stand" || poseKey === "bubble-list" || poseKey === "flower-list" || poseKey === "haha" || poseKey === "xuanzhuan" || poseKey === "sing") {
      const frames = animImages[poseKey];
      if (!frames || !frames[frameIndex]) return;
      const img = frames[frameIndex];
      ctx.drawImage(img, 0, 0, PET_DISPLAY_WIDTH, height);
    }
  }

  function changePose(newPose) {
    const validPoses = ["sit-stand", "bubble-list", "haha", "xuanzhuan", "flower-list", "sing"];
    if (!validPoses.includes(newPose)) return;

    currentPose = newPose;
    currentFrame = 0;
    lastFrameTime = 0;
    defaultPosePauseUntil = 0;
    petShell.dataset.state = newPose;
    petButton.setAttribute("aria-label", `当前动作：${newPose}`);
    applyPoseShellSize(petShell, newPose);

    // Dynamic resize of canvas to match active pose aspect ratio
    const height = poseDisplayHeight(newPose);
    canvas.width = PET_DISPLAY_WIDTH * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0); // reset scale transform
    ctx.scale(dpr, dpr);

    drawFrame(currentPose, currentFrame);
  }

  function restartDefaultPose() {
    if (currentPose !== DEFAULT_POSE) {
      return;
    }
    currentFrame = 0;
    lastFrameTime = 0;
    defaultPosePauseUntil = 0;
    drawFrame(currentPose, currentFrame);
  }

  function animLoop(timestamp) {
    if (!lastFrameTime) {
      lastFrameTime = timestamp;
    }

    const elapsed = timestamp - lastFrameTime;
    const frameCount = getFrameCount(currentPose);
    const duration = POSE_FRAME_DURATIONS[currentPose] || FRAME_DURATION;

    if (currentPose === DEFAULT_POSE && defaultPosePauseUntil) {
      if (timestamp < defaultPosePauseUntil) {
        requestAnimationFrame(animLoop);
        return;
      }
      defaultPosePauseUntil = 0;
      currentFrame = 0;
      lastFrameTime = timestamp;
      drawFrame(currentPose, currentFrame);
      requestAnimationFrame(animLoop);
      return;
    }

    if (elapsed >= duration) {
      if (currentPose !== DEFAULT_POSE && currentFrame >= frameCount - 1) {
        changePose(DEFAULT_POSE);
        requestAnimationFrame(animLoop);
        return;
      }
      if (currentPose === DEFAULT_POSE && currentFrame >= frameCount - 1) {
        defaultPosePauseUntil = timestamp + DEFAULT_POSE_PAUSE_MS;
        lastFrameTime = timestamp;
        requestAnimationFrame(animLoop);
        return;
      }
      currentFrame = (currentFrame + 1) % frameCount;
      drawFrame(currentPose, currentFrame);
      lastFrameTime = timestamp - (elapsed % duration);
    }

    requestAnimationFrame(animLoop);
  }

  function finishInteraction() {
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
  }

  // Set up listeners
  petButton.addEventListener("dragstart", (e) => e.preventDefault());

  petButton.addEventListener("mouseenter", () => {
    restartDefaultPose();
  });

  petButton.addEventListener("mousedown", (event) => {
    if (event.button === 2) {
      // Right click handled by contextmenu event
      return;
    }
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
    finishInteraction();
  });

  window.addEventListener("blur", () => finishInteraction());

  // Show Electron native context menu on right click
  petButton.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    if (ipc && typeof ipc.showMenu === "function") {
      ipc.showMenu(event.screenX, event.screenY);
    }
  });

  // Listen to IPC pose changes from context menu
  if (ipc && typeof ipc.onPoseChange === "function") {
    ipc.onPoseChange((newPose) => {
      changePose(newPose);
    });
  }

  closeButton?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    ipc?.close();
  });

  // Initialize
  changePose(DEFAULT_POSE);
  requestAnimationFrame(animLoop);
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
