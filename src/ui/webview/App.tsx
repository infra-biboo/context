import { Component, createSignal, onMount, For, Show } from 'solid-js';
import { store } from './core/store';
import { VSCodeBridge } from './core/vscode-bridge';
import GeneralTab from './features/general/GeneralTab';
import AgentsTab from './features/agents/AgentsTab';
import SearchTab from './features/search/SearchTab';
import SettingsTab from './features/settings/SettingsTab';
import './style.css';

type TabName = 'general' | 'agents' | 'search' | 'settings';

const App: Component = () => {
  const [activeTab, setActiveTab] = createSignal<TabName>('general');
  const bridge = VSCodeBridge.getInstance();

  const handleTabClick = (tabId: TabName) => {
    console.log('Tab clicked:', tabId);
    setActiveTab(tabId);
  };

  onMount(() => {
    // Initialize the bridge and start listening for messages
    bridge.initialize();
    console.log('🚀 SolidJS App Started');
    console.log('Initial active tab:', activeTab());
    console.log('Available tabs:', tabs);
  });

  const tabs = [
    { id: 'general', label: 'General', icon: '📊' },
    { id: 'agents', label: 'Agents', icon: '🤖' },
    { id: 'search', label: 'Search', icon: '🔍' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ] as const;

  // No need for renderActiveTab function, will use Show components inline

  return (
    <div class="app">
      <nav class="tabs">
        <For each={tabs}>
          {(tab) => (
            <button 
              class={`tab ${activeTab() === tab.id ? 'active' : ''}`}
              onClick={() => handleTabClick(tab.id as TabName)}
            >
              <span class="tab-icon">{tab.icon}</span>
              {tab.label}
            </button>
          )}
        </For>
      </nav>
      
      <main class="tab-content">
        <Show when={activeTab() === 'general'}>
          <GeneralTab />
        </Show>
        <Show when={activeTab() === 'agents'}>
          <AgentsTab />
        </Show>
        <Show when={activeTab() === 'search'}>
          <SearchTab />
        </Show>
        <Show when={activeTab() === 'settings'}>
          <SettingsTab />
        </Show>
      </main>
      
      <footer class="status-bar">
        <span class="status-indicator">
          {store.connectionStatus() === 'connected' ? '🟢' : '🔴'} 
          {store.connectionStatus()}
        </span>
        <span class="db-mode">
          Mode: {store.databaseConfig().type?.toUpperCase() || 'UNKNOWN'}
        </span>
      </footer>
    </div>
  );
};

export default App;