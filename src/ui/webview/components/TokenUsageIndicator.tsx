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
    <Show when={store.session.tokenUsage} fallback={<div>Loading token usage...</div>}>
      {(usage) => (
        <div class="token-usage-indicator">
          <div class="token-usage-main">
            <span class="token-icon">{getUsageIcon()({ size: 16 })}</span>
            <span class="token-percentage">
              {typeof usage().percentage === 'number'
                ? `${usage().percentage.toFixed(1)}%`
                : 'N/A'}
            </span>
            <div class="token-bar">
              <div 
                class="token-fill"
                style={{
                  width: `${usage().percentage || 0}%`,
                  'background-color': getUsageColor()
                }}
              />
            </div>
          </div>
          <div class="token-details">
            <Show when={usage().resetTime}>
              <span class="token-reset">
                Reset en {usage().resetTime}
              </span>
            </Show>
            <Show when={usage().isNearLimit}>
              <span class="token-warning">¡Cerca del límite!</span>
            </Show>
          </div>
        </div>
      )}
    </Show>
  );
};

export default TokenUsageIndicator;