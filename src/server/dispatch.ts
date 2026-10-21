import { getRequestTraits, isProtocolRequest } from './proxy/utils/validation';
import { errorCodeForStatus, errorDetails, normaliseErrorCode } from '../lib/errors';

// The homepage and server functions belong to Start. Proxy paths retain methods,
// headers and streaming bodies, including the Docker /v2 handshake and discovery.
export function isStartRequest(request: Request) {
  const { pathname } = new URL(request.url);
  return (
    ((pathname === '/' ||
      pathname === '/docs' ||
      pathname.startsWith('/docs/') ||
      pathname === '/error') &&
      (request.method === 'GET' || request.method === 'HEAD')) ||
    pathname.startsWith('/_serverFn/')
  );
}

export function browserErrorRedirect(request: Request, response: Response): Response | null {
  const url = new URL(request.url);
  if (
    response.status < 400 ||
    url.pathname === '/error' ||
    !['GET', 'HEAD'].includes(request.method) ||
    !request.headers.get('Accept')?.includes('text/html') ||
    isProtocolRequest(getRequestTraits(request, url))
  ) {
    return null;
  }
  const target = new URL('/error', url.origin);
  target.searchParams.set('code', errorCodeForStatus(response.status));
  return new Response(null, {
    status: 303,
    headers: { Location: target.href, 'Cache-Control': 'no-store' }
  });
}

export function errorPageStatus(request: Request, response: Response) {
  const url = new URL(request.url);
  if (url.pathname !== '/error') {
    return response;
  }
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'no-store');
  return new Response(request.method === 'HEAD' ? null : response.body, {
    status: errorDetails[normaliseErrorCode(url.searchParams.get('code'))].status,
    headers
  });
}
