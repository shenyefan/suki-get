import { createFileRoute, Link, Outlet, useLocation } from '@tanstack/react-router';
import { useState } from 'react';
import { BookOpen, Search } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { SiteBrand, SiteNavigation, ThemeToggle } from '../components/site-controls';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '../components/ui/breadcrumb';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar
} from '../components/ui/sidebar';
import { categories, platformName, platforms } from '../lib/platform-docs';

export const Route = createFileRoute('/docs')({ component: DocsLayout });

function DocumentationSidebar() {
  const [query, setQuery] = useState('');
  const { pathname } = useLocation();
  const { setOpenMobile } = useSidebar();
  const filtered = platforms.filter(platform =>
    `${platformName(platform.key)} ${platform.key} ${platform.upstream} ${categories[platform.category].title}`
      .toLowerCase()
      .includes(query.trim().toLowerCase())
  );
  return (
    <Sidebar className='docs-sidebar'>
      <SidebarHeader>
        <div className='docs-brand'>
          <SiteBrand />
          <span className='eyebrow'>文档</span>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === '/docs' || pathname === '/docs/'}
              onClick={() => setOpenMobile(false)}
            >
              <Link to='/docs'>
                <BookOpen aria-hidden='true' />
                <span>文档概览</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <Label htmlFor='platform-search' className='sr-only'>
          搜索文档平台
        </Label>
        <div className='docs-search'>
          <Search aria-hidden='true' />
          <Input
            id='platform-search'
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder='搜索平台…'
            type='search'
          />
        </div>
      </SidebarHeader>
      <SidebarContent>
        {Object.entries(categories).map(([category, definition]) => {
          const items = filtered.filter(platform => platform.category === category);
          return items.length ? (
            <SidebarGroup key={category}>
              <SidebarGroupLabel>{definition.title}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map(platform => (
                    <SidebarMenuItem key={platform.key}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === `/docs/${platform.key}`}
                        onClick={() => setOpenMobile(false)}
                      >
                        <Link to='/docs/$platform' params={{ platform: platform.key }}>
                          <span>{platformName(platform.key)}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ) : null;
        })}
        {!filtered.length && (
          <p className='sidebar-empty' role='status'>
            没有匹配的平台。
          </p>
        )}
      </SidebarContent>
    </Sidebar>
  );
}

function DocsLayout() {
  const { pathname } = useLocation();
  const key = pathname.split('/')[2];
  return (
    <SidebarProvider className='docs-frame'>
      <DocumentationSidebar />
      <SidebarInset className='docs-inset'>
        <div className='docs-toolbar'>
          <SidebarTrigger aria-label='切换文档目录' />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                {key ? (
                  <BreadcrumbLink asChild>
                    <Link to='/docs'>文档</Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>文档</BreadcrumbPage>
                )}
              </BreadcrumbItem>
              {key && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{platformName(key)}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
          <div className='docs-toolbar-actions'>
            <SiteNavigation />
            <ThemeToggle />
          </div>
        </div>
        <div id='main' className='docs-content'>
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
