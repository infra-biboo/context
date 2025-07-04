# 📦 Instalación de Claude Context Manager

## 🎯 **Archivo VSIX Generado**

**Archivo**: `claude-context-manager-0.2.0.vsix`  
**Tamaño**: 656 KB  
**Versión**: 0.2.0  

## 🚀 **Métodos de Instalación**

### **Método 1: Desde VS Code (Recomendado)**

1. **Abrir VS Code**
2. **Ir a Extensions** (Ctrl+Shift+X / Cmd+Shift+X)
3. **Hacer click en los 3 puntos** (⋯) en la parte superior
4. **Seleccionar "Install from VSIX..."**
5. **Navegar y seleccionar**: `claude-context-manager-0.2.0.vsix`
6. **Hacer click en "Install"**
7. **Reiniciar VS Code** cuando se solicite

### **Método 2: Línea de Comandos**

```bash
# Instalar usando VS Code CLI
code --install-extension claude-context-manager-0.2.0.vsix

# O usando el path completo
code --install-extension /path/to/claude-context-manager-0.2.0.vsix
```

### **Método 3: Drag & Drop**

1. **Abrir VS Code**
2. **Arrastrar el archivo VSIX** hacia la ventana de VS Code
3. **Confirmar instalación**

## ✅ **Verificar Instalación**

Una vez instalado, deberías ver:

1. **Activity Bar**: Nuevo icono 🤖 "Claude Context Manager"
2. **Command Palette**: Comandos que empiecen con "Claude Context:"
3. **Panel lateral**: Al hacer click en el icono del robot

## 🔧 **Configuración Post-Instalación**

### **1. Verificar Panel**
- Click en el icono 🤖 en Activity Bar
- Deberías ver 3 pestañas: General, Agents, Search

### **2. Configurar Auto-Capture**
- En pestaña "General" → activar opciones deseadas:
  - ✅ Capture Git Commits
  - ✅ Monitor File Changes

### **3. Configurar Agentes**
- En pestaña "Agents" → seleccionar agentes activos:
  - 🏗️ Architect
  - ⚙️ Backend  
  - 🎨 Frontend

### **4. Generar Config MCP (Opcional)**
- En pestaña "General" → click "Generate Config"
- Para integración con Claude Code

## 🎯 **Funcionalidades Principales**

### **🏠 General**
- Estado del proyecto
- Configuración de auto-capture
- Integración MCP
- Contextos recientes

### **🤖 Agents**
- Gestión de agentes IA especializados
- Modos de colaboración
- Estado de activación

### **🔍 Search**
- Búsqueda avanzada de contextos
- Filtros por tipo y fecha
- Edición y eliminación
- Selección múltiple

## 📋 **Contenido del VSIX**

```
claude-context-manager-0.2.0.vsix (656 KB)
├── extension.js (420 KB) - Código principal
├── mcp-server.js (273 KB) - Servidor MCP
├── package.json - Manifest de extensión
├── CLAUDE.md - Configuración del proyecto
├── INSTALLATION.md - Guía de instalación
└── .claude/mcp.json - Config MCP ejemplo
```

## 🔒 **Información de Seguridad**

- ✅ **Código abierto**: Todo el código fuente disponible
- ✅ **Sin telemetría**: No envía datos externos
- ✅ **Local storage**: Datos almacenados localmente
- ✅ **Permisos mínimos**: Solo acceso a workspace

## 🐛 **Troubleshooting**

### **Error: "Cannot install extension"**
- Asegúrate de que VS Code esté actualizado (v1.74+)
- Cierra y vuelve a abrir VS Code
- Verifica permisos de escritura

### **Panel no aparece**
- Verifica que la extensión esté habilitada
- Recarga la ventana (Ctrl+R / Cmd+R)
- Check Activity Bar → puede estar colapsado

### **Errores en Output**
- Abre "Output" panel → selecciona "Claude Context Manager"
- Revisa logs para diagnóstico

## 🔄 **Actualización**

Para actualizar a una nueva versión:
1. Desinstalar versión anterior (opcional)
2. Instalar nuevo VSIX siguiendo pasos anteriores

## 📞 **Soporte**

**Issues**: Reportar problemas en el repositorio  
**Logs**: Panel Output → "Claude Context Manager"  
**Debug**: Usar modo Extension Development para debugging

---

**Version**: 0.2.0  
**Build**: Production optimizada  
**Fecha**: 2025-01-04  
**Estado**: ✅ Lista para producción