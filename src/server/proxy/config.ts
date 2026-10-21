import { PLATFORMS } from '#/lib/platforms/catalog.ts';

/**
 * Parses an environment value as an integer at or above the configured minimum.
 */
function parseIntegerAtLeast(value: unknown, fallback: number, minimum: number = 1): number {
  if (typeof value !== 'number' && (typeof value !== 'string' || value.trim() === '')) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= minimum ? parsed : fallback;
}

/**
 * Parses an environment value as a positive integer.
 */
function parsePositiveInteger(value: unknown, fallback: number): number {
  return parseIntegerAtLeast(value, fallback, 1);
}

/**
 * Security-related configuration options for request validation and CORS.
 * @example
 * // Default security config
 * const security = {
 *   ALLOWED_METHODS: ['GET', 'HEAD'],
 *   ALLOWED_ORIGINS: ['*'],
 *   MAX_PATH_LENGTH: 2048
 * };
 * @example
 * // Custom security config with restricted origins
 * const security = {
 *   ALLOWED_METHODS: ['GET', 'HEAD', 'POST'],
 *   ALLOWED_ORIGINS: ['https://example.com', 'https://app.example.com'],
 *   MAX_PATH_LENGTH: 4096
 * };
 */

/**
 * Complete application configuration object with runtime settings.
 *
 * This configuration controls timeout behavior, retry logic, caching, security policies,
 * and platform URL mappings. All values can be overridden via environment variables
 * in Cloudflare Workers.
 * @example
 * // Default configuration
 * const config = {
 *   TIMEOUT_SECONDS: 30,
 *   MAX_RETRIES: 3,
 *   RETRY_DELAY_MS: 1000,
 *   CACHE_DURATION: 300,
 *   SECURITY: {
 *     ALLOWED_METHODS: ['GET', 'HEAD'],
 *     ALLOWED_ORIGINS: ['*'],
 *     MAX_PATH_LENGTH: 2048
 *   },
 *   PLATFORMS: { gh: 'https://github.com', ... }
 * };
 * @example
 * // Configuration with environment overrides
 * const env = {
 *   TIMEOUT_SECONDS: '60',
 *   MAX_RETRIES: '5',
 *   CACHE_DURATION: '3600'
 * };
 * const config = createConfig(env);
 * // Results in timeout of 60s, 5 retries, 1 hour cache
 */

/**
 * Creates application configuration with environment variable overrides.
 *
 * This function merges default configuration values with environment-specific overrides
 * provided by Cloudflare Workers. Environment variables are parsed as integers where
 * applicable, and fallback to defaults if parsing fails or values are missing.
 *
 * **Environment variable mapping:**
 * - `TIMEOUT_SECONDS` - Override default timeout (default: 30)
 * - `MAX_RETRIES` - Override max retry attempts (default: 3)
 * - `RETRY_DELAY_MS` - Override retry delay (default: 1000)
 * - `CACHE_DURATION` - Override fallback mutable cache TTL (default: 300 = 5 minutes)
 * - `ALLOWED_METHODS` - Comma-separated HTTP methods (default: 'GET,HEAD')
 * - `ALLOWED_ORIGINS` - Comma-separated CORS origins (default: '*')
 * - `MAX_PATH_LENGTH` - Override max path length (default: 2048)
 * @example
 * // Create config with defaults (no environment variables)
 * const config = createConfig();
 * console.log(config.TIMEOUT_SECONDS); // 30
 * console.log(config.CACHE_DURATION); // 300
 * @example
 * // Create config with environment overrides
 * const env = {
 *   TIMEOUT_SECONDS: '60',
 *   MAX_RETRIES: '5',
 *   CACHE_DURATION: '3600',
 *   ALLOWED_METHODS: 'GET,HEAD,POST,PUT'
 * };
 * const config = createConfig(env);
 * console.log(config.TIMEOUT_SECONDS); // 60
 * console.log(config.MAX_RETRIES); // 5
 * console.log(config.CACHE_DURATION); // 3600 (1 hour)
 * console.log(config.SECURITY.ALLOWED_METHODS); // ['GET', 'HEAD', 'POST', 'PUT']
 * @example
 * // Invalid environment values fallback to defaults
 * const env = {
 *   TIMEOUT_SECONDS: 'invalid',
 *   MAX_RETRIES: 'not-a-number'
 * };
 * const config = createConfig(env);
 * console.log(config.TIMEOUT_SECONDS); // 30 (default)
 * console.log(config.MAX_RETRIES); // 3 (default)
 * @example
 * // Custom CORS origins
 * const env = {
 *   ALLOWED_ORIGINS: 'https://example.com,https://app.example.com'
 * };
 * const config = createConfig(env);
 * console.log(config.SECURITY.ALLOWED_ORIGINS);
 * // ['https://example.com', 'https://app.example.com']
 */
export function createConfig(env: Record<string, unknown> = {}): ApplicationConfig {
  const allowedMethods =
    typeof env.ALLOWED_METHODS === 'string'
      ? env.ALLOWED_METHODS.split(',')
          .map(method => method.trim())
          .filter(Boolean)
      : ['GET', 'HEAD'];
  const allowedOrigins =
    typeof env.ALLOWED_ORIGINS === 'string'
      ? env.ALLOWED_ORIGINS.split(',')
          .map(origin => origin.trim())
          .filter(Boolean)
      : ['*'];

  return {
    TIMEOUT_SECONDS: parsePositiveInteger(env.TIMEOUT_SECONDS, 30),
    MAX_RETRIES: parsePositiveInteger(env.MAX_RETRIES, 3),
    RETRY_DELAY_MS: parseIntegerAtLeast(env.RETRY_DELAY_MS, 1000, 0),
    CACHE_DURATION: parsePositiveInteger(env.CACHE_DURATION, 300), // 5 minutes
    SECURITY: {
      ALLOWED_METHODS: allowedMethods.length ? allowedMethods : ['GET', 'HEAD'],
      ALLOWED_ORIGINS: allowedOrigins.length ? allowedOrigins : ['*'],
      MAX_PATH_LENGTH: parsePositiveInteger(env.MAX_PATH_LENGTH, 2048)
    },
    PLATFORMS
  };
}

/**
 * Default application configuration instance.
 *
 * This is a pre-instantiated configuration object using default values with no
 * environment overrides. In production (Cloudflare Workers), you should use
 * `createConfig(env)` instead to allow runtime configuration.
 * @example
 * // Import default config
 * import { CONFIG } from './config';
 * console.log(CONFIG.TIMEOUT_SECONDS); // 30
 * @example
 * // Check platform availability
 * if (CONFIG.PLATFORMS.npm) {
 *   console.log('npm platform available');
 * }
 */
export const CONFIG: ApplicationConfig = createConfig();

export interface SecurityConfig {
  ALLOWED_METHODS: string[];
  ALLOWED_ORIGINS: string[];
  MAX_PATH_LENGTH: number;
}

export interface ApplicationConfig {
  TIMEOUT_SECONDS: number;
  MAX_RETRIES: number;
  RETRY_DELAY_MS: number;
  CACHE_DURATION: number;
  SECURITY: SecurityConfig;
  PLATFORMS: { [key: string]: string };
}
