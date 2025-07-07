import * as vscode from 'vscode';
import { MCPClient } from '../mcp/mcp-client';
import { CascadeEnrichmentService } from '../mcp/cascade-enrichment-service';
import { RealMCPClient } from '../mcp/real-mcp-client';
import { Logger } from '../utils/logger';

let mcpClient: MCPClient;
let enrichmentService: CascadeEnrichmentService;

export function registerMCPTestCommands(context: vscode.ExtensionContext) {
    // Initialize services
    mcpClient = new MCPClient(context);
    enrichmentService = new CascadeEnrichmentService(context);

    // Test cascade enrichment
    const testEnrichmentCommand = vscode.commands.registerCommand(
        'claude-context.testCascadeEnrichment',
        async () => {
            try {
                const content = await vscode.window.showInputBox({
                    prompt: 'Enter content to enrich',
                    value: 'fix: resolve critical authentication vulnerability'
                });

                if (!content) return;

                const importance = await vscode.window.showQuickPick(
                    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
                    { placeHolder: 'Select importance level (1-10)' }
                );

                if (!importance) return;

                vscode.window.showInformationMessage('🔄 Testing cascade enrichment...');

                const startTime = Date.now();
                const result = await enrichmentService.enrichContext(content, parseInt(importance));
                const duration = Date.now() - startTime;

                // Show result in a new document
                const doc = await vscode.workspace.openTextDocument({
                    content: `# Cascade Enrichment Test Result

## Input
- **Content**: ${content}
- **Importance**: ${importance}/10
- **Duration**: ${duration}ms

## Enriched Result
${result}

## Test Details
- **Timestamp**: ${new Date().toISOString()}
- **Strategy Used**: ${result.includes('🤖') ? 'Claude MCP' : result.includes('🧠') ? 'External API' : 'Local Rules'}
`,
                    language: 'markdown'
                });

                await vscode.window.showTextDocument(doc);
                vscode.window.showInformationMessage(`✅ Enrichment completed in ${duration}ms`);

            } catch (error) {
                Logger.error('Test enrichment failed', error);
                vscode.window.showErrorMessage(`❌ Enrichment test failed: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    );

    // Test MCP client status
    const testMCPStatusCommand = vscode.commands.registerCommand(
        'claude-context.testMCPStatus',
        async () => {
            try {
                const status = mcpClient.getStatus();
                
                const statusInfo = `# MCP Client Status

## Connection Status
- **Connected**: ${status.connected ? '✅' : '❌'}
- **MCP Available**: ${status.mcpAvailable ? '✅' : '❌'}
- **Enrichment Available**: ${status.enrichmentAvailable ? '✅' : '❌'}

## Configuration
- **MCP Enabled**: ${vscode.workspace.getConfiguration('claude-context').get('enableMCP', false) ? '✅' : '❌'}
- **API Enabled**: ${vscode.workspace.getConfiguration('claude-context.enrichment').get('apiEnabled', false) ? '✅' : '❌'}
- **API Provider**: ${vscode.workspace.getConfiguration('claude-context.enrichment').get('apiProvider', 'deepseek')}

## Test Results
- **Timestamp**: ${new Date().toISOString()}
- **VS Code Version**: ${vscode.version}
`;

                const doc = await vscode.workspace.openTextDocument({
                    content: statusInfo,
                    language: 'markdown'
                });

                await vscode.window.showTextDocument(doc);

            } catch (error) {
                Logger.error('Status test failed', error);
                vscode.window.showErrorMessage(`❌ Status test failed: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    );

    // Test commit enrichment
    const testCommitEnrichmentCommand = vscode.commands.registerCommand(
        'claude-context.testCommitEnrichment',
        async () => {
            try {
                const commitMessage = await vscode.window.showInputBox({
                    prompt: 'Enter a commit message to test',
                    value: 'feat: implement new user authentication system with JWT tokens'
                });

                if (!commitMessage) return;

                const importance = await vscode.window.showQuickPick(
                    ['5', '6', '7', '8', '9', '10'],
                    { 
                        placeHolder: 'Select importance level (typically 5-10 for commits)',
                        title: 'Commit Importance'
                    }
                );

                if (!importance) return;

                vscode.window.showInformationMessage('🔄 Testing commit enrichment...');

                const startTime = Date.now();
                const result = await mcpClient.enrichCommitContext(commitMessage, parseInt(importance));
                const duration = Date.now() - startTime;

                const enrichmentResult = `# Commit Enrichment Test

## Original Commit
\`\`\`
${commitMessage}
\`\`\`

## Enriched Context
${result}

## Test Metadata
- **Importance Level**: ${importance}/10
- **Processing Time**: ${duration}ms
- **Timestamp**: ${new Date().toISOString()}
- **Language**: ${vscode.workspace.getConfiguration('claude-context').get('language', 'en')}
`;

                const doc = await vscode.workspace.openTextDocument({
                    content: enrichmentResult,
                    language: 'markdown'
                });

                await vscode.window.showTextDocument(doc);
                vscode.window.showInformationMessage(`✅ Commit enrichment completed in ${duration}ms`);

            } catch (error) {
                Logger.error('Commit enrichment test failed', error);
                vscode.window.showErrorMessage(`❌ Commit enrichment test failed: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    );

    // Test real MCP client connection
    const testRealMCPCommand = vscode.commands.registerCommand(
        'claude-context.testRealMCPConnection',
        async () => {
            try {
                vscode.window.showInformationMessage('🔄 Testing real MCP connection...');

                const realClient = new RealMCPClient();
                const startTime = Date.now();

                try {
                    await realClient.connect();
                    const duration = Date.now() - startTime;
                    
                    // Test a simple operation
                    const testResult = await realClient.getContext(3);
                    
                    await realClient.disconnect();
                    
                    const connectionResult = `# Real MCP Connection Test

## Connection Test
- **Status**: ✅ Success
- **Connection Time**: ${duration}ms
- **Server Response**: Available

## Test Context Query
\`\`\`
${testResult}
\`\`\`

## Details
- **Timestamp**: ${new Date().toISOString()}
- **Client Version**: Real MCP Client v1.0
- **Transport**: STDIO
`;

                    const doc = await vscode.workspace.openTextDocument({
                        content: connectionResult,
                        language: 'markdown'
                    });

                    await vscode.window.showTextDocument(doc);
                    vscode.window.showInformationMessage('✅ Real MCP connection test successful');

                } catch (connectionError) {
                    const duration = Date.now() - startTime;
                    
                    const errorResult = `# Real MCP Connection Test

## Connection Test
- **Status**: ❌ Failed
- **Attempt Duration**: ${duration}ms
- **Error**: ${connectionError instanceof Error ? connectionError.message : String(connectionError)}

## Expected Behavior
This is expected if:
1. MCP is disabled in settings
2. No MCP server is running
3. VS Code extension is not in MCP mode

## To Enable MCP
1. Open VS Code Settings
2. Search for "claude-context.enableMCP"
3. Enable the checkbox
4. Restart VS Code extension

## Details
- **Timestamp**: ${new Date().toISOString()}
- **Error Type**: ${connectionError instanceof Error ? connectionError.constructor.name : 'Unknown'}
`;

                    const doc = await vscode.workspace.openTextDocument({
                        content: errorResult,
                        language: 'markdown'
                    });

                    await vscode.window.showTextDocument(doc);
                    vscode.window.showWarningMessage('⚠️ MCP connection failed (this is expected if MCP is disabled)');
                }

            } catch (error) {
                Logger.error('Real MCP test failed', error);
                vscode.window.showErrorMessage(`❌ Real MCP test failed: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    );

    // Configure MCP settings
    const configureMCPCommand = vscode.commands.registerCommand(
        'claude-context.configureMCP',
        async () => {
            const action = await vscode.window.showQuickPick([
                {
                    label: '🔧 Open MCP Settings',
                    description: 'Configure MCP integration and enrichment options'
                },
                {
                    label: '🚀 Enable MCP Integration',
                    description: 'Enable Claude Desktop integration'
                },
                {
                    label: '🛑 Disable MCP Integration',
                    description: 'Disable Claude Desktop integration (standalone mode)'
                },
                {
                    label: '🌐 Configure API Enrichment',
                    description: 'Setup external API for enrichment fallback'
                },
                {
                    label: '📊 View Current Configuration',
                    description: 'Show current MCP and enrichment settings'
                }
            ], {
                placeHolder: 'Select MCP configuration action'
            });

            if (!action) return;

            switch (action.label) {
                case '🔧 Open MCP Settings':
                    vscode.commands.executeCommand('workbench.action.openSettings', 'claude-context');
                    break;

                case '🚀 Enable MCP Integration':
                    await vscode.workspace.getConfiguration('claude-context').update('enableMCP', true, true);
                    vscode.window.showInformationMessage('✅ MCP Integration enabled. Restart VS Code to apply changes.');
                    break;

                case '🛑 Disable MCP Integration':
                    await vscode.workspace.getConfiguration('claude-context').update('enableMCP', false, true);
                    vscode.window.showInformationMessage('✅ MCP Integration disabled. Extension will run in standalone mode.');
                    break;

                case '🌐 Configure API Enrichment':
                    vscode.commands.executeCommand('workbench.action.openSettings', 'claude-context.enrichment');
                    break;

                case '📊 View Current Configuration':
                    const config = vscode.workspace.getConfiguration('claude-context');
                    const enrichmentConfig = vscode.workspace.getConfiguration('claude-context.enrichment');
                    
                    const configInfo = `# Current MCP Configuration

## MCP Integration
- **Enabled**: ${config.get('enableMCP', false) ? '✅' : '❌'}

## Enrichment Configuration
- **API Enabled**: ${enrichmentConfig.get('apiEnabled', false) ? '✅' : '❌'}
- **API Provider**: ${enrichmentConfig.get('apiProvider', 'deepseek')}
- **Model**: ${enrichmentConfig.get('model', 'deepseek-chat')}
- **Show Notifications**: ${enrichmentConfig.get('showFallbackNotifications', true) ? '✅' : '❌'}

## Architecture Mode
${config.get('enableMCP', false) ? 
'**Hybrid Mode**: Context Manager + MCP Integration' : 
'**Standalone Mode**: Context Manager only (no Claude Desktop integration)'}

## Generated: ${new Date().toISOString()}
`;

                    const doc = await vscode.workspace.openTextDocument({
                        content: configInfo,
                        language: 'markdown'
                    });

                    await vscode.window.showTextDocument(doc);
                    break;
            }
        }
    );

    context.subscriptions.push(
        testEnrichmentCommand,
        testMCPStatusCommand,
        testCommitEnrichmentCommand,
        testRealMCPCommand,
        configureMCPCommand
    );
}