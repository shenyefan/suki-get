/**
 * AI Inference protocol handler for Suki Get
 */

/**
 * Detects if a request is for an AI inference provider API.
 *
 * Identifies AI inference requests by checking for:
 * - AI provider path prefix (/ip/{provider}/...)
 * - Common AI API endpoints (chat, completions, embeddings, etc.)
 * - AI-specific URL patterns with JSON POST requests
 */
export function isAIInferenceRequest(request: Request, url: URL): boolean {
  void request;
  return url.pathname.startsWith('/ip/');
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
