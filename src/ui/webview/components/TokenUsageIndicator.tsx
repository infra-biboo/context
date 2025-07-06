import { Component, Show, createMemo } from 'solid-js';
import { CheckCircle, XCircle, AlertCircle, AlertTriangle } from 'lucide-solid';
import { store } from '../core/store';

const TokenUsageIndicator: Component = () => {
  const getUsageColor = createMemo(() => {
    const usage = store.session.tokenUsage;
    if (!usage) return '#4CAF50';
    
    switch (usage.status) {
      case 'critical': return '#f44336'; // Red
      case 'high': return '#ff9800'; // Orange
      case 'medium': return '#ffeb3b'; // Yellow
      default: return '#4CAF50'; // Green
    }
  });

  const getUsageIcon = createMemo(() => {
    const usage = store.session.tokenUsage;
    if (!usage) return CheckCircle;
    
    switch (usage.status) {
      case 'critical': return XCircle;
      case 'high': return AlertTriangle;
      case 'medium': return AlertCircle;
      default: return CheckCircle;
    }
  });

  return (
    <Show when={store.session.tokenUsage}>
      <div class="token-usage-indicator">
        <div class="token-usage-main">
          <span class="token-icon">{getUsageIcon()({ size: 16 })}</span>
          <span class="token-percentage">
            {store.session.tokenUsage?.percentage.toFixed(1)}%
          </span>
          <div class="token-bar">
            <div 
              class="token-fill"
              style={{
                width: `${store.session.tokenUsage?.percentage || 0}%`,
                'background-color': getUsageColor()
              }}
            />
          </div>
        </div>
        <div class="token-details">
          <Show when={store.session.tokenUsage}>
            <span class="token-reset">
              Reset en {store.session.tokenUsage?.resetTime}
            </span>
            <Show when={store.session.tokenUsage?.isNearLimit}>
              <span class="token-warning">¡Cerca del límite!</span>
            </Show>
          </Show>
        </div>
      </div>
    </Show>
  );
};

export default TokenUsageIndicator;