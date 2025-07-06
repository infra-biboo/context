import { VSCodeBridge } from '../../core/vscode-bridge';

export class SearchUI {
    private bridge: VSCodeBridge;

    constructor() {
        this.bridge = VSCodeBridge.getInstance();
    }

    public getHTML(): string {
        return `
            <div class="status-card">
                <h3>Search Contexts</h3>
                <input type="text" id="search-query" placeholder="Search..." style="width: 100%; margin-bottom: 10px;">
                <div class="filters">
                    <select id="type-filter">
                        <option value="all">All Types</option>
                        <option value="conversation">Conversation</option>
                        <option value="decision">Decision</option>
                        <option value="code">Code</option>
                        <option value="issue">Issue</option>
                    </select>
                    <select id="date-filter">
                        <option value="all">All Time</option>
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                    </select>
                    <button id="clear-search-btn" class="btn btn-secondary">Clear</button>
                </div>
            </div>
            <div class="status-card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <h3 style="margin: 0;">Results</h3>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <span id="search-count" style="font-size: 11px; color: var(--vscode-descriptionForeground);">0 results</span>
                        <div id="selection-controls" style="display: none; gap: 4px;">
                            <button id="select-all-btn" class="btn btn-secondary" style="font-size: 10px; padding: 2px 6px;">Select All</button>
                            <button id="clear-selection-btn" class="btn btn-secondary" style="font-size: 10px; padding: 2px 6px;">Clear</button>
                            <button id="delete-selected-btn" class="btn" style="font-size: 10px; padding: 2px 6px; background: var(--vscode-errorForeground);">Delete <span id="selected-count">0</span></button>
                        </div>
                    </div>
                </div>
                <div id="search-results"></div>
            </div>
            <!-- Edit Context Modal -->
            <div id="edit-modal" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
                                   background: rgba(0,0,0,0.5); z-index: 1000; padding: 20px;">
                <div style="background: var(--vscode-editor-background); border: 1px solid var(--vscode-panel-border);
                            border-radius: 6px; max-width: 500px; margin: 20px auto; padding: 20px; max-height: 80vh; overflow-y: auto;">
                    <h3 style="margin-top: 0;">Edit Context</h3>
                    
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px;">Content:</label>
                        <textarea id="edit-content" rows="5" style="width: 100%; padding: 8px; border: 1px solid var(--vscode-input-border);
                                                                    background: var(--vscode-input-background); color: var(--vscode-input-foreground);
                                                                    border-radius: 4px; font-size: 12px; resize: vertical;"></textarea>
                    </div>
                    
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px;">Type:</label>
                        <select id="edit-type" style="width: 100%; padding: 8px; border: 1px solid var(--vscode-input-border);
                                                     background: var(--vscode-input-background); color: var(--vscode-input-foreground);
                                                     border-radius: 4px; font-size: 12px;">
                            <option value="conversation">Conversation</option>
                            <option value="decision">Decision</option>
                            <option value="code">Code</option>
                            <option value="issue">Issue</option>
                        </select>
                    </div>
                    
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px;">Importance (1-10):</label>
                        <input type="range" id="edit-importance" min="1" max="10" value="5" 
                               style="width: 100%; margin-bottom: 4px;">
                        <div style="display: flex; justify-content: space-between; font-size: 10px; color: var(--vscode-descriptionForeground);">
                            <span>1 (Low)</span>
                            <span id="importance-value">5</span>
                            <span>10 (High)</span>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px;">Tags (comma separated):</label>
                        <input type="text" id="edit-tags" placeholder="tag1, tag2, tag3" 
                               style="width: 100%; padding: 8px; border: 1px solid var(--vscode-input-border);
                                      background: var(--vscode-input-background); color: var(--vscode-input-foreground);
                                      border-radius: 4px; font-size: 12px;">
                    </div>
                    
                    <div style="display: flex; gap: 8px; justify-content: flex-end;">
                        <button id="cancel-edit-btn" class="btn btn-secondary">Cancel</button>
                        <button id="save-context-btn" class="btn">Save Changes</button>
                        <button id="delete-context-btn" class="btn" style="background: var(--vscode-errorForeground);">Delete</button>
                    </div>
                </div>
            </div>
        `;
    }

    public setupEventListeners() {
        let searchTimeout: number;
        document.getElementById('search-query')?.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = window.setTimeout(() => this.performSearch(), 300);
        });
        document.getElementById('type-filter')?.addEventListener('change', () => this.performSearch());
        document.getElementById('date-filter')?.addEventListener('change', () => this.performSearch());
        document.getElementById('clear-search-btn')?.addEventListener('click', () => this.clearSearch());
        
        // Selection controls
        document.getElementById('select-all-btn')?.addEventListener('click', () => this.selectAll());
        document.getElementById('clear-selection-btn')?.addEventListener('click', () => this.clearSelection());
        document.getElementById('delete-selected-btn')?.addEventListener('click', () => this.deleteSelected());
        
        // Modal controls
        document.getElementById('cancel-edit-btn')?.addEventListener('click', () => this.closeModal());
        document.getElementById('save-context-btn')?.addEventListener('click', () => this.saveContext());
        document.getElementById('delete-context-btn')?.addEventListener('click', () => this.deleteFromModal());
        document.getElementById('edit-importance')?.addEventListener('input', (e) => {
            const target = e.target as HTMLInputElement;
            const valueEl = document.getElementById('importance-value');
            if (valueEl) valueEl.textContent = target.value;
        });

        document.getElementById('search-results')?.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains('delete-btn')) {
                const contextId = target.dataset.contextId;
                if (contextId) {
                    this.bridge.deleteContext(contextId);
                }
            }
        });
    }

    private performSearch() {
        const query = (document.getElementById('search-query') as HTMLInputElement).value;
        const type = (document.getElementById('type-filter') as HTMLSelectElement).value;
        this.bridge.searchContexts(query, { type });
    }

    private clearSearch() {
        (document.getElementById('search-query') as HTMLInputElement).value = '';
        (document.getElementById('type-filter') as HTMLSelectElement).value = 'all';
        this.performSearch();
    }

    public displayResults(results: any[], query: string) {
        const resultsEl = document.getElementById('search-results');
        if (resultsEl) {
            if (results.length === 0) {
                resultsEl.innerHTML = '<p>No results found.</p>';
                return;
            }
            resultsEl.innerHTML = results.map(ctx => `
                <div class="context-item">
                    <strong>${ctx.type.toUpperCase()}</strong>
                    <div>${this.highlight(ctx.content, query)}</div>
                    <button class="delete-btn" data-context-id="${ctx.id}">Delete</button>
                </div>
            `).join('');
        }
    }

    private highlight(text: string, query: string): string {
        if (!query) return text;
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    private selectedContextIds = new Set<string>();
    private currentEditingContextId: string | null = null;

    private selectAll() {
        const checkboxes = document.querySelectorAll('.context-checkbox') as NodeListOf<HTMLInputElement>;
        checkboxes.forEach(checkbox => {
            checkbox.checked = true;
            this.selectedContextIds.add(checkbox.value);
        });
        this.updateSelectionCount();
    }

    private clearSelection() {
        const checkboxes = document.querySelectorAll('.context-checkbox') as NodeListOf<HTMLInputElement>;
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        this.selectedContextIds.clear();
        this.updateSelectionCount();
    }

    private deleteSelected() {
        if (this.selectedContextIds.size === 0) return;
        this.bridge.deleteMultipleContexts(Array.from(this.selectedContextIds));
        this.selectedContextIds.clear();
        this.updateSelectionCount();
    }

    private updateSelectionCount() {
        const countEl = document.getElementById('selected-count');
        if (countEl) countEl.textContent = this.selectedContextIds.size.toString();
        
        const deleteBtn = document.getElementById('delete-selected-btn');
        if (deleteBtn) {
            deleteBtn.style.display = this.selectedContextIds.size > 0 ? 'inline-block' : 'none';
        }
    }

    private closeModal() {
        const modal = document.getElementById('edit-modal');
        if (modal) modal.style.display = 'none';
        this.currentEditingContextId = null;
    }

    private saveContext() {
        if (!this.currentEditingContextId) return;
        
        const content = (document.getElementById('edit-content') as HTMLTextAreaElement).value;
        const type = (document.getElementById('edit-type') as HTMLSelectElement).value;
        const importance = parseInt((document.getElementById('edit-importance') as HTMLInputElement).value);
        const tagsText = (document.getElementById('edit-tags') as HTMLInputElement).value;
        const tags = tagsText.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        
        this.bridge.updateContext(this.currentEditingContextId, { content, type, importance, tags });
        
        this.closeModal();
    }

    private deleteFromModal() {
        if (!this.currentEditingContextId) return;
        this.bridge.deleteContext(this.currentEditingContextId);
        this.closeModal();
    }

    public showEditModal(context: any) {
        this.currentEditingContextId = context.id;
        
        (document.getElementById('edit-content') as HTMLTextAreaElement).value = context.content;
        (document.getElementById('edit-type') as HTMLSelectElement).value = context.type;
        (document.getElementById('edit-importance') as HTMLInputElement).value = context.importance;
        (document.getElementById('edit-tags') as HTMLInputElement).value = context.tags.join(', ');
        (document.getElementById('importance-value') as HTMLElement).textContent = context.importance.toString();
        
        const modal = document.getElementById('edit-modal');
        if (modal) modal.style.display = 'block';
    }
}
