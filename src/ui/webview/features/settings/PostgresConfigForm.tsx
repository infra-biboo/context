import { Component, createSignal, Show } from 'solid-js';
import { EyeOff, Eye, Database, AlertTriangle } from 'lucide-solid';
import { DatabaseConfig } from '../../../../core/database/types';

interface PostgresConfigFormProps {
  config: DatabaseConfig['postgresql'];
  onChange: (config: DatabaseConfig['postgresql']) => void;
}

const PostgresConfigForm: Component<PostgresConfigFormProps> = (props) => {
  const [showPassword, setShowPassword] = createSignal(false);

  const handleChange = (field: string, value: string | number | boolean) => {
    const currentConfig = props.config || {
      host: 'localhost',
      port: 5432,
      database: 'claude_context',
      username: 'postgres',
      password: '',
      ssl: false,
      vectorDimensions: 384
    };
    props.onChange({
      ...currentConfig,
      [field]: value
    });
  };

  return (
    <div class="postgres-config-form">
      <div class="form-row">
        <div class="form-field">
          <label>Host</label>
          <input 
            type="text"
            value={props.config?.host || 'localhost'}
            onInput={(e) => handleChange('host', e.target.value)}
            placeholder="localhost"
          />
        </div>
        <div class="form-field">
          <label>Port</label>
          <input 
            type="number"
            value={props.config?.port || 5432}
            onInput={(e) => handleChange('port', parseInt(e.target.value))}
            placeholder="5432"
          />
        </div>
      </div>

      <div class="form-field">
        <label>Database Name</label>
        <input 
          type="text"
          value={props.config?.database || 'claude_context'}
          onInput={(e) => handleChange('database', e.target.value)}
          placeholder="claude_context"
        />
      </div>

      <div class="form-row">
        <div class="form-field">
          <label>Username</label>
          <input 
            type="text"
            value={props.config?.username || 'postgres'}
            onInput={(e) => handleChange('username', e.target.value)}
            placeholder="postgres"
          />
        </div>
        <div class="form-field">
          <label>Password</label>
          <div class="password-field">
            <input 
              type={showPassword() ? 'text' : 'password'}
              value={props.config?.password || ''}
              onInput={(e) => handleChange('password', e.target.value)}
              placeholder="Enter password"
            />
            <button 
              type="button"
              class="password-toggle"
              onClick={() => setShowPassword(!showPassword())}
            >
              {showPassword() ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
      </div>

      <div class="form-row">
        <div class="form-field">
          <label class="checkbox-label">
            <input 
              type="checkbox"
              checked={props.config?.ssl || false}
              onChange={(e) => handleChange('ssl', e.target.checked)}
            />
            Enable SSL
          </label>
        </div>
        <div class="form-field">
          <label>Vector Dimensions</label>
          <input 
            type="number"
            value={props.config?.vectorDimensions || 384}
            onInput={(e) => handleChange('vectorDimensions', parseInt(e.target.value))}
            placeholder="384"
          />
        </div>
      </div>

      <div class="config-info">
        <h4><Database size={16} style={{'margin-right': '8px', display: 'inline'}} /> PostgreSQL Mode Features</h4>
        <ul>
          <li>✅ <strong>Unlimited:</strong> No context limits</li>
          <li>✅ <strong>Scalable:</strong> Handles large datasets</li>
          <li>✅ <strong>Vector Search:</strong> Semantic similarity search</li>
          <li>✅ <strong>Team Ready:</strong> Multi-user support</li>
          <li>⚠️ <strong>Setup Required:</strong> PostgreSQL server needed</li>
        </ul>
      </div>

      <Show when={props.config?.vectorDimensions && props.config.vectorDimensions !== 384}>
        <div class="config-warning">
          <AlertTriangle size={16} style={{'margin-right': '4px'}} /> <strong>Note:</strong> Vector dimensions must match your embedding model
        </div>
      </Show>
    </div>
  );
};

export default PostgresConfigForm;