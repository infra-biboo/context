import type { TranslationKeys } from './types';

export const en: TranslationKeys = {
  // === COMMON / SHARED ===
  common: {
    // Actions
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    refresh: "Refresh",
    close: "Close",
    search: "Search",
    loading: "Loading...",
    error: "Error",
    success: "Success",
    
    // Navigation
    general: "General",
    create: "Create",
    agents: "Agents",
    settings: "Settings",
  },

  // === GENERAL TAB ===
  general: {
    title: "General Overview",
    description: "Overview of your Claude Context Manager",
    
    getStarted: {
      title: "Get Started",
      welcome: "Welcome to the Context Manager! To unlock all features, you need to start the MCP Server.",
      instruction: "Please go to the **Settings** tab and click \"Start Server\" in the MCP Server Control section."
    },
    
    projectStatus: {
      title: "Project Status",
      contexts: "Contexts",
      totalContexts: "Total Contexts",
      databaseType: "Database Type",
      connectionStatus: "Connection Status",
      totalAgents: "Total Agents"
    },
    
    recentContexts: {
      title: "Recent Contexts",
      noContexts: "No contexts yet.",
      unknown: "UNKNOWN",
      noContent: "No content available"
    },
    
    breakdowns: {
      contextsByType: "Contexts by Type",
      contextsByProject: "Contexts by Project"
    },
    
    status: {
      connected: "connected",
      disconnected: "disconnected",
      connecting: "connecting"
    }
  },

  // === ADD CUSTOM CONTEXT ===
  addContext: {
    title: "Add Custom Context",
    
    success: {
      message: "Context added successfully!"
    },
    
    templates: {
      toggle: "Templates",
      show: "Show Templates",
      hide: "Hide Templates",
      fromClipboard: "From Clipboard",
      
      types: {
        meetingNotes: "Meeting Notes",
        bugReport: "Bug Report",
        codeSnippet: "Code Snippet",
        architectureDecision: "Architecture Decision"
      }
    },
    
    form: {
      // Content
      content: {
        label: "Content *",
        placeholder: "Enter your context content...",
        counter: "characters"
      },
      
      // Type
      type: {
        label: "Type *",
        autoDetect: {
          suggestion: "Auto-detected type",
          apply: "Apply"
        }
      },
      
      // Project Path  
      projectPath: {
        label: "Project Path",
        placeholder: "Auto-detected or enter manually...",
        autoDetect: "Auto-detect",
        detecting: "Detecting...",
        help: "The project is automatically detected from content or you can enter it manually"
      },
      
      // Importance
      importance: {
        label: "Importance",
        levels: {
          1: "Very Low",
          2: "Low",
          3: "Low",
          4: "Medium",
          5: "Medium",
          6: "Medium",
          7: "High",
          8: "High",
          9: "Critical",
          10: "Critical"
        },
        rangeLabels: {
          low: "1 - Low",
          medium: "5 - Medium",
          high: "10 - Critical"
        }
      },
      
      // Tags
      tags: {
        label: "Tags",
        placeholder: "Add tags...",
        add: "Add"
      },
      
      // Submit
      submit: {
        create: "Create Context",
        creating: "Creating..."
      }
    },
    
    // Context Types
    types: {
      conversation: "Conversation",
      decision: "Decision",
      code: "Code",
      issue: "Issue",
      custom: "Custom",
      note: "Note",
      reference: "Reference"
    }
  },

  // === SETTINGS ===
  settings: {
    title: "Settings",
    
    language: {
      title: "Language",
      label: "Select Language",
      current: "Current language"
    },
    
    mcpServer: {
      title: "MCP Server Control",
      status: "Server Status",
      start: "Start Server",
      stop: "Stop Server",
      restart: "Restart Server"
    },
    
    database: {
      title: "Database Configuration",
      type: "Database Type",
      connection: "Connection Status"
    }
  },

  // === SEARCH ===
  search: {
    title: "Search Contexts",
    placeholder: "Search contexts...",
    results: "Results",
    noResults: "No results found",
    filters: "Filters",
    searchBy: "Search by"
  },

  // === AGENTS ===
  agents: {
    title: "AI Agents",
    description: "Manage your AI agents",
    noAgents: "No agents configured",
    create: "Create Agent",
    edit: "Edit Agent",
    delete: "Delete Agent",
    enabled: "Enabled",
    disabled: "Disabled"
  },

  // === ERRORS ===
  errors: {
    generic: "An error occurred",
    network: "Network error",
    validation: "Validation error",
    notFound: "Not found",
    unauthorized: "Unauthorized",
    serverError: "Server error",
    mcpConnection: "Failed to connect to MCP server"
  }
};