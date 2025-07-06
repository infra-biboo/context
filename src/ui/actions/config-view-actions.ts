import { ConfigStore } from '../../core/config-store';
import { AutoCapture } from '../../capture/auto-capture';
import { Logger } from '../../utils/logger';

export class ConfigViewActions {
    constructor(
        private configStore: ConfigStore,
        private autoCapture: AutoCapture
    ) {}

    async getConfig(): Promise<{ config: any, status: any }> {
        try {
            const config = this.configStore.getConfig();
            const status = this.autoCapture.getStatus();
            return { config, status };
        } catch (error) {
            Logger.error('Error getting config:', error as Error);
            throw error;
        }
    }

    async toggleGitCapture(): Promise<void> {
        try {
            await this.autoCapture.toggleGitMonitoring();
        } catch (error) {
            Logger.error('Error toggling git capture:', error as Error);
            throw error;
        }
    }

    async toggleFileCapture(): Promise<void> {
        try {
            await this.autoCapture.toggleFileMonitoring();
        } catch (error) {
            Logger.error('Error toggling file capture:', error as Error);
            throw error;
        }
    }

    async addTestContext(): Promise<void> {
        try {
            await this.autoCapture.captureManualContext('conversation', 'Test context from panel', 5, ['test']);
        } catch (error) {
            Logger.error('Error adding test context:', error as Error);
            throw error;
        }
    }
}