import { MCPServer } from '../../mcp/server';
import { MCPConfigGenerator } from '../../mcp/config-generator';
import { Logger } from '../../utils/logger';

export class McpViewActions {
    constructor(
        private mcpServer: MCPServer,
        private mcpConfigGenerator: MCPConfigGenerator
    ) {}

    async generateMCPConfig(): Promise<void> {
        try {
            await this.mcpConfigGenerator.generateClaudeCodeConfig();
            Logger.info('MCP configuration generated successfully');
        } catch (error) {
            Logger.error('Failed to generate MCP config:', error as Error);
            throw error;
        }
    }

    async testMCPConnection(): Promise<boolean> {
        try {
            const connected = this.mcpServer.isConnected();
            return connected;
        } catch (error) {
            Logger.error('Error testing MCP connection:', error as Error);
            throw error;
        }
    }

    async getMCPStatus(): Promise<{ connected: boolean; status: string }> {
        try {
            const connectionInfo = this.mcpServer.getConnectionInfo();
            return connectionInfo;
        } catch (error) {
            Logger.error('Error getting MCP status:', error as Error);
            return { connected: false, status: `Error: ${error}` };
        }
    }

    async startMCPServer(): Promise<{ success: boolean; message: string }> {
        try {
            await this.mcpServer.start();
            Logger.info('MCP Server started successfully');
            return { success: true, message: 'MCP Server started successfully' };
        } catch (error) {
            Logger.error('Failed to start MCP server:', error as Error);
            return { success: false, message: `Failed to start: ${error}` };
        }
    }

    async stopMCPServer(): Promise<{ success: boolean; message: string }> {
        try {
            await this.mcpServer.stop();
            Logger.info('MCP Server stopped successfully');
            return { success: true, message: 'MCP Server stopped successfully' };
        } catch (error) {
            Logger.error('Failed to stop MCP server:', error as Error);
            return { success: false, message: `Failed to stop: ${error}` };
        }
    }
}