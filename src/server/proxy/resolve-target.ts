import { PLATFORM_DEFINITIONS } from '#/lib/platforms/catalog.ts';
import { getPlatformPathPrefix, matchPlatformPath } from '#/lib/platforms/platform-index.ts';
import { transformPath } from '#/lib/platforms/platform-transformers.ts';
import { normalizeRegistryApiPath } from '#/lib/platforms/registry-path.ts';
import { shouldVaryCacheByOrigin } from './upstream/cache-policy';
import { createErrorResponse } from './utils/security';

/**
 * Normalizes request paths before platform routing.
 */
export function normalizeEffectivePath(
  url: URL,
  isDocker: boolean
): { effectivePath: string } | { response: Response } {
  let effectivePath = url.pathname;

  if (!isDocker) {
    return { effectivePath };
  }

  // Bare image references on this host use Docker Hub; explicit /cr/ routes win.
  if (
    url.pathname.startsWith('/v2/') &&
    !url.pathname.startsWith('/v2/cr/') &&
    url.pathname !== '/v2/auth'
  ) {
    return { effectivePath: `/cr/docker${url.pathname}` };
  }

  if (
    !url.pathname.startsWith('/cr/') &&
    !url.pathname.startsWith('/v2/cr/') &&
    url.pathname !== '/v2/auth'
  ) {
    return {
      response: createErrorResponse('container registry requests must use /cr/ prefix', 400)
    };
  }

  effectivePath = url.pathname.replace(/^\/v2/, '');

  if (url.pathname.startsWith('/v2/cr/')) {
    effectivePath = effectivePath.replace(/^\/cr\/([^/]+)\//, '/cr/$1/v2/');
  }

  return { effectivePath };
}

/**
 * Resolves an effective request path to an upstream target URL.
 */
export function resolveTarget(
  url: URL,
  effectivePath: string,
  platforms: { [key: string]: string }
):
  | {
      cacheTargetUrl: string;
      platform: string;
      shouldVaryCacheByOrigin: boolean;
      targetPath: string;
      targetUrl: string;
    }
  | { response: Response } {
  const platform = matchPlatformPath(effectivePath);

  if (!platform || !platforms[platform]) {
    return { response: createErrorResponse('Unknown resource platform', 404) };
  }

  const platformPath = getPlatformPathPrefix(platform).slice(0, -1);
  if (
    effectivePath === platformPath ||
    (effectivePath === `${platformPath}/` && !PLATFORM_DEFINITIONS[platform]?.conversion.rootRoute)
  ) {
    return { response: createErrorResponse('Resource path required', 400) };
  }

  const transformedPath = transformPath(effectivePath, platform);
  const targetPath = platform.startsWith('cr-')
    ? normalizeRegistryApiPath(platform, transformedPath)
    : transformedPath;
  const targetUrl = `${platforms[platform]}${targetPath}${url.search}`;
  const varyCacheByOrigin = shouldVaryCacheByOrigin(platform, effectivePath);
  const cacheTargetUrl = varyCacheByOrigin
    ? `${targetUrl}${targetUrl.includes('?') ? '&' : '?'}__suki_get_origin=${encodeURIComponent(url.origin)}`
    : targetUrl;

  return {
    cacheTargetUrl,
    platform,
    shouldVaryCacheByOrigin: varyCacheByOrigin,
    targetPath,
    targetUrl
  };
}
