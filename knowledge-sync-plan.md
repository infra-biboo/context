# Plan de Implementación: Sincronizador de Documentación de Lenguajes

**Objetivo:** Replicar la funcionalidad de herramientas como Cursor para descargar, procesar e indexar la documentación oficial de lenguajes de programación. Esto creará una base de conocimiento local (Knowledge Base) que se usará para enriquecer el contexto de la IA (RAG), mejorando drásticamente su precisión y conocimiento del dominio.

---

### Paso 1: Crear el Servicio de Sincronización (Backend)

El núcleo de la funcionalidad. Será un servicio modular encargado de orquestar la obtención y procesamiento de la documentación.

*   **Nuevo Directorio:** `src/sync/`
*   **Nuevo Archivo:** `src/sync/doc-sync-service.ts`

#### 1.1. Clase Principal: `DocSyncService`

```typescript
// src/sync/doc-sync-service.ts

import { IDocSourceStrategy } from './strategies/base-strategy';
import { JavaScriptDocStrategy } from './strategies/javascript-strategy';

export class DocSyncService {
    private strategies: Map<string, IDocSourceStrategy> = new Map();

    constructor(private database: ContextDatabase) {
        this.registerStrategies();
    }

    private registerStrategies(): void {
        this.strategies.set('javascript', new JavaScriptDocStrategy());
        // Futuro: this.strategies.set('python', new PythonDocStrategy());
    }

    async sync(language: string): Promise<void> {
        const strategy = this.strategies.get(language);
        if (!strategy) {
            throw new Error(`No sync strategy found for language: ${language}`);
        }

        // 1. Obtener los datos en bruto
        const rawDocs = await strategy.fetch();

        // 2. Procesar y dividir en fragmentos (chunks)
        const chunks = await strategy.process(rawDocs);

        // 3. Convertir a vectores (embeddings) y guardar en la BD
        for (const chunk of chunks) {
            const embedding = await this.createEmbedding(chunk.content);
            await this.database.addKnowledge({
                language: language,
                source: chunk.source,
                content: chunk.content,
                embedding: embedding
            });
        }
    }

    private async createEmbedding(text: string): Promise<number[]> {
        // Lógica para llamar a un modelo de embeddings (local o API)
        return []; // Placeholder
    }
}
```

#### 1.2. Patrón de Estrategia para las Fuentes de Datos

*   **Nuevo Directorio:** `src/sync/strategies/`
*   **Archivos:**
    *   `base-strategy.ts`: Define la interfaz común.
    *   `javascript-strategy.ts`: Primera implementación (ej. scraping de MDN).

```typescript
// src/sync/strategies/base-strategy.ts
export interface DocChunk {
    source: string; // URL, etc.
    content: string;
}

export interface IDocSourceStrategy {
    fetch(): Promise<any>; // Devuelve datos en bruto (HTML, JSON, etc.)
    process(rawData: any): Promise<DocChunk[]>;
}
```

---

### Paso 2: Extender la Base de Datos (Backend)

Necesitamos un nuevo "almacén" para el conocimiento, separado del contexto del usuario.

*   **Archivo a Modificar:** `src/core/database/types.ts`

```typescript
// ... otras interfaces

export interface KnowledgeEntry {
  id: string;
  language: string;
  source: string; // URL o ruta del archivo de origen
  content: string; // El chunk de texto
  embedding: number[]; // El vector semántico
}

// Modificar la estructura del JSON
export interface JSONDatabase {
  contexts: ContextEntry[];
  agents: DatabaseAgent[];
  knowledge: KnowledgeEntry[]; // <--- AÑADIR
  metadata: { /*...*/ };
}
```

*   **Archivo a Modificar:** `src/core/database/adapters/json-adapter.ts`
    *   Añadir nuevos métodos: `addKnowledge()`, `searchKnowledge()`, `clearKnowledge()`. `searchKnowledge` realizará una búsqueda de similitud de cosenos entre el vector de la consulta y los vectores de los chunks almacenados.

---

### Paso 3: Crear la Interfaz de Usuario (Frontend)

Una nueva pestaña en la interfaz para gestionar la sincronización.

*   **Nuevo Directorio:** `src/ui/webview/features/knowledge/`
*   **Nuevo Archivo:** `src/ui/webview/features/knowledge/KnowledgeTab.tsx`

#### Funcionalidad del Componente:
1.  **Listar Lenguajes:** Mostrará "JavaScript", "Python", etc.
2.  **Botón de Sincronización:** Un botón "Sincronizar" para cada lenguaje.
3.  **Estado:** Mostrará el estado (`No sincronizado`, `Sincronizado el [fecha]`, `Sincronizando...`).
4.  **Estadísticas:** Mostrará cuántos "chunks" de conocimiento se han almacenado por lenguaje.
5.  **Botón de Borrado:** Permitirá al usuario eliminar el conocimiento de un lenguaje para forzar una resincronización.

---

### Paso 4: Integración y Flujo de Trabajo Final

Conectar todas las piezas para que funcionen juntas.

1.  **Registrar Nuevo Comando:**
    *   **Archivo:** `src/extension.ts`
    *   **Comando:** `claude-context.syncKnowledge`
    *   **Acción:** Este comando, llamado desde el frontend, instanciará `DocSyncService` y ejecutará `sync(language)`.

2.  **Modificar el Flujo de Generación de Prompts:**
    *   **Ubicación:** Donde sea que se construya la consulta a la IA (probablemente dentro de `AgentManager` o una clase similar).
    *   **Nueva Lógica:**
        1.  Antes de enviar la pregunta del usuario a la IA, detectar el lenguaje del archivo activo.
        2.  Convertir la pregunta del usuario (y/o el código circundante) en un vector de embedding.
        3.  Ejecutar `database.searchKnowledge(queryVector, language, 5)` para obtener los 5 chunks de documentación más relevantes.
        4.  Formatear estos chunks y añadirlos a un bloque `<documentation>` dentro del prompt del sistema.

**Ejemplo de Prompt Modificado:**
```xml
<system_prompt>
Aquí está el contexto de tu proyecto:
<project_context>
... (contexto del usuario)
</project_context>

Aquí hay documentación relevante para la pregunta del usuario:
<documentation>
**Función: Array.prototype.map()**
El método map() crea un nuevo array con los resultados de la llamada a la función indicada aplicados a cada uno de sus elementos.

**Función: Array.prototype.filter()**
El método filter() crea un nuevo array con todos los elementos que cumplan la condición implementada por la función dada.
</documentation>

Ahora, responde a la siguiente pregunta.
</system_prompt>
```
