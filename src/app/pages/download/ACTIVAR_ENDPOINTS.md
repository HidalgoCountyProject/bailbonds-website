# Instrucciones para Activar los Endpoints Reales

## Estado Actual
El componente está usando datos de prueba para mostrar la funcionalidad mientras se desarrollan los endpoints del backend.

## Para Activar los Endpoints Reales

### 1. En `download.component.ts`

Busca y descomenta las siguientes secciones:

#### Para listar archivos (línea ~47):
```typescript
// Descomenta esto:
this.apiService.listFiles(this.uploadId).subscribe({
  next: (response: any) => {
    this.files = response.files || [];
    this.loading = false;
  },
  error: (error: any) => {
    console.error('Error loading files:', error);
    this.error = 'Error al cargar los archivos. Por favor, inténtalo de nuevo.';
    this.loading = false;
  }
});

// Y comenta o elimina esto:
setTimeout(() => {
  this.files = [
    // ... datos de prueba
  ];
  this.loading = false;
}, 1500);
```

#### Para descargar archivos (línea ~75):
```typescript
// Descomenta esto:
this.apiService.generateDownloadLink(this.uploadId, filename).subscribe({
  next: (response: any) => {
    if (response.downloadUrl) {
      window.open(response.downloadUrl, '_blank');
    } else {
      this.error = 'No se pudo generar el enlace de descarga';
    }
    this.downloadingFiles.delete(filename);
  },
  error: (error: any) => {
    console.error('Error generating download link:', error);
    this.error = 'Error al generar el enlace de descarga. Por favor, inténtalo de nuevo.';
    this.downloadingFiles.delete(filename);
  }
});

// Y comenta o elimina esto:
setTimeout(() => {
  console.log(`Simulando descarga de: ${filename}`);
  alert(`Descarga simulada de: ${filename}`);
  this.downloadingFiles.delete(filename);
}, 1000);
```

### 2. Verificar Endpoints

Asegúrate de que los siguientes endpoints estén funcionando:

#### Development:
- `https://mb7fqjqllj.execute-api.us-east-1.amazonaws.com/dev/list-files`
- `https://mb7fqjqllj.execute-api.us-east-1.amazonaws.com/dev/generate-download-link`

#### Production:
- `https://3rlvd3x9a3.execute-api.us-east-1.amazonaws.com/prod/list-files`
- `https://3rlvd3x9a3.execute-api.us-east-1.amazonaws.com/prod/generate-download-link`

### 3. Formato de Respuesta Esperado

#### Para listar archivos:
```json
{
  "files": [
    {
      "filename": "back-indemnitor.jpg",
      "size": 2457600,
      "lastModified": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### Para generar enlace de descarga:
```json
{
  "downloadUrl": "https://s3.amazonaws.com/bucket/file.pdf?signature=..."
}
```

### 4. Testing

Una vez activados los endpoints, puedes probar con URLs como:
```
https://hidalgo-bailbonds.com/download?uploadId=test-123
```

### 5. Eliminar Archivos de Prueba

Después de activar los endpoints, puedes eliminar:
- `ACTIVAR_ENDPOINTS.md` (este archivo)
- Los comentarios sobre datos de prueba en el componente 