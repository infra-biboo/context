# Plan de Refactor: Sistema de Comandos ":" y Servidor MCP Unificado

## 🎯 Objetivo
Implementar sistema de comandos con ":" como activador y unificar servidores MCP con enrichment universal.

## 📋 Plan de Implementación

### **Fase 1: Servidor MCP Unificado**

#### **1.1 Eliminar standalone-server.ts**
- Borrar `/src/mcp/standalone-server.ts` 
- Ya no necesitamos implementación separada

#### **1.2 Refactorizar unified-mcp-server.ts**
- Renombrar a `/src/mcp/mcp-server.ts`
- Implementar detección de contexto (VS Code vs externo)
- Adaptar enrichment según contexto de ejecución

#### **1.3 Actualizar webpack.config.js**
- Cambiar entry point: `'mcp-server': './src/mcp/mcp-server.ts'`
- Eliminar referencias a standalone-server

### **Fase 2: Sistema de Comandos con ":"**

#### **2.1 Crear ColonCommandParser**
- Nuevo archivo: `/src/mcp/colon-command-parser.ts`
- Parser que detecta comandos con ":" como activador
- Soporte para: `context:`, `eureka:`, `search:`, `recent:`, `help:`

#### **2.2 Implementar herramienta cmd universal**
- En `mcp-server.ts` agregar herramienta `cmd`
- Handler que usa ColonCommandParser
- Reemplaza todas las herramientas existentes (`add_context`, etc.)

#### **2.3 Integrar con lógica eureka existente**
- Conectar `eureka:` con `MCPClient.enrichEurekaContext()`
- Mantener importancia 9/10 y prefijo "🎉 MOMENTO EUREKA"

### **Fase 3: Enrichment Universal Adaptativo**

#### **3.1 Crear StandaloneEnrichmentService**
- Nuevo archivo: `/src/mcp/standalone-enrichment-service.ts`
- Para modo externo (sin VS Code APIs)
- Configuración vía variables de entorno

#### **3.2 Detección de contexto automática**
```typescript
const hasVSCodeContext = typeof vscode !== 'undefined' && vscode.extensions;
if (hasVSCodeContext) {
  // Usar CascadeEnrichmentService completo
} else {
  // Usar StandaloneEnrichmentService
}
```

#### **3.3 Enrichment selectivo por origen**
- `auto-git`, `auto-capture`, `eureka` → ✅ Enriquecer
- `user-edited` → ❌ No enriquecer
- Preservar contenido original siempre

### **Fase 4: Actualizar Configuraciones MCP**

#### **4.1 Variables de entorno para modo externo**
```bash
WORKSPACE_PATH=/Users/biboo/.context-manager-ai
ENRICHMENT_API_KEY=sk-...
ENRICHMENT_PROVIDER=deepseek
ENRICHMENT_MODEL=deepseek-chat
```

#### **4.2 Actualizar autoApprove en Cline**
```json
"autoApprove": ["cmd", "get_context", "search_contexts"]
```

#### **4.3 Regenerar configuraciones**
- Claude Desktop: Usar nuevo servidor unificado
- Cline: Actualizar herramientas aprobadas

### **Fase 5: Testing y Validación**

#### **5.1 Compilación**
- `npm run compile` debe generar `mcp-server.js` unificado
- Verificar que no hay errores TypeScript

#### **5.2 Testing de comandos**
```bash
# Simular herramienta cmd con diferentes inputs
"context: authentication methods"  → Búsqueda
"eureka: Found the bug!"          → Momento eureka
"help:"                           → Mostrar ayuda
"context"                         → No hace nada
```

#### **5.3 Testing de enrichment**
- Modo VS Code: Cascade completo funcional
- Modo externo: API + Local funcional
- Fallbacks trabajando correctamente

## 🔧 Archivos a Modificar/Crear

### **Modificar:**
- `/src/mcp/unified-mcp-server.ts` → `/src/mcp/mcp-server.ts`
- `/webpack.config.js`
- `/src/mcp/config-generator.ts` (rutas de servidor)
- Configuraciones MCP (Claude Desktop, Cline)

### **Crear:**
- `/src/mcp/colon-command-parser.ts`
- `/src/mcp/standalone-enrichment-service.ts`

### **Eliminar:**
- `/src/mcp/standalone-server.ts`

## 🎯 Resultado Esperado

### **Una herramienta MCP universal:**
```
cmd(input: string) → Parsea comandos con ":" y ejecuta acción correspondiente
```

### **Comandos disponibles:**
- `context: query` → Buscar contextos
- `eureka: content` → Momento de descubrimiento
- `recent: number` → Contextos recientes
- `help:` → Ayuda

### **Enrichment universal:**
- VS Code: Claude MCP → API → Local
- Externo: API → Local
- Selectivo por origen de contexto

### **Base de datos única:**
- `~/.context-manager-ai/contexts.json`
- Consistente entre todas las herramientas

## 💡 Conceptos Clave

### **Sistema de Comandos con ":"**
- **`context`** → No hace nada (texto normal)
- **`context:`** → Ejecuta herramienta MCP
- **`eureka`** → No hace nada (texto normal)  
- **`eureka:`** → Ejecuta herramienta MCP

### **Detección de Contexto Automática**
```typescript
const hasVSCodeContext = typeof vscode !== 'undefined' && vscode.extensions;
```

### **Enrichment Selectivo**
- Automático: Git commits, file changes, eureka moments
- Manual: Ediciones directas del usuario preservadas intactas

### **Base de Datos Centralizada**
- Ubicación única: `~/.context-manager-ai/contexts.json`
- Acceso desde todas las herramientas (VS Code, Cline, Claude Desktop)
- Formato consistente y unificado