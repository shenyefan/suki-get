/**
 * Platform-specific upstream response rewriting helpers.
 */
import { PLATFORM_DEFINITIONS } from '#/lib/platforms/catalog';
import { getPlatformPathPrefix } from '#/lib/platforms/platform-index';

const FLATHUB_REPO_BASE_URL_PATTERN = /https:\/\/(?:dl\.)?flathub\.org\/repo\//g;
const FLATPAK_REFERENCE_FILE_PATTERN = /\.(flatpakrepo|flatpakref)$/i;

const JSON_RESOURCE_TARGETS: Record<string, string[]> = {
  npm: ['npm', 'yarn'],
  yarn: ['npm', 'yarn'],
  'cargo-index': ['cargo-files', 'crates'],
  nuget: ['nuget', 'nuget-gallery', 'nuget-files', 'nuget-searchprimary', 'nuget-searchsecondary'],
  'nuget-gallery': [
    'nuget',
    'nuget-gallery',
    'nuget-files',
    'nuget-searchprimary',
    'nuget-searchsecondary'
  ],
  'nuget-searchprimary': ['nuget', 'nuget-gallery', 'nuget-files'],
  'nuget-searchsecondary': ['nuget', 'nuget-gallery', 'nuget-files']
};

/** Metadata that embeds instance URLs needs a separate cache entry per instance origin. */
export function isRewrittenJsonResource(platform: string, requestPath: string): boolean {
  if (platform === 'cargo-index') return requestPath.endsWith('/config.json');
  return Object.hasOwn(JSON_RESOURCE_TARGETS, platform);
}

/**
 * Checks whether a successful upstream response should be rewritten before returning it.
 */
export function shouldRewriteTextResponse(
  platform: string,
  requestPath: string,
  contentType: string = ''
): boolean {
  if (platform === 'pypi') {
    return contentType.includes('text/html');
  }

  if (isRewrittenJsonResource(platform, requestPath)) {
    return contentType.includes('application/json');
  }

  if (platform === 'flathub') {
    return FLATPAK_REFERENCE_FILE_PATTERN.test(requestPath);
  }

  return false;
}

/**
 * Checks whether a request path points to a Flatpak descriptor file.
 */
export function isFlatpakReferenceFilePath(requestPath: string): boolean {
  return FLATPAK_REFERENCE_FILE_PATTERN.test(requestPath);
}

/**
 * Rewrites upstream text responses so follow-up requests continue flowing through Suki Get.
 */
export function rewriteTextResponse(
  platform: string,
  requestPath: string,
  originalText: string,
  origin: string
): string {
  if (platform === 'pypi') {
    return originalText.replace(
      /https:\/\/files\.pythonhosted\.org(?=\/|["'\s<]|$)/g,
      `${origin}${getPlatformPathPrefix('pypi-files').slice(0, -1)}`
    );
  }

  if (isRewrittenJsonResource(platform, requestPath)) {
    const targets = JSON_RESOURCE_TARGETS[platform]
      .map(key => {
        const definition = PLATFORM_DEFINITIONS[key];
        return {
          key,
          source: `${new URL(definition.upstream).origin}${definition.conversion.stripPathPrefix}`
        };
      })
      .sort((a, b) => b.source.length - a.source.length);
    // Replace only complete, allowlisted URL prefixes; templates and signed queries stay intact.
    let rewritten = originalText;
    for (const { key, source } of targets) {
      const pattern = new RegExp(`${source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=/|"|$)`, 'g');
      rewritten = rewritten.replace(pattern, `${origin}${getPlatformPathPrefix(key).slice(0, -1)}`);
    }
    return rewritten;
  }

  if (platform === 'flathub' && isFlatpakReferenceFilePath(requestPath)) {
    return originalText.replace(FLATHUB_REPO_BASE_URL_PATTERN, `${origin}/flathub/repo/`);
  }

  return originalText;
}
