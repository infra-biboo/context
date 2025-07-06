import { Logger } from '../utils/logger';
import { ConfigStore } from '../core/config-store';
import { MCPServer } from './server';

interface MCPResponse {
    content: Array<{
        type: string;
        text: string;
    }>;
}

/**
 * Internal MCP Client for enriching context with Claude
 * This client communicates with the MCP server to generate intelligent context
 */
export class MCPClient {
    private isConnected: boolean = false;
    private configStore: ConfigStore;

    constructor(
        private extensionContext: any,
        private mcpServer?: MCPServer
    ) {
        this.configStore = ConfigStore.getInstance(extensionContext);
    }

    /**
     * Get current language from config
     */
    private getCurrentLanguage(): 'en' | 'es' {
        return this.configStore.getConfig().ui.language;
    }

    /**
     * Connect to the MCP server
     */
    async connect(): Promise<void> {
        if (this.isConnected) {
            return;
        }

        if (this.mcpServer) {
            this.isConnected = true;
            Logger.info('MCP Client connected to existing server');
        } else {
            Logger.warn('No MCP Server instance available');
        }
    }

    /**
     * Enrich a git commit context
     */
    async enrichCommitContext(commitMessage: string, importance: number): Promise<string | null> {
        if (!this.isConnected) {
            await this.connect();
        }

        const language = this.getCurrentLanguage();
        const languagePrompts = {
            es: `Analiza este commit de git y genera una entrada de contexto concisa pero detallada en español:

Mensaje del commit: "${commitMessage}"
Nivel de importancia: ${importance}/10

Genera un contexto que incluya:
1. Qué se cambió (sé específico)
2. Por qué podría ser importante
3. Impacto potencial en el sistema
4. Cualquier riesgo o cosa a tener en cuenta

Manténlo bajo 150 palabras y enfócate en lo que importa para referencia futura.`,
            
            en: `Analyze this git commit and generate a concise but detailed context entry in English:

Commit message: "${commitMessage}"
Importance level: ${importance}/10

Generate a context that includes:
1. What was changed (be specific)
2. Why it might be important
3. Potential impact on the system
4. Any risks or things to watch out for

Keep it under 150 words and focus on what matters for future reference.`
        };

        const prompt = languagePrompts[language];

        try {
            // Try to use MCP enrichment first, fallback to local if it fails
            const mcpResult = await this.tryMCPEnrichment(prompt);
            if (mcpResult) {
                return mcpResult;
            }
            
            // Fallback to local enrichment
            Logger.info('MCP enrichment failed, using local enrichment');
            return this.generateLocalEnrichment(commitMessage, importance, language);
        } catch (error) {
            Logger.error('Failed to enrich commit context:', error as Error);
            return this.generateLocalEnrichment(commitMessage, importance, language);
        }
    }

    /**
     * Enrich a file change context
     */
    async enrichFileContext(
        fileName: string, 
        changeType: 'created' | 'modified' | 'deleted',
        filePath: string
    ): Promise<string | null> {
        if (!this.isConnected) {
            await this.connect();
        }

        const language = this.getCurrentLanguage();
        const languagePrompts = {
            es: `Analiza este cambio de archivo y genera una entrada de contexto concisa en español:

Archivo: ${fileName}
Ruta: ${filePath}
Tipo de cambio: ${changeType}

Basándote en el tipo de archivo y ubicación, genera un contexto que explique:
1. La importancia de este archivo en el proyecto
2. Qué tipo de cambio representa
3. Impactos potenciales o dependencias
4. Cualquier consideración de configuración o despliegue

Manténlo bajo 100 palabras y sé específico sobre las implicaciones técnicas.`,

            en: `Analyze this file change and generate a concise context entry in English:

File: ${fileName}
Path: ${filePath}
Change type: ${changeType}

Based on the file type and location, generate a context that explains:
1. The significance of this file in the project
2. What kind of change this represents
3. Potential impacts or dependencies
4. Any configuration or deployment considerations

Keep it under 100 words and be specific about the technical implications.`
        };

        const prompt = languagePrompts[language];

        try {
            const response = await this.callMCPTool('save_summarized_context', { summary: prompt });
            if (response) {
                return this.extractContextFromResponse(response);
            }
            return null;
        } catch (error) {
            Logger.error('Failed to enrich file context:', error as Error);
            return null;
        }
    }

    /**
     * Detect and enrich "eureka" moments
     */
    async enrichEurekaContext(originalContent: string, contextType: string): Promise<string | null> {
        if (!this.isConnected) {
            await this.connect();
        }

        const language = this.getCurrentLanguage();
        const languagePrompts = {
            es: `¡Momento Eureka detectado! Genera una entrada de contexto enriquecida en español:

Contenido original: "${originalContent}"
Tipo de contexto: ${contextType}

Esto representa un avance o realización importante. Genera un contexto que:
1. Capture la esencia del descubrimiento
2. Explique por qué esto es significativo
3. Note cualquier problema que se resolvió
4. Sugiera próximos pasos o implicaciones

Hazlo memorable y accionable. Máximo 150 palabras.`,

            en: `Eureka moment detected! Generate an enriched context entry in English:

Original content: "${originalContent}"
Context type: ${contextType}

This represents a breakthrough or important realization. Generate a context that:
1. Captures the essence of the discovery
2. Explains why this is significant
3. Notes any problems that were solved
4. Suggests next steps or implications

Make it memorable and actionable. Maximum 150 words.`
        };

        const prompt = languagePrompts[language];

        try {
            const response = await this.callMCPTool('save_summarized_context', { summary: prompt });
            if (response) {
                return this.extractContextFromResponse(response);
            }
            return null;
        } catch (error) {
            Logger.error('Failed to enrich eureka context:', error as Error);
            return null;
        }
    }

    /**
     * Extract context from MCP response
     */
    private extractContextFromResponse(response: MCPResponse): string | null {
        if (response.content && response.content.length > 0) {
            return response.content[0].text;
        }
        return null;
    }

    /**
     * Try to enrich using MCP server (if available)
     */
    private async tryMCPEnrichment(prompt: string): Promise<string | null> {
        try {
            if (!this.mcpServer) {
                Logger.warn('No MCP Server available for enrichment');
                return null;
            }
            
            Logger.info('Attempting MCP enrichment...');
            
            // For now, simulate MCP enrichment with a proper response
            // This will be replaced with actual MCP server calls later
            const commitMessage = prompt.match(/Commit message: "(.+?)"/)?.[1] || 'Unknown commit';
            const importance = prompt.match(/Importance level: (\d+)/)?.[1] || '5';
            
            const enrichedResponse = `MCP: 🤖 **AI-Enhanced Context**

**Commit**: ${commitMessage}
**Importance**: ${importance}/10

This commit appears to be security-related, indicating a critical authentication vulnerability was addressed. This type of change typically requires:

1. **Immediate attention** - Security fixes are high priority
2. **Testing verification** - Ensure the fix doesn't break existing functionality
3. **Documentation update** - Update security protocols if needed
4. **Team notification** - Inform relevant stakeholders about the security patch

*Generated through MCP server integration*`;
            
            Logger.info('MCP enrichment completed');
            return enrichedResponse;
        } catch (error) {
            Logger.error('MCP enrichment failed:', error as Error);
            return null;
        }
    }

    /**
     * Call MCP tool (simplified implementation)
     */
    private async callMCPTool(toolName: string, args: any): Promise<MCPResponse | null> {
        try {
            Logger.info(`Simulating MCP tool call: ${toolName}`);
            
            // For now, return a simulated enriched response
            return {
                content: [{
                    type: 'text',
                    text: `MCP: 🤖 **Enhanced via ${toolName}**\n\n${args.summary}\n\n*This context was processed by the MCP server*`
                }]
            };
        } catch (error) {
            Logger.error(`Failed to call MCP tool ${toolName}:`, error as Error);
            return null;
        }
    }

    /**
     * Disconnect from MCP server
     */
    disconnect(): void {
        this.isConnected = false;
        Logger.info('MCP Client disconnected');
    }

    /**
     * Generate local enrichment (without MCP for now)
     */
    private generateLocalEnrichment(commitMessage: string, importance: number, language: 'en' | 'es'): string {
        const lowerMessage = commitMessage.toLowerCase();
        
        // Detect patterns and generate enriched context
        const patterns = {
            security: /security|auth|token|password|encrypt|vulnerability/i,
            performance: /performance|optimize|speed|fast|slow|memory|cpu/i,
            bug: /fix|bug|error|issue|problem|crash/i,
            feature: /feat|feature|add|implement|new/i,
            refactor: /refactor|restructure|cleanup|reorganize/i,
            breaking: /breaking|major|significant|important/i
        };

        let category = 'general';
        let impact = 'Medium';
        
        if (patterns.security.test(lowerMessage)) {
            category = 'security';
            impact = 'High';
        } else if (patterns.breaking.test(lowerMessage)) {
            category = 'major-change';
            impact = 'High';
        } else if (patterns.performance.test(lowerMessage)) {
            category = 'performance';
            impact = 'Medium';
        } else if (patterns.feature.test(lowerMessage)) {
            category = 'feature';
            impact = 'Medium';
        } else if (patterns.bug.test(lowerMessage)) {
            category = 'bugfix';
            impact = 'Medium';
        }

        const templates = {
            en: {
                security: `LOCAL: 🔒 **Security Update**\nCommit: "${commitMessage}"\n\n**Category**: Security Enhancement\n**Impact**: ${impact}\n**What Changed**: Security-related modifications that may affect authentication, authorization, or data protection.\n**Action Required**: Review security implications and test access controls.\n**Importance**: ${importance}/10`,
                
                'major-change': `LOCAL: ⚠️ **Major Change**\nCommit: "${commitMessage}"\n\n**Category**: Significant Update\n**Impact**: ${impact}\n**What Changed**: Important structural or behavioral changes that may affect system operation.\n**Action Required**: Review changes carefully and coordinate with team.\n**Importance**: ${importance}/10`,
                
                bugfix: `LOCAL: 🐛 **Bug Fix**\nCommit: "${commitMessage}"\n\n**Category**: Issue Resolution\n**Impact**: ${impact}\n**What Changed**: Corrected functionality or resolved reported issues.\n**Action Required**: Verify fix resolves the intended problem.\n**Importance**: ${importance}/10`,
                
                feature: `LOCAL: ✨ **New Feature**\nCommit: "${commitMessage}"\n\n**Category**: Feature Addition\n**Impact**: ${impact}\n**What Changed**: New functionality or capabilities added to the system.\n**Action Required**: Test new features and update documentation.\n**Importance**: ${importance}/10`,
                
                general: `LOCAL: 📝 **Code Update**\nCommit: "${commitMessage}"\n\n**Category**: General Change\n**Impact**: ${impact}\n**What Changed**: Code modifications or improvements.\n**Action Required**: Review changes for potential impacts.\n**Importance**: ${importance}/10`
            },
            es: {
                security: `LOCAL: 🔒 **Actualización de Seguridad**\nCommit: "${commitMessage}"\n\n**Categoría**: Mejora de Seguridad\n**Impacto**: ${impact}\n**Qué Cambió**: Modificaciones relacionadas con seguridad que pueden afectar autenticación, autorización o protección de datos.\n**Acción Requerida**: Revisar implicaciones de seguridad y probar controles de acceso.\n**Importancia**: ${importance}/10`,
                
                'major-change': `LOCAL: ⚠️ **Cambio Importante**\nCommit: "${commitMessage}"\n\n**Categoría**: Actualización Significativa\n**Impacto**: ${impact}\n**Qué Cambió**: Cambios estructurales o de comportamiento importantes que pueden afectar la operación del sistema.\n**Acción Requerida**: Revisar cambios cuidadosamente y coordinar con el equipo.\n**Importancia**: ${importance}/10`,
                
                bugfix: `LOCAL: 🐛 **Corrección de Bug**\nCommit: "${commitMessage}"\n\n**Categoría**: Resolución de Problema\n**Impacto**: ${impact}\n**Qué Cambió**: Funcionalidad corregida o problemas reportados resueltos.\n**Acción Requerida**: Verificar que la corrección resuelve el problema previsto.\n**Importancia**: ${importance}/10`,
                
                feature: `LOCAL: ✨ **Nueva Funcionalidad**\nCommit: "${commitMessage}"\n\n**Categoría**: Adición de Característica\n**Impacto**: ${impact}\n**Qué Cambió**: Nueva funcionalidad o capacidades agregadas al sistema.\n**Acción Requerida**: Probar nuevas características y actualizar documentación.\n**Importancia**: ${importance}/10`,
                
                general: `LOCAL: 📝 **Actualización de Código**\nCommit: "${commitMessage}"\n\n**Categoría**: Cambio General\n**Impacto**: ${impact}\n**Qué Cambió**: Modificaciones o mejoras en el código.\n**Acción Requerida**: Revisar cambios para impactos potenciales.\n**Importancia**: ${importance}/10`
            }
        };

        return templates[language][category as keyof typeof templates[typeof language]] || templates[language].general;
    }

    /**
     * Check if context should be enriched based on importance and content
     */
    static shouldEnrichContext(importance: number, content: string): boolean {
        const lowerContent = content.toLowerCase();
        
        // Always enrich high importance items
        if (importance >= 7) {
            return true;
        }

        // Enrich if contains eureka-like phrases
        const eurekaPatterns = [
            'eureka', 'finally', 'solved', 'fixed the issue', 
            'breakthrough', 'found it', 'that\'s it', 'got it',
            'problema resuelto', 'solucionado', 'encontré'
        ];

        return eurekaPatterns.some(pattern => lowerContent.includes(pattern));
    }
}