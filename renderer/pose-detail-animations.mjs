/**
 * 动作细节动画 class（作用于 .pet-detail-overlay 内的 SVG <image>）
 */

export const DETAIL_ANIM_BY_LAYER = {
  "face-brow-l": "detail-anim-brow",
  "face-brow-r": "detail-anim-brow",
  "face-eye-l": "detail-anim-blink",
  "face-eye-r": "detail-anim-blink",
  "face-mouth": "detail-anim-mouth-idle",
  "face-mouth-open": "detail-anim-mouth-sing",
};

/** @param {ParentNode} root */
export function applyDetailAnimationClasses(root) {
  root.querySelectorAll(".pet-detail-layer, image.pet-detail-layer").forEach((node) => {
    const layerId = node.dataset?.layer;
    const animClass = layerId ? DETAIL_ANIM_BY_LAYER[layerId] : undefined;
    if (animClass) {
      node.classList.add(animClass);
    }
  });
}
