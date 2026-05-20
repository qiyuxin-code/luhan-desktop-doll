# 桌宠资源：为什么现在是 `<image>`，如何细粒度控制

## 当前 SVG 是什么

`scripts/generate_assets.py` 会把 **一张 PNG** 用 base64 嵌进 SVG：

```xml
<svg viewBox="0 0 1000 1450">
  <image href="data:image/png;base64,..." ... />
  <!-- 可选：叠加矢量层（星星、泡泡 circle 等） -->
</svg>
```

因此：

- **整张人物是一张位图**，CSS/JS 只能动整块 `<image>`（例如整体上下跳）。
- 文件后缀是 `.svg`，但 **不是** 可单独选中头发、手臂的矢量路径。
- 你在 `<!-- animation-content -->` 里加的 `<circle>` / `<polygon>` 可以单独动画；**嵌在 image 里的像素动不了**。

完整拆层清单（每层文件名、Z 顺序、8 姿势各要多导哪些）：见 **[ASSETS-LAYER-SPLIT.md](./ASSETS-LAYER-SPLIT.md)**。

## 想「细节操作」可以怎么做

按投入从低到高：

### 方案 A：分层 PNG + 多个 `<image>`（推荐，仍走路线 1）

1. 在 PS / Figma 里把角色拆成透明 PNG 层，例如：`body.png`、`head.png`、`arm-left.png`、`prop.png`。
2. 一个姿势一个 SVG（或一个 HTML 结构），每层一个 `<image>`，按 z-index 叠好。
3. 在 `styles/luhan-svg-animations.css` 里按 **class** 分别写动画（只摆手臂、只点头）。

示例结构：

```xml
<svg viewBox="0 0 512 512">
  <g id="pose-jump">
    <image class="layer-body" href="body.png" x="..." y="..." />
    <image class="layer-head" href="head.png" ... />
    <image class="layer-arm" href="arm.png" ... />
  </g>
</svg>
```

可改 `generate_assets.py` 批量生成这种多层 SVG，或手建 `assets/layers/jump/` 目录。

### 方案 B：真矢量 SVG（路径）

在 Illustrator / Figma 里 **描路径** 导出 SVG（`<path>`、`<g>`），不要用「导出为 PNG 再塞进 SVG」。  
这样可以用 CSS 改 `fill`、`stroke`，或 SMIL/CSS 动单条路径（Chromium 仍不跑 SMIL，需 CSS）。

适合：简单图标、线条；复杂人像工作量大。

### 方案 C：Spine / Live2D（路线 2）

拆层 + 骨骼 + 网格变形，导出运行时数据。  
适合：要官方桌宠那种连续动作，而不是 8 张姿势切换。

### 方案 D：精灵图 / 视频

一段跳跃做成 12 帧 PNG 横条 → Pixi `AnimatedSprite` 或 CSS `steps()` 播帧。  
适合：动作很顺、但不想 rigging。

## 和本仓库的对应关系

| 目标 | 建议 |
|------|------|
| 只让人整体跳、泡泡飘 | 保持现状 + 调 CSS |
| 跳时手和身体分开动 | 方案 A，拆 PNG + 多层 `<image>` |
| 头发飘、眨眼 | 方案 A 或 C |
| 无限流畅动作 | 方案 C 或 D |

## 跳跃被裁切

Electron 窗口是矩形，**画出窗口外的部分 OS 会直接裁掉**。  
已用 `main.js` 里 `JUMP_HEADROOM` 增高透明窗口，并在跳跃姿势下 `overflow: visible`。  
若仍不够，可加大 `JUMP_HEADROOM` 或减小 `luhan-character-jump` 的 `translateY` 百分比。
