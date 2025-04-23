const fs = require('fs');
const path = require('path');

// Cargar las variables de proceso
const environmentFile = process.env.NODE_ENV === 'production' 
  ? './src/environments/environment.prod.ts' 
  : './src/environments/environment.ts';

// Lee el archivo
let fileContent = fs.readFileSync(path.resolve(__dirname, '..', environmentFile), 'utf8');

// Reemplaza las variables
if (process.env.NODE_ENV === 'production') {
  fileContent = fileContent.replace(/\$\{API_KEY_PROD\}/g, process.env.API_KEY_PROD || '');
} else {
  fileContent = fileContent.replace(/\$\{API_KEY_DEV\}/g, process.env.API_KEY_DEV || '');
}

// Escribe el archivo actualizado
fs.writeFileSync(path.resolve(__dirname, '..', environmentFile), fileContent);

console.log(`Variables de entorno reemplazadas en ${environmentFile}`); 