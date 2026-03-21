# Docker Compose Generator

Generate production-friendly docker-compose presets for popular self-hosted apps.

## Commands

| Command | Action |
| :-- | :-- |
| npm install | Install dependencies |
| npm run dev | Start local dev server |
| npm run build | Build static site |
| node scripts/update_data.js | Refresh Docker image tags in data source |

## Data Source

Service combinations are defined in [src/data/services.json](src/data/services.json).

- apps: application image, exposed port, supported databases, and app DB env key mapping
- databases: database image, default port, data volume path, and init env key mapping
- proxies: proxy image and exposed HTTP/HTTPS ports

## Generated Compose ENV Template

Generated YAML uses environment-variable references so you can connect a .env file directly in production.

Recommended .env example:

```env
APP_DB_HOST=db
APP_DB_USER=app_user
APP_DB_PASSWORD=change_me_app_password
APP_DB_NAME=app_db
DB_ROOT_PASSWORD=change_me_root_password
```

Notes:

- APP_DB_HOST defaults to the selected database service name if omitted.
- APP_DB_USER, APP_DB_PASSWORD, APP_DB_NAME are reused for both app connection and DB initialization.
- DB_ROOT_PASSWORD is only used when the chosen database image supports a root password variable.

## Automation

The workflow in [.github/workflows/auto-update.yml](.github/workflows/auto-update.yml) runs weekly and updates [src/data/services.json](src/data/services.json) automatically.
