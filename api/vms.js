// Vercel Serverless Function: GET/POST/DELETE /api/vms
// Replaces SQLite-backed VM endpoints in server.js
// VMs are stored/read from Lark Base (no local database needed)

const LARK_API_BASE = 'https://open.larksuite.com/open-apis';
const LARK_APP_ID = process.env.VITE_LARK_APP_ID || 'cli_a9d1efc6a2381ed4';
const LARK_APP_SECRET = process.env.VITE_LARK_APP_SECRET || 'wWL8cXBdwk2895DpQFNzBgSgrkT1kujN';
const BASE_ID = 'FUBhb3uUaa0h21suULgluANog8f';
const VM_TABLE_ID = 'tblz3uSEbkQGVXRq';

async function getTenantAccessToken() {
    const res = await fetch(`${LARK_API_BASE}/auth/v3/tenant_access_token/internal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app_id: LARK_APP_ID, app_secret: LARK_APP_SECRET })
    });
    const data = await res.json();
    if (data.code !== 0) throw new Error(`Lark auth failed: ${data.msg}`);
    return data.tenant_access_token;
}

function extractText(raw) {
    if (!raw) return '';
    if (Array.isArray(raw)) return raw.map(i => i.text || String(i)).join(' ');
    if (typeof raw === 'object') return raw.text || JSON.stringify(raw);
    return String(raw);
}

export default async function handler(req, res) {
    try {
        const token = await getTenantAccessToken();

        // ── GET: Fetch all VMs ──────────────────────────────────────────────
        if (req.method === 'GET') {
            const response = await fetch(
                `${LARK_API_BASE}/bitable/v1/apps/${BASE_ID}/tables/${VM_TABLE_ID}/records`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            const data = await response.json();
            if (data.code !== 0) throw new Error(`Fetch VMs failed: ${data.msg}`);

            const vms = (data.data?.items || []).map(item => ({
                id: item.record_id,
                metricName: extractText(item.fields['Metric Name']),
                description: extractText(item.fields['Description']),
                bu: extractText(item.fields['PIC BU']),
                status: extractText(item.fields['Status']),
                austinaScore: item.fields['Austina Score'] || null,
                aiSuggestion: item.fields['AI Suggestion'] || null,
                larkRecordId: item.record_id,
                createdAt: item.fields['Created At'] || new Date().toISOString(),
            }));

            return res.json(vms);
        }

        return res.status(405).json({ error: 'Method not allowed' });

    } catch (error) {
        console.error('VMs API error:', error);
        return res.status(500).json({ error: error.message });
    }
}
