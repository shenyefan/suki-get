/**
 * Platform-specific upstream response rewriting helpers.
 */

const FLATHUB_REPO_BASE_URL_PATTERN = /https:\/\/(?:dl\.)?flathub\.org\/repo\//g;
const FLATPAK_REFERENCE_FILE_PATTERN = /\.(flatpakrepo|flatpakref)$/i;

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

  if (platform === 'npm') {
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
    return originalText.replace(/https:\/\/files\.pythonhosted\.org/g, `${origin}/pypi/files`);
  }

  if (platform === 'npm') {
    return originalText.replace(/https:\/\/registry\.npmjs\.org\/([^/]+)/g, `${origin}/npm/$1`);
  }

  if (platform === 'flathub' && isFlatpakReferenceFilePath(requestPath)) {
    return originalText.replace(FLATHUB_REPO_BASE_URL_PATTERN, `${origin}/flathub/repo/`);
  }

  return originalText;
}
