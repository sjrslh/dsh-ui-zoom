# dsh-ui-zoom

给 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（`dsh`）加两件小事：

- **Ctrl + 滚轮整页缩放**，像豆包/浏览器那样，字体、间距、图标一起放大
- **右下角一个「设置」按钮**，不用记快捷键也能进设置

## 功能

| 操作 | 效果 |
| --- | --- |
| `Ctrl` + 滚轮上 / 下 | 放大 / 缩小，60%–180%，每档 10% |
| `Ctrl` + `0` | 回到 100% |
| 缩放时 | 屏幕下方居中显示百分比，900ms 后淡出 |

- 比例写进 `localStorage`（`dsh-ui-zoom:level`），刷新、重启都保持
- 60ms 节流：鼠标滚轮一格一档，触控板捏合（Windows 上就是 ctrl+wheel）不会一下跳到底
- 终端里的 `Ctrl`+滚轮不抢，留给 xterm 自己的字号缩放
- 右下角「设置」：优先调宿主自己的 `settings.open` 命令；命令不可用时退到账号菜单里的「设置」，再不行合成一次 `Ctrl+,`

## 安装

```sh
dsh plugin --profile web add dsh-ui-zoom
```

装完重启 `dsh web`（或桌面端）。只从 GitHub 装：

```sh
dsh plugin --profile web add github:OWNER/dsh-ui-zoom
```

> 把 `OWNER` 换成仓库所属账号。

## 兼容

- dsh `>= 0.1.0-rc.6`（`settings.section` / `shell.overlay` 槽位可用的版本线）
- 桌面端与网页版都可用；桌面端里 `Ctrl+,` 走的是 Electron 原生键盘桥，所以这里用命令而不是合成按键
- 颜色全部走 `--dsw-alias-*` token，深色/浅色主题和第三方皮肤下都能看

## 为什么字体和 UI 会一起适配

只给 `<html>` 加 CSS `zoom`，没有逐个组件改 `font-size`。DSH 的布局链是：

```css
html, body, #root { height: 100% }
```

百分比高度会针对缩放后的布局视口重新解析，所以整页等比缩放：字变大，卡片、间距、圆角、图标跟着变大，`position: fixed` 的元素（包括本插件的设置按钮）也在同一坐标系里。

**已知边界**：CSS `zoom` 不改变 `vh` / `dvh` 的取值。DSH 里只有少数弹窗用 `100dvh` 算 `max-height`（日程时区菜单、目录选择器、快捷键面板等），放大到高档位时这些弹窗的上限会偏大一点。主界面不受影响。

## 开发

```sh
node scripts/smoke.mjs   # 用 React/DOM 桩跑一遍 bundle：注册、apply、渲染
node --check lib/client.js
```

仓库结构：

```
lib/index.js       宿主侧（空插件，只为让包成为合法的 Cordis 插件）
lib/client.js      浏览器侧 bundle（__ModuleLoader__ 格式，无构建步骤）
cordis.patch.yml   bundle patch：把本插件插入 profile 的 cordis 树
scripts/smoke.mjs  无浏览器冒烟测试
```

## 许可

MIT
