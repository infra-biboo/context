import { VSCodeBridge } from '../../core/vscode-bridge';

export class AgentsUI {
    private bridge: VSCodeBridge;

    constructor() {
        this.bridge = VSCodeBridge.getInstance();
    }

    public getHTML(): string {
        return `
            <div class="status-card">
                <h3>🤖 AI Agents</h3>
                <p>Select which specialized agents are available:</p>
                <div id="agents-list"></div>
            </div>
            <div class="status-card">
                <h3>🤝 Collaboration Mode</h3>
                <p class="mode-description">How should the agents work together?</p>
                
                <div class="mode-option">
                    <button class="btn-secondary mode-btn" data-mode="collaborative">
                        <span class="mode-icon">🤝</span>
                        <span class="mode-text">Collaborative</span>
                    </button>
                    <div class="mode-description">
                        <strong>All active agents work together</strong><br>
                        <small>Get perspectives from architecture, backend, and frontend in one response</small>
                    </div>
                </div>

                <div class="mode-option">
                    <button class="btn-secondary mode-btn" data-mode="individual">
                        <span class="mode-icon">👤</span>
                        <span class="mode-text">Individual</span>
                    </button>
                    <div class="mode-description">
                        <strong>One agent responds based on context</strong><br>
                        <small>Claude picks the most relevant agent for your specific question</small>
                    </div>
                </div>

                <div class="mode-option">
                    <button class="btn-secondary mode-btn" data-mode="hierarchical" id="hierarchical-btn">
                        <span class="mode-icon">📊</span>
                        <span class="mode-text">Hierarchical</span>
                    </button>
                    <div class="mode-description">
                        <strong>Architect leads other agents</strong><br>
                        <small>Architecture decisions first, then coordinates backend/frontend work</small>
                        <div id="hierarchical-requirement" class="requirement-notice" style="display: none;">
                            ⚠️ Requires Architect + at least one other agent
                        </div>
                    </div>
                </div>

                <div id="mode-status" class="mode-status"></div>
            </div>
        `;
    }

    public setupEventListeners() {
        document.getElementById('agents-list')?.addEventListener('change', (e) => {
            const target = e.target as HTMLInputElement;
            if (target.type === 'checkbox') {
                const agentId = target.dataset.agentId || target.getAttribute('data-agent-id');
                if (agentId) {
                    this.bridge.toggleAgent(agentId, target.checked);
                }
            }
        });

        // Event delegation for mode buttons (they're now in .mode-option containers)
        document.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains('mode-btn') || target.closest('.mode-btn')) {
                const button = target.classList.contains('mode-btn') ? target : target.closest('.mode-btn') as HTMLElement;
                const mode = button?.getAttribute('data-mode');
                if (mode) {
                    this.bridge.setCollaborationMode(mode);
                }
            }
        });
    }

    public displayAgents(agents: any[], status: any) {
        const listEl = document.getElementById('agents-list');
        if (listEl) {
            listEl.innerHTML = agents.map(agent => `
                <div class="agent-item ${agent.enabled ? 'enabled' : ''}">
                    <div class="agent-emoji">${agent.emoji}</div>
                    <div class="agent-info">
                        <div class="agent-name">${agent.name}</div>
                        <div class="agent-description">${agent.description}</div>
                    </div>
                    <label class="agent-toggle">
                        <input type="checkbox" data-agent-id="${agent.id}" ${agent.enabled ? 'checked' : ''}>
                    </label>
                </div>
            `).join('');
        }

        // Re-setup event listeners for dynamically added checkboxes
        document.querySelectorAll('#agents-list input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const target = e.target as HTMLInputElement;
                const agentId = target.getAttribute('data-agent-id');
                if (agentId) {
                    this.bridge.toggleAgent(agentId, target.checked);
                }
            });
        });

        // Update collaboration mode buttons and hierarchical logic
        this.updateCollaborationModes(agents, status);
    }

    private updateCollaborationModes(agents: any[], status: any) {
        const activeAgents = agents.filter(agent => agent.enabled);
        const architectActive = activeAgents.some(agent => agent.id === 'architect');
        const otherAgentsActive = activeAgents.filter(agent => agent.id !== 'architect').length > 0;
        const canUseHierarchical = architectActive && otherAgentsActive;

        // Update button states
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('active', 'disabled');
            if (btn.getAttribute('data-mode') === status.collaborationMode) {
                btn.classList.add('active');
            }
        });

        // Handle hierarchical mode availability
        const hierarchicalBtn = document.getElementById('hierarchical-btn');
        const hierarchicalRequirement = document.getElementById('hierarchical-requirement');
        
        if (hierarchicalBtn && hierarchicalRequirement) {
            if (!canUseHierarchical) {
                hierarchicalBtn.classList.add('disabled');
                hierarchicalRequirement.style.display = 'block';
                // Auto-switch away from hierarchical if requirements not met
                if (status.collaborationMode === 'hierarchical') {
                    this.bridge.setCollaborationMode('collaborative');
                }
            } else {
                hierarchicalBtn.classList.remove('disabled');
                hierarchicalRequirement.style.display = 'none';
            }
        }

        // Update status display
        this.updateModeStatus(activeAgents, status, canUseHierarchical);
    }

    private updateModeStatus(activeAgents: any[], status: any, canUseHierarchical: boolean) {
        const statusEl = document.getElementById('mode-status');
        if (statusEl) {
            const modeEmojis = {
                collaborative: '🤝',
                individual: '👤',
                hierarchical: '📊'
            };

            const currentMode = status.collaborationMode;
            const emoji = modeEmojis[currentMode as keyof typeof modeEmojis] || '🤖';
            
            statusEl.innerHTML = `
                <div class="current-mode">
                    <strong>${emoji} Current Mode: ${currentMode.charAt(0).toUpperCase() + currentMode.slice(1)}</strong>
                </div>
                <div class="agents-summary">
                    Active Agents: ${activeAgents.map(a => a.emoji + ' ' + a.name).join(', ')} (${activeAgents.length}/3)
                </div>
                ${!canUseHierarchical && currentMode !== 'hierarchical' ? 
                    '<div class="hint"><small>💡 Enable Architect + another agent to unlock Hierarchical mode</small></div>' : 
                    ''}
            `;
        }
    }
}
