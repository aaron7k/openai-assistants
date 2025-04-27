const fs = require('fs');
const path = require('path');

// Función para buscar archivos de forma recursiva
function findFiles(dir, extension) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Recursivamente buscar en subdirectorios
      results = results.concat(findFiles(filePath, extension));
    } else if (path.extname(file) === extension) {
      results.push(filePath);
    }
  });
  
  return results;
}

// Buscar todos los archivos .tsx en el directorio de componentes
const componentsDir = path.join(__dirname, 'src', 'components');
const tsxFiles = findFiles(componentsDir, '.tsx');

// Verificar cada archivo
const missingNamedExports = [];

tsxFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  
  // Verificar si el archivo tiene React.FC
  if (content.includes('React.FC') || content.includes('React.ForwardRefRenderFunction')) {
    // Verificar si tiene export default pero no export nombrado
    if (content.includes('export default') && !content.includes('export {')) {
      const componentName = path.basename(file, '.tsx');
      missingNamedExports.push({
        file,
        componentName
      });
    }
  }
});

// Mostrar resultados
if (missingNamedExports.length === 0) {
  console.log('No se encontraron componentes sin exportaciones nombradas.');
} else {
  console.log('Componentes que necesitan exportaciones nombradas:');
  missingNamedExports.forEach(item => {
    console.log(`- ${item.componentName} (${item.file})`);
  });
}
