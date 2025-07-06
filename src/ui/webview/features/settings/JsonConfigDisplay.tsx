import { Component, Show } from 'solid-js';
import { DatabaseConfig } from '../../../../core/database/types';

interface JsonConfigDisplayProps {
  config: DatabaseConfig['json'];
}

const JsonConfigDisplay: Component<JsonConfigDisplayProps> = (props) => {
  return (
    <div class="json-config-display">
      <div class="config-field">
        <label>JSON File Path</label>
        <div class="config-value">
          <code>{props.config?.path || './context.json'}</code>
        </div>
      </div>

      <div class="config-field">
        <label>Maximum Contexts</label>
        <div class="config-value">
          <strong>{props.config?.maxContexts || 1000}</strong>
        </div>
      </div>

      <div class="config-info">
        <h4>📋 JSON Mode Features</h4>
        <ul>
          <li>✅ <strong>Fast:</strong> No network overhead</li>
          <li>✅ <strong>Simple:</strong> No setup required</li>
          <li>✅ <strong>Portable:</strong> File can be shared easily</li>
          <li>⚠️ <strong>Limited:</strong> Context limit prevents memory issues</li>
        </ul>
      </div>

      <Show when={props.config?.maxContexts && props.config.maxContexts > 2000}>
        <div class="config-warning">
          ⚠️ <strong>Warning:</strong> High context limits may impact performance
        </div>
      </Show>
    </div>
  );
};

export default JsonConfigDisplay;