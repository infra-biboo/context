# 📦 Claude Context Manager - Installation Guide

## 🚀 **Instalación desde VSIX**

### **Paso 1: Descargar el VSIX**
El archivo está listo: `claude-context-manager-0.2.0.vsix` (34.89 KB)

### **Paso 2: Instalar en VS Code**

#### **Opción A: Desde VS Code UI**
1. Abre **VS Code**
2. Ve a **Extensions** (Ctrl+Shift+X / Cmd+Shift+X)
3. Haz clic en los **"..."** (menú superior derecho)
4. Selecciona **"Install from VSIX..."**
5. Navega a: `/Users/biboo/Documents/Proyects/Context-Manager-AI/claude-context-manager-0.2.0.vsix`
6. Haz clic **"Install"**

#### **Opción B: Desde Terminal**
```bash
code --install-extension /Users/biboo/Documents/Proyects/Context-Manager-AI/claude-context-manager-0.2.0.vsix
```

### **Paso 3: Verificar Instalación**
1. **Reinicia VS Code** (importante)
2. Ve a **Extensions** y busca "Claude Context Manager"
3. Debería aparecer como **instalada**

### **Paso 4: Activar la Extensión**
1. **Reinicia VS Code** completamente
2. Busca el **icono del robot 🤖** en la **barra lateral izquierda**
3. **Haz clic en el icono** para abrir el panel
4. ¡Ya deberías ver la interfaz completa!

## 🎯 **¿Qué Deberías Ver?**

### **Panel "Claude Context" incluye:**

#### **🏠 Pestaña General:**
- **Project Status** - Información del proyecto y contador de contextos
- **Auto-Capture Settings** - Toggle para Git commits y File monitoring
- **Recent Contexts** - Lista de contextos capturados con timestamps

#### **🤖 Pestaña Agents (NUEVO!):**
- **AI Agents** - Selección de agentes especializados:
  - 🏗️ **Architect** - System design and architecture decisions
  - ⚙️ **Backend** - Server-side development and APIs  
  - 🎨 **Frontend** - User interface and experience
- **Agent Status** - Contador de agentes activos y modo de colaboración
- **Collaboration Mode** - Individual, Collaborative, Hierarchical

### **Comandos Disponibles** (Cmd+Shift+P):
- `Test Claude Context` - Comando básico de prueba
- `Open Claude Context Panel` - Abre el panel
- `Claude Context: Simulate Git Commit` - Simula commit
- `Claude Context: Simulate File Change` - Simula cambio de archivo

## 🧪 **Probar Funcionalidades**

### **1. Probar Git Integration**
```bash
# En terminal dentro del proyecto:
git add .
git commit -m "test: probar captura automática"
# ✅ Debería aparecer notificación y contexto en lista
```

### **2. Probar File Monitoring**
- Crea/modifica archivos .ts, .js, .py, .json
- ✅ Cambios importantes se capturan automáticamente

### **3. Probar Configuración**
- Haz toggle de las opciones de captura
- ✅ Estado se actualiza inmediatamente
- ✅ Configuración se guarda al reiniciar VS Code

## 🆘 **Troubleshooting**

### **Si no ves el panel:**
1. Asegúrate de tener **una carpeta abierta** en VS Code
2. Reinicia VS Code completamente
3. Ve a Extensions y verifica que esté instalada
4. Ejecuta comando `Test Claude Context` para verificar

### **Si hay errores:**
1. Abre **Help → Toggle Developer Tools**
2. Revisa la **Console** por errores
3. Reporta cualquier error encontrado

## ✅ **Versión Actual: 0.2.0**
- **Funcionalidades**: Git integration, File monitoring, Context storage, Agent Selection
- **Tamaño**: 34.89 KB
- **Nuevo**: Sistema de pestañas + Agentes especializados
- **Iteraciones**: 0, 1, 2, 3 completadas (4 de 8)
- **Próximo**: MCP Integration Basic (Iteración 4)