# 🐛 DEBUG GUIDE - Claude Context Manager

## 🚀 Como Ejecutar en Modo Desarrollo

### 1. Preparar el entorno:
```bash
npm run watch  # Webpack en modo watch (auto-recompila)
```

### 2. Abrir VS Code para desarrollo:
```bash
# En VS Code, presiona F5 o:
# Go to Run and Debug (Ctrl+Shift+D)
# Select "Extension" configuration 
# Press F5 or click play button
```

### 3. Ver logs en tiempo real:
- **Extension Host Console**: `Help > Toggle Developer Tools > Console`
- **Webview Console**: `Right-click webview > Inspect Element > Console`

## 🔍 Debugging Points Añadidos

### Backend (Extension Host):
- `📨 Received message from webview:` - Mensajes desde webview
- `🗑️ Deleting context:` - Cuando se intenta eliminar
- `✅ Context deleted successfully` - Eliminación exitosa
- `❌ Error deleting context:` - Errores de eliminación

### Frontend (Webview):
- `🗑️ deleteContextById called with:` - Función delete llamada
- `📤 Sending delete message:` - Mensaje enviado al backend
- `📋 Loading all contexts for search tab` - Carga inicial
- `📤 Sending search message:` - Búsquedas enviadas

## 🧪 Pasos de Debug Recomendados

### 1. Verificar carga inicial:
- Abrir pestaña Search
- Buscar en console: `📋 Loading all contexts`
- Verificar que se envía: `📤 Sending search message`
- Verificar respuesta: `📨 Received message from webview: searchResults`

### 2. Debug eliminación individual:
- Click en botón 🗑️ 
- Buscar en console: `🗑️ deleteContextById called with:`
- Verificar mensaje enviado: `📤 Sending delete message:`
- Verificar recepción backend: `📨 Received message from webview: deleteContext`
- Verificar eliminación: `🗑️ Deleting context:` → `✅ Context deleted successfully`

### 3. Debug selección masiva:
- Marcar checkboxes
- Click "Delete X"
- Similar flow pero con `deleteMultipleContexts`

## 🛠️ Common Issues

### Si no se ven logs:
1. Asegúrate de tener Developer Tools abierto
2. Verifica que webpack está en watch mode
3. Recarga la extensión (Ctrl+R en Extension Development Host)

### Si los botones no responden:
1. Inspecciona elemento del botón
2. Verifica que onclick está presente
3. Checa errores JavaScript en console

### Si la eliminación falla:
1. Verifica que el contextId no es undefined
2. Checa permisos de archivos del storage
3. Verifica que la base de datos está inicializada