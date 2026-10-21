import type { RequestContext } from './types';

import { CONFIG, createConfig } from './config';
import { getRequestTraits } from './utils/validation';

/**
 * Builds the shared request context used by all runtime adapters.
 */
export function createRequestContext(
  request: Request,
  env: Record<string, unknown>
): RequestContext {
  const runtimeEnv = env && typeof env === 'object' ? env : {};
  const config = env === undefined ? CONFIG : createConfig(runtimeEnv);
  const url = new URL(request.url);
  const traits = getRequestTraits(request, url);

  return {
    ...traits,
    config,
    env: runtimeEnv,
    isCorsPreflight:
      request.method === 'OPTIONS' &&
      request.headers.has('Origin') &&
      request.headers.has('Access-Control-Request-Method'),
    request,
    url
  };
}
