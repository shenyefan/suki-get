import type { PlatformConversion } from './catalog';

import { PLATFORM_DEFINITIONS, CATALOG_VERSION, RELEASE_VERSION, SCHEMA_VERSION } from './catalog';
import { getPlatformPathPrefix, matchPlatformPath } from './platform-index';
import { transformPath } from './platform-transformers';
import { normalizeRegistryApiPath } from './registry-path';

/** A stable, safe-to-print error for automation clients. */
export class ContractError extends Error {
  declare code: string;
  declare exitCode: number;
  /**
   * Creates a contract error without embedding the rejected input.
   */
  constructor(code: string, message: string, exitCode: number = 2) {
    super(message);
    this.name = 'ContractError';
    this.code = code;
    this.exitCode = exitCode;
  }
}

/**
 * Public platform metadata, with no claim that upstream operations were verified.
 */

/**
 * Builds an independent description so callers cannot mutate the routing catalog.
 */
function describePlatform(key: string): PlatformDescription {
  const definition = PLATFORM_DEFINITIONS[key];
  return {
    key,
    upstream: definition.upstream,
    pathPrefix: getPlatformPathPrefix(key),
    category: definition.category,
    conversion: {
      ...definition.conversion,
      ...(definition.conversion.normalizationAliases
        ? { normalizationAliases: [...definition.conversion.normalizationAliases] }
        : {})
    }
  };
}

/**
 * Describes bundled routing and conversion capabilities for all configured platforms.
 */
export function getPlatformManifest(): {
  schemaVersion: number;
  catalogVersion: string;
  releaseVersion: string;
  capabilities: string[];
  platforms: PlatformDescription[];
} {
  return {
    schemaVersion: SCHEMA_VERSION,
    catalogVersion: CATALOG_VERSION,
    releaseVersion: RELEASE_VERSION,
    capabilities: ['routing', 'url-conversion'],
    platforms: Object.keys(PLATFORM_DEFINITIONS).map(describePlatform)
  };
}

/**
 * Parses an absolute HTTP URL without silently accepting credentials or whitespace.
 * Error text deliberately omits the input, which may contain sensitive query values.
 */
function parseHttpUrl(value: string, isBase: boolean): URL {
  const code = isBase ? 'INVALID_BASE_URL' : 'INVALID_URL';
  const label = isBase ? 'Base URL' : 'Input URL';
  if (
    typeof value !== 'string' ||
    !/^https?:\/\//i.test(value) ||
    /[\s\\]/.test(value) ||
    [...value].some(character => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)
  ) {
    throw new ContractError(code, `${label} must be an absolute HTTP or HTTPS URL.`);
  }

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new ContractError(code, `${label} must be an absolute HTTP or HTTPS URL.`);
  }
  if (parsed.username || parsed.password || /^https?:\/\/[^/?#]*@/i.test(value)) {
    throw new ContractError(code, `${label} must not contain credentials.`);
  }
  if (isBase && (parsed.pathname !== '/' || /[?#]/.test(value))) {
    throw new ContractError(
      code,
      'Base URL must be an origin without a path prefix, query, or fragment.'
    );
  }
  return parsed;
}

/**
 * Tests a path against a complete upstream path prefix.
 */
function matchesPathPrefix(path: string, prefix: string): boolean {
  return !prefix || path === prefix || path.startsWith(`${prefix}/`);
}

/**
 * Resolves an upstream URL offline using the same paths as Worker routing.
 * Conversion preserves the query and fragment. The optional normalization field
 * explicitly discloses canonicalization already performed by the Worker.
 * @throws {ContractError} For invalid, unsupported, or unrepresentable URLs.
 */
export function resolveUrl(
  inputUrl: string,
  baseUrl: string
): {
  platform: PlatformDescription;
  upstreamUrl: string;
  convertedUrl: string;
  baseUrl: string;
  normalization?: { code: string; inputUrl: string };
} {
  const input = parseHttpUrl(inputUrl, false);
  const base = parseHttpUrl(baseUrl, true);
  const originCandidates = Object.keys(PLATFORM_DEFINITIONS).filter(
    key => input.origin === new URL(PLATFORM_DEFINITIONS[key].upstream).origin
  );
  if (!originCandidates.length) {
    throw new ContractError('UNSUPPORTED_URL', 'No platform supports this URL origin.', 3);
  }
  const candidates = originCandidates
    .filter(key =>
      matchesPathPrefix(input.pathname, PLATFORM_DEFINITIONS[key].conversion.matchPathPrefix)
    )
    .sort(
      (a, b) =>
        PLATFORM_DEFINITIONS[b].conversion.matchPathPrefix.length -
        PLATFORM_DEFINITIONS[a].conversion.matchPathPrefix.length
    );
  if (!candidates.length) {
    throw new ContractError(
      'UNSUPPORTED_CONVERSION',
      'No platform route supports this upstream URL path.',
      3
    );
  }

  const platform = describePlatform(candidates[0]);
  const relativePath = input.pathname.slice(platform.conversion.stripPathPrefix.length);
  const convertedPath = `${platform.pathPrefix}${relativePath.replace(/^\//, '')}`;
  const isRoot = convertedPath === platform.pathPrefix;
  if (
    matchPlatformPath(convertedPath) !== platform.key ||
    (isRoot && !platform.conversion.rootRoute)
  ) {
    throw new ContractError(
      'UNSUPPORTED_CONVERSION',
      'This URL cannot be represented by a resource route on Suki Get.',
      3
    );
  }

  let upstreamPath = transformPath(convertedPath, platform.key);
  upstreamPath = normalizeRegistryApiPath(platform.key, upstreamPath);
  const actualUpstream = new URL(`${platform.upstream}${upstreamPath}${input.search}${input.hash}`);
  let normalization;
  if (actualUpstream.href !== input.href) {
    if (!platform.conversion.normalizationAliases?.includes(input.pathname)) {
      throw new ContractError(
        'UNSUPPORTED_CONVERSION',
        'This URL would be rewritten to a different upstream resource by Suki Get.',
        3
      );
    }
    normalization = { code: 'JENKINS_CURRENT_PATH', inputUrl: input.href };
  }

  return {
    platform,
    upstreamUrl: actualUpstream.href,
    convertedUrl: `${base.origin}${convertedPath}${input.search}${input.hash}`,
    baseUrl: base.origin,
    ...(normalization ? { normalization } : {})
  };
}

/**
 * Validates and normalizes an instance root for adapters and diagnostics.
 */
export function validateBaseUrl(baseUrl: string): string {
  return parseHttpUrl(baseUrl, true).origin;
}

export interface PlatformDescription {
  key: string;
  upstream: string;
  pathPrefix: string;
  category: string;
  conversion: PlatformConversion;
}
