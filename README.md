# Luhan Desktop Doll

鹿晗主题桌面桌宠（Electron 透明窗口）。**默认使用 `assets/*.svg` 内嵌显示 + 姿势交叉淡入**，并尽量保留你在 SVG 里加的叠加层动画（星星、泡泡、摸头等，见 `styles/luhan-svg-animations.css`）。仓库内另含 Spine 演示管线，可按需切换。

## 运行方法

```bash
npm install
npm start
```

`npm start` 会打包 `renderer/desktop-luhan-sprites.mjs` 为 `pet-desktop.bundle.js` 并启动 Electron。若只运行 `electron .`，请先：

```bash
npm run build:renderer
```

启动后：透明置顶窗口（默认右下角）。**单击（未拖动）** 切换到下一姿势（约 380ms 淡入淡出）；**拖动** 移动窗口；**右下角 ×** 关闭。

## 姿势资源（路线 1）

| 文件 | 说明 |
|------|------|
| `assets/idle-sit.svg` | 待机 |
| `assets/action-sing.svg` | 唱歌 |
| `assets/action-pat.svg` | 摸头 |
| `assets/action-jump.svg` | 跳起 |
| `assets/jump.svg` | 跳跃 |
| `assets/bubble.svg` | 泡泡 |
| `assets/flower.svg` | 拿花 |
| `assets/sit3.svg` | 托腮 |

新增或替换姿势：把 SVG 放进 `assets/`，在 `renderer/desktop-luhan-sprites.mjs` 的 `POSES` 数组里增加一项，然后 `npm run build:renderer`。

### SVG 里的 `<animate>` 为什么之前不见了？

动画仍写在各 SVG 的 `<!-- animation-content -->` 里（SMIL）。上一版用 **Pixi 把 SVG 当贴图**，只会截一帧静态图；且 **Electron（Chromium）本身不执行 SVG SMIL**。现在改为 **DOM 内嵌 SVG + CSS 复现** 同类效果；若你改了 SMIL 时间，可同步改 `styles/luhan-svg-animations.css`。

从 PNG 重新生成 SVG：

```bash
python3 scripts/generate_assets.py
```

### 为什么 SVG 里是 `<image>`？想单独动手臂/头怎么办？

当前脚本把 **整张 PNG 嵌进 SVG**，所以只能动整块图 + 你额外画的矢量叠加层（星星、泡泡等）。要细粒度控制，需要 **分层资源**（多个透明 PNG 或多个 `<image>`），或改走 Spine/Live2D。  
拆层总表：[docs/ASSETS-LAYER-SPLIT.md](docs/ASSETS-LAYER-SPLIT.md) · 原理说明：[docs/ASSETS-LAYERS.md](docs/ASSETS-LAYERS.md)。

分层 PNG 管线在 `assets/export/`（当前默认关闭，桌宠仅用 SVG + CSS 动画）。若要启用见 [docs/ASSETS-LAYER-SPLIT.md](docs/ASSETS-LAYER-SPLIT.md) 第六节与 `npm run scan:export`。

### 跳跃时头顶被裁掉？

Electron 窗口外区域会被系统裁切。已在 `main.js` 增加 `JUMP_HEADROOM`（窗口变高、上方透明留白），跳跃姿势下 DOM 使用 `overflow: visible`。仍不够可改 `main.js` 里的 `JUMP_HEADROOM` 或调小 `styles/luhan-svg-animations.css` 里 `luhan-character-jump` 的幅度。

## 可选：Spine 骨骼演示

若要试用官方 SpineBoy 骨骼动画（非鹿晗图）：

```bash
npm run build:renderer:spine
electron .
```

Spine 相关说明、旧 JSON 转换与排错见 `renderer/desktop-spine.mjs`；转换命令：`npm run normalize:spine -- path/to/skeleton.json`。

## 常见问题

1. **白屏 / 只有脚**：多为 Spine 演示；默认 `npm start` 应显示鹿晗 SVG。  
2. **加载失败**：确认 `assets/*.svg` 存在，并执行过 `npm run build:renderer`。  
3. **macOS 透明小窗**：需 Electron 35.7.5+（`npm install` 后重试）。  
4. **WebGL 失败**：远程桌面或禁用 GPU 时可能无法初始化 Pixi。
