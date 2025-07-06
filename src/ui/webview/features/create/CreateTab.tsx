import { Component, createSignal } from 'solid-js';
import { Eye, Lightbulb, Folder, Edit, Check } from 'lucide-solid';
import { appController } from '../../core/app-controller';
import type { ContextEntry } from '../../../../core/database/types';
import ContentCard from '../../components/ContentCard';
import Button from '../../components/Button';

const CreateTab: Component = () => {
  // Form state
  const [content, setContent] = createSignal('');
  const [type, setType] = createSignal<ContextEntry['type']>('custom');
  const [importance, setImportance] = createSignal(5);
  const [tags, setTags] = createSignal('custom');
  const [project, setProject] = createSignal('');
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [successMessage, setSuccessMessage] = createSignal('');

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    
    if (!content().trim()) {
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage('');

    try {
      // Create the custom context via the controller
      appController.createCustomContext({
        content: content().trim(),
        type: type() as ContextEntry['type'],
        importance: importance(),
        tags: tags().split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
        projectPath: project().trim() || 'unknown'
      });

      // Show success message
      setSuccessMessage('Context created successfully!');
      
      // Reset form
      setContent('');
      setType('custom');
      setImportance(5);
      setTags('custom');
      setProject('');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (error) {
      console.error('Error creating context:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const contextTypes = [
    { value: 'custom', label: 'Custom' },
    { value: 'conversation', label: 'Conversation' },
    { value: 'decision', label: 'Decision' },
    { value: 'code', label: 'Code' },
    { value: 'issue', label: 'Issue' },
    { value: 'note', label: 'Note' },
    { value: 'reference', label: 'Reference' }
  ];

  return (
    <div class="create-tab">
      <ContentCard title="Create Custom Context" icon={<Edit size={20} />}>
        <form onSubmit={handleSubmit} class="create-form">
          <div class="form-group">
            <label for="content" class="form-label">
              Content <span class="required">*</span>
            </label>
            <textarea
              id="content"
              value={content()}
              onInput={(e) => setContent(e.currentTarget.value)}
              placeholder="Enter the context content..."
              class="form-textarea"
              rows={6}
              required
            />
            <small class="form-help">
              Describe the context, decision, code snippet, or any relevant information.
            </small>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="type" class="form-label">Type</label>
              <select
                id="type"
                value={type()}
                onChange={(e) => setType(e.currentTarget.value as ContextEntry['type'])}
                class="form-select"
              >
                {contextTypes.map(type => (
                  <option value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div class="form-group">
              <label for="importance" class="form-label">
                Importance: <span class="importance-value">{importance()}</span>
              </label>
              <input
                type="range"
                id="importance"
                min="1"
                max="10"
                value={importance()}
                onInput={(e) => setImportance(parseInt(e.currentTarget.value))}
                class="form-range"
              />
              <div class="range-labels">
                <span>1 (Low)</span>
                <span>10 (High)</span>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label for="tags" class="form-label">
              Tags <span class="required">*</span>
            </label>
            <input
              type="text"
              id="tags"
              value={tags()}
              onInput={(e) => setTags(e.currentTarget.value)}
              placeholder="custom, important, feature"
              class="form-input"
              required
            />
            <small class="form-help">
              Comma-separated tags. Always include "custom" to differentiate this context.
            </small>
          </div>

          <div class="form-group">
            <label for="project" class="form-label">Project (Optional)</label>
            <input
              type="text"
              id="project"
              value={project()}
              onInput={(e) => setProject(e.currentTarget.value)}
              placeholder="Project name or identifier"
              class="form-input"
            />
            <small class="form-help">
              Associate this context with a specific project.
            </small>
          </div>

          <div class="form-actions">
            <Button 
              type="submit" 
              disabled={isSubmitting() || !content().trim()}
              variant="primary"
            >
              {isSubmitting() ? 'Creating...' : 'Create Context'}
            </Button>
            
            {successMessage() && (
              <div class="success-message">
                <Check size={16} class="inline" /> {successMessage()}
              </div>
            )}
          </div>
        </form>
      </ContentCard>

      <ContentCard title="Context Preview" icon={<Eye size={20} />}>
        <div class="context-preview">
          {content() ? (
            <div class={`context-item preview ${tags().includes('custom') ? 'custom-context' : ''}`}>
              <div class="context-header">
                <strong class="context-type">{type().toUpperCase()}</strong>
                <span class="context-importance">Importance: {importance()}/10</span>
              </div>
              <div class="context-content">
                {content()}
              </div>
              <div class="context-meta">
                <div class="context-tags">
                  {tags().split(',').map(tag => tag.trim()).filter(tag => tag.length > 0).map(tag => (
                    <span class={`context-tag ${tag === 'custom' ? 'custom-tag' : ''}`}>
                      {tag}
                    </span>
                  ))}
                </div>
                {project() && (
                  <div class="context-project">
                    <Folder size={16} style={{'margin-right': '4px'}} /> {project()}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div class="empty-preview">
              Start typing to see a preview of your context...
            </div>
          )}
        </div>
      </ContentCard>

      <ContentCard title="Tips" icon={<Lightbulb size={20} />}>
        <ul class="tips-list">
          <li>Always include the "custom" tag to differentiate your manually created contexts</li>
          <li>Use descriptive content that will be useful when searching later</li>
          <li>Higher importance values make contexts more prominent in search results</li>
          <li>Tags help organize and filter your contexts effectively</li>
          <li>Custom contexts will appear with a distinctive color in the search results</li>
        </ul>
      </ContentCard>
    </div>
  );
};

export default CreateTab;
