# Manifiesto de Refactorización del Frontend

## 1. Diagnóstico de la Auditoría Exhaustiva

Tras un análisis detallado de cada componente de la interfaz de usuario, incluyendo todas las pestañas principales (`General`, `Agents`, `Search`, `Settings`) y cada paso del flujo de `Onboarding`, se ha llegado a una conclusión definitiva y consistente.

### Fortalezas Identificadas:
*   **Arquitectura Sólida:** La aplicación posee una base arquitectónica excelente, con una clara separación de responsabilidades entre el backend de la extensión y el frontend del webview.
*   **Código de UI de Alta Calidad:** Los componentes de la interfaz, construidos con SolidJS, son de una calidad muy alta. Son declarativos, están bien compuestos y siguen las mejores prácticas del framework.
*   **Gestión de Estado Ejemplar:** El uso de un store centralizado con un flujo de datos unidireccional es impecable y proporciona una base predecible y mantenible para la UI.

### Debilidad Crítica Identificada:
La aplicación está siendo frenada por una única pero fundamental debilidad: el **protocolo de comunicación** entre el `ContextWebviewProvider` (backend) y el `AppController` (frontend).

## 2. Síntomas del Problema Central

Esta debilidad en la comunicación se manifiesta a través de varios síntomas en toda la aplicación:

*   **Ineficiencia en la Carga de Datos:** Acciones como eliminar un elemento o guardar un agente provocan una recarga completa de listas de datos enteras, en lugar de una actualización granular. Esto se observa en las pestañas `General`, `Agents` y `Search`.
*   **Complejidad Innecesaria en la Vista:** Componentes complejos como el `OnboardingWizard` se ven forzados a implementar lógica de manejo asíncrono (efectos, timeouts) para compensar la falta de un sistema de respuesta fiable.
*   **Actualizaciones "Optimistas":** Flujos como la creación del primer contexto en el onboarding avanzan al siguiente paso asumiendo que la operación fue exitosa, lo que puede llevar a estados inconsistentes si la operación falla.
*   **Experiencia de Usuario Degradada:** La falta de retroalimentación instantánea y las recargas completas pueden llevar a una experiencia de usuario lenta o con parpadeos, especialmente a medida que los datos crecen.
*   **Fragilidad y Mantenimiento:** El uso de múltiples formatos de mensajes inconsistentes aumenta la probabilidad de errores y hace que añadir nuevas funcionalidades sea más complejo de lo necesario.

## 3. El Plan de Refactorización: "Operación Flujo de Datos"

La solución no es reescribir los componentes de la UI, que ya son de alta calidad. La solución es **reconstruir las tuberías que les suministran los datos**.

El plan se centra en la creación de un **protocolo de comunicación estandarizado, granular y eficiente**.

### Paso 1: Definir un Contrato Estricto
Establecer interfaces `WebviewRequest` y `WebviewResponse` en un archivo de tipos compartido para garantizar que todos los mensajes sigan un formato predecible.

### Paso 2: Implementar Actualizaciones Granulares en el Store
Añadir nuevas acciones al `store.ts` para manejar cambios atómicos en el estado (ej. `addContext`, `removeContextById`, `updateAgent`).

### Paso 3: Simplificar el Frontend y el Backend
*   **`AppController` (Frontend):** Refactorizar para que envíe `WebviewRequest` y procese `WebviewResponse`, llamando a las nuevas acciones granulares del store.
*   **`ContextWebviewProvider` (Backend):** Eliminar la lógica compleja de respuesta y modificarla para que envíe mensajes granulares y estandarizados (ej. `CONTEXT_DELETED`) en lugar de listas de datos completas.

## 4. Beneficios Esperados

Esta refactorización transformará la aplicación, resultando en:

*   **Rendimiento Excepcional:** Una UI casi instantánea, sin recargas innecesarias.
*   **Robustez y Fiabilidad:** Se elimina una clase entera de posibles errores de comunicación y estado.
*   **Código Simplificado:** Se reduce drásticamente la complejidad en el `OnboardingWizard` y otros componentes.
*   **Mantenibilidad a Largo Plazo:** Añadir nuevas funcionalidades será más rápido y seguro.

Este manifiesto servirá como nuestra guía para la fase de implementación.
