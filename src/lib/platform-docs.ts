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
