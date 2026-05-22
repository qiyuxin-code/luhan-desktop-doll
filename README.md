# Luhan Desktop Doll

鹿晗主题桌面桌宠（Electron 透明窗口）。安装后会出现在桌面右下角，支持拖动、右键选择动作、鼠标悬停触发默认动作。

## 安装使用

请根据你的电脑系统下载 `dist/` 目录里的对应安装包。

### macOS

下载：[鹿晗桌宠-1.0.0-arm64.dmg](./dist/鹿晗桌宠-1.0.0-arm64.dmg)

1. 双击打开 `.dmg` 文件。
2. 把「鹿晗桌宠」拖到「应用程序」。
3. 第一次打开如果提示「无法验证开发者」，请右键应用选择「打开」。

备用下载：[鹿晗桌宠-1.0.0-arm64-mac.zip](./dist/鹿晗桌宠-1.0.0-arm64-mac.zip)

### Windows

下载：[鹿晗桌宠-1.0.0-win.zip](./dist/鹿晗桌宠-1.0.0-win.zip)

1. 下载后解压 `.zip`。
2. 打开解压后的文件夹。
3. 双击运行 `鹿晗桌宠.exe`。

当前 `dist/` 已提供 Windows 便携版 `.zip`。如果后续生成安装版 `.exe`，可再补充安装版下载链接。

## 使用演示

<video src="./assets/show-example.mov" controls width="360"></video>

如果上方视频无法播放，可以直接打开：[assets/show-example.mov](./assets/show-example.mov)。

## 本地开发运行

```bash
npm install
npm start
```

`npm start` 会打包 `renderer/desktop-luhan-sprites.mjs` 为 `pet-desktop.bundle.js` 并启动 Electron。若只运行 `electron .`，请先：

```bash
npm run build:renderer
```

启动后：透明置顶窗口（默认右下角）。**拖动** 移动窗口；**右键** 打开动作列表；**右下角 ×** 关闭。

## 打包成安装包（分发给他人）

使用 [electron-builder](https://www.electron.build/) 生成可下载的安装包，产物在 `dist/` 目录。

```bash
npm install
npm run dist        # 当前系统自动选择平台
npm run dist:mac    # macOS：.dmg + .zip（Apple Silicon）
npm run dist:win    # Windows 便携版 .zip（Mac 上可交叉编译）
npm run dist:win:installer  # Windows 安装程序 .exe（需在 Windows 上运行）
npm run dist:linux  # Linux：AppImage + .deb
```

**macOS 示例输出**（Apple Silicon）：

| 文件 | 说明 |
|------|------|
| `dist/鹿晗桌宠-1.0.0-arm64.dmg` | 双击打开，把应用拖到「应用程序」 |
| `dist/鹿晗桌宠-1.0.0-arm64-mac.zip` | 解压后直接运行 `.app` |

**Windows 示例输出**：

| 文件 | 说明 |
|------|------|
| `dist/鹿晗桌宠-1.0.0-win.zip` | 解压后运行 `鹿晗桌宠.exe`（Mac 上 `npm run dist:win` 可生成） |
| `dist/鹿晗桌宠 Setup 1.0.0.exe` | NSIS 安装程序（需在 **Windows 电脑**上执行 `npm run dist:win:installer`） |

**在 Mac（Apple Silicon）上打 Windows 包**：electron-builder 依赖的 Wine / NSIS 是 x86 程序，无法在本机生成 `.exe` 安装程序。请用 `npm run dist:win` 生成 `.zip` 便携版分发给 Windows 用户；若必须要安装程序，请在 Windows 机器或 GitHub Actions 上跑 `npm run dist:win:installer`。

**首次打开（未签名时）**：macOS 可能提示「无法验证开发者」。请 **右键 → 打开**，或在「系统设置 → 隐私与安全性」里允许。若要公开发布且避免此提示，需 Apple Developer 账号对应用做 [代码签名与公证](https://www.electron.build/code-signing)。

**发布到 GitHub**：可将 `dist/` 里的 `.dmg` / `.exe` / `.zip` 上传到 [GitHub Releases](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository)，供他人下载。

本地快速验证（不生成安装包，只输出 `.app` 目录）：

```bash
npm run pack
```

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
