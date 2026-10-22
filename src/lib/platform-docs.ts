import { getPlatformManifest } from './platforms/conversion';

export const platforms = getPlatformManifest().platforms;
export const categories: Record<string, { title: string; description: string }> = {
  code: {
    title: '代码仓库',
    description: '访问源码归档、发行文件和模型资源；Git 请求沿用原有协议处理。'
  },
  package: {
    title: '软件包',
    description: '访问软件包索引与下载资源。npm 和 PyPI 的响应地址会按平台规则改写。'
  },
  linux: {
    title: 'Linux 软件源',
    description: '通过对应平台前缀访问发行版的软件仓库资源，保留仓库内的完整路径。'
  },
  resource: { title: '开发资源', description: '访问论文、应用文件与开发工具更新资源。' },
  ai: {
    title: 'AI 接口',
    description: '转发 AI API 请求并保留流式响应。仍需使用对应服务商的账号、API Key 和有效额度。'
  },
  container: {
    title: '容器镜像',
    description: '转发 OCI / Docker Registry 请求，处理 Registry V2 握手、认证和镜像层下载。'
  }
};

const names: Record<string, string> = {
  gh: 'GitHub',
  gist: 'GitHub Gist',
  gl: 'GitLab',
  gitea: 'Gitea',
  codeberg: 'Codeberg',
  sf: 'SourceForge',
  aosp: 'Android 源码',
  hf: 'Hugging Face',
  civitai: 'Civitai',
  npm: 'npm',
  pypi: 'PyPI',
  'pypi-files': 'PyPI 文件',
  conda: 'Anaconda',
  'conda-community': 'Conda 社区',
  maven: 'Maven Central',
  apache: 'Apache',
  gradle: 'Gradle',
  homebrew: 'Homebrew',
  'homebrew-api': 'Homebrew API',
  'homebrew-bottles': 'Homebrew Bottles',
  rubygems: 'RubyGems',
  cran: 'CRAN',
  cpan: 'CPAN',
  ctan: 'CTAN',
  golang: 'Go Modules',
  nuget: 'NuGet',
  crates: 'crates.io',
  packagist: 'Packagist',
  flathub: 'Flathub',
  debian: 'Debian',
  ubuntu: 'Ubuntu',
  fedora: 'Fedora',
  rocky: 'Rocky Linux',
  opensuse: 'openSUSE',
  arch: 'Arch Linux',
  arxiv: 'arXiv',
  fdroid: 'F-Droid',
  jenkins: 'Jenkins',
  'ip-openai': 'OpenAI',
  'ip-anthropic': 'Anthropic',
  'ip-gemini': 'Google Gemini',
  'ip-vertexai': 'Vertex AI',
  'ip-cohere': 'Cohere',
  'ip-mistralai': 'Mistral AI',
  'ip-xai': 'xAI',
  'ip-githubmodels': 'GitHub Models',
  'ip-nvidiaapi': 'NVIDIA API',
  'ip-perplexity': 'Perplexity',
  'ip-braintrust': 'Braintrust',
  'ip-groq': 'Groq',
  'ip-cerebras': 'Cerebras',
  'ip-sambanova': 'SambaNova',
  'ip-siray': 'Siray',
  'ip-huggingface': 'Hugging Face Inference',
  'ip-together': 'Together AI',
  'ip-replicate': 'Replicate',
  'ip-fireworks': 'Fireworks AI',
  'ip-nebius': 'Nebius',
  'ip-jina': 'Jina',
  'ip-voyageai': 'Voyage AI',
  'ip-falai': 'fal.ai',
  'ip-novita': 'Novita',
  'ip-burncloud': 'BurnCloud',
  'ip-openrouter': 'OpenRouter',
  'ip-poe': 'Poe',
  'ip-featherlessai': 'Featherless AI',
  'ip-hyperbolic': 'Hyperbolic',
  'cr-docker': 'Docker Hub',
  'cr-quay': 'Quay',
  'cr-gcr': 'Google Container Registry',
  'cr-mcr': 'Microsoft Container Registry',
  'cr-ecr': 'Amazon ECR Public',
  'cr-ghcr': 'GitHub Container Registry',
  'cr-gitlab': 'GitLab Registry',
  'cr-redhat': 'Red Hat',
  'cr-oracle': 'Oracle',
  'cr-cloudsmith': 'Cloudsmith',
  'cr-digitalocean': 'DigitalOcean',
  'cr-vmware': 'VMware',
  'cr-k8s': 'Kubernetes',
  'cr-heroku': 'Heroku',
  'cr-suse': 'SUSE',
  'cr-opensuse': 'openSUSE Registry',
  'cr-gitpod': 'Gitpod'
};
export function platformName(key: string) {
  return names[key] || key;
}

export const examples: Record<string, string> = {
  gh: 'https://github.com/microsoft/vscode/archive/refs/heads/main.zip',
  gist: 'https://gist.github.com/example/123456/raw/example.txt',
  gl: 'https://gitlab.com/gitlab-org/gitlab/-/archive/master/gitlab-master.zip',
  hf: 'https://huggingface.co/gpt2/resolve/main/config.json',
  npm: 'https://registry.npmjs.org/react',
  pypi: 'https://pypi.org/simple/requests/',
  crates: 'https://crates.io/api/v1/crates/serde/1.0.219/download',
  'homebrew-api': 'https://formulae.brew.sh/api/formula/wget.json',
  'ip-openai': 'https://api.openai.com/v1/chat/completions',
  'ip-anthropic': 'https://api.anthropic.com/v1/messages',
  'cr-docker': 'https://registry-1.docker.io/v2/library/nginx/manifests/latest',
  'cr-ghcr': 'https://ghcr.io/v2/homebrew/core/wget/manifests/latest'
};

export interface UsageExample {
  title?: string;
  original: string;
  accelerated: string;
}

/** Builds client commands and source configuration using the shared route prefix. */
function singlePlatformUsage(key: string, origin: string): UsageExample | undefined {
  const platform = platforms.find(item => item.key === key);
  if (!platform) return;
  const prefix = `${origin}${platform.pathPrefix}`;
  if (platform.category === 'container') {
    const images: Record<string, string> = {
      'cr-docker': 'library/nginx:latest',
      'cr-ghcr': '<命名空间>/<镜像名>:<标签>',
      'cr-quay': 'prometheus/prometheus:latest',
      'cr-mcr': 'dotnet/runtime:8.0',
      'cr-k8s': 'pause:3.10'
    };
    const image = images[key] || '<命名空间>/<镜像名>:<标签>';
    const upstreamHost = new URL(platform.upstream).host;
    return {
      original: `docker pull ${upstreamHost}/${image}`,
      accelerated: `docker pull ${prefix.replace(/^https?:\/\//, '')}${image}`
    };
  }
  const commands: Record<string, (base: string) => string> = {
    npm: base => `npm install react --registry=${base}`,
    pypi: base => `pip install requests --index-url ${base}simple/`,
    conda: base => `conda install numpy --override-channels --channel ${base}pkgs/main/`,
    'conda-community': base =>
      `conda install numpy --override-channels --channel ${base}conda-forge/`,
    rubygems: base => `gem install bundler --clear-sources --source ${base}`,
    cran: base => `install.packages("ggplot2", repos = "${base}")`,
    golang: base => `GOPROXY=${base} go mod download`,
    nuget: base => `dotnet add package Newtonsoft.Json --source ${base}v3/index.json`,
    debian: base => `deb ${base}debian bookworm main`,
    ubuntu: base => `deb ${base}ubuntu noble main universe`,
    arch: base => `Server = ${base}$repo/os/$arch`,
    maven: base =>
      `<mirror>\n  <id>suki-get</id>\n  <mirrorOf>central</mirrorOf>\n  <url>${base}maven2/</url>\n</mirror>`
  };
  const command = commands[key];
  if (command) {
    return { original: command(`${platform.upstream}/`), accelerated: command(prefix) };
  }
  if (platform.category === 'ai') {
    return {
      original: `API 地址：${platform.upstream}/\n接口路径、认证头和请求体按服务商要求填写。`,
      accelerated: `API 地址：${prefix}\n在此地址后保留完整接口路径；认证头和请求体沿用上游配置。`
    };
  }
  if (platform.category === 'linux' || platform.category === 'package') {
    return {
      original: `源地址：${platform.upstream}/<仓库内路径>`,
      accelerated: `源地址：${prefix}<仓库内路径>`
    };
  }
}

/** Lists independent usage scenarios instead of reducing a platform to one operation. */
export function platformUsage(key: string, origin: string): UsageExample[] {
  const platform = platforms.find(item => item.key === key);
  if (!platform) return [];
  if (key === 'ip-openai') {
    return [
      {
        title: '默认 OpenAI 入口',
        original: 'Base URL: https://api.openai.com/v1',
        accelerated: `Base URL: ${origin}/v1`
      },
      {
        title: '使用显式平台前缀',
        original: 'Base URL: https://api.openai.com/v1',
        accelerated: `Base URL: ${origin}${platform.pathPrefix}v1`
      }
    ];
  }
  if (key === 'cr-docker') {
    const explicit = singlePlatformUsage(key, origin);
    return [
      {
        title: '默认拉取 Docker Hub 镜像',
        original: 'docker pull nginx:latest',
        accelerated: `docker pull ${new URL(origin).host}/nginx:latest`
      },
      {
        title: '拉取带命名空间的镜像',
        original: 'docker pull <命名空间>/<镜像名>:<标签>',
        accelerated: `docker pull ${new URL(origin).host}/<命名空间>/<镜像名>:<标签>`
      },
      ...(explicit ? [{ ...explicit, title: '使用显式平台前缀' }] : [])
    ];
  }
  const repositories: Record<string, string> = {
    gh: 'microsoft/vscode',
    gl: 'gitlab-org/gitlab',
    gitea: 'gitea/tea',
    codeberg: 'forgejo/forgejo',
    hf: 'openai-community/gpt2',
    aosp: 'platform/frameworks/base'
  };
  const scenarios: { title: string; path: string; file?: string }[] = [];
  const repository = repositories[key];
  if (repository) {
    scenarios.push({ title: '克隆仓库', path: `${repository}${key === 'aosp' ? '' : '.git'}` });
  }
  if (key === 'gh' || key === 'homebrew') {
    const repo = key === 'gh' ? 'microsoft/vscode' : 'brew';
    const branch = key === 'gh' ? 'main' : 'master';
    scenarios.push(
      {
        title: '下载分支源码 ZIP',
        path: `${repo}/archive/refs/heads/${branch}.zip`,
        file: 'source.zip'
      },
      {
        title: '下载标签源码归档',
        path: `${repo}/archive/refs/tags/<标签>.tar.gz`,
        file: 'source.tar.gz'
      },
      {
        title: '下载 Release 附件',
        path: `${repo}/releases/download/<标签>/<附件名>`,
        file: '<附件名>'
      },
      {
        title: '下载仓库原始文件',
        path: `${repo}/raw/refs/heads/${branch}/README.md`,
        file: 'README.md'
      }
    );
  }
  if (key === 'gl') {
    scenarios.push(
      {
        title: '下载分支源码归档',
        path: `${repository}/-/archive/master/gitlab-master.zip`,
        file: 'source.zip'
      },
      {
        title: '下载仓库原始文件',
        path: `${repository}/-/raw/master/README.md`,
        file: 'README.md'
      },
      {
        title: '下载 Release 附件',
        path: `${repository}/-/releases/<标签>/downloads/<附件路径>`,
        file: '<附件名>'
      }
    );
  }
  if (key === 'gitea' || key === 'codeberg') {
    scenarios.push(
      { title: '下载分支源码归档', path: `${repository}/archive/<分支>.zip`, file: 'source.zip' },
      {
        title: '下载仓库原始文件',
        path: `${repository}/raw/branch/<分支>/README.md`,
        file: 'README.md'
      },
      {
        title: '下载 Release 附件',
        path: `${repository}/releases/download/<标签>/<附件名>`,
        file: '<附件名>'
      }
    );
  }
  if (key === 'hf') {
    scenarios.push(
      {
        title: '下载模型配置',
        path: `${repository}/resolve/main/config.json`,
        file: 'config.json'
      },
      {
        title: '下载模型权重并支持续传',
        path: `${repository}/resolve/main/model.safetensors`,
        file: 'model.safetensors'
      },
      {
        title: '下载数据集文件',
        path: 'datasets/<组织>/<数据集>/resolve/<版本>/<文件路径>',
        file: '<文件名>'
      }
    );
  }
  if (key === 'gist') {
    scenarios.push(
      { title: '克隆 Gist', path: '<Gist ID>.git' },
      { title: '下载原始文件', path: '<用户>/<Gist ID>/raw/<版本>/<文件名>', file: '<文件名>' }
    );
  }
  if (key === 'aosp') {
    scenarios.push({
      title: '下载源码归档',
      path: `${repository}/+archive/refs/heads/main.tar.gz`,
      file: 'source.tar.gz'
    });
  }
  if (key === 'sf') {
    scenarios.push({
      title: '下载项目发行文件',
      path: 'projects/<项目>/files/<版本>/<文件名>/download',
      file: '<文件名>'
    });
  }
  if (key === 'civitai') {
    scenarios.push({
      title: '下载指定版本的模型',
      path: 'api/download/models/<模型版本 ID>',
      file: 'model.safetensors'
    });
  }
  if (scenarios.length) {
    return scenarios.map(({ title, path, file }) => {
      const command = (base: string) =>
        file ? `curl -fL -C - -o "${file}" "${base}${path}"` : `git clone "${base}${path}"`;
      return {
        title,
        original: command(`${platform.upstream}/`),
        accelerated: command(key === 'gh' ? `${origin}/` : `${origin}${platform.pathPrefix}`)
      };
    });
  }
  const usage = singlePlatformUsage(key, origin);
  return usage ? [usage] : [];
}
