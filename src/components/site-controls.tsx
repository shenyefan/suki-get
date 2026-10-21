import { Link } from '@tanstack/react-router';
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from './ui/button';

export function SiteNavigation({ className = '' }: { className?: string }) {
  return (
    <nav aria-label='主导航' className={`site-navigation ${className}`}>
      <Button asChild variant='ghost'>
        <Link to='/' activeProps={{ 'aria-current': 'page' }} activeOptions={{ exact: true }}>
          首页
        </Link>
      </Button>
      <Button asChild variant='ghost'>
        <Link to='/docs' activeProps={{ 'aria-current': 'page' }}>
          文档
        </Link>
      </Button>
    </nav>
  );
}

export function SiteBrand() {
  return (
    <Button asChild variant='ghost' className='brand-link' aria-label='Suki Get 首页'>
      <Link to='/'>
        <img
          src='/brand-mark.svg'
          alt=''
          aria-hidden='true'
          width='28'
          height='28'
          className='brand-mark'
        />
        <span>Suki Get</span>
      </Link>
    </Button>
  );
}

export function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('suki-get-theme');
      const nextDark = saved !== 'light';
      setDark(nextDark);
      document.documentElement.classList.toggle('dark', nextDark);
      document.documentElement.dataset.theme = nextDark ? 'dark' : 'light';
    } catch {
      // The default dark theme also works when browser storage is unavailable.
    }
  }, []);

  function toggleTheme() {
    const nextDark = !dark;
    setDark(nextDark);
    document.documentElement.classList.toggle('dark', nextDark);
    document.documentElement.dataset.theme = nextDark ? 'dark' : 'light';
    try {
      localStorage.setItem('suki-get-theme', nextDark ? 'dark' : 'light');
    } catch {
      // Theme switching remains available without persistent storage.
    }
  }

  return (
    <Button
      variant='ghost'
      size='icon'
      className='theme-toggle'
      onClick={toggleTheme}
      aria-label={dark ? '切换浅色模式' : '切换深色模式'}
      title={dark ? '切换浅色模式' : '切换深色模式'}
    >
      {dark ? <Sun aria-hidden='true' /> : <Moon aria-hidden='true' />}
    </Button>
  );
}
