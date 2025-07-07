import { Component, createSignal, For, Show } from 'solid-js';
import { Search, Lightbulb, AlertTriangle } from 'lucide-solid';
import { store } from '../../core/store';
import { appController } from '../../core/app-controller';
import LoadingSpinner from '../../components/LoadingSpinner';
import Button from '../../components/Button';

const SearchTab: Component = () => {
  const [searchQuery, setSearchQuery] = createSignal('');
  const [searchType, setSearchType] = createSignal('all');
  const [hasSearched, setHasSearched] = createSignal(false);
  
  // Defensive check to prevent undefined errors
  if (!store.session || !store.data || !store.ui) {
    return <div>Loading...</div>;
  }

  const handleSearch = async () => {
    if (searchQuery().trim()) {
      try {
        setHasSearched(true);
        await appController.searchContexts(searchQuery());
      } catch (error) {
        console.error('Search failed:', error);
      }
    }
  };

  // Show all contexts initially, or search results after searching
  const displayedContexts = () => {
    if (hasSearched()) {
      return store.data.searchResults;
    }
    return store.data.contexts;
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div class="search-tab">
      <div class="tab-header">
        <h2><Search size={20} style={{display: 'inline', 'margin-right': '8px'}} /> Search Contexts</h2>
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
            disabled={!searchQuery().trim() || store.ui.isLoading}
          >
            <Show when={store.ui.isLoading} fallback={<><Search size={16} style={{'margin-right': '4px'}} /> Search</>}>
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
        <Show when={store.ui.isLoading}>
          <LoadingSpinner text="Searching..." />
        </Show>

        <Show when={displayedContexts().length === 0 && !store.ui.isLoading}>
          <div class="empty-state">
            <div class="empty-icon"><Search size={48} /></div>
            <h3>{hasSearched() ? "No results found" : "No contexts yet"}</h3>
            <p>{hasSearched() ? "Try adjusting your search query or filters" : "Create some contexts to see them here"}</p>
          </div>
        </Show>

        <Show when={displayedContexts().length > 0}>
          <div class="results-header">
            <h3>{hasSearched() ? `Search Results (${displayedContexts().length})` : `All Contexts (${displayedContexts().length})`}</h3>
            <Show when={hasSearched()}>
              <Button 
                variant="secondary" 
                size="small" 
                onClick={() => {
                  setHasSearched(false);
                  setSearchQuery('');
                }}
              >
                Show All
              </Button>
            </Show>
          </div>
          <div class="results-list">
            <For each={displayedContexts()}>
              {(context) => (
                <div class={`context-card ${context.tags?.includes('eureka-capture') ? 'eureka-context' : ''}`}>
                  <div class="context-header">
                    {context.tags?.includes('eureka-capture') && <span class="eureka-icon"><Lightbulb size={16} /></span>}
                    <span class="context-type">{context.type || 'unknown'}</span>
                    <span class="context-project">{context.projectPath || 'no-project'}</span>
                    <span class="context-timestamp">
                      {context.timestamp ? new Date(context.timestamp).toLocaleDateString() : 'No date'}
                    </span>
                  </div>
                  <div class="context-content">
                    <p>{context.content || 'No content available'}</p>
                  </div>
                  <div class="context-tags">
                    <For each={context.tags || []}>
                      {(tag) => (
                        <span class="tag">{tag}</span>
                      )}
                    </For>
                  </div>
                  <div class="context-actions">
                    <span class="importance">
                      Importance: {context.importance || 0}/10
                    </span>
                    <Button 
                      size="small" 
                      variant="danger"
                      onClick={() => appController.deleteContext(context.id)}
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

      <Show when={store.ui.errorMessage}>
        <div class="error-message">
          <AlertTriangle size={16} style={{'margin-right': '4px'}} /> {store.ui.errorMessage}
        </div>
      </Show>
    </div>
  );
};

export default SearchTab;
