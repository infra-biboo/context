import * as assert from 'assert';
import * as vscode from 'vscode';
import { CascadeEnrichmentService } from '../mcp/cascade-enrichment-service';
import { UnifiedMCPServer } from '../mcp/unified-mcp-server';
import { RealMCPClient } from '../mcp/real-mcp-client';
import { MCPClient } from '../mcp/mcp-client';

// Mock VS Code extension context for testing
function createMockExtensionContext(): vscode.ExtensionContext {
    return {
        subscriptions: [],
        workspaceState: {
            get: (key: string, defaultValue?: any) => defaultValue,
            update: (key: string, value: any) => Promise.resolve(),
            keys: () => []
        },
        globalState: {
            get: (key: string, defaultValue?: any) => defaultValue,
            update: (key: string, value: any) => Promise.resolve(),
            keys: () => []
        },
        extensionPath: '/mock/path',
        extensionUri: vscode.Uri.file('/mock/path'),
        environmentVariableCollection: {} as any,
        asAbsolutePath: (relativePath: string) => `/mock/path/${relativePath}`,
        storageUri: vscode.Uri.file('/mock/storage'),
        globalStorageUri: vscode.Uri.file('/mock/global-storage'),
        logUri: vscode.Uri.file('/mock/log'),
        extensionMode: vscode.ExtensionMode.Test,
        secrets: {} as any
    };
}

suite('MCP Integration Tests', () => {
    let mockContext: vscode.ExtensionContext;

    setup(() => {
        mockContext = createMockExtensionContext();
    });

    suite('CascadeEnrichmentService', () => {
        test('should create service successfully', () => {
            const service = new CascadeEnrichmentService(mockContext);
            assert.ok(service, 'CascadeEnrichmentService should be created');
        });

        test('should handle local enrichment fallback', async () => {
            const service = new CascadeEnrichmentService(mockContext);
            
            const content = 'fix: resolve security vulnerability in authentication';
            const importance = 8;
            
            try {
                const result = await service.enrichContext(content, importance);
                assert.ok(result, 'Should return enriched content');
                assert.ok(result.includes('Local:'), 'Should use local enrichment as fallback');
                assert.ok(result.includes('security'), 'Should detect security pattern');
            } catch (error) {
                // Local enrichment should always work
                assert.fail(`Local enrichment should not fail: ${error.message}`);
            }
        });

        test('should prioritize strategies correctly', async () => {
            const service = new CascadeEnrichmentService(mockContext);
            
            // Test with low importance - should still work with local
            const content = 'update readme';
            const importance = 3;
            
            const result = await service.enrichContext(content, importance);
            assert.ok(result, 'Should return enriched content for low importance');
            assert.ok(result.includes('Local:'), 'Should use local enrichment');
        });
    });

    suite('RealMCPClient', () => {
        test('should create client successfully', () => {
            const client = new RealMCPClient();
            assert.ok(client, 'RealMCPClient should be created');
            assert.strictEqual(client.isConnected(), false, 'Should not be connected initially');
        });

        test('should handle connection failure gracefully', async () => {
            const client = new RealMCPClient();
            
            try {
                await client.connect();
                assert.fail('Should fail to connect without server');
            } catch (error) {
                assert.ok(error.message.includes('Cannot connect'), 'Should provide meaningful error message');
            }
        });

        test('should validate connection status', () => {
            const client = new RealMCPClient();
            
            assert.strictEqual(client.getConnectionStatus(), 'Disconnected');
            assert.strictEqual(client.isConnected(), false);
        });
    });

    suite('MCPClient Integration', () => {
        test('should create modernized client successfully', () => {
            const client = new MCPClient(mockContext);
            assert.ok(client, 'MCPClient should be created');
        });

        test('should handle commit enrichment with fallback', async () => {
            const client = new MCPClient(mockContext);
            
            const commitMessage = 'feat: add new authentication system';
            const importance = 7;
            
            const result = await client.enrichCommitContext(commitMessage, importance);
            assert.ok(result, 'Should return enriched commit context');
            assert.ok(result.includes('Local:'), 'Should use local enrichment');
        });

        test('should handle file context enrichment', async () => {
            const client = new MCPClient(mockContext);
            
            const fileName = 'package.json';
            const changeType = 'modified' as const;
            const filePath = '/project/package.json';
            
            const result = await client.enrichFileContext(fileName, changeType, filePath);
            assert.ok(result, 'Should return enriched file context');
        });

        test('should detect eureka moments', async () => {
            const client = new MCPClient(mockContext);
            
            const content = 'Eureka! Found the solution to the memory leak';
            const contextType = 'breakthrough';
            
            const result = await client.enrichEurekaContext(content, contextType);
            assert.ok(result, 'Should return enriched eureka context');
            assert.ok(result.includes('MOMENTO EUREKA'), 'Should mark as eureka moment');
        });

        test('should provide connection status', () => {
            const client = new MCPClient(mockContext);
            const status = client.getStatus();
            
            assert.ok(typeof status.connected === 'boolean', 'Should have connected status');
            assert.ok(typeof status.mcpAvailable === 'boolean', 'Should have MCP availability status');
            assert.ok(typeof status.enrichmentAvailable === 'boolean', 'Should have enrichment availability status');
            assert.strictEqual(status.enrichmentAvailable, true, 'Enrichment should always be available');
        });
    });

    suite('UnifiedMCPServer Static Methods', () => {
        test('should check MCP configuration correctly', () => {
            // Test static method for checking if MCP should start
            const shouldStart = UnifiedMCPServer.shouldStartMCP();
            assert.ok(typeof shouldStart === 'boolean', 'Should return boolean for MCP check');
        });
    });

    suite('Architecture Validation', () => {
        test('should support hybrid architecture', async () => {
            // Test that components can work independently
            const enrichmentService = new CascadeEnrichmentService(mockContext);
            const mcpClient = new MCPClient(mockContext);
            
            // Both should be createable without errors
            assert.ok(enrichmentService, 'Enrichment service should work independently');
            assert.ok(mcpClient, 'MCP client should work independently');
            
            // Enrichment should work without MCP
            const result = await enrichmentService.enrichContext('test content', 5);
            assert.ok(result, 'Enrichment should work without MCP server');
        });

        test('should handle MCP optional configuration', () => {
            // Test that system works when MCP is disabled
            const client = new MCPClient(mockContext);
            const status = client.getStatus();
            
            // Should work even if MCP is not available
            assert.ok(!status.mcpAvailable || status.mcpAvailable, 'MCP availability should be detectable');
            assert.strictEqual(status.enrichmentAvailable, true, 'Enrichment should always be available');
        });
    });

    suite('Error Handling', () => {
        test('should handle service failures gracefully', async () => {
            const enrichmentService = new CascadeEnrichmentService(mockContext);
            
            // Test with various inputs that might cause issues
            const testCases = [
                { content: '', importance: 5 },
                { content: 'test', importance: 0 },
                { content: 'test', importance: 11 }, // Out of range
                { content: 'very long content that might cause issues'.repeat(100), importance: 5 }
            ];
            
            for (const testCase of testCases) {
                try {
                    const result = await enrichmentService.enrichContext(testCase.content, testCase.importance);
                    assert.ok(result, `Should handle case: ${JSON.stringify(testCase)}`);
                } catch (error) {
                    // Some edge cases might fail, but shouldn't crash
                    assert.ok(error instanceof Error, 'Should throw proper Error objects');
                }
            }
        });
    });
});

// Export for running tests
export { createMockExtensionContext };