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
dsh plugin --profile web add github:sjrslh/dsh-ui-zoom
```

装完重启 `dsh web`（或桌面端）。

npm 版本还在准备中；发布之后 `dsh plugin --profile web add dsh-ui-zoom` 也能直接装。

## 兼容

- dsh `>= 0.1.0-rc.6`
- 桌面端和纯 `dsh web` 都能用：缩放完全在渲染进程里完成，不需要宿主路由或 Electron API
- 颜色全部走 `--dsw-alias-*` token，深色/浅色主题和第三方皮肤下都能看

## 缩放为什么不会挤坏布局

只给 `<html>` 加 CSS `zoom` 只缩放绘制。DSH 的壳和浮层是按 JS 像素量出来的（`window.innerHeight`、`getBoundingClientRect`、`MouseEvent.clientX`），所以纯 CSS 缩放在 100% 以上会把输入框、模型选择、推理强度面板推到视口外——框还在，只是跑到屏幕外面。

Electron 自带的 `webContents.setZoomFactor` 能改坐标系，但桌面端把 dsh 服务跑在 Node 子进程里（`ELECTRON_RUN_AS_NODE=1`），插件拿不到 `BrowserWindow`，渲染进程也没有缩放 IPC。所以这里用「CSS `zoom` + 度量垫片」：缩放时把下面这些值同步除以缩放比，正好是浏览器原生缩放的坐标语义（布局用 CSS 像素，绘制按 zoom 放大）：

```
window.innerWidth / innerHeight
Element.clientWidth / clientHeight
Element.getBoundingClientRect()
MouseEvent.clientX / clientY
```

回到 100% 时垫片自动撤掉。在桌面端 60%–180% 实测：输入框、模型选择、推理强度菜单位置都正常。

## 开发

```sh
node scripts/smoke.mjs   # 用 React/DOM 桩跑一遍 bundle：注册、apply、渲染
node --check lib/client.js
node --check lib/index.js
```

仓库结构：

```
lib/index.js       宿主侧（空插件，只为让包成为合法的 Cordis 插件）
lib/client.js      浏览器侧 bundle：缩放 + 度量垫片 + 设置入口
cordis.patch.yml   bundle patch：把本插件插入 profile 的 cordis 树
scripts/smoke.mjs  无浏览器冒烟测试
```

## 许可

MIT
