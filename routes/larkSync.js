// New Lark Sync Workflow:
// 1. Import VMs from Lark → App Database
// 2. Analyze in App (gets logged to strategicCompassAnalysis)
// 3. Read scores from database
// 4. Update Lark with app's scores

import express from 'express';
const router = express.Router();
import db from '../db.js';

/**
 * POST /api/lark/import-and-sync
 * New workflow: Import from Lark → Use app's analysis → Update Lark
 */
router.post('/import-and-sync', async (req, res) => {
    try {
        console.log('🚀 Starting Lark VM import-and-sync workflow...');

        // Step 1: Import VMs from Lark into App Database
        const { fetchPendingVMs } = await import('../src/services/larkBitableService.js');
        const pendingVMs = await fetchPendingVMs();

        console.log(`📥 Found ${pendingVMs.length} pending VMs in Lark`);

        const imported = [];
        const needsAnalysis = [];

        for (const larkVM of pendingVMs) {
            // Extract data from Lark
            const metricNameRaw = larkVM.fields['Metric Name'];
            const metricName = Array.isArray(metricNameRaw)
                ? metricNameRaw.map(item => item.text || item).join(' ')
                : (metricNameRaw?.text || metricNameRaw || 'Unknown');

            const descriptionRaw = larkVM.fields['Description'];
            const description = Array.isArray(descriptionRaw)
                ? descriptionRaw.map(item => item.text || item).join(' ')
                : (descriptionRaw?.text || descriptionRaw || '');

            const picBURaw = larkVM.fields['PIC BU'];
            let buName = '';

            if (Array.isArray(picBURaw) && picBURaw.length > 0) {
                const rawBUs = picBURaw.map(bu => bu?.text || String(bu));
                // Parse any string arrays like "[BU1,BU2]"
                const buNames = [];
                for (const rawBU of rawBUs) {
                    if (typeof rawBU === 'string' && rawBU.startsWith('[') && rawBU.endsWith(']')) {
                        const parsed = rawBU.slice(1, -1).split(',').map(s => s.trim());
                        buNames.push(...parsed);
                    } else {
                        buNames.push(rawBU);
                    }
                }
                buName = buNames[0] || ''; // Use first BU
            }

            // Create VM ID from Lark record ID
            const vmId = `lark-${larkVM.record_id}`;

            // Check if already exists in app database
            const existing = db.prepare('SELECT id, strategicCompassAnalysis FROM vms WHERE id = ? OR larkRecordId = ?').get(vmId, larkVM.record_id);

            if (existing && existing.strategicCompassAnalysis) {
                // Already analyzed - add to update list
                console.log(`✅ VM already in database with analysis: ${metricName}`);
                imported.push({
                    vmId: existing.id,
                    larkRecordId: larkVM.record_id,
                    hasAnalysis: true
                });
            } else {
                // Import into database
                const stmt = db.prepare(`
                    INSERT OR REPLACE INTO vms 
                    (id, metricName, description, bu, selectedBU, selectedOKR, okrRationale, status, larkRecordId, createdAt, updatedAt)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `);

                stmt.run(
                    vmId,
                    metricName,
                    description,
                    buName,
                    buName, // selectedBU same as bu for now
                    '', // no specific OKR selected yet
                    '', // no rationale from Lark
                    'pending-analysis',
                    larkVM.record_id,
                    new Date().toISOString(),
                    new Date().toISOString()
                );

                console.log(`📥 Imported VM: ${metricName} (needs analysis)`);
                needsAnalysis.push({
                    vmId: vmId,
                    larkRecordId: larkVM.record_id,
                    metricName: metricName
                });
            }
        }

        // Step 2: Return list of VMs that need analysis
        const response = {
            imported: imported.length + needsAnalysis.length,
            alreadyAnalyzed: imported.length,
            needsAnalysis: needsAnalysis.length,
            vmsNeedingAnalysis: needsAnalysis.map(v => ({
                id: v.vmId,
                name: v.metricName,
                analyzeUrl: `http://localhost:5173/vm/${v.vmId}`
            }))
        };

        console.log(`✅ Import complete: ${response.imported} VMs imported, ${response.needsAnalysis} need analysis`);

        res.json(response);

    } catch (error) {
        console.error('❌ Lark import error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/lark/export-analyzed
 * Export analyzed VMs from app database back to Lark
 */
router.post('/export-analyzed', async (req, res) => {
    try {
        console.log('🚀 Starting Lark VM export workflow...');

        // Get all VMs with Lark record IDs that have been analyzed
        const analyzedVMs = db.prepare(`
            SELECT id, metricName, larkRecordId, strategicCompassAnalysis 
            FROM vms 
            WHERE larkRecordId IS NOT NULL 
            AND strategicCompassAnalysis IS NOT NULL
        `).all();

        console.log(`📤 Found ${analyzedVMs.length} analyzed VMs to export`);

        const { updateVMInLark } = await import('../src/services/larkBitableService.js');
        const results = [];
        const errors = [];

        for (const vm of analyzedVMs) {
            try {
                const analysis = JSON.parse(vm.strategicCompassAnalysis);
                const score = analysis.strategic_alignment?.score || 0;

                // Format insights and suggestions
                const insights = analysis.overall_insights || [];
                const suggestions = analysis.red_flags || [];

                const suggestionText = [
                    '📊 Insights:',
                    ...insights.map(i => `• ${i}`),
                    '',
                    '💡 Improvements:',
                    ...suggestions.map(s => `• ${s}`)
                ].join('\n');

                // Update Lark with app's score and analysis
                await updateVMInLark(vm.larkRecordId, {
                    'Austina Score': Number(score),
                    'AI Suggestion': suggestionText
                });

                console.log(`✅ Updated Lark: ${vm.metricName} (Score: ${score})`);
                results.push({
                    vm: vm.metricName,
                    score: score,
                    success: true
                });

            } catch (error) {
                console.error(`❌ Failed to update ${vm.metricName}:`, error.message);
                errors.push({
                    vm: vm.metricName,
                    error: error.message
                });
            }
        }

        res.json({
            success: true,
            exported: results.length,
            errors: errors.length,
            results,
            errors
        });

    } catch (error) {
        console.error('❌ Lark export error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
