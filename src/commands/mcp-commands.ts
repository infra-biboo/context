import * as vscode from 'vscode';
import { MCPConfigGenerator } from '../mcp/config-generator';

export function registerMCPCommands(context: vscode.ExtensionContext) {
    const mcpConfigGenerator = new MCPConfigGenerator(context.extensionPath);

    const generateConfigCommand = vscode.commands.registerCommand(
        'claude-context.generateMCPConfig',
        async () => {
            try {
                await mcpConfigGenerator.generateClaudeCodeConfig();
                vscode.window.showInformationMessage('MCP configuration generated successfully!');
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to generate MCP config: ${error}`);
            }
        }
    );

    context.subscriptions.push(generateConfigCommand);
}