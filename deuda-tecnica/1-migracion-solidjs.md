# Deuda Técnica - Prioridad 4: Migración del Frontend a SolidJS

## Objetivo
Modernizar la arquitectura del frontend de la webview, reemplazando la manipulación manual del DOM por un framework declarativo y de alto rendimiento como SolidJS. Esta migración incluye la integración de la nueva arquitectura de base de datos (JSON + PostgreSQL) con capacidad de cambio dinámico de modo por parte del usuario.

## Problemas Actuales (Justificación)
- **Código Frágil y Propenso a Errores:** La construcción de la UI mediante la concatenación de strings HTML y la posterior manipulación con `getElementById` es una técnica anticuada, difícil de depurar y muy susceptible a errores.
- **Baja Reusabilidad y Mantenibilidad:** Es prácticamente imposible crear componentes de UI reutilizables, lo que conduce a la duplicación de código y a un acoplamiento fuerte entre la estructura (HTML), la presentación (CSS) y la lógica (JS).
- **Gestión de Estado Manual:** No existe un sistema de estado reactivo. La UI debe ser actualizada manualmente, un proceso que se vuelve exponencialmente más complejo y propenso a errores a medida que la aplicación crece.
- **Falta de Integración con la Nueva Arquitectura:** La UI actual no puede aprovechar la nueva arquitectura de base de datos dual (JSON/PostgreSQL) ni permitir al usuario seleccionar el modo de operación.

---

## Visión Arquitectural

La nueva aplicación será una Single Page Application (SPA) moderna, reactiva y basada en componentes, que permitirá al usuario cambiar dinámicamente entre:
- **Developer Mode (JSON):** Base de datos local con límite de contextos para desarrollo individual.
- **Team/Advanced Mode (PostgreSQL):** Base de datos remota o local PostgreSQL con capacidades avanzadas y búsqueda vectorial.

---

## Plan de Implementación Detallado

### Fase 1: Configuración del Entorno de Build

1.  **Añadir Dependencias de Desarrollo:**
    ```bash
    npm install solid-js
    npm install -D babel-loader @babel/core babel-preset-solid @babel/preset-typescript
    ```

2.  **Actualizar `webpack.config.js`:**
    - **En la sección de la Webview (`target: 'web'`):**
      - Cambiar el punto de entrada: `entry: { webview: './src/ui/webview/index.tsx' }`
      - Modificar `resolve.extensions` para incluir `.tsx`: `['.ts', '.js', '.tsx', '.jsx']`
      - Actualizar las reglas de `module.rules`:
        ```javascript
        {
          test: /\.(ts|tsx)$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'babel-loader',
              options: {
                presets: ['babel-preset-solid', '@babel/preset-typescript']
              }
            },
            { loader: 'ts-loader' }
          ]
        }
        ```

3.  **Configurar `tsconfig.json`:**
    - Añadir a `compilerOptions`:
      ```json
      {
        "jsx": "preserve",
        "jsxImportSource": "solid-js"
      }
      ```

4.  **Crear `babel.config.json`:**
    ```json
    {
      "presets": ["babel-preset-solid", "@babel/preset-typescript"]
    }
    ```

### Fase 2: Nueva Arquitectura del Frontend

1.  **Crear el Punto de Entrada (`index.tsx`):**
    - Crear `src/ui/webview/index.tsx`:
      ```tsx
      import { render } from 'solid-js/web';
      import App from './App';

      render(() => <App />, document.body);
      ```

2.  **Crear el Componente Raíz (`App.tsx`):**
    - Convertir `src/ui/webview/app.ts` en `src/ui/webview/App.tsx`
    - Implementar como componente funcional de SolidJS
    - Gestionar la estructura principal de pestañas y navegación

3.  **Gestión de Estado Centralizada (`store.ts`):**
    - Crear `src/ui/webview/core/store.ts` con Signals reactivos:
      ```tsx
      import { createSignal } from 'solid-js';
      import { DatabaseConfig } from '../../../core/database/types';

      // Estado de configuración de la base de datos
      export const [databaseConfig, setDatabaseConfig] = createSignal<DatabaseConfig>({
        type: 'json',
        json: { path: './context.json', maxContexts: 1000 }
      });

      // Estado de datos
      export const [contexts, setContexts] = createSignal([]);
      export const [agents, setAgents] = createSignal([]);
      export const [stats, setStats] = createSignal({});
      export const [connectionStatus, setConnectionStatus] = createSignal('connected');
      ```

4.  **Modernizar `VSCodeBridge`:**
    - Simplificar para que solo actualice los Signals del store
    - Eliminar métodos de actualización directa de DOM
    - Añadir métodos para gestionar cambios de configuración de base de datos

### Fase 3: Reconstrucción de la UI con Componentes

1.  **Nueva Pestaña de Configuración:**
    - Crear `src/ui/webview/features/settings/SettingsTab.tsx`
    - Implementar selector de modo con dos opciones:
      - **Developer Mode:** Mostrar información de JSON (ruta, límite)
      - **Team/Advanced Mode:** Formulario de conexión PostgreSQL
    - Validación de formularios y manejo de errores
    - Integración con el store para persistir configuración

2.  **Componentes de Configuración:**
    - `DatabaseModeSelector.tsx`: Radio buttons para seleccionar modo
    - `JsonConfigDisplay.tsx`: Información sobre configuración JSON actual
    - `PostgresConfigForm.tsx`: Formulario para datos de conexión PostgreSQL
    - `ConfigStatusCard.tsx`: Estado actual de la conexión de base de datos

3.  **Reconstruir Componentes Existentes:**
    - **Directorio `src/ui/webview/components/`:**
      - `StatusCard.tsx`: Componente reutilizable para tarjetas de estado
      - `Button.tsx`, `Input.tsx`, `Select.tsx`: Componentes de formulario
      - `LoadingSpinner.tsx`: Indicador de carga
      - `ErrorBoundary.tsx`: Manejo de errores globales

    - **Features existentes convertidas a componentes:**
      - `src/ui/webview/features/general/GeneralTab.tsx`
      - `src/ui/webview/features/agents/AgentsTab.tsx`
      - `src/ui/webview/features/search/SearchTab.tsx`

4.  **Ejemplo de Componente Reactivo:**
    ```tsx
    import { For } from 'solid-js';
    import { contexts } from '../../core/store';
    import ContextCard from '../components/ContextCard';

    function ContextList() {
      return (
        <div class="context-list">
          <h2>Contexts ({contexts().length})</h2>
          <For each={contexts()}>
            {(context) => <ContextCard context={context} />}
          </For>
        </div>
      );
    }
    ```

5.  **Estilos Modulares:**
    - Crear archivos `.module.css` para cada componente
    - Ejemplo: `SettingsTab.module.css`, `StatusCard.module.css`
    - Importar en componentes: `import styles from './Component.module.css';`

### Fase 4: Integración con Nueva Arquitectura de Base de Datos

1.  **Flujo de Cambio de Configuración:**
    - Usuario selecciona modo en `SettingsTab`
    - Componente valida y actualiza Signal de configuración
    - `VSCodeBridge` envía nueva configuración a extensión
    - Extensión reinicia con nuevo adaptador de base de datos
    - UI recibe confirmación y actualiza estado

2.  **Indicadores de Estado:**
    - Componentes que muestren el modo actual (JSON/PostgreSQL)
    - Indicadores de conexión y salud de la base de datos
    - Mensajes de error específicos por tipo de adaptador

3.  **Manejo de Límites:**
    - En modo JSON: mostrar progreso hacia el límite de contextos
    - En modo PostgreSQL: capacidad ilimitada, mostrar métricas avanzadas

---

## Estructura de Archivos Propuesta

```
src/ui/webview/
├── index.tsx                    # Punto de entrada
├── App.tsx                      # Componente raíz
├── core/
│   ├── store.ts                 # Estado global con Signals
│   ├── vscode-bridge.ts         # Comunicación con extensión (actualizado)
│   └── types.ts                 # Tipos específicos de UI
├── components/                  # Componentes reutilizables
│   ├── StatusCard.tsx
│   ├── Button.tsx
│   ├── LoadingSpinner.tsx
│   └── ...
├── features/
│   ├── settings/
│   │   ├── SettingsTab.tsx
│   │   ├── DatabaseModeSelector.tsx
│   │   ├── PostgresConfigForm.tsx
│   │   └── SettingsTab.module.css
│   ├── general/
│   │   ├── GeneralTab.tsx
│   │   └── GeneralTab.module.css
│   ├── agents/
│   │   ├── AgentsTab.tsx
│   │   └── AgentsTab.module.css
│   └── search/
│       ├── SearchTab.tsx
│       └── SearchTab.module.css
└── styles/
    ├── globals.css              # Estilos globales
    └── variables.css            # Variables CSS
```

---

## Criterios de Aceptación

### Configuración y Build
- [ ] `webpack.config.js`, `tsconfig.json` y `babel.config.json` configurados correctamente para SolidJS
- [ ] Compilación exitosa de archivos `.tsx` con JSX de SolidJS
- [ ] Hot reload funcional durante desarrollo

### Eliminación de Código Antiguo
- [ ] Eliminación completa de manipulación manual del DOM (`innerHTML`, `getElementById`, etc.)
- [ ] Todos los archivos en `src/ui/webview/features/` convertidos a componentes `.tsx`
- [ ] Eliminación de concatenación de strings HTML

### Reactividad y Estado
- [ ] UI completamente reactiva usando Signals de SolidJS
- [ ] Actualización automática cuando cambian los datos en el store
- [ ] Sin llamadas manuales de actualización de UI

### Arquitectura de Componentes
- [ ] UI organizada en componentes funcionales y reutilizables
- [ ] Separación clara entre lógica, presentación y estado
- [ ] Componentes con una sola responsabilidad

### Configuración de Base de Datos
- [ ] Pestaña de "Configuración" implementada en la UI
- [ ] Selector de modo: "Developer (JSON)" vs "Team/Advanced (PostgreSQL)"
- [ ] Formulario de configuración PostgreSQL con validación
- [ ] Guardado y aplicación correcta de configuración
- [ ] Reinicio automático de conexión de base de datos al cambiar configuración
- [ ] Indicadores de estado de conexión y tipo de adaptador actual

### Estilos y UX
- [ ] Estilos encapsulados con CSS Modules
- [ ] UI consistente y profesional
- [ ] Indicadores de carga y estados de error
- [ ] Experiencia de usuario fluida y intuitiva

### Rendimiento
- [ ] Aplicación igual o más rápida que la versión anterior
- [ ] Tiempos de carga optimizados
- [ ] Actualización eficiente de componentes específicos

---

## Notas de Implementación

1. **Migración Gradual:** Se recomienda migrar pestaña por pestaña, comenzando por la nueva pestaña de configuración.

2. **Testing:** Cada componente debe ser testeable de forma aislada. Considerar añadir tests unitarios con Vitest.

3. **Accesibilidad:** Mantener compatibilidad con lectores de pantalla y navegación por teclado.

4. **Compatibilidad:** Asegurar que funcione correctamente en el contexto de webview de VS Code.

Esta migración transformará completamente la experiencia de desarrollo y uso de la extensión, proporcionando una base sólida y moderna para futuras mejoras.
