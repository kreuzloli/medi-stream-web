# 服务端待实现 API 文档

本文档基于 `medi-stream-web` 当前前端实际调用点整理，并对照 `medi-stream-rust` 当前路由表确认。前端统一通过 `VITE_API_BASE || "/api"` 发起请求；本地 Vite 代理会把 `/api` 前缀转发到 Rust 服务。

## 待实现接口

### 1. 获取首页轮播图

- 前端调用位置：`src/services/banner.ts`
- 前端页面：`src/pages/home-page.ts`
- 请求方式：`GET`
- 前端请求路径：`/api/banners?placement=home`
- Rust 服务路由建议：`/banners`
- 认证：前端会携带 `credentials: "include"`，如果本地有 token，会附加 `Authorization: Bearer <token>`。
- 当前前端 fallback：接口失败、404、返回空数组时使用 `defaultBanners` 假数据。

#### Query 参数

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `placement` | `string` | 是 | 轮播图使用位置。首页传 `home`，后续其他页面可传 `live`、`topic-detail` 等。 |

#### 响应格式

推荐统一响应包：

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": "banner-1",
      "img": "https://example.com/banner-1.jpg",
      "alt": "首页轮播图",
      "href": "/topics/1"
    }
  ]
}
```

前端当前也兼容以下 `data` 对象字段名：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "banners": [
      {
        "id": "banner-1",
        "img": "https://example.com/banner-1.jpg",
        "alt": "首页轮播图",
        "href": "/topics/1"
      }
    ]
  }
}
```

兼容字段优先级：`banners`、`bannerItems`、`items`、`list`。

#### 字段说明

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | `string` | 是 | 轮播图唯一标识。 |
| `img` | `string` | 是 | 图片地址。可以是绝对 URL，也可以是前端可访问的静态资源路径。 |
| `alt` | `string` | 否 | 图片替代文本。 |
| `href` | `string` | 否 | 点击跳转地址。前端会直接渲染成链接。 |

#### 后端实现建议

- `placement` 必须参与查询条件，避免首页、直播页、专题页轮播混在一起。
- 建议只返回启用状态且在有效期内的数据。
- 建议按 `sort` 升序、创建时间倒序兜底排序。
- 没有数据时返回空数组，前端会自动 fallback。

### 2. 获取首页内容

- 前端调用位置：`src/services/home.ts`
- 前端页面：`src/pages/home-page.ts`
- 请求方式：`GET`
- 前端请求路径：`/api/home`
- Rust 服务路由建议：`/home`
- 认证：前端会携带 `credentials: "include"`，如果本地有 token，会附加 `Authorization: Bearer <token>`。
- 当前前端 fallback：接口失败、404、返回空数组时分别使用近期直播、精选专题、科普视频假数据。

#### 响应格式

推荐统一响应包：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "liveItems": [
      {
        "id": "live-1",
        "label": "今天",
        "time": "13:20",
        "isToday": true,
        "title": "会议标题",
        "cover": "https://example.com/live-cover.jpg",
        "status": "LIVE",
        "waitText": "100小时"
      }
    ],
    "choicenessItems": [
      {
        "id": 1,
        "title": "精选专题标题",
        "cover": "https://example.com/topic-cover.jpg",
        "latestText": "最新时间1月11日 共11期",
        "minors": []
      }
    ],
    "excellentItems": [
      {
        "id": 1,
        "title": "科普视频标题",
        "cover": "https://example.com/video-cover.jpg",
        "badge": "回放",
        "href": "/videos/1"
      }
    ]
  }
}
```

前端当前也兼容以下别名：

| 页面字段 | 兼容后端字段 |
| --- | --- |
| `liveItems` | `liveItems`、`lives`、`recentLives` |
| `choicenessItems` | `choicenessItems`、`topics`、`selectedTopics` |
| `excellentItems` | `excellentItems`、`videos`、`scienceVideos` |

#### `LiveItem` 字段说明

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | `string` | 是 | 直播唯一标识。 |
| `label` | `string` | 是 | 时间轴日期标签，例如 `今天`、`14日`。 |
| `time` | `string` | 是 | 开播时间，例如 `13:20`。 |
| `isToday` | `boolean` | 是 | 是否今天直播，用于时间轴高亮。 |
| `title` | `string` | 是 | 直播标题。 |
| `cover` | `string` | 否 | 直播封面图。缺省时前端使用默认图。 |
| `status` | `"LIVE" | "WAIT"` | 否 | `LIVE` 显示直播中；`WAIT` 显示倒计时。 |
| `waitText` | `string` | 否 | 未开播时展示的倒计时文本。 |

#### `ChoicenessItem` 字段说明

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | `number` | 是 | 专题唯一标识。 |
| `title` | `string` | 是 | 专题标题。 |
| `cover` | `string` | 否 | 专题封面图。缺省时前端使用默认图。 |
| `latestText` | `string` | 是 | 当前模型保留字段，后续如果 UI 不展示也建议先返回。 |
| `minors` | `string[]` | 是 | 当前模型保留字段，后续扩展子标题或子视频列表。暂无数据时返回空数组。 |

#### `ExcellentItem` 字段说明

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | `number` | 是 | 视频唯一标识。 |
| `title` | `string` | 是 | 视频标题。 |
| `cover` | `string` | 否 | 视频封面图。缺省时前端使用默认图。 |
| `badge` | `string` | 否 | 角标文案，例如 `回放`。 |
| `href` | `string` | 否 | 点击跳转地址。 |

#### 后端实现建议

- 首页内容接口不要包含轮播图；轮播图使用独立 `/banners?placement=home`。
- 各列表可以先固定返回首页需要的数量：近期直播 10 条、精选专题 5 条、科普视频 4 条。
- 如果某一块暂无数据，返回空数组即可，前端会对该块 fallback。
- 建议后端按业务状态过滤掉禁用、下架、过期内容。

## 已确认已有或不属于本次缺口的接口

以下接口前端当前会用到，但 `medi-stream-rust` 当前路由表已存在，不列为待实现：

| 前端请求 | Rust 路由 | 当前用途 |
| --- | --- | --- |
| `GET /api/catalog/full` | `/catalog/full` | 首页左侧目录分类。 |
| `GET /api/wechat/oauth/authorize?redirect=/wechat-live-play` | `/wechat/oauth/authorize` | 微信 H5 授权入口。 |

## 前端验证方式

后端完成后，前端侧可以通过浏览器控制台日志确认：

- `[banner-api] fetch banners success`
- `[home] fetch home content success`
- `[home-page] load banners success`
- `[home-page] load home content success`

本地构建验证：

```bash
npm run build
```
