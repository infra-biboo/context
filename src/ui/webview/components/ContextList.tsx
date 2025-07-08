import { Component, For, Show, createSignal, onMount, onCleanup } from 'solid-js';
import { Lightbulb } from 'lucide-solid';
import type { ContextEntry } from '../../../core/database/types';
import { store, actions } from '../core/store';
import { appController } from '../core/app-controller';
import LoadingSpinner from './LoadingSpinner';
import Button from './Button';

interface ContextListProps {
  mode: 'recent' | 'search';
  maxItems?: number;
  searchQuery?: string;
  autoRefresh?: boolean;
  onContextDelete?: (id: string) => void;
}

const ContextList: Component<ContextListProps> = (props) => {
  const [isInitialLoading, setIsInitialLoading] = createSignal(false);
  let scrollContainer: HTMLDivElement | undefined;

  const getContexts = () => {
    if (props.mode === 'recent') {
      const contexts = store.data.contexts;
      return props.maxItems ? contexts.slice(0, props.maxItems) : contexts;
    }
    return store.data.searchResults;
  };

  const handleDeleteContext = async (contextId: string) => {
    try {
      await appController.deleteContext(contextId);
      props.onContextDelete?.(contextId);
    } catch (error) {
      console.error('Failed to delete context:', error);
    }
  };

  const loadMoreContexts = async () => {
    if (props.mode !== 'search' || store.ui.searchPagination.isLoadingMore || !store.ui.searchPagination.hasMore) {
      return;
    }

    try {
      actions.setLoadingMore(true);
      actions.incrementSearchPage();
      
      const offset = store.ui.searchPagination.currentPage * store.ui.searchPagination.pageSize;
      const limit = store.ui.searchPagination.pageSize;
      
      const newResults = await appController.searchContextsPaginated(
        props.searchQuery || '',
        { limit, offset }
      );

      if (newResults.length < limit) {
        actions.setHasMore(false);
      }

      actions.appendSearchResults(newResults);
      actions.updateTotalLoaded(store.data.searchResults.length + newResults.length);
    } catch (error) {
      console.error('Failed to load more contexts:', error);
    } finally {
      actions.setLoadingMore(false);
    }
  };

  const handleScroll = () => {
    if (!scrollContainer || props.mode !== 'search') return;

    const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 200;

    if (isNearBottom && store.ui.searchPagination.hasMore && !store.ui.searchPagination.isLoadingMore) {
      loadMoreContexts();
    }
  };

  const loadInitialData = async () => {
    if (props.mode === 'recent') {
      setIsInitialLoading(true);
      try {
        await appController.loadContexts();
      } catch (error) {
        console.error('Failed to load contexts:', error);
      } finally {
        setIsInitialLoading(false);
      }
    } else if (props.mode === 'search' && props.searchQuery) {
      await performInitialSearch();
    }
  };

  const performInitialSearch = async () => {
    if (!props.searchQuery?.trim()) return;

    setIsInitialLoading(true);
    try {
      actions.resetSearchResults();
      
      const results = await appController.searchContextsPaginated(
        props.searchQuery,
        { limit: store.ui.searchPagination.pageSize, offset: 0 }
      );

      actions.setSearchResults(results);
      actions.updateTotalLoaded(results.length);
      
      if (results.length < store.ui.searchPagination.pageSize) {
        actions.setHasMore(false);
      }
    } catch (error) {
      console.error('Failed to perform search:', error);
    } finally {
      setIsInitialLoading(false);
    }
  };

  onMount(() => {
    if (props.autoRefresh) {
      // Delay de 400ms para evitar congelamiento al cambiar de tab
      setTimeout(() => {
        loadInitialData();
      }, 400);
    }

    if (scrollContainer && props.mode === 'search') {
      scrollContainer.addEventListener('scroll', handleScroll);
    }
  });

  onCleanup(() => {
    if (scrollContainer) {
      scrollContainer.removeEventListener('scroll', handleScroll);
    }
  });

  return (
    <div class="context-list" ref={scrollContainer}>
      <Show when={isInitialLoading()}>
        <LoadingSpinner text="Loading contexts..." />
      </Show>

      <Show when={getContexts().length === 0 && !isInitialLoading()}>
        <div class="empty-state">
          <h3>{props.mode === 'recent' ? 'No contexts yet' : 'No results found'}</h3>
          <p>
            {props.mode === 'recent' 
              ? 'Create some contexts to see them here' 
              : 'Try adjusting your search query'
            }
          </p>
        </div>
      </Show>

      <Show when={getContexts().length > 0}>
        <div class="results-list">
          <For each={getContexts()}>
            {(context) => (
              <div class={`context-card ${context.tags?.includes('eureka-capture') ? 'eureka-context' : ''}`}>
                <div class="context-header">
                  {context.tags?.includes('eureka-capture') && (
                    <span class="eureka-icon"><Lightbulb size={16} /></span>
                  )}
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
                    {(tag) => <span class="tag">{tag}</span>}
                  </For>
                </div>
                <div class="context-actions">
                  <span class="importance">
                    Importance: {context.importance || 0}/10
                  </span>
                  <Show when={props.mode === 'search'}>
                    <Button 
                      size="small" 
                      variant="danger"
                      onClick={() => handleDeleteContext(context.id)}
                    >
                      Delete
                    </Button>
                  </Show>
                </div>
              </div>
            )}
          </For>
        </div>

        <Show when={props.mode === 'search' && store.ui.searchPagination.isLoadingMore}>
          <div class="loading-more">
            <LoadingSpinner size="small" text="Loading more..." />
          </div>
        </Show>

        <Show when={props.mode === 'search' && !store.ui.searchPagination.hasMore && store.data.searchResults.length > 0}>
          <div class="no-more-results">
            <p>No more results to load</p>
          </div>
        </Show>
      </Show>
    </div>
  );
};

export default ContextList;