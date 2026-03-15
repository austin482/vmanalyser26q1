// Vercel Serverless Function: GET/POST/DELETE /api/okrs
// Replaces SQLite-backed OKR endpoints in server.js
// Parses row-based OKRs from Lark Base (matching the Wiki format)

const LARK_API_BASE = 'https://open.larksuite.com/open-apis';
const LARK_APP_ID = process.env.VITE_LARK_APP_ID || 'cli_a9eed0d5dcb89ed3';
const LARK_APP_SECRET = process.env.VITE_LARK_APP_SECRET || 'uwdb9LnnZbG66aPsP1hvReSGzNOzBZoZ';
const BASE_ID = 'FUBhb3uUaa0h21suULgluANog8f';
const OKR_TABLE_ID = process.env.LARK_OKR_TABLE_ID || 'tblOKRS';

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

        // ── GET: Fetch all OKRs and group them ─────────────────────────────────
        if (req.method === 'GET') {
            const response = await fetch(
                `${LARK_API_BASE}/bitable/v1/apps/${BASE_ID}/tables/${OKR_TABLE_ID}/records?page_size=500`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            const data = await response.json();
            if (data.code !== 0) throw new Error(`Fetch OKRs failed: ${data.msg}`);

            const rows = data.data?.items || [];

            // Map rows to structured objects
            const parsedRows = rows.map(item => ({
                id: item.record_id,
                buName: extractText(item.fields['BU Name']),
                quarter: extractText(item.fields['Quarter']),
                no: extractText(item.fields['No']).trim(),
                keyResultText: extractText(item.fields['Key Result']),
                pic: extractText(item.fields['PIC']),
                rowNumber: item.fields['Row Number'] || 999 // If you add a sort order column later
            }));

            // Grouping Logic:
            // 1. Group by BU Name + Quarter
            // 2. Look for "Obj X" to start a new objective
            // 3. Look for "KR X.Y" to add key results to the CURRENT objective

            const okrGroups = {}; // Key: "BU_Quarter_ObjX" -> Value: The structured OKR

            // First pass: Find all Objectives
            let currentBU = '';
            let currentQuarter = '';
            let currentObjId = '';

            // We assume rows are returned roughly in order. If not, we might need a sort field.
            // For now, we'll try to associate KRs by looking for the matching Obj prefix (e.g. KR 1.1 goes to Obj 1)

            parsedRows.forEach(row => {
                const bu = row.buName || currentBU;
                const quarter = row.quarter || currentQuarter;
                if (row.buName) currentBU = row.buName;
                if (row.quarter) currentQuarter = row.quarter;

                if (!bu) return; // Skip empty rows

                if (row.no.toLowerCase().startsWith('obj')) {
                    // This is an Objective row
                    const objNum = row.no.toLowerCase().replace('obj', '').trim(); // e.g., "1"
                    const groupKey = `${bu}_${quarter}_${objNum}`;
                    currentObjId = groupKey;

                    okrGroups[groupKey] = {
                        id: row.id,
                        buName: bu,
                        quarter: quarter,
                        objective: row.keyResultText, // The objective title is usually in the KR column
                        owners: row.pic,
                        keyResults: [],
                        createdAt: new Date().toISOString()
                    };
                } else if (row.no.toLowerCase().startsWith('kr')) {
                    // This is a KR row. Find its parent objective.
                    // E.g. "KR 1.1" -> Parent is Obj "1"
                    const match = row.no.match(/kr\s*(\d+)/i);
                    let targetObjKey = currentObjId; // Default to last seen objective

                    if (match && match[1]) {
                        const parentObjNum = match[1];
                        const specificKey = `${bu}_${quarter}_${parentObjNum}`;
                        if (okrGroups[specificKey]) {
                            targetObjKey = specificKey;
                        }
                    }

                    if (targetObjKey && okrGroups[targetObjKey]) {
                        // Extract metrics from bullet points in the text
                        const lines = row.keyResultText.split('\n').map(l => l.trim()).filter(Boolean);
                        const category = lines[0] || row.no; // Usually first line is title like "Good Result for Jobseeker"
                        const metrics = lines.slice(1).map(m => m.replace(/^[•\-\*]\s*/, '')); // Remove bullet points

                        okrGroups[targetObjKey].keyResults.push({
                            id: row.id,
                            krNumber: row.no, // E.g., "KR 1.1"
                            category: category,
                            pic: row.pic,
                            metrics: metrics.length > 0 ? metrics : [category]
                        });

                        // Append PICs to objective owners if not already there
                        if (row.pic && !okrGroups[targetObjKey].owners.includes(row.pic)) {
                            okrGroups[targetObjKey].owners += (okrGroups[targetObjKey].owners ? ', ' : '') + row.pic;
                        }
                    }
                }
            });

            // Convert map to array
            const finalOKRs = Object.values(okrGroups);

            return res.json(finalOKRs);
        }

        // POST/DELETE omitted for backend simplicity (Lark is the single source of truth now)
        // You edit OKRs directly in the Lark table, not via the app UI anymore.

        return res.status(405).json({ error: 'Method not allowed. Edit OKRs directly in Lark.' });

    } catch (error) {
        console.error('OKR API error:', error);
        return res.status(500).json({ error: error.message });
    }
}
