export const errorDetails = {
  invalid_url: {
    status: 400,
    title: '链接格式有误。',
    description: '请输入完整的 HTTP 或 HTTPS 资源链接，请勿包含账号、密码或空格。'
  },
  unsupported_url: {
    status: 400,
    title: '暂不支持这个地址。',
    description: '请在文档中查看支持的平台，并确认链接包含完整的资源路径。'
  },
  copy_failed: {
    status: 400,
    title: '暂时无法复制链接。',
    description:
      '浏览器未允许访问剪贴板。请使用 HTTPS 或本地地址访问，并检查浏览器的复制权限后重试。'
  },
  not_found: {
    status: 404,
    title: '没有找到这个页面。',
    description: '页面或资源路径不存在，请检查地址，或回到首页重新生成链接。'
  },
  bad_request: {
    status: 400,
    title: '请求未能完成。',
    description: '请求地址或参数不正确，请检查链接后重新尝试。'
  },
  unauthorized: {
    status: 401,
    title: '需要访问凭证。',
    description: '上游资源要求身份认证，请使用对应平台的有效凭证后重试。'
  },
  forbidden: {
    status: 403,
    title: '暂时无法访问。',
    description: '当前请求没有访问权限，请确认上游资源权限和站点访问设置。'
  },
  timeout: {
    status: 504,
    title: '请求等待超时。',
    description: '上游服务未能及时响应，请稍后重新尝试。'
  },
  rate_limited: {
    status: 429,
    title: '请求有些频繁。',
    description: '当前请求超过了服务限制，请稍后再试。'
  },
  upstream: {
    status: 502,
    title: '上游服务暂时不可用。',
    description: '暂时无法连接资源服务，请稍后重试。'
  },
  internal: {
    status: 500,
    title: '遇到了一点问题。',
    description: '页面暂时无法正常加载，请返回首页或稍后重新尝试。'
  }
} as const;

export type AppErrorCode = keyof typeof errorDetails;

export function normaliseErrorCode(value: unknown): AppErrorCode {
  return typeof value === 'string' && Object.hasOwn(errorDetails, value)
    ? (value as AppErrorCode)
    : 'internal';
}

export function errorCodeForStatus(status: number): AppErrorCode {
  if (status === 401) {
    return 'unauthorized';
  }
  if (status === 403) {
    return 'forbidden';
  }
  if (status === 404) {
    return 'not_found';
  }
  if (status === 408 || status === 504) {
    return 'timeout';
  }
  if (status === 429) {
    return 'rate_limited';
  }
  if (status >= 500) {
    return status === 500 ? 'internal' : 'upstream';
  }
  return 'bad_request';
}
