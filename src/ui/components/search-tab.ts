import { IconProvider } from '../utils/icons';
import { i18n } from '../utils/i18n';

/**
 * Search Tab Component
 * Handles context search, filtering, and deletion with proper event delegation
 */
export class SearchTab {
    private translations = i18n.getTranslations();

    /**
     * Generate the HTML content for the search tab
     */
    getHTML(): string {
        return `
            <div id="search-tab" class="tab-content">
                ${this.getSearchCard()}
                ${this.getResultsCard()}
            </div>
        `;
    }

    /**
     * Search controls card
     */
    private getSearchCard(): string {
        return `
            <div class="card">
                <div class="card-header">
                    <span class="icon">${IconProvider.getIcon('search')}</span>
                    ${this.translations.search.title}
                </div>
                <div class="card-content">
                    <div class="search-container">
                        <div class="search-bar">
                            <input type="text" id="search-query" class="form-input search-input" 
                                   placeholder="${this.translations.search.placeholder}">
                        </div>
                        
                        <div class="search-filters">
                            <select id="type-filter" class="form-select">
                                <option value="all">${this.translations.search.allTypes}</option>
                                <option value="conversation">${this.translations.contextTypes.conversation}</option>
                                <option value="decision">${this.translations.contextTypes.decision}</option>
                                <option value="code">${this.translations.contextTypes.code}</option>
                                <option value="issue">${this.translations.contextTypes.issue}</option>
                            </select>
                            
                            <select id="date-filter" class="form-select">
                                <option value="all">${this.translations.search.allTime}</option>
                                <option value="today">${this.translations.search.today}</option>
                                <option value="week">${this.translations.search.thisWeek}</option>
                                <option value="month">${this.translations.search.thisMonth}</option>
                            </select>
                            
                            <button class="btn btn-secondary btn-small" onclick="clearSearch()">
                                <span class="icon">${IconProvider.getIcon('x')}</span>
                                ${this.translations.search.clearFilters}
                            </button>
                            
                            <button class="btn btn-danger btn-small" onclick="testDeleteFunction()">
                                <span class="icon">${IconProvider.getIcon('testTube')}</span>
                                ${this.translations.search.testDelete}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Search results card
     */
    private getResultsCard(): string {
        return `
            <div class="card">
                <div class="search-results-header">
                    <div class="card-header">
                        <span class="icon">${IconProvider.getIcon('file')}</span>
                        ${this.translations.search.results}
                    </div>
                    <div class="flex items-center gap-2">
                        <span id="search-count" class="search-count">0 ${this.translations.search.results}</span>
                        <div id="selection-controls" class="selection-controls hidden">
                            <button class="btn btn-secondary btn-small" onclick="selectAllContexts()">
                                <span class="icon">${IconProvider.getIcon('check')}</span>
                                ${this.translations.search.selectAll}
                            </button>
                            <button class="btn btn-secondary btn-small" onclick="clearSelection()">
                                <span class="icon">${IconProvider.getIcon('x')}</span>
                                ${this.translations.search.selectNone}
                            </button>
                            <button class="btn btn-danger btn-small" onclick="deleteSelectedContexts()">
                                <span class="icon">${IconProvider.getIcon('trash')}</span>
                                ${this.translations.search.delete} <span id="selected-count">0</span>
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="card-content">
                    <div id="search-results" class="search-results" data-empty-message="${this.translations.search.loadingContexts}">
                        <div class="text-center opacity-75 p-4">
                            ${this.translations.search.loadingContexts}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Get JavaScript functionality for the search tab
     */
    getScript(): string {
        return `
            // Search tab functionality
            let searchTabState = {
                query: '',
                filters: { type: 'all', dateRange: 'all' },
                results: [],
                selectedIds: new Set(),
                searchTimeout: null
            };

            // Search functionality
            function performSearch() {
                const query = document.getElementById('search-query').value;
                const typeFilter = document.getElementById('type-filter').value;
                const dateFilter = document.getElementById('date-filter').value;
                
                searchTabState.query = query;
                searchTabState.filters = {
                    type: typeFilter,
                    dateRange: dateFilter
                };
                
                console.log('🔍 Performing search:', { query, filters: searchTabState.filters });
                
                vscode.postMessage({
                    type: 'searchContexts',
                    query: query,
                    filters: searchTabState.filters
                });
            }

            function performSearchWithDelay() {
                // Clear previous timeout
                if (searchTabState.searchTimeout) {
                    clearTimeout(searchTabState.searchTimeout);
                }
                
                // Set new timeout for real-time search
                searchTabState.searchTimeout = setTimeout(() => {
                    performSearch();
                }, 300);
            }

            function loadAllContextsForSearch() {
                console.log('📋 Loading all contexts for search tab');
                vscode.postMessage({
                    type: 'searchContexts',
                    query: '',
                    filters: { type: 'all', dateRange: 'all' }
                });
            }

            function clearSearch() {
                console.log('🧹 Clearing search');
                document.getElementById('search-query').value = '';
                document.getElementById('type-filter').value = 'all';
                document.getElementById('date-filter').value = 'all';
                
                searchTabState.query = '';
                searchTabState.filters = { type: 'all', dateRange: 'all' };
                searchTabState.selectedIds.clear();
                
                loadAllContextsForSearch();
            }

            function displaySearchResults(results, query) {
                console.log('📊 Displaying', results.length, 'search results for query:', query);
                
                searchTabState.results = results;
                const resultsEl = document.getElementById('search-results');
                const countEl = document.getElementById('search-count');
                const selectionControls = document.getElementById('selection-controls');
                
                countEl.textContent = results.length + ' ' + 
                    (results.length === 1 ? t('search.results').slice(0, -1) : t('search.results'));
                
                if (results.length === 0) {
                    resultsEl.innerHTML = '<div class="text-center opacity-75 p-4">' + t('search.noResults') + '</div>';
                    selectionControls.classList.add('hidden');
                    return;
                }

                // Show selection controls when there are results
                selectionControls.classList.remove('hidden');
                
                resultsEl.innerHTML = results.map(ctx => 
                    '<div class="context-item" data-context-id="' + ctx.id + '">' +
                        '<div class="flex items-start gap-3">' +
                            '<input type="checkbox" class="context-checkbox form-checkbox" value="' + ctx.id + '" ' +
                                   'onchange="toggleContextSelection(\'' + ctx.id + '\')">' +
                            '<div class="flex-1 cursor-pointer" onclick="editContextById(\'' + ctx.id + '\')">' +
                                '<div class="context-header">' +
                                    '<div class="context-type">' +
                                        '<span class="icon">' + getContextTypeIcon(ctx.type) + '</span>' +
                                        t('contextTypes.' + ctx.type) +
                                    '</div>' +
                                    '<div class="context-timestamp">' + formatTimestamp(ctx.timestamp) + '</div>' +
                                '</div>' +
                                '<div class="context-content">' + highlightText(ctx.content.substring(0, 300), query) + '...</div>' +
                                '<div class="context-footer">' +
                                    '<div class="context-tags">' +
                                        '<span class="icon">' + '${IconProvider.getIcon('tag')}' + '</span>' +
                                        formatTags(ctx.tags) +
                                    '</div>' +
                                    '<div class="context-importance">' +
                                        '<span class="icon">' + '${IconProvider.getIcon('star')}' + '</span>' +
                                        ctx.importance + '/10' +
                                    '</div>' +
                                '</div>' +
                            '</div>' +
                            '<button class="btn btn-icon btn-danger delete-btn" data-context-id="' + ctx.id + '" ' +
                                    'title="' + t('actions.delete') + '">' +
                                '<span class="icon">' + '${IconProvider.getIcon('trash')}' + '</span>' +
                            '</button>' +
                        '</div>' +
                    '</div>'
                ).join('');
                
                updateSelectionCount();
            }

            // Selection functionality
            function toggleContextSelection(contextId) {
                if (searchTabState.selectedIds.has(contextId)) {
                    searchTabState.selectedIds.delete(contextId);
                } else {
                    searchTabState.selectedIds.add(contextId);
                }
                updateSelectionCount();
            }

            function selectAllContexts() {
                console.log('☑️ Selecting all contexts');
                const checkboxes = document.querySelectorAll('.context-checkbox');
                checkboxes.forEach(checkbox => {
                    checkbox.checked = true;
                    searchTabState.selectedIds.add(checkbox.value);
                });
                updateSelectionCount();
            }

            function clearSelection() {
                console.log('◻️ Clearing selection');
                const checkboxes = document.querySelectorAll('.context-checkbox');
                checkboxes.forEach(checkbox => {
                    checkbox.checked = false;
                });
                searchTabState.selectedIds.clear();
                updateSelectionCount();
            }

            function updateSelectionCount() {
                const selectedCount = searchTabState.selectedIds.size;
                document.getElementById('selected-count').textContent = selectedCount;
                
                const deleteBtn = document.querySelector('#selection-controls .btn-danger');
                if (deleteBtn) {
                    deleteBtn.style.display = selectedCount > 0 ? 'inline-flex' : 'none';
                }
            }

            // Delete functionality with proper validation
            function deleteContextById(contextId) {
                console.log('🗑️ deleteContextById V3.0 called with:', contextId);
                
                // Validate contextId
                if (!contextId || contextId === 'undefined' || contextId === 'null') {
                    console.error('❌ Invalid contextId:', contextId);
                    showError(t('messages.invalidContextId'));
                    return;
                }
                
                console.log('⚠️ Skipping confirmation dialog (webview sandboxed)');
                
                const message = {
                    type: 'deleteContext',
                    contextId: contextId,
                    refreshType: searchTabState.query ? 'search' : 'general',
                    lastQuery: searchTabState.query,
                    lastFilters: searchTabState.filters
                };
                
                console.log('📤 Sending delete message:', message);
                vscode.postMessage(message);
            }

            function deleteSelectedContexts() {
                if (searchTabState.selectedIds.size === 0) return;
                
                const count = searchTabState.selectedIds.size;
                console.log('🗑️ Deleting', count, 'selected contexts');
                
                vscode.postMessage({
                    type: 'deleteMultipleContexts',
                    contextIds: Array.from(searchTabState.selectedIds),
                    refreshType: searchTabState.query ? 'search' : 'general',
                    lastQuery: searchTabState.query,
                    lastFilters: searchTabState.filters
                });
                
                searchTabState.selectedIds.clear();
                updateSelectionCount();
            }

            // Test function for debugging
            function testDeleteFunction() {
                console.log('🧪 TESTING DELETE FUNCTION V3.0');
                const firstContext = document.querySelector('.context-item[data-context-id]');
                if (firstContext) {
                    const contextId = firstContext.getAttribute('data-context-id');
                    console.log('🧪 Found first context with ID:', contextId);
                    console.log('🧪 Calling deleteContextById...');
                    deleteContextById(contextId);
                } else {
                    console.log('🧪 No contexts found for testing');
                    showError(t('messages.noContextsForTest'));
                }
            }

            // Helper functions
            function getContextTypeIcon(type) {
                const icons = {
                    conversation: '${IconProvider.getIcon('messageSquare')}',
                    decision: '${IconProvider.getIcon('lightbulb')}',
                    code: '${IconProvider.getIcon('code')}',
                    issue: '${IconProvider.getIcon('alertCircle')}'
                };
                return icons[type] || '${IconProvider.getIcon('file')}';
            }

            function showError(message) {
                // Simple error display - could be enhanced with toast/modal
                console.error('❌ Error:', message);
                // For now, just log - in production we'd show a proper error UI
            }

            // Event delegation for delete buttons (THIS IS THE KEY FIX)
            function setupSearchEventDelegation() {
                console.log('🔧 Setting up search event delegation');
                
                const searchResults = document.getElementById('search-results');
                if (!searchResults) {
                    console.error('❌ Search results container not found');
                    return;
                }
                
                // Remove any existing listeners
                searchResults.removeEventListener('click', handleSearchResultsClick);
                
                // Add event delegation
                searchResults.addEventListener('click', handleSearchResultsClick);
                console.log('✅ Search event delegation set up successfully');
            }

            function handleSearchResultsClick(e) {
                console.log('🔍 Click detected on search results:', e.target, 'Classes:', e.target.className);
                
                // Check if it's a delete button
                if (e.target.closest('.delete-btn')) {
                    e.stopPropagation();
                    e.preventDefault();
                    
                    const deleteBtn = e.target.closest('.delete-btn');
                    const contextId = deleteBtn.getAttribute('data-context-id');
                    console.log('🗑️ Delete button clicked via event delegation for:', contextId);
                    deleteContextById(contextId);
                    return;
                }
                
                // Check if it's a context content area for editing
                if (e.target.closest('.context-content') || e.target.closest('[onclick*="editContextById"]')) {
                    // Let the onclick handler deal with this
                    return;
                }
            }

            // Initialize search tab
            function initSearchTab() {
                console.log('🔍 Initializing search tab');
                
                // Set up event listeners
                const searchQuery = document.getElementById('search-query');
                const typeFilter = document.getElementById('type-filter');
                const dateFilter = document.getElementById('date-filter');
                
                if (searchQuery) {
                    searchQuery.addEventListener('input', performSearchWithDelay);
                    searchQuery.addEventListener('keyup', function(e) {
                        if (e.key === 'Enter') {
                            performSearch();
                        }
                    });
                }
                
                if (typeFilter) {
                    typeFilter.addEventListener('change', performSearchWithDelay);
                }
                
                if (dateFilter) {
                    dateFilter.addEventListener('change', performSearchWithDelay);
                }
                
                // Set up event delegation for dynamic content
                setupSearchEventDelegation();
                
                // Load initial data
                loadAllContextsForSearch();
            }

            // Listen for tab changes
            window.addEventListener('tabChanged', function(e) {
                if (e.detail.tabName === 'search') {
                    initSearchTab();
                }
            });
        `;
    }
}