# Plan de Refactorización: Almacenamiento Global y Centralizado

**Objetivo:** Modificar la extensión para que utilice un único directorio de almacenamiento global (`~/.context-manager-ai`) en lugar de uno por proyecto (`.context-manager`). Esto resolverá los problemas de compatibilidad con múltiples ventanas de VS Code y la integración con herramientas externas como Claude Desktop, ofreciendo una experiencia "plug and play".

---

## Paso 1: Centralizar la Lógica de la Base de Datos (Backend)

### Archivo: `src/core/database.ts`

#### 1.1. Importar el módulo `os`
Añadir la importación del módulo `os` de Node.js para poder acceder al directorio de inicio del usuario de forma multiplataforma.

```typescript
import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os'; // <--- AÑADIR
// ...
```

#### 1.2. Reescribir la función `createDefaultConfig()`
Reemplazar completamente la función actual con una lógica simplificada que siempre apunte al directorio global.

**Código Anterior:**
```typescript
// Lógica compleja que revisa la configuración de VS Code, el workspace, etc.
```

**Código Nuevo:**
```typescript
private createDefaultConfig(): DatabaseConfig {
    // 1. Definir la ruta de almacenamiento global de forma multiplataforma.
    const globalStoragePath = path.join(os.homedir(), '.context-manager-ai');

    // 2. Definir la ruta completa del archivo de la base de datos.
    const dbPath = path.join(globalStoragePath, 'contexts.json');

    Logger.info(`Using centralized database path: ${dbPath}`);

    // 3. Devolver la configuración apuntando a la ruta centralizada.
    return {
        type: 'json',
        json: { path: dbPath, maxContexts: 1000 }
    };
}
```
*   **Resultado:** La base de datos siempre se buscará o se creará en `~/.context-manager-ai/contexts.json`, sin importar el proyecto que esté abierto.

---

## Paso 2: Eliminar Código Obsoleto

### Archivo: `package.json`

#### 2.1. Eliminar el Comando de Configuración
Quitar el comando `claude-context.selectContextDirectory` de la sección `contributes.commands`, ya que la selección manual ya no es necesaria.

**Eliminar este bloque:**
```json
{
    "command": "claude-context.selectContextDirectory",
    "title": "Claude Context: Select Context Directory"
}
```

#### 2.2. Eliminar la Propiedad de Configuración
Quitar la propiedad `claude-context.contextDirectory` de la sección `contributes.configuration`.

**Eliminar este bloque:**
```json
"claude-context.contextDirectory": {
    "type": "string",
    "default": "",
    "description": "Custom directory path for storing contexts (leave empty to use workspace/.context-manager)"
}
```

### Archivo: `src/extension.ts`

#### 2.3. Eliminar el Registro del Comando
En la función `activate`, encontrar y eliminar el bloque de código que registra el comando `claude-context.selectContextDirectory`.

**Eliminar este bloque:**
```typescript
context.subscriptions.push(
    vscode.commands.registerCommand('claude-context.selectContextDirectory', async () => {
        // ... toda la lógica para abrir el diálogo de selección de carpeta
    })
);
```

---

## Paso 3: Simplificar la Interfaz de Usuario (Frontend)

El objetivo es eliminar cualquier opción que confunda al usuario sobre dónde se guardan los datos.

### Archivo: `src/ui/webview/features/settings/SettingsTab.tsx`

#### 3.1. Eliminar Controles de Directorio
Buscar y eliminar cualquier componente de la interfaz de usuario que permita al usuario seleccionar o ver la ruta del directorio de la base de datos (por ejemplo, `DatabaseModeSelector` o `JsonConfigDisplay` si están relacionados con la ruta).

#### 3.2. (Opcional) Mostrar la Ruta Global
En su lugar, se puede añadir un texto informativo simple que indique dónde se almacenan los datos.

**Ejemplo en React/TSX:**
```tsx
const InfoCard = () => (
    <div>
        <h4>Ubicación de Datos</h4>
        <p>
            Tu contexto se guarda de forma centralizada en: 
            <strong>~/.context-manager-ai/</strong>
        </p>
    </div>
);
```

### Archivo: `src/ui/webview/features/onboarding/OnboardingWizard.tsx`

#### 3.3. Simplificar el Asistente de Bienvenida
Modificar el wizard para que ya no pida al usuario crear o seleccionar un contexto.

*   **Acción:** Reemplazar el paso `Step2_CreateContext.tsx` por un nuevo paso que simplemente informe al usuario sobre el almacenamiento centralizado.
*   **Contenido del nuevo paso:** "¡Todo listo! Tu gestor de contexto está configurado para guardar toda la información de manera centralizada en `~/.context-manager-ai`. Esto permite que funcione en todos tus proyectos y se integre con otras herramientas automáticamente."

---

## Paso 4: Asegurar la Integración con Herramientas Externas

### Archivo: `src/mcp/config-generator.ts` (y archivos similares)

#### 4.1. Actualizar Generadores de Configuración
Revisar cualquier función que genere archivos de configuración para Claude Desktop, Cline, etc.

*   **Acción:** Asegurarse de que estas funciones ahora usen la ruta global directamente, en lugar de intentar obtenerla de la configuración del workspace.

**Ejemplo de cambio:**
```typescript
// Antes
const contextDirectory = vscode.workspace.getConfiguration('claude-context').get('contextDirectory');
const mcpPath = contextDirectory ? path.join(contextDirectory, 'mcp.json') : '';

// Después
import * as os from 'os';
const globalPath = path.join(os.homedir(), '.context-manager-ai');
const mcpPath = path.join(globalPath, 'mcp.json');
```

Este plan garantiza una transición completa al modelo de almacenamiento centralizado, simplificando el código y creando una experiencia de usuario mucho más intuitiva y robusta.
