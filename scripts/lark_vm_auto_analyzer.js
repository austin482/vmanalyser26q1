#!/usr/bin/env node

// Lark VM Auto-Analyzer
// Fetches VMs from Lark, analyzes with existing analyzer.js, updates Lark with scores and suggestions

import { fetchPendingVMs, updateVMInLark, getTableSchema } from '../src/services/larkBitableService.js';
import { analyzeComprehensive } from '../src/services/analyzer.js';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get OKRs from database
 */
function getOKRsFromDatabase() {
    try {
        const dbPath = path.join(__dirname, '..', 'austina.db');
        const db = new Database(dbPath, { readonly: true });

        const okrs = db.prepare('SELECT * FROM okrs').all();

        // Parse the keyResults JSON
        const parsedOKRs = okrs.map(okr => ({
            id: okr.id,
            buName: okr.buName,
            quarter: okr.quarter,
            objective: okr.objective,
            keyResults: JSON.parse(okr.keyResults)
        }));

        db.close();
        console.log(`✅ Loaded ${parsedOKRs.length} OKRs from database`);
        return parsedOKRs;

    } catch (error) {
        console.warn('⚠️ Could not load OKRs from database:', error.message);
        return [];
    }
}

/**
 * Analyze a single VM using existing analyzer.js
 */
async function analyzeVM(vmData, allOKRs) {
    const metricName = vmData.fields['Metric Name'];
    const description = vmData.fields['Description'];

    // Handle PIC BU as array (Multiple Option field)
    const picBU = Array.isArray(vmData.fields['PIC BU'])
        ? vmData.fields['PIC BU'][0] // Take first BU
        : vmData.fields['PIC BU'];

    console.log(`\n🔍 Analyzing: ${metricName}`);
    console.log(`   BU: ${picBU}`);

    try {
        // Convert Lark VM data to format expected by analyzer
        const vmForAnalyzer = {
            metricName: metricName,
            description: description || '',
            bu: picBU,
            baselineRate: 0,
            targetRate: 0,
            minVolume: 0,
            okrRationale: description || ''
        };

        // Analyze against BU (without specific OKR - will analyze against all KRs in BU)
        const analysis = await analyzeComprehensive(vmForAnalyzer, picBU);

        // Extract score from analysis
        const score = analysis.strategic_alignment?.score || 0;

        // Format insights and suggestions
        const insights = analysis.overall_insights || [];
        const suggestions = analysis.red_flags || [];

        console.log(`✅ Score: ${score}`);

        return {
            score: score,
            insights: insights,
            suggestions: suggestions,
            analysis: analysis
        };

    } catch (error) {
        console.error('❌ Analysis failed:', error.message);
        console.error('Full error:', error);
        return {
            score: 0,
            insights: ['Analysis failed - please review manually'],
            suggestions: [`Error: ${error.message}`]
        };
    }
}

/**
 * Main automation function
 */
async function runAutoAnalysis() {
    console.log('🚀 Starting Lark VM Auto-Analysis...\n');
    console.log('='.repeat(60));

    try {
        // Step 1: Load OKRs from database
        console.log('\n📋 Step 1: Loading OKRs from database...');
        const allOKRs = getOKRsFromDatabase();

        // Step 2: Fetch table schema to verify field names (optional - skip if no permission)
        console.log('\n📋 Step 2: Fetching table schema...');
        try {
            const schema = await getTableSchema();
        } catch (error) {
            console.log('⚠️ Could not fetch schema (permission issue), continuing with known field names...');
        }

        // Step 3: Fetch pending VMs
        console.log('\n📥 Step 3: Fetching VMs from Lark...');
        const pendingVMs = await fetchPendingVMs();

        if (pendingVMs.length === 0) {
            console.log('✅ No pending VMs found. All done!');
            return;
        }

        console.log(`Found ${pendingVMs.length} VM(s) to analyze\n`);

        // Step 4: Analyze each VM
        console.log('🤖 Step 4: Analyzing VMs with AI...');
        const updates = [];

        for (const vm of pendingVMs) {
            const analysis = await analyzeVM(vm, allOKRs);

            // Format AI suggestion
            const suggestionText = [
                '📊 Insights:',
                ...analysis.insights.map(i => `• ${i}`),
                '',
                '💡 Suggestions:',
                ...analysis.suggestions.map(s => `• ${s}`)
            ].join('\n');

            updates.push({
                recordId: vm.record_id,
                fields: {
                    'Austina Score': analysis.score.toString(), // Convert to string for Text field
                    'AI Suggestion': suggestionText
                    // Status field NOT updated per user request
                },
                metricName: vm.fields['Metric Name'],
                score: analysis.score
            });

            // Rate limiting - wait 1 second between API calls
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Step 5: Update Lark with results
        console.log('\n📤 Step 5: Updating Lark with results...');

        for (const update of updates) {
            try {
                await updateVMInLark(update.recordId, update.fields);
                console.log(`✅ Updated: ${update.metricName} (Score: ${update.score})`);
            } catch (error) {
                console.error(`❌ Failed to update ${update.metricName}:`, error.message);
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log(`\n✅ Auto-analysis complete!`);
        console.log(`   Analyzed: ${updates.length} VMs`);
        if (updates.length > 0) {
            console.log(`   Average Score: ${Math.round(updates.reduce((sum, u) => sum + u.score, 0) / updates.length)}`);
        }

    } catch (error) {
        console.error('\n❌ Auto-analysis failed:', error);
        throw error;
    }
}

// Run the automation
runAutoAnalysis().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
