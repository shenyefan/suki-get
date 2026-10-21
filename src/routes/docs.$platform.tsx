import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { ArrowUpRight, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { Table, TableBody, TableCell, TableRow } from '../components/ui/table';
import { Textarea } from '../components/ui/textarea';
import { categories, examples, platformName, platforms } from '../lib/platform-docs';
import { resolveUrl } from '../lib/platforms/conversion';
import { errorDetails } from '../lib/errors';

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

  async function copyExample() {
    try {
      await navigator.clipboard.writeText(converted);
      toast.success('加速示例已复制');
    } catch {
      toast.error(errorDetails.copy_failed.title, {
        description: errorDetails.copy_failed.description
      });
    }
  }

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
        <Button asChild variant='outline'>
          <a href={platform.upstream} target='_blank' rel='noopener noreferrer'>
            访问上游 <ArrowUpRight aria-hidden='true' />
          </a>
        </Button>
      </section>
      <section className='wiki-section'>
        <h2>使用方式</h2>
        <p>
          在首页粘贴该平台的完整资源链接，点击输入框右侧的箭头。Suki Get
          会自动识别平台并转换地址，无需手动拼接路径。
        </p>
        {platform.category === 'ai' && (
          <p>
            在 API 客户端中使用本站对应的 API
            路径，保留上游接口路径、请求体和认证信息。需要对应服务商提供的有效 API Key。
          </p>
        )}
        {platform.category === 'container' && (
          <p>
            容器客户端使用本站域名及镜像平台前缀访问资源，镜像名与标签仍按原仓库格式填写。服务端保留
            Registry V2 握手与认证处理。
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
          <p>支持仓库文件、源码归档与 Git 请求。克隆仓库时保留 .git 后缀及原始 Git 请求路径。</p>
        )}
      </section>
      {sample && (
        <section className='wiki-section'>
          <h2>链接示例</h2>
          <Card>
            <CardHeader>
              <CardTitle>原始资源</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea aria-label='原始资源示例' readOnly value={sample} rows={2} />
            </CardContent>
          </Card>
          <Card className='example-output'>
            <CardHeader>
              <CardTitle>本站加速地址</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea aria-label='加速资源示例' readOnly value={displayUrl} rows={3} />
              <Button variant='outline' size='sm' onClick={copyExample} disabled={!origin}>
                <Copy aria-hidden='true' />
                复制加速示例
              </Button>
            </CardContent>
          </Card>
          <p className='wiki-caption'>这是地址格式示例，不会自动探测或下载该资源。</p>
        </section>
      )}
      <section className='wiki-section wiki-note'>
        <h2>使用提示</h2>
        <p>
          资源的访问权限和服务可用性由上游平台决定。生成链接不代表已验证资源可用；带有签名参数的链接应完整保留查询参数。
        </p>
        <Button asChild variant='outline'>
          <Link to='/'>
            回到首页 <ArrowUpRight aria-hidden='true' />
          </Link>
        </Button>
      </section>
    </article>
  );
}
