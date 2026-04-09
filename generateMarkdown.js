const fs = require('fs');
const data = JSON.parse(fs.readFileSync('c:/projetos/mesas_rpg_artificio/map_scratch.json', 'utf8'));

let md = `# Mapa Canônico da API (backend/src/routes) vs Frontend\n\n`;
md += `> **OBRIGATÓRIO:** Toda nova rota adicionada ou removida da API **deve** ser refletida neste documento. Agentes de IA estão proibidos de concluir tarefas de backend sem atualizar este arquivo.\n\n`;

const grouped = {};
data.backend.forEach(route => {
    if (!grouped[route.controller]) grouped[route.controller] = [];
    
    let isUsed = false;
    let frontFile = '-';
    
    // Very relaxed matching for finding usage
    const feCalls = data.frontend.filter(f => {
        const cleanFront = f.path.replace(/\$/g, '').replace(/\{.*\}/g, '').replace(/\?.*/, '');
        const cleanBack = `/api/v1/${route.controller}${route.path}`.replace(/:[^\/]+/g, '');
        return cleanFront.includes(cleanBack) || cleanBack.includes(cleanFront);
    });

    if (feCalls.length > 0) {
        isUsed = true;
        frontFile = [...new Set(feCalls.map(f => f.file))].join(', ');
    }

    if (route.controller === 'auth' && route.path === '/google') {
        isUsed = true;
        frontFile = 'LoginPage.tsx, SiteHeader.tsx';
    }

    grouped[route.controller].push({
        method: route.method,
        path: route.path,
        status: isUsed ? '✅ Em Uso' : '❌ Pendente/Front',
        frontFile: frontFile
    });
});

for (const controller in grouped) {
    md += `### ${controller.toUpperCase()} (\`routes/${controller}.ts\`)\n`;
    md += `| Metodo | Endpoint | Status | Chamado por (Frontend) |\n`;
    md += `|---|---|---|---|\n`;
    grouped[controller].forEach(r => {
        md += `| **${r.method}** | \`${r.path}\` | ${r.status} | ${r.frontFile} |\n`;
    });
    md += `\n`;
}

fs.writeFileSync('c:/projetos/mesas_rpg_artificio/MAPA_DE_API.md', md);
console.log("Arquivo MAPA_DE_API.md gerado com sucesso!");
