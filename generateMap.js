const fs = require('fs');
const path = require('path');

const backendDir = 'c:/projetos/mesas_rpg_artificio/backend/src/routes';
const frontendDir = 'c:/projetos/mesas_rpg_artificio/frontend/src';

function getFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      getFiles(path.join(dir, file), fileList);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(path.join(dir, file));
    }
  }
  return fileList;
}

const backendRoutes = [];
const backendFiles = getFiles(backendDir);
backendFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const routeRegex = /router\.(get|post|put|delete|patch)\(['"`](.*?)['"`]/g;
  let match;
  while ((match = routeRegex.exec(content)) !== null) {
    const rawPath = match[2];
    const controller = path.basename(file, '.ts');
    let prefix = `/api/v1/${controller}`;
    if (controller === 'me' || controller === 'systems' || controller === 'scenarios' || controller === 'tables' || controller === 'profile') {
        // they usually match their file name, except some special routing. We approximate.
    }
    
    backendRoutes.push({
      method: match[1].toUpperCase(),
      path: rawPath,
      controller: controller
    });
  }
});

const frontendCalls = [];
const frontendFiles = getFiles(frontendDir);
frontendFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, index) => {
      // Very naive capture of /api/v1/
      const apiV1Regex = /\/api\/v1\/([^'"\?`]+)/g;
      let match;
      while ((match = apiV1Regex.exec(line)) !== null) {
          frontendCalls.push({
              path: `/api/v1/${match[1]}`, // Reconstruct rough path
              file: path.basename(file)
          });
      }
  });
});

console.log("BACKEND ROUTES FOUND:", backendRoutes.length);
console.log("FRONTEND CALLS FOUND:", frontendCalls.length);

const output = { backend: backendRoutes, frontend: frontendCalls };
fs.writeFileSync('c:/projetos/mesas_rpg_artificio/map_scratch.json', JSON.stringify(output, null, 2));
