import { IconProvider } from '../utils/icons';
import { i18n } from '../utils/i18n';

/**
 * Agents Tab Component
 * Handles AI agent selection and collaboration mode
 */
export class AgentsTab {
    private translations = i18n.getTranslations();

    /**
     * Generate the HTML content for the agents tab
     */
    getHTML(): string {
        return `
            <div id="agents-tab" class="tab-content">
                ${this.getAgentsCard()}
                ${this.getCollaborationModeCard()}
            </div>
        `;
    }

    /**
     * Main agents selection card
     */
    private getAgentsCard(): string {
        return `
            <div class="card">
                <div class="card-header">
                    <span class="icon">${IconProvider.getIcon('users')}</span>
                    ${this.translations.agents.title}
                </div>
                <div class="card-content">
                    <p class="text-sm opacity-75 mb-4">
                        ${this.translations.agents.description}
                    </p>
                    
                    <div id="agents-list">
                        ${this.getAgentsList()}
                    </div>
                </div>
                <div class="card-footer">
                    ${this.getStatusSummary()}
                </div>
            </div>
        `;
    }

    /**
     * Get agents list HTML
     */
    private getAgentsList(): string {
        const agents = [
            {
                id: 'architect',
                name: this.translations.agents.architect.name,
                description: this.translations.agents.architect.description,
                specializations: this.translations.agents.architect.specializations,
                icon: IconProvider.getAgentIcon('architect'),
                enabled: true
            },
            {
                id: 'backend',
                name: this.translations.agents.backend.name,
                description: this.translations.agents.backend.description,
                specializations: this.translations.agents.backend.specializations,
                icon: IconProvider.getAgentIcon('backend'),
                enabled: true
            },
            {
                id: 'frontend',
                name: this.translations.agents.frontend.name,
                description: this.translations.agents.frontend.description,
                specializations: this.translations.agents.frontend.specializations,
                icon: IconProvider.getAgentIcon('frontend'),
                enabled: true
            }
        ];

        return agents.map(agent => `
            <div class="agent-item ${agent.enabled ? 'enabled' : ''}" data-agent="${agent.id}">
                <div class="agent-icon">
                    <span class="icon">${agent.icon}</span>
                </div>
                <div class="agent-info">
                    <div class="agent-name">${agent.name}</div>
                    <div class="agent-description">${agent.description}</div>
                    <div class="agent-specializations">${agent.specializations.join(' • ')}</div>
                </div>
                <label class="agent-toggle">
                    <input type="checkbox" ${agent.enabled ? 'checked' : ''} 
                           onchange="toggleAgent('${agent.id}')" class="form-checkbox">
                </label>
            </div>
        `).join('');
    }

    /**
     * Status summary section
     */
    private getStatusSummary(): string {
        return `
            <div class="status-summary">
                <div class="status-row">
                    <span><strong>${this.translations.agents.activeAgents}:</strong></span>
                    <span id="active-agents-count">3 ${this.translations.status.of} 3</span>
                </div>
                <div class="status-row">
                    <span><strong>${this.translations.agents.mode}:</strong></span>
                    <span id="collaboration-mode">${this.translations.agents.collaborative}</span>
                </div>
                <div class="status-row">
                    <span><strong>${this.translations.agents.lastUpdated}:</strong></span>
                    <span id="last-updated">${this.translations.agents.never}</span>
                </div>
            </div>
        `;
    }

    /**
     * Collaboration mode card
     */
    private getCollaborationModeCard(): string {
        return `
            <div class="card">
                <div class="card-header">
                    <span class="icon">${IconProvider.getIcon('settings')}</span>
                    ${this.translations.agents.collaborationMode}
                </div>
                <div class="card-content">
                    <div class="flex gap-2">
                        <button class="btn btn-secondary mode-btn active" data-mode="collaborative" onclick="setCollaborationMode('collaborative')">
                            <span class="icon">${IconProvider.getIcon('users')}</span>
                            ${this.translations.agents.collaborative}
                        </button>
                        <button class="btn btn-secondary mode-btn" data-mode="individual" onclick="setCollaborationMode('individual')">
                            <span class="icon">${IconProvider.getIcon('brain')}</span>
                            ${this.translations.agents.individual}
                        </button>
                        <button class="btn btn-secondary mode-btn" data-mode="hierarchical" onclick="setCollaborationMode('hierarchical')">
                            <span class="icon">${IconProvider.getIcon('cpu')}</span>
                            ${this.translations.agents.hierarchical}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Get JavaScript functionality for the agents tab
     */
    getScript(): string {
        return `
            // Agents tab functionality
            let agentsTabState = {
                agents: [],
                collaborationMode: 'collaborative',
                lastUpdated: null
            };

            // Agent management
            function loadAgents() {
                console.log('🤖 Loading agents');
                vscode.postMessage({ type: 'getAgents' });
            }

            function toggleAgent(agentId) {
                console.log('🔄 Toggling agent:', agentId);
                const checkbox = event.target;
                const agentItem = checkbox.closest('.agent-item');
                
                if (checkbox.checked) {
                    agentItem.classList.add('enabled');
                } else {
                    agentItem.classList.remove('enabled');
                }
                
                updateAgentCount();
                
                vscode.postMessage({
                    type: 'toggleAgent',
                    agentId: agentId,
                    enabled: checkbox.checked
                });
            }

            function setCollaborationMode(mode) {
                console.log('🔧 Setting collaboration mode:', mode);
                
                // Update UI
                document.querySelectorAll('.mode-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                document.querySelector('[data-mode="' + mode + '"]').classList.add('active');
                
                document.getElementById('collaboration-mode').textContent = t('agents.' + mode);
                agentsTabState.collaborationMode = mode;
                
                vscode.postMessage({
                    type: 'setCollaborationMode',
                    mode: mode
                });
            }

            function displayAgents(agents, status) {
                console.log('🤖 Displaying agents:', agents.length, 'Status:', status);
                agentsTabState.agents = agents;
                agentsTabState.lastUpdated = status.lastUpdated;
                
                const listEl = document.getElementById('agents-list');
                
                listEl.innerHTML = agents.map(agent => 
                    '<div class="agent-item ' + (agent.enabled ? 'enabled' : '') + '" data-agent="' + agent.id + '">' +
                        '<div class="agent-icon">' +
                            '<span class="icon">' + getAgentIcon(agent.id) + '</span>' +
                        '</div>' +
                        '<div class="agent-info">' +
                            '<div class="agent-name">' + agent.name + '</div>' +
                            '<div class="agent-description">' + agent.description + '</div>' +
                            '<div class="agent-specializations">' + agent.specializations.join(' • ') + '</div>' +
                        '</div>' +
                        '<label class="agent-toggle">' +
                            '<input type="checkbox" ' + (agent.enabled ? 'checked' : '') + ' ' +
                                   'onchange="toggleAgent(\'' + agent.id + '\')" class="form-checkbox">' +
                        '</label>' +
                    '</div>'
                ).join('');
                
                updateAgentStatus(status);
            }

            function updateAgentCount() {
                const activeCount = document.querySelectorAll('.agent-item.enabled').length;
                const totalCount = document.querySelectorAll('.agent-item').length;
                document.getElementById('active-agents-count').textContent = activeCount + ' ' + t('status.of') + ' ' + totalCount;
            }

            function updateAgentStatus(status) {
                console.log('📊 Updating agent status:', status);
                
                document.getElementById('active-agents-count').textContent = 
                    status.activeAgents + ' ' + t('status.of') + ' ' + status.totalAgents;
                    
                document.getElementById('collaboration-mode').textContent = 
                    t('agents.' + status.collaborationMode);
                    
                document.getElementById('last-updated').textContent = 
                    status.lastUpdated ? formatTimestamp(status.lastUpdated) : t('agents.never');
                
                // Update mode buttons
                document.querySelectorAll('.mode-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                document.querySelector('[data-mode="' + status.collaborationMode + '"]').classList.add('active');
            }

            // Helper function to get agent icon
            function getAgentIcon(agentId) {
                const icons = {
                    architect: '${IconProvider.getAgentIcon('architect')}',
                    backend: '${IconProvider.getAgentIcon('backend')}',
                    frontend: '${IconProvider.getAgentIcon('frontend')}'
                };
                return icons[agentId] || '${IconProvider.getIcon('users')}';
            }

            // Initialize agents tab
            function initAgentsTab() {
                console.log('🤖 Initializing agents tab');
                loadAgents();
            }

            // Listen for tab changes
            window.addEventListener('tabChanged', function(e) {
                if (e.detail.tabName === 'agents') {
                    initAgentsTab();
                }
            });
        `;
    }
}