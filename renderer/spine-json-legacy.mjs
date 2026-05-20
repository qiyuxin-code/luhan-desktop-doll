/**
 * Spine 4.2 及更早 JSON 导出使用顶层 ik / transform / path / physics 数组；
 * Spine 4.3 运行时仅解析统一的 constraints[]（带 type 字段）。
 */
export function normalizeLegacySpineJson(root) {
  if (!root || typeof root !== "object") {
    return root;
  }

  if (!Array.isArray(root.constraints)) {
    root.constraints = [];
  }

  if (Array.isArray(root.ik)) {
    for (const item of root.ik) {
      root.constraints.push({ ...item, type: "ik" });
    }
    delete root.ik;
  }

  if (Array.isArray(root.transform)) {
    for (const item of root.transform) {
      const entry = { ...item, type: "transform" };
      if (entry.target != null && entry.source == null) {
        entry.source = entry.target;
        delete entry.target;
      }
      root.constraints.push(entry);
    }
    delete root.transform;
  }

  if (Array.isArray(root.path)) {
    for (const item of root.path) {
      root.constraints.push({ ...item, type: "path" });
    }
    delete root.path;
  }

  if (Array.isArray(root.physics)) {
    for (const item of root.physics) {
      root.constraints.push({ ...item, type: "physics" });
    }
    delete root.physics;
  }

  return root;
}
