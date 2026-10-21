/**
 * Normalizes Docker Hub official images to the canonical library namespace.
 */
export function normalizeRepoPath(platformKey: string, repoPath: string): string {
  if (platformKey === 'cr-docker' && repoPath && !repoPath.includes('/')) {
    return `library/${repoPath}`;
  }

  return repoPath;
}

/**
 * Extracts the repository path from a Docker registry API path.
 */
export function extractRepositoryPath(apiPath: string): string {
  const normalizedPath = apiPath.startsWith('/v2/')
    ? apiPath.slice(4)
    : apiPath.replace(/^\/+/, '');
  const pathParts = normalizedPath.split('/').filter(Boolean);

  if (pathParts.length === 0 || pathParts[0].startsWith('_')) {
    return '';
  }

  const suffixIndex = pathParts.findIndex(part =>
    ['manifests', 'blobs', 'tags', 'referrers'].includes(part)
  );

  if (suffixIndex <= 0) {
    return '';
  }

  return pathParts.slice(0, suffixIndex).join('/');
}

/**
 * Normalizes a Docker registry API path for upstream compatibility.
 */
export function normalizeRegistryApiPath(platformKey: string, apiPath: string): string {
  if (platformKey !== 'cr-docker' || !apiPath.startsWith('/v2/')) {
    return apiPath;
  }

  const repoPath = extractRepositoryPath(apiPath);
  const normalizedRepoPath = normalizeRepoPath(platformKey, repoPath);

  if (!repoPath || normalizedRepoPath === repoPath) {
    return apiPath;
  }

  return apiPath.replace(`/v2/${repoPath}`, `/v2/${normalizedRepoPath}`);
}
