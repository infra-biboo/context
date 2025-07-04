# MASTER PROJECT GUIDE - Claude Context Manager
*Guía completa para desarrollo incremental desde cero*

## 📋 Visión del Proyecto

### Objetivo Principal
Crear una **extensión de VS Code** que proporcione captura automática de contexto multichat para herramientas de IA, con sistema multi-agente y gestión visual integrada.

### Valor Único
- **Zero Config**: Funciona inmediatamente after install
- **Universal**: Compatible con Claude Code, Cline, Roocode, terminal
- **Multi-Agent**: Especialistas trabajando en paralelo
- **Smart Capture**: Automático pero controlable
- **Visual Management**: Todo gestionable desde UI

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────┐
│           VS Code Extension             │
├─────────────────────────────────────────┤
│  Core Layer                             │
│  ├── Context Manager (SQLite)           │
│  ├── File Watcher                       │
│  └── Configuration Store                │
├─────────────────────────────────────────┤
│  Agent Layer                            │
│  ├── Multi-Agent Orchestrator           │
│  ├── Agent Configurations               │
│  └── Collaboration Manager              │
├─────────────────────────────────────────┤
│  Integration Layer                      │
│  ├── MCP Server                         │
│  ├── Process Monitor                    │
│  └── Tool Connectors                    │
├─────────────────────────────────────────┤
│  UI Layer                               │
│  ├── Webview Panels                     │
│  ├── Tree View Provider                 │
│  └── Command Interface                  │
├─────────────────────────────────────────┤
│  Security Layer                         │
│  ├── Encryption Service                 │
│  ├── Validation Engine                  │
│  └── Privacy Controls                   │
└─────────────────────────────────────────┘
```

---

# 📊 ESTADO ACTUAL DEL PROYECTO

## ✅ **Iteraciones Completadas:**

### ITERACIÓN 0: Setup y Foundation ✅
- **Estado**: 100% Completo
- **Fecha**: Completada
- **Funcionalidades**: Extensión básica, build pipeline, comandos de prueba

### ITERACIÓN 1: Core Storage + Basic UI ✅  
- **Estado**: 100% Completo
- **Fecha**: Completada
- **Funcionalidades**: Base de datos JSON, panel lateral, gestión de contextos

### ITERACIÓN 2: Git Integration + File Watcher ✅
- **Estado**: 100% Completo  
- **Fecha**: Completada
- **Funcionalidades**: Monitoreo de git commits, file watcher, auto-capture, configuración UI

## 🔄 **Próxima Iteración:**
- **ITERACIÓN 3**: Agent Selection UI
- **Objetivo**: Interface para seleccionar agentes especializados
- **Estimación**: 1 semana

---

# 🚀 PLAN DE DESARROLLO INCREMENTAL

## ITERACIÓN 0: Setup y Foundation (Semana 1)
*Objetivo: Extensión básica que se instala y activa*

### 🎯 Historias de Usuario - Iteración 0
No hay historias de usuario específicas, solo setup técnico.

### 📦 Entregables
- [ ] Proyecto VS Code Extension configurado
- [ ] TypeScript + build pipeline funcionando
- [ ] Extensión se activa correctamente
- [ ] Comando básico de prueba
- [ ] CI/CD básico (opcional)

### 🔧 Implementación Técnica

#### Estructura Inicial del Proyecto
```
claude-context-manager/
├── package.json                    # Manifest de extensión
├── tsconfig.json                   # Config TypeScript
├── webpack.config.js               # Build configuration
├── .vscode/
│   ├── launch.json                 # Debug configuration
│   └── settings.json               # Workspace settings
├── src/
│   ├── extension.ts                # Entry point
│   ├── commands/
│   │   └── test-command.ts         # Comando de prueba
│   └── utils/
│       └── logger.ts               # Logging básico
├── media/                          # Assets estáticos
├── dist/                          # Build output
└── README.md                      # Documentación básica
```

#### package.json (Configuración Base)
```json
{
  "name": "claude-context-manager",
  "displayName": "Claude Context Manager",
  "description": "Smart context management for Claude AI tools",
  "version": "0.0.1",
  "engines": {
    "vscode": "^1.74.0"
  },
  "categories": ["Other"],
  "activationEvents": [
    "onStartupFinished"
  ],
  "main": "./dist/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "claude-context.test",
        "title": "Test Claude Context"
      }
    ]
  },
  "scripts": {
    "vscode:prepublish": "npm run package",
    "compile": "webpack",
    "watch": "webpack --watch",
    "package": "webpack --mode production --devtool hidden-source-map"
  },
  "devDependencies": {
    "@types/node": "16.x",
    "@types/vscode": "^1.74.0",
    "typescript": "^4.9.4",
    "webpack": "^5.75.0",
    "webpack-cli": "^5.0.1",
    "ts-loader": "^9.4.2"
  }
}
```

#### src/extension.ts (Entry Point)
```typescript
import * as vscode from 'vscode';
import { registerCommands } from './commands/test-command';
import { Logger } from './utils/logger';

export function activate(context: vscode.ExtensionContext) {
    Logger.info('Claude Context Manager activating...');
    
    // Register commands
    registerCommands(context);
    
    Logger.info('Claude Context Manager activated successfully');
}

export function deactivate() {
    Logger.info('Claude Context Manager deactivated');
}
```

### ✅ Criterios de Aceptación - Iteración 0
- [x] `npm install` ejecuta sin errores
- [x] `npm run compile` genera dist/extension.js
- [x] Extensión se instala en VS Code de desarrollo
- [x] Command "Test Claude Context" aparece y ejecuta
- [x] No hay errores en Output Console

---

## ITERACIÓN 1: Core Storage + Basic UI (Semana 2)
*Objetivo: Base de datos SQLite + panel lateral básico*

### 🎯 Historias de Usuario - Iteración 1

#### Historia 1.1: Panel de Configuración Principal (Simplificada)
**Como** desarrollador  
**Quiero** acceder a un panel lateral básico  
**Para** ver el estado del sistema y configuración inicial  

**Criterios de Aceptación:**
- [ ] Panel lateral se abre desde Command Palette
- [ ] Muestra estado básico del sistema
- [ ] Una sola pestaña "General" funcional
- [ ] Cierra correctamente sin errores

### 📦 Entregables
- [x] SQLite database funcionando (JSON storage)
- [x] Webview panel básico
- [x] Context manager core
- [x] Tree view provider (Webview)
- [x] Almacenamiento de configuración básica

### 🔧 Implementación Técnica

#### Nueva Estructura
```
src/
├── extension.ts                    # Entry point actualizado
├── core/
│   ├── database.ts                 # SQLite operations
│   ├── context-manager.ts          # Core context logic
│   └── config-store.ts             # Configuration management
├── ui/
│   ├── webview-provider.ts         # Panel principal
│   ├── tree-provider.ts            # Tree view
│   └── panels/
│       └── general-panel.html      # HTML del panel general
├── commands/
│   ├── panel-commands.ts           # Comandos del panel
│   └── test-command.ts             # Mantener para pruebas
└── utils/
    ├── logger.ts                   # Logging mejorado
    └── file-utils.ts               # Utilidades de archivos
```

#### core/database.ts
```typescript
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';

export interface ContextEntry {
    id: string;
    projectPath: string;
    type: 'conversation' | 'decision' | 'code' | 'issue';
    content: string;
    timestamp: Date;
    importance: number;
    tags: string[];
}

export class ContextDatabase {
    private dbPath: string;
    private contexts: Map<string, ContextEntry> = new Map();

    constructor(private extensionContext: vscode.ExtensionContext) {
        this.dbPath = path.join(
            extensionContext.globalStorageUri.fsPath, 
            'contexts.json'
        );
        this.ensureStorageDir();
    }

    private async ensureStorageDir() {
        await fs.mkdir(
            this.extensionContext.globalStorageUri.fsPath, 
            { recursive: true }
        );
    }

    async initialize(): Promise<void> {
        try {
            const data = await fs.readFile(this.dbPath, 'utf-8');
            const entries: ContextEntry[] = JSON.parse(data);
            entries.forEach(entry => {
                this.contexts.set(entry.id, {
                    ...entry,
                    timestamp: new Date(entry.timestamp)
                });
            });
        } catch (error) {
            // File doesn't exist, start with empty database
            await this.save();
        }
    }

    async addContext(entry: Omit<ContextEntry, 'id' | 'timestamp'>): Promise<string> {
        const id = `ctx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const contextEntry: ContextEntry = {
            id,
            timestamp: new Date(),
            ...entry
        };
        
        this.contexts.set(id, contextEntry);
        await this.save();
        return id;
    }

    async getContexts(projectPath?: string): Promise<ContextEntry[]> {
        const entries = Array.from(this.contexts.values());
        if (projectPath) {
            return entries.filter(e => e.projectPath === projectPath);
        }
        return entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }

    private async save(): Promise<void> {
        const entries = Array.from(this.contexts.values());
        await fs.writeFile(this.dbPath, JSON.stringify(entries, null, 2));
    }
}
```

#### ui/webview-provider.ts
```typescript
import * as vscode from 'vscode';
import * as path from 'path';
import { ContextDatabase } from '../core/database';

export class ContextWebviewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'claude-context.panel';

    constructor(
        private readonly extensionUri: vscode.Uri,
        private readonly database: ContextDatabase
    ) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        token: vscode.CancellationToken,
    ) {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                this.extensionUri
            ]
        };

        webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

        // Handle messages from webview
        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case 'getContexts':
                    const contexts = await this.database.getContexts();
                    webviewView.webview.postMessage({
                        type: 'contextsData',
                        contexts: contexts.slice(0, 10) // Latest 10
                    });
                    break;
                case 'addTestContext':
                    await this.database.addContext({
                        projectPath: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || 'unknown',
                        type: 'conversation',
                        content: 'Test context entry created from panel',
                        importance: 5,
                        tags: ['test']
                    });
                    vscode.window.showInformationMessage('Test context added!');
                    break;
            }
        });
    }

    private getHtmlForWebview(webview: vscode.Webview) {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Claude Context</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    color: var(--vscode-foreground);
                    background: var(--vscode-editor-background);
                    padding: 16px;
                    margin: 0;
                }
                .status-card {
                    background: var(--vscode-editorWidget-background);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 4px;
                    padding: 16px;
                    margin-bottom: 16px;
                }
                .btn {
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    margin: 4px;
                }
                .btn:hover {
                    background: var(--vscode-button-hoverBackground);
                }
                .context-list {
                    max-height: 300px;
                    overflow-y: auto;
                }
                .context-item {
                    padding: 8px;
                    border-bottom: 1px solid var(--vscode-panel-border);
                }
            </style>
        </head>
        <body>
            <div class="status-card">
                <h3>🏠 General Status</h3>
                <p>Project: <span id="project-name">Loading...</span></p>
                <p>Contexts: <span id="context-count">0</span></p>
                <button class="btn" onclick="loadContexts()">Refresh</button>
                <button class="btn" onclick="addTestContext()">Add Test Context</button>
            </div>

            <div class="status-card">
                <h3>📝 Recent Contexts</h3>
                <div id="context-list" class="context-list">
                    <p>Loading contexts...</p>
                </div>
            </div>

            <script>
                const vscode = acquireVsCodeApi();

                function loadContexts() {
                    vscode.postMessage({ type: 'getContexts' });
                }

                function addTestContext() {
                    vscode.postMessage({ type: 'addTestContext' });
                    setTimeout(loadContexts, 500);
                }

                // Handle messages from extension
                window.addEventListener('message', event => {
                    const message = event.data;
                    
                    switch (message.type) {
                        case 'contextsData':
                            displayContexts(message.contexts);
                            break;
                    }
                });

                function displayContexts(contexts) {
                    document.getElementById('context-count').textContent = contexts.length;
                    
                    const listEl = document.getElementById('context-list');
                    if (contexts.length === 0) {
                        listEl.innerHTML = '<p>No contexts yet</p>';
                        return;
                    }

                    listEl.innerHTML = contexts.map(ctx => 
                        \`<div class="context-item">
                            <strong>\${ctx.type.toUpperCase()}</strong>
                            <br><small>\${new Date(ctx.timestamp).toLocaleString()}</small>
                            <br>\${ctx.content.substring(0, 100)}...
                        </div>\`
                    ).join('');
                }

                // Initial load
                loadContexts();
            </script>
        </body>
        </html>`;
    }
}
```

#### package.json (Actualizado)
```json
{
  "contributes": {
    "commands": [
      {
        "command": "claude-context.openPanel",
        "title": "Open Claude Context Panel"
      },
      {
        "command": "claude-context.test",
        "title": "Test Claude Context"
      }
    ],
    "views": {
      "explorer": [
        {
          "id": "claude-context.panel",
          "name": "Claude Context",
          "type": "webview",
          "when": "workspaceFolderCount > 0"
        }
      ]
    }
  }
}
```

### ✅ Criterios de Aceptación - Iteración 1
- [x] Panel lateral aparece en Explorer
- [x] Muestra "General Status" con información básica
- [x] Botón "Add Test Context" funciona
- [x] Botón "Refresh" actualiza la lista
- [x] Contextos se persisten entre reinicios de VS Code
- [x] No hay errores en console

---

## ITERACIÓN 2: Git Integration + File Watcher (Semana 3)
*Objetivo: Captura automática básica funcionando*

### 🎯 Historias de Usuario - Iteración 2

#### Historia 3.1: Captura de Git Commits (Básica)
**Como** desarrollador  
**Quiero** que el sistema capture automáticamente contexto cuando hago commits  
**Para** mantener un historial de decisiones técnicas vinculadas a cambios de código  

**Criterios de Aceptación:**
- [ ] Detecta cuando se realiza un commit
- [ ] Captura mensaje de commit como contexto
- [ ] Muestra commits capturados en el panel
- [ ] Toggle para activar/desactivar en panel

### 📦 Entregables
- [x] Git integration básica
- [x] File watcher para cambios importantes
- [x] Auto-capture de commits
- [x] Configuración on/off en UI

### 🔧 Implementación Técnica

#### Nueva Estructura
```
src/
├── capture/
│   ├── git-monitor.ts              # Git commit detection
│   ├── file-monitor.ts             # File change detection
│   └── auto-capture.ts             # Orchestrator
├── core/
│   ├── database.ts                 # Actualizado
│   ├── context-manager.ts          # Actualizado
│   └── config-store.ts             # Configuración extendida
└── ... (resto se mantiene)
```

#### capture/git-monitor.ts
```typescript
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { ContextDatabase } from '../core/database';

export class GitMonitor {
    private gitWatcher: vscode.FileSystemWatcher | undefined;
    private enabled: boolean = true;

    constructor(
        private database: ContextDatabase,
        private workspaceRoot: string
    ) {}

    async start(): Promise<void> {
        const gitPath = path.join(this.workspaceRoot, '.git');
        
        if (!fs.existsSync(gitPath)) {
            console.log('No git repository found');
            return;
        }

        // Watch for changes in .git directory
        this.gitWatcher = vscode.workspace.createFileSystemWatcher(
            new vscode.RelativePattern(gitPath, '**/*')
        );

        this.gitWatcher.onDidChange(async (uri) => {
            if (uri.fsPath.includes('COMMIT_EDITMSG')) {
                await this.handleCommitMessage();
            }
        });

        console.log('Git monitor started');
    }

    private async handleCommitMessage(): Promise<void> {
        if (!this.enabled) return;

        try {
            const commitMsgPath = path.join(this.workspaceRoot, '.git', 'COMMIT_EDITMSG');
            
            // Wait a bit for file to be written
            setTimeout(async () => {
                try {
                    const commitMessage = fs.readFileSync(commitMsgPath, 'utf-8').trim();
                    
                    if (commitMessage && !commitMessage.startsWith('#')) {
                        await this.database.addContext({
                            projectPath: this.workspaceRoot,
                            type: 'decision',
                            content: `Git commit: ${commitMessage}`,
                            importance: 6,
                            tags: ['git', 'commit']
                        });

                        vscode.window.showInformationMessage(
                            `📝 Captured commit: ${commitMessage.substring(0, 50)}...`
                        );
                    }
                } catch (error) {
                    console.error('Error reading commit message:', error);
                }
            }, 1000);
        } catch (error) {
            console.error('Error in git monitor:', error);
        }
    }

    setEnabled(enabled: boolean): void {
        this.enabled = enabled;
    }

    dispose(): void {
        this.gitWatcher?.dispose();
    }
}
```

#### core/config-store.ts
```typescript
import * as vscode from 'vscode';

export interface AppConfig {
    capture: {
        gitCommits: boolean;
        fileChanges: boolean;
        keywords: boolean;
    };
    ui: {
        theme: 'auto' | 'light' | 'dark';
        density: 'compact' | 'normal' | 'spacious';
    };
}

export class ConfigStore {
    private static instance: ConfigStore;
    private config: AppConfig;
    private listeners: Set<(config: AppConfig) => void> = new Set();

    private constructor(private context: vscode.ExtensionContext) {
        this.config = this.getDefaultConfig();
        this.loadConfig();
    }

    static getInstance(context: vscode.ExtensionContext): ConfigStore {
        if (!ConfigStore.instance) {
            ConfigStore.instance = new ConfigStore(context);
        }
        return ConfigStore.instance;
    }

    private getDefaultConfig(): AppConfig {
        return {
            capture: {
                gitCommits: true,
                fileChanges: true,
                keywords: false
            },
            ui: {
                theme: 'auto',
                density: 'normal'
            }
        };
    }

    private loadConfig(): void {
        const stored = this.context.globalState.get<AppConfig>('config');
        if (stored) {
            this.config = { ...this.getDefaultConfig(), ...stored };
        }
    }

    private async saveConfig(): Promise<void> {
        await this.context.globalState.update('config', this.config);
        this.notifyListeners();
    }

    getConfig(): AppConfig {
        return { ...this.config };
    }

    async updateConfig(updates: Partial<AppConfig>): Promise<void> {
        this.config = { ...this.config, ...updates };
        await this.saveConfig();
    }

    subscribe(listener: (config: AppConfig) => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notifyListeners(): void {
        this.listeners.forEach(listener => listener(this.config));
    }
}
```

#### ui/webview-provider.ts (Actualizado)
```typescript
// Agregar al HTML del webview:
const configSection = `
<div class="status-card">
    <h3>⚙️ Quick Settings</h3>
    <label>
        <input type="checkbox" id="git-commits" checked>
        Capture Git Commits
    </label>
    <br>
    <label>
        <input type="checkbox" id="file-changes" checked>
        Monitor File Changes
    </label>
</div>
`;

// Agregar al JavaScript del webview:
const settingsHandlers = `
document.getElementById('git-commits').addEventListener('change', (e) => {
    vscode.postMessage({
        type: 'updateConfig',
        config: { capture: { gitCommits: e.target.checked } }
    });
});

document.getElementById('file-changes').addEventListener('change', (e) => {
    vscode.postMessage({
        type: 'updateConfig',
        config: { capture: { fileChanges: e.target.checked } }
    });
});
`;

// Agregar al message handler:
case 'updateConfig':
    await this.configStore.updateConfig(data.config);
    vscode.window.showInformationMessage('Settings updated');
    break;
```

### ✅ Criterios de Aceptación - Iteración 2
- [x] Git commits se capturan automáticamente
- [x] Toggle "Capture Git Commits" funciona
- [x] Commits aparecen en la lista de contextos
- [x] Configuración persiste entre sesiones
- [x] Notificación aparece cuando se captura commit

---

## ITERACIÓN 3: Agent Selection UI (Semana 4)
*Objetivo: Interface para seleccionar agentes*

### 🎯 Historias de Usuario - Iteración 3

#### Historia 2.1: Selección de Agentes para Conversación (Básica)
**Como** desarrollador  
**Quiero** seleccionar qué agentes están activos para la conversación actual  
**Para** obtener respuestas especializadas según el contexto que necesito  

**Criterios de Aceptación:**
- [ ] Pestaña "Agents" en el panel principal
- [ ] Checkboxes para Architect, Backend, Frontend
- [ ] Indicador visual de agentes activos
- [ ] Estado persiste entre sesiones

### 📦 Entregables
- [ ] Pestaña Agents en webview
- [ ] Sistema básico de agentes
- [ ] UI para activar/desactivar agentes
- [ ] Estado de agentes visible

### 🔧 Implementación Técnica

#### Nueva Estructura
```
src/
├── agents/
│   ├── agent-types.ts              # Tipos y interfaces
│   ├── agent-manager.ts            # Gestión de agentes
│   └── agent-config.ts             # Configuración de agentes
├── ui/
│   └── panels/
│       ├── general-panel.html      # Existente
│       └── agents-panel.html       # Nuevo
└── ... (resto se mantiene)
```

#### agents/agent-types.ts
```typescript
export type AgentType = 'architect' | 'backend' | 'frontend';

export interface Agent {
    id: AgentType;
    name: string;
    description: string;
    emoji: string;
    enabled: boolean;
    specializations: string[];
}

export interface AgentState {
    architect: Agent;
    backend: Agent;
    frontend: Agent;
    collaborationMode: 'individual' | 'collaborative' | 'hierarchical';
}
```

#### agents/agent-manager.ts
```typescript
import { Agent, AgentState, AgentType } from './agent-types';
import { ConfigStore } from '../core/config-store';

export class AgentManager {
    private agents: AgentState;

    constructor(private configStore: ConfigStore) {
        this.agents = this.getDefaultAgents();
        this.loadAgentState();
    }

    private getDefaultAgents(): AgentState {
        return {
            architect: {
                id: 'architect',
                name: 'Architect',
                description: 'System design and architecture decisions',
                emoji: '🏗️',
                enabled: true,
                specializations: ['System Design', 'Architecture Patterns', 'Scalability']
            },
            backend: {
                id: 'backend',
                name: 'Backend',
                description: 'Server-side development and APIs',
                emoji: '⚙️',
                enabled: true,
                specializations: ['REST APIs', 'Database Design', 'Authentication']
            },
            frontend: {
                id: 'frontend',
                name: 'Frontend',
                description: 'User interface and experience',
                emoji: '🎨',
                enabled: true,
                specializations: ['React', 'UI/UX', 'Responsive Design']
            },
            collaborationMode: 'collaborative'
        };
    }

    private loadAgentState(): void {
        // Load from config store - placeholder for now
        // In future iterations this will load from persistent storage
    }

    getActiveAgents(): Agent[] {
        return Object.values(this.agents)
            .filter(agent => typeof agent === 'object' && agent.enabled);
    }

    toggleAgent(agentId: AgentType): void {
        if (this.agents[agentId]) {
            this.agents[agentId].enabled = !this.agents[agentId].enabled;
            this.saveAgentState();
        }
    }

    getAgentState(): AgentState {
        return { ...this.agents };
    }

    private saveAgentState(): void {
        // Save to config store - placeholder for now
        console.log('Agent state updated:', this.getActiveAgents().map(a => a.name));
    }
}
```

#### ui/webview-provider.ts (Actualizado con pestañas)
```typescript
// Actualizar el HTML para incluir sistema de pestañas:
private getHtmlForWebview(webview: vscode.Webview) {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Claude Context</title>
        <style>
            body {
                font-family: var(--vscode-font-family);
                color: var(--vscode-foreground);
                background: var(--vscode-editor-background);
                margin: 0;
                padding: 0;
            }
            .tabs {
                display: flex;
                border-bottom: 1px solid var(--vscode-panel-border);
                background: var(--vscode-editorGroupHeader-tabsBackground);
            }
            .tab-button {
                padding: 12px 16px;
                border: none;
                background: transparent;
                color: var(--vscode-tab-inactiveForeground);
                cursor: pointer;
                border-bottom: 2px solid transparent;
            }
            .tab-button.active {
                color: var(--vscode-tab-activeForeground);
                border-bottom-color: var(--vscode-tab-activeBorder);
            }
            .tab-content {
                padding: 16px;
                display: none;
            }
            .tab-content.active {
                display: block;
            }
            .status-card {
                background: var(--vscode-editorWidget-background);
                border: 1px solid var(--vscode-panel-border);
                border-radius: 4px;
                padding: 16px;
                margin-bottom: 16px;
            }
            .agent-item {
                display: flex;
                align-items: center;
                padding: 12px;
                border: 1px solid var(--vscode-panel-border);
                border-radius: 4px;
                margin-bottom: 8px;
            }
            .agent-item.enabled {
                background: var(--vscode-button-secondaryBackground);
            }
            .agent-emoji {
                font-size: 24px;
                margin-right: 12px;
            }
            .agent-info {
                flex: 1;
            }
            .agent-toggle {
                margin-left: auto;
            }
            /* ... resto de estilos ... */
        </style>
    </head>
    <body>
        <!-- Tab Navigation -->
        <div class="tabs">
            <button class="tab-button active" onclick="showTab('general')">🏠 General</button>
            <button class="tab-button" onclick="showTab('agents')">🤖 Agents</button>
        </div>

        <!-- General Tab -->
        <div id="general-tab" class="tab-content active">
            ${this.getGeneralTabContent()}
        </div>

        <!-- Agents Tab -->
        <div id="agents-tab" class="tab-content">
            <div class="status-card">
                <h3>👥 Active Agents</h3>
                <p>Select which agents are available for conversations:</p>
                
                <div id="agents-list">
                    <div class="agent-item enabled" data-agent="architect">
                        <span class="agent-emoji">🏗️</span>
                        <div class="agent-info">
                            <strong>Architect</strong>
                            <br><small>System design and architecture decisions</small>
                        </div>
                        <label class="agent-toggle">
                            <input type="checkbox" checked onchange="toggleAgent('architect')">
                        </label>
                    </div>
                    
                    <div class="agent-item enabled" data-agent="backend">
                        <span class="agent-emoji">⚙️</span>
                        <div class="agent-info">
                            <strong>Backend</strong>
                            <br><small>Server-side development and APIs</small>
                        </div>
                        <label class="agent-toggle">
                            <input type="checkbox" checked onchange="toggleAgent('backend')">
                        </label>
                    </div>
                    
                    <div class="agent-item enabled" data-agent="frontend">
                        <span class="agent-emoji">🎨</span>
                        <div class="agent-info">
                            <strong>Frontend</strong>
                            <br><small>User interface and experience</small>
                        </div>
                        <label class="agent-toggle">
                            <input type="checkbox" checked onchange="toggleAgent('frontend')">
                        </label>
                    </div>
                </div>

                <div class="status-summary">
                    <p><strong>Active Agents:</strong> <span id="active-count">3</span></p>
                    <p><strong>Mode:</strong> Collaborative</p>
                </div>
            </div>
        </div>

        <script>
            const vscode = acquireVsCodeApi();

            function showTab(tabName) {
                // Hide all tabs
                document.querySelectorAll('.tab-content').forEach(tab => {
                    tab.classList.remove('active');
                });
                document.querySelectorAll('.tab-button').forEach(btn => {
                    btn.classList.remove('active');
                });
                
                // Show selected tab
                document.getElementById(tabName + '-tab').classList.add('active');
                event.target.classList.add('active');
            }

            function toggleAgent(agentId) {
                const checkbox = event.target;
                const agentItem = document.querySelector(\`[data-agent="\${agentId}"]\`);
                
                if (checkbox.checked) {
                    agentItem.classList.add('enabled');
                } else {
                    agentItem.classList.remove('enabled');
                }
                
                updateActiveCount();
                
                vscode.postMessage({
                    type: 'toggleAgent',
                    agentId: agentId,
                    enabled: checkbox.checked
                });
            }

            function updateActiveCount() {
                const activeAgents = document.querySelectorAll('.agent-item.enabled').length;
                document.getElementById('active-count').textContent = activeAgents;
            }

            // ... resto del JavaScript existente ...
        </script>
    </body>
    </html>`;
}

private getGeneralTabContent(): string {
    return `
        <div class="status-card">
            <h3>🏠 General Status</h3>
            <p>Project: <span id="project-name">Loading...</span></p>
            <p>Contexts: <span id="context-count">0</span></p>
            <button class="btn" onclick="loadContexts()">Refresh</button>
            <button class="btn" onclick="addTestContext()">Add Test Context</button>
        </div>

        <div class="status-card">
            <h3>⚙️ Quick Settings</h3>
            <label>
                <input type="checkbox" id="git-commits" checked>
                Capture Git Commits
            </label>
            <br>
            <label>
                <input type="checkbox" id="file-changes" checked>
                Monitor File Changes
            </label>
        </div>

        <div class="status-card">
            <h3>📝 Recent Contexts</h3>
            <div id="context-list" class="context-list">
                <p>Loading contexts...</p>
            </div>
        </div>
    `;
}
```

### ✅ Criterios de Aceptación - Iteración 3
- [ ] Pestaña "Agents" aparece y funciona
- [ ] Checkboxes de agentes se pueden activar/desactivar
- [ ] Contador de "Active Agents" se actualiza
- [ ] Estado visual de agentes cambia correctamente
- [ ] Cambios se comunican correctamente con el backend

---

## ITERACIÓN 4: MCP Integration Basic (Semana 5)
*Objetivo: Conexión básica con Claude Code*

### 🎯 Historias de Usuario - Iteración 4

#### Historia 5.2: Configuración de Integración MCP (Básica)
**Como** desarrollador  
**Quiero** que el sistema se conecte automáticamente con Claude Code  
**Para** que Claude tenga acceso a mi contexto sin configuración manual  

**Criterios de Aceptación:**
- [ ] MCP server básico funcional
- [ ] Claude Code puede conectarse al server
- [ ] Herramienta básica "get_context" disponible
- [ ] Indicador de conexión en el panel

### 📦 Entregables
- [ ] MCP server implementation
- [ ] Herramientas básicas MCP
- [ ] Auto-configuración para Claude Code
- [ ] Status de conexión en UI

### 🔧 Implementación Técnica

#### Nueva Estructura
```
src/
├── mcp/
│   ├── server.ts                   # MCP server implementation
│   ├── tools.ts                    # MCP tools
│   └── config-generator.ts         # Auto-config para Claude Code
└── ... (resto se mantiene)
```

#### mcp/server.ts
```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ContextDatabase } from '../core/database';
import { AgentManager } from '../agents/agent-manager';

export class MCPServer {
    private server: Server;
    private isRunning: boolean = false;

    constructor(
        private database: ContextDatabase,
        private agentManager: AgentManager
    ) {
        this.server = new Server({
            name: 'claude-context-manager',
            version: '1.0.0',
        }, {
            capabilities: {
                tools: {},
                resources: {},
                prompts: {}
            }
        });

        this.setupHandlers();
    }

    private setupHandlers(): void {
        // List available tools
        this.server.setRequestHandler('tools/list', async () => {
            return {
                tools: [
                    {
                        name: 'get_context',
                        description: 'Get recent context for the current project',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                limit: { 
                                    type: 'number', 
                                    description: 'Number of context entries to retrieve (default: 10)' 
                                },
                                type: { 
                                    type: 'string', 
                                    description: 'Filter by context type (conversation, decision, code, issue)' 
                                }
                            }
                        }
                    },
                    {
                        name: 'get_active_agents',
                        description: 'Get list of currently active agents and their roles',
                        inputSchema: {
                            type: 'object',
                            properties: {}
                        }
                    }
                ]
            };
        });

        // Handle tool calls
        this.server.setRequestHandler('tools/call', async (request) => {
            const { name, arguments: args } = request.params;

            switch (name) {
                case 'get_context':
                    return await this.handleGetContext(args);
                case 'get_active_agents':
                    return await this.handleGetActiveAgents();
                default:
                    throw new Error(`Unknown tool: ${name}`);
            }
        });
    }

    private async handleGetContext(args: any) {
        const limit = args.limit || 10;
        const type = args.type;

        const contexts = await this.database.getContexts();
        const filtered = type 
            ? contexts.filter(c => c.type === type)
            : contexts;

        const limited = filtered.slice(0, limit);

        const contextSummary = limited.map(ctx => ({
            type: ctx.type,
            content: ctx.content,
            timestamp: ctx.timestamp,
            importance: ctx.importance,
            tags: ctx.tags
        }));

        return {
            content: [{
                type: 'text',
                text: `Recent Context (${limited.length} entries):\n\n` +
                      contextSummary.map(ctx => 
                          `[${ctx.type.toUpperCase()}] ${ctx.content.substring(0, 200)}...\n` +
                          `Tags: ${ctx.tags.join(', ')}\n` +
                          `Importance: ${ctx.importance}/10\n`
                      ).join('\n---\n')
            }]
        };
    }

    private async handleGetActiveAgents() {
        const activeAgents = this.agentManager.getActiveAgents();
        const agentInfo = activeAgents.map(agent => ({
            name: agent.name,
            role: agent.description,
            specializations: agent.specializations
        }));

        return {
            content: [{
                type: 'text',
                text: `Active AI Agents (${activeAgents.length}):\n\n` +
                      agentInfo.map(agent => 
                          `**${agent.name}**: ${agent.role}\n` +
                          `Specializations: ${agent.specializations.join(', ')}\n`
                      ).join('\n')
            }]
        };
    }

    async start(): Promise<void> {
        if (this.isRunning) return;

        try {
            const transport = new StdioServerTransport();
            await this.server.connect(transport);
            this.isRunning = true;
            console.log('MCP Server started successfully');
        } catch (error) {
            console.error('Failed to start MCP server:', error);
            throw error;
        }
    }

    isConnected(): boolean {
        return this.isRunning;
    }

    async stop(): Promise<void> {
        if (!this.isRunning) return;
        
        // Note: SDK doesn't provide explicit stop method
        // This is a placeholder for cleanup
        this.isRunning = false;
        console.log('MCP Server stopped');
    }
}
```

#### mcp/config-generator.ts
```typescript
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';

export class MCPConfigGenerator {
    constructor(private extensionPath: string) {}

    async generateClaudeCodeConfig(): Promise<void> {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            throw new Error('No workspace folder open');
        }

        const configDir = path.join(workspaceFolder.uri.fsPath, '.claude');
        const configPath = path.join(configDir, 'mcp.json');

        const config = {
            mcpServers: {
                "claude-context-manager": {
                    "command": "node",
                    "args": [
                        path.join(this.extensionPath, 'dist', 'mcp-server.js')
                    ],
                    "env": {
                        "WORKSPACE_PATH": workspaceFolder.uri.fsPath
                    }
                }
            }
        };

        try {
            await fs.mkdir(configDir, { recursive: true });
            await fs.writeFile(configPath, JSON.stringify(config, null, 2));
            
            vscode.window.showInformationMessage(
                `MCP configuration generated at ${configPath}`,
                'Open Config'
            ).then(action => {
                if (action === 'Open Config') {
                    vscode.window.showTextDocument(vscode.Uri.file(configPath));
                }
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to generate MCP config: ${error}`);
            throw error;
        }
    }
}
```

#### ui/webview-provider.ts (Agregar MCP Status)
```typescript
// Agregar al General Tab:
const mcpStatusSection = `
<div class="status-card">
    <h3>🔗 MCP Integration</h3>
    <p>Status: <span id="mcp-status">Disconnected</span></p>
    <p>Claude Code: <span id="claude-code-status">Not detected</span></p>
    <button class="btn" onclick="generateMCPConfig()">Generate Config</button>
    <button class="btn" onclick="testMCPConnection()">Test Connection</button>
</div>
`;

// Agregar al JavaScript:
const mcpHandlers = `
function generateMCPConfig() {
    vscode.postMessage({ type: 'generateMCPConfig' });
}

function testMCPConnection() {
    vscode.postMessage({ type: 'testMCPConnection' });
}

function updateMCPStatus(status) {
    document.getElementById('mcp-status').textContent = status.connected ? 'Connected' : 'Disconnected';
    document.getElementById('mcp-status').style.color = status.connected ? 'var(--vscode-charts-green)' : 'var(--vscode-charts-red)';
}
`;

// Agregar al message handler:
case 'generateMCPConfig':
    await this.mcpConfigGenerator.generateClaudeCodeConfig();
    break;
case 'testMCPConnection':
    const connected = this.mcpServer.isConnected();
    webviewView.webview.postMessage({
        type: 'mcpStatus',
        connected
    });
    break;
```

### ✅ Criterios de Aceptación - Iteración 4
- [ ] MCP server se inicia sin errores
- [ ] Configuración .claude/mcp.json se genera correctamente
- [ ] Claude Code puede conectarse al server
- [ ] Herramienta "get_context" devuelve datos
- [ ] Status de conexión se muestra en el panel

---

## ITERACIÓN 5: Advanced Context + Search (Semana 6)
*Objetivo: Gestión avanzada de contexto*

### 🎯 Historias de Usuario - Iteración 5

#### Historia 4.2: Editor de Contexto Avanzado (Básico)
**Como** desarrollador  
**Quiero** editar entradas de contexto existentes  
**Para** corregir o enriquecer información capturada automáticamente  

**Criterios de Aceptación:**
- [ ] Click en contexto abre modal de edición
- [ ] Campos editables: content, importance, tags
- [ ] Cambios se guardan y persisten
- [ ] Validación básica de inputs

#### Historia 4.3: Búsqueda de Contexto (Básica)
**Como** desarrollador  
**Quiero** buscar en mi contexto histórico  
**Para** encontrar rápidamente información relevante  

**Criterios de Aceptación:**
- [ ] Barra de búsqueda funcional
- [ ] Búsqueda por contenido de texto
- [ ] Filtro por tipo de contexto
- [ ] Resultados se muestran en tiempo real

### 📦 Entregables
- [ ] Modal de edición de contexto
- [ ] Sistema de búsqueda básico
- [ ] Validación de formularios
- [ ] Filtros por tipo y fecha

### ✅ Criterios de Aceptación - Iteración 5
- [ ] Modal de edición funciona correctamente
- [ ] Búsqueda devuelve resultados relevantes
- [ ] Filtros se aplican correctamente
- [ ] Performance adecuada con 100+ contextos

---

## ITERACIÓN 6: Keyword Detection (Semana 7)
*Objetivo: Detección automática de keywords*

### 🎯 Historias de Usuario - Iteración 6

#### Historia 3.2: Detección de Keywords (Básica)
**Como** desarrollador  
**Quiero** configurar palabras clave que disparen captura automática  
**Para** que momentos importantes se registren sin intervención manual  

**Criterios de Aceptación:**
- [ ] Keywords configurables en UI
- [ ] Detección en tiempo real (simulada)
- [ ] Captura automática cuando se detecta keyword
- [ ] Lista de keywords predefinidos

### 📦 Entregables
- [ ] Editor de keywords en UI
- [ ] Motor de detección básico
- [ ] Keywords predefinidos
- [ ] Configuración per-project

---

## ITERACIÓN 7: File Monitoring Advanced (Semana 8)
*Objetivo: Monitoreo inteligente de archivos*

### 🎯 Historias de Usuario - Iteración 7

#### Historia 3.3: Monitoreo de Archivos Inteligente
**Como** desarrollador  
**Quiero** que el sistema detecte automáticamente cambios importantes en archivos  
**Para** correlacionar modificaciones de código con contexto de conversaciones  

### 📦 Entregables
- [ ] File watcher avanzado
- [ ] Análisis de impacto de cambios
- [ ] Correlación archivo-contexto
- [ ] Configuración de patrones

---

## ITERACIÓN 8: Polish + Performance (Semana 9)
*Objetivo: Optimización y pulido final*

### 🎯 Historias de Usuario - Iteración 8

#### Historia 6.1: Gestión de Storage y Performance
**Como** desarrollador con proyectos grandes  
**Quiero** controlar el almacenamiento y performance del sistema  
**Para** mantener el sistema eficiente y dentro de límites de espacio  

### 📦 Entregables
- [ ] Optimización de base de datos
- [ ] Límites de almacenamiento
- [ ] Performance monitoring
- [ ] Auto-cleanup de datos antiguos

---

## 📋 ROADMAP FUTURO (Post-MVP)

### Iteraciones Futuras Planeadas

#### Iteración 9-10: Multi-Agent Coordination
- Historia 2.3: Coordinación Multi-Agente
- Comunicación entre agentes
- Resolución de conflictos
- Workflows colaborativos

#### Iteración 11-12: Advanced Integrations
- Historia 5.1: Detección Automática Universal
- Historia 5.3: Monitoreo de Terminal
- Integración con Cline, Roocode
- Process monitoring avanzado

#### Iteración 13-14: Security & Privacy
- Historia 7.1: Encriptación de Datos
- Historia 7.2: Control de Privacidad
- Audit logging
- Compliance tools

#### Iteración 15-16: Analytics & Intelligence
- Historia 8.1: Dashboard de Productividad
- Historia 8.2: Sugerencias Inteligentes
- ML para mejora de captura
- Insights de productividad

---

## 🎯 DEFINICIÓN DE TERMINADO (DoD)

### Para Cada Iteración
- [ ] Todas las historias de usuario completas
- [ ] Criterios de aceptación verificados
- [ ] Tests unitarios (donde aplique)
- [ ] No hay errores críticos en console
- [ ] Performance acceptable (< 1s response time)
- [ ] Documentación actualizada
- [ ] Extension buildea sin warnings

### Para MVP (Iteración 1-4)
- [ ] Extension instalable desde VSIX
- [ ] Panel de configuración funcional
- [ ] Captura básica de git commits
- [ ] Selección de agentes UI
- [ ] MCP integration básica
- [ ] No hay data loss entre sesiones

### Para Release v1.0 (Iteración 1-8)
- [ ] Todas las features core implementadas
- [ ] Performance optimizada
- [ ] Documentación completa
- [ ] Extension publicable en marketplace
- [ ] Feedback de usuarios beta incorporado

---

## 🔧 CONFIGURACIÓN DE DESARROLLO

### Prerrequisitos
```bash
- Node.js 18+
- VS Code 1.74+
- TypeScript 5.0+
- Git
```

### Setup Inicial (Iteración 0)
```bash
# 1. Crear proyecto
mkdir claude-context-manager
cd claude-context-manager

# 2. Inicializar
npm init -y
npm install -D @types/vscode @types/node typescript webpack webpack-cli ts-loader

# 3. Configurar TypeScript
npx tsc --init

# 4. Configurar package.json según especificación
# 5. Crear src/extension.ts básico
# 6. Test en VS Code Extension Host
```

### Scripts de Desarrollo
```json
{
  "scripts": {
    "vscode:prepublish": "npm run package",
    "compile": "webpack",
    "watch": "webpack --watch",
    "package": "webpack --mode production --devtool hidden-source-map",
    "compile-tests": "tsc -p . --outDir out",
    "watch-tests": "tsc -p . -w --outDir out",
    "pretest": "npm run compile-tests && npm run compile && npm run lint",
    "lint": "eslint src --ext ts",
    "test": "node ./out/test/runTest.js"
  }
}
```

### Comandos de Testing por Iteración
```bash
# Iteración 0
npm run compile && code --extensionDevelopmentPath=. --new-window

# Iteración 1
npm run compile && code --extensionDevelopmentPath=. --new-window
# Test: Panel aparece en Explorer

# Iteración 2  
npm run compile && code --extensionDevelopmentPath=. --new-window
# Test: Hacer commit, verificar captura

# Iteración 3
npm run compile && code --extensionDevelopmentPath=. --new-window  
# Test: Cambiar agentes, verificar estado

# Iteración 4
npm run compile && code --extensionDevelopmentPath=. --new-window
# Test: Claude Code connection
```

---

## 📊 MÉTRICAS POR ITERACIÓN

### Iteración 0
- **Setup Time**: < 30 minutos
- **Build Time**: < 10 segundos
- **Extension Size**: < 1MB

### Iteración 1
- **Panel Load Time**: < 500ms
- **Database Operations**: < 100ms
- **Memory Usage**: < 50MB

### Iteración 2
- **Git Detection Delay**: < 2 segundos
- **File Watch Accuracy**: > 95%
- **False Positives**: < 5%

### Iteración 3
- **UI Response Time**: < 200ms
- **Agent State Changes**: < 100ms
- **Configuration Persistence**: 100%

### Iteración 4
- **MCP Connection Time**: < 3 segundos
- **Tool Response Time**: < 1 segundo
- **Config Generation**: < 5 segundos

---

## 🎯 CHECKLIST DE CALIDAD

### Pre-commit (Cada Iteración)
- [ ] `npm run compile` sin errores
- [ ] `npm run lint` sin warnings críticos
- [ ] Extension se activa correctamente
- [ ] No hay console.error en runtime
- [ ] Features principales funcionan

### Pre-release (Cada Epic)
- [ ] Todas las historias completadas
- [ ] Performance dentro de límites
- [ ] No memory leaks detectados
- [ ] Compatible con VS Code stable
- [ ] Documentación actualizada

### Release Candidate
- [ ] Testing en múltiples OS
- [ ] Edge cases manejados
- [ ] Error handling robusto
- [ ] Backward compatibility
- [ ] Security review completo

---

Este master guide te permite desarrollar la extensión de forma completamente incremental, donde cada iteración produce una versión funcional que puede ser usada y testeada. ¿Te gustaría que comencemos con la Iteración 0 o hay algún aspecto específico que quieras que detalle más?