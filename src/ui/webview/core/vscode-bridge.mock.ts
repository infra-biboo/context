import type { WebviewResponse, WebviewRequest, IBridge, MCPStatus } from './types';

/**
 * A mock implementation of the VSCode bridge for local development in a browser.
 * It simulates the API calls and returns mock data.
 * It implements the IBridge interface to ensure its signature matches the real bridge.
 * 
 * TO REVERT: Remove `: IBridge` from the object definition.
 */
export const mockBridge: IBridge = {
  sendRequest: <T extends keyof WebviewRequest>(command: T, payload: WebviewRequest[T]): Promise<any> => {
    console.log(`[MOCK] Sending request: ${command}`, payload);

    // Simulate API responses
    switch (command) {
      case 'app.requestInitialData':
        return Promise.resolve({
          contexts: [
            { id: '1', content: 'Mocked context 1: A decision was made to use SolidJS.', type: 'decision', timestamp: Date.now() - 10000 },
            { id: '2', content: 'Mocked context 2: This is a code snippet.', type: 'code', timestamp: Date.now() - 20000 },
          ],
          agents: [
            { id: 'agent-1', name: 'Architect', description: 'Designs software architecture.', isActive: true },
            { id: 'agent-2', name: 'Frontend', description: 'Works on UI/UX.', isActive: true },
          ],
          databaseConfig: { type: 'json', config: { filePath: '/mock/db.json' } },
          mcpStatus: { connected: true, status: 'Connected to mock server' },
          tokenUsage: { 
            used: 1200, 
            available: 10000, 
            percentage: 12, 
            status: 'low', 
            resetTime: '25 days', 
            isNearLimit: false 
          },
          stats: { contextCount: 2, agentCount: 2 },
          onboardingCompleted: true,
        });
      case 'context.search':
        return Promise.resolve([
          { id: '3', content: `Search result for: ${(payload as any).query}`, type: 'search-result', timestamp: Date.now() },
        ]);
      default:
        return Promise.resolve({ status: 'ok', message: `Mocked response for ${command}` });
    }
  },

  onResponse: () => {
    // This is harder to mock, for now, we do nothing.
    // We can simulate unsolicited messages here if needed.
    console.log('[MOCK] onResponse listener attached.');
    const responseSignal = () => {}; // No-op
    return [responseSignal] as any;
  },

  // Mock other methods if they exist on the original bridge
  getMCPStatus: (): Promise<MCPStatus> => Promise.resolve({ connected: true, status: 'Connected to mock server' }),
  toggleAgent: (agentId: string) => Promise.resolve({ id: agentId, status: 'toggled' }),
  setCollaborationMode: (mode: string) => Promise.resolve({ status: `Collaboration mode set to ${mode}` })
};
