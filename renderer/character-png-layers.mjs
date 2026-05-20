/**
 * 全姿势通用的 PNG 分层（2048 同画布对齐）
 * - body：替换 SVG 内嵌整图，按 z 从下到上叠
 * - detail：叠在 body 之上，仅眉眼嘴等可播 CSS 动画的零件
 */

import { applyDetailAnimationClasses } from "./pose-detail-animations.mjs";

/** 只允许放进 export/details/ 的层（其余应放 export/body/） */
export const DETAIL_ONLY_IDS = new Set([
  "face-eye-l",
  "face-eye-r",
  "face-brow-l",
  "face-brow-r",
  "face-mouth",
  "face-mouth-open",
  "face-blush",
]);

/** @typedef {{ file: string; src: string; z: number; id: string; role: string }} PngLayerEntry */

/**
 * @param {SVGSVGElement} svg
 */
export function hideEmbeddedCharacterRaster(svg) {
  const img = svg.querySelector(":scope > image");
  if (img) {
    img.setAttribute("visibility", "hidden");
    img.setAttribute("aria-hidden", "true");
  }
}

/**
 * @param {SVGSVGElement} svg
 * @returns {{ viewBox: string; x: number; y: number; w: number; h: number } | null}
 */
export function readSvgImageFrame(svg) {
  const viewBox = svg.getAttribute("viewBox");
  const img = svg.querySelector(":scope > image, image");
  if (!viewBox || !img) {
    return null;
  }
  return {
    viewBox,
    x: Number(img.getAttribute("x") || 0),
    y: Number(img.getAttribute("y") || 0),
    w: Number(img.getAttribute("width") || 0),
    h: Number(img.getAttribute("height") || 0),
  };
}

/**
 * @param {HTMLElement} poseLayer
 * @param {{ viewBox: string; x: number; y: number; w: number; h: number }} frame
 * @param {PngLayerEntry[]} bodyLayers
 * @param {PngLayerEntry[]} detailLayers
 */
export function mountCharacterPngLayers(poseLayer, frame, bodyLayers, detailLayers) {
  const stack = poseLayer.querySelector(".pet-layer-stack");
  if (!stack || (!bodyLayers.length && !detailLayers.length)) {
    return;
  }

  const backdrop = poseLayer.querySelector(".pet-svg-backdrop svg");
  if (backdrop && bodyLayers.length) {
    hideEmbeddedCharacterRaster(backdrop);
    poseLayer.classList.add("uses-png-body");
  }

  let overlay = poseLayer.querySelector(".pet-png-overlay");
  if (!overlay) {
    overlay = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    overlay.classList.add("pet-png-overlay");
    overlay.setAttribute("aria-hidden", "true");
    stack.appendChild(overlay);
  }

  overlay.setAttribute("viewBox", frame.viewBox);
  overlay.replaceChildren();

  const all = [
    ...bodyLayers.map((e) => ({ ...e, kind: "body" })),
    ...detailLayers.map((e) => ({ ...e, kind: "detail" })),
  ].sort((a, b) => a.z - b.z || a.id.localeCompare(b.id));

  for (const entry of all) {
    const img = document.createElementNS("http://www.w3.org/2000/svg", "image");
    img.classList.add(
      entry.kind === "detail" ? "pet-detail-layer" : "pet-body-png-layer"
    );
    img.setAttribute("href", entry.src);
    img.setAttribute("x", String(frame.x));
    img.setAttribute("y", String(frame.y));
    img.setAttribute("width", String(frame.w));
    img.setAttribute("height", String(frame.h));
    img.dataset.layer = entry.id;
    img.dataset.z = String(entry.z);
    overlay.appendChild(img);
  }

  applyDetailAnimationClasses(overlay);
  poseLayer.classList.toggle("has-png-body", bodyLayers.length > 0);
  poseLayer.classList.toggle("has-png-details", detailLayers.length > 0);
}

/** @param {HTMLElement | null} activeLayer */
export function setCharacterDetailsPlaying(activeLayer) {
  document.querySelectorAll(".pet-png-overlay.is-playing").forEach((el) => {
    el.classList.remove("is-playing");
  });
  const overlay = activeLayer?.querySelector(".pet-png-overlay");
  if (overlay && activeLayer?.classList.contains("has-png-details")) {
    overlay.classList.add("is-playing");
  }
}
