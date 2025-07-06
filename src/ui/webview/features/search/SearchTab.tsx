import { Component, createSignal, For, Show } from 'solid-js';
import { store } from '../../core/store';
import { VSCodeBridge } from '../../core/vscode-bridge';
import LoadingSpinner from '../../components/LoadingSpinner';
import Button from '../../components/Button';

const SearchTab: Component = () => {
  const [searchQuery, setSearchQuery] = createSignal('');
  const [searchType, setSearchType] = createSignal('all');
  const bridge = VSCodeBridge.getInstance();

  const handleSearch = () => {
    if (searchQuery().trim()) {
      bridge.searchContexts(searchQuery(), {
        type: searchType() === 'all' ? undefined : searchType()
      });
    }
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleDeleteContext = (id: string) => {
    bridge.deleteContext(id);
  };

  return (
    <div class="search-tab">
      <div class="tab-header">
        <h2>🔍 Search Contexts</h2>
        <p>Find and manage your stored contexts</p>
      </div>

      <div class="search-controls">
        <div class="search-input-group">
          <input 
            type="text"
            placeholder="Search contexts..."
            value={searchQuery()}
            onInput={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            class="search-input"
          />
          <Button 
            onClick={handleSearch}
            disabled={!searchQuery().trim() || store.isLoading()}
          >
            <Show when={store.isLoading()} fallback="🔍 Search">
              <LoadingSpinner size="small" />
            </Show>
          </Button>
        </div>

        <div class="search-filters">
          <select 
            value={searchType()}
            onChange={(e) => setSearchType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="conversation">Conversations</option>
            <option value="decision">Decisions</option>
            <option value="code">Code</option>
            <option value="issue">Issues</option>
          </select>
        </div>
      </div>

      <div class="search-results">
        <Show when={store.isLoading()}>
          <LoadingSpinner text="Searching..." />
        </Show>

        <Show when={store.searchResults().length === 0 && !store.isLoading()}>
          <div class="empty-state">
            <div class="empty-icon">🔍</div>
            <h3>No results found</h3>
            <p>Try adjusting your search query or filters</p>
          </div>
        </Show>

        <Show when={store.searchResults().length > 0}>
          <div class="results-header">
            <h3>Results ({store.searchResults().length})</h3>
          </div>
          <div class="results-list">
            <For each={store.searchResults()}>
              {(context) => (
                <div class="context-card">
                  <div class="context-header">
                    <span class="context-type">{context.type}</span>
                    <span class="context-project">{context.projectPath}</span>
                    <span class="context-timestamp">
                      {new Date(context.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <div class="context-content">
                    <p>{context.content.substring(0, 200)}...</p>
                  </div>
                  <div class="context-tags">
                    <For each={context.tags}>
                      {(tag) => (
                        <span class="tag">{tag}</span>
                      )}
                    </For>
                  </div>
                  <div class="context-actions">
                    <span class="importance">
                      Importance: {context.importance}/10
                    </span>
                    <Button 
                      size="small" 
                      variant="danger"
                      onClick={() => handleDeleteContext(context.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </For>
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

export default SearchTab;