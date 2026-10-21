import { Link } from '@tanstack/react-router';
import { ArrowLeft, ArrowUpRight, RotateCw } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { errorDetails } from '../lib/errors';
import type { AppErrorCode } from '../lib/errors';

export function ErrorScreen({ code, retry }: { code: AppErrorCode; retry?: () => void }) {
  const detail = errorDetails[code];
  return (
    <main className='error-layout'>
      <Card className='error-card'>
        <CardHeader>
          <p className='eyebrow'>SOMETHING WENT WRONG</p>
          <p className='error-status' aria-label={`错误代码 ${detail.status}`}>
            {detail.status}
          </p>
          <CardTitle>{detail.title}</CardTitle>
          <CardDescription>{detail.description}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild variant='outline'>
            <Link to='/'>
              <ArrowLeft aria-hidden='true' />
              返回首页
            </Link>
          </Button>
          {retry ? (
            <Button variant='outline' onClick={retry}>
              <RotateCw aria-hidden='true' />
              重新尝试
            </Button>
          ) : (
            <Button asChild variant='outline'>
              <Link to='/docs'>
                查看文档 <ArrowUpRight aria-hidden='true' />
              </Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </main>
  );
}
