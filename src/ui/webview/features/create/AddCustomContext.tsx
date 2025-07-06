import { Component, createSignal, createMemo, For, Show, onMount } from 'solid-js';
import { store, computed } from '../../core/store';
import { appController } from '../../core/app-controller';
import { useTranslation } from '../../i18n';
import type { ContextEntry } from '../../../../core/database/types';
import Button from '../../components/Button';
import ContentCard from '../../components/ContentCard';
import { Users, Bug, Code, Building, MessageSquare, Scale, Settings, FileText, Book, Plus } from 'lucide-solid';

interface ContextTemplate {
  id: string;
  name: string;
  icon: any;
  type: ContextEntry['type'];
  content: string;
  tags: string[];
  importance: number;
}

const getContextTemplates = (t: any): ContextTemplate[] => [
  {
    id: 'meeting-notes',
    name: t('addContext.templates.types.meetingNotes'),
    icon: <Users size={16} />,
    type: 'conversation',
    content: '# Meeting Notes\n\n**Date:** ${date}\n**Attendees:** \n**Topics Discussed:** \n\n## Key Decisions\n\n## Action Items\n\n## Follow-up',
    tags: ['meeting', 'notes'],
    importance: 7
  },
  {
    id: 'bug-report',
    name: t('addContext.templates.types.bugReport'),
    icon: <Bug size={16} />,
    type: 'issue',
    content: '# Bug Report\n\n**Issue:** \n**Steps to Reproduce:** \n1. \n2. \n3. \n\n**Expected Behavior:** \n**Actual Behavior:** \n**Environment:** \n**Priority:** ',
    tags: ['bug', 'issue'],
    importance: 8
  },
  {
    id: 'code-snippet',
    name: t('addContext.templates.types.codeSnippet'),
    icon: <Code size={16} />,
    type: 'code',
    content: '# Code Snippet\n\n**Purpose:** \n**Language:** \n\n```\n// Add your code here\n```\n\n**Notes:** ',
    tags: ['code', 'snippet'],
    importance: 6
  },
  {
    id: 'architecture-decision',
    name: t('addContext.templates.types.architectureDecision'),
    icon: <Building size={16} />,
    type: 'decision',
    content: '# Architecture Decision Record\n\n**Decision:** \n**Context:** \n**Alternatives Considered:** \n**Consequences:** \n**Status:** Draft/Approved/Deprecated',
    tags: ['architecture', 'decision'],
    importance: 9
  }
];

const getTypeOptions = (t: any) => [
  { value: 'conversation', label: t('addContext.types.conversation'), icon: <MessageSquare size={16} /> },
  { value: 'decision', label: t('addContext.types.decision'), icon: <Scale size={16} /> },
  { value: 'code', label: t('addContext.types.code'), icon: <Code size={16} /> },
  { value: 'issue', label: t('addContext.types.issue'), icon: <Bug size={16} /> },
  { value: 'custom', label: t('addContext.types.custom'), icon: <Settings size={16} /> },
  { value: 'note', label: t('addContext.types.note'), icon: <FileText size={16} /> },
  { value: 'reference', label: t('addContext.types.reference'), icon: <Book size={16} /> }
] as const;

const AddCustomContext: Component = () => {
  const { t } = useTranslation();
  
  const [content, setContent] = createSignal('');
  const [type, setType] = createSignal<ContextEntry['type']>('custom');
  const [projectPath, setProjectPath] = createSignal('');
  const [importance, setImportance] = createSignal(5);
  const [tags, setTags] = createSignal<string[]>([]);
  const [tagInput, setTagInput] = createSignal('');
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [showSuccess, setShowSuccess] = createSignal(false);
  const [showTemplates, setShowTemplates] = createSignal(false);
  const [isDetectingProject, setIsDetectingProject] = createSignal(false);

  // Get translated options
  const contextTemplates = createMemo(() => getContextTemplates(t));
  const typeOptions = createMemo(() => getTypeOptions(t));

  // Character counter
  const characterCount = createMemo(() => content().length);
  const maxCharacters = 10000;

  // Auto-detection of type based on content
  const autoDetectedType = createMemo(() => {
    const text = content().toLowerCase();
    if (text.includes('meeting') || text.includes('discussion')) return 'conversation';
    if (text.includes('bug') || text.includes('issue') || text.includes('problem')) return 'issue';
    if (text.includes('```') || text.includes('function') || text.includes('class')) return 'code';
    if (text.includes('decision') || text.includes('architecture')) return 'decision';
    return 'custom';
  });

  // Suggested project paths from existing contexts
  const suggestedPaths = createMemo(() => {
    const paths = new Set<string>();
    store.data.contexts.forEach(context => {
      if (context.projectPath) paths.add(context.projectPath);
    });
    return Array.from(paths).sort();
  });

  // Suggested tags from existing contexts
  const suggestedTags = createMemo(() => {
    const allTags = new Set<string>();
    store.data.contexts.forEach(context => {
      context.tags?.forEach(tag => allTags.add(tag));
    });
    return Array.from(allTags).sort();
  });

  // Validation
  const isValid = createMemo(() => {
    return content().trim().length > 0 && 
           type().length > 0;
    // Project path is optional now since it's auto-detected
  });

  // Auto-detect project path from content
  const detectProjectFromContent = () => {
    const text = content().toLowerCase();
    
    // Common project indicators
    const projectPatterns = [
      /project[:\s]+([a-zA-Z0-9\-_]+)/i,
      /repo[:\s]+([a-zA-Z0-9\-_]+)/i,
      /app[:\s]+([a-zA-Z0-9\-_]+)/i,
      /website[:\s]+([a-zA-Z0-9\-_]+)/i,
      /([a-zA-Z0-9\-_]+)\/src/i,
      /([a-zA-Z0-9\-_]+)\/components/i,
      /([a-zA-Z0-9\-_]+)\/pages/i,
      /([a-zA-Z0-9\-_]+)\/api/i,
    ];

    for (const pattern of projectPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    // Try to detect from common programming terms
    if (text.includes('frontend') || text.includes('react') || text.includes('vue')) {
      return 'frontend';
    }
    if (text.includes('backend') || text.includes('api') || text.includes('server')) {
      return 'backend';
    }
    if (text.includes('mobile') || text.includes('android') || text.includes('ios')) {
      return 'mobile';
    }
    if (text.includes('documentation') || text.includes('docs') || text.includes('readme')) {
      return 'documentation';
    }

    return 'general';
  };

  // Get most common project path from existing contexts
  const getMostCommonProject = () => {
    const projectCounts = computed.stats().byProject;
    const sortedProjects = Object.entries(projectCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number));
    
    return sortedProjects.length > 0 ? sortedProjects[0][0] : 'general';
  };

  // Auto-detect project path
  const handleAutoDetectProject = async () => {
    setIsDetectingProject(true);
    
    try {
      let detectedProject = '';
      
      // First try to detect from content
      if (content().length > 20) {
        detectedProject = detectProjectFromContent();
      }
      
      // If no detection from content, use most common project
      if (!detectedProject || detectedProject === 'general') {
        detectedProject = getMostCommonProject();
      }
      
      // If still nothing, try to get from VS Code workspace
      // This would require a new command to get workspace info
      if (!detectedProject || detectedProject === 'general') {
        detectedProject = 'current-project';
      }
      
      setProjectPath(detectedProject);
      
    } catch (error) {
      console.error('Failed to detect project:', error);
      setProjectPath('general');
    } finally {
      setIsDetectingProject(false);
    }
  };

  // Auto-detect type when content changes
  onMount(() => {
    // Auto-detect project path on mount
    handleAutoDetectProject();
    
    // Auto-detect type when content changes significantly
    const autoDetectTimer = setInterval(() => {
      if (content().length > 50) {
        const detected = autoDetectedType();
        if (detected !== type() && detected !== 'custom') {
          setType(detected);
        }
        
        // Also try to detect project from content if field is empty
        if (!projectPath() || projectPath() === 'general') {
          const projectDetected = detectProjectFromContent();
          if (projectDetected && projectDetected !== 'general') {
            setProjectPath(projectDetected);
          }
        }
      }
    }, 2000);

    return () => clearInterval(autoDetectTimer);
  });

  const handleAddTag = () => {
    const tag = tagInput().trim();
    if (tag && !tags().includes(tag)) {
      setTags([...tags(), tag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags().filter(tag => tag !== tagToRemove));
  };

  const handleTagInputKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleApplyTemplate = (template: ContextTemplate) => {
    const dateStr = new Date().toLocaleDateString();
    const templateContent = template.content.replace('${date}', dateStr);
    
    setContent(templateContent);
    setType(template.type);
    setTags(template.tags);
    setImportance(template.importance);
    setShowTemplates(false);
  };

  const handleSubmit = async () => {
    if (!isValid()) return;

    setIsSubmitting(true);
    try {
      // Ensure we have a project path
      const finalProjectPath = projectPath() || 'general';
      
      await appController.createCustomContext({
        content: content(),
        type: type(),
        projectPath: finalProjectPath,
        importance: importance(),
        tags: tags()
      });

      // Reset form
      setContent('');
      setType('custom');
      setProjectPath('');
      setImportance(5);
      setTags([]);
      setTagInput('');
      
      // Show success feedback
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);

    } catch (error) {
      console.error('Failed to create context:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickCapture = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (clipboardText) {
        setContent(clipboardText);
      }
    } catch (error) {
      console.warn('Could not access clipboard:', error);
    }
  };

  return (
    <ContentCard icon={<Plus size={20} />} title={t('addContext.title')}>
      <div class="add-context-form">
        {/* Success Message */}
        <Show when={showSuccess()}>
          <div class="success-message">
            {t('addContext.success.message')}
          </div>
        </Show>

        {/* Quick Templates */}
        <div class="quick-templates">
          <div class="templates-header">
            <Button 
              variant="secondary" 
              onClick={() => setShowTemplates(!showTemplates())}
              class="templates-toggle"
            >
              {showTemplates() ? t('addContext.templates.hide') : t('addContext.templates.show')}
            </Button>
            <Button 
              variant="secondary" 
              onClick={handleQuickCapture}
              class="quick-capture"
            >
              {t('addContext.templates.fromClipboard')}
            </Button>
          </div>
          
          <Show when={showTemplates()}>
            <div class="templates-grid">
              <For each={contextTemplates()}>
                {(template) => (
                  <button 
                    class="template-card"
                    onClick={() => handleApplyTemplate(template)}
                  >
                    <div class="template-icon">{template.icon}</div>
                    <div class="template-name">{template.name}</div>
                  </button>
                )}
              </For>
            </div>
          </Show>
        </div>

        {/* Content Input */}
        <div class="form-group">
          <label class="form-label">{t('addContext.form.content.label')}</label>
          <textarea
            class="form-textarea"
            value={content()}
            onInput={(e) => setContent(e.currentTarget.value)}
            placeholder={t('addContext.form.content.placeholder')}
            maxLength={maxCharacters}
            rows={8}
          />
          <div class="character-counter">
            {characterCount()} / {maxCharacters} {t('addContext.form.content.counter')}
          </div>
        </div>

        {/* Type Selector */}
        <div class="form-group">
          <label class="form-label">{t('addContext.form.type.label')}</label>
          <select 
            class="form-select"
            value={type()}
            onChange={(e) => setType(e.currentTarget.value as ContextEntry['type'])}
          >
            <For each={typeOptions()}>
              {(option) => (
                <option value={option.value}>
                  {option.icon} {option.label}
                </option>
              )}
            </For>
          </select>
          <Show when={autoDetectedType() !== type() && content().length > 50}>
            <div class="auto-detect-suggestion">
              {t('addContext.form.type.autoDetect.suggestion')}: {autoDetectedType()} 
              <button 
                class="link-button"
                onClick={() => setType(autoDetectedType())}
              >
                {t('addContext.form.type.autoDetect.apply')}
              </button>
            </div>
          </Show>
        </div>

        {/* Project Path Input */}
        <div class="form-group">
          <label class="form-label">{t('addContext.form.projectPath.label')}</label>
          <div class="project-input-container">
            <input
              class="form-input"
              type="text"
              value={projectPath()}
              onInput={(e) => setProjectPath(e.currentTarget.value)}
              placeholder={t('addContext.form.projectPath.placeholder')}
              list="project-suggestions"
            />
            <Button 
              variant="secondary" 
              onClick={handleAutoDetectProject}
              disabled={isDetectingProject()}
              class="detect-button"
            >
              {isDetectingProject() ? t('addContext.form.projectPath.detecting') : t('addContext.form.projectPath.autoDetect')}
            </Button>
          </div>
          <datalist id="project-suggestions">
            <For each={suggestedPaths()}>
              {(path) => <option value={path} />}
            </For>
          </datalist>
          <div class="project-help">
            {t('addContext.form.projectPath.help')}
          </div>
        </div>

        {/* Importance Slider */}
        <div class="form-group">
          <label class="form-label">
            {t('addContext.form.importance.label')}: {importance()} - {t(`addContext.form.importance.levels.${importance()}`)}
          </label>
          <input
            class="form-range"
            type="range"
            min="1"
            max="10"
            step="1"
            value={importance()}
            onInput={(e) => setImportance(parseInt(e.currentTarget.value))}
          />
          <div class="range-labels">
            <span>{t('addContext.form.importance.rangeLabels.low')}</span>
            <span>{t('addContext.form.importance.rangeLabels.medium')}</span>
            <span>{t('addContext.form.importance.rangeLabels.high')}</span>
          </div>
        </div>

        {/* Tags Input */}
        <div class="form-group">
          <label class="form-label">{t('addContext.form.tags.label')}</label>
          <div class="tags-input-container">
            <input
              class="form-input"
              type="text"
              value={tagInput()}
              onInput={(e) => setTagInput(e.currentTarget.value)}
              onKeyDown={handleTagInputKeyDown}
              placeholder={t('addContext.form.tags.placeholder')}
              list="tag-suggestions"
            />
            <Button variant="secondary" onClick={handleAddTag} disabled={!tagInput().trim()}>
              {t('addContext.form.tags.add')}
            </Button>
          </div>
          <datalist id="tag-suggestions">
            <For each={suggestedTags()}>
              {(tag) => <option value={tag} />}
            </For>
          </datalist>
          
          <Show when={tags().length > 0}>
            <div class="tags-display">
              <For each={tags()}>
                {(tag) => (
                  <span class="tag-chip">
                    {tag}
                    <button 
                      class="tag-remove"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      ×
                    </button>
                  </span>
                )}
              </For>
            </div>
          </Show>
        </div>

        {/* Submit Button */}
        <div class="form-actions">
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!isValid() || isSubmitting()}
            class="submit-button"
          >
            {isSubmitting() ? t('addContext.form.submit.creating') : t('addContext.form.submit.create')}
          </Button>
        </div>
      </div>
    </ContentCard>
  );
};

export default AddCustomContext;