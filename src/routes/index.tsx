import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowRight, ArrowUpRight, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { convertResourceInput } from '../lib/platforms/command-conversion';
import { errorDetails } from '../lib/errors';
import { SiteBrand, ThemeToggle } from '../components/site-controls';

export const Route = createFileRoute('/')({ component: Home });

function Home() {
  const [origin, setOrigin] = useState('');
  const [input, setInput] = useState('');
  const [generated, setGenerated] = useState<{ kind: 'url' | 'command'; value: string } | null>(
    null
  );
  const [copying, setCopying] = useState(false);
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  async function copyResult(result: { kind: 'url' | 'command'; value: string }) {
    setCopying(true);
    try {
      await navigator.clipboard.writeText(result.value);
      toast.success(result.kind === 'command' ? '加速命令已复制' : '加速链接已复制', {
        description:
          result.kind === 'command' ? '可粘贴到终端使用。' : '可直接粘贴使用，或点击“打开”访问。',
        id: 'link-conversion'
      });
    } catch {
      toast.error(errorDetails.copy_failed.title, {
        description: errorDetails.copy_failed.description,
        id: 'link-conversion'
      });
    } finally {
      setCopying(false);
    }
  }

  async function convert(event: FormEvent) {
    event.preventDefault();
    if (copying) return;
    if (generated) {
      if (generated.kind === 'command') await copyResult(generated);
      return;
    }
    try {
      const result = convertResourceInput(input, origin);
      setInput(result.value);
      setGenerated(result);
      await copyResult(result);
    } catch (cause) {
      setGenerated(null);
      const code = cause && typeof cause === 'object' && 'code' in cause ? cause.code : '';
      const details =
        errorDetails[
          code === 'INVALID_COMMAND'
            ? 'invalid_command'
            : code === 'INVALID_URL'
              ? 'invalid_url'
              : 'unsupported_url'
        ];
      toast.error(details.title, { description: details.description, id: 'link-conversion' });
    }
  }

  return (
    <main id='main' className='home-layout'>
      <div className='home-topbar'>
        <SiteBrand />
        <div className='home-topbar-actions'>
          <Button asChild variant='ghost'>
            <Link to='/docs'>文档</Link>
          </Button>
          <ThemeToggle />
        </div>
      </div>
      <div className='home-orbit' aria-hidden='true' />
      <section className='home-copy' aria-labelledby='home-title'>
        <p className='eyebrow home-eyebrow'>LESS WAITING. MORE BUILDING.</p>
        <h1 id='home-title'>
          让资源，
          <br />
          更快抵达。
        </h1>
        <p>
          代码、软件包、容器镜像与 AI 接口。
          <br />
          一个入口，连接你的开发工作流。
        </p>
      </section>
      <section className='home-workspace' aria-label='资源工作台'>
        <div className='home-transfer' aria-hidden='true'>
          <span>FROM ANYWHERE</span>
          <span className='transfer-line' />
          <span>TO YOUR FLOW</span>
        </div>
        <form
          className='home-converter'
          onSubmit={convert}
          noValidate
          aria-label='生成加速链接或命令'
        >
          <Label className='sr-only' htmlFor='resource-url'>
            原始资源链接或命令
          </Label>
          <Input
            id='resource-url'
            type='text'
            value={input}
            onChange={event => {
              const nextInput = event.target.value;
              if (nextInput !== input) {
                setInput(nextInput);
                setGenerated(null);
              }
            }}
            placeholder='粘贴链接或命令，如 docker pull …'
            autoComplete='off'
            spellCheck={false}
            disabled={copying}
          />
          {generated?.kind === 'url' && !copying ? (
            <Button asChild variant='outline' size='icon' className='home-submit'>
              <a
                href={generated.value}
                target='_blank'
                rel='noopener noreferrer'
                aria-label='打开加速链接'
                title='打开加速链接'
              >
                <ArrowUpRight aria-hidden='true' />
              </a>
            </Button>
          ) : (
            <Button
              type='submit'
              variant='outline'
              size='icon'
              className='home-submit'
              disabled={!origin || copying}
              aria-label={
                copying
                  ? '正在复制'
                  : generated?.kind === 'command'
                    ? '复制加速命令'
                    : '生成加速链接或命令'
              }
              title={
                copying
                  ? '正在复制'
                  : generated?.kind === 'command'
                    ? '复制加速命令'
                    : '生成加速链接或命令'
              }
            >
              {generated?.kind === 'command' ? (
                <Copy aria-hidden='true' />
              ) : (
                <ArrowRight aria-hidden='true' />
              )}
            </Button>
          )}
        </form>
      </section>
    </main>
  );
}
