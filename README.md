# Suki Get

Suki Get 是开发者资源加速工具，使用官方 TanStack CLI 创建 TanStack
Start 项目，接入原有代理核心，并提供简洁的中文界面。

## 功能

- 首页粘贴资源链接后生成加速地址，自动复制并显示短暂通知，可点击输入框右侧切换后的打开图标访问。
- 链接生成、复制失败使用 Toast 提示；页面不存在、页面加载失败及资源访问错误展示错误页。
- 文档页按类别展示支持的平台，提供搜索、平台详情和命令示例。
- 支持代码仓库、软件包、Linux 软件源、开发资源、容器镜像及 AI 接口。
- 提供请求转发、超时重试、地址改写，以及 Git、容器和 AI 流式协议处理。

页面采用近黑背景、常规字重、描边胶囊按钮及无阴影卡片，基于 shadcn/ui 组件构建。字体随应用本地打包。

## 本地开发

使用 Node.js 26 和 npm：

```bash
npm ci
npm run dev
```

访问 `http://localhost:8787`。生成的加速链接默认使用当前访问域名。

## Cloudflare 自动部署

直接在 Cloudflare Workers 中连接 Git 仓库，无需 GitHub Actions：

1. 打开 Cloudflare 控制台，在 **Workers & Pages**
   中创建或选择 Worker，并连接 GitHub / GitLab 仓库。
2. Worker 名称填写 `suki-get`，与 `wrangler.toml` 的 `name` 一致。
3. 根目录使用仓库根目录 `/`，构建命令设为 `npm run build`，部署命令设为
   `npx wrangler deploy`。
4. 选择生产分支；仓库的 `.node-version` 指定 Node.js
   26。Cloudflare 会安装依赖，再构建和部署。
5. 部署成功后使用分配的 `workers.dev` 地址，或在 Worker 设置中绑定自己的域名。

之后向生产分支推送即可触发自动部署。构建产物包含服务端渲染 Worker 与前端资源，Vite 插件会生成 Wrangler 使用的部署配置。

构建设置参考
[Cloudflare Workers Builds 官方说明](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)。

如需从本机手动部署：

```bash
npm run deploy
```

## Docker 镜像自动发布

`.github/workflows/publish-image.yml` 通过 GitHub Actions 自动发布到
`ghcr.io/shenyefan/suki-get`，同时提供 AMD64 和 ARM64 镜像：

- 向默认主分支（`master` / `main`）推送：更新 `latest`。
- 推送版本标签（如 `v1.0.0`）：发布 `1.0.0`、`1.0` 版本镜像。
- 每次发布同时生成 `sha-` 开头的提交标签，便于固定版本。
- 也可在仓库 **Actions → Publish Docker image → Run workflow** 手动运行。

使用 GitHub 内置
`GITHUB_TOKEN`，无需配置个人令牌。将工作流提交并推送到 GitHub 后即可触发；首次发布成功后，在 GitHub 个人主页的
**Packages → suki-get → Package settings → Change visibility** 中将镜像设为
**Public**，才能匿名拉取。详见
[GitHub 容器镜像仓库说明](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)。

## Docker 自托管

首次自动发布成功且镜像设为公开后，可直接拉取运行：

```bash
docker pull ghcr.io/shenyefan/suki-get:latest
docker run -d --name suki-get -p 8080:8080 --restart unless-stopped ghcr.io/shenyefan/suki-get:latest
```

也可使用仓库提供的 Compose：

```bash
docker compose up -d
```

访问 `http://localhost:8080`。更新已部署的镜像：

```bash
docker compose pull
docker compose up -d
```

如需从源码本地构建：

```bash
docker build -t suki-get .
docker run --rm -p 8080:8080 -e TIMEOUT_SECONDS=30 suki-get
```

Docker 使用 workerd 运行同一份 Worker 构建产物，不运行 Node
HTTP 服务。`scripts/build-workerd.mjs`
负责打包服务器模块与静态资源，是 Docker 构建所需的唯一项目脚本。

本机也可直接运行独立包：

```bash
npm run build:docker
npm start
```

自托管环境不具备 Cloudflare 的全球边缘缓存；缓存接口不可用时直接回源。放在反向代理后时应正确保留外部 Host 与 HTTPS 协议。

## 实例发现

`GET /.well-known/suki-get.json` 返回当前实例的平台清单及地址转换能力，支持
`HEAD`。

除了平台前缀，也可在站点域名后拼接完整上游地址，自动识别已支持的平台，例如
`git clone https://get.syf.sh/https://github.com/microsoft/vscode.git`。文件下载和 API 请求同样适用，保留原接口路径、查询参数、请求方法及认证信息。

GitHub 默认省略 `/gh/`，例如
`git clone https://get.syf.sh/microsoft/vscode.git`。首页生成 GitHub 链接或命令时默认采用这种写法；若用户名与已有平台或页面入口重名，则保留
`/gh/`。

容器镜像默认使用 Docker
Hub：`docker pull get.syf.sh/nginx:latest`，带命名空间的镜像保留完整镜像名。其他镜像仓库继续使用平台前缀，如
`docker pull get.syf.sh/cr/ghcr/<命名空间>/<镜像名>:<标签>`。容器镜像引用不使用嵌入
`https://` 的写法。更多用法见站点文档概览。

OpenAI 客户端的 Base URL 可直接使用 `https://get.syf.sh/v1`，也可继续使用
`https://get.syf.sh/openai/v1`。其他 AI 服务使用对应平台前缀或完整 URL 自动识别。

首页支持链接及单条客户端命令，例如
`docker pull ghcr.io/shenyefan/suki-get`、`git clone`、`curl`、`wget`
及包含软件源地址的包管理器命令。命令生成后自动复制，结果按钮可再次复制；链接生成后可直接打开。

## 运行配置

Cloudflare 可在 `wrangler.toml` 的 `[vars]`
中设置普通配置；Docker 使用环境变量或 Compose。敏感值使用 Cloudflare
Secrets，避免提交到仓库。

| 变量              | 默认值     | 用途                                         |
| ----------------- | ---------- | -------------------------------------------- |
| `TIMEOUT_SECONDS` | `30`       | 上游请求超时，单位秒                         |
| `MAX_RETRIES`     | `3`        | 最大重试次数                                 |
| `RETRY_DELAY_MS`  | `1000`     | 重试间隔，单位毫秒                           |
| `CACHE_DURATION`  | `300`      | 可变资源后备缓存时间，单位秒                 |
| `ALLOWED_METHODS` | `GET,HEAD` | 普通下载请求允许的方法；特殊协议由处理器判断 |
| `ALLOWED_ORIGINS` | `*`        | 允许的跨域来源，多个值以逗号分隔             |
| `MAX_PATH_LENGTH` | `2048`     | 最大请求路径长度                             |

## 项目结构

```text
src/routes/             TanStack Start 页面文件路由
src/router.tsx          类型安全路由器
src/worker.ts           Cloudflare / workerd 入口与 Start 适配
src/components/ui/      shadcn/ui 组件
src/hooks/              React Hooks
src/lib/platforms/      浏览器与服务端共用的平台目录、地址转换及匹配规则
src/lib/                页面文档数据与错误说明
src/server/dispatch.ts  页面、服务端函数与代理请求的分流
src/server/proxy/       代理请求处理链、运行配置与实例发现
  protocols/            Git、容器、AI 等协议处理
  resolve-target.ts     上游目标解析
  upstream/             请求重试、缓存策略与读取
  finalize-response.ts  响应改写及缓存写入
  utils/                请求校验、安全及性能处理
  types.ts              请求上下文、协议特征与缓存策略类型
scripts/                Docker / workerd 打包
```

界面路由继续使用 Start 的文件路由。入口按现有规则把页面与服务端函数交给 Start，其余资源请求交给代理核心；保留原始 URL、请求方法、认证、缓存和流式响应语义。代理服务端模块禁止被客户端导入，共享的平台转换模块不依赖服务端代码。

`src` 全部使用 TypeScript，并启用严格类型检查。

## 检查与构建

```bash
npm run lint
npm run format:check
npm run type-check
npm run build
```

首页只做地址转换，不会提前下载或探测资源。浏览器访问错误会进入站内错误页；Git、容器及 AI 客户端继续接收原协议错误响应。生成成功不代表上游资源可用；访问权限、API
Key、额度和资源有效期仍由对应平台决定。

## 项目来源

本项目基于 Xi Xu 的开源代理项目二次开发。开源许可证为
**AGPL-3.0-or-later**，详见 [LICENSE](LICENSE)。
