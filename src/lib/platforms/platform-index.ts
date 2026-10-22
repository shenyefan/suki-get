import { PLATFORM_CATALOG, PLATFORM_DEFINITIONS } from './catalog';

/**
 * Converts a platform key into its matching URL prefix.
 */
export function getPlatformPathPrefix(platformKey: string): string {
  if (PLATFORM_DEFINITIONS[platformKey]?.category === 'ai') {
    return `/${platformKey.slice(3)}/`;
  }
  return `/${platformKey.replace(/-/g, '/')}/`;
}

/**
 * Pre-computed sorted platform keys for efficient path matching.
 */
export const SORTED_PLATFORMS = Object.keys(PLATFORM_CATALOG).sort((a, b) => {
  return getPlatformPathPrefix(b).length - getPlatformPathPrefix(a).length;
});

/**
 * Matches a route on complete path segments, preferring the longest prefix.
 */
export function matchPlatformPath(path: string): string | undefined {
  return SORTED_PLATFORMS.find(key => {
    const prefix = getPlatformPathPrefix(key);
    return path.startsWith(prefix) || path === prefix.slice(0, -1);
  });
}

/** Bare owner/repository paths belong to GitHub unless an existing entry owns them. */
export function isDefaultGitHubPath(path: string): boolean {
  const segments = path.split('/');
  return (
    !matchPlatformPath(path) &&
    !['docs', 'error', 'assets', 'v1', 'v2', 'cr'].includes(segments[1]) &&
    /^[a-z0-9][a-z0-9-]{0,38}$/i.test(segments[1] || '') &&
    /^[a-z0-9_.-]+$/i.test(segments[2] || '') &&
    !['.', '..'].includes(segments[2])
  );
}
