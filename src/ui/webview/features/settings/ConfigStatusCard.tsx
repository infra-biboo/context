import { Component, Show } from 'solid-js';
import { DatabaseConfig, DatabaseStats } from '../../../../core/database/types';

interface ConfigStatusCardProps {
  currentConfig: DatabaseConfig;
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
  stats: DatabaseStats;
}

const ConfigStatusCard: Component<ConfigStatusCardProps> = (props) => {
  const getStatusIcon = () => {
    switch (props.connectionStatus) {
      case 'connected': return '🟢';
      case 'disconnected': return '🔴';
      case 'connecting': return '🟡';
      default: return '⚪';
    }
  };

  const getStatusText = () => {
    switch (props.connectionStatus) {
      case 'connected': return 'Connected';
      case 'disconnected': return 'Disconnected';
      case 'connecting': return 'Connecting...';
      default: return 'Unknown';
    }
  };

  return (
    <div class="config-status-card">
      <div class="status-header">
        <div class="status-indicator">
          <span class="status-icon">{getStatusIcon()}</span>
          <strong>{getStatusText()}</strong>
        </div>
        <div class="current-mode">
          Mode: <strong>{props.currentConfig.type?.toUpperCase() || 'UNKNOWN'}</strong>
        </div>
      </div>

      <div class="status-details">
        <div class="status-row">
          <span>Total Contexts:</span>
          <strong>{props.stats.totalContexts}</strong>
        </div>
        
        <div class="status-row">
          <span>Adapter:</span>
          <strong>{props.stats.adapterType}</strong>
        </div>

        <Show when={props.currentConfig.type === 'json' && props.currentConfig.json}>
          <div class="status-row">
            <span>JSON Path:</span>
            <code>{props.currentConfig.json?.path}</code>
          </div>
          <div class="status-row">
            <span>Context Limit:</span>
            <strong>{props.currentConfig.json?.maxContexts || 1000}</strong>
          </div>
          <Show when={props.stats.totalContexts > 0}>
            <div class="progress-bar">
              <div class="progress-label">
                Usage: {props.stats.totalContexts} / {props.currentConfig.json?.maxContexts || 1000}
              </div>
              <div class="progress-track">
                <div 
                  class="progress-fill"
                  style={{
                    width: `${Math.min(100, (props.stats.totalContexts / (props.currentConfig.json?.maxContexts || 1000)) * 100)}%`
                  }}
                />
              </div>
            </div>
          </Show>
        </Show>

        <Show when={props.currentConfig.type === 'postgresql' && props.currentConfig.postgresql}>
          <div class="status-row">
            <span>Host:</span>
            <code>{props.currentConfig.postgresql?.host}:{props.currentConfig.postgresql?.port}</code>
          </div>
          <div class="status-row">
            <span>Database:</span>
            <code>{props.currentConfig.postgresql?.database}</code>
          </div>
          <div class="status-row">
            <span>Vector Dimensions:</span>
            <strong>{props.currentConfig.postgresql?.vectorDimensions || 384}</strong>
          </div>
        </Show>

        <Show when={props.stats.lastSync}>
          <div class="status-row">
            <span>Last Sync:</span>
            <span>{new Date(props.stats.lastSync!).toLocaleString()}</span>
          </div>
        </Show>
      </div>

      <Show when={Object.keys(props.stats.byType).length > 0}>
        <div class="context-breakdown">
          <h4>Contexts by Type</h4>
          <div class="breakdown-grid">
            {Object.entries(props.stats.byType).map(([type, count]) => (
              <div class="breakdown-item">
                <span class="type">{type}</span>
                <span class="count">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </Show>
    </div>
  );
};

export default ConfigStatusCard;