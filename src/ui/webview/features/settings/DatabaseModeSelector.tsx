import { Component } from 'solid-js';
import { FileText, Database } from 'lucide-solid';

interface DatabaseModeSelectorProps {
  currentMode: 'json' | 'postgresql' | 'hybrid';
  onModeChange: (mode: 'json' | 'postgresql' | 'hybrid') => void;
}

const DatabaseModeSelector: Component<DatabaseModeSelectorProps> = (props) => {
  return (
    <div class="database-mode-selector">
      <label class="mode-option">
        <input 
          type="radio" 
          name="database-mode" 
          value="json"
          checked={props.currentMode === 'json'}
          onChange={() => props.onModeChange('json')}
        />
        <div class="mode-info">
          <div class="mode-header">
            <span class="mode-icon"><FileText size={24} /></span>
            <strong>Developer Mode (JSON)</strong>
          </div>
          <p class="mode-description">
            Local JSON file storage with context limit. Perfect for individual development.
          </p>
          <div class="mode-features">
            <span class="feature">✅ Fast setup</span>
            <span class="feature">✅ No external dependencies</span>
            <span class="feature">⚠️ Limited to 1000 contexts</span>
          </div>
        </div>
      </label>

      <label class="mode-option">
        <input 
          type="radio" 
          name="database-mode" 
          value="postgresql"
          checked={props.currentMode === 'postgresql'}
          onChange={() => props.onModeChange('postgresql')}
        />
        <div class="mode-info">
          <div class="mode-header">
            <span class="mode-icon"><Database size={24} /></span>
            <strong>Team/Advanced Mode (PostgreSQL)</strong>
          </div>
          <p class="mode-description">
            PostgreSQL database with unlimited contexts and vector search capabilities.
          </p>
          <div class="mode-features">
            <span class="feature">✅ Unlimited contexts</span>
            <span class="feature">✅ Vector search</span>
            <span class="feature">✅ Team collaboration</span>
            <span class="feature">⚠️ Requires PostgreSQL setup</span>
          </div>
        </div>
      </label>
    </div>
  );
};

export default DatabaseModeSelector;