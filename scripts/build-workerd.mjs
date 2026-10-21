import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const output = path.resolve('dist/docker');
const config = JSON.parse(await readFile('dist/server/wrangler.json', 'utf8'));
// Hashed assets change between builds; never leave an older package in this directory.
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp('dist/server', output, { recursive: true });
await cp('dist/client', path.join(output, 'public'), { recursive: true });

/**
 * Lists build files in stable order for module registration and asset allowlisting.
 * @param {string} directory
 * @param {string} prefix
 * @returns {Promise<string[]>} Relative filenames.
 */
async function listFiles(directory, prefix = '') {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name.startsWith('.')) {
      continue;
    }
    const relative = path.posix.join(prefix, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(path.join(directory, entry.name), relative)));
    } else {
      files.push(relative);
    }
  }
  return files;
}

const assets = await listFiles('dist/client');
await writeFile(
  path.join(output, 'docker-entry.js'),
  `import worker from './index.js';
const assets = new Set(${JSON.stringify(assets.map(file => `/${file}`))});
const types = ${JSON.stringify({
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.ico': 'image/x-icon',
    '.json': 'application/json'
  })};
export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);
    if (assets.has(pathname)) {
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } });
      }
      const upstream = await env.STATIC_FILES.fetch(request);
      const headers = new Headers(upstream.headers);
      const extension = pathname.slice(pathname.lastIndexOf('.'));
      headers.set('Content-Type', types[extension] || 'application/octet-stream');
      headers.set('X-Content-Type-Options', 'nosniff');
      if (upstream.ok && pathname.startsWith('/assets/')) {
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      }
      return new Response(request.method === 'HEAD' ? null : upstream.body, { status: upstream.status, headers });
    }
    if (pathname.startsWith('/assets/')) {
      return worker.fetch(request, env, ctx);
    }
    return worker.fetch(request, env, ctx);
  }
};
`
);

const modules = [
  'docker-entry.js',
  ...(await listFiles('dist/server')).filter(file => file.endsWith('.js'))
];
const environmentNames = [
  'TIMEOUT_SECONDS',
  'MAX_RETRIES',
  'RETRY_DELAY_MS',
  'CACHE_DURATION',
  'ALLOWED_METHODS',
  'ALLOWED_ORIGINS',
  'MAX_PATH_LENGTH'
];
await writeFile(
  path.join(output, 'config.capnp'),
  `using Workerd = import "/workerd/workerd.capnp";
const config :Workerd.Config = (
  services = [
    (name = "main", worker = (
      modules = [
        ${modules.map(file => `(name = ${JSON.stringify(file)}, esModule = embed ${JSON.stringify(file)})`).join(',\n        ')}
      ],
      compatibilityDate = ${JSON.stringify(config.compatibility_date)},
      compatibilityFlags = ${JSON.stringify(config.compatibility_flags)},
      bindings = [
        (name = "STATIC_FILES", service = "static"),
        ${environmentNames.map(name => `(name = "${name}", fromEnvironment = "${name}")`).join(',\n        ')}
      ]
    )),
    (name = "static", disk = (writable = false))
  ],
  sockets = [(name = "http", address = "*:8080", http = (), service = "main")]
);
`
);
console.warn(`Built Suki Get workerd package: ${modules.length} modules, ${assets.length} assets.`);
