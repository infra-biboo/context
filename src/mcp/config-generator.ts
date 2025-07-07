import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';

export class MCPConfigGenerator {
    constructor(private extensionPath: string) {}

    async generateClineConfig(): Promise<void> {
        // Cline uses VS Code's global storage for MCP configuration
        const homeDir = process.env.HOME || process.env.USERPROFILE;
        if (!homeDir) {
            throw new Error('Could not determine home directory');
        }
        
        // Cline's actual MCP settings path - cross-platform
        let configDir: string;
        if (process.platform === 'darwin') {
            // macOS
            configDir = path.join(homeDir, 'Library', 'Application Support', 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings');
        } else if (process.platform === 'win32') {
            // Windows
            configDir = path.join(homeDir, 'AppData', 'Roaming', 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings');
        } else {
            // Linux
            configDir = path.join(homeDir, '.config', 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings');
        }
        const configPath = path.join(configDir, 'cline_mcp_settings.json');

        // Read existing config or create new one
        let existingConfig: any = {};
        try {
            const existingContent = await fs.readFile(configPath, 'utf8');
            existingConfig = JSON.parse(existingContent);
        } catch {
            // File doesn't exist, start with empty config
            existingConfig = { mcpServers: {} };
        }

        // Ensure mcpServers object exists
        if (!existingConfig.mcpServers) {
            existingConfig.mcpServers = {};
        }

        // Add our server configuration for Cline
        const globalStoragePath = path.join(os.homedir(), '.context-manager-ai');
        const serverConfig: any = {
            "command": "node",
            "args": [
                path.join(this.extensionPath, 'dist', 'mcp-server.js')
            ],
            "env": {
                "WORKSPACE_PATH": globalStoragePath
            },
            "autoApprove": [
                "get_context",
                "add_context",
                "search_contexts"
            ],
            "timeout": 60,
            "type": "stdio"
        };
        

        existingConfig.mcpServers["context-manager"] = serverConfig;

        try {
            await fs.mkdir(configDir, { recursive: true });
            await fs.writeFile(configPath, JSON.stringify(existingConfig, null, 2));
            
            vscode.window.showInformationMessage(
                `Cline MCP configuration updated!\n\n📁 Global configuration in VS Code storage\n📄 File: ${configPath}\n🌐 Using centralized storage: ~/.context-manager-ai/\n\nRestart Cline to see the Context Manager server.`,
                'Open Config', 'Show Instructions'
            ).then(action => {
                if (action === 'Open Config') {
                    vscode.window.showTextDocument(vscode.Uri.file(configPath));
                } else if (action === 'Show Instructions') {
                    this.showClineInstructions();
                }
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to generate Cline config: ${error}`);
            throw error;
        }
    }

    private showClineInstructions(): void {
        const message = `📋 Cline Setup Instructions:

1. ✅ Configuration file updated in VS Code global storage
2. 🔄 Restart Cline extension in VS Code
3. 🔌 Look for "context-manager" in Cline's MCP servers
4. 🌐 Global storage: ~/.context-manager-ai/
5. 🛠️ Available tools:
   • get_context - Get recent project contexts
   • add_context - Add new context from Cline
   • search_contexts - Search existing contexts
   • enrich_context - AI-enhanced context

6. 📝 Test by asking Cline: "Use get_context to show project context"

💡 Works across all your projects with centralized storage!`;

        vscode.window.showInformationMessage(message);
    }

    async generateGeminiConfig(): Promise<void> {
        // Gemini API with MCP support configuration
        const homeDir = process.env.HOME || process.env.USERPROFILE;
        if (!homeDir) {
            throw new Error('Could not determine home directory');
        }

        let configDir: string;
        let configPath: string;

        // Gemini configuration path (similar to Claude Desktop but different location)
        if (process.platform === 'darwin') {
            configDir = path.join(homeDir, '.config', 'gemini-mcp');
            configPath = path.join(configDir, 'mcp_servers.json');
        } else if (process.platform === 'win32') {
            configDir = path.join(homeDir, 'AppData', 'Local', 'Gemini', 'MCP');
            configPath = path.join(configDir, 'mcp_servers.json');
        } else {
            configDir = path.join(homeDir, '.config', 'gemini-mcp');
            configPath = path.join(configDir, 'mcp_servers.json');
        }

        // Read existing config or create new one
        let existingConfig: any = {};
        try {
            const existingContent = await fs.readFile(configPath, 'utf8');
            existingConfig = JSON.parse(existingContent);
        } catch {
            // File doesn't exist, start with empty config
            existingConfig = { mcpServers: {} };
        }

        // Ensure mcpServers object exists
        if (!existingConfig.mcpServers) {
            existingConfig.mcpServers = {};
        }

        // Add our server configuration
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        const serverConfig: any = {
            "command": "node",
            "args": [
                path.join(this.extensionPath, 'dist', 'mcp-server.js')
            ]
        };

        // Always use global storage directory
        const globalStoragePath = path.join(os.homedir(), '.context-manager-ai');
        serverConfig.env = {
            "WORKSPACE_PATH": globalStoragePath
        };
        

        existingConfig.mcpServers["context-manager"] = serverConfig;

        try {
            await fs.mkdir(configDir, { recursive: true });
            await fs.writeFile(configPath, JSON.stringify(existingConfig, null, 2));
            
            const workspaceMessage = workspaceFolder 
                ? `\n\n📁 Configured for workspace: ${workspaceFolder.name}`
                : `\n\n📁 No workspace open - will use current directory`;
            
            vscode.window.showInformationMessage(
                `Gemini MCP configuration created!${workspaceMessage}\n\n📁 Config: ${configPath}\n\nSetup Gemini to use MCP servers from this location.`,
                'Open Config', 'Show Instructions'
            ).then(action => {
                if (action === 'Open Config') {
                    vscode.window.showTextDocument(vscode.Uri.file(configPath));
                } else if (action === 'Show Instructions') {
                    this.showGeminiInstructions(workspaceFolder);
                }
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to generate Gemini config: ${error}`);
            throw error;
        }
    }

    private showGeminiInstructions(workspaceFolder?: vscode.WorkspaceFolder): void {
        const workspaceNote = workspaceFolder 
            ? `\n📁 Working with: ${workspaceFolder.name} (global storage: ~/.context-manager-ai/)`
            : `\n📁 Using global storage: ~/.context-manager-ai/`;

        const message = `📋 Gemini MCP Setup Instructions:

1. ✅ Configuration file created
2. 🔧 Configure Gemini API to load MCP servers from config file
3. 🔌 Gemini should detect "context-manager" server${workspaceNote}
4. 🛠️ Available tools:
   • get_context - Get recent project contexts

5. 📝 Test by asking Gemini: "Use get_context tool"

⚠️ Note: Gemini MCP support may vary by implementation
💡 Check Gemini documentation for MCP server configuration`;

        vscode.window.showInformationMessage(message);
    }

    async generateClaudeDesktopConfig(): Promise<void> {
        // Claude Desktop integration works globally, not per workspace
        // But we can configure a default workspace path if one is open

        // Claude Desktop config path for macOS
        const homeDir = process.env.HOME || process.env.USERPROFILE;
        if (!homeDir) {
            throw new Error('Could not determine home directory');
        }

        let configDir: string;
        let configPath: string;

        // Determine config path based on OS
        if (process.platform === 'darwin') {
            configDir = path.join(homeDir, 'Library', 'Application Support', 'Claude');
            configPath = path.join(configDir, 'claude_desktop_config.json');
        } else if (process.platform === 'win32') {
            configDir = path.join(homeDir, 'AppData', 'Roaming', 'Claude');
            configPath = path.join(configDir, 'claude_desktop_config.json');
        } else {
            configDir = path.join(homeDir, '.config', 'Claude');
            configPath = path.join(configDir, 'claude_desktop_config.json');
        }

        // Read existing config or create new one
        let existingConfig: any = {};
        try {
            const existingContent = await fs.readFile(configPath, 'utf8');
            existingConfig = JSON.parse(existingContent);
        } catch {
            // File doesn't exist, start with empty config
        }

        // Ensure mcpServers object exists
        if (!existingConfig.mcpServers) {
            existingConfig.mcpServers = {};
        }

        // Add our server configuration
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        const serverConfig: any = {
            "command": "node",
            "args": [
                path.join(this.extensionPath, 'dist', 'mcp-server.js')
            ]
        };

        // Always use global storage directory
        const globalStoragePath = path.join(os.homedir(), '.context-manager-ai');
        serverConfig.env = {
            "WORKSPACE_PATH": globalStoragePath
        };
        

        existingConfig.mcpServers["context-manager"] = serverConfig;

        try {
            await fs.mkdir(configDir, { recursive: true });
            await fs.writeFile(configPath, JSON.stringify(existingConfig, null, 2));
            
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            const workspaceMessage = workspaceFolder 
                ? `\n\n📁 Configured for workspace: ${workspaceFolder.name} (using global storage)`
                : `\n\n📁 Using global storage: ~/.context-manager-ai/`;
            
            vscode.window.showInformationMessage(
                `Claude Desktop MCP configuration updated!${workspaceMessage}\n\nRestart Claude Desktop to see the Context Manager server.`,
                'Open Config', 'Show Instructions'
            ).then(action => {
                if (action === 'Open Config') {
                    vscode.window.showTextDocument(vscode.Uri.file(configPath));
                } else if (action === 'Show Instructions') {
                    this.showClaudeDesktopInstructions(workspaceFolder);
                }
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to generate Claude Desktop config: ${error}`);
            throw error;
        }
    }

    private showClaudeDesktopInstructions(workspaceFolder?: vscode.WorkspaceFolder): void {
        const workspaceNote = workspaceFolder 
            ? `\n📁 Working with: ${workspaceFolder.name} (global storage: ~/.context-manager-ai/)`
            : `\n📁 Using global storage: ~/.context-manager-ai/`;

        const message = `📋 Claude Desktop Setup Instructions:

1. ✅ Configuration file updated
2. 🔄 Restart Claude Desktop completely 
3. 🔌 Look for "context-manager" server in Claude Desktop${workspaceNote}
4. 🛠️ Available tools:
   • get_context - Get recent project contexts
   • add_context - Add new context from Claude
   • search_contexts - Search existing contexts
   • enrich_context - AI-enhanced context
   • get_agent_suggestions - Get AI agent suggestions

5. 📝 Test by asking: "Show me recent contexts for this project"

💡 Tip: Open a specific project folder in VS Code for better context management!`;

        vscode.window.showInformationMessage(message);
    }

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
                        "WORKSPACE_PATH": path.join(os.homedir(), '.context-manager-ai'),
                        "CURRENT_WORKSPACE": workspaceFolder.uri.fsPath
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