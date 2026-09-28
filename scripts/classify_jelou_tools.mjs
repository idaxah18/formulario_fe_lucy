import { readFileSync, writeFileSync } from 'fs';

const raw = readFileSync(new URL('./_tools_list.json', import.meta.url), 'utf8').replace(/^\uFEFF/, '');
const env = JSON.parse(raw);
const tools = env.data?.tools ?? [];

function classify(t) {
    const d = `${t.description ?? ''} ${t.name ?? ''}`.toLowerCase();
    if (d.includes('datum') || t.slug.includes('datum')) {
        return { api: 'Jelou Datum API (api.jelou.ai)', key: 'JELOU_API_TOKEN (Jelou Developers)' };
    }
    if (d.includes('jelou pay') || t.slug.includes('pay-') || d.includes('pasarela')) {
        return { api: 'Jelou Pay (payments.jelou.ai)', key: 'JELOU_PAY_BEARER + JELOU_PAY_APP_ID' };
    }
    if (d.includes('functions.jelou.ai') || t.slug === 'asistencia-en-curso') {
        return { api: 'Jelou Function gea-lucy/asistenciasEnCurso', key: 'GEA_JELOU_FUNCTION_USER + GEA_JELOU_FUNCTION_PASSWORD (Jelou Secrets)' };
    }
    if (t.slug.includes('aceptacion-lopdp') || d.includes('aceptar-terminos')) {
        return { api: 'GEA LOPDP POST …/aceptar-terminos', key: 'GEA_LOPDP_API_KEY (header api-key; Jelou Secret tool 2620)' };
    }
    if (t.slug.includes('giftpoint') || d.includes('giftpoint')) {
        return { api: 'GiftPoint (vía tool Auth GiftPoint)', key: 'Credencial en Jelou Secrets (no en webview .env)' };
    }
    if (d.includes('integrations.jelou.ai') || t.slug === 'lip-sync') {
        return { api: 'Jelou Integrations marketplace', key: 'Token integración en Jelou (no webview)' };
    }
    if (d.includes('jobs.01lab') || t.slug.includes('set-flow')) {
        return { api: 'Jelou Jobs / routing interno', key: 'Config Jelou plataforma' };
    }
    if (d.includes('speech') || d.includes('transcri') || t.slug.includes('speech-to-text')) {
        return { api: 'Jelou Speech-to-text (plataforma)', key: 'Suscripción Jelou / OpenAI en Jelou' };
    }
    if (d.includes('vision') || t.slug.includes('jelou-vision')) {
        return { api: 'Jelou Vision (OpenAI)', key: 'API key en Jelou marketplace' };
    }
    if (d.includes('dynamic email') || t.slug.includes('email')) {
        return { api: 'Jelou Utility Email', key: 'Config Jelou' };
    }
    if (d.includes('api.geainternacional.com') || t.slug.startsWith('auth') || d.includes('omniax') || d.includes('gea')) {
        return { api: 'GEA Omniax (api.geainternacional.com)', key: 'Bearer: GEA_OMNIAX_CLIENT_ID + GEA_OMNIAX_CLIENT_SECRET (tools Auth 1946 / Auth Gea 8505)' };
    }
    if (t.slug === 'auth' || t.slug === 'auth-gea') {
        return { api: 'GEA Omniax POST /v1/auth/token', key: 'GEA_OMNIAX_CLIENT_ID + GEA_OMNIAX_CLIENT_SECRET' };
    }
    if (t.slug === 'jelou-cedula-ecuatoriana') {
        return { api: 'Validación local Jelou (algoritmo cédula)', key: 'Ninguna (lógica en tool)' };
    }
    return { api: 'GEA Omniax u otro (revisar tool en Jelou)', key: 'GEA_OMNIAX_* o ver workflow tool' };
}

const rows = tools
    .sort((a, b) => a.id - b.id)
    .map((t) => {
        const c = classify(t);
        return {
            id: t.id,
            slug: t.slug,
            name: t.name?.trim(),
            published: t.published,
            ownership: t.ownership,
            purpose: (t.description ?? '').replace(/\s+/g, ' ').slice(0, 120) || '(sin descripción en catálogo)',
            api: c.api,
            apiKey: c.key,
        };
    });

const out = new URL('../docs/JELOU_TOOLS_CATALOG.md', import.meta.url);
writeFileSync(
    out,
    `# Catálogo tools — Lucy Ecuador (Jelou)\n\n**Proyecto (brain):** \`01j5661e5gaf6330435zh3bzjx\` — **Lucy Ecuador** (117 skills).\n\n**Catálogo org:** 98 tools (scopes SHARED + PURCHASED, perfil \`gea-ecuador\`). Los workflows del bot invocan subconjuntos de esta lista.\n\n> **Seguridad:** los valores reales de API keys viven en Jelou Secrets / \`.env\` del VPS, **no** en este repo.\n\n## Resumen por credencial\n\n| Credencial (webview \`.env\` o Jelou) | Tools típicas |\n|-------------------------------------|---------------|\n| \`GEA_OMNIAX_CLIENT_ID\` + \`GEA_OMNIAX_CLIENT_SECRET\` → Bearer | Auth 1946, Auth Gea 8505, y ~70 tools GEA/Omniax |\n| \`GEA_LOPDP_API_KEY\` (header api-key) | Aceptacion LOPDP 2620 |\n| \`GEA_JELOU_FUNCTION_USER\` + \`PASSWORD\` | Asistencia en Curso 2678 |\n| \`JELOU_API_TOKEN\` | Datum (Create/Update/Consulta términos) |\n| \`JELOU_PAY_BEARER\` + \`JELOU_PAY_APP_ID\` | Jelou Pay (links, pasarelas) |\n| Jelou plataforma (Speech, Vision, Email, Set Flow) | PURCHASED/FORKED utilities |\n| GiftPoint / Integrations marketplace | Secrets en Jelou Developers |\n\n## Listado completo\n\n| ID | Tool | Qué hace (resumen) | API / destino | API key / credencial |\n|----|------|-------------------|---------------|----------------------|\n${rows.map((r) => `| ${r.id} | ${r.name.replace(/\|/g, '/')} | ${r.purpose.replace(/\|/g, '/')} | ${r.api} | ${r.apiKey} |`).join('\n')}\n`,
);

console.log(`Wrote ${rows.length} tools to scripts/_tools_catalog.md`);
