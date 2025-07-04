import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';

export class MCPConfigGenerator {
    constructor(private extensionPath: string) {}

    async generateClaudeCodeConfig(): Promise<void> {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            throw new Error('No workspace folder open');
        }

        const configDir = path.join(workspaceFolder.uri.fsPath, '.claude');
        const configPath = path.join(configDir, 'mcp.json');

        const config = {
            mcpServers: {
                "claude-context-manager": {
                    "command": "node",
                    "args": [
                        path.join(this.extensionPath, 'dist', 'mcp-server.js')
                    ],
                    "env": {
                        "WORKSPACE_PATH": workspaceFolder.uri.fsPath
                    }
                }
            }
        };

        try {
            await fs.mkdir(configDir, { recursive: true });
            await fs.writeFile(configPath, JSON.stringify(config, null, 2));
            
            vscode.window.showInformationMessage(
                `MCP configuration generated at ${configPath}`,
                'Open Config'
            ).then(action => {
                if (action === 'Open Config') {
                    vscode.window.showTextDocument(vscode.Uri.file(configPath));
                }
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to generate MCP config: ${error}`);
            throw error;
        }
    }
}