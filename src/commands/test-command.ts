import * as vscode from 'vscode';
import { Logger } from '../utils/logger';

export function registerCommands(context: vscode.ExtensionContext) {
    const testCommand = vscode.commands.registerCommand('claude-context.test', () => {
        Logger.info('Test command executed');
        vscode.window.showInformationMessage('Claude Context Manager is working!');
    });

    context.subscriptions.push(testCommand);
    Logger.info('Commands registered successfully');
}