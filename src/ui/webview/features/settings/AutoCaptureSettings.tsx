import { Component, createSignal } from 'solid-js';
import { appController } from '../../core/app-controller';

const AutoCaptureSettings: Component = () => {
  const [gitCapture, setGitCapture] = createSignal(false);
  const [fileCapture, setFileCapture] = createSignal(false);

  const handleToggleGitCapture = () => {
    setGitCapture(!gitCapture());
    // appController.toggleGitCapture(!gitCapture());
  };

  const handleToggleFileCapture = () => {
    setFileCapture(!fileCapture());
    // appController.toggleFileCapture(!fileCapture());
  };

  return (
    <div class="settings-section">
      <h3>Auto-Capture Settings</h3>
      <div class="capture-settings">
        <label class="capture-option">
          <input
            type="checkbox"
            checked={gitCapture()}
            onChange={handleToggleGitCapture}
          />
          Capture Git Commits
        </label>
        <label class="capture-option">
          <input
            type="checkbox"
            checked={fileCapture()}
            onChange={handleToggleFileCapture}
          />
          Monitor File Changes
        </label>
        <div class="capture-status">
          Status: Git: {gitCapture() ? '✅' : '❌'} | Files: {fileCapture() ? '✅' : '❌'}
        </div>
      </div>
    </div>
  );
};

export default AutoCaptureSettings;
