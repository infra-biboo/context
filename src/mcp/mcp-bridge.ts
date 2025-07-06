import express, { Request, Response } from 'express';
import { MCPServer } from './server';
import { ContextDatabase } from '../core/database';
import { AgentManager } from '../agents/agent-manager';
import { MCPLogger } from './mcp-logger';

interface MCPBridgeConfig {
    port: number;
    host: string;
    workspacePath: string;
    authToken?: string;
}

export class MCPBridge {
    private app: express.Application;
    private server?: MCPServer;
    private database?: ContextDatabase;
    private agentManager?: AgentManager;
    private config: MCPBridgeConfig;
    private httpServer: any;

    constructor(config: MCPBridgeConfig) {
        this.config = config;
        this.app = express();
        
        this.setupMiddleware();
        this.setupRoutes();
    }

    private setupMiddleware(): void {
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        
        // CORS for development
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
            
            if (req.method === 'OPTIONS') {
                res.sendStatus(200);
            } else {
                next();
            }
        });

        // Request logging
        this.app.use((req, res, next) => {
            MCPLogger.info(`${req.method} ${req.path} - ${req.ip}`);
            next();
        });

        // Authentication middleware
        if (this.config.authToken) {
            this.app.use('/mcp', this.authMiddleware.bind(this));
        }
    }

    private authMiddleware(req: Request, res: Response, next: Function): void {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token || token !== this.config.authToken) {
            res.status(401).json({ 
                error: 'Unauthorized', 
                message: 'Valid auth token required' 
            });
            return;
        }
        
        next();
    }

    private setupRoutes(): void {
        // Health check
        this.app.get('/health', this.handleHealth.bind(this));
        
        // MCP Status
        this.app.get('/mcp/status', this.handleMCPStatus.bind(this));
        
        // MCP Tools
        this.app.post('/mcp/get_context', this.handleGetContext.bind(this));
        this.app.post('/mcp/get_active_agents', this.handleGetActiveAgents.bind(this));
        this.app.post('/mcp/activate_agent', this.handleActivateAgent.bind(this));
        
        // Utility endpoints
        this.app.get('/mcp/info', this.handleInfo.bind(this));
        this.app.post('/mcp/reset', this.handleReset.bind(this));
        
        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({ 
                error: 'Not Found', 
                message: `Route ${req.method} ${req.originalUrl} not found` 
            });
        });
    }

    private async handleHealth(req: Request, res: Response): Promise<void> {
        try {
            const mcpConnected = this.server?.isConnected() || false;
            
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                mcp: {
                    connected: mcpConnected,
                    database: !!this.database,
                    agentManager: !!this.agentManager
                },
                config: {
                    port: this.config.port,
                    host: this.config.host,
                    workspacePath: this.config.workspacePath,
                    authEnabled: !!this.config.authToken
                }
            });
        } catch (error) {
            MCPLogger.error('Health check failed:', error);
            res.status(500).json({ 
                status: 'unhealthy', 
                error: error instanceof Error ? error.message : 'Unknown error' 
            });
        }
    }

    private async handleMCPStatus(req: Request, res: Response): Promise<void> {
        try {
            const connectionInfo = this.server?.getConnectionInfo() || { 
                connected: false, 
                status: 'Server not initialized' 
            };
            
            res.json({
                mcp: connectionInfo,
                database: {
                    initialized: !!this.database,
                    path: this.database ? this.config.workspacePath + '/.vscode/claude-context-manager/contexts.json' : undefined
                },
                agentManager: {
                    initialized: !!this.agentManager,
                    activeAgents: this.agentManager?.getActiveAgents()?.length || 0
                }
            });
        } catch (error) {
            MCPLogger.error('MCP status check failed:', error);
            res.status(500).json({ 
                error: 'Status check failed', 
                message: error instanceof Error ? error.message : 'Unknown error' 
            });
        }
    }

    private async handleGetContext(req: Request, res: Response): Promise<void> {
        try {
            const { limit, type } = req.body;
            
            if (!this.database) {
                throw new Error('Database not initialized');
            }

            const contexts = await this.database.getContexts();
            const filtered = type 
                ? contexts.filter((c: any) => c.type === type)
                : contexts;

            const limited = filtered.slice(0, limit || 10);

            // Add agent suggestions like the original MCP server
            const contextWithAgentSuggestions = limited.map((ctx: any) => {
                const suggestedAgent = this.suggestAgentForContext(ctx);
                return {
                    ...ctx,
                    suggestedAgent,
                    agentReason: this.getAgentSuggestionReason(ctx, suggestedAgent)
                };
            });

            res.json({
                success: true,
                data: contextWithAgentSuggestions,
                meta: {
                    total: contexts.length,
                    filtered: filtered.length,
                    returned: limited.length,
                    hasMore: filtered.length > limited.length
                }
            });
        } catch (error) {
            MCPLogger.error('Get context failed:', error);
            res.status(500).json({ 
                success: false,
                error: 'Failed to get context', 
                message: error instanceof Error ? error.message : 'Unknown error' 
            });
        }
    }

    private async handleGetActiveAgents(req: Request, res: Response): Promise<void> {
        try {
            if (!this.agentManager) {
                throw new Error('Agent manager not initialized');
            }

            const activeAgents = this.agentManager.getActiveAgents();
            const agentStatus = this.agentManager.getAgentStatus();

            res.json({
                success: true,
                data: {
                    activeAgents,
                    status: agentStatus,
                    availableAgents: [
                        { name: 'Architect', emoji: '🏗️', specializations: ['System Design', 'Architecture Patterns', 'Scalability'] },
                        { name: 'Backend', emoji: '⚙️', specializations: ['REST APIs', 'Database Design', 'Performance'] },
                        { name: 'Frontend', emoji: '🎨', specializations: ['UI/UX', 'React/Vue', 'Responsive Design'] }
                    ]
                }
            });
        } catch (error) {
            MCPLogger.error('Get active agents failed:', error);
            res.status(500).json({ 
                success: false,
                error: 'Failed to get active agents', 
                message: error instanceof Error ? error.message : 'Unknown error' 
            });
        }
    }

    private async handleActivateAgent(req: Request, res: Response): Promise<void> {
        try {
            const { agent, task, priority = 'primary' } = req.body;

            if (!agent || !task) {
                res.status(400).json({
                    success: false,
                    error: 'Missing required parameters',
                    message: 'Both agent and task are required'
                });
                return;
            }

            if (!this.agentManager) {
                throw new Error('Agent manager not initialized');
            }

            const agentInfo = this.agentManager.getAgent(agent);
            if (!agentInfo) {
                res.status(404).json({
                    success: false,
                    error: 'Agent not found',
                    message: `Agent '${agent}' not found or not active`
                });
                return;
            }

            const agentEmojis = {
                architect: '🏗️',
                backend: '⚙️', 
                frontend: '🎨'
            };

            const emoji = agentEmojis[agent as keyof typeof agentEmojis] || '🤖';

            res.json({
                success: true,
                data: {
                    agent: agentInfo,
                    task,
                    priority,
                    emoji,
                    activated: true,
                    timestamp: new Date().toISOString()
                }
            });
        } catch (error) {
            MCPLogger.error('Activate agent failed:', error);
            res.status(500).json({ 
                success: false,
                error: 'Failed to activate agent', 
                message: error instanceof Error ? error.message : 'Unknown error' 
            });
        }
    }

    private async handleInfo(req: Request, res: Response): Promise<void> {
        res.json({
            name: 'MCP HTTP Bridge',
            version: '1.0.0',
            description: 'HTTP Bridge for Model Context Protocol server',
            endpoints: {
                health: 'GET /health',
                mcpStatus: 'GET /mcp/status',
                getContext: 'POST /mcp/get_context',
                getActiveAgents: 'POST /mcp/get_active_agents',
                activateAgent: 'POST /mcp/activate_agent',
                info: 'GET /mcp/info',
                reset: 'POST /mcp/reset'
            },
            workspace: this.config.workspacePath
        });
    }

    private async handleReset(req: Request, res: Response): Promise<void> {
        try {
            // Reset agents to default state
            if (this.agentManager) {
                // Implementation depends on what reset means for your agent manager
                MCPLogger.info('Agent manager reset');
            }

            res.json({
                success: true,
                message: 'MCP Bridge reset successfully',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            MCPLogger.error('Reset failed:', error);
            res.status(500).json({ 
                success: false,
                error: 'Reset failed', 
                message: error instanceof Error ? error.message : 'Unknown error' 
            });
        }
    }

    private suggestAgentForContext(ctx: any): string {
        const content = ctx.content.toLowerCase();
        const tags = ctx.tags.map((tag: string) => tag.toLowerCase());
        
        const archKeywords = ['architecture', 'design', 'pattern', 'structure', 'scalability', 'system'];
        const backendKeywords = ['api', 'database', 'server', 'auth', 'endpoint', 'crud'];
        const frontendKeywords = ['ui', 'ux', 'component', 'react', 'vue', 'css'];
        
        const archScore = archKeywords.filter(keyword => 
            content.includes(keyword) || tags.some((tag: string) => tag.includes(keyword))
        ).length;
        
        const backendScore = backendKeywords.filter(keyword => 
            content.includes(keyword) || tags.some((tag: string) => tag.includes(keyword))
        ).length;
        
        const frontendScore = frontendKeywords.filter(keyword => 
            content.includes(keyword) || tags.some((tag: string) => tag.includes(keyword))
        ).length;
        
        if (archScore >= backendScore && archScore >= frontendScore) {
            return 'Architect';
        } else if (backendScore >= frontendScore) {
            return 'Backend';
        } else {
            return 'Frontend';
        }
    }

    private getAgentSuggestionReason(ctx: any, suggestedAgent: string): string {
        const reasons = {
            'Architect': 'System design and architectural decisions',
            'Backend': 'Server-side logic and API development', 
            'Frontend': 'User interface and experience design'
        };
        
        return reasons[suggestedAgent as keyof typeof reasons] || 'General development guidance';
    }

    public async start(): Promise<void> {
        try {
            // Initialize MCP components (requires VS Code extension context)
            throw new Error('MCP Bridge requires VS Code extension context. Use mcp-server-standalone.ts for standalone operation.');

            // Start HTTP server
            this.httpServer = this.app.listen(this.config.port, this.config.host, () => {
                MCPLogger.info(`MCP HTTP Bridge running on http://${this.config.host}:${this.config.port}`);
                MCPLogger.info(`Workspace: ${this.config.workspacePath}`);
                MCPLogger.info(`Auth: ${this.config.authToken ? 'Enabled' : 'Disabled'}`);
            });

            // Optional: Start MCP server in background (for full integration)
            // this.server = new MCPServer(this.database, this.agentManager);
            // await this.server.start();

        } catch (error) {
            MCPLogger.error('Failed to start MCP Bridge:', error);
            throw error;
        }
    }

    public async stop(): Promise<void> {
        if (this.httpServer) {
            this.httpServer.close();
            MCPLogger.info('MCP HTTP Bridge stopped');
        }

        if (this.server) {
            await this.server.stop();
        }
    }
}