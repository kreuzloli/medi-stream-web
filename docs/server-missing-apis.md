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

### 3. 获取近期直播列表

- 前端调用位置：`src/services/content.ts`
- 前端页面：`#/live-list`
- 请求方式：`GET`
- 前端请求路径：`/api/lives`
- Rust 服务路由建议：`/lives`
- 当前 fallback：接口失败、404 或返回空数组时使用 Home 近期直播假数据。

#### 响应格式

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "lives": [
      {
        "id": "live-1",
        "label": "今天",
        "time": "13:20",
        "isToday": true,
        "title": "直播标题",
        "cover": "https://example.com/live.jpg",
        "status": "LIVE",
        "waitText": "100小时"
      }
    ]
  }
}
```

`data` 也可以直接返回数组，或使用 `items`、`list` 字段。字段含义与首页内容接口的 `LiveItem` 一致。

### 4. 获取精选专题列表

- 前端调用位置：`src/services/content.ts`
- 前端页面：`#/topics`
- 请求方式：`GET`
- 前端请求路径：`/api/topics`
- Rust 服务路由建议：`/topics`
- 当前 fallback：接口失败、404 或返回空数组时使用 25 条本地专题数据。

#### 响应格式

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "topics": [
      {
        "id": 1,
        "title": "专题标题",
        "cover": "https://example.com/topic.jpg",
        "latestText": "最新时间1月11日 共11期",
        "followed": true,
        "minors": ["子主题一", "子主题二", "子主题三"]
      }
    ]
  }
}
```

`data` 也可以直接返回数组，或使用 `items`、`list` 字段。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | `number` | 是 | 专题唯一标识。 |
| `title` | `string` | 是 | 专题标题。 |
| `cover` | `string` | 否 | 专题封面。 |
| `latestText` | `string` | 是 | 最新一期和总期数展示文本。 |
| `followed` | `boolean` | 是 | 当前用户是否已关注。 |
| `minors` | `string[]` | 是 | 卡片下方最多展示三条子主题。 |

### 5. 获取科研培训列表

- 前端调用位置：`src/services/content.ts`
- 前端页面：`#/training`
- 请求方式：`GET`
- 前端请求路径：`/api/trainings`
- Rust 服务路由建议：`/trainings`
- 当前 fallback：接口失败、404 或返回空数组时使用本地培训列表。

#### 响应格式

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "trainings": [
      {
        "id": "training-1",
        "title": "培训通知标题",
        "date": "2026-7-7",
        "cover": "https://example.com/training.jpg"
      }
    ]
  }
}
```

`data` 也可以直接返回数组，或使用 `items`、`list` 字段。建议按发布日期倒序返回。

### 6. 获取科研培训详情

- 前端调用位置：`src/services/content.ts`
- 前端页面：`#/training-detail?id=<id>`
- 请求方式：`GET`
- 前端请求路径：`/api/trainings/{id}`
- Rust 服务路由建议：`/trainings/:id`
- 当前 fallback：请求失败或响应格式不正确时展示本地文章。

#### Path 参数

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | `string` | 是 | 培训内容唯一标识。 |

#### 响应格式

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "training-1",
    "title": "培训通知标题",
    "date": "2026-7-7",
    "cover": "https://example.com/training-cover.jpg",
    "source": "柳翠",
    "paragraphs": ["第一段正文", "第二段正文"],
    "contentImage": "https://example.com/article-image.jpg",
    "imageCaption": "图：培训主视觉",
    "relatedLink": "https://example.com/service",
    "relatedLinkText": "相关链接：如何获取培训服务"
  }
}
```

详情也可以包装在 `training`、`detail` 或 `item` 字段中。`paragraphs` 应按页面展示顺序返回，不建议把未经清洗的 HTML 直接交给前端。

### 7. 查询证书

- 前端调用位置：`src/services/content.ts`
- 前端页面：`#/certificates`
- 请求方式：`POST`
- 前端请求路径：`/api/certificates/query`
- Rust 服务路由建议：`/certificates/query`
- `Content-Type`：`application/json`
- 当前 fallback：临时接口无法连接时进入带“演示数据”提示的示例详情；后端明确返回 404 时按“未查到”展示错误，不伪造查询成功。

#### 请求体

```json
{
  "name": "郭靖",
  "idNumber": "22010419860812131X",
  "phone": "13800000000"
}
```

三个字段均为必填。后端必须同时匹配姓名、身份证号和手机号，不应仅凭单一字段返回证书。

#### 查询成功

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "certificateId": "certificate-1"
  }
}
```

`data` 也可以包装在 `result`、`detail` 或 `item` 字段中。

#### 未查到

建议返回 `404`，响应示例：

```json
{
  "code": 404,
  "message": "未查询到匹配的证书",
  "data": null
}
```

### 8. 获取证书详情

- 前端调用位置：`src/services/content.ts`
- 前端页面：`#/certificate-detail?id=<id>`
- 请求方式：`GET`
- 前端请求路径：`/api/certificates/{id}`
- Rust 服务路由建议：`/certificates/:id`
- 当前 fallback：仅从查询页进入显式演示流程时展示示例证书；正常详情请求失败或响应格式不正确时展示页面内错误状态。

#### 响应格式

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "certificate": {
      "id": "certificate-1",
      "name": "郭靖",
      "gender": "男",
      "idNumber": "22010419860812131X",
      "certificateName": "2026年GCP及伦理审查提升培训班",
      "certificateNumber": "FDSA-GCP202605243284",
      "issueDate": "2026-05-24",
      "level": "无"
    }
  }
}
```

详情也可以直接放在 `data` 中，或包装在 `detail`、`item` 字段中。证书查询涉及个人信息，后端日志不要打印完整身份证号和手机号，接口应结合现有认证、访问频控和审计策略。

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
- `[content-api] request success`

本地构建验证：

```bash
npm run build
```
