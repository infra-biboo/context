import { IconProvider } from '../utils/icons';
import { i18n } from '../utils/i18n';

/**
 * Edit Modal Component
 * Handles context editing with validation and proper form handling
 */
export class EditModal {
    private translations = i18n.getTranslations();

    /**
     * Generate the HTML content for the edit modal
     */
    getHTML(): string {
        return `
            <div id="edit-modal" class="modal">
                <div class="modal-content">
                    ${this.getModalHeader()}
                    ${this.getModalBody()}
                    ${this.getModalFooter()}
                </div>
            </div>
        `;
    }

    /**
     * Modal header
     */
    private getModalHeader(): string {
        return `
            <div class="modal-header">
                <h3 class="modal-title">
                    <span class="icon">${IconProvider.getIcon('edit')}</span>
                    ${this.translations.edit.title}
                </h3>
                <button class="modal-close btn btn-icon" onclick="closeEditModal()">
                    <span class="icon">${IconProvider.getIcon('x')}</span>
                </button>
            </div>
        `;
    }

    /**
     * Modal body with form
     */
    private getModalBody(): string {
        return `
            <div class="modal-body">
                <form id="edit-form" onsubmit="saveContext(event)">
                    <div class="form-group">
                        <label class="form-label" for="edit-content">
                            ${this.translations.edit.content}:
                        </label>
                        <textarea id="edit-content" class="form-textarea" rows="5" required></textarea>
                        <div id="content-error" class="text-sm text-danger hidden"></div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label" for="edit-type">
                            ${this.translations.edit.type}:
                        </label>
                        <select id="edit-type" class="form-select" required>
                            <option value="conversation">${this.translations.contextTypes.conversation}</option>
                            <option value="decision">${this.translations.contextTypes.decision}</option>
                            <option value="code">${this.translations.contextTypes.code}</option>
                            <option value="issue">${this.translations.contextTypes.issue}</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label" for="edit-importance">
                            ${this.translations.edit.importance}:
                        </label>
                        <input type="range" id="edit-importance" class="form-range" 
                               min="1" max="10" value="5">
                        <div class="flex justify-between text-xs opacity-75">
                            <span>1 (${this.translations.edit.importanceLow})</span>
                            <span id="importance-value" class="font-semibold">5</span>
                            <span>10 (${this.translations.edit.importanceHigh})</span>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label" for="edit-tags">
                            ${this.translations.edit.tags}:
                        </label>
                        <input type="text" id="edit-tags" class="form-input" 
                               placeholder="${this.translations.edit.tagsPlaceholder}">
                        <div class="text-xs opacity-75 mt-1">
                            ${this.translations.edit.tagsPlaceholder}
                        </div>
                    </div>
                </form>
            </div>
        `;
    }

    /**
     * Modal footer with actions
     */
    private getModalFooter(): string {
        return `
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeEditModal()">
                    <span class="icon">${IconProvider.getIcon('x')}</span>
                    ${this.translations.edit.cancel}
                </button>
                <button type="button" class="btn" onclick="saveContext()">
                    <span class="icon">${IconProvider.getIcon('save')}</span>
                    ${this.translations.edit.save}
                </button>
                <button type="button" class="btn btn-danger" onclick="deleteContextFromModal()">
                    <span class="icon">${IconProvider.getIcon('trash')}</span>
                    ${this.translations.edit.delete}
                </button>
            </div>
        `;
    }

    /**
     * Get JavaScript functionality for the edit modal
     */
    getScript(): string {
        return `
            // Edit modal functionality
            let editModalState = {
                currentContextId: null,
                isOpen: false,
                originalData: null
            };

            // Modal management
            function showEditModal(context) {
                console.log('✏️ Showing edit modal for context:', context?.id);
                
                if (!context) {
                    console.error('❌ No context provided to edit modal');
                    return;
                }
                
                editModalState.currentContextId = context.id;
                editModalState.originalData = { ...context };
                editModalState.isOpen = true;
                
                // Populate form
                document.getElementById('edit-content').value = context.content || '';
                document.getElementById('edit-type').value = context.type || 'conversation';
                document.getElementById('edit-importance').value = context.importance || 5;
                document.getElementById('importance-value').textContent = context.importance || 5;
                document.getElementById('edit-tags').value = (context.tags || []).join(', ');
                
                // Show modal
                const modal = document.getElementById('edit-modal');
                modal.classList.add('show');
                
                // Focus on content field
                setTimeout(() => {
                    document.getElementById('edit-content').focus();
                }, 100);
                
                console.log('✅ Edit modal opened successfully');
            }

            function closeEditModal() {
                console.log('❌ Closing edit modal');
                
                const modal = document.getElementById('edit-modal');
                modal.classList.remove('show');
                
                editModalState.currentContextId = null;
                editModalState.originalData = null;
                editModalState.isOpen = false;
                
                // Clear form
                document.getElementById('edit-form').reset();
                clearValidationErrors();
                
                console.log('✅ Edit modal closed successfully');
            }

            function editContextById(contextId) {
                console.log('✏️ Requesting edit for context:', contextId);
                
                if (!contextId || contextId === 'undefined') {
                    console.error('❌ Invalid context ID for editing:', contextId);
                    return;
                }
                
                vscode.postMessage({
                    type: 'editContext',
                    contextId: contextId
                });
            }

            // Form validation
            function validateForm() {
                console.log('🔍 Validating edit form');
                clearValidationErrors();
                
                let isValid = true;
                const content = document.getElementById('edit-content').value.trim();
                
                if (!content) {
                    showFieldError('content-error', t('edit.contentRequired'));
                    isValid = false;
                }
                
                if (content.length > 5000) {
                    showFieldError('content-error', 'Content is too long (max 5000 characters)');
                    isValid = false;
                }
                
                console.log('🔍 Form validation result:', isValid);
                return isValid;
            }

            function showFieldError(fieldId, message) {
                const errorEl = document.getElementById(fieldId);
                if (errorEl) {
                    errorEl.textContent = message;
                    errorEl.classList.remove('hidden');
                }
            }

            function clearValidationErrors() {
                document.querySelectorAll('[id$="-error"]').forEach(el => {
                    el.classList.add('hidden');
                    el.textContent = '';
                });
            }

            // Save functionality
            function saveContext(event) {
                if (event) {
                    event.preventDefault();
                }
                
                console.log('💾 Saving context:', editModalState.currentContextId);
                
                if (!editModalState.currentContextId) {
                    console.error('❌ No context ID to save');
                    return;
                }
                
                if (!validateForm()) {
                    console.warn('⚠️ Form validation failed');
                    return;
                }
                
                const content = document.getElementById('edit-content').value.trim();
                const type = document.getElementById('edit-type').value;
                const importance = parseInt(document.getElementById('edit-importance').value);
                const tagsText = document.getElementById('edit-tags').value.trim();
                const tags = tagsText ? tagsText.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [];
                
                const updates = {
                    content,
                    type,
                    importance,
                    tags
                };
                
                console.log('💾 Sending update with data:', updates);
                
                vscode.postMessage({
                    type: 'updateContext',
                    contextId: editModalState.currentContextId,
                    updates: updates,
                    refreshType: (searchTabState && searchTabState.query) ? 'search' : 'general',
                    lastQuery: (searchTabState && searchTabState.query) || '',
                    lastFilters: (searchTabState && searchTabState.filters) || {}
                });
                
                closeEditModal();
            }

            // Delete from modal
            function deleteContextFromModal() {
                console.log('🗑️ Deleting context from modal:', editModalState.currentContextId);
                
                if (!editModalState.currentContextId) {
                    console.error('❌ No context ID to delete');
                    return;
                }
                
                // Skip confirmation for now due to webview sandbox
                console.log('⚠️ Skipping confirmation dialog (webview sandboxed)');
                
                vscode.postMessage({
                    type: 'deleteContext',
                    contextId: editModalState.currentContextId,
                    refreshType: (searchTabState && searchTabState.query) ? 'search' : 'general',
                    lastQuery: (searchTabState && searchTabState.query) || '',
                    lastFilters: (searchTabState && searchTabState.filters) || {}
                });
                
                closeEditModal();
            }

            // Initialize edit modal
            function initEditModal() {
                console.log('✏️ Initializing edit modal');
                
                // Set up importance slider
                const importanceSlider = document.getElementById('edit-importance');
                const importanceValue = document.getElementById('importance-value');
                
                if (importanceSlider && importanceValue) {
                    importanceSlider.addEventListener('input', function(e) {
                        importanceValue.textContent = e.target.value;
                    });
                }
                
                // Set up modal close on outside click
                const modal = document.getElementById('edit-modal');
                if (modal) {
                    modal.addEventListener('click', function(e) {
                        if (e.target === modal) {
                            closeEditModal();
                        }
                    });
                }
                
                // Set up keyboard shortcuts
                document.addEventListener('keydown', function(e) {
                    if (editModalState.isOpen) {
                        if (e.key === 'Escape') {
                            closeEditModal();
                        } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                            saveContext();
                        }
                    }
                });
                
                console.log('✅ Edit modal initialized successfully');
            }

            // Listen for DOM ready
            window.addEventListener('domReady', function() {
                initEditModal();
            });
        `;
    }
}