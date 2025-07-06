import { Component } from 'solid-js';
import { appController } from '../../core/app-controller';
import { store } from '../../core/store';
import { Check, X } from 'lucide-solid';

const AutoCaptureSettings: Component = () => {
  const handleToggleGitCapture = () => {
    const currentValue = store.session.config?.capture.gitCommits ?? true;
    appController.toggleGitCapture(!currentValue);
  };

  const handleToggleFileCapture = () => {
    const currentValue = store.session.config?.capture.fileChanges ?? true;
    appController.toggleFileCapture(!currentValue);
  };

  return (
    <div class="settings-section">
      <h3>Auto-Capture Settings</h3>
      <div class="capture-settings">
        <label class="capture-option">
          <input
            type="checkbox"
            checked={store.session.config?.capture.gitCommits ?? true}
            onChange={handleToggleGitCapture}
          />
          Capture Git Commits
        </label>
        <label class="capture-option">
          <input
            type="checkbox"
            checked={store.session.config?.capture.fileChanges ?? true}
            onChange={handleToggleFileCapture}
          />
          Monitor File Changes
        </label>
        <div class="capture-status">
          Status: Git: {(store.session.config?.capture.gitCommits ?? true) ? <Check size={16} style={{'margin-left': '4px', display: 'inline'}} /> : <X size={16} style={{'margin-left': '4px', display: 'inline'}} />} | Files: {(store.session.config?.capture.fileChanges ?? true) ? <Check size={16} style={{'margin-left': '4px', display: 'inline'}} /> : <X size={16} style={{'margin-left': '4px', display: 'inline'}} />}
        </div>
      </div>
    </div>
  );
};

export default AutoCaptureSettings;
