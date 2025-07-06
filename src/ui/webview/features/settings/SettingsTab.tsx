import { Component, createSignal, Show } from 'solid-js';
import { store, actions } from '../../core/store';
import { appController } from '../../core/app-controller';
import { useTranslation } from '../../i18n';
import { DatabaseConfig } from '../../../../core/database/types';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import DatabaseModeSelector from './DatabaseModeSelector';
import JsonConfigDisplay from './JsonConfigDisplay';
import PostgresConfigForm from './PostgresConfigForm';
import MCPServerControl from './MCPServerControl';
import AutoCaptureSettings from './AutoCaptureSettings';
import LanguageSelector from './LanguageSelector';

const SettingsTab: Component = () => {
  const { t } = useTranslation();
  
  if (!store.session || !store.data || !store.ui) {
    return <div>{t('common.loading')}</div>;
  }

  const [pendingConfig, setPendingConfig] = createSignal<DatabaseConfig>(store.session.databaseConfig);
  const [showResetConfirm, setShowResetConfirm] = createSignal(false);
  const [activeDBTab, setActiveDBTab] = createSignal<'individual' | 'team'>('individual');

  const handleModeChange = (mode: 'json' | 'postgresql') => {
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

  const handleSaveConfig = () => {
    appController.updateDatabaseConfig(pendingConfig());
  };

  const handleResetConfig = () => {
    actions.setOnboardingCompleted(false);
    appController.resetConfig();
    setShowResetConfirm(false);
  };

  return (
    <div class="settings-tab">
      <div class="settings-section">
        <h3>1. {t('settings.language.title')}</h3>
        <LanguageSelector />
      </div>

      <div class="settings-section">
        <h3>2. {t('settings.mcpServer.title')}</h3>
        <MCPServerControl />
      </div>

      <div class="settings-section">
        <h3>3. Auto-Capture Settings</h3>
        <AutoCaptureSettings />
      </div>

      <div class="settings-section">
        <h3>4. {t('settings.database.title')}</h3>
        <div class="tabs">
          <button 
            class={`tab ${activeDBTab() === 'individual' ? 'active' : ''}`}
            onClick={() => {
              setActiveDBTab('individual');
              handleModeChange('json');
            }}
          >
            Context Individual
          </button>
          <button 
            class={`tab ${activeDBTab() === 'team' ? 'active' : ''}`}
            onClick={() => {
              setActiveDBTab('team');
              handleModeChange('postgresql');
            }}
          >
            Context Team PRO (PostgreSQL)
          </button>
        </div>
        <div class="tab-content">
          <Show when={activeDBTab() === 'individual'}>
            <JsonConfigDisplay config={pendingConfig().json} />
          </Show>
          <Show when={activeDBTab() === 'team'}>
            <PostgresConfigForm 
              config={pendingConfig().postgresql}
              onChange={handlePostgresConfigChange}
            />
          </Show>
        </div>
        <Button 
          variant="primary" 
          onClick={handleSaveConfig}
          disabled={JSON.stringify(pendingConfig()) === JSON.stringify(store.session.databaseConfig)}
        >
          Save Database Configuration
        </Button>
      </div>

      <div class="settings-section">
        <h3>4. Language</h3>
        <p>Language settings will be available in a future update.</p>
      </div>

      <div class="settings-section">
        <h3>5. Reiniciar Configuración</h3>
        <p>Reinicia todas las configuraciones y vuelve a mostrar el wizard de onboarding.</p>
        <Show 
          when={!showResetConfirm()}
          fallback={
            <div>
              <p>¿Estás seguro?</p>
              <Button variant="danger" onClick={handleResetConfig}>Sí, Reiniciar</Button>
              <Button variant="secondary" onClick={() => setShowResetConfirm(false)}>Cancelar</Button>
            </div>
          }
        >
          <Button variant="danger" onClick={() => setShowResetConfirm(true)}>Reiniciar Todo</Button>
        </Show>
      </div>
    </div>
  );
};

export default SettingsTab;
