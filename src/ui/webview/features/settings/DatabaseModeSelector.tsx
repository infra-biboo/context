import { Component } from 'solid-js';
import { FileText, Database, Check, AlertTriangle } from 'lucide-solid';

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
            <span class="feature"><Check size={12} style={{'margin-right': '4px', display: 'inline'}} /> Fast setup</span>
            <span class="feature"><Check size={12} style={{'margin-right': '4px', display: 'inline'}} /> No external dependencies</span>
            <span class="feature"><AlertTriangle size={12} style={{'margin-right': '4px', display: 'inline'}} /> Limited to 1000 contexts</span>
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
            <span class="feature"><Check size={12} style={{'margin-right': '4px', display: 'inline'}} /> Unlimited contexts</span>
            <span class="feature"><Check size={12} style={{'margin-right': '4px', display: 'inline'}} /> Vector search</span>
            <span class="feature"><Check size={12} style={{'margin-right': '4px', display: 'inline'}} /> Team collaboration</span>
            <span class="feature"><AlertTriangle size={12} style={{'margin-right': '4px', display: 'inline'}} /> Requires PostgreSQL setup</span>
          </div>
        </div>
      </label>
    </div>
  );
};

export default DatabaseModeSelector;