import { SQLiteAdapter } from '../adapters/sqlite-adapter';
import { DatabaseConfig } from '../types';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('SQLiteAdapter', () => {
  let adapter: SQLiteAdapter;
  let tempDbPath: string;

  beforeEach(async () => {
    // Create temporary database file
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'context-test-'));
    tempDbPath = path.join(tempDir, 'test.db');
    
    const config: DatabaseConfig['sqlite'] = {
      path: tempDbPath
    };
    
    adapter = new SQLiteAdapter(config);
    await adapter.connect();
  });

  afterEach(async () => {
    if (adapter.isConnected()) {
      await adapter.disconnect();
    }
    
    // Clean up temp file
    try {
      await fs.unlink(tempDbPath);
      await fs.rmdir(path.dirname(tempDbPath));
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Connection Management', () => {
    it('should connect and disconnect successfully', async () => {
      expect(adapter.isConnected()).toBe(true);
      
      await adapter.disconnect();
      expect(adapter.isConnected()).toBe(false);
    });

    it('should perform health check', async () => {
      const isHealthy = await adapter.healthCheck();
      expect(isHealthy).toBe(true);
    });
  });

  describe('Context Operations', () => {
    it('should add and retrieve contexts', async () => {
      const entry = {
        projectPath: '/test/project',
        type: 'conversation' as const,
        content: 'Test conversation content',
        importance: 8,
        tags: ['test', 'conversation']
      };

      const id = await adapter.addContext(entry);
      expect(id).toBeDefined();
      expect(id.startsWith('ctx_')).toBe(true);

      const retrieved = await adapter.getContextById(id);
      expect(retrieved).toBeDefined();
      expect(retrieved!.content).toBe('Test conversation content');
      expect(retrieved!.type).toBe('conversation');
      expect(retrieved!.importance).toBe(8);
      expect(retrieved!.tags).toEqual(['test', 'conversation']);
    });

    it('should update contexts', async () => {
      const entry = {
        projectPath: '/test/project',
        type: 'code' as const,
        content: 'Original content',
        importance: 5,
        tags: ['original']
      };

      const id = await adapter.addContext(entry);
      
      await adapter.updateContext(id, {
        content: 'Updated content',
        importance: 9,
        tags: ['updated']
      });

      const updated = await adapter.getContextById(id);
      expect(updated!.content).toBe('Updated content');
      expect(updated!.importance).toBe(9);
      expect(updated!.tags).toEqual(['updated']);
    });

    it('should delete contexts', async () => {
      const entry = {
        projectPath: '/test/project',
        type: 'decision' as const,
        content: 'To be deleted',
        importance: 5,
        tags: []
      };

      const id = await adapter.addContext(entry);
      
      await adapter.deleteContext(id);
      
      const deleted = await adapter.getContextById(id);
      expect(deleted).toBeUndefined();
    });

    it('should search contexts', async () => {
      // Add test data
      await adapter.addContext({
        projectPath: '/test/project',
        type: 'conversation',
        content: 'JavaScript function implementation',
        importance: 7,
        tags: ['js', 'function']
      });

      await adapter.addContext({
        projectPath: '/test/project',
        type: 'code',
        content: 'Python script for data processing',
        importance: 6,
        tags: ['python', 'data']
      });

      // Search for JavaScript
      const jsResults = await adapter.searchContexts('JavaScript');
      expect(jsResults).toHaveLength(1);
      expect(jsResults[0].content).toContain('JavaScript');

      // Search with type filter
      const codeResults = await adapter.searchContexts('', { type: 'code' });
      expect(codeResults).toHaveLength(1);
      expect(codeResults[0].type).toBe('code');

      // Search with importance filter
      const importantResults = await adapter.searchContexts('', { importance: 7 });
      expect(importantResults).toHaveLength(1);
      expect(importantResults[0].importance).toBe(7);
    });

    it('should get context count', async () => {
      expect(await adapter.getContextCount()).toBe(0);

      await adapter.addContext({
        projectPath: '/test/project',
        type: 'conversation',
        content: 'Test 1',
        importance: 5,
        tags: []
      });

      await adapter.addContext({
        projectPath: '/test/project',
        type: 'code',
        content: 'Test 2',
        importance: 5,
        tags: []
      });

      expect(await adapter.getContextCount()).toBe(2);
      expect(await adapter.getContextCount({ type: 'conversation' })).toBe(1);
    });
  });

  describe('Agent Operations', () => {
    it('should add and retrieve agents', async () => {
      const agentData = {
        name: 'Test Agent',
        description: 'A test agent for testing',
        emoji: '🤖',
        specializations: ['Testing', 'Automation'],
        color: '#FF0000',
        enabled: true,
        isCustom: true,
        prompt: 'You are a test agent'
      };

      const agent = await adapter.addAgent(agentData);
      expect(agent.id).toBeDefined();
      expect(agent.name).toBe('Test Agent');

      const retrieved = await adapter.getAgentById(agent.id);
      expect(retrieved).toBeDefined();
      expect(retrieved!.name).toBe('Test Agent');
      expect(retrieved!.specializations).toEqual(['Testing', 'Automation']);
    });

    it('should update agents', async () => {
      const agentData = {
        name: 'Original Agent',
        description: 'Original description',
        specializations: ['Original'],
        enabled: true,
        isCustom: true
      };

      const agent = await adapter.addAgent(agentData);
      
      await adapter.updateAgent(agent.id, {
        name: 'Updated Agent',
        description: 'Updated description',
        enabled: false
      });

      const updated = await adapter.getAgentById(agent.id);
      expect(updated!.name).toBe('Updated Agent');
      expect(updated!.description).toBe('Updated description');
      expect(updated!.enabled).toBe(false);
    });

    it('should delete custom agents only', async () => {
      // Add custom agent
      const customAgent = await adapter.addAgent({
        name: 'Custom Agent',
        description: 'Custom agent',
        specializations: ['Custom'],
        enabled: true,
        isCustom: true
      });

      // Add standard agent
      const standardAgent = await adapter.addAgent({
        name: 'Standard Agent',
        description: 'Standard agent',
        specializations: ['Standard'],
        enabled: true,
        isCustom: false
      });

      // Should be able to delete custom agent
      await adapter.deleteAgent(customAgent.id);
      const deletedCustom = await adapter.getAgentById(customAgent.id);
      expect(deletedCustom).toBeUndefined();

      // Should NOT be able to delete standard agent
      await expect(adapter.deleteAgent(standardAgent.id)).rejects.toThrow();
    });

    it('should get all agents', async () => {
      expect(await adapter.getAllAgents()).toHaveLength(0);

      await adapter.addAgent({
        name: 'Agent 1',
        description: 'First agent',
        specializations: ['Test'],
        enabled: true,
        isCustom: true
      });

      await adapter.addAgent({
        name: 'Agent 2',
        description: 'Second agent',
        specializations: ['Test'],
        enabled: false,
        isCustom: false
      });

      const agents = await adapter.getAllAgents();
      expect(agents).toHaveLength(2);
    });
  });

  describe('Statistics', () => {
    it('should return database statistics', async () => {
      // Add some test data
      await adapter.addContext({
        projectPath: '/project1',
        type: 'conversation',
        content: 'Test 1',
        importance: 5,
        tags: []
      });

      await adapter.addContext({
        projectPath: '/project2',
        type: 'code',
        content: 'Test 2',
        importance: 7,
        tags: []
      });

      const stats = await adapter.getStats();
      expect(stats.totalContexts).toBe(2);
      expect(stats.byType.conversation).toBe(1);
      expect(stats.byType.code).toBe(1);
      expect(stats.byProject['/project1']).toBe(1);
      expect(stats.byProject['/project2']).toBe(1);
      expect(stats.adapterType).toBe('sqlite');
      expect(typeof stats.storageSize).toBe('number');
    });
  });
});