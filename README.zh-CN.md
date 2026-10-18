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
- 桌面端：走 Electron 原生 `webContents.setZoomFactor`，真正的浏览器级缩放
- 纯 `dsh web`：宿主路由返回 `supported:false`，插件不再拦 `Ctrl`+滚轮，交给浏览器自己的页面缩放
- 颜色全部走 `--dsw-alias-*` token，深色/浅色主题和第三方皮肤下都能看

## 为什么用原生缩放，而不是 CSS zoom

第一版是在 `<html>` 上加 CSS `zoom`。它只缩放绘制，不改宿主用 JS 量出来的布局：放大到 100% 以上，输入框（composer）、模型选择和推理强度面板都会被推到视口外——框其实在，只是跑到屏幕外面去了。

这一版改成让宿主改真正的页面缩放：

```
渲染进程  --fetch /dsh-ui-zoom/zoom-->  宿主插件  --webContents.setZoomFactor-->  Electron
```

原生缩放会改布局视口，文字、间距、输入框和所有二级浮层都在正常坐标系里。模型选择、推理强度菜单在 60%–180% 全程验证过。

宿主侧在 `lib/index.js`：只接受本机回环（或同源）请求，比例夹在 0.6–1.8，没有 Electron 窗口时返回 `supported:false`。

## 开发

```sh
node scripts/smoke.mjs   # 用 React/DOM 桩跑一遍 bundle：注册、apply、渲染
node --check lib/client.js
node --check lib/index.js
```

仓库结构：

```
lib/index.js       宿主侧：/dsh-ui-zoom/zoom 路由 + Electron 缩放桥
lib/client.js      浏览器侧 bundle（__ModuleLoader__ 格式，无构建步骤）
cordis.patch.yml   bundle patch：把本插件插入 profile 的 cordis 树
scripts/smoke.mjs  无浏览器冒烟测试
```

## 许可

MIT
