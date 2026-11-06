/**
 * Read-only preview support for GitHub HTML pages.
 */
import { PLATFORM_DEFINITIONS } from '#/lib/platforms/catalog';
import { getPlatformPathPrefix } from '#/lib/platforms/platform-index';

// GitHub-owned hosts with a platform route are served through this site, so the page
// never needs the browser to contact them directly.
const PROXIED_HOST_PATTERN = /(?:^|\.)(?:github\.com|githubassets\.com|githubusercontent\.com)$/;
const PROXIED_PREFIX_BY_ORIGIN = new Map(
  Object.entries(PLATFORM_DEFINITIONS)
    .filter(([, { upstream }]) => {
      const { hostname, pathname } = new URL(upstream);
      return pathname === '/' && PROXIED_HOST_PATTERN.test(hostname);
    })
    .map(([key, { upstream }]) => [
      new URL(upstream).origin,
      getPlatformPathPrefix(key).slice(0, -1)
    ])
);
const PROXIED_ORIGIN_PATTERN = new RegExp(
  String.raw`(${[...PROXIED_PREFIX_BY_ORIGIN.keys()]
    .sort((a, b) => b.length - a.length)
    .map(origin => origin.replaceAll('.', String.raw`\.`))
    .join('|')})(?=[/?#"'\s]|$)`,
  'g'
);

const ACCOUNT_PATH_PATTERN =
  /^\/gh\/(?:login|logout|signup|join|sessions?|password_reset|settings|notifications|account|authentication)(?:\/|$)/i;

const PREVIEW_NOTICE = ['非官方网站，仅供预览', 'Unofficial site, preview only'];

// Sign-in entries are rendered by page scripts, so they are hidden rather than removed.
const PREVIEW_STYLE = `<style>a[href^="/login"],a[href^="/signup"]{display:none!important}.suki-preview-notice{display:block;flex:0 0 100%;box-sizing:border-box;width:100%;max-width:100vw;position:sticky;left:0;padding:5px 16px;background:#facc15;color:#111;font:500 12px/1.5 inherit;font-family:inherit;letter-spacing:.02em;text-align:center}.suki-preview-notice span+span::before{content:' · '}@media(max-width:600px){.suki-preview-notice span{display:block}.suki-preview-notice span+span::before{content:none}}</style>`;

const PREVIEW_NOTICE_HTML = `<div class="suki-preview-notice">${PREVIEW_NOTICE.map(line => `<span>${line}</span>`).join('')}</div>`;

// Every resource, including scripts, must come from this origin.
export const GITHUB_PAGE_CSP = [
  "default-src 'none'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' https://github.githubassets.com",
  // URLs built by page scripts at runtime cannot be rewritten; keep GitHub's own hosts as fallback.
  "img-src 'self' data: https://*.githubassets.com https://*.githubusercontent.com",
  "script-src 'self' 'unsafe-inline' https://github.githubassets.com",
  "connect-src 'self'",
  "form-action 'none'",
  "base-uri 'none'",
  "frame-ancestors 'none'"
].join('; ');

/** Login, session and account routes are never forwarded; the preview is anonymous only. */
export function isGithubAccountPath(effectivePath: string): boolean {
  return ACCOUNT_PATH_PATTERN.test(effectivePath);
}

const DATA_REQUEST_HEADERS = [
  'X-Requested-With',
  'GitHub-Verified-Fetch',
  'X-GitHub-Client-Version',
  'X-Fetch-Nonce',
  'Turbo-Visit',
  'Turbo-Frame',
  'X-PJAX',
  'X-PJAX-Container'
];

/** Page scripts fetch JSON and HTML fragments from the same URLs as full pages. */
export function isGithubDataRequest(request: Request): boolean {
  return (
    DATA_REQUEST_HEADERS.some(name => request.headers.has(name)) ||
    (request.headers.get('Accept') || '').includes('application/json')
  );
}

/** Forwards the headers GitHub uses to pick between page, JSON and fragment responses. */
export function forwardGithubDataHeaders(request: Request, headers: Headers): void {
  for (const name of ['Accept', ...DATA_REQUEST_HEADERS]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
}

/** Checks whether a GitHub response is a browsable HTML page. */
export function isGithubPageResponse(platform: string, contentType: string): boolean {
  return platform === 'gh' && contentType.includes('text/html');
}

/**
 * Turns an upstream GitHub page into a preview that loads assets via this site, with a notice banner and no sign-in entry.
 */
export function createGithubPreviewResponse(response: Response, origin: string): Response {
  const removeElement = (element: RewriterElement) => {
    element.remove();
  };

  const proxyAssetText = (value: string) =>
    value.replace(
      PROXIED_ORIGIN_PATTERN,
      match => `${origin}${PROXIED_PREFIX_BY_ORIGIN.get(match)}`
    );
  const proxyAssetUrls = (attribute: string) => ({
    element(element: RewriterElement) {
      const value = element.getAttribute(attribute);
      if (value) {
        element.setAttribute(attribute, proxyAssetText(value));
      }
    }
  });
  // The import map and embedded page data carry absolute asset URLs, split across text chunks.
  let embeddedText = '';

  return new HTMLRewriter()
    .on('a[href], link[href]', proxyAssetUrls('href'))
    .on('[data-href]', proxyAssetUrls('data-href'))
    .on('[data-base-href]', proxyAssetUrls('data-base-href'))
    .on('img[src], source[src], script[src], video[src], audio[src]', proxyAssetUrls('src'))
    .on('img[srcset], source[srcset]', proxyAssetUrls('srcset'))
    .on('script[type="importmap"], script[type="application/json"]', {
      text(chunk) {
        embeddedText += chunk.text;
        if (chunk.lastInTextNode) {
          chunk.replace(proxyAssetText(embeddedText), { html: true });
          embeddedText = '';
        } else {
          chunk.remove();
        }
      }
    })
    .on('meta[http-equiv]', { element: removeElement })
    .on(
      [
        'a[href^="/login"]',
        'a[href^="/signup"]',
        'a[href^="/join"]',
        'a[href^="/session"]',
        'a[href^="https://github.com/login"]',
        'a[href^="https://github.com/signup"]',
        'a[href^="https://github.com/join"]',
        'form[action^="/login"]',
        'form[action^="/session"]',
        'form[action^="/logout"]'
      ].join(', '),
      { element: removeElement }
    )
    .on('head', {
      element(element) {
        element.append(PREVIEW_STYLE, { html: true });
      }
    })
    .on('body', {
      element(element) {
        element.prepend(PREVIEW_NOTICE_HTML, { html: true });
      }
    })
    .transform(response);
}
