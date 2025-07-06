import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../utils/logger';

export function registerGitTestCommands(context: vscode.ExtensionContext) {
    const simulateCommitCommand = vscode.commands.registerCommand('claude-context.simulateCommit', async () => {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('No workspace folder open');
            return;
        }

        const gitPath = path.join(workspaceFolder.uri.fsPath, '.git');
        
        if (!fs.existsSync(gitPath)) {
            vscode.window.showErrorMessage('No git repository found in workspace');
            return;
        }

        // Prompt for commit message
        const commitMessage = await vscode.window.showInputBox({
            prompt: 'Enter a test commit message',
            placeHolder: 'Add new feature for context management',
            value: 'feat: implement git integration for automatic context capture'
        });

        if (!commitMessage) {
            return;
        }

        try {
            // Simulate writing to COMMIT_EDITMSG
            const commitMsgPath = path.join(gitPath, 'COMMIT_EDITMSG');
            fs.writeFileSync(commitMsgPath, commitMessage);
            
            Logger.info(`Simulated git commit: ${commitMessage}`);
            vscode.window.showInformationMessage(`Simulated commit: ${commitMessage}`);
            
            // Trigger the git watcher by touching the file again
            setTimeout(() => {
                fs.utimesSync(commitMsgPath, new Date(), new Date());
            }, 500);
            
        } catch (error) {
            Logger.error('Error simulating commit:', error as Error);
            vscode.window.showErrorMessage('Failed to simulate commit');
        }
    });

    const simulateFileChangeCommand = vscode.commands.registerCommand('claude-context.simulateFileChange', async () => {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('No workspace folder open');
            return;
        }

        // Create a temporary test file
        const testFilePath = path.join(workspaceFolder.uri.fsPath, 'test-file.ts');
        const testContent = `// Test file created at ${new Date().toISOString()}
export class TestClass {
    constructor() {
        console.log('Testing file monitoring');
    }
}`;

        try {
            fs.writeFileSync(testFilePath, testContent);
            Logger.info('Created test file for monitoring');
            vscode.window.showInformationMessage('Created test file for monitoring');
            
            // Schedule deletion after a few seconds
            setTimeout(() => {
                if (fs.existsSync(testFilePath)) {
                    fs.unlinkSync(testFilePath);
                    Logger.info('Deleted test file');
                }
            }, 5000);
            
        } catch (error) {
            Logger.error('Error creating test file:', error as Error);
            vscode.window.showErrorMessage('Failed to create test file');
        }
    });

    const simulateProgrammaticSaveCommand = vscode.commands.registerCommand('claude-context.simulateProgrammaticSave', async () => {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('No workspace folder open');
            return;
        }

        const testFilePath = path.join(workspaceFolder.uri.fsPath, 'test-programmatic-save.ts');
        const newContent = `// Programmatic save test at ${new Date().toISOString()}\nconst value = Math.random();\nconsole.log('Value:', value);\n`;

        try {
            // Write content using fs (simulating how our tools might write)
            fs.writeFileSync(testFilePath, newContent, 'utf8');
            Logger.info(`Written to ${testFilePath} using fs.writeFileSync`);

            // Now, open the document and save it programmatically
            const document = await vscode.workspace.openTextDocument(vscode.Uri.file(testFilePath));
            const success = await document.save();

            if (success) {
                Logger.info(`Programmatic save successful for ${testFilePath}`);
                vscode.window.showInformationMessage(`Programmatic save successful for ${path.basename(testFilePath)}`);
            } else {
                Logger.warn(`Programmatic save failed for ${testFilePath}`);
                vscode.window.showErrorMessage(`Programmatic save failed for ${path.basename(testFilePath)}`);
            }

        } catch (error) {
            Logger.error('Error simulating programmatic save:', error as Error);
            vscode.window.showErrorMessage('Failed to simulate programmatic save');
        }
    });

    context.subscriptions.push(simulateCommitCommand, simulateFileChangeCommand, simulateProgrammaticSaveCommand);
    Logger.info('Git test commands registered successfully');
}