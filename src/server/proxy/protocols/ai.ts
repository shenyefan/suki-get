import { PLATFORM_DEFINITIONS } from '#/lib/platforms/catalog';
import { matchPlatformPath } from '#/lib/platforms/platform-index';

/**
 * Detects if a request is for an AI inference provider API.
 *
 * Uses the shared platform catalog to recognize flat provider paths.
 */
export function isAIInferenceRequest(request: Request, url: URL): boolean {
  void request;
  const platform = matchPlatformPath(url.pathname);
  return platform !== undefined && PLATFORM_DEFINITIONS[platform].category === 'ai';
}

/**
 * Configures headers for AI protocol requests.
 *
 * Sets Content-Type and User-Agent headers for AI inference requests.
 */
export function configureAIHeaders(headers: Headers, request: Request) {
  if (request.method === 'POST' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (!headers.has('User-Agent')) {
    headers.set('User-Agent', 'Suki-Get-AI-Proxy/1.0');
  }
}
