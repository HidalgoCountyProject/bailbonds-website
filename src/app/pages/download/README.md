# Download Component

Este componente permite a los usuarios descargar documentos que fueron previamente subidos al sistema usando un `uploadId`.

## Funcionalidad

- **Lista archivos**: Consulta un endpoint para obtener la lista de archivos disponibles para un `uploadId` específico
- **Descarga archivos**: Genera enlaces de descarga temporales para cada archivo
- **Interfaz profesional**: Diseño moderno y responsivo que coincide con el estilo del sitio web
- **Estados de carga**: Maneja estados de carga, error y éxito de manera elegante

## Uso

### URL de acceso
```
https://hidalgo-bailbonds.com/download?uploadId=xxxxxx
```

### Parámetros
- `uploadId` (requerido): El ID de carga que identifica los documentos a descargar

### Endpoints utilizados

1. **Listar archivos**: `GET /api/list-files?uploadId={uploadId}`
   - Retorna: `{ files: [{ filename: string, size?: number, lastModified?: string }] }`

2. **Generar enlace de descarga**: `GET /api/generate-download-link?uploadId={uploadId}&filename={filename}`
   - Retorna: `{ downloadUrl: string }`

## Características

- **Lazy Loading**: El componente se carga solo cuando es necesario
- **Responsive Design**: Se adapta a diferentes tamaños de pantalla
- **Error Handling**: Manejo robusto de errores con opción de reintentar
- **Loading States**: Indicadores visuales durante las operaciones
- **File Icons**: Iconos específicos según el tipo de archivo
- **File Size**: Muestra el tamaño de los archivos cuando está disponible

## Estilos

El componente utiliza un diseño moderno con:
- Gradientes de fondo
- Efectos de glassmorphism
- Animaciones suaves
- Colores consistentes con el tema del sitio
- Tipografía clara y legible

## Dependencias

- Angular CommonModule
- Angular Router (ActivatedRoute)
- ApiService para las llamadas HTTP 