# 鹿晗桌宠 · PS/Figma 拆层完整清单

面向当前 **8 个姿势**（`idle-sit`、`action-sing`、`action-pat`、`action-jump`、`jump`、`bubble`、`flower`、`sit3`）。  
目标：每层透明 PNG → 多层 `<image>` → CSS 可单独动手臂、头、道具等。

---

## 先搞清楚：两种拆法

| 方式 | 做法 | 适合你现在 |
|------|------|------------|
| **A. 每姿势一套层**（推荐） | `assets/layers/idle-sit/body.png` … 每个姿势文件夹里层名相同、内容按姿势重画/导出 | 8 张差异大的贴纸图，实现快 |
| **B. 一套骨骼层 + 变形** | 只画 `idle-sit` 一套层，其它姿势在 Spine 里 K 帧 | 应走路线 2（Spine），不是 PNG 多层 |

下面按 **方式 A** 列「完整版」层名；**每个姿势都要导出同名文件**（没有该层的姿势可省略文件，代码里不引用即可）。

---

## 一、通用层（每个姿势都建议有）

从下到上 **Z 顺序**（数字越大越靠前）：

| Z | 文件名 | 包含什么 | 动画时常见用途 |
|---|--------|----------|----------------|
| 10 | `shadow.png` | 地面椭圆阴影（可选） | 跳起时缩小/变淡 |
| 20 | `hair-back.png` | 后脑勺、后发、披肩后发 | 跳起滞后、轻微摆动 |
| 30 | `body-legs.png` | 坐着的腿、裙摆/裤腿、躯干下半（不含头、不含前臂） | 整体跳时可与上身分开；呼吸缩放 |
| 40 | `arm-back-l.png` | 被身体挡住的左臂（若有） | 一般静态 |
| 41 | `arm-back-r.png` | 被身体挡住的右臂（若有） | 一般静态 |
| 50 | `body-upper.png` | 上衣/外套上半身（肩、胸，不含头与前臂） | 呼吸、跳起时整体位移可只动 body 组 |
| 60 | `neck.png` | 脖子皮肤（脖子细或与头分色时） | 可合并进 `head.png` 省一层 |
| 70 | `head-base.png` | 脸的皮肤区域、耳朵（不含头发、不含五官） | 点头、微跳 |
| 80 | `face-eye-l.png` | 左眼（含高光） | 眨眼、开心眯眼 |
| 81 | `face-eye-r.png` | 右眼 | 同上 |
| 82 | `face-brow-l.png` | 左眉（眉毛单独画时） | 表情；可合并进眼睛 |
| 83 | `face-brow-r.png` | 右眉 | 同上 |
| 90 | `face-mouth.png` | 嘴（当前嘴型） | 唱歌张嘴可换 `face-mouth-open.png` |
| 91 | `face-blush.png` | 腮红（若有） | 可选 |
| 100 | `hair-front.png` | 刘海、两侧前发 | 跳起、风吹轻微 delay |
| 110 | `arm-front-l.png` | 前臂+左手（画面左侧） | 摸头、拿花、举话筒 |
| 111 | `arm-front-r.png` | 前臂+右手（画面右侧） | 同上 |
| 120 | `hand-l.png` | 仅左手（若手臂与手要分开动） | 精细手势；否则合并进 arm |
| 121 | `hand-r.png` | 仅右手 | 同上 |
| 200+ | `prop-*.png` | 见下文「按姿势追加」 | 道具、特效 |

### 精简版（时间紧时最少 7 层 + 道具）

仍按 Z 从下到上：

1. `shadow.png`（可选）  
2. `hair-back.png`  
3. `body.png` — 躯干+腿+不用单独动的部分（合并 30+50）  
4. `head.png` — 头+脸+五官（合并 70–91）  
5. `hair-front.png`  
6. `arm-l.png` / `arm-r.png` — 两条前臂（含手）  
7. `prop-*.png` — 该姿势道具  

之后要细了再把 `head` 拆成 `face-mouth`、`face-eye-*`。

---

## 二、按姿势：在通用层之外还要拆什么

「已有矢量」= 你 SVG 里已是 `<circle>` / `<polygon>`，**建议继续用 SVG/CSS 画，不必烙进 PNG**。

| 姿势 | 画面要点（按现有资源推断） | 建议在 PNG 里拆的层 | 已有矢量 / 代码层（勿塞进 PNG） |
|------|---------------------------|---------------------|--------------------------------|
| **idle-sit** | 坐姿待机 | 通用层即可；无额外 prop | — |
| **action-sing** | 唱歌姿势 | `prop-mic.png`（若话筒在图里）<br>`face-mouth-open.png`（张嘴，可与 idle 的嘴互换） | `twinkle-star` ×4（星星）→ 保持 SVG |
| **action-pat** | 抬手摸头 | `arm-front-r-pat.png` 或 `arm-r-raised.png`（抬起的右臂+手）<br>身体层用不抬手版本或同一套 | `pat-mark`、`pat-spark` → 保持 SVG |
| **action-jump** | 人物跳起（无小熊） | **整姿势建议单独一套**：<br>`body-jump.png` 或拆 `body-legs-jump` + `body-upper-jump` + `arm-*-jump` + `hair-*-jump`<br>跳起时层间距拉开，避免只拉伸 idle 的坐姿腿 | — |
| **jump** | 坐姿 + 挂绳小熊 | 人物用 idle 或 sit 通用层 + `prop-bear-string.png`（绳，可选） | **小熊全身**（ear/body/face）→ 已是矢量，保持 SVG 摇摆 |
| **bubble** | 吹泡泡 | `prop-bubble-wand.png`（泡泡棒/手+棒，若在人物图里）<br>嘴型可用 `face-mouth-o.png`（圆唇吹气） | `pet-bubble` / `pet-bubble-highlight` 多组 → 保持 SVG 上浮 |
| **flower** | 拿花 | `prop-flower-hand.png`（花+拿花的手，若手与花连在一起）<br>或只 `arm-front-l-flower.png` | 花茎花瓣 `flower-stem/petal/center` → 已是矢量，可继续 SVG 摇摆 |
| **sit3** | 托腮 | `arm-front-l-chin.png` 或 `hand-chin.png`（托腮的手+手臂）<br>脸可略改 `face-mouth-think.png`（可选） | `twinkle-star` ×4 → 保持 SVG |

### `action-jump` 和 `jump` 不要混用一层

- **action-jump**：整个人在空中/离地，腿、臂、头发与 **idle-sit** 轮廓不同 → 单独文件夹 `action-jump/` 全套导出。  
- **jump**：人物多半仍坐着，只是多了 **小熊** → 人物层可与 idle 共用或复制 idle 层，小熊用现有矢量。

---

## 三、推荐文件夹结构

```text
assets/layers/
  _template/                 # 空占位 + README，层名规范
    README.txt
  idle-sit/
    shadow.png
    hair-back.png
    body-legs.png
    body-upper.png
    head-base.png
    face-eye-l.png
    face-eye-r.png
    face-mouth.png
    hair-front.png
    arm-front-l.png
    arm-front-r.png
  action-sing/
    ...（同上，外加 prop-mic.png、face-mouth-open.png）
  action-pat/
    ...（arm-front-r 换成抬手版）
  action-jump/
    ...（跳跃专用全身分层）
  jump/
    ...（可与 idle-sit 同套人物层）
  bubble/
    ...
  flower/
    ...
  sit3/
    ...
```

导出设置：

- **PNG-24**，透明背景  
- **同一姿势内**画布尺寸、人物锚点一致（建议脚底中心或画布底部中点固定）  
- 文件名与上表 **完全一致**（英文小写、连字符）

---

## 四、Figma / PS 操作要点

### Figma

1. 一个 File → 8 个 Page（每姿势一页）或 8 个 Frame。  
2. 每页里建 **同名 Layer**（如 `body-legs`、`hair-front`）。  
3. 用 **Auto Layout 不用** 于导出；用固定 Frame 尺寸（例如 1024×1024，人物脚底对齐 Frame 底边中点）。  
4. 导出：选中单层 → Export PNG @1x/2x；或插件 **Export Selected Layers** 批量。  
5. 道具、头发、身体分 **Group**，不要 Merge 再拆。

### Photoshop

1. 每个姿势一个 PSD：`idle-sit.psd`。  
2. 图层名称与上表一致（`body-legs`、`arm-front-l`…）。  
3. **不合并**再导出；`文件 → 导出 → 图层到文件`，PNG，透明。  
4. 跳起姿势：用 **action-jump.psd** 单独源文件，从插画稿重分，不要 Transform 拉伸 idle 的腿。

### 对齐锚点（重要）

桌宠代码里脚底对齐窗口底边。导出时：

- 所有层 **同一画布大小**；  
- **脚底 Y 坐标一致**（合并预览时不漂移）；  
- 头/手单独层不要单独裁小画布（否则叠回去会对不齐）。

可在 Figma 里画一条 **baseline 参考线** 贴脚底。

---

## 五、和现有 SVG 动画怎么分工

| 内容 | 建议 |
|------|------|
| 星星（sing、sit3） | 继续 SVG 矢量 `twinkle-star` |
| 摸头弧线、光点（pat） | 继续 SVG |
| 泡泡（bubble） | 继续 SVG 圆，人物只负责嘴+手+棒 |
| 花（flower） | 花可 SVG 摇摆；人物手+身体用 PNG 层 |
| 小熊（jump） | 继续 SVG；人物层用 PNG |

PNG 负责 **人物本体与手持硬道具**；矢量负责 **重复特效、半透明泡泡、简单几何装饰**。

---

## 六、导出完成后代码侧（已接入）

| 层级 | 放哪 | 行为 |
|------|------|------|
| **姿势 + 矢量特效** | `assets/*.svg` | 单击换动作；星星/泡泡/花/小熊仍在 SVG 里 |
| **全身 PNG 分层** | **`assets/export/body/`** | **替换** SVG 内嵌整图，按 z 叠（shadow → 腿 → 上身 → 头…） |
| **会动的零件** | **`assets/export/details/`** | 仅 `face-eye-*`、`face-brow-*`、`face-mouth`、`face-blush` |

**不要** 把 `body-upper`、`hair-front` 等放进 `details/`，否则会与 SVG 整图叠两套人物。

```text
assets/export/body/5_body-upper.png
assets/export/details/9_face-brow-l.png
```

```bash
npm run scan:export
npm run build:renderer
npm start
```

各层须 **同一 2048 画布** 且与 SVG `<image>` 对齐。`body/`、`details/` 扫描时会去白底。

---

## 七、工作量参考

| 档位 | 层数/姿势 | 8 姿势总 PNG 数（约） |
|------|-----------|----------------------|
| 精简 | 6–8 + prop | ~50–70 |
| 标准（推荐） | 12–15 + prop | ~100–120 |
| 完整 | 18+ + 嘴型/眼型变体 | ~150+ |

建议：**先做 `idle-sit` 标准拆层 → 接进工程调对齐 → 再复制方法到其它 7 个姿势**。

---

## 八、自检清单（导出前）

- [ ] 每层 PNG 透明底，无白边 halation  
- [ ] 同姿势各层叠在一起 = 与原单张图一致  
- [ ] 脚底、中心水平位置与模板 Frame 一致  
- [ ] 抬手/跳起/托腮姿势 **手臂层** 已单独导出，不是整图一张  
- [ ] 星星/泡泡/花/小熊/摸头特效 **没有** 画进 PNG（避免重复）  
- [ ] `action-jump` 与 `idle-sit` 未共用同一套腿层做拉伸
