import { PLATFORM_DEFINITIONS } from './catalog';
import { ContractError, resolveUrl, validateBaseUrl } from './conversion';
import { getPlatformPathPrefix } from './platform-index';

interface CommandToken {
  value: string;
  start: number;
  end: number;
}

/** Reads one shell command without executing it or expanding variables. */
function tokenize(input: string): CommandToken[] {
  const tokens: CommandToken[] = [];
  let index = 0;
  while (index < input.length) {
    if (/\s/.test(input[index])) {
      if (/[\r\n]/.test(input[index])) throw invalidCommand();
      index++;
      continue;
    }
    const start = index;
    let value = '';
    let quote = '';
    while (index < input.length) {
      const character = input[index];
      if (!quote && /\s/.test(character)) break;
      if (!quote && /[;|&<>`()]/.test(character)) throw invalidCommand();
      if (character === quote) {
        quote = '';
      } else if (!quote && (character === '"' || character === "'")) {
        quote = character;
      } else if (character === '\\' && quote !== "'") {
        index++;
        if (index >= input.length) throw invalidCommand();
        value += input[index];
      } else {
        value += character;
      }
      index++;
    }
    if (quote) throw invalidCommand();
    tokens.push({ value, start, end: index });
  }
  return tokens;
}

function invalidCommand(): ContractError {
  return new ContractError('INVALID_COMMAND', '请输入一条完整的下载、克隆或软件包命令。');
}

/** Converts an OCI image reference without confusing a tag with a registry port. */
function convertImage(reference: string, baseUrl: string): string {
  if (!/^[a-z0-9][a-z0-9._:/@-]*$/i.test(reference)) throw invalidCommand();
  const host = new URL(validateBaseUrl(baseUrl)).host;
  const slash = reference.indexOf('/');
  const first = slash === -1 ? '' : reference.slice(0, slash);
  const explicitHost = first.includes('.') || first.includes(':') || first === 'localhost';
  const registry = explicitHost ? first : 'docker.io';
  const image = explicitHost ? reference.slice(slash + 1) : reference;
  if (
    !image ||
    image.includes('//') ||
    image.split('/').some(part => part === '.' || part === '..')
  ) {
    throw invalidCommand();
  }
  if (['docker.io', 'index.docker.io', 'registry-1.docker.io'].includes(registry)) {
    return `${host}/${image}`;
  }
  const platform = Object.entries(PLATFORM_DEFINITIONS).find(
    ([, definition]) =>
      definition.category === 'container' && new URL(definition.upstream).host === registry
  );
  if (!platform) throw new ContractError('UNSUPPORTED_URL', '暂不支持这个镜像仓库。');
  return `${host}${getPlatformPathPrefix(platform[0])}${image}`;
}

function quoteUrl(value: string, original: string): string {
  if (original.startsWith('"') && original.endsWith('"')) {
    return `"${value.replace(/"/g, '\\"')}"`;
  }
  return `'${value.replace(/'/g, `'"'"'`)}'`;
}

/** Registry and index settings may point at a platform root rather than a resource. */
function convertCommandUrl(value: string, baseUrl: string, allowBase: boolean): string {
  if (!allowBase) return resolveUrl(value, baseUrl).convertedUrl;
  const marker = '__suki_get_command_base__';
  // Validate the supplied URL before appending a resource for root-route conversion.
  try {
    return resolveUrl(value, baseUrl).convertedUrl;
  } catch (error) {
    if (!(error instanceof ContractError) || error.code !== 'UNSUPPORTED_CONVERSION') throw error;
    const upstream = new URL(value);
    upstream.pathname = `${upstream.pathname.replace(/\/$/, '')}/${marker}`;
    const converted = new URL(resolveUrl(upstream.href, baseUrl).convertedUrl);
    converted.pathname = converted.pathname.replace(new RegExp(`${marker}$`), '');
    return converted.href;
  }
}

/** Converts a resource URL or a single client command, retaining non-resource arguments. */
export function convertResourceInput(
  input: string,
  baseUrl: string
): { kind: 'url' | 'command'; value: string } {
  const source = input.trim();
  if (/^https?:\/\//i.test(source)) {
    return { kind: 'url', value: resolveUrl(source, baseUrl).convertedUrl };
  }
  const tokens = tokenize(source);
  const replacements: { start: number; end: number; value: string }[] = [];
  const executableIndex = tokens.findIndex(token => !/^[A-Za-z_][A-Za-z0-9_]*=/.test(token.value));
  const command = tokens[executableIndex]?.value;
  if (command === 'docker' && tokens[executableIndex + 1]?.value === 'pull') {
    let image: CommandToken | undefined;
    for (let index = executableIndex + 2; index < tokens.length; index++) {
      const token = tokens[index];
      if (token.value === '--platform') {
        if (!tokens[++index]) throw invalidCommand();
      } else if (
        token.value === '--all-tags' ||
        token.value === '-a' ||
        token.value === '--quiet' ||
        token.value === '-q' ||
        token.value.startsWith('--platform=')
      ) {
        continue;
      } else if (token.value.startsWith('-') || image) {
        throw invalidCommand();
      } else {
        image = token;
      }
    }
    if (!image) throw invalidCommand();
    replacements.push({ ...image, value: convertImage(image.value, baseUrl) });
  } else {
    const supported = [
      'git',
      'curl',
      'wget',
      'npm',
      'pnpm',
      'yarn',
      'pip',
      'pip3',
      'uv',
      'conda',
      'gem',
      'dotnet',
      'go',
      'cargo',
      'rustup'
    ];
    if (
      !supported.includes(command) ||
      (command === 'git' && tokens[executableIndex + 1]?.value !== 'clone')
    )
      throw invalidCommand();
    // Headers, payloads, output paths and Git config are data, even when their value is a URL.
    const dataOptions = new Set([
      '-H',
      '--header',
      '-d',
      '--data',
      '--data-raw',
      '--data-binary',
      '--data-urlencode',
      '--json',
      '-o',
      '-O',
      '--output',
      '-u',
      '--user',
      '-c',
      '--config',
      '--cookie',
      '--cookie-jar',
      '-b',
      '-X',
      '--request',
      '-F',
      '--form',
      '--form-string',
      '--referer',
      '-e',
      '--user-agent',
      '-A'
    ]);
    for (let index = 0; index < tokens.length; index++) {
      const token = tokens[index];
      if (
        dataOptions.has(token.value) &&
        !(token.value === '-O' && command === 'curl') &&
        !(token.value === '-c' && command === 'conda')
      ) {
        index++;
        continue;
      }
      const urlOption = token.value.match(
        /^(--(?:registry|index|index-url|extra-index-url|source|channel)|GOPROXY|RUSTUP_DIST_SERVER|RUSTUP_UPDATE_ROOT)=((?:sparse\+)?https?:\/\/.*)$/
      );
      const url =
        urlOption?.[2] ||
        (/^(?:sparse\+)?https?:\/\//i.test(token.value) ? token.value : undefined);
      if (!url) continue;
      const previous = tokens[index - 1]?.value;
      const baseOptions = [
        '--registry',
        '--index',
        '--index-url',
        '--extra-index-url',
        '--source',
        '--channel'
      ];
      const allowBase =
        Boolean(urlOption) ||
        baseOptions.includes(previous) ||
        (['npm', 'pnpm', 'yarn'].includes(command) && previous === 'registry') ||
        ((command === 'pip' || command === 'pip3' || command === 'uv') && previous === '-i') ||
        (command === 'conda' && previous === '-c');
      const sparse = url.startsWith('sparse+');
      const converted = `${sparse ? 'sparse+' : ''}${convertCommandUrl(sparse ? url.slice(7) : url, baseUrl, allowBase)}`;
      const raw = source.slice(token.start, token.end);
      replacements.push({
        start: token.start,
        end: token.end,
        value: urlOption
          ? `${urlOption[1]}=${quoteUrl(converted, raw.slice(raw.indexOf('=') + 1))}`
          : quoteUrl(converted, raw)
      });
    }
  }
  if (!replacements.length) throw invalidCommand();
  let value = source;
  for (const replacement of replacements.reverse()) {
    value = `${value.slice(0, replacement.start)}${replacement.value}${value.slice(replacement.end)}`;
  }
  return { kind: 'command', value };
}
