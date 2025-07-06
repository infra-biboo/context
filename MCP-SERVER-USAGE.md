# MCP Server Usage Guide

## Overview

The MCP (Model Context Protocol) Server can run in two modes:
1. **Integrated with VS Code Extension** - Automatically uses the same database as the extension
2. **Standalone Mode** - Can be run independently with SQLite, PostgreSQL, or Hybrid configuration

## Standalone Mode Configuration

### SQLite (Default)

Simple local database, perfect for development:

```bash
# Using default SQLite database
node dist/mcp-server.js

# Or with custom path
DB_TYPE=sqlite SQLITE_PATH=./my-context.db node dist/mcp-server.js
```

### PostgreSQL

For production environments with vector search capabilities:

```bash
DB_TYPE=postgresql \
PG_HOST=localhost \
PG_PORT=5432 \
PG_DATABASE=context_manager \
PG_USERNAME=postgres \
PG_PASSWORD=mypassword \
node dist/mcp-server.js
```

### Hybrid Mode

Best of both worlds - SQLite for speed, PostgreSQL for vector search:

```bash
DB_TYPE=hybrid \
SQLITE_PATH=./local-cache.db \
PG_HOST=prod-db.company.com \
PG_DATABASE=context_manager \
PG_USERNAME=postgres \
PG_PASSWORD=mypassword \
SYNC_INTERVAL=5 \
node dist/mcp-server.js
```

## Building the MCP Server

```bash
# Build the standalone server
npm run compile

# The server will be available at:
# dist/mcp-server.js
```

## Claude Desktop Integration

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json`):

### For SQLite
```json
{
  "mcpServers": {
    "context-manager": {
      "command": "node",
      "args": ["/path/to/context-manager/dist/mcp-server.js"],
      "env": {
        "DB_TYPE": "sqlite",
        "SQLITE_PATH": "/path/to/your/context.db"
      }
    }
  }
}
```

### For PostgreSQL
```json
{
  "mcpServers": {
    "context-manager": {
      "command": "node",
      "args": ["/path/to/context-manager/dist/mcp-server.js"],
      "env": {
        "DB_TYPE": "postgresql",
        "PG_HOST": "localhost",
        "PG_PORT": "5432",
        "PG_DATABASE": "context_manager",
        "PG_USERNAME": "postgres",
        "PG_PASSWORD": "mypassword"
      }
    }
  }
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_TYPE` | Database type: `sqlite`, `postgresql`, `hybrid` | `sqlite` |
| `SQLITE_PATH` | Path to SQLite database file | `./mcp-context.db` |
| `PG_HOST` | PostgreSQL host | `localhost` |
| `PG_PORT` | PostgreSQL port | `5432` |
| `PG_DATABASE` | PostgreSQL database name | `context_manager` |
| `PG_USERNAME` | PostgreSQL username | `postgres` |
| `PG_PASSWORD` | PostgreSQL password | (empty) |
| `PG_SSL` | Enable SSL for PostgreSQL | `false` |
| `SYNC_INTERVAL` | Minutes between syncs (hybrid mode) | `5` |

## Features by Database Type

### SQLite
- ✅ Fast local queries
- ✅ Zero configuration
- ✅ No external dependencies
- ❌ No vector search
- ❌ Single user only

### PostgreSQL
- ✅ Vector search with pgvector
- ✅ Multi-user support
- ✅ Scalable
- ❌ Requires PostgreSQL server
- ❌ Slightly slower for simple queries

### Hybrid
- ✅ Fast local queries (SQLite)
- ✅ Vector search (PostgreSQL)
- ✅ Automatic sync
- ✅ Best performance
- ❌ More complex setup

## Testing the Server

```bash
# Test with SQLite
DB_TYPE=sqlite node dist/mcp-server.js

# Test with PostgreSQL (requires running PostgreSQL server)
docker run -d \
  --name postgres-context \
  -e POSTGRES_PASSWORD=testpass \
  -e POSTGRES_DB=context_manager \
  -p 5432:5432 \
  ankane/pgvector

DB_TYPE=postgresql \
PG_PASSWORD=testpass \
node dist/mcp-server.js
```

## Troubleshooting

1. **Server doesn't start**: Check that all required environment variables are set
2. **PostgreSQL connection fails**: Verify PostgreSQL is running and credentials are correct
3. **SQLite permission errors**: Ensure the directory for the database file is writable
4. **Hybrid sync issues**: Check both SQLite and PostgreSQL connections are working

## Development Tips

- Use SQLite for local development
- Test with PostgreSQL before deploying to production
- Consider Hybrid mode for best user experience
- Monitor sync status in Hybrid mode logs