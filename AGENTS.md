# Suki Get

开发者资源加速工具。技术栈为 TanStack
Start、React、TypeScript 和 shadcn/ui，支持 Cloudflare Workers 与 Docker /
workerd 部署。

## 目录职责

### 应用源码 `src/`

| 目录                          | 用途与边界                                                                                                                                      |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/routes/`                 | TanStack Start 文件路由，定义首页、文档、平台详情及错误页。负责页面、路由参数和页面数据加载，不直接实现代理请求处理链。                         |
| `src/components/`             | 页面共用的业务组件，如站点导航和错误提示界面。                                                                                                  |
| `src/components/ui/`          | shadcn/ui 基础组件，如按钮、输入框、侧栏、表格和 Toast。通用控件样式与行为优先在此复用。                                                        |
| `src/hooks/`                  | React Hooks，目前包含移动端尺寸判断。只放可复用的界面状态与交互逻辑。                                                                           |
| `src/lib/`                    | 页面使用的纯数据与工具，如平台文档数据、错误码及提示文案。可供浏览器使用，不得依赖服务端模块。                                                  |
| `src/lib/platforms/`          | 前后端共享的平台目录、平台匹配、路径转换和地址生成规则，是这些规则的唯一数据来源。不得依赖服务端环境或执行网络请求。                            |
| `src/server/`                 | 仅服务端使用的逻辑。`dispatch.ts` 区分 Start 页面、服务端函数和代理请求，并处理浏览器错误页响应。禁止被客户端代码导入，构建配置已启用导入保护。 |
| `src/server/proxy/`           | 代理核心：创建运行配置与请求上下文、组织请求处理链、提供实例发现响应和共享服务端类型。                                                          |
| `src/server/proxy/protocols/` | Git / Git LFS、Docker / OCI、AI、Hugging Face 等协议识别、请求头和认证处理。                                                                    |
| `src/server/proxy/upstream/`  | 上游通信：生成请求选项、转发、超时、重试、匿名容器令牌重试、缓存策略与缓存读取。                                                                |
| `src/server/proxy/utils/`     | 代理链内复用的请求校验、CORS、安全头、性能监测和文本改写工具。此处是服务端工具，不供页面导入。                                                  |

### 静态资源 `public/`

存放站点品牌图标与浏览器图标，构建时原样复制并同时用于 Cloudflare 和 Docker。`brand-mark.svg`
用于页面品牌，`favicon.svg` 和 `favicon.ico`
用于浏览器标签，`apple-touch-icon.png` 用于手机收藏，`icon-512.png`
是高分辨率图标。品牌使用字母 S、前进箭头与短速度线的黑白设计。

### 构建脚本与生成目录

`.github/workflows/publish-image.yml`
在主分支推送、版本标签推送或手动运行时构建 AMD64 /
ARM64 镜像并发布到 GHCR，使用内置 `GITHUB_TOKEN`，不负责 Cloudflare 部署。

| 目录                 | 用途与维护方式                                                                                                  |
| -------------------- | --------------------------------------------------------------------------------------------------------------- |
| `scripts/`           | 项目构建脚本。目前只保留 `build-workerd.mjs`，负责将 Worker 模块和前端资源打包为 Docker 可运行的 workerd 应用。 |
| `dist/client/`       | 构建生成的浏览器 JavaScript、CSS、字体等静态资源，不手动编辑。                                                  |
| `dist/server/`       | 构建生成的服务端模块和部署配置，不手动编辑。                                                                    |
| `dist/docker/`       | workerd 独立运行包，包含服务端模块、静态资源与 Cap'n Proto 配置，不手动编辑。                                   |
| `.tanstack/`         | TanStack 开发与构建时生成的数据，不手动编辑或提交。                                                             |
| `.wrangler/`         | Wrangler 本地状态与开发缓存，不手动编辑或提交。                                                                 |
| `node_modules/`      | 包管理器安装的依赖，不手动修改或提交。                                                                          |
| `.idea/`、`.vscode/` | 本机 IDE 配置，按项目忽略规则处理，不作为应用架构的一部分。                                                     |

## 关键文件与请求流程

- `src/worker.ts`：Cloudflare /
  workerd 生产入口，接收请求、环境变量和执行上下文。
- `src/router.tsx`：创建 TanStack Router 实例并注册类型。
- `src/routeTree.gen.ts`：工具生成的路由树，通过路由生成命令或构建更新，不手动修改。
- `src/routes/__root.tsx`：页面根布局、全局 Toast 和页面错误边界。
- `src/styles.css`：全局主题、字体、布局、响应式规则及滚动条样式。
- `src/server/proxy/config.ts`：解析环境变量并生成运行配置。
- `src/server/proxy/request-context.ts`：解析请求特征，创建共享请求上下文。
- `src/server/proxy/handle-request.ts`：组织校验、路径解析、缓存读取、上游通信与响应处理。
- `src/server/proxy/resolve-target.ts`：路径标准化、上游目标解析与缓存目标地址。
- `src/server/proxy/finalize-response.ts`：响应改写、错误响应、缓存头与后台缓存写入。
- `src/server/proxy/types.ts`：请求上下文、协议特征、缓存策略等服务端类型。
- `src/lib/platforms/catalog.ts`：平台地址、转换元数据、发现接口路径与版本常量。
- `src/lib/platforms/conversion.ts`：平台清单、输入链接转换及转换错误类型。
- `vite.config.ts`：Start、React、Tailwind、Cloudflare 集成及客户端导入保护。
- `wrangler.toml`：生产 Worker 配置。
- `Dockerfile`、`compose.yaml`：Docker 构建与运行方式，运行时使用 workerd，不启动 Node
  HTTP 服务。
- `components.json`：shadcn/ui 组件配置。
- `README.md`、`LICENSE`：面向使用者的项目说明、来源与许可。

请求首先进入 `src/worker.ts`，经 `src/server/dispatch.ts`
分流：页面与 Start 服务端函数交给 Start，资源请求交给代理处理链。前端生成链接与服务端匹配平台共用
`src/lib/platforms`，避免规则分叉。

## 开发约定

- `src` 使用严格 TypeScript，不添加 JS 源码、`any`
  或类型检查忽略来绕过错误。工具自动生成的路由树不手动调整。
- 按职责与实际复用拆分模块，不为少量常量、单一错误类型或纯转导出新建文件；只有一个文件的目录优先压平。
- 修改平台支持时，从共享平台目录与规则入手，同时核对链接生成、服务端匹配与文档。
- Git、容器、AI 等请求必须保留原有方法、认证、请求头、流式响应和协议错误语义。重构目录或类型时，不改变公开 URL 与代理行为。
- 前端为中文，使用近黑背景、400 字重、等宽标签、描边胶囊按钮和无阴影卡片。控件使用 shadcn/ui。
- 首页为沉浸式单屏布局，左侧标题与描述，右侧链接输入和生成按钮。首页不显示“首页”导航，右上角“文档”链接位于主题按钮左侧；不使用统一 header。首页独立放置品牌与主题按钮；文档使用全高侧栏和独立工具栏，面包屑位于顶部工具栏。深浅色切换使用 shadcn/ui 按钮并记住选择。
- 首页输入框右侧仅保留一个描边图标按钮：初始为生成箭头，生成后用结果替换输入框内容、自动复制、显示 Toast 并切换为打开链接图标；仅用户手动修改内容时恢复生成状态，程序回填结果不得清除打开状态。正常屏幕尺寸下首页不应溢出一屏。
- 链接生成、复制等操作失败使用 Toast；页面不存在、页面加载失败与浏览器资源访问错误使用错误页。Toast 无关闭按钮，自动消失。
- 平台文档位于 `/docs`，使用侧栏与 Wiki 布局。
- 只维护 Cloudflare Workers 与 Docker / workerd，不恢复旧 CLI。GitHub
  Actions 只保留 GHCR 镜像自动发布工作流。
- 来源与许可在 README 和 LICENSE 说明；仅文档概览底部显示项目开源链接及原作者版权，不在平台详情页或源码中重复添加版权声明。
- 修改后按影响范围运行格式、Lint、类型和构建检查。纯文档修改检查格式与内容即可。
- 不自动提交、推送或部署。
- 任务取得阶段性进展时调用 `mcp__codex_app__fire_confetti`，按情况选择 Emoji。

## 常用检查

```bash
npm run format:check
npm run lint
npm run type-check
npm run build:docker
```

`npm run type-check` 检查应用类型；`npm run build:docker`
会先构建应用，再生成 workerd 独立包。部署预演可以使用构建后的
`wrangler deploy --dry-run`，实际部署须由用户明确授权。
