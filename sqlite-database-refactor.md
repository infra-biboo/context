# Plan de Refactorización: Migración de JSON a SQLite

**🎯 Objetivo:** Reemplazar la capa de persistencia de datos por defecto, de un archivo JSON a una base de datos SQLite. Esto aumentará la robustez, eliminará los riesgos de corrupción por concurrencia y sentará una base sólida para futuras funcionalidades. El refactor incluye la implementación de un puente de comunicación seguro entre el backend de la extensión y el frontend (WebView).

---

## 📋 Plan de Implementación

### **Fase 1: Reactivación y Configuración del Adaptador de SQLite (Backend)**

*El objetivo de esta fase es integrar el adaptador de SQLite en la lógica de negocio existente, sin modificar aún la interfaz de usuario.*

#### **1.1. Crear el Adaptador de SQLite**
- **Acción:** Crear el archivo `/src/core/database/adapters/sqlite-adapter.ts`.
- **Detalles:** La clase `SQLiteAdapter` implementará la interfaz `DatabaseAdapter`. Su implementación se basará en la lógica inferida de los tests existentes en `/src/core/database/__tests__/sqlite-adapter.test.ts`, utilizando la librería `sqlite3` para las operaciones de base de datos. Se definirán los esquemas de las tablas `contexts` y `agents`.

#### **1.2. Integrar el Adaptador en la Factoría de Base de Datos**
- **Acción:** Modificar el archivo `/src/core/database/database-factory.ts`.
- **Detalles:** Se añadirá un nuevo `case` al `switch` del método `create` para manejar el tipo `sqlite`. Este `case` instanciará y devolverá un nuevo `SQLiteAdapter`.

#### **1.3. Establecer SQLite como la Opción por Defecto**
- **Acción:** Modificar el archivo `/src/core/database.ts`.
- **Detalles:** Se actualizará el método `createDefaultConfig` para que devuelva una configuración de tipo `sqlite`, apuntando a un archivo `contexts.db` en el directorio global `~/.context-manager-ai/`. Esto convierte a SQLite en la base de datos por defecto para nuevas instalaciones.

---

### **Fase 2: Construcción del Puente de Comunicación Asíncrono (Backend ↔ Frontend)**

*Esta fase es crucial para resolver la incompatibilidad del WebView con los módulos nativos de Node.js como `sqlite3`.*

#### **2.1. Definir un Contrato de Mensajes**
- **Acción:** Crear o consolidar un archivo de tipos (ej. `/src/core/database/types.ts` o uno nuevo) para definir la estructura de los mensajes que se enviarán entre el WebView y el Extension Host.
- **Ejemplo:**
  ```typescript
  export type WebviewCommand = 'GET_CONTEXTS' | 'SAVE_CONTEXT' | 'DELETE_CONTEXT';
  export interface WebviewMessage {
    command: WebviewCommand;
    payload?: any;
  }
  ```

#### **2.2. Implementar el Manejador de Mensajes en el Backend**
- **Acción:** Modificar `/src/ui/webview-provider.ts`.
- **Detalles:** Se implementará un manejador `webview.onDidReceiveMessage`. Este actuará como un "API router" que escuchará las solicitudes del WebView. Al recibir un comando, ejecutará la operación correspondiente en la instancia de `ContextDatabase` (que ahora usará SQLite) y devolverá el resultado al WebView usando `webview.postMessage()`.

#### **2.3. Refactorizar el Puente de Comunicación en la UI**
- **Acción:** Modificar `/src/ui/webview/core/vscode-bridge.ts`.
- **Detalles:** Se refactorizará este archivo para que exporte funciones claras que encapsulen la lógica de `vscode.postMessage()`. Cada función corresponderá a una acción de la base de datos (ej. `requestAllContexts()`, `saveContext(data)`).

#### **2.4. Adaptar los Componentes de React**
- **Acción:** Actualizar todos los componentes de la UI (en `/src/ui/webview/`) que necesiten datos.
- **Detalles:** Se modificarán para que utilicen exclusivamente las funciones expuestas por el `vscode-bridge.ts` refactorizado, eliminando cualquier otro método de acceso a datos.

---

### **Fase 3: Migración de Datos y Validación Final**

#### **3.1. Revisar y Adaptar el Script de Migración**
- **Acción:** Analizar y, si es necesario, adaptar `/src/core/migration.ts`.
- **Detalles:** El script actual está diseñado para migrar de un `contexts.json` a una base de datos. Se debe asegurar que funcione correctamente con el nuevo `SQLiteAdapter` como destino.

#### **3.2. Compilación y Pruebas Unitarias**
- **Acción:** Ejecutar los comandos de build y test del proyecto.
- **Detalles:** Se correrá `npm run compile` para validar los cambios de TypeScript. Posteriormente, se ejecutarán los tests (`npm test` o similar) para asegurar que el `SQLiteAdapter` sigue pasando sus propias pruebas y que no se ha introducido ninguna regresión.

#### **3.3. Validación Funcional Manual**
- **Acción:** Iniciar la extensión en modo de desarrollo y realizar una prueba de extremo a extremo.
- **Detalles:**
  1. Verificar que la UI carga y muestra los contextos existentes (si los hay).
  2. Crear, editar y eliminar un contexto desde la UI.
  3. Confirmar que el archivo `~/.context-manager-ai/contexts.db` se crea y modifica correctamente en el sistema de archivos.
  4. Si existe un `contexts.json` antiguo, verificar que el proceso de migración se ejecuta al iniciar la extensión por primera vez.
