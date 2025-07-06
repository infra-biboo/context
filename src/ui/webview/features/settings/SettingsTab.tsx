import { Component, createSignal, Show } from 'solid-js';
import { store } from '../../core/store';
import { VSCodeBridge } from '../../core/vscode-bridge';
import { DatabaseConfig } from '../../../../core/database/types';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import DatabaseModeSelector from './DatabaseModeSelector';
import JsonConfigDisplay from './JsonConfigDisplay';
import PostgresConfigForm from './PostgresConfigForm';
import ConfigStatusCard from './ConfigStatusCard';
import MCPServerControl from './MCPServerControl';

const SettingsTab: Component = () => {
  const [pendingConfig, setPendingConfig] = createSignal<DatabaseConfig>(store.databaseConfig());
  const [isTestingConnection, setIsTestingConnection] = createSignal(false);
  const bridge = VSCodeBridge.getInstance();

  const handleModeChange = (mode: 'json' | 'postgresql' | 'hybrid') => {
    const currentConfig = pendingConfig();
    if (mode === 'json') {
      setPendingConfig({
        type: 'json',
        json: currentConfig.json || { path: './context.json', maxContexts: 1000 }
      });
    } else {
      setPendingConfig({
        type: 'postgresql',
        postgresql: currentConfig.postgresql || {
          host: 'localhost',
          port: 5432,
          database: 'claude_context',
          username: 'postgres',
          password: '',
          ssl: false,
          vectorDimensions: 384
        }
      });
    }
  };

  const handlePostgresConfigChange = (config: DatabaseConfig['postgresql']) => {
    setPendingConfig({
      type: 'postgresql',
      postgresql: config
    });
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    try {
      await bridge.testDatabaseConnection(pendingConfig());
    } catch (error) {
      console.error('Connection test failed:', error);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSaveConfig = () => {
    bridge.updateDatabaseConfig(pendingConfig());
  };

  const hasUnsavedChanges = () => {
    return JSON.stringify(pendingConfig()) !== JSON.stringify(store.databaseConfig());
  };

  return (
    <div class="settings-tab">
      <div class="settings-header">
        <h2>⚙️ Database Configuration</h2>
        <p>Configure how Claude Context Manager stores and retrieves your context data.</p>
      </div>

      <div class="settings-content">
        <div class="settings-section">
          <h3>Database Mode</h3>
          <DatabaseModeSelector 
            currentMode={pendingConfig().type}
            onModeChange={handleModeChange}
          />
        </div>

        <div class="settings-section">
          <h3>Configuration</h3>
          <Show 
            when={pendingConfig().type === 'json'}
            fallback={
              <PostgresConfigForm 
                config={pendingConfig().postgresql}
                onChange={handlePostgresConfigChange}
              />
            }
          >
            <JsonConfigDisplay config={pendingConfig().json} />
          </Show>
        </div>

        <div class="settings-section">
          <h3>Current Status</h3>
          <ConfigStatusCard 
            currentConfig={store.databaseConfig()}
            connectionStatus={store.connectionStatus()}
            stats={store.stats()}
          />
        </div>

        <div class="settings-section">
          <MCPServerControl />
        </div>

        <div class="settings-actions">
          <Show when={pendingConfig().type === 'postgresql'}>
            <Button 
              variant="secondary" 
              onClick={handleTestConnection}
              disabled={isTestingConnection()}
            >
              <Show when={isTestingConnection()} fallback="Test Connection">
                <LoadingSpinner size="small" />
                Testing...
              </Show>
            </Button>
          </Show>

          <Button 
            variant="primary" 
            onClick={handleSaveConfig}
            disabled={!hasUnsavedChanges() || store.isLoading()}
          >
            <Show when={store.isLoading()} fallback="Save Configuration">
              <LoadingSpinner size="small" />
              Saving...
            </Show>
          </Button>
        </div>

        <Show when={store.errorMessage()}>
          <div class="error-message">
            ❌ {store.errorMessage()}
          </div>
        </Show>
      </div>
    </div>
  );
};

export default SettingsTab;