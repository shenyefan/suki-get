import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { categories, platforms } from '../lib/platform-docs';

export const Route = createFileRoute('/docs/')({
  head: () => ({ meta: [{ title: '文档 · Suki Get' }] }),
  component: DocumentationHome
});

function DocumentationHome() {
  const [origin, setOrigin] = useState('https://get.syf.sh');
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);
  const host = new URL(origin).host;
  return (
    <article className='wiki-article docs-overview'>
      <div className='wiki-heading'>
        <p className='eyebrow'>THE FIELD GUIDE</p>
        <h1>平台与用法。</h1>
        <p>找到你的平台，让下一个请求更顺畅。</p>
        <Badge variant='outline'>{platforms.length} 个平台 · 6 类资源</Badge>
      </div>
      <section className='docs-quickstart' aria-labelledby='quickstart-title'>
        <div>
          <h2 id='quickstart-title'>从一个链接开始</h2>
          <p>粘贴资源链接或命令，生成并自动复制。链接与命令中的资源地址使用当前站点域名。</p>
        </div>
        <Button asChild variant='outline'>
          <Link to='/'>
            去生成 <ArrowUpRight aria-hidden='true' />
          </Link>
        </Button>
      </section>
      <section className='wiki-section'>
        <h2>首页也能转换命令</h2>
        <p>
          支持 docker pull、git clone、curl、wget，以及包含 registry、index-url
          等地址的包管理器命令。生成后保留原有选项并自动复制；命令结果使用复制按钮，链接结果可以直接打开。
        </p>
        <pre className='wiki-code' aria-label='命令转换示例' tabIndex={0}>
          <code>{`# 上游命令\ndocker pull ghcr.io/shenyefan/suki-get\n\n# 本站命令\ndocker pull ${host}/cr/ghcr/shenyefan/suki-get`}</code>
        </pre>
      </section>
      <section className='wiki-section'>
        <h2>GitHub：默认省略前缀</h2>
        <p>
          GitHub 资源可以直接在本站域名后填写用户、仓库和资源路径，支持克隆、源码归档、Release
          附件及文件下载。首页生成 GitHub 链接或命令时默认使用这种写法。
        </p>
        <pre className='wiki-code' aria-label='默认 GitHub 示例' tabIndex={0}>
          <code>{`# 克隆仓库\ngit clone "${origin}/microsoft/vscode.git"\n\n# 下载源码\ncurl -fL -o source.zip "${origin}/microsoft/vscode/archive/refs/heads/main.zip"`}</code>
        </pre>
        <p>
          若用户名与本站平台前缀或页面入口重名，请使用 /gh/ 前缀明确指定
          GitHub；首页遇到这种情况会自动保留前缀。
        </p>
      </section>
      <section className='wiki-section'>
        <h2>两种地址用法</h2>
        <p>
          可以使用平台文档中的专属前缀，也可以在本站域名后直接拼接完整上游地址，自动识别平台。原地址中的
          https:// 和查询参数需完整保留。
        </p>
        <pre className='wiki-code' aria-label='前缀与自动识别示例' tabIndex={0}>
          <code>{`# 平台前缀\ngit clone "${origin}/gh/microsoft/vscode.git"\n\n# 自动识别\ngit clone "${origin}/https://github.com/microsoft/vscode.git"`}</code>
        </pre>
        <p>
          文件下载、源码归档、Release 附件及 API
          请求也可使用完整地址方式；请求方法、认证信息和请求体保持原有用法。自动识别仅适用于本站支持的平台。
        </p>
        <pre className='wiki-code' aria-label='自动识别文件下载示例' tabIndex={0}>
          <code>{`curl -fL -o source.zip "${origin}/https://github.com/microsoft/vscode/archive/refs/heads/main.zip"`}</code>
        </pre>
      </section>
      <section className='wiki-section'>
        <h2>容器镜像：默认 Docker Hub</h2>
        <p>
          镜像名前只加本站域名，默认从 Docker Hub 拉取。官方镜像可省略
          library/，其他镜像保留原命名空间。
        </p>
        <pre className='wiki-code' aria-label='默认 Docker Hub 示例' tabIndex={0}>
          <code>{`# 官方镜像\ndocker pull ${host}/nginx:latest\n\n# 带命名空间的镜像\ndocker pull ${host}/<命名空间>/<镜像名>:<标签>`}</code>
        </pre>
        <p>
          其他镜像仓库使用 /cr/平台/ 前缀；Docker Hub 也可以继续使用 /cr/docker/。docker pull
          的镜像名不使用 https:// 完整地址格式。
        </p>
        <pre className='wiki-code' aria-label='指定镜像仓库示例' tabIndex={0}>
          <code>{`# GitHub Container Registry\ndocker pull ${host}/cr/ghcr/<命名空间>/<镜像名>:<标签>\n\n# 显式指定 Docker Hub\ndocker pull ${host}/cr/docker/library/nginx:latest`}</code>
        </pre>
      </section>
      <section className='wiki-section'>
        <h2>AI 接口：默认 OpenAI</h2>
        <p>
          OpenAI 客户端的 Base URL 可直接设置为本站 /v1，接口请求会转发到 OpenAI。继续使用 OpenAI 的
          API Key，并保留请求体与流式调用参数。
        </p>
        <pre className='wiki-code' aria-label='默认 OpenAI 地址' tabIndex={0}>
          <code>{`# Base URL\n${origin}/v1\n\n# 请求地址\nPOST ${origin}/v1/chat/completions`}</code>
        </pre>
        <p>
          也可继续使用 /openai/v1；其他 AI 服务使用各自平台前缀，或在本站域名后拼接完整 API 地址。
        </p>
      </section>
      <section className='wiki-section' aria-labelledby='categories-title'>
        <div className='docs-section-heading'>
          <h2 id='categories-title'>浏览平台</h2>
          <span className='eyebrow'>EXPLORE / 06</span>
        </div>
        <div className='docs-category-grid'>
          {Object.entries(categories).map(([key, category], index) => {
            const items = platforms.filter(platform => platform.category === key);
            return (
              <Button asChild variant='ghost' key={key} className='docs-category-link'>
                <Link to='/docs/$platform' params={{ platform: items[0].key }}>
                  <span className='docs-category-number'>0{index + 1}</span>
                  <span className='docs-category-copy'>
                    <span className='docs-category-title'>{category.title}</span>
                    <span className='docs-category-description'>{category.description}</span>
                    <span className='docs-category-count'>{items.length} 个平台</span>
                  </span>
                  <ArrowRight aria-hidden='true' />
                </Link>
              </Button>
            );
          })}
        </div>
      </section>
      <section className='wiki-section wiki-note'>
        <h2>使用之前</h2>
        <p>
          平台清单表示本站提供对应的路由与转换规则。访问权限、API
          额度及资源可用性由上游决定；API、包管理器和容器客户端仍按各自协议使用。
        </p>
      </section>
      <footer className='docs-project-footer' aria-label='项目来源与版权'>
        <Button asChild variant='link' className='docs-source-link'>
          <a href='https://github.com/shenyefan/suki-get' target='_blank' rel='noopener noreferrer'>
            shenyefan / suki-get <ArrowUpRight aria-hidden='true' />
          </a>
        </Button>
        <p>基于 xixu-me / xget 二次开发</p>
      </footer>
    </article>
  );
}
