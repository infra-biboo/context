import { Component, For, createMemo, Switch, Match, createEffect } from 'solid-js';
import { store, actions } from './core/store';
import { appController } from './core/app-controller';
import GeneralTab from './features/general/GeneralTab';
import AgentsTab from './features/agents/AgentsTab';
import SearchTab from './features/search/SearchTab';
import SettingsTab from './features/settings/SettingsTab';
import OnboardingWizard from './features/onboarding/OnboardingWizard';
import TokenUsageIndicator from './components/TokenUsageIndicator';
import { I18nProvider, useTranslation } from './i18n';
import { Layout, Users, Search, Edit, Settings, CheckCircle, XCircle } from 'lucide-solid';
import './style.css';

type TabName = 'general' | 'agents' | 'search' | 'settings';

const AppContent: Component = () => {
  const { t } = useTranslation();
  
  const allTabs = [
    { id: 'general', label: t('common.general'), icon: <Layout size={16} /> },
    { id: 'agents', label: t('common.agents'), icon: <Users size={16} /> },
    { id: 'search', label: t('common.search'), icon: <Search size={16} /> },
    { id: 'settings', label: t('common.settings'), icon: <Settings size={16} /> }
  ] as const;

  const visibleTabs = createMemo(() => {
    // Always show all tabs - the extension should work fully even if MCP has connection issues
    // Individual features will handle MCP connectivity gracefully
    return allTabs;
  });

  // This effect ensures that if the active tab is no longer visible,
  // we reset to a default valid tab.
  createEffect(() => {
    const tabs = visibleTabs();
    const currentTab = store.ui.activeTab;
    
    // Solo cambiar si el tab actual no está disponible Y es diferente de 'general'
    if (!tabs.some(tab => tab.id === currentTab) && currentTab !== 'general') {
      // Verificar que 'general' esté disponible antes de cambiarlo
      const generalTab = tabs.find(tab => tab.id === 'general');
      if (generalTab) {
        actions.setActiveTab('general');
      } else if (tabs.length > 0) {
        // Si general no está disponible, usar el primer tab disponible
        actions.setActiveTab(tabs[0].id as any);
      }
    }
  });

  // Auto-refresh effect when tab changes
  createEffect(() => {
    const currentTab = store.ui.activeTab;
    
    // Trigger refresh based on tab
    switch (currentTab) {
      case 'general':
        // General tab has autoRefresh enabled in ContextList
        break;
      case 'search':
        // Search tab has autoRefresh enabled in ContextList
        break;
      default:
        break;
    }
  });

  // El store puede inicializarse gradualmente, no bloqueamos la UI

  return (
    <Switch>
      <Match when={!store.session?.onboardingCompleted}>
        <OnboardingWizard />
      </Match>
      <Match when={store.session?.onboardingCompleted}>
        <div class="app">
          <nav class="tabs">
            <For each={visibleTabs()}>
              {(tab) => (
                <button
                  class={`tab ${store.ui.activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => actions.setActiveTab(tab.id as TabName)}
                >
                  <span class="tab-icon">{tab.icon}</span>
                  {tab.label}
                </button>
              )}
            </For>
          </nav>

          <main class="tab-content">
            <Switch>
              <Match when={store.ui.activeTab === 'general'}><GeneralTab /></Match>
              <Match when={store.ui.activeTab === 'agents'}><AgentsTab /></Match>
              <Match when={store.ui.activeTab === 'search'}><SearchTab /></Match>
              <Match when={store.ui.activeTab === 'settings'}><SettingsTab /></Match>
            </Switch>
          </main>

          <footer class="status-bar">
            <span class="status-indicator">
              {store.session?.mcpStatus?.connected ? <CheckCircle size={16} color="#4CAF50" /> : <XCircle size={16} color="#f44336" />}
              MCP: {store.session?.mcpStatus?.status || 'Loading...'}
            </span>
            <span class="db-mode">
              DB: {store.session?.databaseConfig?.type?.toUpperCase() || 'UNKNOWN'}
            </span>
            <TokenUsageIndicator />
          </footer>
        </div>
      </Match>
    </Switch>
  );
};

const App: Component = () => {
  return (
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  );
};

export default App;
