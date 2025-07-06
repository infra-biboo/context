import { Component, For, Show } from 'solid-js';
import { store } from '../../core/store';
import StatusCard from '../../components/StatusCard';
import LoadingSpinner from '../../components/LoadingSpinner';

const GeneralTab: Component = () => {
  return (
    <div class="general-tab">
      <div class="tab-header">
        <h2>📊 General Overview</h2>
        <p>Overview of your Claude Context Manager</p>
      </div>

      <Show when={store.isLoading()}>
        <LoadingSpinner text="Loading data..." />
      </Show>

      <div class="stats-grid">
        <StatusCard 
          title="Total Contexts" 
          value={store.stats().totalContexts}
          icon="📝"
        />
        <StatusCard 
          title="Database Type" 
          value={store.databaseConfig().type?.toUpperCase() || 'UNKNOWN'}
          icon="💾"
        />
        <StatusCard 
          title="Connection Status" 
          value={store.connectionStatus()}
          icon={store.connectionStatus() === 'connected' ? '🟢' : '🔴'}
        />
        <StatusCard 
          title="Total Agents" 
          value={store.agents().length}
          icon="🤖"
        />
      </div>

      <Show when={Object.keys(store.stats().byType).length > 0}>
        <div class="context-breakdown">
          <h3>Contexts by Type</h3>
          <div class="breakdown-list">
            <For each={Object.entries(store.stats().byType)}>
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

      <Show when={Object.keys(store.stats().byProject).length > 0}>
        <div class="project-breakdown">
          <h3>Contexts by Project</h3>
          <div class="breakdown-list">
            <For each={Object.entries(store.stats().byProject)}>
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

      <Show when={store.errorMessage()}>
        <div class="error-message">
          ❌ {store.errorMessage()}
        </div>
      </Show>
    </div>
  );
};

export default GeneralTab;