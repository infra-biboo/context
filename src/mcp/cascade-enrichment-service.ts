import * as vscode from 'vscode';
import { Logger } from '../utils/logger';
import OpenAI from 'openai';

export interface EnrichmentConfig {
    apiEnabled: boolean;
    apiProvider: 'openai' | 'deepseek' | 'custom';
    apiKey: string;
    model: string;
    customBaseURL?: string;
}

export interface EnrichmentStrategy {
    name: string;
    priority: number;
    available: boolean;
}

export class CascadeEnrichmentService {
    private config!: EnrichmentConfig;
    private strategies: EnrichmentStrategy[] = [
        { name: 'claude-mcp', priority: 1, available: false },
        { name: 'user-api', priority: 2, available: false },
        { name: 'local-rules', priority: 3, available: true }
    ];

    constructor(private extensionContext: vscode.ExtensionContext) {
        this.loadConfig();
    }

    async enrichContext(content: string, importance: number): Promise<string> {
        await this.updateStrategiesAvailability();
        
        for (const strategy of this.getAvailableStrategies()) {
            try {
                const result = await this.executeStrategy(strategy.name, content, importance);
                if (result) {
                    Logger.info(`✅ Enrichment successful with: ${strategy.name}`);
                    return result;
                }
            } catch (error) {
                Logger.warn(`❌ ${strategy.name} failed: ${error instanceof Error ? error.message : String(error)}`);
                continue;
            }
        }
        
        throw new Error('All enrichment strategies failed');
    }

    private async updateStrategiesAvailability(): Promise<void> {
        // Check Claude MCP availability
        this.strategies[0].available = await this.isClaudeAvailable();
        
        // Check user API availability
        this.strategies[1].available = this.isUserAPIConfigured();
        
        // Local rules always available
        this.strategies[2].available = true;
    }

    private getAvailableStrategies(): EnrichmentStrategy[] {
        return this.strategies
            .filter(s => s.available)
            .sort((a, b) => a.priority - b.priority);
    }

    private async executeStrategy(strategyName: string, content: string, importance: number): Promise<string> {
        switch (strategyName) {
            case 'claude-mcp':
                return await this.enrichWithClaude(content, importance);
            case 'user-api':
                return await this.enrichWithUserAPI(content, importance);
            case 'local-rules':
                return this.enrichLocally(content, importance);
            default:
                throw new Error(`Unknown strategy: ${strategyName}`);
        }
    }

    private async isClaudeAvailable(): Promise<boolean> {
        // TODO: Implement Claude MCP availability check
        // This would check if Claude Code MCP is available and has tokens
        return false; // Placeholder for now
    }

    private isUserAPIConfigured(): boolean {
        return this.config.apiEnabled && 
               this.config.apiKey.length > 0 && 
               this.config.apiProvider.length > 0;
    }

    private async enrichWithClaude(content: string, importance: number): Promise<string> {
        // TODO: Implement Claude MCP enrichment
        // This would call Claude Code MCP server for enrichment
        throw new Error('Claude MCP enrichment not implemented yet');
    }

    private async enrichWithUserAPI(content: string, importance: number): Promise<string> {
        const apiClient = new OpenAI({
            apiKey: this.config.apiKey,
            baseURL: this.getProviderBaseURL()
        });

        const response = await apiClient.chat.completions.create({
            model: this.config.model,
            messages: [{
                role: "system",
                content: "Analiza este contexto de desarrollo y proporciona insights técnicos concisos en español."
            }, {
                role: "user",
                content: `Contenido: ${content}\nImportancia: ${importance}/10\n\nGenera un análisis técnico bajo 150 palabras.`
            }],
            max_tokens: 300,
            temperature: 0.3
        });

        const enrichedContent = response.choices[0].message.content || 'No response from API';
        return `🧠 ${this.config.apiProvider.toUpperCase()}: ${enrichedContent}`;
    }

    private enrichLocally(content: string, importance: number): string {
        // Local pattern-based enrichment (fallback)
        const lowerContent = content.toLowerCase();
        
        if (/security|auth|token|password|login|credential/.test(lowerContent)) {
            return `📝 Local: Actualización de seguridad detectada (${importance}/10). Revisar implicaciones de autenticación y autorización. Verificar que no se expongan credenciales.`;
        }
        
        if (/fix|bug|error|issue|problem/.test(lowerContent)) {
            return `📝 Local: Corrección de problema identificada (${importance}/10). Validar que la solución resuelve el issue sin crear efectos secundarios.`;
        }
        
        if (/feat|feature|new|add/.test(lowerContent)) {
            return `📝 Local: Nueva funcionalidad detectada (${importance}/10). Evaluar impacto en arquitectura y documentar cambios necesarios.`;
        }
        
        if (/refactor|optimize|improve/.test(lowerContent)) {
            return `📝 Local: Refactorización detectada (${importance}/10). Validar que el comportamiento se mantiene consistente después de los cambios.`;
        }
        
        return `📝 Local: Cambio de código detectado (${importance}/10). Revisar impacto en el sistema y documentar si es necesario.`;
    }

    private loadConfig(): void {
        const settings = vscode.workspace.getConfiguration('claude-context.enrichment');
        
        this.config = {
            apiEnabled: settings.get('apiEnabled', false),
            apiProvider: settings.get('apiProvider', 'deepseek'),
            apiKey: settings.get('apiKey', ''),
            model: settings.get('model', 'deepseek-chat'),
            customBaseURL: settings.get('customBaseURL', '')
        };
    }

    private getProviderBaseURL(): string {
        const urls: Record<string, string> = {
            'openai': 'https://api.openai.com/v1',
            'deepseek': 'https://api.deepseek.com',
            'custom': this.config.customBaseURL || ''
        };
        
        return urls[this.config.apiProvider] || urls.openai;
    }

    // Public method to show fallback notification
    showFallbackNotification(from: string, to: string): void {
        vscode.window.showWarningMessage(
            `Enriquecimiento cambió de ${from} a ${to}`,
            'Configurar API'
        ).then(selection => {
            if (selection === 'Configurar API') {
                vscode.commands.executeCommand('workbench.action.openSettings', 'claude-context.enrichment');
            }
        });
    }
}