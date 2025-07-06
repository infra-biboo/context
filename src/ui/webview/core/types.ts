import type { ContextEntry, DatabaseAgent, DatabaseConfig, DatabaseStats } from '../../../core/database/types';
import { Signal } from 'solid-js';

// --- Communication Bridge Contract ---

/**
 * Defines a strict contract for any communication bridge (real or mock).
 * This ensures that both the real VSCode bridge and the mock bridge have the exact same
 * function signatures, resolving TypeScript ambiguity.
 */
export interface IBridge {
  sendRequest<T = any>(command: string, payload: any): Promise<T>;
  onResponse(): Signal<WebviewResponse | null>;
  getMCPStatus(): Promise<MCPStatus>;
  toggleAgent(agentId: string): Promise<any>;
  setCollaborationMode(mode: CollaborationMode): Promise<any>;
}


// --- Tipos de Dominio Específicos (Conservados) ---

export type MCPStatus = {
  connected: boolean;
  status: string;
};

export type CollaborationMode = 'collaborative' | 'individual' | 'hierarchical';


// --- Nuevo Contrato de Comunicación Estricto ---

/**
 * Representa una solicitud enviada desde el Frontend (Webview) hacia el Backend (Extensión).
 * El 'command' sigue un formato <dominio>.<accion> para claridad.
 * @template T El tipo de dato del payload.
 */
export interface WebviewRequest<T = any> {
  command: string;  // Ej: 'context.delete', 'agent.save', 'config.get'
  payload: T;       // Los datos necesarios para ejecutar el comando.
  requestId: string; // Un ID único para rastrear la solicitud y su correspondiente respuesta.
}

/**
 * Representa una respuesta enviada desde el Backend (Extensión) hacia el Frontend (Webview).
 * @template T El tipo de dato del payload.
 */
export interface WebviewResponse<T = any> {
  command: string;  // El comando original que generó esta respuesta.
  payload: T;       // Los datos de respuesta.
  requestId: string; // El ID de la solicitud original para que el frontend pueda emparejarla.
  error?: string;   // Si ocurrió un error en el backend, este campo contendrá el mensaje.
}

/**
 * Representa un evento granular enviado desde el Backend hacia el Frontend.
 * Los eventos no requieren respuesta y se usan para notificar cambios de estado.
 */
export interface WebviewEvent<T = any> {
  type: string;     // Ej: 'CONTEXT_DELETED', 'AGENT_UPDATED', 'CONFIG_CHANGED'
  payload: T;       // Los datos del evento.
}

// --- Comandos Disponibles ---
// Enum de todos los comandos posibles para type safety
export enum WebviewCommands {
  // Context Commands
  CONTEXT_GET_ALL = 'context.getAll',
  CONTEXT_CREATE = 'context.create',
  CONTEXT_DELETE = 'context.delete',
  CONTEXT_UPDATE = 'context.update',
  CONTEXT_SEARCH = 'context.search',
  
  // Agent Commands
  AGENT_GET_ALL = 'agent.getAll',
  AGENT_SAVE = 'agent.save',
  AGENT_DELETE = 'agent.delete',
  AGENT_TOGGLE = 'agent.toggle',
  
  // Config Commands
  CONFIG_GET = 'config.get',
  CONFIG_UPDATE = 'config.update',
  CONFIG_TEST_CONNECTION = 'config.testConnection',
  
  // Stats Commands
  STATS_GET = 'stats.get',
  
  // MCP Commands
  MCP_GET_STATUS = 'mcp.getStatus',
  MCP_START_SERVER = 'mcp.startServer',
  MCP_STOP_SERVER = 'mcp.stopServer',
  
  // Onboarding Commands
  ONBOARDING_COMPLETE = 'onboarding.complete',
  ONBOARDING_SET_COLLABORATION_MODE = 'onboarding.setCollaborationMode'
}

// --- Eventos Disponibles ---
// Enum de todos los eventos posibles para type safety
export enum WebviewEvents {
  // Context Events
  CONTEXT_CREATED = 'CONTEXT_CREATED',
  CONTEXT_DELETED = 'CONTEXT_DELETED',
  CONTEXT_UPDATED = 'CONTEXT_UPDATED',
  
  // Agent Events
  AGENT_CREATED = 'AGENT_CREATED',
  AGENT_DELETED = 'AGENT_DELETED',
  AGENT_UPDATED = 'AGENT_UPDATED',
  AGENT_TOGGLED = 'AGENT_TOGGLED',
  
  // Config Events
  CONFIG_UPDATED = 'CONFIG_UPDATED',
  CONNECTION_STATUS_CHANGED = 'CONNECTION_STATUS_CHANGED',
  
  // Stats Events
  STATS_UPDATED = 'STATS_UPDATED',
  
  // MCP Events
  MCP_STATUS_CHANGED = 'MCP_STATUS_CHANGED'
}


// --- Cargas Útiles (Payloads) para Comandos Específicos ---
// Aquí definiremos las formas de los datos para los comandos más comunes.
// Esto proporciona seguridad de tipos al enviar y recibir mensajes.

export type DeleteContextPayload = { id: string };
export type UpdateContextPayload = { contextId: string; updates: Partial<ContextEntry> };
export type CreateCustomContextPayload = { contextData: Omit<ContextEntry, 'id' | 'timestamp'> };

export type SaveAgentPayload = { agent: DatabaseAgent };
export type DeleteAgentPayload = { id: string };
export type ToggleAgentPayload = { agentId: string };

export type UpdateDatabaseConfigPayload = { config: DatabaseConfig };
export type TestDatabaseConnectionPayload = { config: DatabaseConfig };

export type SearchContextsPayload = { query: string; options?: any };

export type SetCollaborationModePayload = { mode: CollaborationMode };

// --- Tipos de Datos para el Estado de la UI (Conservados y Adaptados) ---
// Estos tipos definen la forma del estado global en el store del frontend.

export interface AppState {
  contexts: ContextEntry[];
  agents: DatabaseAgent[];
  stats: DatabaseStats;
  databaseConfig: DatabaseConfig | null;
  searchResults: ContextEntry[];
  onboardingCompleted: boolean;
  mcpStatus: MCPStatus;
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
}
