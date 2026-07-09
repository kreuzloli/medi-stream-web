# Medi Stream Web

Medi Stream Web 是一个面向医疗直播场景的前端项目，基于 Vite、TypeScript 和原生 Web Components 构建。项目包含首页内容展示、目录分类、直播播放、WebRTC 推流、微信 OAuth 授权播放等页面和组件。

## 功能概览

- 首页门户：轮播图、目录分类、近期直播、精选专题、科普视频。
- 直播播放：集成腾讯云 TCPlayer，支持通过页面输入播放地址。
- 在线推流：集成腾讯云 Web 推流 SDK，支持摄像头、麦克风、屏幕采集和 WebRTC 推流。
- 微信授权播放：支持从 hash URL 中读取 token，保存到 `localStorage` 后进入播放页。
- API 代理：本地开发时通过 Vite proxy 将 `/api` 请求转发到后端服务。

## 技术栈

- Vite 7
- TypeScript 5
- 原生 Web Components / Custom Elements
- 腾讯云 TCPlayer
- 腾讯云 Web 推流 SDK `TXLivePusher`

## 环境要求

Vite 当前版本要求 Node.js 满足：

```bash
^20.19.0 || >=22.12.0
```

推荐使用 npm 安装依赖：

```bash
npm install
```

## 本地开发

启动开发服务器：

```bash
npm run dev
```

默认访问地址：

```text
http://127.0.0.1:3000
```

`npm start` 与 `npm run dev` 等价。

## 环境变量

项目支持以下 Vite 环境变量：

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `VITE_API_BASE` | `/api` | 前端请求后端 API 时使用的基础路径。 |
| `VITE_API_PROXY_TARGET` | `http://127.0.0.1:8080` | 本地开发服务器代理 `/api` 请求时的后端目标地址。 |

示例 `.env.local`：

```env
VITE_API_BASE=/api
VITE_API_PROXY_TARGET=http://127.0.0.1:8080
```

本地 Vite 代理会把 `/api` 前缀去掉后转发到后端。例如：

```text
GET http://127.0.0.1:3000/api/catalog/full
```

会转发为：

```text
GET http://127.0.0.1:8080/catalog/full
```

## 常用脚本

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动本地开发服务器，监听 `127.0.0.1:3000`。 |
| `npm start` | 同 `npm run dev`。 |
| `npm run check` | 只执行 TypeScript 类型检查。 |
| `npm run build` | 先执行 `tsc`，再执行 Vite 生产构建。 |
| `npm run preview` | 预览构建产物，监听 `127.0.0.1:4173`。 |

## 路由说明

项目使用 hash 路由，入口文件为 `src/main.ts`，路由表位于 `src/router/index.ts`。

| Hash 路由 | 组件 | 当前状态 |
| --- | --- | --- |
| `#/` | `home-page` | 已注册，首页门户。 |
| `#/live-push` | `live-pusher-page` | 已注册，WebRTC 推流页。 |
| `#/live-play` | `live-page` | 已注册，直播播放页。 |
| `#/wechat-live-play` | `wechat-live-page` | 已注册，微信授权播放页。 |
| `#/login` | `login-page` | 路由已声明，当前未看到对应页面组件注册。 |
| `#/live` | `live-room-page` | 路由已声明，当前未看到对应页面组件注册。 |

## 后端接口

前端统一通过 `src/services/api.ts` 中的 `buildApiUrl` 拼接接口地址。默认 `API_BASE` 为 `/api`。

当前前端调用的主要接口：

| 接口 | 调用位置 | 用途 |
| --- | --- | --- |
| `GET /catalog/full` | `src/services/catalog.ts` | 获取首页目录分类。 |
| `GET /banners?placement=home` | `src/services/banner.ts` | 获取首页轮播图。接口失败时前端会使用 fallback 数据。 |
| `GET /home` | `src/services/home.ts` | 获取首页直播、专题、视频内容。接口失败时前端会使用 fallback 数据。 |
| `GET /wechat/oauth/authorize?redirect=...` | `src/services/wechat.ts` | 构建微信 OAuth 授权入口。 |

服务端待补齐接口和字段格式可参考：

```text
docs/server-missing-apis.md
```

## 目录结构

```text
.
├── docs/                     # 项目文档
├── src/
│   ├── assets/               # 图片和图标资源
│   ├── components/           # 可复用 Web Components
│   ├── libs/                 # 第三方播放器和推流 SDK 静态资源
│   ├── models/               # TypeScript 数据模型
│   ├── pages/                # 页面级 Web Components
│   ├── router/               # hash 路由
│   ├── services/             # API、认证、OAuth 服务
│   ├── styles/               # 页面和组件样式
│   └── main.ts               # 应用入口
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 构建与预览

执行生产构建：

```bash
npm run build
```

本地预览构建结果：

```bash
npm run preview
```

## 开发注意事项

- 页面组件必须先在 `src/pages/index.ts` 中导入注册，再能被路由表渲染。
- 路由表中的 `component` 必须与 `customElements.define(...)` 注册名一致。
- 本地 API 请求默认走 `/api`，如果后端服务不带 `/api` 前缀，保持当前 Vite proxy rewrite 配置即可。
- 播放器和推流功能依赖 `src/libs/` 下的腾讯云 SDK 静态资源，调整路径时需要同步检查构建产物。

## 许可证

本项目使用 AGPL-3.0 License，详见 `LICENSE`。
