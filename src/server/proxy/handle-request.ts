import { handleDockerAuth } from './protocols/docker';
import { createDiscoveryResponse } from './discovery';
import { DISCOVERY_PATH } from '#/lib/platforms/catalog.ts';
import { finalizeResponse } from './finalize-response';
import { normalizeEffectivePath, resolveTarget } from './resolve-target';
import { getDefaultCache, tryReadCachedResponse } from './upstream/cache';
import { resolveCachePolicy } from './upstream/cache-policy';
import { fetchUpstreamResponse } from './upstream/fetch-upstream';
import { PerformanceMonitor, addPerformanceHeaders } from './utils/performance';
import { addCorsHeaders, addSecurityHeaders, createErrorResponse } from './utils/security';
import { getAllowedMethods, isProtocolRequest, validateRequest } from './utils/validation';
import { createRequestContext } from './request-context';
import { ContractError } from '#/lib/platforms/conversion';
import type { RequestContext } from './types';

/**
 * Main request handler with comprehensive caching, retry logic, and security measures.
 */
export async function handleRequest(
  request: Request,
  env: Record<string, unknown>,
  ctx: ExecutionContext
): Promise<Response> {
  let response;
  const monitor = new PerformanceMonitor();
  let requestContext: RequestContext;
  try {
    requestContext = createRequestContext(request, env);
  } catch (error) {
    if (!(error instanceof ContractError)) throw error;
    return createErrorResponse(error.message, error.code === 'INVALID_URL' ? 400 : 404);
  }
  const { config, isCorsPreflight, isDocker, url } = requestContext;

  try {
    if (isCorsPreflight) {
      const requestedMethod = request.headers.get('Access-Control-Request-Method') || '';
      const allowedMethods = getAllowedMethods(
        new Request(request.url, { method: requestedMethod || 'GET' }),
        url,
        config
      );

      if (!allowedMethods.includes(requestedMethod)) {
        response =
          url.pathname === DISCOVERY_PATH
            ? createDiscoveryResponse(request)
            : createErrorResponse('Method not allowed', 405);
      } else {
        const headers = addCorsHeaders(new Headers(), request, config);
        if (!headers.has('Access-Control-Allow-Origin')) {
          response = createErrorResponse('Origin not allowed', 403);
        } else {
          headers.set('Access-Control-Allow-Methods', allowedMethods.join(', '));
          headers.set('Access-Control-Max-Age', '86400');
          addSecurityHeaders(headers);
          response = new Response(null, { status: 204, headers });
        }
      }
    } else if (url.pathname === DISCOVERY_PATH) {
      response = createDiscoveryResponse(request);
    }
    // Handle Docker API version check
    else if (isDocker && (url.pathname === '/v2/' || url.pathname === '/v2')) {
      const headers = new Headers({
        'Docker-Distribution-Api-Version': 'registry/2.0',
        'Content-Type': 'application/json'
      });
      addSecurityHeaders(headers);
      response = new Response('{}', { status: 200, headers });
    }
    // The application homepage is served by Start; the proxy core requires a resource path.
    else if (url.pathname === '/' || url.pathname === '') {
      response = createErrorResponse('Resource path required', 400);
    } else {
      const validation = validateRequest(request, url, config, requestContext);
      if (!validation.valid) {
        response = createErrorResponse(
          validation.error || 'Validation failed',
          validation.status || 400
        );
      } else {
        const normalizedPath = normalizeEffectivePath(url, isDocker);
        let effectivePath = url.pathname;

        if ('response' in normalizedPath) {
          const { response: normalizedResponse } = normalizedPath;
          response = normalizedResponse;
        } else {
          const { effectivePath: normalizedEffectivePath } = normalizedPath;
          effectivePath = normalizedEffectivePath;
        }

        if (!response) {
          // Handle Docker authentication explicitly
          if (
            isDocker &&
            (url.pathname === '/v2/auth' || /^\/cr\/[^/]+\/v2\/auth\/?$/.test(url.pathname))
          ) {
            response = await handleDockerAuth(request, url, config);
          } else {
            const resolvedTarget = resolveTarget(url, effectivePath, config.PLATFORMS);

            if ('response' in resolvedTarget) {
              const { response: targetResponse } = resolvedTarget;
              response = targetResponse;
            } else {
              const { cacheTargetUrl, platform, targetUrl } = resolvedTarget;
              const authorization = request.headers.get('Authorization');
              const hasSensitiveHeaders = Boolean(
                authorization ||
                request.headers.get('Cookie') ||
                request.headers.get('Proxy-Authorization')
              );
              const canUseCache = request.method === 'GET' || request.method === 'HEAD';
              const shouldPassthroughRequest = isProtocolRequest(requestContext) || !canUseCache;
              const cachePolicy = resolveCachePolicy({
                canUseCache,
                config,
                effectivePath,
                hasSensitiveHeaders,
                platform,
                request,
                requestContext,
                targetUrl
              });
              const cache = getDefaultCache();

              response = await tryReadCachedResponse({
                cache,
                cacheTargetUrl,
                cachePolicy,
                canUseCache,
                hasSensitiveHeaders,
                monitor,
                request,
                requestContext
              });

              if (!response) {
                const {
                  response: upstreamResponse,
                  responseGeneratedLocally: upstreamResponseGeneratedLocally
                } = await fetchUpstreamResponse({
                  authorization,
                  cachePolicy,
                  canUseCache,
                  config,
                  effectivePath,
                  monitor,
                  platform,
                  request,
                  requestContext,
                  shouldPassthroughRequest,
                  targetUrl
                });
                response = await finalizeResponse({
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
                  response: upstreamResponse,
                  responseGeneratedLocally: upstreamResponseGeneratedLocally,
                  targetUrl,
                  url
                });
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error handling request:', error);
    response = createErrorResponse('Internal Server Error', 500);
  }

  // Ensure performance headers are added to the final response
  monitor.mark('complete');

  const responseWithCors = (() => {
    const headers = addCorsHeaders(new Headers(response.headers), request, config);
    if (headers.has('Access-Control-Allow-Origin')) {
      headers.set(
        'Access-Control-Allow-Methods',
        getAllowedMethods(request, url, config).join(', ')
      );
    }
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  })();

  return isProtocolRequest(requestContext)
    ? responseWithCors
    : addPerformanceHeaders(responseWithCors, monitor);
}
