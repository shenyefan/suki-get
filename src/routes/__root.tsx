import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router';
import { ErrorScreen } from '../components/error-screen';
import { Toaster } from '../components/ui/sonner';
import { TooltipProvider } from '../components/ui/tooltip';

import appCss from '../styles.css?url';
import React from 'react';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8'
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1'
      },
      {
        title: 'Suki Get · 开发者资源加速'
      }
    ],
    links: [
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
      { rel: 'icon', href: '/favicon.ico', sizes: '16x16 32x32 48x48' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png', sizes: '180x180' },
      {
        rel: 'stylesheet',
        href: appCss
      }
    ]
  }),
  component: AppShell,
  errorComponent: ({ reset }) => <ErrorScreen code='internal' retry={reset} />,
  notFoundComponent: () => <ErrorScreen code='not_found' />,
  shellComponent: RootDocument
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang='zh-CN' className='dark'>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}

        <Scripts />
      </body>
    </html>
  );
}

function AppShell() {
  return (
    <TooltipProvider>
      <Outlet />
      <Toaster
        position='bottom-right'
        duration={3500}
        containerAriaLabel='通知'
        toastOptions={{
          classNames: { toast: 'suki-toast', title: 'font-normal', description: 'font-normal' }
        }}
      />
    </TooltipProvider>
  );
}
