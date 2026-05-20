/**
 * assets/export 清单：body/ 替换 SVG 整图，details/ 仅眉眼嘴等动画零件
 */

export const EXPORT_MANIFEST_URL = "./assets/export/manifest.json";

/** @typedef {'body' | 'detail'} LayerRole */
/** @typedef {{ file: string; src: string; z: number; id: string; poses: string; role: LayerRole }} ExportLayerEntry */
/** @typedef {{ version: number; layers: ExportLayerEntry[] }} ExportManifest */

export { DETAIL_ONLY_IDS } from "./character-png-layers.mjs";

/** @returns {Promise<ExportManifest | null>} */
export async function loadExportManifest() {
  try {
    const res = await fetch(EXPORT_MANIFEST_URL);
    if (!res.ok) {
      return null;
    }
    const data = await res.json();
    if (!data || !Array.isArray(data.layers)) {
      return null;
    }
    return /** @type {ExportManifest} */ ({
      version: data.version ?? 1,
      layers: data.layers,
    });
  } catch {
    return null;
  }
}

/** @param {ExportLayerEntry[]} layers */
export function sharedBodyLayers(layers) {
  return layers
    .filter((e) => e.role === "body" && e.poses === "*")
    .sort((a, b) => a.z - b.z || a.id.localeCompare(b.id));
}

/** @param {ExportLayerEntry[]} layers */
export function sharedDetailLayers(layers) {
  return layers
    .filter((e) => e.role === "detail" && e.poses === "*")
    .sort((a, b) => a.z - b.z || a.id.localeCompare(b.id));
}

/** @param {HTMLElement} layer */
export function ensureLayerStack(layer) {
  let stack = layer.querySelector(".pet-layer-stack");
  if (stack) {
    return stack;
  }

  stack = document.createElement("div");
  stack.className = "pet-layer-stack";

  const poseBody = document.createElement("div");
  poseBody.className = "pet-pose-body";

  const svgBackdrop = document.createElement("div");
  svgBackdrop.className = "pet-svg-backdrop";
  while (layer.firstChild) {
    svgBackdrop.appendChild(layer.firstChild);
  }

  poseBody.appendChild(svgBackdrop);
  stack.appendChild(poseBody);
  layer.appendChild(stack);
  return stack;
}
