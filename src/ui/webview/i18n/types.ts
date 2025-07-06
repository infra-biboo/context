// TypeScript types for translation keys structure
export interface TranslationKeys {
  // === COMMON / SHARED ===
  common: {
    // Actions
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    add: string;
    refresh: string;
    close: string;
    search: string;
    loading: string;
    error: string;
    success: string;
    
    // Navigation
    general: string;
    create: string;
    agents: string;
    settings: string;
  };

  // === GENERAL TAB ===
  general: {
    title: string;
    description: string;
    
    getStarted: {
      title: string;
      welcome: string;
      instruction: string;
    };
    
    projectStatus: {
      title: string;
      contexts: string;
      totalContexts: string;
      databaseType: string;
      connectionStatus: string;
      totalAgents: string;
    };
    
    recentContexts: {
      title: string;
      noContexts: string;
      unknown: string;
      noContent: string;
    };
    
    breakdowns: {
      contextsByType: string;
      contextsByProject: string;
    };
    
    status: {
      connected: string;
      disconnected: string;
      connecting: string;
    };
  };

  // === ADD CUSTOM CONTEXT ===
  addContext: {
    title: string;
    
    success: {
      message: string;
    };
    
    templates: {
      toggle: string;
      show: string;
      hide: string;
      fromClipboard: string;
      
      types: {
        meetingNotes: string;
        bugReport: string;
        codeSnippet: string;
        architectureDecision: string;
      };
    };
    
    form: {
      // Content
      content: {
        label: string;
        placeholder: string;
        counter: string;
      };
      
      // Type
      type: {
        label: string;
        autoDetect: {
          suggestion: string;
          apply: string;
        };
      };
      
      // Project Path  
      projectPath: {
        label: string;
        placeholder: string;
        autoDetect: string;
        detecting: string;
        help: string;
      };
      
      // Importance
      importance: {
        label: string;
        levels: {
          1: string;
          2: string;
          3: string;
          4: string;
          5: string;
          6: string;
          7: string;
          8: string;
          9: string;
          10: string;
        };
        rangeLabels: {
          low: string;
          medium: string;
          high: string;
        };
      };
      
      // Tags
      tags: {
        label: string;
        placeholder: string;
        add: string;
      };
      
      // Submit
      submit: {
        create: string;
        creating: string;
      };
    };
    
    // Context Types
    types: {
      conversation: string;
      decision: string;
      code: string;
      issue: string;
      custom: string;
      note: string;
      reference: string;
    };
  };

  // === SETTINGS ===
  settings: {
    title: string;
    
    language: {
      title: string;
      label: string;
      current: string;
    };
    
    mcpServer: {
      title: string;
      status: string;
      start: string;
      stop: string;
      restart: string;
    };
    
    database: {
      title: string;
      type: string;
      connection: string;
    };
  };

  // === SEARCH ===
  search: {
    title: string;
    placeholder: string;
    results: string;
    noResults: string;
    filters: string;
    searchBy: string;
  };

  // === AGENTS ===
  agents: {
    title: string;
    description: string;
    noAgents: string;
    create: string;
    edit: string;
    delete: string;
    enabled: string;
    disabled: string;
  };

  // === ERRORS ===
  errors: {
    generic: string;
    network: string;
    validation: string;
    notFound: string;
    unauthorized: string;
    serverError: string;
    mcpConnection: string;
  };
}