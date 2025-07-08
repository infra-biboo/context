import { Component, createSignal, Show } from 'solid-js';
import { Search, AlertTriangle } from 'lucide-solid';
import { store, actions } from '../../core/store';
import { appController } from '../../core/app-controller';
import LoadingSpinner from '../../components/LoadingSpinner';
import Button from '../../components/Button';
import ContextList from '../../components/ContextList';

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
        actions.resetSearchResults();
        // The ContextList component will handle the actual search with pagination
      } catch (error) {
        console.error('Search failed:', error);
      }
    }
  };

  const handleShowAll = () => {
    setHasSearched(false);
    setSearchQuery('');
    actions.resetSearchResults();
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

        <Show when={hasSearched()}>
          <div class="results-header">
            <h3>Search Results ({store.data.searchResults.length})</h3>
            <Button 
              variant="secondary" 
              size="small" 
              onClick={handleShowAll}
            >
              Show All
            </Button>
          </div>
          <ContextList 
            mode="search" 
            searchQuery={searchQuery()}
            autoRefresh={true}
          />
        </Show>

        <Show when={!hasSearched()}>
          <div class="results-header">
            <h3>All Contexts ({store.data.contexts.length})</h3>
          </div>
          <ContextList 
            mode="recent" 
            autoRefresh={true}
          />
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
