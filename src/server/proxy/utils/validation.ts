import type { ApplicationConfig } from '../config';
import type { RequestTraits } from '../types';

/**
 * Request validation utilities for Suki Get
 */

import { CONFIG } from '../config';
import { DISCOVERY_PATH, PLATFORM_DEFINITIONS } from '#/lib/platforms/catalog.ts';
import { matchPlatformPath } from '#/lib/platforms/platform-index';
import { ContractError, resolveProxyRequestUrl } from '#/lib/platforms/conversion';

// Imported protocol checks
import { isAIInferenceRequest } from '../protocols/ai';
import { isGitLFSRequest, isGitRequest } from '../protocols/git';
import { isHuggingFaceAPIRequest } from '../protocols/huggingface';

/**
 * Computes protocol and request traits used across validation, routing, and response handling.
 */
export function getRequestTraits(request: Request, url: URL): RequestTraits {
  // Error-page classification also receives the original embedded-URL request.
  try {
    url = resolveProxyRequestUrl(url);
  } catch (error) {
    if (!(error instanceof ContractError)) throw error;
  }
  const platform = matchPlatformPath(url.pathname);
  return {
    isAPI: platform !== undefined && PLATFORM_DEFINITIONS[platform].protocol === 'api',
    isAI: isAIInferenceRequest(request, url),
    isDocker: isDockerRequest(request, url),
    isGit: isGitRequest(request, url),
    isGitLFS: isGitLFSRequest(request, url),
    isHF: isHuggingFaceAPIRequest(request, url)
  };
}

/**
 * Checks whether a request should use protocol passthrough behavior.
 */
export function isProtocolRequest(traits: RequestTraits): boolean {
  return (
    traits.isAPI || traits.isGit || traits.isGitLFS || traits.isDocker || traits.isAI || traits.isHF
  );
}

/**
 * Best-effort decode for security validation.
 *
 * URL.pathname may keep some reserved characters percent-encoded (e.g. %2F).
 * We decode a couple of times to catch traversal attempts like %2e%2e%2f.
 */
function decodePathnameForValidation(
  pathname: string
): { ok: true; value: string } | { ok: false } {
  let decoded = pathname;
  for (let i = 0; i < 2; i++) {
    if (!/%[0-9a-fA-F]{2}/.test(decoded)) {
      break;
    }
    try {
      decoded = decodeURIComponent(decoded);
    } catch {
      return { ok: false };
    }
  }
  return { ok: true, value: decoded };
}

/**
 * Detects directory traversal patterns in a URL path.
 */
function hasPathTraversal(pathname: string): boolean {
  const decodedResult = decodePathnameForValidation(pathname);
  if (!decodedResult.ok) {
    return true;
  }

  const decoded = decodedResult.value.replace(/\\/g, '/');
  return /(^|\/)\.\.(\/|$)/.test(decoded);
}

/**
 * Checks for ASCII control characters.
 */
function hasAsciiControlChars(value: string): boolean {
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code <= 31 || code === 127) {
      return true;
    }
  }
  return false;
}

/**
 * Detects if a request is a container registry operation (Docker/OCI).
 *
 * Identifies Docker and OCI registry requests by checking for:
 * - Registry API endpoints (/v2/...)
 * - Docker-specific User-Agent headers
 * - Docker/OCI manifest Accept headers
 */
export function isDockerRequest(request: Request, url: URL): boolean {
  const { pathname } = url;

  // Check for container registry API endpoints
  if (pathname === '/v2' || pathname === '/v2/' || pathname.startsWith('/v2/')) {
    return true;
  }

  if (pathname.startsWith('/cr/')) {
    if (/^\/cr\/[^/]+\/v2(?:\/|$)/.test(pathname)) {
      return true;
    }

    const userAgent = request.headers.get('User-Agent') || '';
    if (userAgent.toLowerCase().includes('docker/')) {
      return true;
    }

    const accept = request.headers.get('Accept') || '';
    if (
      accept.includes('application/vnd.docker.distribution.manifest') ||
      accept.includes('application/vnd.oci.image.manifest') ||
      accept.includes('application/vnd.docker.image.rootfs.diff.tar.gzip')
    ) {
      return true;
    }

    const contentType = request.headers.get('Content-Type') || '';
    if (
      contentType.includes('application/vnd.docker.distribution.manifest') ||
      contentType.includes('application/vnd.oci.image.manifest')
    ) {
      return true;
    }
  }

  return false;
}

// Re-export for standard usage
export { isAIInferenceRequest, isGitLFSRequest, isGitRequest, isHuggingFaceAPIRequest };

/**
 * Computes the allowed methods for a request based on protocol detection.
 */
export function getAllowedMethods(
  request: Request,
  url: URL,
  config: ApplicationConfig = CONFIG
): string[] {
  if (url.pathname === DISCOVERY_PATH) {
    return ['GET', 'HEAD'];
  }
  const traits = getRequestTraits(request, url);

  return isProtocolRequest(traits)
    ? ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE']
    : config.SECURITY.ALLOWED_METHODS;
}

/**
 * Validates incoming requests against security rules.
 *
 * Performs security validation including:
 * - HTTP method validation (with special allowances for protocol-specific operations)
 * - URL path length limits
 *
 * Different protocols have different allowed methods:
 * - Regular requests: GET, HEAD (configurable via SECURITY.ALLOWED_METHODS)
 * - Git/LFS/Docker/AI/Hugging Face API: GET, HEAD, POST, PUT, PATCH, DELETE
 */
export function validateRequest(
  request: Request,
  url: URL,
  config: ApplicationConfig = CONFIG,
  traits: RequestTraits = getRequestTraits(request, url)
): { valid: boolean; error?: string; status?: number } {
  const allowedMethods = isProtocolRequest(traits)
    ? ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE']
    : config.SECURITY.ALLOWED_METHODS;

  if (!allowedMethods.includes(request.method)) {
    return { valid: false, error: 'Method not allowed', status: 405 };
  }

  if (new URL(request.url).pathname.length > config.SECURITY.MAX_PATH_LENGTH) {
    return { valid: false, error: 'Path too long', status: 414 };
  }

  // Reject obvious traversal in the raw URL path (before URL normalization).
  // Some runtimes normalize `..` segments when parsing URL.pathname.
  const rawPathname = request.url.startsWith(url.origin)
    ? request.url.slice(url.origin.length).split('?')[0].split('#')[0].replace(/\\/g, '/')
    : url.pathname;

  if (/(^|\/)\.\.(\/|$)/.test(rawPathname)) {
    return { valid: false, error: 'Invalid path', status: 400 };
  }

  // Reject control characters and directory traversal attempts.
  // This protects both our routing logic and upstream requests.
  if (hasAsciiControlChars(url.pathname)) {
    return { valid: false, error: 'Invalid path', status: 400 };
  }

  if (hasPathTraversal(url.pathname)) {
    return { valid: false, error: 'Invalid path', status: 400 };
  }

  return { valid: true };
}
