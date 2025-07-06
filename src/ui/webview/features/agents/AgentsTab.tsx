import { Component, For, Show } from 'solid-js';
import { Bot, CheckCircle, XCircle, AlertTriangle } from 'lucide-solid';
import { store } from '../../core/store';
import { appController } from '../../core/app-controller';
import LoadingSpinner from '../../components/LoadingSpinner';
import Button from '../../components/Button';

const AgentsTab: Component = () => {
  // Defensive check to prevent undefined errors
  if (!store.session || !store.data || !store.ui) {
    return <div>Loading...</div>;
  }
  
  return (
    <div class="agents-tab">
      <div class="tab-header">
        <h2><Bot size={20} style={{display: 'inline', 'margin-right': '8px'}} /> Agents</h2>
        <p>Manage your AI agents and their specializations</p>
      </div>

      <Show when={store.ui.isLoading}>
        <LoadingSpinner text="Loading agents..." />
      </Show>

      <div class="agents-content">
        <div class="agents-actions">
          <Button variant="primary">
            + Add New Agent
          </Button>
        </div>

        <Show when={store.data.agents.length === 0} fallback={
          <div class="agents-grid">
            <For each={store.data.agents}>
              {(agent) => (
                <div class="agent-card">
                  <div class="agent-header">
                    <span class="agent-emoji"><Bot size={24} /></span>
                    <h3>{agent.name}</h3>
                    <span class={`agent-status ${agent.enabled ? 'enabled' : 'disabled'}`}>
                      {agent.enabled ? <CheckCircle size={16} color="#4CAF50" /> : <XCircle size={16} color="#f44336" />}
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
                    <Button 
                      size="small" 
                      variant="danger"
                      onClick={() => appController.deleteAgent(agent.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </For>
          </div>
        }>
          <div class="empty-state">
            <div class="empty-icon"><Bot size={48} /></div>
            <h3>No agents configured</h3>
            <p>Add your first agent to get started with specialized AI assistance</p>
          </div>
        </Show>
      </div>

      <Show when={store.ui.errorMessage}>
        <div class="error-message">
          <AlertTriangle size={16} style={{'margin-right': '4px'}} /> {store.ui.errorMessage}
        </div>
      </Show>
    </div>
  );
};

export default AgentsTab;
