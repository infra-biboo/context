import { VSCodeBridge } from '../../core/vscode-bridge';
import { SearchUI } from './search-ui';

export class SearchTab {
    private bridge: VSCodeBridge;
    private ui: SearchUI;
    private isInitialized: boolean = false;

    constructor() {
        this.bridge = VSCodeBridge.getInstance();
        this.ui = new SearchUI();
        this.setupMessageHandlers();
    }

    private setupMessageHandlers() {
        this.bridge.registerHandler('searchResults', (message: any) => this.ui.displayResults(message.results, message.query));
        this.bridge.registerHandler('editContextData', (message: any) => this.ui.showEditModal(message.context));
        this.bridge.registerHandler('refreshData', () => this.loadData());
    }

    public onTabActivated() {
        if (!this.isInitialized) {
            this.initialize();
        }
        this.loadData();
    }

    private initialize() {
        const container = document.getElementById('search-content');
        if (container) {
            container.innerHTML = this.ui.getHTML();
            this.ui.setupEventListeners();
            this.isInitialized = true;
        }
    }

    private loadData() {
        // Initial search with empty query to show all results
        this.bridge.searchContexts('', { type: 'all' });
    }
}
