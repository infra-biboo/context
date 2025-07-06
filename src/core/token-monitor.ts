import { EventEmitter } from 'events';
import { Logger } from '../utils/logger';

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
  totalTokens: number;
  requestCount: number;
  lastResetTime: number;
  estimatedLimit: number;
  usagePercentage: number;
}

export interface TokenLimitWarning {
  type: 'warning' | 'critical';
  percentage: number;
  message: string;
  timeUntilReset: number;
}

export class TokenMonitor extends EventEmitter {
  private usage: TokenUsage;
  private readonly DAILY_LIMIT_ESTIMATE = 200000; // Conservative estimate
  private readonly WARNING_THRESHOLD = 0.8; // 80%
  private readonly CRITICAL_THRESHOLD = 0.95; // 95%
  private readonly RESET_HOUR = 7; // 7 AM
  
  constructor() {
    super();
    this.usage = this.initializeUsage();
    this.startMonitoring();
  }

  private initializeUsage(): TokenUsage {
    const now = Date.now();
    const lastReset = this.getLastResetTime();
    
    return {
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 0,
      cacheCreationTokens: 0,
      totalTokens: 0,
      requestCount: 0,
      lastResetTime: lastReset,
      estimatedLimit: this.DAILY_LIMIT_ESTIMATE,
      usagePercentage: 0
    };
  }

  private getLastResetTime(): number {
    const now = new Date();
    const resetTime = new Date(now);
    resetTime.setHours(this.RESET_HOUR, 0, 0, 0);
    
    // If current time is before reset time today, use yesterday's reset
    if (now.getTime() < resetTime.getTime()) {
      resetTime.setDate(resetTime.getDate() - 1);
    }
    
    return resetTime.getTime();
  }

  private startMonitoring(): void {
    // Check for Claude Code usage indicators
    this.checkClaudeCodeUsage();
    
    // Check for reset every hour
    setInterval(() => {
      this.checkForReset();
    }, 60 * 60 * 1000);
    
    // Check usage every 30 seconds
    setInterval(() => {
      this.checkClaudeCodeUsage();
    }, 30 * 1000);
  }

  private checkClaudeCodeUsage(): void {
    try {
      // Check for Claude Code environment variables and context
      const isClaudeCodeSession = process.env.CLAUDECODE === '1';
      const currentHour = new Date().getHours();
      
      if (isClaudeCodeSession) {
        // Estimate usage based on time since last reset and current session activity
        const timeSinceReset = Date.now() - this.usage.lastResetTime;
        const hoursActive = timeSinceReset / (1000 * 60 * 60);
        
        // Simple heuristic: if we're close to reset time and getting usage warnings,
        // we're likely at high usage
        const isNearReset = currentHour >= 6 && currentHour <= 8;
        const hasUsageWarning = this.checkForUsageWarnings();
        
        if (hasUsageWarning && isNearReset) {
          // Estimate high usage (80-95%)
          const estimatedUsage = Math.min(85 + Math.random() * 10, 95);
          this.updateEstimatedUsage(estimatedUsage);
        } else if (hoursActive > 2) {
          // Estimate moderate usage based on activity
          const estimatedUsage = Math.min(hoursActive * 8, 75);
          this.updateEstimatedUsage(estimatedUsage);
        }
      }
    } catch (error) {
      Logger.error('Failed to check Claude Code usage:', error as Error);
    }
  }

  private checkForUsageWarnings(): boolean {
    try {
      // Check for Claude Code usage messages in console or environment
      // This is a simplified check - in a real implementation, you'd want to
      // integrate with Claude Code's actual usage reporting
      const now = new Date();
      const resetTime = new Date(now);
      resetTime.setHours(7, 0, 0, 0);
      
      // If we're within 2 hours of reset, assume high usage
      const timeUntilReset = resetTime.getTime() - now.getTime();
      const hoursUntilReset = timeUntilReset / (1000 * 60 * 60);
      
      return hoursUntilReset < 2 && hoursUntilReset > 0;
    } catch (error) {
      return false;
    }
  }

  private updateEstimatedUsage(percentage: number): void {
    const estimatedTokens = Math.floor((percentage / 100) * this.DAILY_LIMIT_ESTIMATE);
    this.usage.totalTokens = estimatedTokens;
    this.usage.usagePercentage = percentage;
    this.usage.requestCount += 1;
    
    this.checkForWarnings();
    this.emit('usage-updated', this.usage);
  }

  public recordTokenUsage(tokens: number, type: keyof Pick<TokenUsage, 'inputTokens' | 'outputTokens' | 'cacheReadTokens' | 'cacheCreationTokens'>): void {
    this.usage[type] += tokens;
    this.usage.totalTokens += tokens;
    this.usage.requestCount++;
    
    this.calculateUsagePercentage();
    this.checkForWarnings();
    
    this.emit('usage-updated', this.usage);
  }

  private calculateUsagePercentage(): void {
    this.usage.usagePercentage = Math.min(
      (this.usage.totalTokens / this.usage.estimatedLimit) * 100,
      100
    );
  }

  private checkForWarnings(): void {
    const percentage = this.usage.usagePercentage / 100;
    
    if (percentage >= this.CRITICAL_THRESHOLD) {
      const warning: TokenLimitWarning = {
        type: 'critical',
        percentage: this.usage.usagePercentage,
        message: `CRÍTICO: ${this.usage.usagePercentage.toFixed(1)}% del límite diario usado`,
        timeUntilReset: this.getTimeUntilReset()
      };
      this.emit('limit-warning', warning);
    } else if (percentage >= this.WARNING_THRESHOLD) {
      const warning: TokenLimitWarning = {
        type: 'warning',
        percentage: this.usage.usagePercentage,
        message: `ADVERTENCIA: ${this.usage.usagePercentage.toFixed(1)}% del límite diario usado`,
        timeUntilReset: this.getTimeUntilReset()
      };
      this.emit('limit-warning', warning);
    }
  }

  private getTimeUntilReset(): number {
    const now = new Date();
    const nextReset = new Date(now);
    nextReset.setDate(nextReset.getDate() + 1);
    nextReset.setHours(this.RESET_HOUR, 0, 0, 0);
    
    return nextReset.getTime() - now.getTime();
  }

  private checkForReset(): void {
    const now = Date.now();
    const timeSinceReset = now - this.usage.lastResetTime;
    const millisecondsInDay = 24 * 60 * 60 * 1000;
    
    if (timeSinceReset >= millisecondsInDay) {
      this.resetDailyUsage();
    }
  }

  private resetDailyUsage(): void {
    this.usage = this.initializeUsage();
    this.emit('daily-reset', this.usage);
    Logger.info('Daily token usage reset');
  }

  public getUsage(): TokenUsage {
    return { ...this.usage };
  }

  public getFormattedUsage(): string {
    const usage = this.usage;
    const timeUntilReset = this.getTimeUntilReset();
    const hoursUntilReset = Math.floor(timeUntilReset / (1000 * 60 * 60));
    const minutesUntilReset = Math.floor((timeUntilReset % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${usage.usagePercentage.toFixed(1)}% (${usage.totalTokens.toLocaleString()}/${usage.estimatedLimit.toLocaleString()}) - Reset en ${hoursUntilReset}h${minutesUntilReset}m`;
  }

  public shouldStopUsage(): boolean {
    return this.usage.usagePercentage >= 95;
  }

  public estimateTokensForRequest(inputText: string): number {
    // Simple estimation: ~4 characters per token
    return Math.ceil(inputText.length / 4);
  }

  public canMakeRequest(estimatedTokens: number): boolean {
    const projectedUsage = this.usage.totalTokens + estimatedTokens;
    const projectedPercentage = (projectedUsage / this.usage.estimatedLimit) * 100;
    
    return projectedPercentage < 98; // Leave 2% buffer
  }
}