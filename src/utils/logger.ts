// Dynamic import to handle environments without vscode
let vscode: any;
try {
    vscode = require('vscode');
} catch (e) {
    // Not in VS Code environment
    vscode = null;
}

export class Logger {
    private static outputChannel: any;

    static initialize() {
        if (vscode) {
            this.outputChannel = vscode.window.createOutputChannel('Claude Context Manager');
        }
    }

    static info(message: string) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] INFO: ${message}`;
        console.log(logMessage);
        if (this.outputChannel) {
            this.outputChannel.appendLine(logMessage);
        }
    }

    static error(message: string, error?: unknown) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ERROR: ${message}`;
        console.error(logMessage, error);
        if (this.outputChannel) {
            this.outputChannel.appendLine(logMessage);
            if (error instanceof Error) {
                this.outputChannel.appendLine(`Stack: ${error.stack}`);
            } else if (error) {
                this.outputChannel.appendLine(`Error details: ${String(error)}`);
            }
        }
    }

    static warn(message: string, error?: unknown) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] WARN: ${message}`;
        console.warn(logMessage, error);
        if (this.outputChannel) {
            this.outputChannel.appendLine(logMessage);
            if (error instanceof Error) {
                this.outputChannel.appendLine(`Stack: ${error.stack}`);
            } else if (error) {
                this.outputChannel.appendLine(`Warning details: ${String(error)}`);
            }
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