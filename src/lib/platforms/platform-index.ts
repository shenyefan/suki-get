import { PLATFORM_CATALOG } from './catalog';

/**
 * Converts a platform key into its matching URL prefix.
 */
export function getPlatformPathPrefix(platformKey: string): string {
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
