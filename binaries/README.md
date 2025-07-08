# SQLite3 Binaries

Pre-compiled SQLite3 binaries for different platforms.

## Files

- `vscode-sqlite3-darwin-universal2.node` - macOS Universal (Intel + ARM)
- `vscode-sqlite3-darwin-x64.node` - macOS Intel
- `vscode-sqlite3-darwin-arm64.node` - macOS ARM64
- `vscode-sqlite3-linux-x64.node` - Linux x64
- `vscode-sqlite3-win32-x64.node` - Windows x64

## Usage

These binaries are automatically used by the SQLite adapter when the extension is packaged.

## Source

Generated using the same process as the CI workflow:
```bash
npm rebuild @vscode/sqlite3 --build-from-source --target_arch=x64
```