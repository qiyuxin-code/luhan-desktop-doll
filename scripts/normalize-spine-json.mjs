#!/usr/bin/env node
/**
 * 将 Spine 旧版 JSON（顶层 ik/transform）转为 4.3 运行时所需的 constraints 格式。
 * 用法: node scripts/normalize-spine-json.mjs [path/to/skeleton.json]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeLegacySpineJson } from "../renderer/spine-json-legacy.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultFile = path.join(__dirname, "../assets/spine/spineboy/spineboy-pro.json");
const target = process.argv[2] ? path.resolve(process.argv[2]) : defaultFile;

const raw = fs.readFileSync(target, "utf8");
const root = normalizeLegacySpineJson(JSON.parse(raw));
fs.writeFileSync(target, `${JSON.stringify(root, null, "\t")}\n`, "utf8");

const ikCount = root.constraints.filter((c) => c.type === "ik").length;
const transformCount = root.constraints.filter((c) => c.type === "transform").length;
console.log(`Normalized ${target}`);
console.log(`  constraints: ${root.constraints.length} (ik: ${ikCount}, transform: ${transformCount})`);
