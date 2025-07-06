import { EventEmitter } from 'events';
import { Logger } from '../utils/logger';

export interface SimpleTokenUsage {
  percentage: number;
  isNearLimit: boolean;
  resetTime: string;
  status: 'low' | 'medium' | 'high' | 'critical';
}

export class SimpleTokenMonitor extends EventEmitter {
  private currentUsage: SimpleTokenUsage;
  private sessionStartTime: number;
  private requestCount: number = 0;
  
  constructor() {
    super();
    this.sessionStartTime = Date.now();
    this.currentUsage = {
      percentage: 0,
      isNearLimit: false,
      resetTime: this.getResetTime(),
      status: 'low'
    };
    
    this.startMonitoring();
  }

  private startMonitoring(): void {
    // Update usage every 30 seconds
    setInterval(() => {
      this.updateUsageEstimate();
    }, 30 * 1000);
  }

  private updateUsageEstimate(): void {
    const now = new Date();
    const currentHour = now.getHours();
    const sessionDuration = (Date.now() - this.sessionStartTime) / (1000 * 60 * 60); // hours
    
    // Estimate based on time patterns and heuristics
    let estimatedPercentage = 0;
    
    // Base estimation on session duration and request count
    estimatedPercentage += Math.min(sessionDuration * 12, 40); // 12% per hour, max 40%
    estimatedPercentage += Math.min(this.requestCount * 0.5, 30); // 0.5% per request, max 30%
    
    // If we're close to reset time (7 AM), increase estimation
    const hoursUntilReset = this.getHoursUntilReset();
    if (hoursUntilReset < 2) {
      estimatedPercentage += 30; // Assume high usage if close to reset
    }
    
    // Cap at 100%
    estimatedPercentage = Math.min(estimatedPercentage, 100);
    
    this.currentUsage.percentage = estimatedPercentage;
    this.currentUsage.isNearLimit = estimatedPercentage > 80;
    this.currentUsage.resetTime = this.getResetTime();
    this.currentUsage.status = this.getUsageStatus(estimatedPercentage);
    
    this.emit('usage-updated', this.currentUsage);
    
    // Emit warnings if needed
    if (estimatedPercentage > 95) {
      this.emit('usage-warning', { 
        type: 'critical', 
        message: `CRÍTICO: ${estimatedPercentage.toFixed(1)}% del límite usado`,
        percentage: estimatedPercentage
      });
    } else if (estimatedPercentage > 80) {
      this.emit('usage-warning', { 
        type: 'warning', 
        message: `ADVERTENCIA: ${estimatedPercentage.toFixed(1)}% del límite usado`,
        percentage: estimatedPercentage
      });
    }
  }

  private getUsageStatus(percentage: number): 'low' | 'medium' | 'high' | 'critical' {
    if (percentage >= 95) return 'critical';
    if (percentage >= 80) return 'high';
    if (percentage >= 60) return 'medium';
    return 'low';
  }

  private getHoursUntilReset(): number {
    const now = new Date();
    const resetTime = new Date(now);
    resetTime.setHours(7, 0, 0, 0);
    
    // If it's already past 7 AM today, reset time is tomorrow
    if (now.getHours() >= 7) {
      resetTime.setDate(resetTime.getDate() + 1);
    }
    
    return (resetTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  }

  private getResetTime(): string {
    const hoursUntilReset = this.getHoursUntilReset();
    const hours = Math.floor(hoursUntilReset);
    const minutes = Math.floor((hoursUntilReset - hours) * 60);
    
    return `${hours}h${minutes}m`;
  }

  // Public methods to manually track usage
  public recordRequest(): void {
    this.requestCount++;
    this.updateUsageEstimate();
  }

  public setManualUsage(percentage: number): void {
    this.currentUsage.percentage = percentage;
    this.currentUsage.isNearLimit = percentage > 80;
    this.currentUsage.status = this.getUsageStatus(percentage);
    this.emit('usage-updated', this.currentUsage);
  }

  public getCurrentUsage(): SimpleTokenUsage {
    return { ...this.currentUsage };
  }

  public getFormattedUsage(): string {
    return `${this.currentUsage.percentage.toFixed(1)}% - Reset en ${this.currentUsage.resetTime}`;
  }

  public shouldStopUsage(): boolean {
    return this.currentUsage.percentage >= 95;
  }
}