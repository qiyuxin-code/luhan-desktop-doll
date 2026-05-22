/**
 * 桌宠显示尺寸与各姿势内容裁剪（viewBox），与 pet-layout.json 同步
 */
import layout from "../pet-layout.json";

export const PET_DISPLAY_WIDTH = layout.displayWidth;
export const JUMP_HEADROOM = layout.jumpHeadroom;

/** @typedef {{ x: number, y: number, w: number, h: number }} ContentBox */

/** @type {Record<string, ContentBox>} */
export const POSE_CONTENT_BOX = layout.poses;

/** @param {string} poseKey */
export function poseDisplayHeight(poseKey) {
  const box = POSE_CONTENT_BOX[poseKey];
  if (!box) {
    return PET_DISPLAY_WIDTH;
  }
  return Math.round((PET_DISPLAY_WIDTH * box.h) / box.w);
}

export function maxPoseDisplayHeight() {
  return Math.max(
    ...Object.keys(POSE_CONTENT_BOX).map((key) => poseDisplayHeight(key))
  );
}

/** @param {SVGSVGElement} svg @param {string} poseKey */
export function applyPoseContentViewBox(svg, poseKey) {
  const box = POSE_CONTENT_BOX[poseKey];
  if (!box) {
    return;
  }
  svg.setAttribute("viewBox", `${box.x} ${box.y} ${box.w} ${box.h}`);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
}

/** @param {SVGSVGElement} svg @param {string} poseKey */
export function applyPoseSvgSize(svg, poseKey) {
  const w = PET_DISPLAY_WIDTH;
  const h = poseDisplayHeight(poseKey);
  svg.removeAttribute("width");
  svg.removeAttribute("height");
  svg.setAttribute("width", String(w));
  svg.setAttribute("height", String(h));
  svg.style.width = `${w}px`;
  svg.style.height = `${h}px`;
  svg.style.maxWidth = "none";
  svg.style.maxHeight = "none";
  svg.style.display = "block";
  svg.style.overflow = "visible";
}

/** @param {HTMLElement} layer @param {string} poseKey */
export function applyPoseLayerSize(layer, poseKey) {
  const w = PET_DISPLAY_WIDTH;
  const h = poseDisplayHeight(poseKey);
  layer.style.width = `${w}px`;
  layer.style.height = `${h}px`;
}

/** @param {HTMLElement} shell @param {string} poseKey */
export function applyPoseShellSize(shell, poseKey) {
  const w = PET_DISPLAY_WIDTH;
  const h = poseDisplayHeight(poseKey);
  shell.style.width = `${w}px`;
  shell.style.height = `${h}px`;
  const button = shell.querySelector(".pet-button");
  const mount = shell.querySelector("#petPixiMount");
  button?.style.setProperty("width", `${w}px`);
  button?.style.setProperty("height", `${h}px`);
  mount?.style.setProperty("width", `${w}px`);
  mount?.style.setProperty("height", `${h}px`);
}

/** @param {SVGSVGElement} svg @param {HTMLElement} layer @param {string} poseKey */
export function applyPoseLayout(svg, layer, poseKey) {
  applyPoseContentViewBox(svg, poseKey);
  applyPoseSvgSize(svg, poseKey);
  applyPoseLayerSize(layer, poseKey);
}
