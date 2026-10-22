import type { ApplicationConfig } from './config';
import type { PerformanceMonitor } from './utils/performance';
import type { RequestTraits } from './types';

import {
  isFlatpakReferenceFilePath,
  rewriteTextResponse,
  shouldRewriteTextResponse
} from './utils/rewrite';
import { resolveCachePolicy, resolveResponseCachePolicy } from './upstream/cache-policy';
import { addSecurityHeaders, createErrorResponse } from './utils/security';

/**
 * Wraps an unsuccessful upstream response into the user-facing error contract.
 */
async function finalizeErrorResponse({
  requestContext,
  response,
  responseGeneratedLocally
}: {
  effectivePath: string;
  platform: string;
  request: Request;
  requestContext: RequestTraits;
  response: Response;
  responseGeneratedLocally: boolean;
  url: URL;
}): Promise<Response> {
  if (responseGeneratedLocally || response.ok || response.status === 206) {
    return response;
  }

  if (requestContext.isDocker && response.status === 401) {
    if (!response.headers.has('WWW-Authenticate')) {
      const isCustomError =
        response.headers.get('content-type') === 'application/json' &&
        (await response.clone().text()).includes('UNAUTHORIZED');

      if (!isCustomError) {
        const errorText = await response.text().catch(() => '');
        return createErrorResponse(
          `Authentication required for this container registry resource. This may be a private repository. Original error: ${errorText}`,
          401,
          true
        );
      }
    }

    return response;
  }

  if (
    requestContext.isAPI ||
    requestContext.isAI ||
    requestContext.isHF ||
    requestContext.isGit ||
    requestContext.isGitLFS
  ) {
    return response;
  }

  const errorText = await response.text().catch(() => 'Unknown error');
  return createErrorResponse(
    `Upstream server error (${response.status}): ${errorText}`,
    response.status,
    true
  );
}

/**
 * Finalizes a successful upstream response, including rewriting, cache headers, and background cache writes.
 */
async function finalizeSuccessfulResponse({
  cache,
  cacheTargetUrl,
  canUseCache,
  config,
  ctx,
  effectivePath,
  hasSensitiveHeaders,
  monitor,
  platform,
  request,
  requestContext,
  response,
  targetUrl = cacheTargetUrl,
  url
}: {
  cache: Cache | null;
  cacheTargetUrl: string;
  canUseCache: boolean;
  config: ApplicationConfig;
  ctx: ExecutionContext;
  effectivePath: string;
  hasSensitiveHeaders: boolean;
  monitor: PerformanceMonitor;
  platform: string;
  request: Request;
  requestContext: RequestTraits;
  response: Response;
  targetUrl?: string;
  url: URL;
}): Promise<Response> {
  const { isAPI, isAI, isDocker, isGit, isGitLFS, isHF } = requestContext;

  let responseBody: string | ReadableStream<Uint8Array> | null = response.body;
  let rewrittenContentLength = null;
  let hasOriginBoundRewrite = false;

  if (
    shouldRewriteTextResponse(platform, effectivePath, response.headers.get('content-type') || '')
  ) {
    const originalText =
      platform === 'flathub' && isFlatpakReferenceFilePath(effectivePath)
        ? new TextDecoder().decode(await response.arrayBuffer())
        : await response.text();
    const rewrittenText = rewriteTextResponse(platform, effectivePath, originalText, url.origin);
    responseBody = rewrittenText;
    rewrittenContentLength = new TextEncoder().encode(rewrittenText).byteLength;
    hasOriginBoundRewrite = platform === 'pypi';
  }

  const headers = new Headers(response.headers);

  if (rewrittenContentLength !== null) {
    // Upstream validators and encodings describe the original bytes, not this rewritten body.
    for (const name of ['ETag', 'Content-MD5', 'Digest', 'Content-Encoding']) headers.delete(name);
    headers.set('Content-Length', String(rewrittenContentLength));
  }

  const requestCachePolicy = resolveCachePolicy({
    canUseCache,
    config,
    effectivePath,
    hasOriginBoundRewrite,
    hasSensitiveHeaders,
    platform,
    request,
    requestContext,
    targetUrl
  });
  const cachePolicy = resolveResponseCachePolicy({
    basePolicy: requestCachePolicy,
    response
  });

  if (!isGit && !isGitLFS && !isDocker && !isAI && !isHF && !isAPI) {
    headers.set('Cache-Control', cachePolicy.cacheControl);

    if (cachePolicy.mode === 'private') {
      const existingVary = headers.get('Vary');
      headers.set(
        'Vary',
        existingVary ? `${existingVary}, Authorization, Cookie` : 'Authorization, Cookie'
      );
    }

    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Accept-Ranges', 'bytes');

    if (!headers.has('Content-Length') && response.status === 200) {
      try {
        const contentLength = response.headers.get('Content-Length');
        if (contentLength) {
          headers.set('Content-Length', contentLength);
        }
      } catch (error) {
        console.warn('Could not set Content-Length header:', error);
      }
    }

    addSecurityHeaders(headers);
  }

  let finalizedResponse = new Response(responseBody, {
    status: response.status,
    headers
  });

  if (
    cache &&
    cachePolicy.allowCacheApi &&
    request.method === 'GET' &&
    finalizedResponse.ok &&
    finalizedResponse.status === 200
  ) {
    const rangeHeader = request.headers.get('Range');
    const cacheKey = rangeHeader
      ? new Request(cacheTargetUrl, {
          method: 'GET',
          headers: new Headers(
            [...request.headers.entries()].filter(([key]) => key.toLowerCase() !== 'range')
          )
        })
      : new Request(cacheTargetUrl, { method: 'GET' });

    try {
      if (ctx && typeof ctx.waitUntil === 'function') {
        ctx.waitUntil(cache.put(cacheKey, finalizedResponse.clone()));
      } else {
        cache.put(cacheKey, finalizedResponse.clone()).catch(error => {
          console.warn('Cache put failed:', error);
        });
      }

      if (rangeHeader && finalizedResponse.status === 200) {
        const rangedResponse = await cache.match(
          new Request(cacheTargetUrl, {
            method: 'GET',
            headers: request.headers
          })
        );
        if (rangedResponse) {
          monitor.mark('range_cache_hit_after_full_cache');
          finalizedResponse = rangedResponse;
        }
      }
    } catch (cacheError) {
      console.warn('Cache put/match failed:', cacheError);
    }
  }

  return finalizedResponse;
}

/**
 * Finalizes the upstream response after cache lookup and fetch execution.
 */
export async function finalizeResponse({
  cache,
  cacheTargetUrl,
  canUseCache,
  config,
  ctx,
  effectivePath,
  hasSensitiveHeaders,
  monitor,
  platform,
  request,
  requestContext,
  response,
  responseGeneratedLocally,
  targetUrl = cacheTargetUrl,
  url
}: {
  cache: Cache | null;
  cacheTargetUrl: string;
  canUseCache: boolean;
  config: ApplicationConfig;
  ctx: ExecutionContext;
  effectivePath: string;
  hasSensitiveHeaders: boolean;
  monitor: PerformanceMonitor;
  platform: string;
  request: Request;
  requestContext: RequestTraits;
  response: Response;
  responseGeneratedLocally: boolean;
  targetUrl?: string;
  url: URL;
}): Promise<Response> {
  const errorResponse = await finalizeErrorResponse({
    effectivePath,
    platform,
    request,
    requestContext,
    response,
    responseGeneratedLocally,
    url
  });

  if (errorResponse !== response || !errorResponse.ok) {
    return errorResponse;
  }

  return await finalizeSuccessfulResponse({
    cache,
    cacheTargetUrl,
    canUseCache,
    config,
    ctx,
    effectivePath,
    hasSensitiveHeaders,
    monitor,
    platform,
    request,
    requestContext,
    response: errorResponse,
    targetUrl,
    url
  });
}
