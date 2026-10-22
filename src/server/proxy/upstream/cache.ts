import type { PerformanceMonitor } from '../utils/performance';
import type { RequestTraits } from '../types';

/**
 * Cache helpers for upstream request handling.
 */

/**
 * Reads the default Cloudflare cache when available.
 */
export function getDefaultCache(): Cache | null {
  return typeof caches !== 'undefined' && (caches as CacheStorage & { default: Cache }).default
    ? (caches as CacheStorage & { default: Cache }).default
    : null;
}

/**
 * Attempts to satisfy a request from cache before reaching the upstream.
 */
export async function tryReadCachedResponse({
  cache,
  cacheTargetUrl,
  cachePolicy,
  canUseCache,
  hasSensitiveHeaders,
  monitor,
  request,
  requestContext
}: {
  cache: Cache | null;
  cacheTargetUrl: string;
  cachePolicy?: { allowCacheApi: boolean };
  canUseCache: boolean;
  hasSensitiveHeaders: boolean;
  monitor: PerformanceMonitor;
  request: Request;
  requestContext: RequestTraits;
}): Promise<Response | null> {
  const { isAPI, isAI, isDocker, isGit, isGitLFS, isHF } = requestContext;

  if (
    !cache ||
    (cachePolicy && !cachePolicy.allowCacheApi) ||
    !canUseCache ||
    isGit ||
    isGitLFS ||
    isDocker ||
    isAPI ||
    isAI ||
    isHF ||
    hasSensitiveHeaders
  ) {
    return null;
  }

  try {
    const cacheKey = new Request(cacheTargetUrl, {
      method: 'GET',
      headers: request.headers
    });
    const cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) {
      monitor.mark('cache_hit');
      return cachedResponse;
    }

    const rangeHeader = request.headers.get('Range');
    if (!rangeHeader) {
      return null;
    }

    const fullContentKey = new Request(cacheTargetUrl, {
      method: 'GET',
      headers: new Headers(
        [...request.headers.entries()].filter(([key]) => key.toLowerCase() !== 'range')
      )
    });
    const fullCachedResponse = await cache.match(fullContentKey);
    if (fullCachedResponse) {
      monitor.mark('cache_hit_full_content');
      return fullCachedResponse;
    }
  } catch (cacheError) {
    console.warn('Cache API unavailable:', cacheError);
  }

  return null;
}
