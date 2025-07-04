import * as vscode from 'vscode';

export class Logger {
    private static outputChannel: vscode.OutputChannel;

    static initialize() {
        this.outputChannel = vscode.window.createOutputChannel('Claude Context Manager');
    }

    static info(message: string) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] INFO: ${message}`;
        console.log(logMessage);
        this.outputChannel?.appendLine(logMessage);
    }

    static error(message: string, error?: Error) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ERROR: ${message}`;
        console.error(logMessage, error);
        this.outputChannel?.appendLine(logMessage);
        if (error) {
            this.outputChannel?.appendLine(`Stack: ${error.stack}`);
        }
    }

    static debug(message: string) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] DEBUG: ${message}`;
        console.debug(logMessage);
        this.outputChannel?.appendLine(logMessage);
    }

    static show() {
        this.outputChannel?.show();
    }
}