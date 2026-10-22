import { createFileRoute, redirect } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../components/ui/table';
import { categories, platformGuide, platformName, platformUsage } from '../lib/platform-docs';

export const Route = createFileRoute('/docs/$platform')({
  loader: ({ params }) => {
    const guide = platformGuide(params.platform);
    if (!guide) throw redirect({ to: '/error', search: { code: 'not_found' } });
    if (guide.key !== params.platform) {
      const section = guide.sections.find(item =>
        item.platforms.some(platform => platform.key === params.platform)
      );
      throw redirect({ to: '/docs/$platform', params: { platform: guide.key }, hash: section?.id });
    }
    return { guide };
  },
  head: ({ params }) => ({
    meta: [
      {
        title: `${platformGuide(params.platform)?.title || platformName(params.platform)} · 文档 · Suki Get`
      }
    ]
  }),
  component: PlatformDocument
});

function PlatformDocument() {
  const { guide } = Route.useLoaderData();
  const [origin, setOrigin] = useState('');
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);
  const category = categories[guide.category];

  return (
    <article className='wiki-article'>
      <div className='wiki-heading'>
        <p className='eyebrow'>PLATFORM GUIDE</p>
        <h1>{guide.title}</h1>
        <Badge variant='outline'>{category.title}</Badge>
        <p>{category.description}</p>
      </div>
      <Separator />
      <section className='wiki-section'>
        <h2>使用方式</h2>
        <p>
          可在首页转换资源链接或命令，也可按以下各小节使用对应的本站前缀。保留原有资源路径、请求方法、认证信息和查询参数。
        </p>
      </section>
      {guide.sections.map(section => {
        const representative = section.platforms[0];
        const usageExamples = platformUsage(representative.key, origin || 'https://get.syf.sh');
        return (
          <section className='wiki-section guide-section' id={section.id} key={section.id}>
            <h2>{section.title}</h2>
            {representative.category === 'container' && (
              <p>
                Docker Hub
                镜像只需在镜像名前加上本站域名；其他镜像仓库使用本站域名及对应前缀。镜像名与标签保留原仓库格式。
              </p>
            )}
            {representative.category === 'ai' && (
              <p>
                使用对应的 API 地址，保留接口路径、请求体和认证信息。仍需使用服务商提供的有效 API
                Key。
              </p>
            )}
            {['package', 'linux'].includes(representative.category) && (
              <p>
                在包管理器或软件源配置中替换上游地址，保留仓库内路径、发行版、组件及签名校验配置。
              </p>
            )}
            {representative.key === 'gh' && (
              <p>
                GitHub 默认省略 /gh/，直接填写用户与仓库路径；若用户名与本站入口重名，使用 /gh/
                明确指定。文件下载使用 raw、archive 或 releases/download 地址；blob 地址是文件页面。
              </p>
            )}
            {representative.key === 'pypi' && (
              <p>
                pip 的 index-url 使用本站
                /pypi/simple/，索引中的文件地址会改写到下方的软件包文件入口。
              </p>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>资源入口</TableHead>
                  <TableHead>上游地址</TableHead>
                  <TableHead>本站前缀</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {section.platforms.map(platform => (
                  <TableRow key={platform.key}>
                    <TableCell>{platformName(platform.key)}</TableCell>
                    <TableCell>
                      <code>{platform.upstream}</code>
                    </TableCell>
                    <TableCell>
                      <code>{`${origin || '<当前站点>'}${platform.pathPrefix}`}</code>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {section.platforms.length > 1 && (
              <p>
                各入口使用对应的域名与前缀，原始资源路径和查询参数保持完整。下面展示常用入口的用法。
              </p>
            )}
            {usageExamples.map((example, index) => {
              const title = example.title || '使用示例';
              const comment = (label: string) =>
                example.original.startsWith('<mirror>') ? `<!-- ${label} -->` : `# ${label}`;
              return (
                <pre
                  className='wiki-code'
                  key={`${representative.key}-${index}`}
                  aria-label={title}
                  tabIndex={0}
                >
                  <code>{`${comment(title)}\n\n${comment('上游用法')}\n${example.original}\n\n${comment('本站用法')}\n${example.accelerated}`}</code>
                </pre>
              );
            })}
          </section>
        );
      })}
      <section className='wiki-section wiki-note'>
        <h2>使用提示</h2>
        <p>
          示例中的占位内容需替换为实际仓库、分支、标签或文件名。资源访问权限由上游平台决定；签名链接应保留完整路径与查询参数。
        </p>
      </section>
    </article>
  );
}
