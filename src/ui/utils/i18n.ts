/**
 * Internationalization system for Claude Context Manager
 * Supports multiple languages with easy expansion
 */

export type SupportedLanguage = 'en' | 'es';

export interface Translations {
    // Navigation
    nav: {
        general: string;
        agents: string;
        search: string;
    };
    
    // General tab
    general: {
        title: string;
        projectStatus: string;
        project: string;
        contexts: string;
        refresh: string;
        addTest: string;
        autoCaptureSettings: string;
        captureGitCommits: string;
        monitorFileChanges: string;
        status: string;
        mcpIntegration: string;
        claudeCode: string;
        generateConfig: string;
        testConnection: string;
        recentContexts: string;
        loading: string;
        noContexts: string;
        connected: string;
        disconnected: string;
        notConfigured: string;
        configure: string;
    };
    
    // Agents tab
    agents: {
        title: string;
        description: string;
        activeAgents: string;
        mode: string;
        lastUpdated: string;
        collaborationMode: string;
        collaborative: string;
        individual: string;
        hierarchical: string;
        never: string;
        architect: {
            name: string;
            description: string;
            specializations: string[];
        };
        backend: {
            name: string;
            description: string;
            specializations: string[];
        };
        frontend: {
            name: string;
            description: string;
            specializations: string[];
        };
    };
    
    // Search tab
    search: {
        title: string;
        placeholder: string;
        allTypes: string;
        allTime: string;
        today: string;
        thisWeek: string;
        thisMonth: string;
        clearFilters: string;
        testDelete: string;
        results: string;
        noResults: string;
        selectAll: string;
        selectNone: string;
        delete: string;
        loadingContexts: string;
    };
    
    // Context types
    contextTypes: {
        conversation: string;
        decision: string;
        code: string;
        issue: string;
    };
    
    // Edit modal
    edit: {
        title: string;
        content: string;
        type: string;
        importance: string;
        importanceLow: string;
        importanceHigh: string;
        tags: string;
        tagsPlaceholder: string;
        cancel: string;
        save: string;
        delete: string;
        contentRequired: string;
    };
    
    // Actions & Messages
    actions: {
        delete: string;
        edit: string;
        save: string;
        cancel: string;
        confirm: string;
        close: string;
        refresh: string;
        clear: string;
        test: string;
        generate: string;
        configure: string;
    };
    
    // Confirmations & Messages
    messages: {
        deleteConfirm: string;
        deleteMultipleConfirm: string;
        cannotUndo: string;
        contextDeleted: string;
        contextUpdated: string;
        settingsUpdated: string;
        configGenerated: string;
        testContextAdded: string;
        invalidContextId: string;
        refreshPage: string;
        noContextsForTest: string;
    };
    
    // Status & Info
    status: {
        loading: string;
        ready: string;
        active: string;
        inactive: string;
        enabled: string;
        disabled: string;
        of: string;
        importance: string;
        tags: string;
        noTags: string;
        timestamp: string;
    };
    
    // Time formats
    time: {
        now: string;
        minutesAgo: string;
        hoursAgo: string;
        daysAgo: string;
        weeksAgo: string;
        monthsAgo: string;
    };
}

export const translations: Record<SupportedLanguage, Translations> = {
    en: {
        nav: {
            general: 'General',
            agents: 'Agents',
            search: 'Search'
        },
        
        general: {
            title: 'General',
            projectStatus: 'Project Status',
            project: 'Project',
            contexts: 'Contexts',
            refresh: 'Refresh',
            addTest: 'Add Test',
            autoCaptureSettings: 'Auto-Capture Settings',
            captureGitCommits: 'Capture Git Commits',
            monitorFileChanges: 'Monitor File Changes',
            status: 'Status',
            mcpIntegration: 'MCP Integration',
            claudeCode: 'Claude Code',
            generateConfig: 'Generate Config',
            testConnection: 'Test Connection',
            recentContexts: 'Recent Contexts',
            loading: 'Loading...',
            noContexts: 'No contexts yet',
            connected: 'Connected',
            disconnected: 'Disconnected',
            notConfigured: 'Not configured',
            configure: 'Configure MCP to connect with Claude Code'
        },
        
        agents: {
            title: 'AI Agents',
            description: 'Select which specialized agents are available for conversations:',
            activeAgents: 'Active Agents',
            mode: 'Mode',
            lastUpdated: 'Last Updated',
            collaborationMode: 'Collaboration Mode',
            collaborative: 'Collaborative',
            individual: 'Individual',
            hierarchical: 'Hierarchical',
            never: 'Never',
            architect: {
                name: 'Architect',
                description: 'System design and architecture decisions',
                specializations: ['System Design', 'Architecture Patterns', 'Scalability']
            },
            backend: {
                name: 'Backend',
                description: 'Server-side development and APIs',
                specializations: ['REST APIs', 'Database Design', 'Authentication']
            },
            frontend: {
                name: 'Frontend',
                description: 'User interface and experience',
                specializations: ['React', 'UI/UX', 'Responsive Design']
            }
        },
        
        search: {
            title: 'Search Contexts',
            placeholder: 'Search contexts...',
            allTypes: 'All Types',
            allTime: 'All Time',
            today: 'Today',
            thisWeek: 'This Week',
            thisMonth: 'This Month',
            clearFilters: 'Clear Filters',
            testDelete: 'Test Delete',
            results: 'Results',
            noResults: 'No contexts found',
            selectAll: 'All',
            selectNone: 'None',
            delete: 'Delete',
            loadingContexts: 'Loading all contexts...'
        },
        
        contextTypes: {
            conversation: 'Conversation',
            decision: 'Decision',
            code: 'Code',
            issue: 'Issue'
        },
        
        edit: {
            title: 'Edit Context',
            content: 'Content',
            type: 'Type',
            importance: 'Importance (1-10)',
            importanceLow: 'Low',
            importanceHigh: 'High',
            tags: 'Tags (comma separated)',
            tagsPlaceholder: 'tag1, tag2, tag3',
            cancel: 'Cancel',
            save: 'Save Changes',
            delete: 'Delete',
            contentRequired: 'Content cannot be empty'
        },
        
        actions: {
            delete: 'Delete',
            edit: 'Edit',
            save: 'Save',
            cancel: 'Cancel',
            confirm: 'Confirm',
            close: 'Close',
            refresh: 'Refresh',
            clear: 'Clear',
            test: 'Test',
            generate: 'Generate',
            configure: 'Configure'
        },
        
        messages: {
            deleteConfirm: 'Are you sure you want to delete this context? This action cannot be undone.',
            deleteMultipleConfirm: 'Are you sure you want to delete {count} selected context{plural}? This action cannot be undone.',
            cannotUndo: 'This action cannot be undone',
            contextDeleted: 'Context deleted',
            contextUpdated: 'Context updated successfully',
            settingsUpdated: 'Settings updated',
            configGenerated: 'MCP configuration generated',
            testContextAdded: 'Test context added!',
            invalidContextId: 'Error: Invalid context ID. Please refresh the page and try again.',
            refreshPage: 'Please refresh the page and try again',
            noContextsForTest: 'No contexts found to test deletion'
        },
        
        status: {
            loading: 'Loading',
            ready: 'Ready',
            active: 'Active',
            inactive: 'Inactive',
            enabled: 'Enabled',
            disabled: 'Disabled',
            of: 'of',
            importance: 'Importance',
            tags: 'Tags',
            noTags: 'no tags',
            timestamp: 'Timestamp'
        },
        
        time: {
            now: 'now',
            minutesAgo: '{count}m ago',
            hoursAgo: '{count}h ago',
            daysAgo: '{count}d ago',
            weeksAgo: '{count}w ago',
            monthsAgo: '{count}mo ago'
        }
    },
    
    es: {
        nav: {
            general: 'General',
            agents: 'Agentes',
            search: 'Buscar'
        },
        
        general: {
            title: 'General',
            projectStatus: 'Estado del Proyecto',
            project: 'Proyecto',
            contexts: 'Contextos',
            refresh: 'Actualizar',
            addTest: 'Agregar Prueba',
            autoCaptureSettings: 'Configuración de Auto-Captura',
            captureGitCommits: 'Capturar Commits de Git',
            monitorFileChanges: 'Monitorear Cambios de Archivos',
            status: 'Estado',
            mcpIntegration: 'Integración MCP',
            claudeCode: 'Claude Code',
            generateConfig: 'Generar Configuración',
            testConnection: 'Probar Conexión',
            recentContexts: 'Contextos Recientes',
            loading: 'Cargando...',
            noContexts: 'Aún no hay contextos',
            connected: 'Conectado',
            disconnected: 'Desconectado',
            notConfigured: 'No configurado',
            configure: 'Configurar MCP para conectar con Claude Code'
        },
        
        agents: {
            title: 'Agentes IA',
            description: 'Selecciona qué agentes especializados están disponibles para conversaciones:',
            activeAgents: 'Agentes Activos',
            mode: 'Modo',
            lastUpdated: 'Última Actualización',
            collaborationMode: 'Modo de Colaboración',
            collaborative: 'Colaborativo',
            individual: 'Individual',
            hierarchical: 'Jerárquico',
            never: 'Nunca',
            architect: {
                name: 'Arquitecto',
                description: 'Diseño de sistemas y decisiones de arquitectura',
                specializations: ['Diseño de Sistemas', 'Patrones de Arquitectura', 'Escalabilidad']
            },
            backend: {
                name: 'Backend',
                description: 'Desarrollo del servidor y APIs',
                specializations: ['APIs REST', 'Diseño de Base de Datos', 'Autenticación']
            },
            frontend: {
                name: 'Frontend',
                description: 'Interfaz de usuario y experiencia',
                specializations: ['React', 'UI/UX', 'Diseño Responsivo']
            }
        },
        
        search: {
            title: 'Buscar Contextos',
            placeholder: 'Buscar contextos...',
            allTypes: 'Todos los Tipos',
            allTime: 'Todo el Tiempo',
            today: 'Hoy',
            thisWeek: 'Esta Semana',
            thisMonth: 'Este Mes',
            clearFilters: 'Limpiar Filtros',
            testDelete: 'Probar Eliminar',
            results: 'Resultados',
            noResults: 'No se encontraron contextos',
            selectAll: 'Todos',
            selectNone: 'Ninguno',
            delete: 'Eliminar',
            loadingContexts: 'Cargando todos los contextos...'
        },
        
        contextTypes: {
            conversation: 'Conversación',
            decision: 'Decisión',
            code: 'Código',
            issue: 'Problema'
        },
        
        edit: {
            title: 'Editar Contexto',
            content: 'Contenido',
            type: 'Tipo',
            importance: 'Importancia (1-10)',
            importanceLow: 'Baja',
            importanceHigh: 'Alta',
            tags: 'Etiquetas (separadas por comas)',
            tagsPlaceholder: 'etiqueta1, etiqueta2, etiqueta3',
            cancel: 'Cancelar',
            save: 'Guardar Cambios',
            delete: 'Eliminar',
            contentRequired: 'El contenido no puede estar vacío'
        },
        
        actions: {
            delete: 'Eliminar',
            edit: 'Editar',
            save: 'Guardar',
            cancel: 'Cancelar',
            confirm: 'Confirmar',
            close: 'Cerrar',
            refresh: 'Actualizar',
            clear: 'Limpiar',
            test: 'Probar',
            generate: 'Generar',
            configure: 'Configurar'
        },
        
        messages: {
            deleteConfirm: '¿Estás seguro de que quieres eliminar este contexto? Esta acción no se puede deshacer.',
            deleteMultipleConfirm: '¿Estás seguro de que quieres eliminar {count} contexto{plural} seleccionado{plural}? Esta acción no se puede deshacer.',
            cannotUndo: 'Esta acción no se puede deshacer',
            contextDeleted: 'Contexto eliminado',
            contextUpdated: 'Contexto actualizado exitosamente',
            settingsUpdated: 'Configuración actualizada',
            configGenerated: 'Configuración MCP generada',
            testContextAdded: '¡Contexto de prueba agregado!',
            invalidContextId: 'Error: ID de contexto inválido. Por favor recarga la página e intenta de nuevo.',
            refreshPage: 'Por favor recarga la página e intenta de nuevo',
            noContextsForTest: 'No se encontraron contextos para probar la eliminación'
        },
        
        status: {
            loading: 'Cargando',
            ready: 'Listo',
            active: 'Activo',
            inactive: 'Inactivo',
            enabled: 'Habilitado',
            disabled: 'Deshabilitado',
            of: 'de',
            importance: 'Importancia',
            tags: 'Etiquetas',
            noTags: 'sin etiquetas',
            timestamp: 'Marca de tiempo'
        },
        
        time: {
            now: 'ahora',
            minutesAgo: 'hace {count}m',
            hoursAgo: 'hace {count}h',
            daysAgo: 'hace {count}d',
            weeksAgo: 'hace {count}s',
            monthsAgo: 'hace {count}m'
        }
    }
};

export class I18n {
    private static instance: I18n;
    private currentLanguage: SupportedLanguage = 'es'; // Default to Spanish per user preference
    
    private constructor() {}
    
    static getInstance(): I18n {
        if (!I18n.instance) {
            I18n.instance = new I18n();
        }
        return I18n.instance;
    }
    
    /**
     * Set the current language
     */
    setLanguage(language: SupportedLanguage): void {
        this.currentLanguage = language;
        console.log('🌍 Language set to:', language);
    }
    
    /**
     * Get current language
     */
    getCurrentLanguage(): SupportedLanguage {
        return this.currentLanguage;
    }
    
    /**
     * Get translations for current language
     */
    getTranslations(): Translations {
        return translations[this.currentLanguage];
    }
    
    /**
     * Translate a key with interpolation support
     */
    t(key: string, params?: Record<string, string | number>): string {
        const keys = key.split('.');
        let value: any = this.getTranslations();
        
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                console.warn(`Translation key not found: ${key}`);
                return key;
            }
        }
        
        if (typeof value !== 'string') {
            console.warn(`Translation value is not a string: ${key}`);
            return key;
        }
        
        // Handle interpolation
        if (params) {
            return this.interpolate(value, params);
        }
        
        return value;
    }
    
    /**
     * Interpolate parameters in a string
     */
    private interpolate(template: string, params: Record<string, string | number>): string {
        return template.replace(/\{(\w+)\}/g, (match, key) => {
            return key in params ? String(params[key]) : match;
        });
    }
    
    /**
     * Get plural form for a count
     */
    plural(count: number): string {
        if (this.currentLanguage === 'es') {
            return count === 1 ? '' : 's';
        } else {
            return count === 1 ? '' : 's';
        }
    }
    
    /**
     * Format relative time
     */
    formatRelativeTime(timestamp: Date | string): string {
        const now = new Date();
        const date = new Date(timestamp);
        const diffMs = now.getTime() - date.getTime();
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffWeeks = Math.floor(diffDays / 7);
        const diffMonths = Math.floor(diffDays / 30);
        
        if (diffMinutes < 1) {
            return this.t('time.now');
        } else if (diffMinutes < 60) {
            return this.t('time.minutesAgo', { count: diffMinutes });
        } else if (diffHours < 24) {
            return this.t('time.hoursAgo', { count: diffHours });
        } else if (diffDays < 7) {
            return this.t('time.daysAgo', { count: diffDays });
        } else if (diffWeeks < 4) {
            return this.t('time.weeksAgo', { count: diffWeeks });
        } else {
            return this.t('time.monthsAgo', { count: diffMonths });
        }
    }
    
    /**
     * Get available languages
     */
    getAvailableLanguages(): Array<{code: SupportedLanguage, name: string}> {
        return [
            { code: 'es', name: 'Español' },
            { code: 'en', name: 'English' }
        ];
    }
}

// Export singleton instance
export const i18n = I18n.getInstance();