import type { WebviewApi } from "vscode-webview";
import { createSignal, Signal } from "solid-js";
import type { WebviewRequest, WebviewResponse, MCPStatus, CollaborationMode, IBridge } from './types';
import { mockBridge } from './vscode-bridge.mock';

// VS Code webview API declaration
declare function acquireVsCodeApi(): WebviewApi<unknown>;

/**
 * This constant is the main switch for toggling between the real VSCode API and the mock.
 * It checks if the `acquireVsCodeApi` function exists, which is only true when running
 * inside a real VSCode webview.
 */
const isVsCode = typeof acquireVsCodeApi === 'function';

/**
 * The real implementation of the bridge that communicates with the VS Code extension host.
 * It implements the IBridge interface to ensure a consistent contract.
 * 
 * TO REVERT: Remove `implements IBridge` from the class definition.
 */
export class VSCodeBridge implements IBridge {
    private static instance: VSCodeBridge;
    private readonly vscode: WebviewApi<unknown> | null;
    
    private incomingResponse: Signal<WebviewResponse | null>;
    private requestCounter = 0;

    private constructor() {
        this.vscode = isVsCode ? acquireVsCodeApi() : null;
        this.incomingResponse = createSignal<WebviewResponse | null>(null);
        
        if (this.vscode) {
            window.addEventListener('message', (event: MessageEvent) => {
                const response = event.data as WebviewResponse;
                if (response && response.requestId) {
                    const [, setSignal] = this.incomingResponse;
                    setSignal(response);
                }
            });
        }
    }

    public static getInstance(): VSCodeBridge {
        if (!VSCodeBridge.instance) {
            VSCodeBridge.instance = new VSCodeBridge();
        }
        return VSCodeBridge.instance;
    }

    private generateRequestId(): string {
        return `req-${Date.now()}-${++this.requestCounter}`;
    }

    public sendRequest<T = any>(command: string, payload: any): Promise<T> {
        if (!this.vscode) {
            // This check prevents errors when running in a browser without the mock.
            console.error('VSCode API is not available. Did you mean to run in dev mode?');
            return Promise.reject(new Error('VSCode API not available.'));
        }

        // Assign this.vscode to a local constant to satisfy TypeScript's strict null checks inside the Promise.
        const vscode = this.vscode;

        const requestId = this.generateRequestId();
        const request: WebviewRequest = { command, payload, requestId };

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
            
            vscode.postMessage(request);
            
            setTimeout(() => {
                window.removeEventListener('message', listener);
                reject(new Error(`Request ${command} timed out`));
            }, 30000);
        });
    }

    public onResponse(): Signal<WebviewResponse | null> {
        return this.incomingResponse;
    }

    // --- Convenience methods ---

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

/**
 * This is the master export that determines which bridge to use.
 * It uses the `isVsCode` constant to decide.
 * 
 * TO REVERT TO ORIGINAL LOGIC (NO DEV MODE):
 * Change this line to:
 * `export const bridge = VSCodeBridge.getInstance();`
 */
export const bridge: IBridge = isVsCode ? VSCodeBridge.getInstance() : mockBridge;
