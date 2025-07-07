import { Logger } from '../utils/logger';
import { ConfigStore } from '../core/config-store';
import { CascadeEnrichmentService } from './cascade-enrichment-service';
import { RealMCPClient } from './real-mcp-client';
import * as vscode from 'vscode';

/**
 * Modernized MCP Client - Replaces all simulated functionality
 * 
 * This client now provides:
 * - Real MCP communication (no more simulations)
 * - Cascade enrichment (Claude → API → Local)
 * - Proper error handling and fallbacks
 * - Bilingual support (Spanish/English)
 */
export class MCPClient {
    private isConnected: boolean = false;
    private configStore: ConfigStore;
    private enrichmentService: CascadeEnrichmentService;
    private realMCPClient?: RealMCPClient;

    constructor(
        private extensionContext: vscode.ExtensionContext
    ) {
        this.configStore = ConfigStore.getInstance(extensionContext);
        this.enrichmentService = new CascadeEnrichmentService(extensionContext);
        
        // Initialize real MCP client if MCP is enabled
        if (this.isMCPEnabled()) {
            this.realMCPClient = new RealMCPClient();
        }
        
        Logger.info(`MCPClient created. Real MCP: ${!!this.realMCPClient}`);
    }

    /**
     * Get current language from config
     */
    private getCurrentLanguage(): 'en' | 'es' {
        return this.configStore.getConfig().ui.language;
    }

    /**
     * Check if MCP is enabled in settings
     */
    private isMCPEnabled(): boolean {
        const config = vscode.workspace.getConfiguration('claude-context');
        return config.get('enableMCP', false);
    }

    /**
     * Connect to the MCP server
     */
    async connect(): Promise<void> {
        if (this.isConnected) {
            return;
        }

        try {
            if (this.realMCPClient) {
                await this.realMCPClient.connect();
                this.isConnected = true;
                Logger.info('✅ MCP Client connected to real MCP server');
            } else {
                // No MCP server - running in standalone mode
                this.isConnected = true;
                Logger.info('✅ MCP Client initialized in standalone mode (no MCP server)');
            }
        } catch (error) {
            Logger.warn('Failed to connect to MCP server, continuing in standalone mode', error);
            this.isConnected = true; // Still allow enrichment via cascade service
        }
    }

    /**
     * Enrich a git commit context using cascade strategy
     */
    async enrichCommitContext(commitMessage: string, importance: number): Promise<string | null> {
        if (!this.isConnected) {
            await this.connect();
        }

        const language = this.getCurrentLanguage();
        const content = this.formatCommitForEnrichment(commitMessage, importance, language);

        try {
            // Use cascade enrichment service (Claude → API → Local)
            const enrichedContent = await this.enrichmentService.enrichContext(content, importance);
            Logger.info('✅ Commit context enriched successfully');
            return enrichedContent;
        } catch (error) {
            Logger.error('Failed to enrich commit context', error);
            // Final fallback to simple local enrichment
            return this.generateSimpleLocalEnrichment(commitMessage, importance, language);
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
        const content = this.formatFileChangeForEnrichment(fileName, changeType, filePath, language);
        const importance = this.calculateFileImportance(fileName, changeType);

        try {
            const enrichedContent = await this.enrichmentService.enrichContext(content, importance);
            Logger.info('✅ File context enriched successfully');
            return enrichedContent;
        } catch (error) {
            Logger.error('Failed to enrich file context', error);
            return this.generateSimpleLocalEnrichment(content, importance, language);
        }
    }

    /**
     * Enrich "eureka" moments with high priority
     */
    async enrichEurekaContext(originalContent: string, contextType: string): Promise<string | null> {
        if (!this.isConnected) {
            await this.connect();
        }

        const language = this.getCurrentLanguage();
        const content = this.formatEurekaForEnrichment(originalContent, contextType, language);
        const importance = 9; // Eureka moments are always high importance

        try {
            const enrichedContent = await this.enrichmentService.enrichContext(content, importance);
            Logger.info('✅ Eureka context enriched successfully');
            return `🎉 MOMENTO EUREKA: ${enrichedContent}`;
        } catch (error) {
            Logger.error('Failed to enrich eureka context', error);
            return this.generateSimpleLocalEnrichment(originalContent, importance, language);
        }
    }

    /**
     * Add context directly via MCP (if available)
     */
    async addContextViaMCP(content: string, type: string, importance: number): Promise<string | null> {
        if (!this.realMCPClient || !this.realMCPClient.isConnected()) {
            Logger.warn('MCP not available for adding context');
            return null;
        }

        try {
            const result = await this.realMCPClient.addContext(content, type, importance);
            Logger.info('✅ Context added via MCP');
            return result;
        } catch (error) {
            Logger.error('Failed to add context via MCP', error);
            return null;
        }
    }

    /**
     * Get context from MCP server (if available)
     */
    async getContextViaMCP(limit: number = 10, type?: string): Promise<string | null> {
        if (!this.realMCPClient || !this.realMCPClient.isConnected()) {
            Logger.warn('MCP not available for getting context');
            return null;
        }

        try {
            const result = await this.realMCPClient.getContext(limit, type);
            Logger.info('✅ Context retrieved via MCP');
            return result;
        } catch (error) {
            Logger.error('Failed to get context via MCP', error);
            return null;
        }
    }

    /**
     * Format commit message for enrichment
     */
    private formatCommitForEnrichment(commitMessage: string, importance: number, language: 'en' | 'es'): string {
        const templates = {
            en: `Git Commit Analysis:
Message: "${commitMessage}"
Importance: ${importance}/10

Please analyze this commit and provide context about what changed, why it's important, potential impacts, and any risks to watch out for.`,
            
            es: `Análisis de Commit Git:
Mensaje: "${commitMessage}"
Importancia: ${importance}/10

Por favor analiza este commit y proporciona contexto sobre qué cambió, por qué es importante, impactos potenciales, y cualquier riesgo a considerar.`
        };
        
        return templates[language];
    }

    /**
     * Format file change for enrichment
     */
    private formatFileChangeForEnrichment(fileName: string, changeType: string, filePath: string, language: 'en' | 'es'): string {
        const templates = {
            en: `File Change Analysis:
File: ${fileName}
Path: ${filePath}
Change: ${changeType}

Please analyze the significance of this file change, its potential impacts, and any considerations based on the file type and location.`,
            
            es: `Análisis de Cambio de Archivo:
Archivo: ${fileName}
Ruta: ${filePath}
Cambio: ${changeType}

Por favor analiza la importancia de este cambio de archivo, sus impactos potenciales, y cualquier consideración basada en el tipo de archivo y ubicación.`
        };
        
        return templates[language];
    }

    /**
     * Format eureka moment for enrichment
     */
    private formatEurekaForEnrichment(originalContent: string, contextType: string, language: 'en' | 'es'): string {
        const templates = {
            en: `Eureka Moment Detected:
Content: "${originalContent}"
Type: ${contextType}

This represents a breakthrough or important realization. Please capture the essence of the discovery, explain why it's significant, and suggest next steps.`,
            
            es: `Momento Eureka Detectado:
Contenido: "${originalContent}"
Tipo: ${contextType}

Esto representa un avance o realización importante. Por favor captura la esencia del descubrimiento, explica por qué es significativo, y sugiere próximos pasos.`
        };
        
        return templates[language];
    }

    /**
     * Calculate file importance based on type and change
     */
    private calculateFileImportance(fileName: string, changeType: string): number {
        const ext = fileName.split('.').pop()?.toLowerCase();
        let importance = 5; // Default
        
        // High importance files
        if (['ts', 'js', 'py', 'java', 'c', 'cpp'].includes(ext || '')) {
            importance += 1;
        }
        
        // Configuration files
        if (['json', 'yaml', 'yml', 'toml', 'ini', 'env'].includes(ext || '')) {
            importance += 2;
        }
        
        // Package/dependency files
        if (['package.json', 'requirements.txt', 'Cargo.toml', 'pom.xml'].includes(fileName)) {
            importance += 3;
        }
        
        // Change type impact
        if (changeType === 'deleted') {
            importance += 2;
        } else if (changeType === 'created') {
            importance += 1;
        }
        
        return Math.min(importance, 10);
    }

    /**
     * Generate simple local enrichment as final fallback
     */
    private generateSimpleLocalEnrichment(content: string, importance: number, language: 'en' | 'es'): string {
        const lowerContent = content.toLowerCase();
        
        // Detect patterns
        let category = 'general';
        if (/security|auth|token|password/.test(lowerContent)) {
            category = 'security';
        } else if (/fix|bug|error|issue/.test(lowerContent)) {
            category = 'bugfix';
        } else if (/feat|feature|new|add/.test(lowerContent)) {
            category = 'feature';
        } else if (/refactor|optimize|improve/.test(lowerContent)) {
            category = 'refactor';
        }

        const templates = {
            en: {
                security: `🔒 **Security Update** (${importance}/10)\nSecurity-related changes detected. Review authentication, authorization, and data protection implications.`,
                bugfix: `🐛 **Bug Fix** (${importance}/10)\nIssue resolution detected. Verify the fix resolves the intended problem without side effects.`,
                feature: `✨ **New Feature** (${importance}/10)\nNew functionality detected. Test the feature and update documentation as needed.`,
                refactor: `🔧 **Code Refactoring** (${importance}/10)\nCode improvement detected. Ensure behavior remains consistent after changes.`,
                general: `📝 **Code Change** (${importance}/10)\nCode modification detected. Review changes for potential impacts.`
            },
            es: {
                security: `🔒 **Actualización de Seguridad** (${importance}/10)\nCambios relacionados con seguridad detectados. Revisar implicaciones de autenticación, autorización y protección de datos.`,
                bugfix: `🐛 **Corrección de Bug** (${importance}/10)\nResolución de problema detectada. Verificar que la corrección resuelve el problema sin efectos secundarios.`,
                feature: `✨ **Nueva Funcionalidad** (${importance}/10)\nNueva funcionalidad detectada. Probar la característica y actualizar documentación según sea necesario.`,
                refactor: `🔧 **Refactorización de Código** (${importance}/10)\nMejora de código detectada. Asegurar que el comportamiento se mantiene consistente después de los cambios.`,
                general: `📝 **Cambio de Código** (${importance}/10)\nModificación de código detectada. Revisar cambios para impactos potenciales.`
            }
        };

        return `📝 Local: ${templates[language][category as keyof typeof templates[typeof language]] || templates[language].general}`;
    }

    /**
     * Disconnect from MCP server
     */
    async disconnect(): Promise<void> {
        try {
            if (this.realMCPClient) {
                await this.realMCPClient.disconnect();
            }
            this.isConnected = false;
            Logger.info('MCP Client disconnected');
        } catch (error) {
            Logger.error('Error disconnecting MCP client', error);
        }
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
            'problema resuelto', 'solucionado', 'encontré',
            '¡eureka!', 'por fin', 'resuelto'
        ];

        return eurekaPatterns.some(pattern => lowerContent.includes(pattern));
    }

    /**
     * Get connection status
     */
    getStatus(): { connected: boolean; mcpAvailable: boolean; enrichmentAvailable: boolean } {
        return {
            connected: this.isConnected,
            mcpAvailable: !!this.realMCPClient?.isConnected(),
            enrichmentAvailable: true // Cascade enrichment always available
        };
    }
}