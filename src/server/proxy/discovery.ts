import { addSecurityHeaders } from './utils/security';
import { getPlatformManifest } from '#/lib/platforms/conversion.ts';
import { CATALOG_VERSION, RELEASE_VERSION, SCHEMA_VERSION } from '#/lib/platforms/catalog.ts';

/**
 * Returns local capability metadata, without cache lookup or upstream network I/O.
 */
export function createDiscoveryResponse(request: Request): Response {
  const allowed = request.method === 'GET' || request.method === 'HEAD';
  const body = allowed
    ? getPlatformManifest()
    : {
        schemaVersion: SCHEMA_VERSION,
        catalogVersion: CATALOG_VERSION,
        releaseVersion: RELEASE_VERSION,
        error: { code: 'METHOD_NOT_ALLOWED', message: 'Discovery supports GET and HEAD only.' }
      };
  const headers = addSecurityHeaders(
    new Headers({ 'Content-Type': 'application/json; charset=utf-8', Allow: 'GET, HEAD' })
  );
  return new Response(request.method === 'HEAD' ? null : JSON.stringify(body), {
    status: allowed ? 200 : 405,
    headers
  });
}
