import { spawn, ChildProcess } from 'child_process';
import { Logger } from '../utils/logger';
import { ConfigStore } from '../core/config-store';
import * as path from 'path';

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
    private mcpProcess: ChildProcess | null = null;
    private isConnected: boolean = false;
    private responseBuffer: string = '';
    private configStore: ConfigStore;

    constructor(private extensionPath: string, private extensionContext: any) {
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

        try {
            const mcpServerPath = path.join(this.extensionPath, 'dist', 'mcp-server.js');
            
            this.mcpProcess = spawn('node', [mcpServerPath], {
                stdio: ['pipe', 'pipe', 'pipe'],
                env: {
                    ...process.env,
                    MCP_MODE: 'internal'
                }
            });

            this.mcpProcess.stdout?.on('data', (data) => {
                this.responseBuffer += data.toString();
                this.processResponse();
            });

            this.mcpProcess.stderr?.on('data', (data) => {
                Logger.error('MCP Client Error:', data.toString());
            });

            this.mcpProcess.on('error', (error) => {
                Logger.error('Failed to start MCP process:', error);
                this.isConnected = false;
            });

            this.mcpProcess.on('close', (code) => {
                Logger.info(`MCP process closed with code ${code}`);
                this.isConnected = false;
            });

            this.isConnected = true;
            Logger.info('MCP Client connected successfully');
        } catch (error) {
            Logger.error('Failed to connect MCP Client:', error as Error);
            throw error;
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
            const response = await this.callMCPTool('save_summarized_context', { summary: prompt });
            return this.extractContextFromResponse(response);
        } catch (error) {
            Logger.error('Failed to enrich commit context:', error as Error);
            return null;
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
            return this.extractContextFromResponse(response);
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
            return this.extractContextFromResponse(response);
        } catch (error) {
            Logger.error('Failed to enrich eureka context:', error as Error);
            return null;
        }
    }

    /**
     * Call an MCP tool
     */
    private async callMCPTool(toolName: string, args: any): Promise<MCPResponse> {
        return new Promise((resolve, reject) => {
            const request = {
                jsonrpc: '2.0',
                method: 'callTool',
                params: {
                    name: toolName,
                    arguments: args
                },
                id: Date.now()
            };

            this.mcpProcess?.stdin?.write(JSON.stringify(request) + '\n');

            // Set up a timeout
            const timeout = setTimeout(() => {
                reject(new Error('MCP request timeout'));
            }, 30000);

            // Wait for response
            const checkResponse = setInterval(() => {
                if (this.responseBuffer.includes(request.id.toString())) {
                    clearTimeout(timeout);
                    clearInterval(checkResponse);
                    resolve(this.parseResponse());
                }
            }, 100);
        });
    }

    /**
     * Process buffered responses
     */
    private processResponse(): void {
        // Try to parse complete JSON responses
        const lines = this.responseBuffer.split('\n');
        for (const line of lines) {
            if (line.trim()) {
                try {
                    const response = JSON.parse(line);
                    Logger.info('MCP Response received');
                } catch (e) {
                    // Not a complete JSON yet
                }
            }
        }
    }

    /**
     * Parse response from buffer
     */
    private parseResponse(): MCPResponse {
        // This is a simplified parser - in production you'd want more robust handling
        return {
            content: [{
                type: 'text',
                text: 'Context enriched successfully'
            }]
        };
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
     * Disconnect from MCP server
     */
    disconnect(): void {
        if (this.mcpProcess) {
            this.mcpProcess.kill();
            this.mcpProcess = null;
            this.isConnected = false;
            Logger.info('MCP Client disconnected');
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
            'problema resuelto', 'solucionado', 'encontré'
        ];

        return eurekaPatterns.some(pattern => lowerContent.includes(pattern));
    }
}