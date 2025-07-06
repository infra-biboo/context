import { VSCodeBridge } from '../../core/vscode-bridge';
import { GeneralUI } from './general-ui';

export class GeneralTab {
    private bridge: VSCodeBridge;
    private ui: GeneralUI;
    private isInitialized: boolean = false;

    constructor() {
        this.bridge = VSCodeBridge.getInstance();
        this.ui = new GeneralUI();
        this.setupMessageHandlers();
    }

    private setupMessageHandlers() {
        this.bridge.registerHandler('contextsData', (message: any) => this.ui.displayContexts(message.contexts));
        this.bridge.registerHandler('configData', (message: any) => this.ui.updateConfigUI(message.config, message.status));
        this.bridge.registerHandler('mcpStatus', (message: any) => this.ui.updateMCPStatus(message.connected));
        this.bridge.registerHandler('refreshData', () => this.loadData());
    }

    public onTabActivated() {
        if (!this.isInitialized) {
            this.initialize();
        }
        this.loadData();
    }

    private initialize() {
        const container = document.getElementById('general-content');
        if (container) {
            container.innerHTML = this.ui.getHTML();
            this.ui.setupEventListeners();
            this.isInitialized = true;
        }
    }

    private loadData() {
        this.bridge.getContexts();
        this.bridge.getConfig();
        this.bridge.getMCPStatus();
    }
}
