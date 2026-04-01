export type ProxyServer = 'nginx' | 'caddy' | 'traefik';
export type ProxySeoServer = 'nginx' | 'caddy';
export type ProxyApp = 'react' | 'node' | 'python' | 'ghost' | 'custom';

export type ReverseProxyAppPreset = {
  id: ProxyApp;
  label: string;
  defaultPort: number;
  defaultWebSocket: boolean;
  defaultCors: boolean;
  summary: string;
};

export type ReverseProxyOptions = {
  server: ProxyServer;
  app: ProxyApp;
  domain: string;
  upstreamScheme: 'http' | 'https';
  upstreamHost: string;
  upstreamPort: number;
  healthPath: string;
  https: boolean;
  websocket: boolean;
  cors: boolean;
  corsOrigin: string;
  gzip: boolean;
  brotli: boolean;
  securityHeaders: boolean;
  hsts: boolean;
  rateLimitRps: number;
  uploadMb: number;
};

export type ReverseProxySeoEntry = {
  server: ProxySeoServer;
  app: Exclude<ProxyApp, 'custom'>;
  slug: string;
  title: string;
  description: string;
};

export const REVERSE_PROXY_APP_PRESETS: ReverseProxyAppPreset[] = [
  {
    id: 'node',
    label: 'Node.js API',
    defaultPort: 3000,
    defaultWebSocket: true,
    defaultCors: true,
    summary: 'Express/Nest/Fastify backend with API and websocket support.'
  },
  {
    id: 'react',
    label: 'React Frontend',
    defaultPort: 5173,
    defaultWebSocket: false,
    defaultCors: false,
    summary: 'SPA frontend or static build behind reverse proxy caching.'
  },
  {
    id: 'python',
    label: 'Python App',
    defaultPort: 8000,
    defaultWebSocket: false,
    defaultCors: true,
    summary: 'Django/FastAPI/Flask deployments with upload and CORS controls.'
  },
  {
    id: 'ghost',
    label: 'Ghost CMS',
    defaultPort: 2368,
    defaultWebSocket: false,
    defaultCors: false,
    summary: 'Ghost content site with optimized proxy buffering and compression.'
  },
  {
    id: 'custom',
    label: 'Custom Service',
    defaultPort: 3000,
    defaultWebSocket: false,
    defaultCors: false,
    summary: 'Generic upstream target for any TCP/HTTP service.'
  }
];

export const REVERSE_PROXY_SERVERS: { id: ProxyServer; label: string }[] = [
  { id: 'nginx', label: 'Nginx' },
  { id: 'caddy', label: 'Caddy' },
  { id: 'traefik', label: 'Traefik' }
];

function boolToOnOff(value: boolean): 'on' | 'off' {
  return value ? 'on' : 'off';
}

function normalizedDomain(domain: string): string {
  return domain.trim() || 'example.com';
}

export function getPresetById(app: ProxyApp): ReverseProxyAppPreset {
  return REVERSE_PROXY_APP_PRESETS.find((preset) => preset.id === app) ?? REVERSE_PROXY_APP_PRESETS[0];
}

export function defaultOptionsFor(app: ProxyApp = 'node', server: ProxyServer = 'nginx'): ReverseProxyOptions {
  const preset = getPresetById(app);
  return {
    server,
    app,
    domain: 'example.com',
    upstreamScheme: 'http',
    upstreamHost: '127.0.0.1',
    upstreamPort: preset.defaultPort,
    healthPath: '/health',
    https: true,
    websocket: preset.defaultWebSocket,
    cors: preset.defaultCors,
    corsOrigin: '*',
    gzip: true,
    brotli: false,
    securityHeaders: true,
    hsts: true,
    rateLimitRps: 20,
    uploadMb: 50
  };
}

export function generateNginxConfig(options: ReverseProxyOptions): string {
  const domain = normalizedDomain(options.domain);
  const wsHeaders = options.websocket
    ? [
        '    proxy_set_header Upgrade $http_upgrade;',
        '    proxy_set_header Connection "upgrade";'
      ]
    : [];

  const corsBlock = options.cors
    ? [
        `    add_header Access-Control-Allow-Origin "${options.corsOrigin || '*'}" always;`,
        '    add_header Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS" always;',
        '    add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-Requested-With" always;',
        '    if ($request_method = OPTIONS) { return 204; }'
      ]
    : [];

  const brotliBlock = options.brotli
    ? [
        '    brotli on;',
        '    brotli_comp_level 5;',
        '    brotli_types text/plain text/css application/json application/javascript application/xml+rss image/svg+xml;'
      ]
    : [];

  const securityHeaderBlock = options.securityHeaders
    ? [
        '    add_header X-Content-Type-Options "nosniff" always;',
        '    add_header X-Frame-Options "SAMEORIGIN" always;',
        '    add_header Referrer-Policy "strict-origin-when-cross-origin" always;',
        '    add_header X-XSS-Protection "1; mode=block" always;'
      ]
    : [];

  const hstsBlock = options.hsts && options.https
    ? ['    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;']
    : [];

  const hasRateLimit = options.rateLimitRps > 0;

  const httpsBlock = options.https
    ? [
        'server {',
        '    listen 80;',
        `    server_name ${domain};`,
        '    location /.well-known/acme-challenge/ { root /var/www/certbot; }',
        '    location / { return 301 https://$host$request_uri; }',
        '}',
        '',
        'server {',
        '    listen 443 ssl http2;',
        `    server_name ${domain};`,
        `    ssl_certificate /etc/letsencrypt/live/${domain}/fullchain.pem;`,
        `    ssl_certificate_key /etc/letsencrypt/live/${domain}/privkey.pem;`,
        '    ssl_protocols TLSv1.2 TLSv1.3;',
        '    ssl_session_timeout 1d;',
        ...(hasRateLimit ? [`    limit_req_zone $binary_remote_addr zone=global_rate:10m rate=${Math.max(1, Math.round(options.rateLimitRps))}r/s;`] : [])
      ]
    : [
        'server {',
        '    listen 80;',
        `    server_name ${domain};`
      ];

  return [
    '# Generated by Make Your Own Tools - Reverse Proxy Generator',
    ...httpsBlock,
    `    client_max_body_size ${Math.max(1, options.uploadMb)}m;`,
    `    gzip ${boolToOnOff(options.gzip)};`,
    ...securityHeaderBlock,
    ...hstsBlock,
    ...brotliBlock,
    '',
    ...(hasRateLimit ? ['    location = /healthz {', '        access_log off;', '        return 200 "ok";', '    }', ''] : []),
    '    location / {',
    ...(hasRateLimit ? ['        limit_req zone=global_rate burst=30 nodelay;'] : []),
    `        proxy_pass ${options.upstreamScheme}://${options.upstreamHost}:${Math.max(1, options.upstreamPort)};`,
    '        proxy_http_version 1.1;',
    '        proxy_set_header Host $host;',
    '        proxy_set_header X-Real-IP $remote_addr;',
    '        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;',
    '        proxy_set_header X-Forwarded-Proto $scheme;',
    ...wsHeaders,
    ...corsBlock,
    '    }',
    '}'
  ].join('\n');
}

export function generateCaddyfile(options: ReverseProxyOptions): string {
  const domain = normalizedDomain(options.domain);
  const caddySite = options.https ? domain : `http://${domain}`;

  const corsBlock = options.cors
    ? [
        `    header Access-Control-Allow-Origin "${options.corsOrigin || '*'}"`,
        '    header Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS"',
        '    header Access-Control-Allow-Headers "Authorization, Content-Type, X-Requested-With"'
      ]
    : [];

  const encoding: string[] = [];
  if (options.gzip) encoding.push('gzip');
  if (options.brotli) encoding.push('zstd');

  const securityHeaderBlock = options.securityHeaders
    ? [
        '    header X-Content-Type-Options "nosniff"',
        '    header X-Frame-Options "SAMEORIGIN"',
        '    header Referrer-Policy "strict-origin-when-cross-origin"',
        '    header X-XSS-Protection "1; mode=block"'
      ]
    : [];

  const hstsBlock = options.hsts && options.https
    ? ['    header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"']
    : [];

  return [
    '# Generated by Make Your Own Tools - Reverse Proxy Generator',
    `${caddySite} {`,
    `    reverse_proxy ${options.upstreamScheme}://${options.upstreamHost}:${Math.max(1, options.upstreamPort)}`,
    `    respond /healthz "ok" 200`,
    `    request_body { max_size ${Math.max(1, options.uploadMb)}MB }`,
    ...(encoding.length ? [`    encode ${encoding.join(' ')}`] : []),
    ...corsBlock,
    ...securityHeaderBlock,
    ...hstsBlock,
    options.websocket ? '    # WebSocket is proxied automatically by Caddy reverse_proxy' : '',
    options.https ? '    tls {\n        issuer acme\n    }' : '    tls internal',
    '}'
  ].filter(Boolean).join('\n');
}

export function generateTraefikConfig(options: ReverseProxyOptions): string {
  const domain = normalizedDomain(options.domain);
  const routerName = `${options.app}-router`;
  const serviceName = `${options.app}-service`;
  const middleware: string[] = [];

  if (options.cors) middleware.push(`${options.app}-cors`);
  if (options.gzip || options.brotli) middleware.push(`${options.app}-compress`);
  if (options.securityHeaders) middleware.push(`${options.app}-secure-headers`);
  if (options.rateLimitRps > 0) middleware.push(`${options.app}-ratelimit`);

  const lines = [
    '# Generated by Make Your Own Tools - Reverse Proxy Generator',
    'http:',
    '  routers:',
    `    ${routerName}:`,
    `      rule: "Host(\`${domain}\`)"`,
    `      entryPoints: [${options.https ? 'websecure' : 'web'}]`,
    `      service: ${serviceName}`,
    ...(middleware.length ? [`      middlewares: [${middleware.join(', ')}]`] : []),
    ...(options.https ? ['      tls: {}'] : []),
    '  services:',
    `    ${serviceName}:`,
    '      loadBalancer:',
    '        servers:',
    `          - url: "${options.upstreamScheme}://${options.upstreamHost}:${Math.max(1, options.upstreamPort)}"`,
    '  middlewares:'
  ];

  if (options.cors) {
    lines.push(
      `    ${options.app}-cors:`,
      '      headers:',
      `        accessControlAllowOriginList: ["${options.corsOrigin || '*'}"]`,
      '        accessControlAllowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]',
      '        accessControlAllowHeaders: ["Authorization", "Content-Type", "X-Requested-With"]'
    );
  }

  if (options.gzip || options.brotli) {
    lines.push(
      `    ${options.app}-compress:`,
      '      compress: {}'
    );
  }

  if (options.securityHeaders) {
    lines.push(
      `    ${options.app}-secure-headers:`,
      '      headers:',
      '        customResponseHeaders:',
      '          X-Content-Type-Options: "nosniff"',
      '          X-Frame-Options: "SAMEORIGIN"',
      '          Referrer-Policy: "strict-origin-when-cross-origin"',
      ...(options.hsts && options.https ? ['          Strict-Transport-Security: "max-age=31536000; includeSubDomains; preload"'] : [])
    );
  }

  if (options.rateLimitRps > 0) {
    lines.push(
      `    ${options.app}-ratelimit:`,
      '      rateLimit:',
      `        average: ${Math.max(1, Math.round(options.rateLimitRps))}`,
      '        burst: 30'
    );
  }

  lines.push(
    '',
    '# For upload limit and websocket fine-tuning, set additional middleware in Traefik dynamic config.',
    `# Health endpoint suggestion: ${options.healthPath || '/health'}`,
    `# Target upload limit: ${Math.max(1, options.uploadMb)}MB`,
    options.websocket ? '# WebSocket pass-through is supported automatically with HTTP/1.1 upgrade.' : '# WebSocket disabled in this preset.'
  );

  return lines.join('\n');
}

export function generateReverseProxyConfig(options: ReverseProxyOptions): string {
  if (options.server === 'nginx') return generateNginxConfig(options);
  if (options.server === 'caddy') return generateCaddyfile(options);
  return generateTraefikConfig(options);
}

export function getReverseProxySeoEntries(): ReverseProxySeoEntry[] {
  const apps: Array<Exclude<ProxyApp, 'custom'>> = ['react', 'node', 'python', 'ghost'];
  const servers: ProxySeoServer[] = ['nginx', 'caddy'];

  return servers.flatMap((server) => apps.map((app) => ({
    server,
    app,
    slug: `${server}-reverse-proxy-for-${app}`,
    title: `${server === 'nginx' ? 'Nginx' : 'Caddy'} Reverse Proxy for ${app === 'node' ? 'Node.js' : app === 'python' ? 'Python' : app === 'react' ? 'React' : 'Ghost'} | Config Generator`,
    description: `Generate production-ready ${server === 'nginx' ? 'Nginx' : 'Caddy'} reverse proxy configuration for ${app === 'node' ? 'Node.js' : app === 'python' ? 'Python' : app === 'react' ? 'React frontend' : 'Ghost CMS'} with HTTPS, CORS, websocket, compression, and upload limits.`
  })));
}

export const REVERSE_PROXY_BASE_ROUTES = 1;
export const REVERSE_PROXY_PSEO_ROUTES = getReverseProxySeoEntries().length;
export const REVERSE_PROXY_TOTAL_ROUTES = REVERSE_PROXY_BASE_ROUTES + REVERSE_PROXY_PSEO_ROUTES;
