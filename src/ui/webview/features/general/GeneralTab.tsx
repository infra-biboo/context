import { Component, For, Show } from 'solid-js';
import { Rocket, BarChart3, FileText, Database, CheckCircle, XCircle, Bot, Clock, AlertTriangle } from 'lucide-solid';
import { store, computed } from '../../core/store';
import { appController } from '../../core/app-controller';
import { useTranslation } from '../../i18n';
import StatusCard from '../../components/StatusCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import ContentCard from '../../components/ContentCard';
import Button from '../../components/Button';
import AddCustomContext from '../create/AddCustomContext';

const GeneralTab: Component = () => {
  const { t } = useTranslation();
  
  // Defensive check to prevent undefined errors
  if (!store.session || !store.data || !store.ui) {
    return <div>{t('common.loading')}</div>;
  }

  const handleRefreshContexts = () => {
    appController.loadContexts();
  };


  return (
    <div class="general-tab">
      <div class="tab-header">
        <h2>{t('general.title')}</h2>
        <p>{t('general.description')}</p>
      </div>

      <Show when={!store.session.mcpStatus.connected}>
        <ContentCard icon={<Rocket size={20} />} title={t('general.getStarted.title')}>
          <div class="get-started-guide">
            <p>
              {t('general.getStarted.welcome')}
            </p>
            <p>
              {t('general.getStarted.instruction')}
            </p>
          </div>
        </ContentCard>
      </Show>

      <Show when={store.ui.isLoading}>
        <LoadingSpinner text={t('common.loading')} />
      </Show>

      {/* Add Custom Context */}
      <Show when={store.session.mcpStatus.connected}>
        <AddCustomContext />
      </Show>

      {/* Project Status Card */}
      <ContentCard icon={<BarChart3 size={20} />} title={t('general.projectStatus.title')}>
        <div class="project-status">
          <p>{t('general.projectStatus.contexts')}: <strong>{computed.stats().totalContexts}</strong></p>
          <div class="status-actions">
            <Button variant="primary" onClick={handleRefreshContexts}>
              {t('common.refresh')}
            </Button>
          </div>
        </div>
      </ContentCard>


      <div class="stats-grid">
        <StatusCard 
          title={t('general.projectStatus.totalContexts')} 
          value={computed.stats().totalContexts}
          icon={<FileText size={20} />}
        />
        <StatusCard 
          title={t('general.projectStatus.databaseType')} 
          value={store.session.databaseConfig.type?.toUpperCase() || t('general.recentContexts.unknown')}
          icon={<Database size={20} />}
        />
        <StatusCard 
          title={t('general.projectStatus.connectionStatus')} 
          value={store.session.connectionStatus === 'connected' ? t('general.status.connected') : t('general.status.disconnected')}
          icon={store.session.connectionStatus === 'connected' ? <CheckCircle size={20} color="#4CAF50" /> : <XCircle size={20} color="#f44336" />}
        />
        <StatusCard 
          title={t('general.projectStatus.totalAgents')} 
          value={store.data.agents.length}
          icon={<Bot size={20} />}
        />
      </div>

      {/* Recent Contexts Card */}
      <ContentCard icon={<Clock size={20} />} title={t('general.recentContexts.title')}>
        <div class="recent-contexts">
          <Show when={store.data.contexts.length === 0} fallback={
            <div class="contexts-list">
              <For each={store.data.contexts.slice(0, 5)}>
                {(context) => (
                  <div class="context-item">
                    <strong>{context.type?.toUpperCase() || t('general.recentContexts.unknown')}</strong>
                    <div class="context-timestamp">{context.timestamp ? new Date(context.timestamp).toLocaleString() : 'No date'}</div>
                    <div class="context-preview">{context.content?.substring(0, 100) || t('general.recentContexts.noContent')}...</div>
                  </div>
                )}
              </For>
            </div>
          }>
            <p>{t('general.recentContexts.noContexts')}</p>
          </Show>
        </div>
      </ContentCard>

      <Show when={Object.keys(computed.stats().byType).length > 0}>
        <div class="context-breakdown">
          <h3>{t('general.breakdowns.contextsByType')}</h3>
          <div class="breakdown-list">
            <For each={Object.entries(computed.stats().byType)}>
              {([type, count]) => (
                <div class="breakdown-item">
                  <span class="type-name">{type}</span>
                  <span class="type-count">{count}</span>
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>

      <Show when={Object.keys(computed.stats().byProject).length > 0}>
        <div class="project-breakdown">
          <h3>{t('general.breakdowns.contextsByProject')}</h3>
          <div class="breakdown-list">
            <For each={Object.entries(computed.stats().byProject)}>
              {([project, count]) => (
                <div class="breakdown-item">
                  <span class="project-name">{project}</span>
                  <span class="project-count">{count}</span>
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>

      <Show when={store.ui.errorMessage}>
        <div class="error-message">
          <AlertTriangle size={16} style={{'margin-right': '4px'}} /> {store.ui.errorMessage}
        </div>
      </Show>
    </div>
  );
};

export default GeneralTab;
