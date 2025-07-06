# Plan de Implementación: Captura Inteligente "Eureka!"

Este documento detalla la arquitectura y los pasos necesarios para implementar la característica de captura de contexto inteligente, activada por la palabra clave `Eureka!`.

---

### **1. Análisis Arquitectónico y Flujo de Datos**

La implementación se basa en una colaboración cliente-servidor, donde el "cliente" es el entorno de chat del usuario (ej. Claude Desktop) y el "servidor" es nuestra extensión a través del protocolo MCP.

1.  **Detección (Cliente):** El usuario escribe `Eureka!` en el chat con Claude. El cliente (Claude Desktop) debe detectar esta palabra clave.

2.  **Generación del Resumen (Cliente -> LLM):** Al detectar la palabra clave, el cliente realiza una nueva llamada a la API de Claude (el LLM) con una "meta-instrucción". Envía el historial reciente del chat junto con un prompt específico para resumir la conversación.
    *   **Prompt de Ejemplo:** *"Basado en la conversación anterior, genera un resumen conciso y accionable de la decisión clave, el descubrimiento o la solución. Este resumen se guardará como una nota de contexto para referencia futura."*

3.  **Recepción del Resumen (LLM -> Cliente):** El cliente recibe el resumen generado por la IA.

4.  **Persistencia del Contexto (Cliente -> Servidor MCP):** El cliente se conecta a nuestro servidor MCP y llama a una nueva herramienta, `save_summarized_context`, pasándole el resumen generado como argumento.

5.  **Guardado en la Base de Datos (Servidor MCP -> Core):** Nuestro servidor MCP recibe la llamada, toma el resumen y utiliza el `ContextDatabase` para guardarlo como una nueva entrada de contexto, etiquetada automáticamente (ej. `eureka-capture`).

Este flujo delega correctamente las responsabilidades: el cliente gestiona la interacción, el LLM proporciona la inteligencia, y nuestra extensión maneja la persistencia.

---

### **2. Plan de Implementación Detallado**

#### **A. Requisitos del Cliente (Documentación)**

No podemos modificar el cliente (ej. Claude Desktop), pero debemos documentar sus responsabilidades en el `README.md` o en un nuevo archivo `INTEGRATION.md`.

*   **Responsabilidad:** Detectar la palabra clave `Eureka!`.
*   **Acción 1:** Construir un prompt de resumen y enviarlo al LLM con el historial de chat.
*   **Acción 2:** Al recibir el resumen, llamar a la herramienta `save_summarized_context` en nuestro servidor MCP.

#### **B. Refactorización del Servidor MCP**

*   **Archivo a Modificar:** `src/mcp/server.ts`
*   **Plan de Acción:**
    1.  Registrar una nueva herramienta en la clase `MCPServer`: `save_summarized_context`.
    2.  Definir el `inputSchema` de la herramienta para que acepte un único argumento: `summary: z.string()`.
    3.  Implementar el manejador de la herramienta para que llame a `this.database.addContext`.
    4.  El nuevo contexto debe tener valores predefinidos:
        *   `type`: `'decision'` (o `'conversation'`)
        *   `importance`: `7` (valor alto por defecto)
        *   `tags`: `['eureka-capture', 'ai-summarized']`

#### **C. Núcleo de la Extensión**

*   **Archivo a Modificar:** `src/core/database.ts`
*   **Plan de Acción:** Ninguno. La arquitectura actual es suficientemente robusta y el método `addContext` existente puede ser reutilizado sin cambios.

#### **D. Mejoras en la Interfaz de Usuario (UX)**

Para que el usuario reciba feedback visual de su acción.

*   **Archivos a Modificar:**
    1.  `src/ui/webview/features/search/SearchTab.tsx`
    2.  `src/ui/webview/style.css`
*   **Plan de Acción:**
    1.  **Diferenciar Visualmente:** En `SearchTab.tsx`, al renderizar la lista de contextos, añadir una clase CSS condicional (ej. `eureka-context`) a la tarjeta si el contexto incluye la etiqueta `eureka-capture`.
    2.  **Añadir un Icono:** Dentro de la misma lógica condicional, añadir un icono `💡` al encabezado de la tarjeta para una identificación rápida.
    3.  **Estilizar la Tarjeta:** En `style.css`, añadir estilos para la clase `.eureka-context` para que tenga un borde izquierdo de un color distintivo (ej. amarillo/dorado) y un fondo sutilmente diferente, haciéndola destacar del resto.
