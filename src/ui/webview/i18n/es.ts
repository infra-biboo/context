import type { TranslationKeys } from './types';

export const es: TranslationKeys = {
  // === COMÚN / COMPARTIDO ===
  common: {
    // Acciones
    save: "Guardar",
    cancel: "Cancelar",
    delete: "Eliminar",
    edit: "Editar",
    add: "Agregar",
    refresh: "Actualizar",
    close: "Cerrar",
    search: "Buscar",
    loading: "Cargando...",
    error: "Error",
    success: "Éxito",
    
    // Navegación
    general: "General",
    create: "Crear",
    agents: "Agentes",
    settings: "Configuración",
  },

  // === PESTAÑA GENERAL ===
  general: {
    title: "Vista General",
    description: "Resumen de tu Gestor de Contextos Claude",
    
    getStarted: {
      title: "Comenzar",
      welcome: "¡Bienvenido al Gestor de Contextos! Para desbloquear todas las funciones, necesitas iniciar el Servidor MCP.",
      instruction: "Por favor ve a la pestaña **Configuración** y haz clic en \"Iniciar Servidor\" en la sección Control del Servidor MCP."
    },
    
    projectStatus: {
      title: "Estado del Proyecto",
      contexts: "Contextos",
      totalContexts: "Total de Contextos",
      databaseType: "Tipo de Base de Datos",
      connectionStatus: "Estado de Conexión",
      totalAgents: "Total de Agentes"
    },
    
    recentContexts: {
      title: "Contextos Recientes",
      noContexts: "Aún no hay contextos.",
      unknown: "DESCONOCIDO",
      noContent: "No hay contenido disponible"
    },
    
    breakdowns: {
      contextsByType: "Contextos por Tipo",
      contextsByProject: "Contextos por Proyecto"
    },
    
    status: {
      connected: "conectado",
      disconnected: "desconectado",
      connecting: "conectando"
    }
  },

  // === AGREGAR CONTEXTO PERSONALIZADO ===
  addContext: {
    title: "Agregar Contexto Personalizado",
    
    success: {
      message: "¡Contexto agregado exitosamente!"
    },
    
    templates: {
      toggle: "Plantillas",
      show: "Mostrar Plantillas",
      hide: "Ocultar Plantillas",
      fromClipboard: "Desde Portapapeles",
      
      types: {
        meetingNotes: "Notas de Reunión",
        bugReport: "Reporte de Error",
        codeSnippet: "Fragmento de Código",
        architectureDecision: "Decisión de Arquitectura"
      }
    },
    
    form: {
      // Contenido
      content: {
        label: "Contenido *",
        placeholder: "Ingresa el contenido de tu contexto...",
        counter: "caracteres"
      },
      
      // Tipo
      type: {
        label: "Tipo *",
        autoDetect: {
          suggestion: "Tipo auto-detectado",
          apply: "Aplicar"
        }
      },
      
      // Ruta del Proyecto
      projectPath: {
        label: "Ruta del Proyecto",
        placeholder: "Auto-detectado o ingresa manualmente...",
        autoDetect: "Auto-detectar",
        detecting: "Detectando...",
        help: "El proyecto se detecta automáticamente del contenido o puedes escribirlo manualmente"
      },
      
      // Importancia
      importance: {
        label: "Importancia",
        levels: {
          1: "Muy Baja",
          2: "Baja",
          3: "Baja",
          4: "Media",
          5: "Media",
          6: "Media",
          7: "Alta",
          8: "Alta",
          9: "Crítica",
          10: "Crítica"
        },
        rangeLabels: {
          low: "1 - Baja",
          medium: "5 - Media",
          high: "10 - Crítica"
        }
      },
      
      // Etiquetas
      tags: {
        label: "Etiquetas",
        placeholder: "Agregar etiquetas...",
        add: "Agregar"
      },
      
      // Envío
      submit: {
        create: "Crear Contexto",
        creating: "Creando..."
      }
    },
    
    // Tipos de Contexto
    types: {
      conversation: "Conversación",
      decision: "Decisión",
      code: "Código",
      issue: "Problema",
      custom: "Personalizado",
      note: "Nota",
      reference: "Referencia"
    }
  },

  // === CONFIGURACIÓN ===
  settings: {
    title: "Configuración",
    
    language: {
      title: "Idioma",
      label: "Seleccionar Idioma",
      current: "Idioma actual"
    },
    
    mcpServer: {
      title: "Control del Servidor MCP",
      status: "Estado del Servidor",
      start: "Iniciar Servidor",
      stop: "Detener Servidor",
      restart: "Reiniciar Servidor"
    },
    
    database: {
      title: "Configuración de Base de Datos",
      type: "Tipo de Base de Datos",
      connection: "Estado de Conexión"
    }
  },

  // === BUSCAR ===
  search: {
    title: "Buscar Contextos",
    placeholder: "Buscar contextos...",
    results: "Resultados",
    noResults: "No se encontraron resultados",
    filters: "Filtros",
    searchBy: "Buscar por"
  },

  // === AGENTES ===
  agents: {
    title: "Agentes de IA",
    description: "Gestiona tus agentes de IA",
    noAgents: "No hay agentes configurados",
    create: "Crear Agente",
    edit: "Editar Agente",
    delete: "Eliminar Agente",
    enabled: "Habilitado",
    disabled: "Deshabilitado"
  },

  // === ERRORES ===
  errors: {
    generic: "Ocurrió un error",
    network: "Error de red",
    validation: "Error de validación",
    notFound: "No encontrado",
    unauthorized: "No autorizado",
    serverError: "Error del servidor",
    mcpConnection: "Error al conectar con el servidor MCP"
  }
};