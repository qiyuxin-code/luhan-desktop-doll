#!/usr/bin/env node
/**
 * 把 export 里散落的 PNG 自动放进 body/ 或 details/
 * 依据文件名里的层 ID（face-eye-l、body-upper…）
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const EXPORT_DIR = path.join(ROOT, "assets", "export");
const BODY_DIR = path.join(EXPORT_DIR, "body");
const DETAILS_DIR = path.join(EXPORT_DIR, "details");

const DETAIL_IDS = new Set([
  "face-eye-l",
  "face-eye-r",
  "face-brow-l",
  "face-brow-r",
  "face-mouth",
  "face-mouth-open",
  "face-blush",
]);

const BODY_IDS = new Set([
  "shadow",
  "hair-back",
  "body-legs",
  "body-upper",
  "body",
  "arm-back",
  "arm-back-l",
  "arm-back-r",
  "neck",
  "head-base",
  "head",
  "hair-front",
  "arm-front-l",
  "arm-front-r",
  "arm-l",
  "arm-r",
  "hand-l",
  "hand-r",
]);

/** @type {Record<string, number>} */
const Z_BY_ID = {
  shadow: 10,
  "hair-back": 20,
  "body-legs": 30,
  "arm-back": 40,
  "arm-back-l": 40,
  "arm-back-r": 41,
  "body-upper": 50,
  body: 35,
  neck: 60,
  "head-base": 70,
  head: 75,
  "face-eye-l": 80,
  "face-eye-r": 81,
  "face-brow-l": 82,
  "face-brow-r": 83,
  "face-mouth": 90,
  "face-mouth-open": 92,
  "face-blush": 91,
  "hair-front": 100,
  "arm-front-l": 110,
  "arm-front-r": 111,
  "arm-l": 110,
  "arm-r": 111,
  "hand-l": 120,
  "hand-r": 121,
};

function parseId(fileName) {
  const stem = fileName.replace(/\.png$/i, "");
  const m = stem.match(/^\d+[_-](.+)$/);
  if (m) {
    return m[1];
  }
  if (Z_BY_ID[stem] !== undefined) {
    return stem;
  }
  return null;
}

function targetDir(id) {
  if (DETAIL_IDS.has(id)) {
    return DETAILS_DIR;
  }
  if (BODY_IDS.has(id)) {
    return BODY_DIR;
  }
  return null;
}

function canonicalName(id) {
  const z = Z_BY_ID[id] ?? 99;
  return `${z}_${id}.png`;
}

function moveIntoPlace(srcPath) {
  const id = parseId(path.basename(srcPath));
  if (!id) {
    console.warn(`[sort-export] 无法识别，跳过: ${srcPath}`);
    return false;
  }
  const dir = targetDir(id);
  if (!dir) {
    console.warn(`[sort-export] 未知层 ID「${id}」，跳过: ${srcPath}`);
    return false;
  }
  fs.mkdirSync(dir, { recursive: true });
  const dest = path.join(dir, canonicalName(id));
  if (path.resolve(srcPath) === path.resolve(dest)) {
    return false;
  }
  if (fs.existsSync(dest)) {
    fs.unlinkSync(srcPath);
    console.log(`[sort-export] 已存在，删除重复: ${path.basename(srcPath)}`);
    return true;
  }
  fs.renameSync(srcPath, dest);
  console.log(`[sort-export] → ${path.relative(EXPORT_DIR, dest)}`);
  return true;
}

function collectPngs(dir, out) {
  if (!fs.existsSync(dir)) {
    return;
  }
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (name.toLowerCase().endsWith(".png") && fs.statSync(full).isFile()) {
      out.push(full);
    }
  }
}

function main() {
  fs.mkdirSync(BODY_DIR, { recursive: true });
  fs.mkdirSync(DETAILS_DIR, { recursive: true });

  /** @type {string[]} */
  const toSort = [];

  collectPngs(EXPORT_DIR, toSort);

  for (const name of fs.readdirSync(EXPORT_DIR)) {
    const sub = path.join(EXPORT_DIR, name);
    if (!fs.statSync(sub).isDirectory()) {
      continue;
    }
    if (name === "body" || name === "details") {
      collectPngs(sub, toSort);
      continue;
    }
    for (const f of fs.readdirSync(sub)) {
      const full = path.join(sub, f);
      if (f.toLowerCase().endsWith(".png") && fs.statSync(full).isFile()) {
        toSort.push(full);
      }
      if (fs.statSync(path.join(sub, f)).isDirectory()) {
        collectPngs(path.join(sub, f), toSort);
      }
    }
  }

  let n = 0;
  for (const src of toSort) {
    if (moveIntoPlace(src)) {
      n += 1;
    }
  }
  console.log(`[sort-export] 整理 ${n} 个文件`);
}

main();
