import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './db.js';
import larkSyncRouter from './routes/larkSync.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: '.env.local' });

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Serve static files (HTML page)
app.use(express.static(__dirname));

// Use Lark Sync router
app.use('/api/lark', larkSyncRouter);

// ============================================
// DATABASE API ENDPOINTS
// ============================================

// GET all OKRs
app.get('/api/okrs', (req, res) => {
    try {
        const okrs = db.prepare('SELECT * FROM okrs ORDER BY createdAt DESC').all();
        // Parse keyResults JSON
        const parsedOKRs = okrs.map(okr => ({
            ...okr,
            keyResults: JSON.parse(okr.keyResults)
        }));
        res.json(parsedOKRs);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Failed to fetch OKRs' });
    }
});

// POST/PUT OKR (upsert by buName)
app.post('/api/okrs', (req, res) => {
    try {
        const { id, buName, quarter, objective, owners, keyResults, createdAt, updatedAt } = req.body;

        // Check if OKR with this buName exists
        const existing = db.prepare('SELECT id FROM okrs WHERE buName = ?').get(buName);

        if (existing) {
            // Update existing
            const stmt = db.prepare(`
                UPDATE okrs 
                SET quarter = ?, objective = ?, owners = ?, keyResults = ?, updatedAt = ?
                WHERE buName = ?
            `);
            stmt.run(quarter, objective, owners || '', JSON.stringify(keyResults), new Date().toISOString(), buName);
            res.json({ message: 'OKR updated', replaced: true, id: existing.id });
        } else {
            // Insert new
            const stmt = db.prepare(`
                INSERT INTO okrs (id, buName, quarter, objective, owners, keyResults, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `);
            const newId = id || `okr-${Date.now()}`;
            stmt.run(newId, buName, quarter, objective, owners || '', JSON.stringify(keyResults), createdAt || new Date().toISOString(), updatedAt || new Date().toISOString());
            res.json({ message: 'OKR created', replaced: false, id: newId });
        }
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Failed to save OKR' });
    }
});

// DELETE OKR
app.delete('/api/okrs/:id', (req, res) => {
    try {
        const { id } = req.params;
        const stmt = db.prepare('DELETE FROM okrs WHERE id = ?');
        stmt.run(id);
        res.json({ message: 'OKR deleted' });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Failed to delete OKR' });
    }
});

// GET all VMs
app.get('/api/vms', (req, res) => {
    try {
        const vms = db.prepare('SELECT * FROM vms ORDER BY createdAt DESC').all();
        // Parse JSON fields
        const parsedVMs = vms.map(vm => ({
            ...vm,
            strategicCompassAnalysis: vm.strategicCompassAnalysis ? JSON.parse(vm.strategicCompassAnalysis) : null,
            decisionMakerAnalysis: vm.decisionMakerAnalysis ? JSON.parse(vm.decisionMakerAnalysis) : null
        }));
        res.json(parsedVMs);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Failed to fetch VMs' });
    }
});

// POST/PUT VM
app.post('/api/vms', (req, res) => {
    try {
        const vm = req.body;

        // Check if VM exists
        const existing = db.prepare('SELECT id FROM vms WHERE id = ?').get(vm.id);

        if (existing) {
            // Update existing
            const stmt = db.prepare(`
                UPDATE vms 
                SET metricName = ?, description = ?, bu = ?, selectedBU = ?, selectedOKR = ?, 
                    okrRationale = ?, status = ?, strategicCompassAnalysis = ?, 
                    decisionMakerAnalysis = ?, larkRecordId = ?, updatedAt = ?
                WHERE id = ?
            `);
            stmt.run(
                vm.metricName, vm.description, vm.bu, vm.selectedBU || '', vm.selectedOKR || '',
                vm.okrRationale || '', vm.status,
                vm.strategicCompassAnalysis ? JSON.stringify(vm.strategicCompassAnalysis) : null,
                vm.decisionMakerAnalysis ? JSON.stringify(vm.decisionMakerAnalysis) : null,
                vm.larkRecordId || null,
                new Date().toISOString(), vm.id
            );
            res.json({ message: 'VM updated', id: vm.id });
        } else {
            // Insert new
            const stmt = db.prepare(`
                INSERT INTO vms (id, metricName, description, bu, selectedBU, selectedOKR, okrRationale, 
                                status, strategicCompassAnalysis, decisionMakerAnalysis, larkRecordId, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            stmt.run(
                vm.id, vm.metricName, vm.description, vm.bu, vm.selectedBU || '', vm.selectedOKR || '',
                vm.okrRationale || '', vm.status,
                vm.strategicCompassAnalysis ? JSON.stringify(vm.strategicCompassAnalysis) : null,
                vm.decisionMakerAnalysis ? JSON.stringify(vm.decisionMakerAnalysis) : null,
                vm.larkRecordId || null,
                vm.createdAt || new Date().toISOString(), new Date().toISOString()
            );
            res.json({ message: 'VM created', id: vm.id });
        }
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Failed to save VM' });
    }
});

// DELETE VM
app.delete('/api/vms/:id', (req, res) => {
    try {
        const { id } = req.params;
        const stmt = db.prepare('DELETE FROM vms WHERE id = ?');
        stmt.run(id);
        res.json({ message: 'VM deleted' });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Failed to delete VM' });
    }
});

// ============================================
// LARK API PROXY ENDPOINTS
// ============================================

// Lark API proxy endpoint
app.post('/api/lark/token', async (req, res) => {
    try {
        const response = await fetch('https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                app_id: process.env.VITE_LARK_APP_ID,
                app_secret: process.env.VITE_LARK_APP_SECRET,
            }),
        });

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Lark token error:', error);
        res.status(500).json({ error: 'Failed to get Lark token' });
    }
});

// Lark document fetch endpoint (for docx documents)
app.get('/api/lark/document/:docId', async (req, res) => {
    try {
        const { docId } = req.params;
        const { token } = req.query;

        const response = await fetch(`https://open.larksuite.com/open-apis/docx/v1/documents/${docId}/raw_content`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Lark document error:', error);
        res.status(500).json({ error: 'Failed to fetch Lark document' });
    }
});

// Lark Wiki node fetch endpoint (alternative for wiki documents)
app.get('/api/lark/wiki/:nodeToken', async (req, res) => {
    try {
        const { nodeToken } = req.params;
        const { token } = req.query;

        // First, get the node info to get the obj_token
        const nodeResponse = await fetch(`https://open.larksuite.com/open-apis/wiki/v2/spaces/get_node?token=${nodeToken}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        const nodeData = await nodeResponse.json();

        if (nodeData.code !== 0) {
            // If wiki API fails, try direct raw content approach
            const contentResponse = await fetch(`https://open.larksuite.com/open-apis/wiki/v2/spaces/${nodeToken}/nodes`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            const contentData = await contentResponse.json();
            return res.json(contentData);
        }

        res.json(nodeData);
    } catch (error) {
        console.error('Lark wiki error:', error);
        res.status(500).json({ error: 'Failed to fetch Lark wiki' });
    }
});

// ============================================
// LARK WEBHOOK ENDPOINT (for in-Lark button)
// ============================================

app.post('/api/lark/webhook', async (req, res) => {
    try {
        console.log('🔔 Webhook triggered from Lark automation');

        // Trigger the same sync logic
        const syncResponse = await fetch('http://localhost:3001/api/lark/sync-vms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        const syncData = await syncResponse.json();

        // Return simple response for Lark automation
        res.json({
            success: true,
            message: `Synced ${syncData.analyzed || 0} VMs`,
            data: syncData
        });
    } catch (error) {
        console.error('❌ Webhook error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ============================================
// LARK WEEKLY ANNOUNCEMENT ENDPOINT
// ============================================

app.post('/api/lark/weekly-announcement', async (req, res) => {
    try {
        const { weekToken } = req.body;
        console.log(`🔔 Weekly announcement triggered${weekToken ? ' for ' + weekToken : ''}`);

        const { generateWeeklyAnnouncement } = await import('./src/services/larkAnnouncementService.js');
        const result = await generateWeeklyAnnouncement(weekToken);

        res.json({
            success: true,
            message: result.sent ? 'Announcement sent to Lark' : 'Announcement generated (not sent)',
            data: result
        });
    } catch (error) {
        console.error('❌ Announcement error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ============================================
// LARK VM AUTO-ANALYSIS ENDPOINT
// ============================================

app.post('/api/lark/sync-vms', async (req, res) => {
    try {
        console.log('🚀 Starting Lark VM auto-analysis...');

        // Import the analyzer dynamically
        const { default: Database } = await import('better-sqlite3');
        const { fetchPendingVMs, updateVMInLark } = await import('./src/services/larkBitableService.js');
        const { analyzeComprehensive } = await import('./src/services/analyzer.js');

        // Load OKRs from database
        const dbInstance = new Database('./austina.db', { readonly: true });
        const okrs = dbInstance.prepare('SELECT * FROM okrs').all();
        const parsedOKRs = okrs.map(okr => ({
            id: okr.id,
            buName: okr.buName,
            quarter: okr.quarter,
            objective: okr.objective,
            keyResults: JSON.parse(okr.keyResults)
        }));
        dbInstance.close();

        console.log(`✅ Loaded ${parsedOKRs.length} OKRs from database`);

        // Fetch pending VMs from Lark
        const pendingVMs = await fetchPendingVMs();
        console.log(`📥 Found ${pendingVMs.length} pending VMs`);

        if (pendingVMs.length === 0) {
            return res.json({
                success: true,
                message: 'No pending VMs found',
                analyzed: 0
            });
        }

        const results = [];

        // Get BU field mapping (ID -> Name)
        const { getBUFieldMapping } = await import('./src/services/larkBitableService.js');
        const buMapping = await getBUFieldMapping();
        console.log('📋 BU Mapping:', buMapping);

        // Mock localStorage for analyzer.js (it expects OKRs in localStorage)
        global.localStorage = {
            getItem: (key) => {
                if (key === 'austina_okrs') {
                    return JSON.stringify(parsedOKRs);
                }
                return null;
            },
            setItem: () => { },
            removeItem: () => { },
            clear: () => { }
        };

        // Analyze each VM
        for (const vm of pendingVMs) {
            try {
                // Extract metric name - handle both string and object formats
                const metricNameRaw = vm.fields['Metric Name'];
                const metricName = Array.isArray(metricNameRaw)
                    ? metricNameRaw.map(item => item.text || item).join(' ')
                    : (metricNameRaw?.text || metricNameRaw || 'Unknown');
                // Extract description
                const descriptionRaw = vm.fields['Description'];
                const description = Array.isArray(descriptionRaw)
                    ? descriptionRaw.map(item => item.text || item).join(' ')
                    : (descriptionRaw?.text || descriptionRaw || '');
                const picBURaw = vm.fields['PIC BU'];
                let buNames = [];

                // Extract all BU names (handle single or multiple BUs)
                if (Array.isArray(picBURaw) && picBURaw.length > 0) {
                    // Real array - extract text from each element
                    const rawBUs = picBURaw.map(bu => bu?.text || String(bu));

                    // Parse any string arrays like "[BU1,BU2]"
                    buNames = [];
                    for (const rawBU of rawBUs) {
                        if (typeof rawBU === 'string' && rawBU.startsWith('[') && rawBU.endsWith(']')) {
                            const parsed = rawBU.slice(1, -1).split(',').map(s => s.trim());
                            buNames.push(...parsed);
                        } else {
                            buNames.push(rawBU);
                        }
                    }
                } else if (typeof picBURaw === 'object' && picBURaw !== null) {
                    // Single object
                    const buText = picBURaw.text || String(picBURaw);
                    // Check if it's a string that looks like an array "[BU1,BU2]"
                    if (buText.startsWith('[') && buText.endsWith(']')) {
                        buNames = buText.slice(1, -1).split(',').map(s => s.trim());
                    } else {
                        buNames = [buText];
                    }
                } else if (picBURaw) {
                    const buText = String(picBURaw);
                    // Check if it's a string that looks like an array "[BU1,BU2]"
                    if (buText.startsWith('[') && buText.endsWith(']')) {
                        buNames = buText.slice(1, -1).split(',').map(s => s.trim());
                    } else {
                        buNames = [buText];
                    }
                }

                // Clean up BU names (strip brackets like "[BU Name]")
                buNames = buNames.map(name => {
                    let cleaned = name.trim();
                    if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
                        cleaned = cleaned.slice(1, -1).trim();
                    }
                    return cleaned;
                });

                console.log(`🔍 Analyzing: ${metricName}`);
                console.log(`   BU(s): ${buNames.join(', ')}`);

                // Analyze against all BUs and get best score
                let bestAnalysis = null;
                let bestScore = 0;
                let bestBU = buNames[0] || '';

                for (const buName of buNames) {
                    try {
                        // Convert Lark VM to analyzer format
                        const vmForAnalyzer = {
                            metricName: metricName,
                            description: description || '',
                            bu: buName,
                            baselineRate: 0,
                            targetRate: 0,
                            minVolume: 0,
                            okrRationale: description || '',
                            selectedOKR: null
                        };

                        // Use existing analyzer.js - same workflow as mobile app!
                        const analysis = await analyzeComprehensive(vmForAnalyzer, buName);
                        const score = analysis.strategic_alignment?.score || analysis.finalScore || 0;

                        console.log(`   → ${buName}: ${score}/100`);

                        // Keep the best score (including 0)
                        if (score > bestScore || !bestAnalysis) {
                            bestScore = score;
                            bestAnalysis = analysis;
                            bestBU = buName;
                        }
                    } catch (error) {
                        console.warn(`   ⚠️ Failed to analyze against ${buName}:`, error.message);
                    }
                }

                if (!bestAnalysis) {
                    // Create a default analysis for score 0
                    bestAnalysis = {
                        gate: { status: "PASSED" },
                        strategic_alignment: { score: 0 },
                        overall_insights: ["No clear connection to any BU OKRs"],
                        red_flags: ["This VM does not align with current OKR priorities"]
                    };
                    bestScore = 0;
                    bestBU = buNames[0] || '';
                }

                console.log(`   ✅ Best match: ${bestBU} with score ${bestScore}/100`);
                const analysis = bestAnalysis

                // Extract score and insights from analysis
                const score = analysis.strategic_alignment?.score ||
                    analysis.finalScore ||
                    0;

                const insights = analysis.overall_insights ||
                    analysis.strengths ||
                    [];

                const suggestions = analysis.red_flags ||
                    analysis.concerns ||
                    [];

                // Format suggestion text
                let suggestionText;
                if (score === 0) {
                    // Simple message for unrelated VMs
                    suggestionText = '❌ Not under this BU KR';
                } else {
                    // Full analysis for related VMs
                    suggestionText = [
                        '📊 Insights:',
                        ...insights.map(i => `• ${i}`),
                        '',
                        '💡 Suggestions:',
                        ...suggestions.map(s => `• ${s}`)
                    ].join('\n');
                }

                // Update Lark
                await updateVMInLark(vm.record_id, {
                    'Austina Score': score, // Send as number, not string
                    'AI Suggestion': suggestionText
                });

                console.log(`✅ Updated: ${metricName} (Score: ${score})`);

                results.push({
                    metricName,
                    score,
                    success: true
                });

                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));

            } catch (error) {
                console.error(`❌ Failed to analyze VM:`, error);
                results.push({
                    metricName: vm.fields['Metric Name'],
                    error: error.message,
                    success: false
                });
            }
        }

        const successCount = results.filter(r => r.success).length;
        const avgScore = successCount > 0
            ? Math.round(results.filter(r => r.success).reduce((sum, r) => sum + r.score, 0) / successCount)
            : 0;

        res.json({
            success: true,
            message: `Analyzed ${successCount} of ${pendingVMs.length} VMs`,
            analyzed: successCount,
            failed: results.filter(r => !r.success).length,
            averageScore: avgScore,
            results: results
        });

    } catch (error) {
        console.error('❌ Lark sync error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Lark API proxy server running on http://localhost:${PORT}`);
    console.log(`📊 Database API available at http://localhost:${PORT}/api/okrs and /api/vms`);
});
