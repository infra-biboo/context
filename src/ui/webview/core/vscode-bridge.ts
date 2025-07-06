import type { WebviewApi } from "vscode-webview";
import { createSignal, Signal } from "solid-js";
import type { WebviewRequest, WebviewResponse, MCPStatus, CollaborationMode } from './types';

// VS Code webview API declaration
declare function acquireVsCodeApi(): WebviewApi<unknown>;

/**
 * A pure communication bridge between the webview and the VS Code extension host.
 * It uses the WebviewRequest/WebviewResponse protocol for type-safe, tracked communication.
 */
export class VSCodeBridge {
    private static instance: VSCodeBridge;
    private readonly vscode: WebviewApi<unknown>;
    
    // The reactive signal that will fire with a new response whenever one is received.
    private incomingResponse: Signal<WebviewResponse | null>;
    
    // Generate unique request IDs
    private requestCounter = 0;

    private constructor() {
        this.vscode = acquireVsCodeApi();
        this.incomingResponse = createSignal<WebviewResponse | null>(null);
        
        // Listen for all messages from the extension host.
        window.addEventListener('message', (event: MessageEvent) => {
            const response = event.data as WebviewResponse;
            if (response && response.requestId) {
                // Set the signal's value to the new response.
                // The AppController will be listening to this signal.
                const [, setSignal] = this.incomingResponse;
                setSignal(response);
            }
        });
    }

    /**
     * Gets the singleton instance of the VSCodeBridge.
     */
    public static getInstance(): VSCodeBridge {
        if (!VSCodeBridge.instance) {
            VSCodeBridge.instance = new VSCodeBridge();
        }
        return VSCodeBridge.instance;
    }

    /**
     * Generates a unique request ID
     */
    private generateRequestId(): string {
        return `req-${Date.now()}-${++this.requestCounter}`;
    }

    /**
     * Sends a request and waits for a response
     */
    public sendRequest<T = any>(command: string, payload: any): Promise<T> {
        const requestId = this.generateRequestId();
        
        const request: WebviewRequest = {
            command,
            payload,
            requestId
        };

        return new Promise((resolve, reject) => {
            const listener = (event: MessageEvent) => {
                const response = event.data as WebviewResponse;
                if (response.requestId === requestId) {
                    window.removeEventListener('message', listener);
                    if (response.error) {
                        reject(new Error(response.error));
                    } else {
                        resolve(response.payload);
                    }
                }
            };
            window.addEventListener('message', listener);
            
            // Send the request
            this.vscode.postMessage(request);
            
            // Set a timeout
            setTimeout(() => {
                window.removeEventListener('message', listener);
                reject(new Error(`Request ${command} timed out`));
            }, 30000);
        });
    }

    /**
     * Sends a message without expecting a response (fire-and-forget)
     */
    public postMessage(command: string, payload: any): void {
        const request: WebviewRequest = {
            command,
            payload,
            requestId: this.generateRequestId()
        };
        this.vscode.postMessage(request);
    }

    /**
     * Returns the reactive signal for incoming responses.
     * The AppController can create an effect on this signal to react to unsolicited messages.
     */
    public onResponse(): Signal<WebviewResponse | null> {
        return this.incomingResponse;
    }

    // --- Convenience methods for common requests ---

    public getMCPStatus(): Promise<MCPStatus> {
        return this.sendRequest('mcp.getStatus', {});
    }

    public toggleAgent(agentId: string): Promise<any> {
        return this.sendRequest('agent.toggle', { agentId });
    }

    public setCollaborationMode(mode: CollaborationMode): Promise<any> {
        return this.sendRequest('config.setCollaborationMode', { mode });
    }
}

// Export a singleton instance for easy access
export const bridge = VSCodeBridge.getInstance();
