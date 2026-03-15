// Vercel Serverless Function: POST /api/lark/sync-vms
// Fetches pending VMs from Lark Base, scores them with AI, writes results back
// Replaces the heavy sync logic in server.js

const LARK_API_BASE = 'https://open.larksuite.com/open-apis';
const LARK_APP_ID = process.env.VITE_LARK_APP_ID || 'cli_a9d1efc6a2381ed4';
const LARK_APP_SECRET = process.env.VITE_LARK_APP_SECRET || 'wWL8cXBdwk2895DpQFNzBgSgrkT1kujN';
const BASE_ID = 'FUBhb3uUaa0h21suULgluANog8f';
const VM_TABLE_ID = 'tblz3uSEbkQGVXRq';
const OKR_TABLE_ID = process.env.LARK_OKR_TABLE_ID || 'tblOKRS'; // OKR table in Lark Base
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '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';

// ─── Lark Helpers ────────────────────────────────────────────────────────────

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

async function fetchRecords(token, tableId, filter = null) {
    let url = `${LARK_API_BASE}/bitable/v1/apps/${BASE_ID}/tables/${tableId}/records`;
    if (filter) url += `?filter=${encodeURIComponent(filter)}`;
    const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (data.code !== 0) throw new Error(`Fetch records failed: ${data.msg}`);
    return data.data?.items || [];
}

async function updateRecord(token, tableId, recordId, fields) {
    const res = await fetch(`${LARK_API_BASE}/bitable/v1/apps/${BASE_ID}/tables/${tableId}/records/${recordId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields })
    });
    const data = await res.json();
    if (data.code !== 0) throw new Error(`Update record failed: ${data.msg}`);
    return data;
}

// OKR Wiki token (from https://ajobthing.sg.larksuite.com/wiki/Pweqw1j8Ci7yGkkIghNlZxmogLf)
const OKR_WIKI_TOKEN = 'Pweqw1j8Ci7yGkkIghNlZxmogLf';

async function loadOKRsFromLark(token) {
    try {
        // Step 1: Resolve wiki token → real doc token
        const wikiRes = await fetch(
            `${LARK_API_BASE}/wiki/v2/spaces/get_node?token=${OKR_WIKI_TOKEN}`,
            { headers: { 'Authorization': `Bearer ${token}` } }
        );
        const wikiData = await wikiRes.json();
        if (wikiData.code !== 0) throw new Error(`Wiki node fetch failed: ${wikiData.msg}`);
        const docToken = wikiData.data?.node?.obj_token;
        if (!docToken) throw new Error('Could not resolve wiki token to doc token');
        console.log(`📄 Doc token: ${docToken}`);

        // Step 2: Fetch raw text content of the document
        const docRes = await fetch(
            `${LARK_API_BASE}/docx/v1/documents/${docToken}/raw_content`,
            { headers: { 'Authorization': `Bearer ${token}` } }
        );
        const docData = await docRes.json();
        if (docData.code !== 0) throw new Error(`Doc content fetch failed: ${docData.msg}`);
        const rawText = docData.data?.content || '';
        console.log(`📄 Got ${rawText.length} chars from wiki`);

        // Step 3: Parse the text into OKR groups
        // Actual format: each table cell is its own line (newline-delimited, not tab-separated)
        // "BU Name : JS Product - Application" → BU name
        // "Obj 1" → next non-empty line is the objective text
        // "KR 1.1" → next non-empty line is the KR text, then bullet metrics follow
        const lines = rawText.split('\n').map(l => l.trim());
        const SKIP = new Set(['No', 'Key Result', 'PIC', 'Projection', 'Ratio', 'Target']);
        const okrGroups = {};
        let currentBU = '', currentQuarter = '', currentObjKey = '';
        let currentObjCounter = 0, currentKRNo = '';
        let expectingObjText = false, expectingKRText = false;

        for (const line of lines) {
            if (!line || SKIP.has(line)) continue;

            if (/^BU\s*Name\s*[:\-]/i.test(line)) {
                currentBU = line.replace(/^BU\s*Name\s*[:\-]\s*/i, '').trim();
                currentObjCounter = 0; currentObjKey = '';
                expectingObjText = false; expectingKRText = false;
                console.log(`  📁 BU: ${currentBU}`);
                continue;
            }
            if (/^Quarter\s*:/i.test(line)) {
                currentQuarter = line.replace(/^Quarter\s*:\s*/i, '').trim();
                continue;
            }
            if (/^Obj\s*\d+$/i.test(line)) {
                currentObjCounter++;
                const key = `${currentBU}__${currentObjCounter}`;
                currentObjKey = key;
                okrGroups[key] = { buName: currentBU, quarter: currentQuarter, objective: '', keyResults: [] };
                expectingObjText = true; expectingKRText = false;
                continue;
            }
            if (expectingObjText && currentObjKey) {
                okrGroups[currentObjKey].objective = line;
                console.log(`    🎯 Obj ${currentObjCounter}: ${line.slice(0, 50)}`);
                expectingObjText = false;
                continue;
            }
            if (/^KR\s*\d+\.\d+/i.test(line) && currentObjKey) {
                currentKRNo = line;
                okrGroups[currentObjKey].keyResults.push({ category: '', metrics: [] });
                expectingKRText = true; expectingObjText = false;
                continue;
            }
            if (expectingKRText && currentObjKey) {
                const krs = okrGroups[currentObjKey].keyResults;
                if (krs.length > 0) {
                    krs[krs.length - 1].category = line;
                    krs[krs.length - 1].metrics = [line];
                    console.log(`      📌 ${currentKRNo}: ${line.slice(0, 40)}`);
                }
                expectingKRText = false;
                continue;
            }
            // Metric lines after a KR
            if (currentObjKey && !expectingObjText && !expectingKRText) {
                const krs = okrGroups[currentObjKey].keyResults;
                if (krs.length > 0) {
                    const words = line.split(' ');
                    const isLikelyPIC = words.length <= 2 && line.length < 25 && !line.includes('Number') && !line.startsWith('•') && !line.startsWith('-');
                    if (!isLikelyPIC) {
                        krs[krs.length - 1].metrics.push(line.replace(/^[•\-\*]\s*/, '').trim());
                    }
                }
            }
        }

        const result = Object.values(okrGroups).filter(o => o.buName && (o.keyResults.length > 0 || o.objective));
        console.log(`✅ Parsed ${result.length} OKR groups. BUs: ${[...new Set(result.map(o => o.buName))].join(', ')}`);
        return result;
    } catch (err) {
        console.error('❌ Failed to load OKRs from Wiki:', err.message);
        return [];
    }
}


// ─── AI Scoring ──────────────────────────────────────────────────────────────

async function scoreWithAI(vm, okrs, buName) {
    const targetBU = buName.trim().toLowerCase();
    const buOKRs = okrs.filter(o => o.buName.trim().toLowerCase() === targetBU);

    if (buOKRs.length === 0) {
        return {
            score: 0,
            insights: [`No OKRs found for Business Unit: ${buName}`],
            suggestions: ['Ensure OKRs are loaded for this BU']
        };
    }

    const allKRs = [];
    buOKRs.forEach(okr => {
        (okr.keyResults || []).forEach(kr => allKRs.push({ okr, kr }));
    });

    const krList = allKRs.map((item, idx) =>
        `${idx + 1}. [${item.okr.quarter}] ${item.kr.category || item.kr.title || JSON.stringify(item.kr)}: ${(item.kr.metrics || []).join(', ')} (Objective: ${item.okr.objective})`
    ).join('\n\n');

    const prompt = `Role: Strategic Advisor evaluating Value Metric (VM) alignment.
Task: Find the BEST matching KR for this VM and score the alignment.

CRITICAL SCORING RULES:
- Direct implementation of a KR metric: 80-100
- Clearly supports a KR but indirectly: 50-79
- Valid product improvement, loose KR connection: 10-49
- No logical connection to ANY KR: 0
- Use precise numbers (e.g. 81, 73, 67) — no rounding to 5s or 10s.

[VM]
Name: ${vm.metricName}
Description: ${vm.description}
BU: ${buName}

[AVAILABLE KRs in ${buName}]
${krList}

Output JSON only: { "score": <INT 0-100>, "best_kr_index": <1-based>, "insights": [strings], "suggestions": [strings] }`;

    const aiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'HTTP-Referer': 'https://austina.app',
            'X-Title': 'Austina VM Analyzer'
        },
        body: JSON.stringify({
            model: 'openai/gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 1000
        })
    });

    if (!aiRes.ok) throw new Error(`OpenRouter error: ${aiRes.status}`);
    const aiData = await aiRes.json();
    const text = aiData.choices[0].message.content;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in AI response');
    return JSON.parse(jsonMatch[0]);
}

// ─── Field Extraction Helpers ────────────────────────────────────────────────

function extractText(raw) {
    if (!raw) return '';
    if (Array.isArray(raw)) return raw.map(i => i.text || String(i)).join(' ');
    if (typeof raw === 'object') return raw.text || JSON.stringify(raw);
    return String(raw);
}

function extractBUs(picBURaw) {
    const rawText = extractText(picBURaw);
    if (!rawText) return [];
    // Handle "[BU1,BU2]" string format
    if (rawText.startsWith('[') && rawText.endsWith(']')) {
        return rawText.slice(1, -1).split(',').map(s => s.trim()).filter(Boolean);
    }
    return [rawText.trim()];
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('🚀 Starting Lark VM auto-analysis...');
        const token = await getTenantAccessToken();

        // Load OKRs from Lark Base OKR table
        const okrs = await loadOKRsFromLark(token);
        console.log(`✅ Loaded ${okrs.length} OKRs from Lark`);

        // Fetch pending VMs
        const pendingVMs = await fetchRecords(token, VM_TABLE_ID, 'CurrentValue.[Status]="Pending"');
        console.log(`📥 Found ${pendingVMs.length} pending VMs`);

        if (pendingVMs.length === 0) {
            return res.json({ success: true, message: 'No pending VMs found', analyzed: 0 });
        }

        const results = [];

        for (const vm of pendingVMs) {
            try {
                const metricName = extractText(vm.fields['Metric Name']) || 'Unknown';
                const description = extractText(vm.fields['Description']) || '';
                const buNames = extractBUs(vm.fields['PIC BU']);

                console.log(`🔍 Analyzing: ${metricName} | BU(s): ${buNames.join(', ')}`);

                let bestScore = 0;
                let bestResult = null;

                // Score against each BU, keep best
                for (const buName of (buNames.length ? buNames : [''])) {
                    try {
                        const result = await scoreWithAI({ metricName, description }, okrs, buName);
                        console.log(`   → ${buName}: ${result.score}/100`);
                        if (result.score > bestScore || !bestResult) {
                            bestScore = result.score;
                            bestResult = result;
                        }
                    } catch (err) {
                        console.warn(`   ⚠️ Failed for ${buName}:`, err.message);
                    }
                }

                if (!bestResult) {
                    bestResult = { score: 0, insights: ['Analysis failed'], suggestions: [] };
                    bestScore = 0;
                }

                // Format output for Lark
                let suggestionText;
                if (bestScore === 0) {
                    suggestionText = '❌ Not under this BU KR';
                } else {
                    suggestionText = [
                        '📊 Insights:',
                        ...(bestResult.insights || []).map(i => `• ${i}`),
                        '',
                        '💡 Suggestions:',
                        ...(bestResult.suggestions || []).map(s => `• ${s}`)
                    ].join('\n');
                }

                // Write result back to Lark
                await updateRecord(token, VM_TABLE_ID, vm.record_id, {
                    'Austina Score': bestScore,
                    'AI Suggestion': suggestionText
                });

                console.log(`✅ Updated: ${metricName} (Score: ${bestScore})`);
                results.push({ metricName, score: bestScore, success: true });

                // Rate limiting
                await new Promise(r => setTimeout(r, 1000));

            } catch (err) {
                console.error(`❌ Failed VM:`, err.message);
                results.push({ metricName: extractText(vm.fields['Metric Name']), error: err.message, success: false });
            }
        }

        const successCount = results.filter(r => r.success).length;
        const avgScore = successCount > 0
            ? Math.round(results.filter(r => r.success).reduce((s, r) => s + r.score, 0) / successCount)
            : 0;

        return res.json({
            success: true,
            message: `Analyzed ${successCount} of ${pendingVMs.length} VMs`,
            analyzed: successCount,
            failed: results.filter(r => !r.success).length,
            averageScore: avgScore,
            results
        });

    } catch (err) {
        console.error('❌ Sync error:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
}
