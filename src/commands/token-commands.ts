import * as vscode from 'vscode';

export function registerTokenCommands(context: vscode.ExtensionContext, tokenMonitor: any) {
    // Command to manually set token usage percentage
    const setTokenUsage = vscode.commands.registerCommand('claude-context.setTokenUsage', async () => {
        const input = await vscode.window.showInputBox({
            prompt: 'Ingresa el porcentaje de uso de tokens (0-100)',
            placeHolder: '85',
            validateInput: (value) => {
                const num = parseInt(value);
                if (isNaN(num) || num < 0 || num > 100) {
                    return 'Por favor ingresa un número entre 0 y 100';
                }
                return null;
            }
        });
        
        if (input) {
            const percentage = parseInt(input);
            tokenMonitor.setManualUsage(percentage);
            vscode.window.showInformationMessage(`Uso de tokens actualizado a ${percentage}%`);
        }
    });

    // Command to reset token usage
    const resetTokenUsage = vscode.commands.registerCommand('claude-context.resetTokenUsage', () => {
        tokenMonitor.setManualUsage(0);
        vscode.window.showInformationMessage('Uso de tokens reiniciado');
    });

    // Command to show current token usage
    const showTokenUsage = vscode.commands.registerCommand('claude-context.showTokenUsage', () => {
        const usage = tokenMonitor.getCurrentUsage();
        vscode.window.showInformationMessage(
            `Uso actual: ${usage.percentage.toFixed(1)}% - Reset en ${usage.resetTime}`
        );
    });

    context.subscriptions.push(setTokenUsage, resetTokenUsage, showTokenUsage);
}