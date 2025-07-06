import { Component } from 'solid-js';
import { Link, CheckCircle, XCircle, AlertTriangle } from 'lucide-solid';
import { store } from '../../core/store';
import { appController } from '../../core/app-controller';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';

const MCPServerControl: Component = () => {
  // Defensive check to prevent undefined errors
  if (!store.session || !store.data || !store.ui) {
    return <div>Loading...</div>;
  }
  
  const handleStartServer = () => {
    appController.startMcpServer();
  };

  const handleStopServer = () => {
    appController.stopMcpServer();
  };

  return (
    <div class="mcp-server-control">
      <h3><Link size={20} style={{display: 'inline', 'margin-right': '8px'}} /> MCP Server Control</h3>
      <p class="section-description">
        Control the Model Context Protocol server that enables communication with Claude AI tools.
      </p>
      
      <div class="server-status">
        <div class="status-row">
          <span class="label">Status:</span>
          <span class={`status ${store.session.mcpStatus.connected ? 'connected' : 'disconnected'}`}>
            {store.session.mcpStatus.connected ? <><CheckCircle size={16} color="#4CAF50" style={{'margin-right': '4px'}} /> Connected</> : <><XCircle size={16} color="#f44336" style={{'margin-right': '4px'}} /> Disconnected</>}
          </span>
        </div>
        <div class="status-row">
          <span class="label">Message:</span>
          <span class="message">{store.session.mcpStatus.status}</span>
        </div>
      </div>

      <div class="server-controls">
        <Button
          variant="primary"
          onClick={handleStartServer}
          disabled={store.session.mcpStatus.connected || store.ui.isLoading}
        >
          {store.ui.isLoading ? (
            <>
              <LoadingSpinner size="small" />
              Starting...
            </>
          ) : 'Start Server'}
        </Button>

        <Button
          variant="secondary"
          onClick={handleStopServer}
          disabled={!store.session.mcpStatus.connected || store.ui.isLoading}
        >
          {store.ui.isLoading ? (
            <>
              <LoadingSpinner size="small" />
              Stopping...
            </>
          ) : 'Stop Server'}
        </Button>
      </div>

      <div class="server-info">
        <h4>Configuration Details</h4>
        <div class="config-details">
          <div class="config-row">
            <span class="label">Database Type:</span>
            <span class="value">{store.session.databaseConfig.type?.toUpperCase()}</span>
          </div>
          <div class="config-row">
            <span class="label">Database Path:</span>
            <span class="value">{store.session.databaseConfig.json?.path || 'N/A'}</span>
          </div>
          <div class="config-row">
            <span class="label">Max Contexts:</span>
            <span class="value">{store.session.databaseConfig.json?.maxContexts || 'N/A'}</span>
          </div>
        </div>
      </div>

      {store.ui.errorMessage && (
        <div class="error-message">
          <AlertTriangle size={16} style={{'margin-right': '4px'}} /> {store.ui.errorMessage}
        </div>
      )}
    </div>
  );
};

export default MCPServerControl;
