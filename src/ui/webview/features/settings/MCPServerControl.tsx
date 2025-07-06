import { Component, Show } from 'solid-js';
import { store } from '../../core/store';
import { VSCodeBridge } from '../../core/vscode-bridge';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';

const MCPServerControl: Component = () => {
  const bridge = VSCodeBridge.getInstance();

  const handleStartServer = () => {
    bridge.startMCPServer();
  };

  const handleStopServer = () => {
    bridge.stopMCPServer();
  };

  const handleRefreshStatus = () => {
    bridge.getMCPStatus();
  };

  const getStatusIcon = () => {
    return store.mcpStatus().connected ? '🟢' : '🔴';
  };

  const getStatusColor = () => {
    return store.mcpStatus().connected ? 'var(--vscode-testing-iconPassed)' : 'var(--vscode-testing-iconFailed)';
  };

  return (
    <div class="mcp-server-control">
      <div class="mcp-header">
        <h4>🔗 MCP Server Control</h4>
        <p>Control the Model Context Protocol server for Claude Desktop integration</p>
      </div>

      <div class="mcp-status">
        <div class="status-row">
          <span class="status-label">Status:</span>
          <div class="status-value" style={{ color: getStatusColor() }}>
            {getStatusIcon()} {store.mcpStatus().status}
          </div>
        </div>
      </div>

      <div class="mcp-actions">
        <Show when={!store.mcpStatus().connected} fallback={
          <Button 
            variant="danger" 
            onClick={handleStopServer}
            disabled={store.isLoading()}
          >
            <Show when={store.isLoading()} fallback="🛑 Stop Server">
              <LoadingSpinner size="small" />
              Stopping...
            </Show>
          </Button>
        }>
          <Button 
            variant="primary" 
            onClick={handleStartServer}
            disabled={store.isLoading()}
          >
            <Show when={store.isLoading()} fallback="▶️ Start Server">
              <LoadingSpinner size="small" />
              Starting...
            </Show>
          </Button>
        </Show>

        <Button 
          variant="secondary" 
          onClick={handleRefreshStatus}
          disabled={store.isLoading()}
        >
          🔄 Refresh
        </Button>
      </div>

      <div class="mcp-info">
        <h5>📋 How to Use</h5>
        <ol>
          <li><strong>Start the server</strong> using the button above</li>
          <li><strong>Copy the configuration</strong> to your Claude Desktop settings</li>
          <li><strong>Restart Claude Desktop</strong> to connect to the server</li>
        </ol>
        
        <div class="config-example">
          <h6>Claude Desktop Configuration:</h6>
          <pre>
{`{
  "mcpServers": {
    "context-manager": {
      "command": "node",
      "args": ["/path/to/your/project/dist/mcp-server.js"],
      "env": {
        "DB_TYPE": "${store.databaseConfig().type}",
        ${store.databaseConfig().type === 'json' 
          ? `"SQLITE_PATH": "${store.databaseConfig().json?.path || './context.json'}"` 
          : `"PG_HOST": "${store.databaseConfig().postgresql?.host || 'localhost'}",
        "PG_DATABASE": "${store.databaseConfig().postgresql?.database || 'context_manager'}"`
        }
      }
    }
  }
}`}
          </pre>
          <p style="font-size: 11px; color: var(--vscode-descriptionForeground); margin-top: 8px;">
            Replace "/path/to/your/project" with the actual path to this extension's directory.
          </p>
        </div>
      </div>

      <Show when={store.errorMessage()}>
        <div class="error-message">
          ❌ {store.errorMessage()}
        </div>
      </Show>
    </div>
  );
};

export default MCPServerControl;