# Claude Context Manager

Smart context management for Claude AI tools in VS Code.

## Features

- **Context Storage**: Persistent storage of conversation contexts and decisions
- **Visual Management**: Sidebar panel for managing captured contexts
- **Smart Capture**: Automatic context capture from git commits and file changes
- **Multi-Agent Support**: Agent selection and configuration UI
- **MCP Integration**: Model Context Protocol integration for Claude Code

## Development

### Requirements

- Node.js 18+
- VS Code 1.74+
- TypeScript 4.9+

### Setup

```bash
npm install
npm run compile
```

### Run Extension

1. Open project in VS Code
2. Press F5 to launch Extension Development Host
3. Look for "Claude Context" panel in Explorer sidebar

### Available Commands

- `Claude Context: Test` - Test extension functionality
- `Claude Context: Open Panel` - Open context management panel

## Architecture

```
src/
├── core/           # Core business logic
│   ├── database.ts         # Context storage
│   ├── context-manager.ts  # Context management
│   └── config-store.ts     # Configuration
├── ui/             # User interface
│   └── webview-provider.ts # Sidebar panel
├── commands/       # VS Code commands
└── utils/          # Utilities
```
GO GO?

## Current Status

- ✅ **Iteration 0**: Foundation setup complete
- ✅ **Iteration 1**: Core storage + basic UI complete
- ✅ **Iteration 2**: Git integration + file watcher complete
- ⏳ **Iteration 3**: Agent selection UI (next)

## License

MIT# context-manager
# context
