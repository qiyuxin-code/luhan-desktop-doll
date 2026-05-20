#!/usr/bin/env node
/**
 * assets/export/
 *   body/     → 全身分层，替换 SVG 内嵌整图（全姿势通用，同 2048 画布）
 *   details/  → 仅眉眼嘴等动画零件（叠在 body 之上）
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const EXPORT_DIR = path.join(ROOT, "assets", "export");
const LAYERS_DIR = path.join(ROOT, "assets", "layers");
const MANIFEST_PATH = path.join(EXPORT_DIR, "manifest.json");
const FIX_ALPHA = path.join(ROOT, "scripts", "fix-export-png-alpha.py");

const POSE_KEYS = new Set([
  "idle-sit",
  "action-sing",
  "action-pat",
  "action-jump",
  "jump",
  "bubble",
  "flower",
  "sit3",
]);

const DETAIL_ONLY_IDS = new Set([
  "face-eye-l",
  "face-eye-r",
  "face-brow-l",
  "face-brow-r",
  "face-mouth",
  "face-mouth-open",
  "face-blush",
]);

const LAYER_Z = {
  shadow: 10,
  "hair-back": 20,
  "body-legs": 30,
  "arm-back": 40,
  "body-upper": 50,
  neck: 60,
  "head-base": 70,
  "face-eye-l": 80,
  "face-eye-r": 81,
  "face-brow-l": 82,
  "face-brow-r": 83,
  "face-mouth": 90,
  "face-blush": 91,
  "hair-front": 100,
  "arm-front-l": 110,
  "arm-front-r": 111,
  "hand-l": 120,
  "hand-r": 121,
};

function parseLayerBasename(basename) {
  const stem = basename.replace(/\.png$/i, "");
  const m = stem.match(/^(\d+)[_-](.+)$/);
  if (m) {
    return { z: Number(m[1]), id: m[2] };
  }
  if (LAYER_Z[stem] !== undefined) {
    return { z: LAYER_Z[stem], id: stem };
  }
  return null;
}

function scanPngDir({ dir, poses, role, assetBase, pathPrefix }) {
  const out = [];
  if (!fs.existsSync(dir)) {
    return out;
  }
  for (const name of fs.readdirSync(dir)) {
    if (!name.toLowerCase().endsWith(".png")) {
      continue;
    }
    const full = path.join(dir, name);
    if (!fs.statSync(full).isFile()) {
      continue;
    }
    const parsed = parseLayerBasename(name);
    if (!parsed) {
      console.warn(`[scan-export] 跳过无法解析: ${full}`);
      continue;
    }
    if (role === "detail" && !DETAIL_ONLY_IDS.has(parsed.id)) {
      console.warn(
        `[scan-export] 「${parsed.id}」应放在 body/ 而非 details/: ${name}`
      );
      continue;
    }
    const rel = `${pathPrefix}/${name}`;
    out.push({
      file: rel,
      src: `${assetBase}/${rel}`,
      z: parsed.z,
      id: parsed.id,
      poses,
      role,
    });
  }
  return out;
}

function scanPoseTree(poseDir, poseKey, assetBase) {
  let layers = [];
  for (const sub of ["body", "details"]) {
    const dir = path.join(poseDir, sub);
    if (!fs.existsSync(dir)) {
      continue;
    }
    layers = layers.concat(
      scanPngDir({
        dir,
        poses: poseKey,
        role: sub === "body" ? "body" : "detail",
        assetBase,
        pathPrefix: `${poseKey}/${sub}`,
      })
    );
  }
  return layers;
}

function main() {
  fs.mkdirSync(EXPORT_DIR, { recursive: true });
  const sortScript = path.join(ROOT, "scripts", "sort-export-pngs.mjs");
  if (fs.existsSync(sortScript)) {
    spawnSync("node", [sortScript], { cwd: ROOT, stdio: "inherit" });
  }
  if (fs.existsSync(FIX_ALPHA)) {
    spawnSync("python3", [FIX_ALPHA], { cwd: ROOT, stdio: "inherit" });
  }

  let layers = [];

  const sharedBody = path.join(EXPORT_DIR, "body");
  const sharedDetails = path.join(EXPORT_DIR, "details");
  if (fs.existsSync(sharedBody)) {
    layers = layers.concat(
      scanPngDir({
        dir: sharedBody,
        poses: "*",
        role: "body",
        assetBase: "./assets/export",
        pathPrefix: "body",
      })
    );
  }
  if (fs.existsSync(sharedDetails)) {
    layers = layers.concat(
      scanPngDir({
        dir: sharedDetails,
        poses: "*",
        role: "detail",
        assetBase: "./assets/export",
        pathPrefix: "details",
      })
    );
  }

  for (const name of fs.readdirSync(EXPORT_DIR)) {
    if (name === "body" || name === "details") {
      continue;
    }
    const sub = path.join(EXPORT_DIR, name);
    if (!fs.statSync(sub).isDirectory()) {
      continue;
    }
    if (!POSE_KEYS.has(name)) {
      console.warn(`[scan-export] 未知目录: ${name}`);
    }
    layers = layers.concat(scanPoseTree(sub, name, "./assets/export"));
  }

  layers.sort(
    (a, b) =>
      (a.role === "body" ? 0 : 1) - (b.role === "body" ? 0 : 1) ||
      a.z - b.z ||
      a.id.localeCompare(b.id)
  );

  fs.writeFileSync(
    MANIFEST_PATH,
    `${JSON.stringify(
      { version: 4, generatedAt: new Date().toISOString(), layers },
      null,
      2
    )}\n`
  );
  const bodyN = layers.filter((l) => l.role === "body").length;
  const detailN = layers.filter((l) => l.role === "detail").length;
  console.log(`[scan-export] body=${bodyN} detail=${detailN} → ${MANIFEST_PATH}`);
}

main();
