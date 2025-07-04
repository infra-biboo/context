import * as vscode from 'vscode';
import { Logger } from '../utils/logger';

export function registerPanelCommands(context: vscode.ExtensionContext) {
    const openPanelCommand = vscode.commands.registerCommand('claude-context.openPanel', () => {
        Logger.info('Open panel command executed');
        vscode.window.showInformationMessage('Claude Context Panel is available in the Explorer sidebar');
    });

    context.subscriptions.push(openPanelCommand);
    Logger.info('Panel commands registered successfully');
}