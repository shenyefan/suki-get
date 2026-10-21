import type { ApplicationConfig } from '../config';
import type { RequestTraits, CachePolicy } from '../types';

import { isFlatpakReferenceFilePath } from '../utils/rewrite';

const METADATA_EDGE_TTL_SECONDS = 60;
const MUTABLE_EDGE_TTL_SECONDS = 300;
const IMMUTABLE_EDGE_TTL_SECONDS = 86400;
const IMMUTABLE_BROWSER_TTL_SECONDS = 3600;

const GITHUB_RELEASE_ARTIFACT_PATTERN =
  /\.(?:tgz|whl|jar|zip|gem|crate|deb|rpm|nupkg|tar\.gz|tar\.bz2|tar\.xz)(?:$|[?#])/i;
const MAVEN_ARTIFACT_PATTERN = /\.(?:jar|pom|war|aar|module)(?:$|[?#])/i;
const PYPI_FILE_ARTIFACT_PATTERN = /\.(?:whl|zip|tar\.gz|tar\.bz2|tar\.xz)(?:$|[?#])/i;
const MOVING_VERSION_ALIASES = new Set([
  'current',
  'dev',
  'edge',
  'latest',
  'main',
  'master',
  'nightly',
  'snapshot',
  'stable'
]);

/**
 * Extracts a pathname from either a request path or an absolute URL.
 */
function getPathname(value: string): string {
  try {
    return new URL(value).pathname;
  } catch {
    return value.split(/[?#]/, 1)[0] || '';
  }
}

/**
 * Extracts the last path segment from a pathname.
 */
function getBasename(pathname: string): string {
  const basename = pathname.split('/').filter(Boolean).at(-1) || '';
  try {
    return decodeURIComponent(basename);
  } catch {
    return basename;
  }
}

/**
 * Checks whether a segment contains an explicit version instead of a moving alias.
 */
function hasVersionLikeToken(value: string): boolean {
  const normalized = value.toLowerCase();
  if (MOVING_VERSION_ALIASES.has(normalized)) {
    return false;
  }

  return /(?:^|[-_.])v?\d/.test(normalized);
}

/**
 * Reads the tag segment from a GitHub releases/download path.
 */
function getGithubReleaseDownloadTag(pathname: string): string | null {
  const segments = pathname.split('/').filter(Boolean);
  const releasesIndex = segments.findIndex(
    (segment, index) => segment === 'releases' && segments[index + 1] === 'download'
  );

  if (releasesIndex === -1) {
    return null;
  }

  const tag = segments[releasesIndex + 2];
  if (!tag) {
    return null;
  }

  try {
    return decodeURIComponent(tag);
  } catch {
    return tag;
  }
}

/**
 * Checks whether a GitHub request targets a release asset instead of a branch archive.
 */
function isGithubReleaseArtifact(effectivePath: string, targetPath: string): boolean {
  const effectiveTag = getGithubReleaseDownloadTag(effectivePath);
  const targetTag = getGithubReleaseDownloadTag(targetPath);

  return (
    (effectivePath.includes('/releases/download/') || targetPath.includes('/releases/download/')) &&
    (GITHUB_RELEASE_ARTIFACT_PATTERN.test(effectivePath) ||
      GITHUB_RELEASE_ARTIFACT_PATTERN.test(targetPath)) &&
    ((effectiveTag !== null && hasVersionLikeToken(effectiveTag)) ||
      (targetTag !== null && hasVersionLikeToken(targetTag)))
  );
}

/**
 * Checks whether a npm path points to a package tarball.
 */
function isNpmTarballPath(pathname: string): boolean {
  return /^\/(?:npm\/)?(?:@[^/]+\/)?[^/]+\/-\/[^/]+\.tgz$/i.test(pathname);
}

/**
 * Checks whether a Maven path contains a non-SNAPSHOT versioned artifact.
 */
function isMavenReleaseArtifactPath(pathname: string): boolean {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length < 4 || !MAVEN_ARTIFACT_PATTERN.test(pathname)) {
    return false;
  }

  const version = segments.at(-2) || '';
  return /\d/.test(version) && !version.toUpperCase().includes('SNAPSHOT');
}

/**
 * Checks whether a PyPI file path points to a versioned distribution artifact.
 */
function isVersionedPyPIFilePath(pathname: string): boolean {
  if (!PYPI_FILE_ARTIFACT_PATTERN.test(pathname)) {
    return false;
  }

  const basename = getBasename(pathname);
  const stem = basename.replace(/\.(?:whl|zip|tar\.gz|tar\.bz2|tar\.xz)$/i, '');

  return hasVersionLikeToken(stem);
}

/**
 * Checks whether a request points to an explicitly immutable package or release artifact.
 */
export function isImmutableArtifactRequest(
  platform: string,
  effectivePath: string,
  targetUrl: string
): boolean {
  const effectivePathname = getPathname(effectivePath);
  const targetPathname = getPathname(targetUrl);

  if (platform === 'npm') {
    return isNpmTarballPath(effectivePathname) || isNpmTarballPath(targetPathname);
  }

  if (platform === 'pypi-files') {
    return isVersionedPyPIFilePath(effectivePathname) || isVersionedPyPIFilePath(targetPathname);
  }

  if (platform === 'maven') {
    return (
      isMavenReleaseArtifactPath(effectivePathname) || isMavenReleaseArtifactPath(targetPathname)
    );
  }

  if (platform === 'crates') {
    return effectivePathname.endsWith('.crate') || targetPathname.endsWith('.crate');
  }

  if (platform === 'rubygems') {
    return effectivePathname.endsWith('.gem') || targetPathname.endsWith('.gem');
  }

  if (platform === 'gh') {
    return isGithubReleaseArtifact(effectivePathname, targetPathname);
  }

  return false;
}

/**
 * Checks whether a npm path points to rewritten package metadata instead of tarball content.
 */
function isNpmMetadataPath(effectivePath: string): boolean {
  return effectivePath.startsWith('/npm/') && !isImmutableArtifactRequest('npm', effectivePath, '');
}

/**
 * Checks whether the cache key must include the request origin because response rewriting embeds it.
 */
export function shouldVaryCacheByOrigin(platform: string, effectivePath: string): boolean {
  return (
    (platform === 'flathub' && isFlatpakReferenceFilePath(effectivePath)) ||
    (platform === 'npm' && isNpmMetadataPath(effectivePath))
  );
}

/**
 * Checks whether a request targets mutable metadata or package index resources.
 */
function isMetadataOrIndexPath(platform: string, effectivePath: string): boolean {
  if (platform === 'npm') {
    return isNpmMetadataPath(effectivePath);
  }

  if (platform === 'pypi') {
    return effectivePath.startsWith('/pypi/simple/') || effectivePath === '/pypi/simple';
  }

  if (platform === 'maven') {
    return effectivePath.endsWith('/maven-metadata.xml');
  }

  if (platform === 'flathub') {
    return (
      effectivePath === '/flathub/repo/summary' || effectivePath === '/flathub/repo/summary.sig'
    );
  }

  return false;
}

/**
 * Builds a shared-cache Cache-Control value.
 */
function buildPublicCacheControl(browserTtl: number, edgeTtl: number, immutable: boolean): string {
  const directives = ['public', `max-age=${browserTtl}`, `s-maxage=${edgeTtl}`];

  if (immutable) {
    directives.push('immutable');
  } else {
    directives.push('must-revalidate');
  }

  return directives.join(', ');
}

/**
 * Resolves cache behavior for a proxied request/response.
 */
export function resolveCachePolicy({
  canUseCache,
  config,
  effectivePath,
  hasOriginBoundRewrite = false,
  hasSensitiveHeaders,
  platform,
  request,
  requestContext,
  targetUrl
}: {
  canUseCache: boolean;
  config: ApplicationConfig;
  effectivePath: string;
  hasOriginBoundRewrite?: boolean;
  hasSensitiveHeaders: boolean;
  platform: string;
  request: Request;
  requestContext: RequestTraits;
  targetUrl: string;
}): CachePolicy {
  const isProtocolRequest =
    requestContext.isGit ||
    requestContext.isGitLFS ||
    requestContext.isDocker ||
    requestContext.isAI ||
    requestContext.isHF;

  if (hasSensitiveHeaders) {
    return {
      allowCacheApi: false,
      allowFetchCache: false,
      browserTtl: 0,
      cacheControl: 'private, no-store',
      edgeTtl: 0,
      mode: 'private',
      varyByOrigin: false
    };
  }

  if (!canUseCache || isProtocolRequest || hasOriginBoundRewrite) {
    return {
      allowCacheApi: false,
      allowFetchCache: false,
      browserTtl: 0,
      cacheControl: 'no-store',
      edgeTtl: 0,
      mode: 'bypass',
      varyByOrigin: false
    };
  }

  if (isImmutableArtifactRequest(platform, effectivePath, targetUrl)) {
    return {
      allowCacheApi: request.method === 'GET',
      allowFetchCache: true,
      browserTtl: IMMUTABLE_BROWSER_TTL_SECONDS,
      cacheControl: buildPublicCacheControl(
        IMMUTABLE_BROWSER_TTL_SECONDS,
        IMMUTABLE_EDGE_TTL_SECONDS,
        true
      ),
      edgeTtl: IMMUTABLE_EDGE_TTL_SECONDS,
      mode: 'edge',
      varyByOrigin: shouldVaryCacheByOrigin(platform, effectivePath)
    };
  }

  if (isMetadataOrIndexPath(platform, effectivePath)) {
    return {
      allowCacheApi: request.method === 'GET',
      allowFetchCache: true,
      browserTtl: 0,
      cacheControl: buildPublicCacheControl(0, METADATA_EDGE_TTL_SECONDS, false),
      edgeTtl: METADATA_EDGE_TTL_SECONDS,
      mode: 'edge',
      varyByOrigin: shouldVaryCacheByOrigin(platform, effectivePath)
    };
  }

  const fallbackEdgeTtl = Number.isFinite(config.CACHE_DURATION)
    ? config.CACHE_DURATION
    : MUTABLE_EDGE_TTL_SECONDS;

  return {
    allowCacheApi: request.method === 'GET',
    allowFetchCache: true,
    browserTtl: 0,
    cacheControl: buildPublicCacheControl(0, fallbackEdgeTtl, false),
    edgeTtl: fallbackEdgeTtl,
    mode: 'edge',
    varyByOrigin: shouldVaryCacheByOrigin(platform, effectivePath)
  };
}

/**
 * Checks whether a Cache-Control response header contains a directive.
 */
function hasCacheControlDirective(cacheControl: string, directive: string): boolean {
  return cacheControl
    .split(',')
    .map(part => part.trim().toLowerCase().split('=', 1)[0])
    .includes(directive);
}

/**
 * Safely reads a response header from standard or test double header objects.
 */
function getHeaderValue(headers: Headers, name: string): string | null {
  try {
    return typeof headers.get === 'function' ? headers.get(name) : null;
  } catch {
    return null;
  }
}

/**
 * Safely checks header presence from standard or test double header objects.
 */
function hasHeaderValue(headers: Headers, name: string): boolean {
  try {
    if (typeof headers.has === 'function') {
      return headers.has(name);
    }
  } catch {
    return false;
  }

  return getHeaderValue(headers, name) !== null;
}

/**
 * Applies upstream response privacy directives to a request-level cache policy.
 */
export function resolveResponseCachePolicy({
  basePolicy,
  response
}: {
  basePolicy: ReturnType<typeof resolveCachePolicy>;
  response: Response;
}): ReturnType<typeof resolveCachePolicy> {
  if (basePolicy.mode === 'private') {
    return {
      ...basePolicy,
      allowCacheApi: false,
      browserTtl: 0,
      cacheControl: 'private, no-store',
      edgeTtl: 0
    };
  }

  const upstreamCacheControl = getHeaderValue(response.headers, 'Cache-Control') || '';
  const hasPrivateDirective = hasCacheControlDirective(upstreamCacheControl, 'private');
  const hasNoStoreDirective = hasCacheControlDirective(upstreamCacheControl, 'no-store');
  const hasNoCacheDirective = hasCacheControlDirective(upstreamCacheControl, 'no-cache');
  const hasSetCookie = hasHeaderValue(response.headers, 'Set-Cookie');
  const hasVaryStar = getHeaderValue(response.headers, 'Vary')
    ?.split(',')
    .map(value => value.trim())
    .includes('*');

  if (hasSetCookie || hasPrivateDirective) {
    return {
      ...basePolicy,
      allowCacheApi: false,
      browserTtl: 0,
      cacheControl: 'private, no-store',
      edgeTtl: 0,
      mode: 'private'
    };
  }

  if (hasNoStoreDirective || hasNoCacheDirective || hasVaryStar) {
    return {
      ...basePolicy,
      allowCacheApi: false,
      browserTtl: 0,
      cacheControl: 'no-store',
      edgeTtl: 0,
      mode: 'bypass'
    };
  }

  return basePolicy;
}
