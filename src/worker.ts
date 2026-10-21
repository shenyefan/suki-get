import { handleRequest } from './server/proxy/handle-request';
import start from '@tanstack/react-start/server-entry';
import { browserErrorRedirect, errorPageStatus, isStartRequest } from './server/dispatch';

export default {
  async fetch(request: Request, env: Record<string, unknown>, ctx: ExecutionContext) {
    const response = await (isStartRequest(request)
      ? start.fetch(request)
      : handleRequest(request, env, ctx));
    const redirect = browserErrorRedirect(request, response);
    if (redirect) {
      void response.body?.cancel();
      return redirect;
    }
    return errorPageStatus(request, response);
  }
};
