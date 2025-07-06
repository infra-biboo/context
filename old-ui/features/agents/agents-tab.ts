import { VSCodeBridge } from '../../core/vscode-bridge';
import { AgentsUI } from './agents-ui';

export class AgentsTab {
    private bridge: VSCodeBridge;
    private ui: AgentsUI;
    private isInitialized: boolean = false;

    constructor() {
        this.bridge = VSCodeBridge.getInstance();
        this.ui = new AgentsUI();
        this.setupMessageHandlers();
    }

    private setupMessageHandlers() {
        this.bridge.registerHandler('agentsData', (message: any) => this.ui.displayAgents(message.agents, message.status));
    }

    public onTabActivated() {
        if (!this.isInitialized) {
            this.initialize();
        }
        this.loadData();
    }

    private initialize() {
        const container = document.getElementById('agents-content');
        if (container) {
            container.innerHTML = this.ui.getHTML();
            this.ui.setupEventListeners();
            this.isInitialized = true;
        }
    }

    private loadData() {
        this.bridge.getAgents();
    }
}
