import type { ApplicationConfig } from '../config';

/**
 * Security utility functions for Suki Get
 */

/**
 * Resolves the allowed CORS origin for the current request.
 */
export function resolveAllowedOrigin(request: Request, config: ApplicationConfig): string | null {
  const origin = request.headers.get('Origin');
  if (!origin) {
    return null;
  }

  const allowedOrigins = config.SECURITY.ALLOWED_ORIGINS;
  if (allowedOrigins.includes('*')) {
    return '*';
  }

  return allowedOrigins.includes(origin) ? origin : null;
}

/**
 * Applies CORS headers to a response when the request origin is allowed.
 */
export function addCorsHeaders(
  headers: Headers,
  request: Request,
  config: ApplicationConfig
): Headers {
  const allowedOrigin = resolveAllowedOrigin(request, config);
  if (!allowedOrigin) {
    return headers;
  }

  headers.set('Access-Control-Allow-Origin', allowedOrigin);
  headers.set('Access-Control-Allow-Methods', config.SECURITY.ALLOWED_METHODS.join(', '));

  const requestedHeaders = request.headers.get('Access-Control-Request-Headers');
  if (requestedHeaders) {
    headers.set('Access-Control-Allow-Headers', requestedHeaders);
  }

  const vary = new Set(
    (headers.get('Vary') || '')
      .split(',')
      .map(value => value.trim())
      .filter(Boolean)
  );
  vary.add('Origin');
  headers.set('Vary', Array.from(vary).join(', '));

  return headers;
}

/**
 * Adds comprehensive security headers to response headers.
 *
 * applies industry-standard security headers including:
 * - HSTS (HTTP Strict Transport Security)
 * - X-Frame-Options (clickjacking protection)
 * - X-XSS-Protection (XSS filter)
 * - Referrer-Policy (referrer information control)
 * - Content-Security-Policy (resource loading restrictions)
 * - Permissions-Policy (privacy-invasive feature restrictions)
 */
export function addSecurityHeaders(headers: Headers): Headers {
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Content-Security-Policy', "default-src 'none'; img-src 'self'; script-src 'none'");
  headers.set('Permissions-Policy', 'interest-cohort=()');
  return headers;
}

/**
 * Creates a standardized error response with security headers.
 *
 * Generates an HTTP error response with appropriate content type and security headers.
 * Can return either plain text or detailed JSON error format.
 */
export function createErrorResponse(
  message: string,
  status: number,
  includeDetails: boolean = false
): Response {
  const errorBody = includeDetails
    ? JSON.stringify({ error: message, status, timestamp: new Date().toISOString() })
    : message;

  return new Response(errorBody, {
    status,
    headers: addSecurityHeaders(
      new Headers({
        'Content-Type': includeDetails ? 'application/json' : 'text/plain'
      })
    )
  });
}
