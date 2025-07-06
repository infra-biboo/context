import { Component, For, Show } from 'solid-js';
import { store } from '../../core/store';
import LoadingSpinner from '../../components/LoadingSpinner';
import Button from '../../components/Button';

const AgentsTab: Component = () => {
  return (
    <div class="agents-tab">
      <div class="tab-header">
        <h2>🤖 Agents</h2>
        <p>Manage your AI agents and their specializations</p>
      </div>

      <Show when={store.isLoading()}>
        <LoadingSpinner text="Loading agents..." />
      </Show>

      <div class="agents-content">
        <div class="agents-actions">
          <Button variant="primary">
            + Add New Agent
          </Button>
        </div>

        <Show when={store.agents().length === 0} fallback={
          <div class="agents-grid">
            <For each={store.agents()}>
              {(agent) => (
                <div class="agent-card">
                  <div class="agent-header">
                    <span class="agent-emoji">{agent.emoji || '🤖'}</span>
                    <h3>{agent.name}</h3>
                    <span class={`agent-status ${agent.enabled ? 'enabled' : 'disabled'}`}>
                      {agent.enabled ? '🟢' : '🔴'}
                    </span>
                  </div>
                  <p class="agent-description">{agent.description}</p>
                  <div class="agent-specializations">
                    <For each={agent.specializations}>
                      {(spec) => (
                        <span class="specialization-tag">{spec}</span>
                      )}
                    </For>
                  </div>
                  <div class="agent-actions">
                    <Button size="small" variant="secondary">
                      Edit
                    </Button>
                    <Button size="small" variant="danger">
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </For>
          </div>
        }>
          <div class="empty-state">
            <div class="empty-icon">🤖</div>
            <h3>No agents configured</h3>
            <p>Add your first agent to get started with specialized AI assistance</p>
          </div>
        </Show>
      </div>

      <Show when={store.errorMessage()}>
        <div class="error-message">
          ❌ {store.errorMessage()}
        </div>
      </Show>
    </div>
  );
};

export default AgentsTab;