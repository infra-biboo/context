import { IconProvider } from '../utils/icons';
import { i18n } from '../utils/i18n';
import * as fs from 'fs';

/**
 * Base HTML template with external CSS and i18n support
 */
export class BaseTemplate {
    /**
     * Get the complete HTML structure with external CSS
     */
    static getHTML(content: string, cssPath?: string): string {
        const currentLang = i18n.getCurrentLanguage();
        const cssContent = cssPath ? BaseTemplate.loadCSS(cssPath) : BaseTemplate.getInlineCSS();
        
        return `<!DOCTYPE html>
        <html lang="${currentLang}">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Claude Context Manager</title>
            <style>
                ${cssContent}
            </style>
        </head>
        <body>
            ${content}
            <script>
                ${BaseTemplate.getBaseScript()}
            </script>
        </body>
        </html>`;
    }

    /**
     * Load CSS from external file
     */
    static loadCSS(cssPath: string): string {
        try {
            return fs.readFileSync(cssPath, 'utf-8');
        } catch (error) {
            console.warn('Failed to load CSS file:', cssPath, 'Using inline CSS');
            return BaseTemplate.getInlineCSS();
        }
    }

    /**
     * Get inline CSS as fallback
     */
    static getInlineCSS(): string {
        // Simplified inline CSS for fallback
        return `
            body {
                font-family: var(--vscode-font-family);
                color: var(--vscode-foreground);
                background: var(--vscode-editor-background);
                margin: 0;
                padding: 0;
                height: 100vh;
                overflow: hidden;
            }
            .icon { display: inline-flex; align-items: center; width: 16px; height: 16px; }
            .icon svg { width: 100%; height: 100%; }
            .tabs { display: flex; border-bottom: 1px solid var(--vscode-panel-border); }
            .tab-button { display: flex; align-items: center; gap: 8px; padding: 12px 16px; border: none; background: transparent; color: var(--vscode-tab-inactiveForeground); cursor: pointer; }
            .tab-button.active { color: var(--vscode-tab-activeForeground); border-bottom: 2px solid var(--vscode-tab-activeBorder); }
            .tab-content { padding: 16px; display: none; height: calc(100vh - 48px); overflow-y: auto; }
            .tab-content.active { display: block; }
            .card { background: var(--vscode-editorWidget-background); border: 1px solid var(--vscode-panel-border); border-radius: 6px; padding: 16px; margin-bottom: 16px; }
            .btn { display: inline-flex; align-items: center; gap: 6px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; margin: 4px 4px 4px 0; font-size: 12px; }
            .btn:hover { background: var(--vscode-button-hoverBackground); }
        `;
    }

    /**
     * Get CSS styles
     */
    static getStyles(): string {
        return `
            /* Reset and Base */
            * {
                box-sizing: border-box;
            }
            
            body {
                font-family: var(--vscode-font-family);
                color: var(--vscode-foreground);
                background: var(--vscode-editor-background);
                margin: 0;
                padding: 0;
                height: 100vh;
                overflow: hidden;
            }
            
            /* Icons */
            .icon {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 16px;
                height: 16px;
                color: currentColor;
            }
            
            .icon svg {
                width: 100%;
                height: 100%;
            }
            
            /* Tab System */
            .tabs {
                display: flex;
                border-bottom: 1px solid var(--vscode-panel-border);
                background: var(--vscode-editorGroupHeader-tabsBackground);
                flex-shrink: 0;
            }
            
            .tab-button {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 12px 16px;
                border: none;
                background: transparent;
                color: var(--vscode-tab-inactiveForeground);
                cursor: pointer;
                border-bottom: 2px solid transparent;
                transition: all 0.2s ease;
                font-size: 13px;
            }
            
            .tab-button:hover {
                background: var(--vscode-tab-hoverBackground);
            }
            
            .tab-button.active {
                color: var(--vscode-tab-activeForeground);
                border-bottom-color: var(--vscode-tab-activeBorder);
                background: var(--vscode-tab-activeBackground);
            }
            
            /* Tab Content */
            .tab-content {
                padding: 16px;
                display: none;
                height: calc(100vh - 48px);
                overflow-y: auto;
            }
            
            .tab-content.active {
                display: block;
            }
            
            /* Cards */
            .card {
                background: var(--vscode-editorWidget-background);
                border: 1px solid var(--vscode-panel-border);
                border-radius: 6px;
                padding: 16px;
                margin-bottom: 16px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            
            .card-header {
                display: flex;
                align-items: center;
                gap: 8px;
                margin: 0 0 12px 0;
                font-size: 14px;
                font-weight: 600;
            }
            
            .card-content {
                font-size: 12px;
                line-height: 1.4;
            }
            
            /* Buttons */
            .btn {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                background: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                padding: 8px 12px;
                border-radius: 4px;
                cursor: pointer;
                margin: 4px 4px 4px 0;
                font-size: 12px;
                transition: background-color 0.2s;
                text-decoration: none;
            }
            
            .btn:hover {
                background: var(--vscode-button-hoverBackground);
            }
            
            .btn-secondary {
                background: var(--vscode-button-secondaryBackground);
                color: var(--vscode-button-secondaryForeground);
            }
            
            .btn-secondary:hover {
                background: var(--vscode-button-secondaryHoverBackground);
            }
            
            .btn-danger {
                background: var(--vscode-errorForeground);
                color: var(--vscode-editor-background);
            }
            
            .btn-danger:hover {
                opacity: 0.9;
            }
            
            .btn-small {
                padding: 4px 8px;
                font-size: 11px;
            }
            
            .btn-icon {
                padding: 6px;
                border-radius: 3px;
            }
            
            /* Form Elements */
            .form-group {
                margin-bottom: 16px;
            }
            
            .form-label {
                display: block;
                font-size: 12px;
                font-weight: 600;
                margin-bottom: 4px;
                color: var(--vscode-foreground);
            }
            
            .form-input,
            .form-select,
            .form-textarea {
                width: 100%;
                padding: 8px;
                border: 1px solid var(--vscode-input-border);
                background: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
                border-radius: 4px;
                font-size: 12px;
                font-family: inherit;
            }
            
            .form-textarea {
                resize: vertical;
                min-height: 80px;
            }
            
            .form-input:focus,
            .form-select:focus,
            .form-textarea:focus {
                outline: none;
                border-color: var(--vscode-focusBorder);
            }
            
            .form-checkbox {
                margin-right: 8px;
                cursor: pointer;
            }
            
            .form-range {
                width: 100%;
                margin: 8px 0;
            }
            
            /* Lists */
            .list {
                border: 1px solid var(--vscode-panel-border);
                border-radius: 4px;
                overflow: hidden;
            }
            
            .list-item {
                padding: 12px;
                border-bottom: 1px solid var(--vscode-panel-border);
                transition: background-color 0.2s;
            }
            
            .list-item:last-child {
                border-bottom: none;
            }
            
            .list-item:hover {
                background: var(--vscode-list-hoverBackground);
            }
            
            .list-item.active {
                background: var(--vscode-list-activeSelectionBackground);
                color: var(--vscode-list-activeSelectionForeground);
            }
            
            /* Context Items */
            .context-item {
                background: var(--vscode-editorWidget-background);
                border: 1px solid var(--vscode-panel-border);
                border-radius: 4px;
                padding: 12px;
                margin-bottom: 8px;
                transition: all 0.2s ease;
                position: relative;
            }
            
            .context-item:hover {
                border-color: var(--vscode-focusBorder);
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            
            .context-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 8px;
            }
            
            .context-type {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                font-size: 10px;
                font-weight: 600;
                background: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                padding: 2px 6px;
                border-radius: 3px;
            }
            
            .context-timestamp {
                font-size: 10px;
                color: var(--vscode-descriptionForeground);
            }
            
            .context-content {
                font-size: 12px;
                line-height: 1.4;
                margin-bottom: 8px;
                cursor: pointer;
            }
            
            .context-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 10px;
                color: var(--vscode-descriptionForeground);
            }
            
            .context-tags {
                display: flex;
                align-items: center;
                gap: 4px;
            }
            
            .context-actions {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            /* Agent Items */
            .agent-item {
                display: flex;
                align-items: center;
                padding: 12px;
                border: 1px solid var(--vscode-panel-border);
                border-radius: 6px;
                margin-bottom: 8px;
                transition: all 0.2s ease;
                cursor: pointer;
            }
            
            .agent-item:hover {
                background: var(--vscode-list-hoverBackground);
            }
            
            .agent-item.enabled {
                background: var(--vscode-button-secondaryBackground);
                border-color: var(--vscode-focusBorder);
            }
            
            .agent-icon {
                width: 24px;
                height: 24px;
                margin-right: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: var(--vscode-symbolIcon-colorForeground);
            }
            
            .agent-info {
                flex: 1;
            }
            
            .agent-name {
                font-weight: 600;
                font-size: 13px;
                margin-bottom: 2px;
            }
            
            .agent-description {
                font-size: 11px;
                color: var(--vscode-descriptionForeground);
                margin-bottom: 4px;
            }
            
            .agent-specializations {
                font-size: 10px;
                color: var(--vscode-descriptionForeground);
                opacity: 0.8;
            }
            
            .agent-toggle {
                margin-left: auto;
            }
            
            /* Status Elements */
            .status-summary {
                background: var(--vscode-editorWidget-background);
                border: 1px solid var(--vscode-panel-border);
                border-radius: 4px;
                padding: 12px;
                margin-top: 16px;
                font-size: 12px;
            }
            
            .status-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 4px;
            }
            
            .status-row:last-child {
                margin-bottom: 0;
            }
            
            .status-indicator {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                font-size: 11px;
            }
            
            .status-connected {
                color: var(--vscode-charts-green);
            }
            
            .status-disconnected {
                color: var(--vscode-charts-red);
            }
            
            .status-warning {
                color: var(--vscode-charts-yellow);
            }
            
            /* Modal */
            .modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.5);
                z-index: 1000;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }
            
            .modal-content {
                background: var(--vscode-editor-background);
                border: 1px solid var(--vscode-panel-border);
                border-radius: 6px;
                max-width: 500px;
                width: 100%;
                max-height: 80vh;
                overflow-y: auto;
                padding: 20px;
            }
            
            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 16px;
                padding-bottom: 12px;
                border-bottom: 1px solid var(--vscode-panel-border);
            }
            
            .modal-title {
                font-size: 16px;
                font-weight: 600;
                margin: 0;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .modal-footer {
                display: flex;
                gap: 8px;
                justify-content: flex-end;
                margin-top: 20px;
                padding-top: 12px;
                border-top: 1px solid var(--vscode-panel-border);
            }
            
            /* Search Elements */
            .search-bar {
                display: flex;
                gap: 8px;
                margin-bottom: 16px;
                flex-wrap: wrap;
            }
            
            .search-input {
                flex: 1;
                min-width: 200px;
            }
            
            .search-filters {
                display: flex;
                gap: 8px;
                align-items: center;
            }
            
            .search-results-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
            }
            
            .search-count {
                font-size: 11px;
                color: var(--vscode-descriptionForeground);
            }
            
            .selection-controls {
                display: flex;
                gap: 4px;
                align-items: center;
            }
            
            /* Scrollbars */
            ::-webkit-scrollbar {
                width: 8px;
            }
            
            ::-webkit-scrollbar-track {
                background: var(--vscode-scrollbarSlider-background);
            }
            
            ::-webkit-scrollbar-thumb {
                background: var(--vscode-scrollbarSlider-hoverBackground);
                border-radius: 4px;
            }
            
            ::-webkit-scrollbar-thumb:hover {
                background: var(--vscode-scrollbarSlider-activeBackground);
            }
            
            /* Utilities */
            .hidden { display: none !important; }
            .flex { display: flex; }
            .flex-1 { flex: 1; }
            .gap-2 { gap: 8px; }
            .gap-1 { gap: 4px; }
            .mb-2 { margin-bottom: 8px; }
            .mb-4 { margin-bottom: 16px; }
            .text-center { text-align: center; }
            .text-sm { font-size: 11px; }
            .text-xs { font-size: 10px; }
            .font-semibold { font-weight: 600; }
            .opacity-75 { opacity: 0.75; }
            
            /* Highlight */
            mark {
                background: var(--vscode-editor-findMatchHighlightBackground);
                color: inherit;
                padding: 0;
            }
        `;
    }

    /**
     * Get base JavaScript functionality with i18n support
     */
    static getBaseScript(): string {
        const translations = JSON.stringify(i18n.getTranslations());
        const currentLang = i18n.getCurrentLanguage();
        
        return `
            // Global variables
            const vscode = acquireVsCodeApi();
            let currentTab = 'general';
            let currentLanguage = '${currentLang}';
            
            // Translations
            const translations = ${translations};
            
            // i18n function
            function t(key, params = {}) {
                const keys = key.split('.');
                let value = translations;
                
                for (const k of keys) {
                    if (value && typeof value === 'object' && k in value) {
                        value = value[k];
                    } else {
                        console.warn('Translation key not found:', key);
                        return key;
                    }
                }
                
                if (typeof value !== 'string') {
                    console.warn('Translation value is not a string:', key);
                    return key;
                }
                
                // Handle interpolation
                return value.replace(/\\{(\\w+)\\}/g, (match, paramKey) => {
                    return paramKey in params ? String(params[paramKey]) : match;
                });
            }
            
            // Plural helper
            function plural(count) {
                return currentLanguage === 'es' ? (count === 1 ? '' : 's') : (count === 1 ? '' : 's');
            }
            
            // Error handling
            window.addEventListener('error', function(e) {
                console.error('❌ JavaScript Error:', e.error);
                console.error('❌ Error details:', e.message, 'at line', e.lineno);
            });
            
            // Debug info
            console.log('🔧 Claude Context Manager Webview loaded');
            console.log('🌍 Language:', currentLanguage);
            console.log('🔧 Environment check:', {
                document: typeof document,
                vscode: typeof vscode,
                location: window.location.href
            });
            
            // Tab management
            function showTab(tabName) {
                console.log('📑 Switching to tab:', tabName);
                
                // Hide all tabs
                document.querySelectorAll('.tab-content').forEach(tab => {
                    tab.classList.remove('active');
                });
                document.querySelectorAll('.tab-button').forEach(btn => {
                    btn.classList.remove('active');
                });
                
                // Show selected tab
                const targetTab = document.getElementById(tabName + '-tab');
                const targetButton = document.querySelector('[data-tab="' + tabName + '"]');
                
                if (targetTab && targetButton) {
                    targetTab.classList.add('active');
                    targetButton.classList.add('active');
                    currentTab = tabName;
                    
                    // Notify tab-specific initialization
                    window.dispatchEvent(new CustomEvent('tabChanged', { 
                        detail: { tabName } 
                    }));
                } else {
                    console.error('❌ Tab not found:', tabName);
                }
            }
            
            // Utility functions
            function formatTimestamp(timestamp) {
                const date = new Date(timestamp);
                const now = new Date();
                const diffMs = now.getTime() - date.getTime();
                const diffMinutes = Math.floor(diffMs / (1000 * 60));
                const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                
                if (diffMinutes < 1) {
                    return t('time.now');
                } else if (diffMinutes < 60) {
                    return t('time.minutesAgo', { count: diffMinutes });
                } else if (diffHours < 24) {
                    return t('time.hoursAgo', { count: diffHours });
                } else if (diffDays < 7) {
                    return t('time.daysAgo', { count: diffDays });
                } else {
                    return date.toLocaleDateString();
                }
            }
            
            function formatTags(tags) {
                return tags && tags.length > 0 ? tags.join(', ') : t('status.noTags');
            }
            
            function escapeHtml(text) {
                const div = document.createElement('div');
                div.textContent = text;
                return div.innerHTML;
            }
            
            function highlightText(text, query) {
                if (!query || !query.trim()) return escapeHtml(text);
                
                const escapedText = escapeHtml(text);
                const escapedQuery = escapeHtml(query);
                const lowerText = escapedText.toLowerCase();
                const lowerQuery = escapedQuery.toLowerCase();
                const index = lowerText.indexOf(lowerQuery);
                
                if (index === -1) return escapedText;
                
                const before = escapedText.substring(0, index);
                const match = escapedText.substring(index, index + escapedQuery.length);
                const after = escapedText.substring(index + escapedQuery.length);
                
                return before + '<mark>' + match + '</mark>' + after;
            }
            
            // Language switcher (for future use)
            function switchLanguage(lang) {
                vscode.postMessage({
                    type: 'changeLanguage',
                    language: lang
                });
            }
            
            // Initialize when DOM is ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', function() {
                    console.log('📄 DOM ready, initializing...');
                    window.dispatchEvent(new CustomEvent('domReady'));
                });
            } else {
                console.log('📄 DOM already ready, initializing...');
                setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('domReady'));
                }, 0);
            }
        `;
    }

    /**
     * Create navigation tabs with i18n support
     */
    static createTabs(): string {
        const t = i18n.getTranslations();
        
        return `
            <div class="tabs">
                <button class="tab-button active" data-tab="general" onclick="showTab('general')">
                    <span class="icon">${IconProvider.getIcon('home')}</span>
                    ${t.nav.general}
                </button>
                <button class="tab-button" data-tab="agents" onclick="showTab('agents')">
                    <span class="icon">${IconProvider.getIcon('users')}</span>
                    ${t.nav.agents}
                </button>
                <button class="tab-button" data-tab="search" onclick="showTab('search')">
                    <span class="icon">${IconProvider.getIcon('search')}</span>
                    ${t.nav.search}
                </button>
            </div>
        `;
    }
}