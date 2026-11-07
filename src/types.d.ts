/**
 * Global type declarations for Cloudflare Workers
 */

/** Minimal Cloudflare / workerd HTMLRewriter surface used by the GitHub preview. */
interface RewriterElement {
  getAttribute(name: string): string | null;
  setAttribute(name: string, value: string): RewriterElement;
  remove(): RewriterElement;
  append(content: string, options?: { html?: boolean }): RewriterElement;
  prepend(content: string, options?: { html?: boolean }): RewriterElement;
}

interface RewriterText {
  text: string;
  lastInTextNode: boolean;
  remove(): RewriterText;
  replace(content: string, options?: { html?: boolean }): RewriterText;
}

declare class HTMLRewriter {
  on(
    selector: string,
    handlers: { element?(element: RewriterElement): void; text?(text: RewriterText): void }
  ): HTMLRewriter;
  transform(response: Response): Response;
}

/**
 * Cloudflare Workers execution context
 * Provides methods for managing background tasks
 */
interface ExecutionContext {
  /**
   * Extend the lifetime of the request handler
   * @param promise - Promise to wait for in the background
   */
  waitUntil(promise: Promise<unknown>): void;

  /**
   * Prevent request from failing if an exception is thrown
   */
  passThroughOnException(): void;
}
