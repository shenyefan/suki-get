import type { ApplicationConfig } from './config';

export interface RequestTraits {
  isAPI: boolean;
  isAI: boolean;
  isDocker: boolean;
  isGit: boolean;
  isGitLFS: boolean;
  isHF: boolean;
}

export interface RequestContext extends RequestTraits {
  config: ApplicationConfig;
  env: Record<string, unknown>;
  isCorsPreflight: boolean;
  request: Request;
  url: URL;
}

export interface CachePolicy {
  allowCacheApi: boolean;
  allowFetchCache: boolean;
  browserTtl: number;
  cacheControl: string;
  edgeTtl: number;
  mode: 'bypass' | 'edge' | 'private';
  varyByOrigin: boolean;
}
