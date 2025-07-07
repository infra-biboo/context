import * as vscode from 'vscode';
import { MCPConfigGenerator } from '../mcp/config-generator';

export function registerMCPCommands(context: vscode.ExtensionContext) {
    const mcpConfigGenerator = new MCPConfigGenerator(context.extensionPath);

    // Generate Claude Code config
    const generateClaudeCodeConfigCommand = vscode.commands.registerCommand(
        'claude-context.generateMCPConfig',
        async () => {
            try {
                await mcpConfigGenerator.generateClaudeCodeConfig();
                vscode.window.showInformationMessage('Claude Code MCP configuration generated successfully!');
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to generate Claude Code MCP config: ${error}`);
            }
        }
    );

    // Generate Claude Desktop config
    const generateClaudeDesktopConfigCommand = vscode.commands.registerCommand(
        'claude-context.generateClaudeDesktopConfig',
        async () => {
            try {
                await mcpConfigGenerator.generateClaudeDesktopConfig();
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to generate Claude Desktop MCP config: ${error}`);
            }
        }
    );

    // Generate Cline config
    const generateClineConfigCommand = vscode.commands.registerCommand(
        'claude-context.generateClineConfig',
        async () => {
            try {
                await mcpConfigGenerator.generateClineConfig();
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to generate Cline MCP config: ${error}`);
            }
        }
    );

    // Generate Gemini config
    const generateGeminiConfigCommand = vscode.commands.registerCommand(
        'claude-context.generateGeminiConfig',
        async () => {
            try {
                await mcpConfigGenerator.generateGeminiConfig();
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to generate Gemini MCP config: ${error}`);
            }
        }
    );

    context.subscriptions.push(generateClaudeCodeConfigCommand);
    context.subscriptions.push(generateClaudeDesktopConfigCommand);
    context.subscriptions.push(generateClineConfigCommand);
    context.subscriptions.push(generateGeminiConfigCommand);
}