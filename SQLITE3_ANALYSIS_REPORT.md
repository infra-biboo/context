# 👽 **Análisis de Autopsia y Plan de Remediación: Fallo Crítico de SQLite3**

**Fecha**: 8 de Julio, 2025  
**Evaluación**: **FALLO CATASTRÓFICO DEL PROCESO.** La funcionalidad principal está rota en el 50% del mercado (Windows/Linux). El problema no es el código, sino una pipeline de build y empaquetado fundamentalmente defectuosa que genera artefactos rotos.

---

## **1. Resumen Ejecutivo sin Anestesia**

El informe original acierta en que el problema es el empaquetado, no los binarios. Sin embargo, subestima la gravedad de la situación.

*   **La Causa Raíz Real**: Nuestro proceso de build es una mentira. Genera un paquete VSIX que pasa las pruebas en macOS pero que está fundamentalmente roto para otras plataformas. Confiamos ciegamente en una configuración de Webpack y `vsce` que es inadecuada para dependencias nativas complejas.
*   **La "Estrategia 2" (Wrapper Personalizado) es un Callejón sin Salida**: Intentar replicar el wrapper de un módulo nativo (`createSQLiteWrapper`) es una receta para el desastre. Es una fuente inagotable de bugs, deuda técnica y un infierno de mantenimiento. **Esta estrategia debe ser eliminada, no "mejorada".**
*   **El Fallo Real**: Este error no fue detectado por nuestra CI, sino por los usuarios. Esto es una negligencia de proceso inaceptable. Un build que no se valida en todas las plataformas objetivo es un build fallido.

---

## **2. Análisis Técnico Forense**

### **Problema Central: Webpack y los Módulos Nativos (`.node`)**

La configuración actual en `webpack.config.js` es ingenua. Simplemente eliminar `@vscode/sqlite3` de `externals` y esperar que Webpack "haga lo correcto" es la causa del problema. Webpack no está diseñado para manejar módulos nativos de Node.js de forma nativa. Intenta "empaquetar" el código JavaScript, rompiendo las rutas relativas (`require('./sqlite3-binding')`) que el propio módulo necesita para cargar su binario (`.node`).

La declaración `bundledDependencies` en `package.json` debería, en teoría, instruir a `vsce` para que copie todo el módulo, pero es evidente que este mecanismo está fallando o entrando en conflicto con Webpack.

**La única solución robusta es tratar a `@vscode/sqlite3` como la plaga: no tocarlo, no empaquetarlo, y asegurarse de que se copie íntegramente en el VSIX.**

### **Por Qué el Wrapper Personalizado es una Terrible Idea**

El `createSQLiteWrapper` es un intento de reinventar la rueda, pero sin el conocimiento completo de la API original. Faltarán:
*   Manejo de tipos de datos sutiles.
*   Gestión de la concurrencia y el pool de conexiones.
*   Serialización de queries.
*   Manejo de errores y eventos específicos.

Invertir tiempo en "mejorar" este wrapper es tirar recursos a la basura.

---

## **3. El Único Camino a Seguir: Un Plan de Acción Decisivo**

Olvidemos los parches y las soluciones a medias. Este es el plan para arreglar esto de una vez por todas.

### **Fase 1: Aislamiento y Prueba de Concepto (2-3 horas)**

El objetivo es probar que `@vscode/sqlite3` puede funcionar en Windows en un entorno limpio, aislando el problema de nuestro complejo `webpack.config.js`.

1.  **Crear un "Laboratorio Limpio"**:
    *   Generar una extensión de VS Code completamente nueva y vacía (`yo code`).
    *   Añadir `@vscode/sqlite3` como única dependencia.
    *   En el `extension.ts` de esta nueva extensión, añadir una sola línea: `const sqlite3 = require('@vscode/sqlite3'); console.log(sqlite3);`
    *   Empaquetar (`vsce package`) y probar en Windows.
2.  **Ajustar el Laboratorio hasta que Funcione**:
    *   Lo más probable es que se necesite configurar Webpack para que ignore por completo el módulo. El uso de `webpack-node-externals` es un buen punto de partida.
    *   Puede que sea necesario usar `copy-webpack-plugin` para forzar la copia de `node_modules/@vscode/sqlite3` a la carpeta `dist` durante el build.
    *   El objetivo es encontrar la combinación de `webpack.config.js` y `package.json` que genere un VSIX funcional en Windows.

### **Fase 2: Implementación y Erradicación (2-4 horas)**

1.  **Aplicar la Configuración Ganadora**: Transferir la configuración de Webpack/`package.json` del "laboratorio limpio" a nuestro proyecto principal.
2.  **Eliminar el Código Muerto**: Borrar la función `createSQLiteWrapper` y toda la lógica asociada a la "Estrategia 2". No debe quedar rastro de ella. El `sqlite-adapter.ts` debe tener una única forma de obtener el módulo: `require('@vscode/sqlite3')`.
3.  **Añadir Verificación Explícita**: En el constructor de `SqliteAdapter`, añadir un bloque `try/catch` robusto alrededor del `require`. Si falla, el error debe ser explícito y fatal, indicando un fallo de empaquetado, y la extensión debe degradarse elegantemente al modo JSON si es posible.

### **Fase 3: Blindaje del Proceso de Build (3-5 horas)**

Para que esto no vuelva a ocurrir JAMÁS.

1.  **Modificar `.github/workflows/build.yml`**:
    *   Crear una matriz de build (`strategy.matrix`) para ejecutar los trabajos en `ubuntu-latest`, `windows-latest` y `macos-latest`.
2.  **Crear un Script de Validación de VSIX**:
    *   Crear un nuevo script en `package.json` llamado `"test:vsix"`.
    *   Este script (ej. `scripts/validate-vsix.js`) debe:
        1.  Descomprimir el VSIX generado (es un archivo zip).
        2.  Verificar que la carpeta `extension/node_modules/@vscode/sqlite3/lib` existe y contiene los archivos JS.
        3.  Verificar que el binario correcto para la plataforma actual existe (ej. `vscode-sqlite3-win32-x64.node` en Windows).
        4.  **Ejecutar un test de humo**: Lanzar un proceso de Node que intente hacer `require()` del módulo desde dentro de la estructura descomprimida. Si el `require` falla, el script debe salir con un código de error.
3.  **Integrar en la CI**:
    *   El workflow de GitHub debe ejecutar `npm run test:vsix` en cada plataforma después de `vsce package`. Si el script falla en CUALQUIER plataforma, todo el build de la CI debe fallar.

---

## **4. Métricas de Éxito (No Negociables)**

*   **Éxito Inmediato**: La extensión se instala y carga la base de datos SQLite sin errores en Windows, macOS y Linux.
*   **Éxito a Largo Plazo**: El pipeline de CI falla automáticamente si un cambio futuro rompe el empaquetado de dependencias nativas en CUALQUIER plataforma. No se vuelve a desplegar un VSIX roto.

---

## **🚨 Acciones Críticas Inmediatas**

1.  **AHORA MISMO**: Iniciar la **Fase 1**. Crear el laboratorio limpio para aislar el problema.
2.  **ALTA PRIORIDAD**: Una vez validada la solución, aplicarla al proyecto y **erradicar el wrapper personalizado**.
3.  **CRÍTICO**: Implementar la **Fase 3**. Blindar la CI es la única garantía de que esto no se repita.

Este informe es un mandato para actuar. La confianza en la calidad de nuestro producto está en juego.

**Fin del Análisis.**
