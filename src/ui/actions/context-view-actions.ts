import { ContextDatabase, ContextEntry } from '../../core/database';
import { Logger } from '../../utils/logger';

export class ContextViewActions {
    constructor(private database: ContextDatabase) {}

    async getContexts(): Promise<ContextEntry[]> {
        try {
            const contexts = await this.database.getContexts();
            return contexts.slice(0, 20);
        } catch (error) {
            Logger.error('Error getting contexts:', error as Error);
            throw error;
        }
    }

    async searchContexts(query: string, filters: any): Promise<ContextEntry[]> {
        try {
            if (!query && !filters) {
                return this.getContexts();
            }

            // Use the database's search method instead of manual filtering
            const results = await this.database.searchContexts(query, {
                type: filters?.type,
                importance: filters?.importance,
                tags: filters?.tags,
                limit: 50
            });

            return results;
        } catch (error) {
            Logger.error('Error searching contexts:', error as Error);
            throw error;
        }
    }

    async getContextById(contextId: string): Promise<ContextEntry | undefined> {
        try {
            return await this.database.getContextById(contextId);
        } catch (error) {
            Logger.error('Error getting context by ID:', error as Error);
            throw error;
        }
    }

    async updateContext(contextId: string, updates: any): Promise<void> {
        try {
            await this.database.updateContext(contextId, updates);
        } catch (error) {
            Logger.error('Error updating context:', error as Error);
            throw error;
        }
    }

    async deleteContext(contextId: string): Promise<void> {
        try {
            await this.database.deleteContext(contextId);
        } catch (error) {
            Logger.error('Error deleting context:', error as Error);
            throw error;
        }
    }

    async deleteMultipleContexts(contextIds: string[]): Promise<void> {
        try {
            const deletePromises = contextIds.map(id => this.database.deleteContext(id));
            await Promise.all(deletePromises);
        } catch (error) {
            Logger.error('Error deleting multiple contexts:', error as Error);
            throw error;
        }
    }
}