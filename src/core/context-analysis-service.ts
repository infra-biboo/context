import { ContextEntry } from './database/types';

export interface ContextWithAgentSuggestion extends ContextEntry {
    suggestedAgent: string;
    agentReason: string;
}

export class ContextAnalysisService {
    
    /**
     * Enrich contexts with agent suggestions
     */
    enrichWithAgentSuggestions(contexts: ContextEntry[]): ContextWithAgentSuggestion[] {
        return contexts.map(ctx => {
            const suggestedAgent = this.suggestAgentForContext(ctx);
            return {
                ...ctx,
                suggestedAgent,
                agentReason: this.getAgentSuggestionReason(ctx, suggestedAgent)
            };
        });
    }

    /**
     * Suggest the most appropriate agent for a given context entry
     */
    suggestAgentForContext(ctx: ContextEntry): string {
        const content = ctx.content.toLowerCase();
        const tags = ctx.tags.map((tag: string) => tag.toLowerCase());
        
        // Architecture keywords and scoring
        const archKeywords = [
            'architecture', 'design', 'pattern', 'structure', 'scalability', 
            'system', 'microservices', 'monolith', 'distributed', 'performance',
            'infrastructure', 'deployment', 'orchestration', 'containerization'
        ];
        const archScore = this.calculateKeywordScore(content, tags, archKeywords);
        
        // Backend keywords and scoring  
        const backendKeywords = [
            'api', 'database', 'server', 'auth', 'endpoint', 'crud', 'sql', 
            'security', 'middleware', 'orm', 'query', 'transaction', 'cache',
            'validation', 'business logic', 'service layer'
        ];
        const backendScore = this.calculateKeywordScore(content, tags, backendKeywords);
        
        // Frontend keywords and scoring
        const frontendKeywords = [
            'ui', 'ux', 'component', 'react', 'vue', 'css', 'responsive', 
            'accessibility', 'user', 'interface', 'styling', 'layout', 'design system',
            'animation', 'interaction', 'usability', 'browser'
        ];
        const frontendScore = this.calculateKeywordScore(content, tags, frontendKeywords);
        
        // Determine best agent based on scores with tie-breaking logic
        if (archScore > backendScore && archScore > frontendScore) {
            return 'Architect 🏗️';
        } else if (backendScore > frontendScore) {
            return 'Backend ⚙️';
        } else if (frontendScore > 0) {
            return 'Frontend 🎨';
        } else {
            // Default to architect for ambiguous cases
            return 'Architect 🏗️';
        }
    }

    /**
     * Get the reason why a specific agent was suggested
     */
    getAgentSuggestionReason(ctx: ContextEntry, suggestedAgent: string): string {
        const reasons = {
            'Architect 🏗️': this.getArchitectReason(ctx),
            'Backend ⚙️': this.getBackendReason(ctx), 
            'Frontend 🎨': this.getFrontendReason(ctx)
        };
        
        return reasons[suggestedAgent as keyof typeof reasons] || 'General development guidance';
    }

    /**
     * Calculate keyword match score for content and tags
     */
    private calculateKeywordScore(content: string, tags: string[], keywords: string[]): number {
        return keywords.filter(keyword => 
            content.includes(keyword) || 
            tags.some((tag: string) => tag.includes(keyword))
        ).length;
    }

    /**
     * Get specific reason for architect suggestion
     */
    private getArchitectReason(ctx: ContextEntry): string {
        const content = ctx.content.toLowerCase();
        
        if (content.includes('architecture') || content.includes('design')) {
            return 'System architecture and design decisions';
        }
        if (content.includes('scalability') || content.includes('performance')) {
            return 'Scalability and performance considerations';
        }
        if (content.includes('pattern') || content.includes('structure')) {
            return 'Design patterns and system structure';
        }
        if (content.includes('microservices') || content.includes('distributed')) {
            return 'Distributed systems and microservices architecture';
        }
        
        return 'System design and architectural decisions';
    }

    /**
     * Get specific reason for backend suggestion
     */
    private getBackendReason(ctx: ContextEntry): string {
        const content = ctx.content.toLowerCase();
        
        if (content.includes('api') || content.includes('endpoint')) {
            return 'API design and endpoint implementation';
        }
        if (content.includes('database') || content.includes('sql')) {
            return 'Database design and data management';
        }
        if (content.includes('auth') || content.includes('security')) {
            return 'Authentication and security implementation';
        }
        if (content.includes('performance') || content.includes('optimization')) {
            return 'Backend performance and optimization';
        }
        
        return 'Server-side logic and API development';
    }

    /**
     * Get specific reason for frontend suggestion
     */
    private getFrontendReason(ctx: ContextEntry): string {
        const content = ctx.content.toLowerCase();
        
        if (content.includes('ui') || content.includes('interface')) {
            return 'User interface design and implementation';
        }
        if (content.includes('ux') || content.includes('usability')) {
            return 'User experience and usability optimization';
        }
        if (content.includes('responsive') || content.includes('mobile')) {
            return 'Responsive design and mobile compatibility';
        }
        if (content.includes('accessibility') || content.includes('a11y')) {
            return 'Accessibility and inclusive design';
        }
        if (content.includes('component') || content.includes('react')) {
            return 'Component-based frontend development';
        }
        
        return 'User interface and experience design';
    }

    /**
     * Analyze context complexity and provide recommendations
     */
    analyzeContextComplexity(ctx: ContextEntry): {
        complexity: 'low' | 'medium' | 'high';
        factors: string[];
        recommendations: string[];
    } {
        const factors: string[] = [];
        const recommendations: string[] = [];
        let complexityScore = 0;

        // Content length factor
        if (ctx.content.length > 1000) {
            complexityScore += 2;
            factors.push('Large content size');
            recommendations.push('Consider breaking into smaller, focused contexts');
        }

        // Technical keyword density
        const technicalKeywords = ['api', 'database', 'architecture', 'performance', 'security', 'scalability'];
        const keywordCount = technicalKeywords.filter(keyword => 
            ctx.content.toLowerCase().includes(keyword)
        ).length;

        if (keywordCount >= 3) {
            complexityScore += 2;
            factors.push('High technical keyword density');
            recommendations.push('Multiple technical domains involved - consider multi-agent collaboration');
        }

        // Tag count factor
        if (ctx.tags.length > 5) {
            complexityScore += 1;
            factors.push('Multiple tags indicating broad scope');
            recommendations.push('Well-categorized but may benefit from more specific contexts');
        }

        // Importance factor
        if (ctx.importance >= 8) {
            complexityScore += 1;
            factors.push('High importance level');
            recommendations.push('Critical context - ensure thorough documentation and follow-up');
        }

        // Determine complexity level
        let complexity: 'low' | 'medium' | 'high';
        if (complexityScore <= 1) {
            complexity = 'low';
        } else if (complexityScore <= 3) {
            complexity = 'medium';
        } else {
            complexity = 'high';
        }

        return { complexity, factors, recommendations };
    }

    /**
     * Generate context summary for quick understanding
     */
    generateContextSummary(ctx: ContextEntry): {
        summary: string;
        keyTopics: string[];
        estimatedReadTime: number;
    } {
        const words = ctx.content.split(/\s+/).length;
        const estimatedReadTime = Math.ceil(words / 200); // Average reading speed: 200 words/minute

        // Extract key topics from content
        const keyTopics = this.extractKeyTopics(ctx.content);

        // Generate summary (first sentence or up to 100 characters)
        const sentences = ctx.content.split(/[.!?]+/);
        let summary = sentences[0]?.trim() || '';
        
        if (summary.length > 100) {
            summary = summary.substring(0, 97) + '...';
        }

        return {
            summary,
            keyTopics,
            estimatedReadTime
        };
    }

    /**
     * Extract key topics from content using simple keyword analysis
     */
    private extractKeyTopics(content: string): string[] {
        const topicKeywords = {
            'API Development': ['api', 'endpoint', 'rest', 'graphql', 'http'],
            'Database': ['database', 'sql', 'query', 'schema', 'migration'],
            'Authentication': ['auth', 'login', 'token', 'jwt', 'oauth'],
            'Frontend': ['ui', 'component', 'react', 'vue', 'css'],
            'Architecture': ['architecture', 'design', 'pattern', 'structure'],
            'Performance': ['performance', 'optimization', 'cache', 'speed'],
            'Security': ['security', 'vulnerability', 'encryption', 'xss'],
            'Testing': ['test', 'unit', 'integration', 'e2e', 'mock'],
            'DevOps': ['deploy', 'ci', 'cd', 'docker', 'kubernetes'],
            'Documentation': ['docs', 'readme', 'documentation', 'guide']
        };

        const lowerContent = content.toLowerCase();
        const detectedTopics: string[] = [];

        for (const [topic, keywords] of Object.entries(topicKeywords)) {
            if (keywords.some(keyword => lowerContent.includes(keyword))) {
                detectedTopics.push(topic);
            }
        }

        return detectedTopics.slice(0, 5); // Limit to top 5 topics
    }
}