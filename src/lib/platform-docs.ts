import { getPlatformManifest, resolveUrl } from './platforms/conversion';

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
  raw: 'GitHub 原始文件',
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
  'cr-gitpod': 'Gitpod',
  codeload: 'GitHub 源码归档',
  gistfiles: 'Gist 原始文件',
  githubapi: 'GitHub API',
  githubassets: 'GitHub Release 附件',
  githubobjects: 'GitHub 对象文件',
  githubobjectsorigin: 'GitHub 原始对象文件',
  githubreleases: 'GitHub 发行文件',
  githubregistry: 'GitHub 软件包文件',
  githublfs: 'GitHub LFS 文件',
  githublfss3: 'GitHub LFS 对象存储',
  githubcontainers: 'GitHub 镜像层文件',
  sfdownloads: 'SourceForge 文件下载',
  'hfhub-short': 'Hugging Face 短域名',
  'hfhub-com': 'Hugging Face .com',
  'hfhub-cn': 'Hugging Face .cn',
  'hflfs-global': 'Hugging Face LFS CDN',
  'hflfs-us': 'Hugging Face LFS 美国',
  'hflfs-eu': 'Hugging Face LFS 欧洲',
  'hfxet-server-us': 'Hugging Face Xet API 美国',
  'hfxet-server-eu': 'Hugging Face Xet API 欧洲',
  'hfxet-transfer-us': 'Hugging Face Xet 传输美国',
  'hfxet-transfer-eu': 'Hugging Face Xet 传输欧洲',
  'hfxet-bridge': 'Hugging Face LFS 桥接',
  yarn: 'Yarn Classic',
  mavencentral: 'Maven Central Apache',
  apachecdn: 'Apache 下载 CDN',
  apachearchive: 'Apache 历史版本',
  gradledist: 'Gradle 发行下载',
  gradlecdn: 'Gradle 下载 CDN',
  'cargo-index': 'Cargo 稀疏索引',
  'cargo-files': 'Cargo 软件包文件',
  rust: 'Rust 工具链',
  'nuget-gallery': 'NuGet Gallery 与 V2',
  'nuget-files': 'NuGet 软件包文件',
  'nuget-searchprimary': 'NuGet 主搜索',
  'nuget-searchsecondary': 'NuGet 备用搜索',
  'cran-cloud': 'CRAN 全球镜像',
  'ctan-mirrors': 'CTAN 自动镜像',
  'debian-security': 'Debian 安全更新',
  'ubuntu-security': 'Ubuntu 安全更新',
  'ubuntu-ports': 'Ubuntu Ports',
  'ubuntu-old': 'Ubuntu 历史版本',
  'jenkins-downloads': 'Jenkins 下载',
  'jenkins-archives': 'Jenkins 历史版本',
  'arxiv-export': 'arXiv 导出',
  'ip-coherecom': 'Cohere .com',
  'ip-togetherai': 'Together AI .ai',
  'ip-falqueue': 'fal.ai 异步队列',
  'cr-gcrus': 'Google Registry 美国',
  'cr-gcreu': 'Google Registry 欧洲',
  'cr-gcrasia': 'Google Registry 亚洲',
  'cr-redhatpublic': 'Red Hat 公共镜像',
  'cr-redhatconnect': 'Red Hat 合作伙伴镜像',
  'hfcdn-aws': 'Hugging Face CDN aws',
  'hfcdn-us-aws': 'Hugging Face CDN us.aws',
  'hfcdn-us-east-1-aws': 'Hugging Face CDN us-east-1.aws',
  'hfcdn-us-west-2-aws': 'Hugging Face CDN us-west-2.aws',
  'hfcdn-eu-west-3-aws': 'Hugging Face CDN eu-west-3.aws',
  'hfcdn-ap-southeast-1-aws': 'Hugging Face CDN ap-southeast-1.aws',
  'hfcdn-us-gcp': 'Hugging Face CDN us.gcp',
  'hfcdn-us-east1-us-gcp': 'Hugging Face CDN us-east1.us.gcp',
  'hfcdn-us-central1-us-gcp': 'Hugging Face CDN us-central1.us.gcp',
  'hfcdn-us-west4-us-gcp': 'Hugging Face CDN us-west4.us.gcp',
  'hfcdn-europe-west4-us-gcp': 'Hugging Face CDN europe-west4.us.gcp',
  'hfcdn-asia-southeast1-us-gcp': 'Hugging Face CDN asia-southeast1.us.gcp'
};
export function platformName(key: string) {
  return names[key] || key;
}

export const examples: Record<string, string> = {
  gh: 'https://github.com/microsoft/vscode/archive/refs/heads/main.zip',
  raw: 'https://raw.githubusercontent.com/shenyefan/rule/refs/heads/main/Mihomo.yaml',
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
  'cr-ghcr': 'https://ghcr.io/v2/homebrew/core/wget/manifests/latest',
  codeload: 'https://codeload.github.com/microsoft/vscode/zip/refs/heads/main',
  githubapi: 'https://api.github.com/repos/microsoft/vscode/releases/latest',
  'hfhub-short': 'https://hf.co/openai-community/gpt2/resolve/main/config.json',
  yarn: 'https://registry.yarnpkg.com/react',
  mavencentral:
    'https://repo.maven.apache.org/maven2/org/apache/commons/commons-lang3/3.17.0/commons-lang3-3.17.0.pom',
  apachearchive:
    'https://archive.apache.org/dist/maven/maven-3/3.9.9/binaries/apache-maven-3.9.9-bin.tar.gz',
  gradledist: 'https://services.gradle.org/distributions/gradle-8.14-bin.zip',
  gradlecdn: 'https://downloads.gradle.org/distributions/gradle-8.14-bin.zip',
  'cargo-index': 'https://index.crates.io/config.json',
  'cargo-files': 'https://static.crates.io/crates/serde/serde-1.0.219.crate',
  rust: 'https://static.rust-lang.org/dist/channel-rust-stable.toml',
  'nuget-gallery': 'https://www.nuget.org/api/v2/package/Newtonsoft.Json/13.0.3',
  'nuget-files': 'https://globalcdn.nuget.org/packages/newtonsoft.json.13.0.3.nupkg',
  'nuget-searchprimary': 'https://azuresearch-usnc.nuget.org/query?q=newtonsoft',
  'nuget-searchsecondary': 'https://azuresearch-ussc.nuget.org/query?q=newtonsoft',
  'ctan-mirrors': 'https://mirrors.ctan.org/macros/latex/base.zip',
  'jenkins-downloads': 'https://get.jenkins.io/war-stable/2.479.3/jenkins.war',
  'jenkins-archives': 'https://archives.jenkins.io/war-stable/2.479.3/jenkins.war',
  'arxiv-export': 'https://export.arxiv.org/api/query?id_list=1706.03762'
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
  commands.yarn = base => `yarn config set registry ${base}`;
  commands.mavencentral = commands.maven;
  commands['cran-cloud'] = commands.cran;
  commands['debian-security'] = base => `deb ${base}debian-security bookworm-security main`;
  commands['ubuntu-security'] = base => `deb ${base}ubuntu noble-security main universe`;
  commands['ubuntu-ports'] = base => `deb ${base}ubuntu-ports noble main universe`;
  commands['ubuntu-old'] = base => `deb ${base}ubuntu kinetic main universe`;
  commands['cargo-index'] = base =>
    `[source.crates-io]\nreplace-with = "suki-get"\n\n[source.suki-get]\nregistry = "sparse+${base}"`;
  commands.rust = base =>
    `RUSTUP_DIST_SERVER=${base.replace(/\/$/, '')} rustup toolchain install stable`;
  const command = commands[key];
  if (command) {
    return { original: command(`${platform.upstream}/`), accelerated: command(prefix) };
  }
  const sample = examples[key];
  if (sample && platform.category !== 'ai') {
    return {
      title: '下载资源',
      original: `curl -fL -o "<文件名>" "${sample}"`,
      accelerated: `curl -fL -o "<文件名>" "${resolveUrl(sample, origin).convertedUrl}"`
    };
  }
  if (platform.category === 'code' || platform.category === 'resource' || key === 'apachecdn') {
    return {
      title: '访问资源',
      original: `curl -fL "${platform.upstream}/<资源路径>?<原始查询参数>"`,
      accelerated: `curl -fL "${prefix}<资源路径>?<原始查询参数>"`
    };
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
  if (key === 'raw') {
    scenarios.push(
      {
        title: '下载分支中的原始文件',
        path: 'shenyefan/rule/refs/heads/main/Mihomo.yaml',
        file: 'Mihomo.yaml'
      },
      {
        title: '下载指定标签或提交的原始文件',
        path: '<用户>/<仓库>/<标签或提交>/<文件路径>',
        file: '<文件名>'
      }
    );
  }
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

interface GuideDefinition {
  title?: string;
  sections: Record<string, string[]>;
}

// Documentation follows products; proxy endpoint keys and public resource routes stay independent.
const guideDefinitions: Record<string, GuideDefinition> = {
  gh: {
    sections: {
      仓库与文件下载: ['gh'],
      'Raw 原始文件': ['raw'],
      'Codeload 源码归档': ['codeload'],
      Gist: ['gist', 'gistfiles'],
      'Release 附件与对象文件': [
        'githubassets',
        'githubobjects',
        'githubobjectsorigin',
        'githubreleases',
        'githubregistry'
      ],
      'Git LFS 文件': ['githublfs', 'githublfss3'],
      'GitHub API': ['githubapi'],
      容器镜像: ['cr-ghcr'],
      镜像层文件: ['githubcontainers'],
      'GitHub Models': ['ip-githubmodels']
    }
  },
  gl: { sections: { 仓库与文件下载: ['gl'], 容器镜像: ['cr-gitlab'] } },
  sf: { sections: { 项目与发行文件: ['sf'], 直接下载: ['sfdownloads'] } },
  hf: {
    sections: {
      'Hub 与域名别名': ['hf', 'hfhub-short', 'hfhub-com', 'hfhub-cn'],
      'LFS 文件与区域下载': ['hflfs-global', 'hflfs-us', 'hflfs-eu', 'hfxet-bridge'],
      'Xet 存储 API': ['hfxet-server-us', 'hfxet-server-eu'],
      'Xet 文件传输': ['hfxet-transfer-us', 'hfxet-transfer-eu'],
      'AWS 区域 CDN': [
        'hfcdn-aws',
        'hfcdn-us-aws',
        'hfcdn-us-east-1-aws',
        'hfcdn-us-west-2-aws',
        'hfcdn-eu-west-3-aws',
        'hfcdn-ap-southeast-1-aws'
      ],
      'GCP 区域 CDN': [
        'hfcdn-us-gcp',
        'hfcdn-us-east1-us-gcp',
        'hfcdn-us-central1-us-gcp',
        'hfcdn-us-west4-us-gcp',
        'hfcdn-europe-west4-us-gcp',
        'hfcdn-asia-southeast1-us-gcp'
      ],
      '推理 API': ['ip-huggingface']
    }
  },
  pypi: { sections: { 软件包索引: ['pypi'], 软件包文件: ['pypi-files'] } },
  conda: { sections: { 默认仓库: ['conda'], 社区仓库: ['conda-community'] } },
  maven: { sections: { 'Maven Central': ['maven', 'mavencentral'] } },
  apache: { sections: { 当前发行版本: ['apache', 'apachecdn'], 历史版本归档: ['apachearchive'] } },
  gradle: { sections: { 插件仓库: ['gradle'], 'Gradle 发行下载': ['gradledist', 'gradlecdn'] } },
  homebrew: {
    sections: {
      源码仓库: ['homebrew'],
      'Formula API': ['homebrew-api'],
      'Bottles 二进制包': ['homebrew-bottles']
    }
  },
  cran: { sections: { 'CRAN 镜像': ['cran', 'cran-cloud'] } },
  ctan: { sections: { 主站与自动镜像: ['ctan', 'ctan-mirrors'] } },
  nuget: {
    sections: {
      'V3 软件包源': ['nuget'],
      'Gallery 与 V2 下载': ['nuget-gallery'],
      软件包文件: ['nuget-files'],
      搜索服务: ['nuget-searchprimary', 'nuget-searchsecondary']
    }
  },
  crates: {
    title: 'Rust / Cargo',
    sections: {
      'Cargo 稀疏索引': ['cargo-index'],
      软件包文件: ['cargo-files'],
      'crates.io API': ['crates'],
      'Rust 工具链': ['rust']
    }
  },
  debian: { sections: { 主软件源: ['debian'], 安全更新: ['debian-security'] } },
  ubuntu: {
    sections: {
      主软件源: ['ubuntu'],
      安全更新: ['ubuntu-security'],
      'Ports 架构软件源': ['ubuntu-ports'],
      历史版本: ['ubuntu-old']
    }
  },
  opensuse: { sections: { 软件源: ['opensuse'], 容器镜像: ['cr-opensuse'] } },
  arxiv: { sections: { 论文资源: ['arxiv'], 导出与查询: ['arxiv-export'] } },
  jenkins: {
    sections: {
      更新中心: ['jenkins'],
      发行与插件下载: ['jenkins-downloads'],
      历史版本: ['jenkins-archives']
    }
  },
  'ip-cohere': { sections: { 'API 域名': ['ip-cohere', 'ip-coherecom'] } },
  'ip-together': { sections: { 'API 域名': ['ip-together', 'ip-togetherai'] } },
  'ip-falai': { sections: { 同步调用: ['ip-falai'], 异步队列: ['ip-falqueue'] } },
  'cr-gcr': { sections: { 全球与区域仓库: ['cr-gcr', 'cr-gcrus', 'cr-gcreu', 'cr-gcrasia'] } },
  'cr-redhat': {
    sections: {
      账号认证仓库: ['cr-redhat'],
      公共镜像: ['cr-redhatpublic'],
      合作伙伴仓库: ['cr-redhatconnect']
    }
  }
};

const guideOwners = new Map(
  Object.entries(guideDefinitions).flatMap(([key, definition]) =>
    Object.values(definition.sections).flatMap(keys => keys.map(member => [member, key] as const))
  )
);
const platformsByKey = Object.fromEntries(platforms.map(platform => [platform.key, platform]));

export const platformGuides = platforms
  .filter(
    platform => !guideOwners.has(platform.key) || guideOwners.get(platform.key) === platform.key
  )
  .map(platform => {
    const definition = guideDefinitions[platform.key];
    return {
      key: platform.key,
      title: definition?.title || platformName(platform.key),
      category: platform.category,
      sections: definition
        ? Object.entries(definition.sections).map(([title, keys]) => ({
            id: keys[0],
            title,
            platforms: keys.map(key => platformsByKey[key])
          }))
        : [{ id: platform.key, title: '平台地址与用法', platforms: [platform] }]
    };
  });

export function platformGuide(key: string) {
  return platformGuides.find(guide => guide.key === (guideOwners.get(key) || key));
}

/** Search includes every child hostname and operation while presenting one result per product. */
export function guideSearchTarget(
  guide: (typeof platformGuides)[number],
  query: string
): string | undefined {
  const term = query.trim().toLowerCase();
  if (
    !term ||
    `${guide.title} ${guide.key} ${categories[guide.category].title}`.toLowerCase().includes(term)
  )
    return '';
  const exactHost = guide.sections.find(section =>
    section.platforms.some(
      platform =>
        platform.upstream.toLowerCase() === term || new URL(platform.upstream).host === term
    )
  );
  if (exactHost) return exactHost.id;
  return guide.sections.find(section =>
    `${section.title} ${section.platforms.map(platform => `${platformName(platform.key)} ${platform.key} ${platform.upstream} ${categories[platform.category].title}`).join(' ')}`
      .toLowerCase()
      .includes(term)
  )?.id;
}
