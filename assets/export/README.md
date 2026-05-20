# 分层 PNG（不要全塞进 details）

## 两个文件夹，含义不同

| 文件夹 | 放什么 | 程序行为 |
|--------|--------|----------|
| **`body/`** | 全身拆层：shadow、hair-back、body-legs、body-upper、arm、head-base、hair-front… | **替换** SVG 里那张内嵌整图，按数字前缀从下到上叠 |
| **`details/`** | **只会动**的零件：face-eye-l/r、face-brow-l/r、face-mouth、face-blush | 叠在 body 之上，当前姿势停稳后播眨眼等 |

如果把 `body-upper.png`、`hair-front.png` 放进 `details/`，会和 SVG 整图 **叠两套人物**，出现你看到的「全堆在一起」。

星星 / 泡泡 / 花 / 小熊等仍在各姿势 **SVG 矢量**里，不要导出成 PNG。

## 目录示例

```text
export/body/1_shadow.png
export/body/5_body-upper.png
export/details/8_face-eye-l.png
export/details/9_face-brow-l.png
```

```bash
npm run scan:export
npm run build:renderer
npm start
```

所有 PNG 须与源稿 **同一画布**（如 2048×2048），且与 SVG 人物 `<image>` 对齐。
