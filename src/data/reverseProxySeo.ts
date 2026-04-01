export type ProxyServer = 'nginx' | 'caddy' | 'traefik';
export type ProxySeoServer = 'nginx' | 'caddy';
export type ProxyApp = 'react' | 'node' | 'python' | 'ghost' | 'custom';
export type DatabaseType = 'none' | 'mysql' | 'postgres' | 'mariadb' | 'mongodb';
export type CacheType = 'none' | 'redis' | 'memcached';
export type ProtectionPreset = 'compatible' | 'balanced' | 'strict';

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
  protectionCloudflare: boolean;
  protectionFail2ban: boolean;
  protectionLimitConn: boolean;
  uploadMb: number;
  // Multi-service topology
  selectedDb: DatabaseType;
  selectedCache: CacheType;
  // Protection presets
  protectionPreset: ProtectionPreset;
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

export const DATABASE_OPTIONS: { id: DatabaseType; label: string; port: number }[] = [
  { id: 'none', label: 'No Database', port: 0 },
  { id: 'mysql', label: 'MySQL 8.0', port: 3306 },
  { id: 'postgres', label: 'PostgreSQL 16', port: 5432 },
  { id: 'mariadb', label: 'MariaDB 11', port: 3306 },
  { id: 'mongodb', label: 'MongoDB 7', port: 27017 }
];

export const CACHE_OPTIONS: { id: CacheType; label: string; port: number }[] = [
  { id: 'none', label: 'No Cache', port: 0 },
  { id: 'redis', label: 'Redis 7', port: 6379 },
  { id: 'memcached', label: 'Memcached 1.6', port: 11211 }
];

export const PROTECTION_PRESETS: Record<ProtectionPreset, { label: string; description: string }> = {
  compatible: {
    label: '🟢 Compatible (Recommended)',
    description: 'Balanced security and compatibility. HSTS 6 months, 20 req/s, standard headers.'
  },
  balanced: {
    label: '🟡 Balanced (Prod)',
    description: 'Enhanced security. HSTS 1 year, 10 req/s, strict CSP and XFO headers.'
  },
  strict: {
    label: '🔴 Strict (High-Traffic)',
    description: 'Maximum security. HSTS 2 years, 5 req/s, fail2ban + Cloudflare + limit_conn.'
  }
};

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
    protectionCloudflare: false,
    protectionFail2ban: false,
    protectionLimitConn: true,
    uploadMb: 50,
    selectedDb: 'none',
    selectedCache: 'none',
    protectionPreset: 'compatible'
  };
}

// Apply protection preset to options
export function applyProtectionPreset(options: ReverseProxyOptions, preset: ProtectionPreset): ReverseProxyOptions {
  const presetConfig: Record<ProtectionPreset, Partial<ReverseProxyOptions>> = {
    compatible: {
      rateLimitRps: 20,
      hsts: true,
      securityHeaders: true,
      protectionCloudflare: false,
      protectionFail2ban: false,
      protectionLimitConn: true
    },
    balanced: {
      rateLimitRps: 10,
      hsts: true,
      securityHeaders: true,
      protectionCloudflare: false,
      protectionFail2ban: true,
      protectionLimitConn: true
    },
    strict: {
      rateLimitRps: 5,
      hsts: true,
      securityHeaders: true,
      protectionCloudflare: true,
      protectionFail2ban: true,
      protectionLimitConn: true
    }
  };

  return { ...options, ...presetConfig[preset], protectionPreset: preset };
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
  const hasLimitConn = options.protectionLimitConn;

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
    ...(hasLimitConn ? ['        limit_conn perip_conn 30;'] : []),
    `        proxy_pass ${options.upstreamScheme}://${options.upstreamHost}:${Math.max(1, options.upstreamPort)};`,
    '        proxy_http_version 1.1;',
    '        proxy_set_header Host $host;',
    '        proxy_set_header X-Real-IP $remote_addr;',
    '        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;',
    '        proxy_set_header X-Forwarded-Proto $scheme;',
    ...wsHeaders,
    ...corsBlock,
    '    }',
    ...(options.protectionCloudflare
      ? [
          '',
          '    # Cloudflare real IP mode',
          '    real_ip_header CF-Connecting-IP;',
          '    # Add Cloudflare CIDRs to set_real_ip_from in production.'
        ]
      : []),
    ...(options.protectionFail2ban
      ? [
          '',
          '    # Fail2ban integration hint',
          '    access_log /var/log/nginx/access.log;',
          '    error_log /var/log/nginx/error.log warn;'
        ]
      : []),
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

  const securityNote = options.protectionCloudflare
    ? ['    # Cloudflare mode: configure trusted_proxies with Cloudflare CIDRs in production']
    : [];

  const fail2banNote = options.protectionFail2ban
    ? ['    log {', '        output file /var/log/caddy/access.log', '    }']
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
    ...securityNote,
    ...fail2banNote,
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

  if (options.protectionCloudflare) {
    lines.push(
      `    ${options.app}-cloudflare:`,
      '      ipAllowList:',
      '        sourceRange:',
      '          - "173.245.48.0/20"',
      '          - "103.21.244.0/22"',
      '          - "103.22.200.0/22"'
    );
  }

  if (options.protectionFail2ban) {
    lines.push(
      '',
      '# Fail2ban hint: enable Traefik access logs and parse status-based bans in jail config.'
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

export function generateReverseProxyComposeBundle(options: ReverseProxyOptions): string {
  const serviceName = `${options.app}-app`;
  const networkName = 'edge';
  
  // Build database service configuration
  let dbService: string[] = [];
  if (options.selectedDb !== 'none') {
    const dbPort = DATABASE_OPTIONS.find(d => d.id === options.selectedDb)?.port || 3306;
    const dbImage = {
      mysql: 'mysql:8.0',
      postgres: 'postgres:16-alpine',
      mariadb: 'mariadb:11',
      mongodb: 'mongo:7'
    }[options.selectedDb] || 'mysql:8.0';
    
    const dbName = options.selectedDb;
    dbService = [
      `  ${dbName}:`,
      `    image: ${dbImage}`,
      '    expose:',
      `      - "${dbPort}"`,
      ...(options.selectedDb !== 'mongodb' ? [
        '    environment:',
        ...(options.selectedDb === 'postgres' ? [
          '      POSTGRES_PASSWORD: changeme',
          '      POSTGRES_DB: app'
        ] : [
          '      MYSQL_ROOT_PASSWORD: changeme',
          '      MYSQL_DATABASE: app'
        ])
      ] : []),
      '    networks:',
      `      - ${networkName}`,
      '    volumes:',
      `      - ${dbName}_data:/data`
    ];
  }
  
  // Build cache service configuration
  let cacheService: string[] = [];
  if (options.selectedCache !== 'none') {
    const cachePort = CACHE_OPTIONS.find(c => c.id === options.selectedCache)?.port || 6379;
    const cacheImage = {
      redis: 'redis:7-alpine',
      memcached: 'memcached:1.6-alpine'
    }[options.selectedCache] || 'redis:7-alpine';
    
    const cacheName = options.selectedCache;
    cacheService = [
      `  ${cacheName}:`,
      `    image: ${cacheImage}`,
      '    expose:',
      `      - "${cachePort}"`,
      '    networks:',
      `      - ${networkName}`
    ];
  }

  // Build depends_on for proxy
  const proxyDependencies = [serviceName, ...(options.selectedDb !== 'none' ? [options.selectedDb] : []), ...(options.selectedCache !== 'none' ? [options.selectedCache] : []), ...(options.protectionFail2ban ? ['fail2ban'] : [])];
  
  // Build volumes list
  const volumes: string[] = [];
  if (options.selectedDb !== 'none') volumes.push(`  ${options.selectedDb}_data:`);
  if (options.server !== 'traefik') {
    if (options.server === 'caddy') {
      volumes.push('  caddy_data:');
      volumes.push('  caddy_config:');
    }
  }

  if (options.server === 'nginx') {
    return [
      'version: "3.9"',
      'services:',
      '  nginx:',
      '    image: nginx:1.27-alpine',
      '    ports:',
      '      - "80:80"',
      ...(options.https ? ['      - "443:443"'] : []),
      '    volumes:',
      '      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro',
      ...(options.https ? ['      - ./certbot/www:/var/www/certbot', '      - ./certbot/conf:/etc/letsencrypt'] : []),
      '    depends_on:',
      ...proxyDependencies.map(dep => `      - ${dep}`),
      '    networks:',
      `      - ${networkName}`,
      `  ${serviceName}:`,
      '    image: your-app-image:latest',
      '    expose:',
      `      - "${Math.max(1, options.upstreamPort)}"`,
      ...dbService,
      ...cacheService,
      ...(options.https
        ? [
            '  certbot:',
            '    image: certbot/certbot:latest',
            '    volumes:',
            '      - ./certbot/www:/var/www/certbot',
            '      - ./certbot/conf:/etc/letsencrypt',
            '    entrypoint: >-',
            `      certonly --webroot -w /var/www/certbot -d ${normalizedDomain(options.domain)} --email admin@${normalizedDomain(options.domain)} --agree-tos --no-eff-email`,
            '    networks:',
            `      - ${networkName}`
          ]
        : []),
      ...(options.protectionFail2ban
        ? [
            '  fail2ban:',
            '    image: crazymax/fail2ban:latest',
            '    network_mode: host',
            '    cap_add:',
            '      - NET_ADMIN',
            '      - NET_RAW',
            '    volumes:',
            '      - ./fail2ban:/data',
            '      - /var/log:/var/log:ro'
          ]
        : []),
      'networks:',
      `  ${networkName}:`,
      '    driver: bridge',
      ...(volumes.length ? ['volumes:'] : []),
      ...volumes
    ].join('\n');
  }

  if (options.server === 'caddy') {
    return [
      'version: "3.9"',
      'services:',
      '  caddy:',
      '    image: caddy:2.8-alpine',
      '    ports:',
      '      - "80:80"',
      ...(options.https ? ['      - "443:443"'] : []),
      '    volumes:',
      '      - ./Caddyfile:/etc/caddy/Caddyfile:ro',
      '      - caddy_data:/data',
      '      - caddy_config:/config',
      '    depends_on:',
      ...proxyDependencies.map(dep => `      - ${dep}`),
      '    networks:',
      `      - ${networkName}`,
      `  ${serviceName}:`,
      '    image: your-app-image:latest',
      '    expose:',
      `      - "${Math.max(1, options.upstreamPort)}"`,
      '    networks:',
      `      - ${networkName}`,
      ...dbService,
      ...cacheService,
      'networks:',
      `  ${networkName}:`,
      '    driver: bridge',
      'volumes:',
      '  caddy_data:',
      '  caddy_config:',
      ...volumes.filter(v => !v.includes('caddy'))
    ].join('\n');
  }

  // Traefik
  return [
    'version: "3.9"',
    'services:',
    '  traefik:',
    '    image: traefik:v3.1',
    '    command:',
    '      - --providers.docker=true',
    '      - --providers.file.filename=/etc/traefik/dynamic.yml',
    '      - --entrypoints.web.address=:80',
    ...(options.https ? ['      - --entrypoints.websecure.address=:443', '      - --certificatesresolvers.le.acme.tlschallenge=true', `      - --certificatesresolvers.le.acme.email=admin@${normalizedDomain(options.domain)}`, '      - --certificatesresolvers.le.acme.storage=/letsencrypt/acme.json'] : []),
    '    ports:',
    '      - "80:80"',
    ...(options.https ? ['      - "443:443"'] : []),
    '    volumes:',
    '      - /var/run/docker.sock:/var/run/docker.sock:ro',
    '      - ./dynamic.yml:/etc/traefik/dynamic.yml:ro',
    ...(options.https ? ['      - ./letsencrypt:/letsencrypt'] : []),
    '    depends_on:',
    ...proxyDependencies.map(dep => `      - ${dep}`),
    '    networks:',
    `      - ${networkName}`,
    `  ${serviceName}:`,
    '    image: your-app-image:latest',
    '    expose:',
    `      - "${Math.max(1, options.upstreamPort)}"`,
    '    networks:',
    `      - ${networkName}`,
    ...dbService,
    ...cacheService,
    'networks:',
    `  ${networkName}:`,
    '    driver: bridge',
    ...(volumes.length ? ['volumes:'] : []),
    ...volumes
  ].join('\n');
}

export function getReverseProxySeoEntries(): ReverseProxySeoEntry[] {
  const apps: Array<Exclude<ProxyApp, 'custom'>> = ['react', 'node', 'python', 'ghost'];
  const servers: ProxySeoServer[] = ['nginx', 'caddy'];

  return servers.flatMap((server) => apps.map((app) => ({
    server,
    app,
    slug: `${server}-for-${app}`,
    title: `${server === 'nginx' ? 'Nginx' : 'Caddy'} Reverse Proxy for ${app === 'node' ? 'Node.js' : app === 'python' ? 'Python' : app === 'react' ? 'React' : 'Ghost'} | Config Generator`,
    description: `Generate production-ready ${server === 'nginx' ? 'Nginx' : 'Caddy'} reverse proxy configuration for ${app === 'node' ? 'Node.js' : app === 'python' ? 'Python' : app === 'react' ? 'React frontend' : 'Ghost CMS'} with HTTPS, CORS, websocket, compression, and upload limits.`
  })));
}

export const REVERSE_PROXY_BASE_ROUTES = 1;
export const REVERSE_PROXY_PSEO_ROUTES = getReverseProxySeoEntries().length;
export const REVERSE_PROXY_TOTAL_ROUTES = REVERSE_PROXY_BASE_ROUTES + REVERSE_PROXY_PSEO_ROUTES;
