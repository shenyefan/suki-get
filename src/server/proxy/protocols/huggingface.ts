/**
 * Hugging Face protocol handler for Suki Get
 */

/**
 * Detects if a request is a Hugging Face API operation.
 *
 * Identifies Hugging Face API requests by checking for:
 * - Hugging Face platform prefix (/hf/)
 * - API path segment (/api/)
 */
export function isHuggingFaceAPIRequest(request: Request, url: URL): boolean {
  // Check for Hugging Face API endpoints
  if (url.pathname.startsWith('/hf/api/')) {
    return true;
  }

  // Also check for token endpoint which is often used
  if (url.pathname.startsWith('/hf/token')) {
    return true;
  }

  return false;
}

/**
 * Configures headers for Hugging Face API requests.
 */
export function configureHuggingFaceHeaders(headers: Headers, request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (authHeader) {
    headers.set('Authorization', authHeader);
  }

  if (request.method === 'POST' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
}
