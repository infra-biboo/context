import * as vscode from 'vscode';
import { Logger } from '../utils/logger';

export function registerCommands(context: vscode.ExtensionContext) {
    const testCommand = vscode.commands.registerCommand('claude-context.test', () => {
        Logger.info('Test command executed');
        vscode.window.showInformationMessage('Claude Context Manager is working!');
    });

    const listAllCommandsCommand = vscode.commands.registerCommand('claude-context.listAllCommands', async () => {
        Logger.info('Listing all registered commands...');
        const allCommands = await vscode.commands.getCommands(true); // true to include internal commands
        Logger.info(`Total commands registered: ${allCommands.length}`);
        allCommands.sort().forEach(cmd => Logger.info(`- ${cmd}`));
        vscode.window.showInformationMessage('All commands listed in output channel.');
    });

    context.subscriptions.push(testCommand, listAllCommandsCommand);
    Logger.info('Commands registered successfully');
}