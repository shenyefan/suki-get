import { PLATFORM_DEFINITIONS } from './catalog';
import { getPlatformPathPrefix } from './platform-index';

/**
 * Escapes a string for safe use inside a regular expression.
 */
function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Removes the platform prefix from a request path.
 */
function stripPlatformPrefix(path: string, platformKey: string): string {
  const prefix = getPlatformPathPrefix(platformKey);
  return path.replace(new RegExp(`^${escapeRegex(prefix)}`), '/');
}

/**
 * Applies crates.io-specific API path normalization.
 */
function transformCratesPath(transformedPath: string): string {
  if (!transformedPath.startsWith('/')) {
    return transformedPath;
  }

  if (transformedPath === '/' || transformedPath.startsWith('/?')) {
    return transformedPath.replace('/', '/api/v1/crates');
  }

  return `/api/v1/crates${transformedPath}`;
}

/**
 * Applies Fedora mirror path normalization.
 */
function transformFedoraPath(transformedPath: string): string {
  return transformedPath.replace(/^\/pub\/fedora\/linux(?=\/|$)/, '') || '/';
}

/**
 * Applies Jenkins update-center path normalization.
 */
function transformJenkinsPath(transformedPath: string): string {
  if (!transformedPath.startsWith('/')) {
    return transformedPath;
  }

  if (transformedPath === '/update-center.json') {
    return '/current/update-center.json';
  }

  if (transformedPath === '/update-center.actual.json') {
    return '/current/update-center.actual.json';
  }

  if (
    transformedPath.startsWith('/experimental/') ||
    transformedPath.startsWith('/download/') ||
    transformedPath.startsWith('/current/')
  ) {
    return transformedPath;
  }

  return `/current${transformedPath}`;
}

const PLATFORM_PATH_TRANSFORMERS: { [key: string]: (transformedPath: string) => string } = {
  'crates-api': transformCratesPath,
  'fedora-mirror': transformFedoraPath,
  'jenkins-current': transformJenkinsPath
};

/**
 * Converts a routed request path into the upstream path expected by the platform.
 */
export function transformPath(path: string, platformKey: string): string {
  const definition = PLATFORM_DEFINITIONS[platformKey];
  if (!definition) {
    return path;
  }

  const transformedPath = stripPlatformPrefix(path, platformKey);
  const transformPlatformPath = PLATFORM_PATH_TRANSFORMERS[definition.conversion.rule];

  return transformPlatformPath ? transformPlatformPath(transformedPath) : transformedPath;
}
