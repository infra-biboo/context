import { ContextWithAgentSuggestion } from '../core/context-analysis-service';
import { Agent, AgentStatus } from '../agents/agent-types';

export interface MCPResponse {
    [x: string]: unknown;
    content: Array<{
        [x: string]: unknown;
        type: 'text';
        text: string;
    }>;
}

// Using types from agent-types.ts

export class ResponseFormattingService {

    /**
     * Format context response with rich markdown formatting
     */
    formatContextResponse(contexts: ContextWithAgentSuggestion[]): MCPResponse {
        if (contexts.length === 0) {
            return {
                content: [{
                    type: 'text',
                    text: '📋 **PROJECT CONTEXT** (0 entries)\n\n' +
                          '🔍 No contexts found. Start capturing important decisions, conversations, and code insights!\n\n' +
                          '💡 **Tip**: Use the Context Manager to add new contexts as you work on your project.'
                }]
            };
        }

        const contextList = contexts.map(ctx => this.formatSingleContext(ctx)).join('\n---\n');
        
        const headerText = `📋 **PROJECT CONTEXT** (${contexts.length} entries)\n\n`;
        const footerText = this.generateContextFooter(contexts);

        return {
            content: [{
                type: 'text',
                text: headerText + contextList + footerText
            }]
        };
    }

    /**
     * Format active agents response with comprehensive guide
     */
    formatActiveAgentsResponse(activeAgents: Agent[], agentStatus: AgentStatus): MCPResponse {
        const headerSection = this.formatAgentsHeader(activeAgents.length);
        const activationGuide = this.formatActivationGuide();
        const agentProfiles = this.formatAgentProfiles(activeAgents);
        const statusSection = this.formatAgentStatus(agentStatus);
        const usageExamples = this.formatUsageExamples();
        const collaborationNote = this.formatCollaborationNote();

        return {
            content: [{
                type: 'text',
                text: [
                    headerSection,
                    activationGuide,
                    agentProfiles,
                    statusSection,
                    usageExamples,
                    collaborationNote
                ].join('\n\n')
            }]
        };
    }

    /**
     * Format agent activation response
     */
    formatAgentActivationResponse(
        agentInfo: Agent, 
        task: string, 
        priority: string
    ): MCPResponse {
        const emoji = agentInfo.emoji;
        const guidelines = this.getAgentGuidelines(agentInfo.id);

        return {
            content: [{
                type: 'text',
                text: `${emoji} **${agentInfo.name.toUpperCase()} AGENT ACTIVATED**

**Role**: ${agentInfo.description}
**Task**: ${task}
**Priority**: ${priority}
**Specializations**: ${agentInfo.specializations.join(', ')}

**Context Set**: You are now operating as the ${agentInfo.name} agent. Focus your response on ${agentInfo.description.toLowerCase()} with expertise in ${agentInfo.specializations.join(', ')}.

**Agent Guidelines:**
${guidelines}

**Ready to assist with**: ${task}

🚀 **Agent activated successfully!** Proceed with your ${agentInfo.name.toLowerCase()}-focused approach.`
            }]
        };
    }

    /**
     * Format a single context entry
     */
    private formatSingleContext(ctx: ContextWithAgentSuggestion): string {
        const typeEmoji = this.getTypeEmoji(ctx.type);
        const importanceStars = '⭐'.repeat(Math.min(ctx.importance, 5));
        const formattedDate = new Date(ctx.timestamp).toLocaleString();
        const truncatedContent = this.truncateContent(ctx.content, 200);

        return `${typeEmoji} **[${ctx.type.toUpperCase()}]** ${truncatedContent}
📅 ${formattedDate} | ${importanceStars} ${ctx.importance}/10
🏷️ **Tags**: ${ctx.tags.length > 0 ? ctx.tags.join(', ') : 'No tags'}
🤖 **Suggested Agent**: ${ctx.suggestedAgent} - ${ctx.agentReason}`;
    }

    /**
     * Format agents header section
     */
    private formatAgentsHeader(agentCount: number): string {
        return `🤖 **ACTIVE AI AGENTS** (${agentCount}/3)`;
    }

    /**
     * Format agent activation guide
     */
    private formatActivationGuide(): string {
        return `**AGENT ACTIVATION GUIDE:**
To activate an agent's expertise, mention their role in your request:`;
    }

    /**
     * Format agent profiles section
     */
    private formatAgentProfiles(agents: Agent[]): string {
        return agents.map(agent => {
            const triggerPhrases = this.getAgentTriggerPhrases(agent.id);
            const useWhen = this.getAgentUseWhen(agent.id);

            return `${agent.emoji} **${agent.name.toUpperCase()}** - ${agent.description}
- **Trigger phrases**: ${triggerPhrases.join('", "')}
- **Specializations**: ${agent.specializations.join(', ')}
- **Use when**: ${useWhen}`;
        }).join('\n\n');
    }

    /**
     * Format agent status section
     */
    private formatAgentStatus(status: AgentStatus): string {
        return `**Current Mode**: ${status.collaborationMode}
**Active Agents**: ${status.activeAgents}/${status.totalAgents}
**Last Updated**: ${status.lastUpdated.toLocaleString()}`;
    }

    /**
     * Format usage examples section
     */
    private formatUsageExamples(): string {
        return `**USAGE EXAMPLES:**
- "As the Architect, how should I structure this microservices system?"
- "Backend approach for handling file uploads with authentication?"
- "Frontend implementation for this dashboard with React components?"`;
    }

    /**
     * Format collaboration note
     */
    private formatCollaborationNote(): string {
        return `**Note**: You can address multiple agents in one response or switch between agent perspectives as needed.`;
    }

    /**
     * Generate footer for context response
     */
    private generateContextFooter(contexts: ContextWithAgentSuggestion[]): string {
        if (contexts.length === 0) return '';

        const firstSuggestedAgent = contexts[0]?.suggestedAgent?.split(' ')[0] || 'specialist';
        
        return `\n\n💡 **Tip**: Use suggested agents by mentioning them (e.g., "As the ${firstSuggestedAgent}...")

🔍 **Quick Actions:**
- Filter by type: conversation, decision, code, issue
- Search by content or tags
- Sort by importance or date

📊 **Context Summary:**
- Total entries: ${contexts.length}
- Average importance: ${this.calculateAverageImportance(contexts)}/10
- Most common type: ${this.getMostCommonType(contexts)}`;
    }

    /**
     * Get emoji for context type
     */
    private getTypeEmoji(type: string): string {
        const emojis = {
            'conversation': '💬',
            'decision': '🎯',
            'code': '💻',
            'issue': '🐛'
        };
        return emojis[type as keyof typeof emojis] || '📝';
    }

    /**
     * Truncate content with ellipsis
     */
    private truncateContent(content: string, maxLength: number): string {
        if (content.length <= maxLength) return content;
        return content.substring(0, maxLength - 3) + '...';
    }

    /**
     * Get trigger phrases for agent
     */
    private getAgentTriggerPhrases(agentId: string): string[] {
        const phrases = {
            'architect': ['"As the Architect..."', '"Architecture perspective..."', '"System design for..."'],
            'backend': ['"Backend approach..."', '"Server-side solution..."', '"API design for..."'],
            'frontend': ['"Frontend implementation..."', '"UI/UX perspective..."', '"User interface for..."']
        };
        return phrases[agentId as keyof typeof phrases] || ['"As the agent..."'];
    }

    /**
     * Get use when guidance for agent
     */
    private getAgentUseWhen(agentId: string): string {
        const guidance = {
            'architect': 'Planning system architecture, choosing patterns, scalability decisions',
            'backend': 'API development, database design, server-side logic, performance optimization',
            'frontend': 'UI development, user experience design, responsive layouts, component architecture'
        };
        return guidance[agentId as keyof typeof guidance] || 'General development tasks';
    }

    /**
     * Get agent-specific guidelines
     */
    private getAgentGuidelines(agentId: string): string {
        const guidelines = {
            'architect': `- Focus on system design, architecture patterns, and scalability
- Consider long-term maintainability and technical debt
- Evaluate trade-offs between different architectural approaches
- Think about system boundaries and service responsibilities`,
            
            'backend': `- Focus on server-side logic, APIs, and data management
- Consider performance, security, and scalability
- Evaluate database design and authentication strategies
- Think about error handling and logging`,
            
            'frontend': `- Focus on user experience, interface design, and accessibility
- Consider responsive design and cross-browser compatibility
- Evaluate usability and visual design principles
- Think about state management and component architecture`
        };
        return guidelines[agentId as keyof typeof guidelines] || 'Provide specialized guidance for development tasks';
    }

    /**
     * Calculate average importance of contexts
     */
    private calculateAverageImportance(contexts: ContextWithAgentSuggestion[]): number {
        if (contexts.length === 0) return 0;
        const sum = contexts.reduce((acc, ctx) => acc + ctx.importance, 0);
        return Math.round((sum / contexts.length) * 10) / 10; // Round to 1 decimal
    }

    /**
     * Get most common context type
     */
    private getMostCommonType(contexts: ContextWithAgentSuggestion[]): string {
        if (contexts.length === 0) return 'none';
        
        const typeCounts = contexts.reduce((acc, ctx) => {
            acc[ctx.type] = (acc[ctx.type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(typeCounts)
            .sort(([,a], [,b]) => b - a)[0][0];
    }

    /**
     * Format error response
     */
    formatErrorResponse(error: string, context?: string): MCPResponse {
        return {
            content: [{
                type: 'text',
                text: `❌ **Error**

${error}

${context ? `**Context**: ${context}\n\n` : ''}📞 **Support**: If this error persists, please check the Context Manager logs or restart the MCP server.

🔧 **Troubleshooting**:
- Verify the database connection
- Check for sufficient permissions
- Ensure the workspace is properly configured`
            }]
        };
    }

    /**
     * Format success response for operations
     */
    formatSuccessResponse(message: string, details?: string): MCPResponse {
        return {
            content: [{
                type: 'text',
                text: `✅ **Success**

${message}

${details ? `**Details**: ${details}` : ''}

🎉 Operation completed successfully!`
            }]
        };
    }
}