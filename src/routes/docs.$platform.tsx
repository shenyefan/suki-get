import { createFileRoute, redirect } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Table, TableBody, TableCell, TableRow } from '../components/ui/table';
import { categories, examples, platformName, platforms, platformUsage } from '../lib/platform-docs';
import { resolveUrl } from '../lib/platforms/conversion';

export const Route = createFileRoute('/docs/$platform')({
  loader: ({ params }) => {
    const platform = platforms.find(item => item.key === params.platform);
    if (!platform) {
      throw redirect({ to: '/error', search: { code: 'not_found' } });
    }
    return { platform };
  },
  head: ({ params }) => ({
    meta: [{ title: `${platformName(params.platform)} · 文档 · Suki Get` }]
  }),
  component: PlatformDocument
});

function PlatformDocument() {
  const { platform } = Route.useLoaderData();
  const [origin, setOrigin] = useState('');
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);
  const title = platformName(platform.key);
  const category = categories[platform.category];
  const sample = examples[platform.key];
  const converted = sample
    ? resolveUrl(sample, origin || 'https://suki-get.example').convertedUrl
    : '';
  const displayUrl = origin
    ? converted
    : converted.replace('https://suki-get.example', '<当前站点>');
  const prefix = `${origin || '<当前站点>'}${platform.pathPrefix}`;

  const usage = platformUsage(platform.key, origin || 'https://get.syf.sh');
  const usageExamples = usage.length
    ? usage
    : sample
      ? [{ title: '资源下载', original: sample, accelerated: displayUrl }]
      : [];

  return (
    <article className='wiki-article'>
      <div className='wiki-heading'>
        <p className='eyebrow'>PLATFORM GUIDE</p>
        <h1>{title}</h1>
        <Badge variant='outline'>{category.title}</Badge>
        <p>{category.description}</p>
      </div>
      <Separator />
      <section className='wiki-section'>
        <h2>平台地址</h2>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>上游地址</TableCell>
              <TableCell>
                <code>{platform.upstream}</code>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>本站前缀</TableCell>
              <TableCell>
                <code>{prefix}</code>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>平台标识</TableCell>
              <TableCell>
                <code>{platform.key}</code>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </section>
      <section className='wiki-section'>
        <h2>使用方式</h2>
        {!['container', 'ai', 'package', 'linux'].includes(platform.category) && (
          <p>
            在首页粘贴该平台的完整资源链接，点击输入框右侧的箭头。Suki Get
            会自动识别平台并转换地址，无需手动拼接路径。
          </p>
        )}
        {platform.category === 'ai' && (
          <p>
            在 API 客户端中使用本站对应的 API
            路径，保留上游接口路径、请求体和认证信息。需要对应服务商提供的有效 API Key。
          </p>
        )}
        {platform.category === 'container' && (
          <p>
            Docker Hub
            镜像只需在镜像名前加上本站域名；其他镜像仓库使用本站域名及镜像平台前缀。镜像名与标签仍按原仓库格式填写。服务端保留
            Registry V2 握手与认证处理。
          </p>
        )}
        {['package', 'linux'].includes(platform.category) && (
          <p>
            在包管理器或软件源配置中替换上游地址，保留仓库内路径、发行版、组件及签名校验配置。下方示例中的占位内容需按实际资源替换。
          </p>
        )}
        {platform.key === 'npm' && (
          <p>
            也可以把 npm 的 registry 设置为本站的 /npm/ 地址。软件包元数据中的下载地址会被同步改写。
          </p>
        )}
        {platform.key === 'pypi' && (
          <p>
            pip 的 index-url 使用本站 /pypi/simple/ 地址。软件包文件下载会通过对应的 PyPI
            文件路由转发。
          </p>
        )}
        {platform.key === 'gh' && (
          <p>
            支持 Git 克隆、分支与标签源码归档、Release 附件及仓库原始文件下载。下载文件应使用
            raw、archive 或 releases/download 地址；blob 地址展示的是文件页面。 GitHub 默认可省略
            /gh/，直接填写用户和仓库路径；若用户名与本站入口重名，使用 /gh/ 明确指定。
            raw.githubusercontent.com 的原始文件链接也可直接粘贴到首页，转换后使用 /raw/ 路径。
          </p>
        )}
      </section>
      {usageExamples.length > 0 && (
        <section className='wiki-section'>
          <h2>使用示例</h2>
          {usageExamples.map((example, index) => {
            const title = example.title || '使用示例';
            const comment = (label: string) =>
              example.original.startsWith('<mirror>') ? `<!-- ${label} -->` : `# ${label}`;
            return (
              <pre
                className='wiki-code'
                key={example.title || index}
                aria-label={title}
                tabIndex={0}
              >
                <code>{`${comment(title)}\n\n${comment('上游用法')}\n${example.original}\n\n${comment('本站用法')}\n${example.accelerated}`}</code>
              </pre>
            );
          })}
        </section>
      )}
      <section className='wiki-section wiki-note'>
        <h2>使用提示</h2>
        <p>
          示例中的占位内容需替换为实际仓库、分支、标签或文件名。资源的访问权限由上游平台决定；带有签名参数的链接应完整保留查询参数。
        </p>
      </section>
    </article>
  );
}
