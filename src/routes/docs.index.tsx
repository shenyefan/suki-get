import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { categories, platforms } from '../lib/platform-docs';

export const Route = createFileRoute('/docs/')({
  head: () => ({ meta: [{ title: '文档 · Suki Get' }] }),
  component: DocumentationHome
});

function DocumentationHome() {
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
          <p>粘贴完整资源地址，生成并自动复制。加速链接使用当前站点域名。</p>
        </div>
        <Button asChild variant='outline'>
          <Link to='/'>
            去生成 <ArrowUpRight aria-hidden='true' />
          </Link>
        </Button>
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
