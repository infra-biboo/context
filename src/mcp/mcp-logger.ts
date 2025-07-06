/**
 * Simple logger for MCP server that doesn't depend on VS Code
 */
export class MCPLogger {
    static info(message: string) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] INFO: ${message}`);
    }

    static error(message: string, error?: unknown) {
        const timestamp = new Date().toISOString();
        console.error(`[${timestamp}] ERROR: ${message}`);
        if (error instanceof Error) {
            console.error(`Stack: ${error.stack}`);
        } else if (error) {
            console.error(`Error details: ${String(error)}`);
        }
    }

    static warn(message: string, error?: unknown) {
        const timestamp = new Date().toISOString();
        console.warn(`[${timestamp}] WARN: ${message}`);
        if (error instanceof Error) {
            console.warn(`Stack: ${error.stack}`);
        } else if (error) {
            console.warn(`Warning details: ${String(error)}`);
        }
    }
}