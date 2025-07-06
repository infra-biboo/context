export class TabManager {
    private activeTab: string = 'general';
    private tabFeatures: Map<string, any> = new Map();

    constructor() {
        this.setupTabButtons();
    }

    public registerTabFeature(tabName: string, feature: any) {
        this.tabFeatures.set(tabName, feature);
    }

    private setupTabButtons() {
        document.getElementById('general-tab-btn')?.addEventListener('click', () => this.showTab('general'));
        document.getElementById('agents-tab-btn')?.addEventListener('click', () => this.showTab('agents'));
        document.getElementById('search-tab-btn')?.addEventListener('click', () => this.showTab('search'));
    }

    public showTab(tabName: string) {
        if (this.activeTab === tabName && this.tabFeatures.get(tabName)?.isInitialized) {
            return; // Avoid re-initializing if already active and initialized
        }

        document.querySelectorAll('.tab-content').forEach(el => (el as HTMLElement).style.display = 'none');
        document.querySelectorAll('.tab-button').forEach(el => el.classList.remove('active'));

        const contentEl = document.getElementById(`${tabName}-content`);
        if (contentEl) {
            contentEl.style.display = 'block';
        }
        
        const buttonEl = document.getElementById(`${tabName}-tab-btn`);
        if (buttonEl) {
            buttonEl.classList.add('active');
        }

        this.activeTab = tabName;

        const feature = this.tabFeatures.get(tabName);
        if (feature && typeof feature.onTabActivated === 'function') {
            feature.onTabActivated();
        }
    }

    public getActiveTab(): string {
        return this.activeTab;
    }
}
